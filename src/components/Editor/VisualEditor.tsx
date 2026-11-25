import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, MatchDecorator, Decoration, ViewPlugin, keymap } from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';
import { latex } from 'codemirror-lang-latex';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { applyEditorAction } from '../../utils/editorActions';
import { latexLightHighlightStyle, latexDarkHighlightStyle } from './LatexEditor';

// Visual Decorators for rich LaTeX rendering
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
    color: '#111827',
    fontSize: '13.5px',
    fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
    fontSize: '13.5px',
    lineHeight: '1.65',
    padding: '4px 0',
    minHeight: '450px',
  },
  '.cm-line': {
    padding: '1px 0',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8fafc',
    borderRadius: '3px',
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

const visualDarkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: '#e6edf3',
      fontSize: '13.5px',
      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
      fontSize: '13.5px',
      lineHeight: '1.65',
      padding: '4px 0',
      minHeight: '450px',
      caretColor: '#e6edf3',
    },
    '.cm-line': {
      padding: '1px 0',
    },
    '.cm-activeLine': {
      backgroundColor: '#151c27',
      borderRadius: '3px',
    },
    '.cm-cursor': {
      borderLeftColor: '#e6edf3',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(56, 189, 248, 0.25) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(56, 189, 248, 0.3) !important',
    },
  },
  { dark: true }
);

interface VisualEditorProps {
  onViewReady?: (view: EditorView | null) => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({ onViewReady }) => {
  const { content, setContent } = useEditorStore();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
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
      syntaxHighlighting(isDark ? latexDarkHighlightStyle : latexLightHighlightStyle),
      isDark ? visualDarkTheme : visualTheme,
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
  }, [isDark]);

  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col items-center py-5 px-3 sm:px-6 font-sans select-text bg-bg-surface dark:bg-[#0d1117]">

      {/* Main Document Body on Paper Canvas */}
      <div
        className="w-full max-w-[820px]"
        spellCheck={false}
      >
        <CodeMirror
          ref={cmRef}
          className="visual-editor-cm"
          value={bodyContent}
          theme={isDark ? 'dark' : 'light'}
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
