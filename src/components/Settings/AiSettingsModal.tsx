import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  Globe,
  Terminal,
} from 'lucide-react';
import {
  useAISettingsStore,
  PROVIDERS_LIST,
  MODEL_SUGGESTIONS,
} from '../../store/aiSettingsStore';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    provider,
    setProvider,
    model,
    setModel,
    baseUrl,
    setBaseUrl,
    apiKey,
    setApiKey,
    timeoutSecs,
    setTimeoutSecs,
    customInstructions,
    setCustomInstructions,
    availableProviders,
    isCheckingAvailability,
    checkAvailability,
  } = useAISettingsStore();

  const [activeTab, setActiveTab] = useState<'providers' | 'instructions'>('providers');

  useEffect(() => {
    if (isOpen) {
      checkAvailability();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSuggestions = MODEL_SUGGESTIONS[provider] || [];

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-[4px] flex items-center justify-center z-[200] animate-modal-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="bg-bg-surface rounded-xl shadow-modal border border-border-subtle w-[90%] max-w-[620px] max-h-[88vh] overflow-hidden flex flex-col animate-modal-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">AI Provider & Copilot</h2>
              <p className="text-[12px] text-text-muted">
                Configure local CLI agents or OpenAI-compatible endpoints
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm text-text-muted hover:text-text-primary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-6 border-b border-border-subtle bg-bg-surface gap-4 text-[13px]">
          <button
            className={`py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'providers'
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('providers')}
          >
            Provider & Model
          </button>
          <button
            className={`py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'instructions'
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('instructions')}
          >
            System Instructions
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-[13px]">
          {activeTab === 'providers' ? (
            <>
              {/* Provider Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12.5px] font-semibold text-text-primary">
                    Active AI Provider
                  </label>
                  <button
                    className="inline-flex items-center gap-1 text-[11px] text-brand-green hover:underline cursor-pointer disabled:opacity-50"
                    onClick={checkAvailability}
                    disabled={isCheckingAvailability}
                  >
                    <RefreshCw size={11} className={isCheckingAvailability ? 'animate-spin' : ''} />
                    Check Installed CLIs
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {PROVIDERS_LIST.map((p) => {
                    const isAvailable = availableProviders[p.id];
                    const isSelected = provider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProvider(p.id);
                          if (!model && MODEL_SUGGESTIONS[p.id]?.length > 0) {
                            setModel(MODEL_SUGGESTIONS[p.id][0]);
                          }
                        }}
                        className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-brand-green bg-brand-green-light/40 shadow-xs ring-1 ring-brand-green/30'
                            : 'border-border-subtle hover:border-text-muted/40 bg-bg-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-semibold text-[13px] text-text-primary flex items-center gap-1.5">
                            {p.id === 'openai' ? <Globe size={13} /> : <Terminal size={13} />}
                            {p.name}
                          </span>
                          {p.id === 'openai' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">
                              HTTP
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded font-medium ${
                                isAvailable
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {isAvailable ? (
                                <>
                                  <CheckCircle2 size={10} /> Ready
                                </>
                              ) : (
                                <>
                                  <XCircle size={10} /> Not found
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-text-muted line-clamp-1">
                          {p.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                  Model Override (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      currentSuggestions[0]
                        ? `Default: ${currentSuggestions[0]}`
                        : 'Leave blank to use CLI default'
                    }
                    className="flex-1 px-3 py-1.5 bg-bg-app border border-border-subtle rounded-md text-[13px] focus:outline-none focus:border-brand-green font-mono"
                  />
                  {currentSuggestions.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setModel(e.target.value);
                      }}
                      className="px-2.5 py-1.5 bg-bg-app border border-border-subtle rounded-md text-[12px] text-text-secondary cursor-pointer focus:outline-none"
                    >
                      <option value="">Suggestions…</option>
                      {currentSuggestions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Leave empty to let the provider CLI use its own configured default model.
                </p>
              </div>

              {/* Endpoint configuration for OpenAI compatible */}
              {provider === 'openai' && (
                <div className="p-4 rounded-lg bg-bg-sidebar border border-border-subtle space-y-3.5">
                  <div className="flex items-center gap-1.5 font-medium text-text-primary text-[12.5px]">
                    <Globe size={14} className="text-brand-green" />
                    <span>OpenAI-Compatible HTTP Endpoint</span>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium text-text-secondary mb-1">
                      Base URL
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-[12.5px] font-mono focus:outline-none focus:border-brand-green"
                    />
                    <p className="text-[10.5px] text-text-muted mt-1">
                      Works with Ollama (<code>http://localhost:11434/v1</code>), LM Studio (
                      <code>http://localhost:1234/v1</code>), OpenRouter, Groq, or OpenAI.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium text-text-secondary mb-1">
                      API Key (Optional for local Ollama)
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-1.5 bg-white border border-border-subtle rounded text-[12.5px] font-mono focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              )}

              {/* Advanced timeout */}
              <div>
                <label className="block text-[12.5px] font-semibold text-text-primary mb-1">
                  Timeout Limit (Seconds)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="1800"
                    value={timeoutSecs || ''}
                    onChange={(e) => setTimeoutSecs(Number(e.target.value) || 0)}
                    placeholder="0 (smart default: 180s)"
                    className="w-32 px-3 py-1.5 bg-bg-app border border-border-subtle rounded-md text-[13px] font-mono focus:outline-none focus:border-brand-green"
                  />
                  <span className="text-[11.5px] text-text-muted">
                    0 = use smart automatic timeout (3 to 10 minutes)
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[12.5px] font-semibold text-text-primary mb-1.5">
                Custom Instructions for Assistant
              </label>
              <p className="text-[11.5px] text-text-muted mb-2">
                These instructions will be prepended to every prompt sent to your AI assistant. Use
                this to guide formatting, tone, or specific LaTeX conventions you prefer.
              </p>
              <textarea
                rows={6}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Always format work experience with the STAR method. Keep resume to exactly 1 page."
                className="w-full px-3 py-2 bg-bg-app border border-border-subtle rounded-md text-[12.5px] focus:outline-none focus:border-brand-green font-mono leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border-subtle bg-bg-sidebar">
          <span className="text-[11.5px] text-text-muted flex items-center gap-1">
            <Shield size={12} className="text-brand-green" />
            Runs securely using your local machine credentials
          </span>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
