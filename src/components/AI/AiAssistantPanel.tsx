import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Square,
  Settings,
  X,
  Check,
  Code2,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { useAISettingsStore, PROVIDERS_LIST } from '../../store/aiSettingsStore';
import { startAiStream, AiProgressPayload } from '../../utils/ai';
import { buildChatPrompt } from '../../utils/aiPrompts';
import { parseAiActions, AiAction } from '../../utils/aiActions';
import { MarkdownRenderer } from '../Common/MarkdownRenderer';
import { EditorView } from '@codemirror/view';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: AiAction[];
  isStreaming?: boolean;
  progress?: AiProgressPayload;
}

interface AiAssistantPanelProps {
  onOpenSettings: () => void;
  editorView?: EditorView | null;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  onOpenSettings,
  editorView,
}) => {
  const { content, setContent, compileErrors } = useEditorStore();
  const { currentProject } = useProjectStore();
  const {
    provider,
    customInstructions,
    isAiPanelOpen,
    setIsAiPanelOpen,
  } = useAISettingsStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCancel, setActiveCancel] = useState<(() => Promise<void>) | null>(null);
  const [appliedActionIds, setAppliedActionIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Provider label
  const currentProviderMeta = PROVIDERS_LIST.find((p) => p.id === provider);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isGenerating) return;

    if (!customPrompt) {
      setInput('');
    }

    // Capture current selection in editor if available
    let selectedText = '';
    if (editorView) {
      const state = editorView.state;
      const { from, to } = state.selection.main;
      if (from !== to) {
        selectedText = state.sliceDoc(from, to);
      }
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    const assistantMessageId = `msg-reply-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      sender: 'assistant',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsGenerating(true);

    const fullPrompt = buildChatPrompt({
      userMessage: textToSend,
      documentContent: content,
      selectedText: selectedText || undefined,
      customInstructions,
    });

    let accumulatedText = '';

    const streamResult = await startAiStream(
      fullPrompt,
      {
        onChunk: (delta) => {
          accumulatedText += delta;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  text: accumulatedText,
                }
                : msg
            )
          );
        },
        onProgress: (progress) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  progress,
                }
                : msg
            )
          );
        },
        onComplete: (complete) => {
          const finalText = complete.output || accumulatedText;
          const { prose, actions } = parseAiActions(finalText);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  text: prose,
                  actions: actions.length > 0 ? actions : undefined,
                  isStreaming: false,
                }
                : msg
            )
          );
          setIsGenerating(false);
          setActiveCancel(null);
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  text: `⚠️ **Error**: ${err}`,
                  isStreaming: false,
                }
                : msg
            )
          );
          setIsGenerating(false);
          setActiveCancel(null);
        },
      },
      currentProject?.id ? undefined : undefined
    );

    setActiveCancel(() => streamResult.cancel);
  };

  const handleStop = async () => {
    if (activeCancel) {
      await activeCancel();
      setActiveCancel(null);
      setIsGenerating(false);
    }
  };

  const handleApplyAction = (action: AiAction, actionKey: string) => {
    switch (action.type) {
      case 'replace_document': {
        setContent(action.code);
        setAppliedActionIds((prev) => new Set(prev).add(actionKey));
        break;
      }
      case 'replace_selection': {
        if (editorView) {
          const { from, to } = editorView.state.selection.main;
          editorView.dispatch({
            changes: { from, to, insert: action.code },
          });
          setContent(editorView.state.doc.toString());
        } else {
          setContent(action.code);
        }
        setAppliedActionIds((prev) => new Set(prev).add(actionKey));
        break;
      }
      case 'patch_snippet': {
        if (content.includes(action.search)) {
          const newDoc = content.replace(action.search, action.replace);
          setContent(newDoc);
          setAppliedActionIds((prev) => new Set(prev).add(actionKey));
        } else {
          alert('Could not locate snippet in current document to patch.');
        }
        break;
      }
      case 'insert_at_cursor': {
        if (editorView) {
          const pos = editorView.state.selection.main.from;
          editorView.dispatch({
            changes: { from: pos, to: pos, insert: action.code },
          });
          setContent(editorView.state.doc.toString());
        } else {
          setContent(content + '\n' + action.code);
        }
        setAppliedActionIds((prev) => new Set(prev).add(actionKey));
        break;
      }
    }
  };

  if (!isAiPanelOpen) return null;

  return (
    <div className="flex flex-col w-full h-full bg-bg-surface select-none text-[13px] min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-bg-sidebar border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-brand-green/15 text-brand-green">
            <Sparkles size={14} />
          </div>
          <div>
            <span className="font-semibold text-text-primary text-[12.5px]">Voyager AI</span>
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-bg-app border border-border-subtle font-mono text-text-secondary">
              {currentProviderMeta?.name || provider}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-sm p-1 text-text-muted hover:text-text-primary"
            onClick={onOpenSettings}
            title="AI Settings"
          >
            <Settings size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm p-1 text-text-muted hover:text-text-primary"
            onClick={() => setIsAiPanelOpen(false)}
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="font-semibold text-text-primary text-[14px] mb-1">
              Resume & LaTeX Assistant
            </h3>
            <p className="text-[12px] text-text-muted max-w-[280px] mb-5 leading-relaxed">
              Ask questions about your resume, polish bullet points with metrics, or fix compilation
              errors.
            </p>

            <div className="w-full space-y-1.5 text-left">
              <button
                className="w-full p-2.5 rounded-lg border border-border-subtle hover:border-brand-green/40 hover:bg-brand-green-light/20 text-text-secondary text-[12px] flex items-center justify-between transition-colors cursor-pointer"
                onClick={() =>
                  handleSendMessage('Review my current resume and suggest 3 high-impact improvements.')
                }
              >
                <span>✨ Review resume & suggest improvements</span>
                <ChevronRight size={13} className="text-text-muted" />
              </button>

              <button
                className="w-full p-2.5 rounded-lg border border-border-subtle hover:border-brand-green/40 hover:bg-brand-green-light/20 text-text-secondary text-[12px] flex items-center justify-between transition-colors cursor-pointer"
                onClick={() =>
                  handleSendMessage(
                    'Rewrite my recent work experience bullets using the STAR method with quantifiable metrics.'
                  )
                }
              >
                <span>📊 Quantify bullets with STAR method</span>
                <ChevronRight size={13} className="text-text-muted" />
              </button>

              {compileErrors.length > 0 && (
                <button
                  className="w-full p-2.5 rounded-lg border border-error-border bg-error-bg/30 hover:bg-error-bg/60 text-error text-[12px] flex items-center justify-between transition-colors cursor-pointer"
                  onClick={() =>
                    handleSendMessage(
                      `Please diagnose and fix these LaTeX compiler errors:\n${compileErrors.join(
                        '\n'
                      )}`
                    )
                  }
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertCircle size={13} /> Fix active compilation errors
                  </span>
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
            >
              <div
                className={`max-w-[92%] rounded-xl px-3.5 py-2.5 leading-relaxed text-[12.5px] select-text ${msg.sender === 'user'
                    ? 'bg-brand-green text-white rounded-br-xs shadow-xs whitespace-pre-wrap'
                    : 'bg-bg-sidebar border border-border-subtle text-text-primary rounded-bl-xs'
                  }`}
              >
                {msg.text ? (
                  msg.sender === 'assistant' ? (
                    <MarkdownRenderer>{msg.text}</MarkdownRenderer>
                  ) : (
                    <span>{msg.text}</span>
                  )
                ) : (
                  <span className="flex items-center gap-1.5 text-text-muted text-[12px]">
                    <Loader2 size={12} className="animate-spin" />
                    Thinking…
                  </span>
                )}

                {/* Live progress indicator */}
                {msg.isStreaming && msg.progress && (
                  <div className="mt-2 pt-2 border-t border-border-subtle text-[11px] text-text-muted flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                    <span>{msg.progress.message}</span>
                  </div>
                )}
              </div>

              {/* Action proposal cards */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="w-full mt-2 space-y-2">
                  {msg.actions.map((action, idx) => {
                    const actionKey = `${msg.id}-action-${idx}`;
                    const isApplied = appliedActionIds.has(actionKey);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-brand-green/30 bg-brand-green-light/30 text-[12px]"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-brand-green flex items-center gap-1">
                            <Code2 size={13} />
                            {action.explanation || 'Proposed LaTeX Edit'}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono uppercase">
                            {action.type.replace('_', ' ')}
                          </span>
                        </div>

                        {action.type === 'patch_snippet' ? (
                          <div className="font-mono text-[11px] bg-white p-2 rounded border border-border-subtle my-2 max-h-32 overflow-y-auto">
                            <div className="text-red-600 line-through">
                              {action.search}
                            </div>
                            <div className="text-green-700 font-semibold">
                              {action.replace}
                            </div>
                          </div>
                        ) : (
                          <pre className="font-mono text-[11px] bg-white p-2 rounded border border-border-subtle my-2 max-h-32 overflow-y-auto text-text-primary whitespace-pre-wrap">
                            {action.code.length > 300
                              ? action.code.slice(0, 300) + '…'
                              : action.code}
                          </pre>
                        )}

                        <div className="flex justify-end gap-2 mt-2">
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-semibold py-1 px-2.5 bg-green-100 rounded">
                              <Check size={12} /> Applied
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm flex items-center gap-1 py-1 px-2.5 text-[11.5px]"
                              onClick={() => handleApplyAction(action, actionKey)}
                            >
                              <Check size={12} /> Apply Changes
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-bg-sidebar border-t border-border-subtle shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask voyager (e.g. improve bullets, fix syntax)..."
            rows={2}
            className="flex-1 p-2 bg-white border border-border-subtle rounded-lg text-[12.5px] resize-none focus:outline-none focus:border-brand-green leading-snug"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={handleStop}
              className="btn btn-danger btn-sm p-2 h-[34px] flex items-center justify-center"
              title="Stop generating"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn btn-primary btn-sm p-2 h-[34px] flex items-center justify-center disabled:opacity-40"
              title="Send message"
            >
              <Send size={14} />
            </button>
          )}
        </form>
        <div className="flex items-center justify-between text-[10.5px] text-text-muted mt-1.5 px-0.5">
          <span>Shift+Enter for newline</span>
          <span className="font-mono">{provider}</span>
        </div>
      </div>
    </div>
  );
};
