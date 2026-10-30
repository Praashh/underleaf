import React, { useEffect, useCallback, useRef } from 'react';
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels';
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Clock,
} from 'lucide-react';
import LatexEditor from '../components/Editor/LatexEditor';
import VisualEditor from '../components/Editor/VisualEditor';
import EditorToolbar from '../components/Editor/EditorToolbar';
import PdfViewer from '../components/Preview/PdfViewer';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import {
  compileLatex,
  readProjectFile,
  saveProjectFile,
} from '../utils/tauri';
import { applyEditorAction, formatFallbackText } from '../utils/editorActions';
import { EditorView } from '@codemirror/view';

const EditorPage: React.FC = () => {
  const {
    content,
    setContent,
    compileStatus,
    setCompileStatus,
    setPdfData,
    setCompileErrors,
    setCompileWarnings,
    compileErrors,
    compileTime,
    setCompileTime,
    isDirty,
    setIsDirty,
    editorMode,
  } = useEditorStore();

  const { currentProject, setCurrentPage } = useProjectStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showErrors, setShowErrors] = React.useState(false);

  // Load project file on mount
  useEffect(() => {
    if (currentProject) {
      loadFile();
    }
  }, [currentProject?.id]);

  const loadFile = async () => {
    if (!currentProject) return;
    try {
      const fileContent = await readProjectFile(
        currentProject.id,
        'main.tex'
      );
      setContent(fileContent);
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  };

  // Auto-save with debounce
  useEffect(() => {
    if (!isDirty || !currentProject) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveProjectFile(currentProject.id, 'main.tex', content);
        setIsDirty(false);
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [content, isDirty, currentProject]);

  // Compile handler
  const handleCompile = useCallback(async () => {
    if (!currentProject || compileStatus === 'compiling') return;

    setCompileStatus('compiling');
    setCompileErrors([]);
    setCompileWarnings([]);
    const startTime = performance.now();

    try {
      // Save before compile
      await saveProjectFile(currentProject.id, 'main.tex', content);
      setIsDirty(false);

      const result = await compileLatex(content, currentProject.id);
      const elapsed = Math.round(performance.now() - startTime);
      setCompileTime(elapsed);

      if (result.success && result.pdf_base64) {
        setPdfData(result.pdf_base64);
        setCompileStatus('success');
      } else {
        setCompileErrors(result.errors);
        setCompileWarnings(result.warnings);
        setCompileStatus('error');
        setShowErrors(true);
      }
    } catch (err) {
      setCompileStatus('error');
      setCompileErrors([String(err)]);
      setCompileTime(null);
      setShowErrors(true);
    }
  }, [currentProject, content, compileStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompile();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (currentProject) {
          saveProjectFile(currentProject.id, 'main.tex', content);
          setIsDirty(false);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCompile, content, currentProject]);

  const editorViewRef = useRef<EditorView | null>(null);

  const handleFormatAction = useCallback(
    (action: string) => {
      if (editorViewRef.current) {
        applyEditorAction(editorViewRef.current, action);
      } else {
        setContent(formatFallbackText(content, action));
      }
    },
    [content, setContent]
  );

  const getCompileIcon = () => {
    switch (compileStatus) {
      case 'compiling':
        return <Loader2 size={15} className="animate-spin" />;
      case 'success':
        return <CheckCircle2 size={15} />;
      case 'error':
        return <XCircle size={15} />;
      default:
        return <Play size={15} />;
    }
  };

  const getCompileLabel = () => {
    switch (compileStatus) {
      case 'compiling':
        return 'Compiling…';
      case 'success':
        return 'Recompile';
      case 'error':
        return 'Recompile';
      default:
        return 'Recompile';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-app">
      {/* Header */}
      <header className="flex items-center justify-between px-4 bg-brand-green text-white min-h-[48px] gap-4 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="flex items-center justify-center w-[30px] h-[30px] border-none bg-white/15 text-white rounded-md cursor-pointer transition-[background] duration-150 hover:bg-white/25"
            onClick={() => setCurrentPage('dashboard')}
            title="Back to Projects"
            aria-label="Back to Projects"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-semibold text-[13.5px] text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {currentProject?.name || 'Untitled'}
            </span>
            <span className="inline-flex items-center gap-1.5 py-[3px] px-2.5 bg-black/20 rounded text-[11px] text-white/90 font-mono">
              <span className="text-[12px]">📄</span>
              main.tex
              {isDirty && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-300" />}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {compileTime !== null && compileStatus === 'success' && (
            <span className="flex items-center gap-[5px] text-[11px] text-white/85 tabular-nums bg-black/20 py-[3px] px-2 rounded-full">
              <Clock size={12} />
              {(compileTime / 1000).toFixed(1)}s
            </span>
          )}
          <button
            className={`btn-compile ${compileStatus}`}
            onClick={handleCompile}
            disabled={compileStatus === 'compiling'}
          >
            {getCompileIcon()}
            {getCompileLabel()}
            <ChevronDown size={13} />
          </button>
        </div>
      </header>

      {/* Main split view */}
      <div className="flex-1 overflow-hidden bg-bg-surface">
        <PanelGroup orientation="horizontal" className="h-full">
          <Panel defaultSize={50} minSize={25} className="h-full min-h-0 overflow-hidden">
            <div className="flex flex-col h-full min-h-0 border-r border-border-subtle">
              <EditorToolbar onAction={handleFormatAction} />
              <div className="flex-1 min-h-0 h-full overflow-hidden bg-white flex flex-col relative">
                {editorMode === 'code' ? (
                  <LatexEditor
                    onViewReady={(v) => {
                      editorViewRef.current = v;
                    }}
                  />
                ) : (
                  <VisualEditor />
                )}
              </div>
              {/* Error panel */}
              {showErrors && compileErrors.length > 0 && (
                <div className="border-t border-[#fecaca] bg-[#fff5f5] max-h-[180px] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between py-2 px-3.5 bg-error-bg border-b border-error-border">
                    <div className="flex items-center gap-1.5 text-[#991b1b] text-[11px] font-semibold">
                      <AlertTriangle size={14} />
                      <span>
                        {compileErrors.length} error
                        {compileErrors.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowErrors(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto py-2 px-3.5">
                    {compileErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-[12px] text-[#b91c1c] font-mono leading-[1.5]">
                        <XCircle size={12} className="shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          <Panel defaultSize={50} minSize={25} className="h-full min-h-0 overflow-hidden">
            <PdfViewer />
          </Panel>
        </PanelGroup>
      </div>

      {/* Status bar */}
      <footer className="flex items-center justify-between px-4 py-[3px] bg-bg-sidebar border-t border-border-subtle min-h-[24px] text-text-muted text-[11.5px] select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-[5px]">
            {compileStatus === 'success' && (
              <>
                <CheckCircle2 size={11} className="text-[#16a34a]" />
                Compiled successfully
              </>
            )}
            {compileStatus === 'error' && (
              <>
                <XCircle size={11} className="text-error" />
                Compilation failed
              </>
            )}
            {compileStatus === 'compiling' && (
              <>
                <Loader2 size={11} className="animate-spin" />
                Compiling…
              </>
            )}
            {compileStatus === 'idle' && (
              <span>Ready</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-[5px]">
            {content.split('\n').length} lines
          </span>
          <span className="flex items-center gap-[5px]">UTF-8</span>
          <span className="flex items-center gap-[5px]">LaTeX</span>
        </div>
      </footer>
    </div>
  );
};

export default EditorPage;
