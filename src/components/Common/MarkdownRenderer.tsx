import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

const CodeBlock: React.FC<{ language?: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard', err);
    }
  };

  return (
    <div className="relative my-2.5 rounded-lg border border-border-subtle bg-bg-app overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 bg-bg-sidebar border-b border-border-subtle text-[11px] text-text-muted font-mono">
        <span>{language || 'text'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1 hover:text-text-primary transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-success" />
              <span className="text-success">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[11.5px] font-mono leading-relaxed text-text-primary">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, className = '' }) => {
  if (!children) return null;

  return (
    <div className={`markdown-body select-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[14.5px] font-bold text-text-primary mt-3.5 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[13.5px] font-bold text-text-primary mt-3 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold text-text-primary mt-2.5 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[12.5px] font-semibold text-text-primary mt-2 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-text-primary">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-text-primary">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-text-secondary">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-1 marker:text-text-muted">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-1 marker:text-text-muted">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5 text-text-primary">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brand-green/50 pl-3 my-2 text-text-muted italic bg-brand-green-light/20 py-1 rounded-r">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              onClick={(e) => {
                e.preventDefault();
                if (href) openUrl(href);
              }}
              className="text-text-brand underline decoration-brand-green/40 hover:decoration-brand-green font-medium cursor-pointer"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-3 border-border-subtle" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2.5 border border-border-subtle rounded-md">
              <table className="w-full text-left border-collapse text-[11.5px]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-bg-sidebar border-b border-border-subtle p-2 font-semibold text-text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border-subtle p-2 text-text-secondary">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const rawCode = String(children).replace(/\n$/, '');
            const isInline = !match && !rawCode.includes('\n');

            if (isInline) {
              return (
                <code
                  className="font-mono text-[11.5px] bg-bg-app border border-border-subtle rounded px-1.5 py-0.5 text-brand-green-dark"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={match?.[1]} code={rawCode} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

