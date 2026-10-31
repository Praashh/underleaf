import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, MatchDecorator, Decoration, ViewPlugin, keymap } from '@codemirror/view';
import { latex } from 'codemirror-lang-latex';
import { ChevronDown, ChevronUp, Eye, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { applyEditorAction } from '../../utils/editorActions';

// Visual Decorators for Overleaf-like rich rendering
const boldDecorator = new MatchDecorator({
  regexp: /\\textbf\{([^{}\r\n]+)\}/g,
  decorate(add, from, to, match) {
    const cmdLen = match[0].indexOf('{') + 1;
    add(from, from + cmdLen, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-bold' }));
    add(from + cmdLen, to - 1, Decoration.mark({ class: 'cm-visual-bold' }));
    add(to - 1, to, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-bold' }));
  },
});

const italicDecorator = new MatchDecorator({
  regexp: /\\textit\{([^{}\r\n]+)\}/g,
  decorate(add, from, to, match) {
    const cmdLen = match[0].indexOf('{') + 1;
    add(from, from + cmdLen, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-italic' }));
    add(from + cmdLen, to - 1, Decoration.mark({ class: 'cm-visual-italic' }));
    add(to - 1, to, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-italic' }));
  },
});

const underlineDecorator = new MatchDecorator({
  regexp: /\\underline\{([^{}\r\n]+)\}/g,
  decorate(add, from, to, match) {
    const cmdLen = match[0].indexOf('{') + 1;
    add(from, from + cmdLen, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-underline' }));
    add(from + cmdLen, to - 1, Decoration.mark({ class: 'cm-visual-underline' }));
    add(to - 1, to, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-underline' }));
  },
});

const headingDecorator = new MatchDecorator({
  regexp: /\\(section|subsection|subsubsection)\*?\{([^{}\r\n]+)\}/g,
  decorate(add, from, to, match) {
    const level = match[1];
    const cmdLen = match[0].indexOf('{') + 1;
    let titleClass = 'cm-visual-section';
    if (level === 'subsection') titleClass = 'cm-visual-subsection';
    else if (level === 'subsubsection') titleClass = 'cm-visual-subsubsection';

    add(from, from + cmdLen, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-heading' }));
    add(from + cmdLen, to - 1, Decoration.mark({ class: titleClass }));
    add(to - 1, to, Decoration.mark({ class: 'cm-visual-tag cm-visual-tag-heading' }));
  },
});

const mathDecorator = new MatchDecorator({
  regexp: /\$([^$\r\n]+)\$/g,
  decorate(add, from, to) {
    add(from, to, Decoration.mark({ class: 'cm-visual-math' }));
  },
});

const commentDecorator = new MatchDecorator({
  regexp: /(%.*)$/g,
  decorate(add, from, to) {
    add(from, to, Decoration.mark({ class: 'cm-visual-comment' }));
  },
});

const envDecorator = new MatchDecorator({
  regexp: /\\(begin|end)\{([a-zA-Z*]+)\}/g,
  decorate(add, from, to) {
    add(from, to, Decoration.mark({ class: 'cm-visual-env' }));
  },
});

const itemDecorator = new MatchDecorator({
  regexp: /\\item\b/g,
  decorate(add, from, to) {
    add(from, to, Decoration.mark({ class: 'cm-visual-item' }));
  },
});

// View plugins that apply the decorations
const boldPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = boldDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = boldDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const italicPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = italicDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = italicDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const underlinePlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = underlineDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = underlineDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const headingPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = headingDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = headingDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const mathPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = mathDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = mathDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const commentPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = commentDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = commentDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const envPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = envDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = envDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

const itemPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = itemDecorator.createDeco(view);
    }
    update(u: any) {
      this.decorations = itemDecorator.updateDeco(u, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);

// Visual document theme configuration
const visualTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: '#0f172a',
    fontSize: '14.5px',
    fontFamily: "var(--font-sans)",
  },
  '.cm-content': {
    fontFamily: "var(--font-sans)",
    fontSize: '14.5px',
    lineHeight: '1.8',
    padding: '4px 0',
    minHeight: '450px',
  },
  '.cm-line': {
    padding: '2px 0',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
    borderRadius: '4px',
  },
  '.cm-cursor': {
    borderLeftColor: '#0f172a',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#bae6fd !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#bae6fd !important',
  },
});

interface VisualEditorProps {
  onViewReady?: (view: EditorView | null) => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({ onViewReady }) => {
  const { content, setContent } = useEditorStore();
  const [isPreambleExpanded, setIsPreambleExpanded] = useState<boolean>(false);
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  // Split document into preamble and body
  const { preamble, bodyContent, postamble } = useMemo(() => {
    const beginIndex = content.indexOf('\\begin{document}');
    if (beginIndex === -1) {
      return { preamble: '', bodyContent: content, postamble: '' };
    }

    const preamblePart = content.slice(0, beginIndex);
    const rest = content.slice(beginIndex + '\\begin{document}'.length);
    const endIndex = rest.lastIndexOf('\\end{document}');

    if (endIndex === -1) {
      return { preamble: preamblePart, bodyContent: rest, postamble: '' };
    }

    const bodyPart = rest.slice(0, endIndex);
    const postamblePart = rest.slice(endIndex);

    return {
      preamble: preamblePart,
      bodyContent: bodyPart,
      postamble: postamblePart,
    };
  }, [content]);

  const preambleLineCount = useMemo(() => {
    if (!preamble.trim()) return 0;
    return preamble.trim().split('\n').length;
  }, [preamble]);

  // Update preamble
  const handlePreambleChange = useCallback(
    (newPreamble: string) => {
      const beginDoc = content.includes('\\begin{document}')
        ? '\\begin{document}'
        : '';
      const newFullContent = `${newPreamble}${beginDoc}${bodyContent}${postamble}`;
      setContent(newFullContent);
    },
    [bodyContent, postamble, content, setContent]
  );

  // Update document body
  const handleBodyChange = useCallback(
    (newBody: string) => {
      const beginDoc = content.includes('\\begin{document}')
        ? '\\begin{document}'
        : '';
      const newFullContent = `${preamble}${beginDoc}${newBody}${postamble}`;
      setContent(newFullContent);
    },
    [preamble, postamble, content, setContent]
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

  // CodeMirror extensions for Visual Mode
  const extensions = useMemo(() => {
    return [
      latex(),
      visualTheme,
      EditorView.lineWrapping,
      boldPlugin,
      italicPlugin,
      underlinePlugin,
      headingPlugin,
      mathPlugin,
      commentPlugin,
      envPlugin,
      itemPlugin,
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
  }, []);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg-desk flex flex-col items-center py-5 px-4 font-sans select-text">
      {/* Visual Mode Bar & Preamble Toggle */}
      <div className="w-full max-w-[850px] mb-3 flex items-center justify-between">

        {preambleLineCount > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-white border border-border-subtle hover:border-border-strong rounded-md text-[12px] text-text-secondary cursor-pointer transition-colors shadow-xs"
            onClick={() => setIsPreambleExpanded((prev) => !prev)}
          >
            <SlidersHorizontal size={12} className="text-text-muted" />
            <span className="font-medium">Document Preamble</span>
            <span className="bg-bg-subtle text-text-muted text-[10.5px] px-1.5 py-0.2 rounded font-mono">
              {preambleLineCount} lines
            </span>
            {isPreambleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Collapsible Preamble Card */}
      {isPreambleExpanded && (
        <div className="w-full max-w-[850px] mb-4 bg-white border border-border-subtle rounded-lg overflow-hidden shadow-paper animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between py-2 px-4 bg-bg-sidebar border-b border-border-subtle text-[12px] font-medium text-text-secondary">
            <span>Preamble (packages, macros & definitions)</span>
            <span className="text-[11px] text-text-muted">
              Auto-included before \begin&#123;document&#125;
            </span>
          </div>
          <div className="p-3 bg-white">
            <textarea
              className="w-full h-[150px] font-mono text-[12.5px] leading-[1.6] py-2 px-3 border border-border-medium rounded-md bg-bg-sidebar text-text-primary resize-y outline-none focus:bg-white focus:border-brand-green focus:shadow-[0_0_0_2px_rgba(2,96,70,0.15)]"
              value={preamble}
              onChange={(e) => handlePreambleChange(e.target.value)}
              placeholder="% \documentclass{article}&#10;% \usepackage{amsmath}&#10;% \usepackage{hyperref}"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Main Document Body on Paper Canvas */}
      <div className="w-full max-w-[850px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-border-subtle p-7 sm:p-11 md:p-14 min-h-[700px] mb-12">
        <CodeMirror
          ref={cmRef}
          className="visual-editor-cm"
          value={bodyContent}
          theme="light"
          extensions={extensions}
          onChange={handleBodyChange}
          onCreateEditor={onCreateEditor}
          basicSetup={{
            lineNumbers: false,
            highlightActiveLineGutter: false,
            highlightActiveLine: true,
            foldGutter: false,
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
    </div>
  );
};

export default VisualEditor;
