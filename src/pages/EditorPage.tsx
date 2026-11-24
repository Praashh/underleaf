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
  Sparkles,
  FileText,
} from 'lucide-react';
import LatexEditor from '../components/Editor/LatexEditor';
import VisualEditor from '../components/Editor/VisualEditor';
import EditorToolbar from '../components/Editor/EditorToolbar';
import PdfViewer from '../components/Preview/PdfViewer';
import { AiAssistantPanel } from '../components/AI/AiAssistantPanel';
import { AiSettingsModal } from '../components/Settings/AiSettingsModal';
import { ThemeToggle } from '../components/Common/ThemeToggle';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { useAISettingsStore } from '../store/aiSettingsStore';
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
  const { isAiPanelOpen, toggleAiPanel, setIsAiPanelOpen } = useAISettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showErrors, setShowErrors] = React.useState(false);
  const [compileElapsed, setCompileElapsed] = React.useState(0);

  useEffect(() => {
    if (compileStatus !== 'compiling') {
      setCompileElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setCompileElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [compileStatus]);

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
        try {
          localStorage.setItem('underleaf_has_compiled', 'true');
        } catch {
          // ignore localStorage errors
        }
      } else {
        const errors = [...result.errors];
        const hasCompiled = localStorage.getItem('underleaf_has_compiled');
        if (!hasCompiled) {
          errors.push(
            'Note: Initial LaTeX compilation requires an active internet connection to download TeX package bundles (~200MB). Check your connection and click Recompile.'
          );
        }
        setCompileErrors(errors);
        setCompileWarnings(result.warnings);
        setCompileStatus('error');
        setShowErrors(true);
      }
    } catch (err) {
      setCompileStatus('error');
      const errStr = String(err);
      const errors = [errStr];
      if (!localStorage.getItem('underleaf_has_compiled')) {
        errors.push(
          'Note: Initial LaTeX compilation requires an active internet connection to download TeX package bundles (~200MB). Check your connection and click Recompile.'
        );
      }
      setCompileErrors(errors);
      setCompileTime(null);
      setShowErrors(true);
    }
  }, [currentProject, content, compileStatus]);

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
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleFormatAction('bold');
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        handleFormatAction('italic');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCompile, handleFormatAction, content, currentProject]);

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
      <header className="flex items-center justify-between px-4 bg-brand-header text-white min-h-[48px] gap-4 shadow-sm z-10 shrink-0">
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
              <FileText size={12} className="opacity-80" />
              main.tex
              {isDirty && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-300" />}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          <button
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[12px] font-medium transition-all cursor-pointer ${isAiPanelOpen
              ? 'bg-white text-[#026046] font-semibold shadow-xs'
              : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            onClick={toggleAiPanel}
            title="Toggle Voyager"
          >
            <Sparkles size={14} className={isAiPanelOpen ? 'text-[#026046]' : 'text-yellow-300'} />
            <span>Voyager AI</span>
          </button>

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
        <PanelGroup
          key={isAiPanelOpen ? 'layout-ai-open' : 'layout-ai-closed'}
          orientation="horizontal"
          className="h-full"
        >
          <Panel
            defaultSize={isAiPanelOpen ? '38%' : '50%'}
            minSize="20%"
            className="h-full min-h-0 overflow-hidden"
          >
            <div className="flex flex-col h-full min-h-0 border-r border-border-subtle">
              <EditorToolbar onAction={handleFormatAction} />
              <div className="flex-1 min-h-0 h-full overflow-hidden bg-bg-surface dark:bg-[#0d1117] flex flex-col relative">
                {editorMode === 'code' ? (
                  <LatexEditor
                    onViewReady={(v) => {
                      editorViewRef.current = v;
                    }}
                  />
                ) : (
                  <VisualEditor
                    onViewReady={(v) => {
                      editorViewRef.current = v;
                    }}
                  />
                )}
              </div>
              {/* Error panel */}
              {showErrors && compileErrors.length > 0 && (
                <div className="border-t border-error-border bg-error-bg/40 max-h-[180px] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between py-2 px-3.5 bg-error-bg border-b border-error-border">
                    <div className="flex items-center gap-1.5 text-error text-[11px] font-semibold">
                      <AlertTriangle size={14} />
                      <span>
                        {compileErrors.length} error
                        {compileErrors.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-bg-surface text-error border border-error-border shadow-2xs hover:bg-error-bg transition-colors cursor-pointer"
                        onClick={() => setIsAiPanelOpen(true)}
                      >
                        <Sparkles size={12} className="text-text-brand" />
                        Fix with AI
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowErrors(false)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto py-2 px-3.5">
                    {compileErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-[12px] text-error font-mono leading-[1.5]">
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

          <Panel
            defaultSize={isAiPanelOpen ? '34%' : '50%'}
            minSize="20%"
            className="h-full min-h-0 overflow-hidden"
          >
            <PdfViewer />
          </Panel>

          {isAiPanelOpen && (
            <>
              <PanelResizeHandle className="resize-handle" />
              <Panel
                defaultSize="28%"
                minSize="20%"
                maxSize="50%"
                className="h-full min-h-0 overflow-hidden"
              >
                <AiAssistantPanel
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  editorView={editorViewRef.current}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* AI Settings Modal */}
      <AiSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Status bar */}
      <footer className="flex items-center justify-between px-4 py-[3px] bg-bg-sidebar border-t border-border-subtle min-h-[24px] text-text-muted text-[11.5px] select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-[5px]">
            {compileStatus === 'success' && (
              <>
                <CheckCircle2 size={11} className="text-success" />
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
                <Loader2 size={11} className="animate-spin text-text-brand" />
                <span>
                  {compileElapsed >= 4
                    ? `Compiling & downloading TeX packages (${compileElapsed}s)…`
                    : 'Compiling…'}
                </span>
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
