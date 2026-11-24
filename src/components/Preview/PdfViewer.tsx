// Polyfill ReadableStream[Symbol.asyncIterator] for WebKit / Safari WKWebView
if (
  typeof ReadableStream !== 'undefined' &&
  !(Symbol.asyncIterator in ReadableStream.prototype)
) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] = function () {
    const reader = this.getReader();
    return {
      async next() {
        const { done, value } = await reader.read();
        if (done) {
          reader.releaseLock();
          return { done: true, value: undefined };
        }
        return { done: false, value };
      },
      async return() {
        await reader.cancel();
        reader.releaseLock();
        return { done: true, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  };
}

import React, { useState, useEffect, useMemo, Suspense, Component, ErrorInfo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useEditorStore } from '../../store/editorStore';
import PdfToolbar from './PdfToolbar';
import { FileText } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PdfErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PDF Viewer caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full text-text-muted gap-3 text-center p-8">
          <div className="text-[40px] mb-1">⚠️</div>
          <h3 className="text-[16px] font-semibold text-error">PDF Display Error</h3>
          <p className="text-[13px] text-text-muted max-w-[300px] leading-[1.5]">{this.state.error?.message || 'Failed to render PDF preview'}</p>
          <button
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry Preview
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PdfViewer: React.FC = () => {
  const { pdfData, compileStatus } = useEditorStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [elapsedCompileSec, setElapsedCompileSec] = useState<number>(0);

  useEffect(() => {
    if (compileStatus !== 'compiling') {
      setElapsedCompileSec(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedCompileSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [compileStatus]);

  const pdfFile = useMemo(() => {
    if (!pdfData) return null;
    return `data:application/pdf;base64,${pdfData}`;
  }, [pdfData]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setLoadError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('Failed to load PDF document:', err);
    setLoadError(err.message || 'Failed to parse PDF document');
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.3));
  const zoomFit = () => setScale(1.0);

  return (
    <div className="flex flex-col h-full bg-bg-desk">
      <PdfToolbar
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        onPageChange={setCurrentPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomFit={zoomFit}
      />

      <div className="flex-1 overflow-auto flex flex-col items-center relative py-6 px-4 pb-12">
        <PdfErrorBoundary>
          {/* Initial state before compilation */}
          {!pdfFile && compileStatus === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full w-full text-text-muted gap-3 text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-medium/60 shadow-xs flex items-center justify-center text-text-muted mb-1">
                <FileText size={28} strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-text-primary">No PDF Preview</h3>
              <p className="text-[13px] text-text-muted max-w-[300px] leading-[1.5]">Click <strong>Recompile</strong> to generate the PDF preview</p>
            </div>
          )}

          {/* Initial compilation when no previous PDF exists */}
          {compileStatus === 'compiling' && !pdfFile && (
            <div className="flex flex-col items-center justify-center h-full w-full text-text-muted gap-3 text-center p-8">
              <div className="compile-spinner" />
              <h3 className="text-[16px] font-semibold text-text-primary">
                {elapsedCompileSec >= 4 ? 'Setting up TeX engine…' : 'Compiling…'}
              </h3>
              <p className="text-[13px] text-text-muted max-w-[340px] leading-[1.5]">
                {elapsedCompileSec >= 4
                  ? 'First compilation downloads core LaTeX packages (~200MB) over your internet connection. This may take 30–60 seconds.'
                  : 'Generating your document'}
              </p>
              {elapsedCompileSec >= 5 && (
                <span className="text-[11.5px] font-mono text-text-brand bg-brand-green-light px-2.5 py-1 rounded-full mt-2">
                  Elapsed: {elapsedCompileSec}s
                </span>
              )}
            </div>
          )}

          {/* Recompilation floating indicator when PDF already exists */}
          {compileStatus === 'compiling' && pdfFile && (
            <div className="sticky top-3 z-50 flex items-center gap-2 bg-bg-surface/95 backdrop-blur-lg text-text-primary py-2 px-4.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.5)] border border-brand-green-border text-[13px] font-medium mb-4 animate-fade-in-down">
              <div className="compile-spinner-sm" />
              <span>
                {elapsedCompileSec >= 4
                  ? `Compiling & downloading packages… (${elapsedCompileSec}s)`
                  : 'Compiling document…'}
              </span>
            </div>
          )}

          {/* Compilation failed with no PDF to show */}
          {compileStatus === 'error' && !pdfFile && (
            <div className="flex flex-col items-center justify-center h-full w-full text-text-muted gap-3 text-center p-8">
              <div className="text-[40px] mb-1">⚠️</div>
              <h3 className="text-[16px] font-semibold text-error">Compilation Failed</h3>
              <p className="text-[13px] text-text-muted max-w-[300px] leading-[1.5]">Check the error panel below the editor for details</p>
            </div>
          )}

          {loadError && (
            <div className="flex flex-col items-center justify-center h-full w-full text-text-muted gap-3 text-center p-8">
              <div className="text-[40px] mb-1">⚠️</div>
              <h3 className="text-[16px] font-semibold text-error">Failed to Load PDF</h3>
              <p className="text-[13px] text-text-muted max-w-[300px] leading-[1.5]">{loadError}</p>
            </div>
          )}

          {pdfFile && !loadError && (
            <div
              className={`flex flex-col items-center gap-5 transition-opacity duration-200 ${
                compileStatus === 'compiling' ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center p-12">
                    <div className="compile-spinner" />
                  </div>
                }
              >
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center p-12">
                      <div className="compile-spinner" />
                    </div>
                  }
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div key={`page_${index + 1}`} className="shadow-paper rounded-sm bg-white overflow-hidden transition-transform duration-150">
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center p-12">
                            <div className="compile-spinner" />
                          </div>
                        }
                      >
                        <Page
                          pageNumber={index + 1}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </Suspense>
                    </div>
                  ))}
                </Document>
              </Suspense>
            </div>
          )}
        </PdfErrorBoundary>
      </div>
    </div>
  );
};

export default PdfViewer;
