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
import './EditorPage.css';

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
    <div className="editor-page">
      {/* Header */}
      <header className="editor-header">
        <div className="editor-header-left">
          <button
            className="editor-back-btn"
            onClick={() => setCurrentPage('dashboard')}
            title="Back to Projects"
            aria-label="Back to Projects"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="project-info">
            <span className="project-name">
              {currentProject?.name || 'Untitled'}
            </span>
            <span className="file-tab">
              <span className="file-icon">📄</span>
              main.tex
              {isDirty && <span className="dirty-dot" />}
            </span>
          </div>
        </div>

        <div className="editor-header-right">
          {compileTime !== null && compileStatus === 'success' && (
            <span className="compile-time">
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
      <div className="editor-body">
        <PanelGroup orientation="horizontal" className="editor-panels">
          <Panel defaultSize={50} minSize={25} className="editor-panel">
            <div className="editor-panel-inner">
              <EditorToolbar onAction={handleFormatAction} />
              <div className="editor-content">
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
                <div className="error-panel">
                  <div className="error-panel-header">
                    <div className="error-panel-title">
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
                  <div className="error-list">
                    {compileErrors.map((err, i) => (
                      <div key={i} className="error-item">
                        <XCircle size={12} />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          <Panel defaultSize={50} minSize={25} className="preview-panel">
            <PdfViewer />
          </Panel>
        </PanelGroup>
      </div>

      {/* Status bar */}
      <footer className="status-bar">
        <div className="status-left">
          <span className="status-item">
            {compileStatus === 'success' && (
              <>
                <CheckCircle2 size={11} className="status-icon success" />
                Compiled successfully
              </>
            )}
            {compileStatus === 'error' && (
              <>
                <XCircle size={11} className="status-icon error" />
                Compilation failed
              </>
            )}
            {compileStatus === 'compiling' && (
              <>
                <Loader2 size={11} className="status-icon animate-spin" />
                Compiling…
              </>
            )}
            {compileStatus === 'idle' && (
              <span className="status-muted">Ready</span>
            )}
          </span>
        </div>
        <div className="status-right">
          <span className="status-item status-muted">
            {content.split('\n').length} lines
          </span>
          <span className="status-item status-muted">UTF-8</span>
          <span className="status-item status-muted">LaTeX</span>
        </div>
      </footer>
    </div>
  );
};

export default EditorPage;
