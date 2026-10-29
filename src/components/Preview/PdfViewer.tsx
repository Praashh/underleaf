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

import React, { useState, useMemo, Suspense, Component, ErrorInfo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useEditorStore } from '../../store/editorStore';
import PdfToolbar from './PdfToolbar';
import './PdfViewer.css';

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
        <div className="pdf-placeholder error">
          <div className="placeholder-icon">⚠️</div>
          <h3>PDF Display Error</h3>
          <p>{this.state.error?.message || 'Failed to render PDF preview'}</p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '12px' }}
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
    <div className="pdf-viewer">
      <PdfToolbar
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        onPageChange={setCurrentPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomFit={zoomFit}
      />

      <div className="pdf-viewport">
        <PdfErrorBoundary>
          {/* Initial state before compilation */}
          {!pdfFile && compileStatus === 'idle' && (
            <div className="pdf-placeholder">
              <div className="placeholder-icon">📄</div>
              <h3>No PDF Preview</h3>
              <p>Click <strong>Recompile</strong> to generate the PDF preview</p>
            </div>
          )}

          {/* Initial compilation when no previous PDF exists */}
          {compileStatus === 'compiling' && !pdfFile && (
            <div className="pdf-placeholder">
              <div className="compile-spinner" />
              <h3>Compiling…</h3>
              <p>Generating your document</p>
            </div>
          )}

          {/* Recompilation floating indicator when PDF already exists */}
          {compileStatus === 'compiling' && pdfFile && (
            <div className="pdf-recompiling-pill">
              <div className="compile-spinner-sm" />
              <span>Compiling document…</span>
            </div>
          )}

          {/* Compilation failed with no PDF to show */}
          {compileStatus === 'error' && !pdfFile && (
            <div className="pdf-placeholder error">
              <div className="placeholder-icon">⚠️</div>
              <h3>Compilation Failed</h3>
              <p>Check the error panel below the editor for details</p>
            </div>
          )}

          {loadError && (
            <div className="pdf-placeholder error">
              <div className="placeholder-icon">⚠️</div>
              <h3>Failed to Load PDF</h3>
              <p>{loadError}</p>
            </div>
          )}

          {pdfFile && !loadError && (
            <div
              className={`pdf-document-wrapper ${
                compileStatus === 'compiling' ? 'is-compiling' : ''
              }`}
            >
              <Suspense
                fallback={
                  <div className="pdf-loading">
                    <div className="compile-spinner" />
                  </div>
                }
              >
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="pdf-loading">
                      <div className="compile-spinner" />
                    </div>
                  }
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div key={`page_${index + 1}`} className="pdf-page-wrapper">
                      <Suspense
                        fallback={
                          <div className="pdf-loading">
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
