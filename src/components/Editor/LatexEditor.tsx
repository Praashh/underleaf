import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { latex } from 'codemirror-lang-latex';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { applyEditorAction } from '../../utils/editorActions';

// Overleaf LaTeX Light Highlight Style
export const overleafHighlightStyle = HighlightStyle.define([
  // % Comments in bright green
  { tag: t.comment, color: '#2e7d32', fontStyle: 'normal' },
  { tag: t.lineComment, color: '#2e7d32', fontStyle: 'normal' },
  { tag: t.blockComment, color: '#2e7d32', fontStyle: 'normal' },

  // LaTeX commands (\documentclass, \usepackage, \begin, \end, \input) in deep blue
  { tag: [t.keyword, t.definitionKeyword, t.operatorKeyword], color: '#1a56db', fontWeight: '500' },
  { tag: [t.variableName, t.tagName], color: '#1a56db' },
  { tag: [t.standard(t.variableName)], color: '#1a56db' },

  // Brackets [letterpaper, 11pt] in teal / cyan
  { tag: [t.bracket, t.squareBracket], color: '#0284c7' },
  { tag: [t.atom, t.literal], color: '#0284c7' },

  // Curly braces {article} in dark
  { tag: [t.brace, t.paren], color: '#111827' },
  { tag: [t.string, t.special(t.string)], color: '#111827' },
  { tag: t.content, color: '#111827' },
]);

// Overleaf LaTeX Dark Highlight Style
export const overleafDarkHighlightStyle = HighlightStyle.define([
  // % Comments in vibrant emerald green
  { tag: t.comment, color: '#4ade80', fontStyle: 'normal' },
  { tag: t.lineComment, color: '#4ade80', fontStyle: 'normal' },
  { tag: t.blockComment, color: '#4ade80', fontStyle: 'normal' },

  // LaTeX commands in crisp sky blue
  { tag: [t.keyword, t.definitionKeyword, t.operatorKeyword], color: '#60a5fa', fontWeight: '500' },
  { tag: [t.variableName, t.tagName], color: '#60a5fa' },
  { tag: [t.standard(t.variableName)], color: '#60a5fa' },

  // Brackets / options in cyan
  { tag: [t.bracket, t.squareBracket], color: '#38bdf8' },
  { tag: [t.atom, t.literal], color: '#38bdf8' },

  // Curly braces & prose in high-contrast light text
  { tag: [t.brace, t.paren], color: '#e6edf3' },
  { tag: [t.string, t.special(t.string)], color: '#e6edf3' },
  { tag: t.content, color: '#e6edf3' },
]);

// Editor light theme configuration
const overleafTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  '.cm-scroller': {
    overflow: 'auto !important',
    height: '100% !important',
    lineHeight: '1.65',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', Monaco, monospace",
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', Monaco, monospace",
    fontSize: '13.5px',
    lineHeight: '1.65',
    padding: '8px 0',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    borderRight: '1px solid #e2e8f0',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12.5px',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    fontWeight: '600',
  },
  '.cm-cursor': {
    borderLeftColor: '#0f172a',
    borderLeftWidth: '2px',
  },
});

// Editor dark theme configuration
const overleafDarkTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: '#0d1117',
      color: '#e6edf3',
    },
    '.cm-scroller': {
      overflow: 'auto !important',
      height: '100% !important',
      lineHeight: '1.65',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', Monaco, monospace",
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', Monaco, monospace",
      fontSize: '13.5px',
      lineHeight: '1.65',
      padding: '8px 0',
      caretColor: '#e6edf3',
    },
    '.cm-gutters': {
      backgroundColor: '#11161d',
      color: '#64748b',
      borderRight: '1px solid #242d3a',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12.5px',
    },
    '.cm-activeLine': {
      backgroundColor: '#151c27',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#1c2533',
      color: '#e6edf3',
      fontWeight: '600',
    },
    '.cm-cursor': {
      borderLeftColor: '#e6edf3',
      borderLeftWidth: '2px',
    },
  },
  { dark: true }
);

interface LatexEditorProps {
  onViewReady?: (view: EditorView | null) => void;
}

const LatexEditor: React.FC<LatexEditorProps> = ({ onViewReady }) => {
  const { content, setContent } = useEditorStore();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  const onChange = useCallback(
    (value: string) => {
      setContent(value);
    },
    [setContent]
  );

  const onCreateEditor = useCallback(
    (view: EditorView) => {
      onViewReady?.(view);
    },
    [onViewReady]
  );

  useEffect(() => {
    if (cmRef.current?.view) {
      onViewReady?.(cmRef.current.view);
    }
    return () => {
      onViewReady?.(null);
    };
  }, [onViewReady]);

  const extensions = useMemo(() => {
    return [
      latex(),
      isDark ? overleafDarkTheme : overleafTheme,
      syntaxHighlighting(isDark ? overleafDarkHighlightStyle : overleafHighlightStyle),
      EditorView.lineWrapping,
      keymap.of([
        {
          key: 'Mod-b',
          run: (view) => {
            applyEditorAction(view, 'bold');
            return true;
          },
        },
        {
          key: 'Mod-i',
          run: (view) => {
            applyEditorAction(view, 'italic');
            return true;
          },
        },
      ]),
    ];
  }, [isDark]);

  return (
    <div className="latex-editor">
      <CodeMirror
        ref={cmRef}
        className="latex-codemirror-wrapper"
        value={content}
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        extensions={extensions}
        onChange={onChange}
        onCreateEditor={onCreateEditor}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          searchKeymap: true,
          tabSize: 2,
        }}
      />
    </div>
  );
};

export default LatexEditor;
