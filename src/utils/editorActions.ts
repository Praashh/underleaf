import { EditorView } from '@codemirror/view';
import { undo as cmUndo, redo as cmRedo } from '@codemirror/commands';

export type EditorActionType =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'section'
  | 'subsection'
  | 'itemize'
  | 'enumerate'
  | 'link'
  | 'math'
  | 'table'
  | 'verbatim';

export function applyEditorAction(view: EditorView, action: EditorActionType | string) {
  if (!view) return;

  switch (action) {
    case 'undo':
      cmUndo(view);
      view.focus();
      break;

    case 'redo':
      cmRedo(view);
      view.focus();
      break;

    case 'bold': {
      wrapOrInsert(view, '\\textbf{', '}', 'bold text');
      break;
    }

    case 'italic': {
      wrapOrInsert(view, '\\textit{', '}', 'italic text');
      break;
    }

    case 'link': {
      const sel = view.state.selection.main;
      const selectedText = view.state.sliceDoc(sel.from, sel.to);
      if (selectedText) {
        const replacement = `\\href{https://example.com}{${selectedText}}`;
        const urlStart = sel.from + 6;
        const urlEnd = urlStart + 19; // 'https://example.com'.length
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: replacement },
          selection: { anchor: urlStart, head: urlEnd },
          userEvent: 'input',
        });
      } else {
        const replacement = '\\href{https://example.com}{Link Text}';
        const urlStart = sel.from + 6;
        const urlEnd = urlStart + 19;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: replacement },
          selection: { anchor: urlStart, head: urlEnd },
          userEvent: 'input',
        });
      }
      view.focus();
      break;
    }

    case 'section': {
      const sel = view.state.selection.main;
      const replacement = '\n\\section{Section Title}\n';
      const titleStart = sel.from + '\n\\section{'.length;
      const titleEnd = titleStart + 'Section Title'.length;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: replacement },
        selection: { anchor: titleStart, head: titleEnd },
        userEvent: 'input',
      });
      view.focus();
      break;
    }

    case 'subsection': {
      const sel = view.state.selection.main;
      const replacement = '\n\\subsection{Subsection Title}\n';
      const titleStart = sel.from + '\n\\subsection{'.length;
      const titleEnd = titleStart + 'Subsection Title'.length;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: replacement },
        selection: { anchor: titleStart, head: titleEnd },
        userEvent: 'input',
      });
      view.focus();
      break;
    }

    case 'itemize': {
      const sel = view.state.selection.main;
      const snippet = '\n\\begin{itemize}\n  \\item \n\\end{itemize}\n';
      const itemPos = sel.from + '\n\\begin{itemize}\n  \\item '.length;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: snippet },
        selection: { anchor: itemPos },
        userEvent: 'input',
      });
      view.focus();
      break;
    }

    case 'enumerate': {
      const sel = view.state.selection.main;
      const snippet = '\n\\begin{enumerate}\n  \\item \n\\end{enumerate}\n';
      const itemPos = sel.from + '\n\\begin{enumerate}\n  \\item '.length;
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: snippet },
        selection: { anchor: itemPos },
        userEvent: 'input',
      });
      view.focus();
      break;
    }

    case 'math': {
      const sel = view.state.selection.main;
      const selected = view.state.sliceDoc(sel.from, sel.to);
      if (selected) {
        const replacement = `$${selected}$`;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: replacement },
          selection: { anchor: sel.from + replacement.length },
          userEvent: 'input',
        });
      } else {
        const snippet = '$x^2 + y^2 = z^2$';
        const start = sel.from + 1;
        const end = start + 'x^2 + y^2 = z^2'.length;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: snippet },
          selection: { anchor: start, head: end },
          userEvent: 'input',
        });
      }
      view.focus();
      break;
    }

    case 'table': {
      const sel = view.state.selection.main;
      const snippet =
        '\n\\begin{tabular}{|c|c|}\n  \\hline\n  Header 1 & Header 2 \\\\\n  \\hline\n  Cell 1 & Cell 2 \\\\\n  \\hline\n\\end{tabular}\n';
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: snippet },
        selection: { anchor: sel.from + snippet.length },
        userEvent: 'input',
      });
      view.focus();
      break;
    }

    case 'verbatim': {
      const sel = view.state.selection.main;
      const selected = view.state.sliceDoc(sel.from, sel.to);
      if (selected) {
        const replacement = `\n\\begin{verbatim}\n${selected}\n\\end{verbatim}\n`;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: replacement },
          selection: { anchor: sel.from + replacement.length },
          userEvent: 'input',
        });
      } else {
        const snippet = '\n\\begin{verbatim}\ncode here\n\\end{verbatim}\n';
        const codeStart = sel.from + '\n\\begin{verbatim}\n'.length;
        const codeEnd = codeStart + 'code here'.length;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: snippet },
          selection: { anchor: codeStart, head: codeEnd },
          userEvent: 'input',
        });
      }
      view.focus();
      break;
    }
  }
}

function wrapOrInsert(
  view: EditorView,
  prefix: string,
  suffix: string,
  _placeholder = ''
) {
  const sel = view.state.selection.main;
  const selectedText = view.state.sliceDoc(sel.from, sel.to);

  if (selectedText) {
    const replacement = `${prefix}${selectedText}${suffix}`;
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: replacement },
      selection: { anchor: sel.from + replacement.length },
      userEvent: 'input',
    });
  } else {
    const replacement = `${prefix}${suffix}`;
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: replacement },
      selection: { anchor: sel.from + prefix.length },
      userEvent: 'input',
    });
  }
  view.focus();
}

/** Fallback if CodeMirror EditorView is not currently mounted */
export function formatFallbackText(currentContent: string, action: string): string {
  let snippet = '';
  switch (action) {
    case 'bold':
      snippet = '\\textbf{text}';
      break;
    case 'italic':
      snippet = '\\textit{text}';
      break;
    case 'link':
      snippet = '\\href{https://example.com}{Link Text}';
      break;
    case 'section':
      snippet = '\n\\section{Section Title}\n';
      break;
    case 'subsection':
      snippet = '\n\\subsection{Subsection Title}\n';
      break;
    case 'itemize':
      snippet = '\n\\begin{itemize}\n  \\item \n\\end{itemize}\n';
      break;
    case 'enumerate':
      snippet = '\n\\begin{enumerate}\n  \\item \n\\end{enumerate}\n';
      break;
    case 'math':
      snippet = '$x^2 + y^2 = z^2$';
      break;
    case 'table':
      snippet =
        '\n\\begin{tabular}{|c|c|}\n  \\hline\n  Header 1 & Header 2 \\\\\n  \\hline\n\\end{tabular}\n';
      break;
    case 'verbatim':
      snippet = '\n\\begin{verbatim}\ncode\n\\end{verbatim}\n';
      break;
    default:
      snippet = action;
  }

  // Insert before \end{document} if present so the file stays valid LaTeX
  const endDocIdx = currentContent.lastIndexOf('\\end{document}');
  if (endDocIdx !== -1) {
    return (
      currentContent.slice(0, endDocIdx) +
      '\n' +
      snippet +
      '\n' +
      currentContent.slice(endDocIdx)
    );
  }
  return currentContent + '\n' + snippet;
}
