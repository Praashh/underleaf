import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

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
    <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto font-sans p-0">
      {/* Collapsible Preamble Card */}
      <div className="mx-6 mt-4 mb-2 bg-bg-sidebar border border-border-subtle rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div
          className="flex items-center justify-between py-2.5 px-4 cursor-pointer bg-white select-none text-[13.5px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-sidebar"
          onClick={() => setIsPreambleExpanded((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <span>Show document preamble</span>
          </div>
          <div className="text-text-muted transition-transform duration-200">
            {isPreambleExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {isPreambleExpanded && (
          <div className="py-3 px-4 border-t border-border-subtle bg-bg-sidebar">
            <textarea
              className="w-full h-[180px] font-mono text-[12.5px] leading-[1.5] py-2.5 px-3 border border-border-medium rounded-md bg-white text-[#1e293b] resize-y outline-none focus:border-[#3b82f6] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]"
              value={preamble}
              onChange={(e) => handlePreambleChange(e.target.value)}
              placeholder="% Document classes, packages, and commands..."
            />
          </div>
        )}
      </div>

      {/* Main Document Body */}
      <div className="py-4 px-9 pb-[60px] max-w-[820px] mx-auto w-full">
        {/* Render lines with Overleaf Visual Hybrid styling (Screenshot 2) */}
        {parsedLines.map((line, idx) => {
          const trimmed = line.trim();

          // Green comments: %--------HEADING--------
          if (trimmed.startsWith('%')) {
            return (
              <div key={idx} className="font-mono text-[13px] text-[#2e7d32] my-3 mb-1.5 select-none whitespace-pre-wrap">
                {line}
              </div>
            );
          }

          // Section headers: \section{Education} rendered as big bold serif
          const sectionMatch = trimmed.match(/^\\section\{([^}]+)\}/);
          if (sectionMatch) {
            const title = sectionMatch[1];
            return (
              <div key={idx} className="mt-5 mb-2.5">
                <div className="font-mono text-[13px] text-[#1a56db] font-medium">
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
                <div className="font-serif text-[24px] font-bold text-gray-900 -tracking-[0.01em] mt-0.5 border-b-[1.5px] border-gray-900 pb-0.5">
                  {title}
                </div>
              </div>
            );
          }

          // Subsections
          const subSectionMatch = trimmed.match(/^\\subsection\{([^}]+)\}/);
          if (subSectionMatch) {
            const title = subSectionMatch[1];
            return (
              <div key={idx} className="mt-5 mb-2.5">
                <div className="font-mono text-[13px] text-[#1a56db] font-medium">\subsection{`{${title}}`}</div>
                <div className="font-serif text-[18px] font-semibold text-gray-800 mt-3.5">{title}</div>
              </div>
            );
          }

          // Empty lines
          if (!trimmed) {
            return <div key={idx} style={{ height: '10px' }} />;
          }

          // Formatted LaTeX commands & environments
          return (
            <div key={idx} className="font-mono text-[13.5px] leading-[1.7] text-gray-900 my-0.5 whitespace-pre-wrap break-words">
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
        <span key={index} className="text-[#1a56db] font-medium">
          {part}
        </span>
      );
    }
    if (part === '{' || part === '}') {
      return (
        <span key={index} className="text-gray-900">
          {part}
        </span>
      );
    }
    if (part === '[' || part === ']') {
      return (
        <span key={index} className="text-info">
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
        <span key={index} className="bg-[#fef08a] px-0.5 rounded-sm">
          {part}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export default VisualEditor;
