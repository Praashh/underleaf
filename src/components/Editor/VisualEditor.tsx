import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import './VisualEditor.css';

const VisualEditor: React.FC = () => {
  const { content, setContent } = useEditorStore();
  const [isPreambleExpanded, setIsPreambleExpanded] = useState<boolean>(false);

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

  // Quick section title replacer
  const handleSectionRename = useCallback(
    (oldTitle: string, newTitle: string) => {
      const oldCmd = `\\section{${oldTitle}}`;
      const newCmd = `\\section{${newTitle}}`;
      if (content.includes(oldCmd)) {
        setContent(content.replace(oldCmd, newCmd));
      }
    },
    [content, setContent]
  );

  // Parse lines for visual hybrid representation
  const parsedLines = useMemo(() => {
    return bodyContent.split('\n');
  }, [bodyContent]);

  return (
    <div className="visual-editor">
      {/* Top Banner / Mode indicator */}
      <div className="visual-mode-actions">
        <div className="visual-badge">
          <Eye size={13} />
          Visual Mode (Rich Document)
        </div>
        <span>Edits update LaTeX automatically</span>
      </div>

      {/* Collapsible Preamble Card (Screenshot 2) */}
      <div className="visual-preamble-card">
        <div
          className="visual-preamble-header"
          onClick={() => setIsPreambleExpanded((prev) => !prev)}
        >
          <div className="visual-preamble-title">
            <span>Show document preamble</span>
          </div>
          <div className="visual-preamble-icon">
            {isPreambleExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {isPreambleExpanded && (
          <div className="visual-preamble-content">
            <textarea
              className="visual-preamble-textarea"
              value={preamble}
              onChange={(e) => handlePreambleChange(e.target.value)}
              placeholder="% Document classes, packages, and commands..."
            />
          </div>
        )}
      </div>

      {/* Main Document Body */}
      <div className="visual-document-body">
        {/* Render lines with Overleaf Visual Hybrid styling (Screenshot 2) */}
        {parsedLines.map((line, idx) => {
          const trimmed = line.trim();

          // Green comments: %--------HEADING--------
          if (trimmed.startsWith('%')) {
            return (
              <div key={idx} className="visual-comment">
                {line}
              </div>
            );
          }

          // Section headers: \section{Education} rendered as big bold serif
          const sectionMatch = trimmed.match(/^\\section\{([^}]+)\}/);
          if (sectionMatch) {
            const title = sectionMatch[1];
            return (
              <div key={idx} className="visual-heading-block">
                <div className="visual-heading-tag">
                  \section{'{'}
                  <input
                    type="text"
                    className="visual-inline-input"
                    value={title}
                    style={{ fontWeight: 600, color: '#1a56db' }}
                    onChange={(e) => handleSectionRename(title, e.target.value)}
                  />
                  {'}'}
                </div>
                <div className="visual-heading-rendered">{title}</div>
              </div>
            );
          }

          // Subsections
          const subSectionMatch = trimmed.match(/^\\subsection\{([^}]+)\}/);
          if (subSectionMatch) {
            const title = subSectionMatch[1];
            return (
              <div key={idx} className="visual-heading-block">
                <div className="visual-heading-tag">\subsection{`{${title}}`}</div>
                <div className="visual-subheading-rendered">{title}</div>
              </div>
            );
          }

          // Empty lines
          if (!trimmed) {
            return <div key={idx} style={{ height: '10px' }} />;
          }

          // Formatted LaTeX commands & environments
          return (
            <div key={idx} className="visual-hybrid-line">
              {renderFormattedLatexLine(line)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper to style LaTeX commands and keywords inside lines
function renderFormattedLatexLine(line: string) {
  // Regex splitting by LaTeX commands and braces
  const parts = line.split(/(\\[a-zA-Z*]+|\{|\}|\[|\])/g);

  return parts.map((part, index) => {
    if (part.startsWith('\\')) {
      return (
        <span key={index} className="visual-hybrid-cmd">
          {part}
        </span>
      );
    }
    if (part === '{' || part === '}') {
      return (
        <span key={index} className="visual-hybrid-curly">
          {part}
        </span>
      );
    }
    if (part === '[' || part === ']') {
      return (
        <span key={index} className="visual-arg-opt">
          {part}
        </span>
      );
    }

    // Highlighting for dates or key terms
    if (
      part.includes('Aug') ||
      part.includes('Present') ||
      part.includes('july') ||
      part.includes('202')
    ) {
      return (
        <span key={index} className="visual-hybrid-highlight">
          {part}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export default VisualEditor;
