import React, { useEffect, useState } from 'react';
import {
  Palette,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Terminal,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  FileText,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import {
  useAISettingsStore,
  PROVIDERS_LIST,
  MODEL_SUGGESTIONS,
} from '../../store/aiSettingsStore';

export type SettingsSubTab = 'appearance' | 'ai' | 'instructions';

const DEFAULT_INSTRUCTIONS =
  'Format all resume entries cleanly. Use standard packages (article, geometry, enumitem, hyperref, tabularx). When proposing code improvements, wrap them in <action> tags.';

const RESUME_PRESET =
  'Format all resume entries using the STAR method (Situation, Task, Action, Result). Prioritize concise bullet points and ensure document fits strictly on 1 page. Use standard resume packages (article, geometry, enumitem, hyperref, tabularx).';

const ACADEMIC_PRESET =
  'Adhere strictly to academic publishing conventions (LaTeX standard article/report classes). Ensure proper BibTeX citations, clear mathematical equation typography (amsmath, amssymb), and professional table formatting (booktabs).';

interface SettingsViewProps {
  initialSubTab?: SettingsSubTab;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialSubTab = 'appearance',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  // Theme store
  const { mode, resolvedTheme, setMode } = useThemeStore();

  // AI settings store
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


  useEffect(() => {
    if (activeSubTab === 'ai') {
      checkAvailability();
    }
  }, [activeSubTab]);

  const currentSuggestions = MODEL_SUGGESTIONS[provider] || [];

  return (
    <div className="max-w-[960px] mx-auto py-2">
      {/* Title & Description */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-text-primary -tracking-[0.02em]">
          Settings
        </h1>
        <p className="text-[13px] text-text-muted mt-1">
          Customize your appearance preferences, theme, and local AI copilot agents.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-border-subtle mb-6 gap-2 text-[13px]">
        <button
          type="button"
          onClick={() => setActiveSubTab('appearance')}
          className={`flex items-center gap-2 pb-3 px-3 font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'appearance'
              ? 'border-brand-green text-text-brand font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Palette size={16} />
          <span>Appearance & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ai')}
          className={`flex items-center gap-2 pb-3 px-3 font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'ai'
              ? 'border-brand-green text-text-brand font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Sparkles size={16} />
          <span>AI Providers & Models</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('instructions')}
          className={`flex items-center gap-2 pb-3 px-3 font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'instructions'
              ? 'border-brand-green text-text-brand font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <FileText size={16} />
          <span>AI System Instructions</span>
        </button>
      </div>

      {/* Tab 1: Appearance & Theme */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-xs">
            <div className="mb-5">
              <h2 className="text-[16px] font-semibold text-text-primary">
                Theme Preference
              </h2>
              <p className="text-[12.5px] text-text-muted mt-0.5">
                Choose how Underleaf looks across the desktop workspace.
              </p>
            </div>

            {/* Theme options grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* System Option */}
              <div
                onClick={() => setMode('system')}
                className={`relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                  mode === 'system'
                    ? 'border-brand-green bg-brand-green-light/40 shadow-xs ring-1 ring-brand-green/30'
                    : 'border-border-subtle hover:border-border-medium bg-bg-surface hover:bg-bg-subtle/50'
                }`}
              >
                {/* Visual Preview */}
                <div className="h-24 w-full rounded-lg mb-3 border border-border-subtle overflow-hidden flex flex-col bg-bg-app shadow-2xs">
                  <div className="h-4 bg-[#026046] flex items-center px-2 gap-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <div className="flex-1 flex">
                    <div className="w-1/3 bg-white dark:bg-[#161b22] border-r border-border-subtle p-1.5 flex flex-col gap-1">
                      <div className="h-1.5 w-3/4 rounded-xs bg-[#026046]/40" />
                      <div className="h-1.5 w-1/2 rounded-xs bg-black/10 dark:bg-white/10" />
                    </div>
                    <div className="flex-1 bg-[#f4f6f8] dark:bg-[#0d1117] p-2 flex flex-col gap-1">
                      <div className="h-1.5 w-5/6 rounded-xs bg-black/20 dark:bg-white/20" />
                      <div className="h-1.5 w-4/6 rounded-xs bg-black/10 dark:bg-white/10" />
                      <div className="h-1.5 w-3/6 rounded-xs bg-black/10 dark:bg-white/10" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[13.5px] text-text-primary flex items-center gap-2">
                    <Monitor size={16} className="text-text-secondary" />
                    Sync with System
                  </span>
                  {mode === 'system' && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-green text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <p className="text-[12px] text-text-muted leading-relaxed">
                  Automatically adapts to your operating system's light or dark mode.
                </p>

                <div className="mt-3 pt-2.5 border-t border-border-subtle/70 flex items-center justify-between text-[11px] text-text-muted">
                  <span>Current resolution</span>
                  <span className="font-medium text-text-primary capitalize px-1.5 py-0.5 rounded bg-bg-subtle">
                    {resolvedTheme} mode
                  </span>
                </div>
              </div>

              {/* Light Mode Option */}
              <div
                onClick={() => setMode('light')}
                className={`relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                  mode === 'light'
                    ? 'border-brand-green bg-brand-green-light/40 shadow-xs ring-1 ring-brand-green/30'
                    : 'border-border-subtle hover:border-border-medium bg-bg-surface hover:bg-bg-subtle/50'
                }`}
              >
                {/* Visual Preview */}
                <div className="h-24 w-full rounded-lg mb-3 border border-slate-200 overflow-hidden flex flex-col bg-[#f4f6f8] shadow-2xs">
                  <div className="h-4 bg-[#026046] flex items-center px-2 gap-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <div className="flex-1 flex">
                    <div className="w-1/3 bg-white border-r border-slate-200 p-1.5 flex flex-col gap-1">
                      <div className="h-1.5 w-3/4 rounded-xs bg-[#026046]/40" />
                      <div className="h-1.5 w-1/2 rounded-xs bg-slate-200" />
                    </div>
                    <div className="flex-1 bg-white p-2 flex flex-col gap-1">
                      <div className="h-1.5 w-5/6 rounded-xs bg-slate-300" />
                      <div className="h-1.5 w-4/6 rounded-xs bg-slate-200" />
                      <div className="h-1.5 w-3/6 rounded-xs bg-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[13.5px] text-text-primary flex items-center gap-2">
                    <Sun size={16} className="text-amber-500" />
                    Light Mode
                  </span>
                  {mode === 'light' && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-green text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <p className="text-[12px] text-text-muted leading-relaxed">
                  Classic crisp paper white with deep forest green accents.
                </p>

                <div className="mt-3 pt-2.5 border-t border-border-subtle/70 flex items-center justify-between text-[11px] text-text-muted">
                  <span>Color palette</span>
                  <span className="font-medium text-text-primary px-1.5 py-0.5 rounded bg-bg-subtle">
                    High contrast paper
                  </span>
                </div>
              </div>

              {/* Dark Mode Option */}
              <div
                onClick={() => setMode('dark')}
                className={`relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                  mode === 'dark'
                    ? 'border-brand-green bg-brand-green-light/40 shadow-xs ring-1 ring-brand-green/30'
                    : 'border-border-subtle hover:border-border-medium bg-bg-surface hover:bg-bg-subtle/50'
                }`}
              >
                {/* Visual Preview */}
                <div className="h-24 w-full rounded-lg mb-3 border border-slate-700 overflow-hidden flex flex-col bg-[#0d1117] shadow-2xs">
                  <div className="h-4 bg-[#043d2e] flex items-center px-2 gap-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                  <div className="flex-1 flex">
                    <div className="w-1/3 bg-[#161b22] border-r border-slate-800 p-1.5 flex flex-col gap-1">
                      <div className="h-1.5 w-3/4 rounded-xs bg-[#34d399]/40" />
                      <div className="h-1.5 w-1/2 rounded-xs bg-slate-700" />
                    </div>
                    <div className="flex-1 bg-[#161b22] p-2 flex flex-col gap-1">
                      <div className="h-1.5 w-5/6 rounded-xs bg-slate-600" />
                      <div className="h-1.5 w-4/6 rounded-xs bg-slate-700" />
                      <div className="h-1.5 w-3/6 rounded-xs bg-slate-700" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[13.5px] text-text-primary flex items-center gap-2">
                    <Moon size={16} className="text-indigo-400" />
                    Dark Mode
                  </span>
                  {mode === 'dark' && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-green text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <p className="text-[12px] text-text-muted leading-relaxed">
                  Deep charcoal surface engineered for late-night editing sessions.
                </p>

                <div className="mt-3 pt-2.5 border-t border-border-subtle/70 flex items-center justify-between text-[11px] text-text-muted">
                  <span>Color palette</span>
                  <span className="font-medium text-text-primary px-1.5 py-0.5 rounded bg-bg-subtle">
                    Reduced glare dark
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional details */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-start gap-3.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-info-bg text-info shrink-0 mt-0.5">
              <Info size={16} />
            </div>
            <div className="text-[12.5px] text-text-muted leading-relaxed">
              <p className="text-text-primary font-medium mb-0.5">
                Native Window Integration
              </p>
              Your chosen theme immediately updates the desktop application chrome, editor gutters,
              PDF viewer background, and native macOS window titlebar decorations. Settings are
              saved automatically to your local storage.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Providers & Models */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[16px] font-semibold text-text-primary">
                  Active AI Provider
                </h2>
                <p className="text-[12.5px] text-text-muted mt-0.5">
                  Select a local CLI assistant or connect to an OpenAI-compatible server.
                </p>
              </div>
              <button
                type="button"
                onClick={checkAvailability}
                disabled={isCheckingAvailability}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  size={12}
                  className={isCheckingAvailability ? 'animate-spin' : ''}
                />
                <span>Check Installed CLIs</span>
              </button>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
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
                    className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-brand-green bg-brand-green-light/40 shadow-xs ring-1 ring-brand-green/30'
                        : 'border-border-subtle hover:border-border-medium bg-bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="font-semibold text-[13.5px] text-text-primary flex items-center gap-2">
                        {p.id === 'openai' ? <Globe size={15} /> : <Terminal size={15} />}
                        {p.name}
                      </span>
                      {p.id === 'openai' ? (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-info-bg text-info font-mono font-medium">
                          HTTP
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            isAvailable
                              ? 'bg-success-bg text-success'
                              : 'bg-bg-subtle text-text-muted'
                          }`}
                        >
                          {isAvailable ? (
                            <>
                              <CheckCircle2 size={11} /> Installed
                            </>
                          ) : (
                            <>
                              <XCircle size={11} /> Not found
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-text-muted leading-normal">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Model Configuration */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
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
                    className="flex-1 px-3 py-2 bg-bg-app text-text-primary placeholder:text-text-muted border border-border-subtle rounded-md text-[13px] focus:outline-none focus:border-brand-green font-mono"
                  />
                  {currentSuggestions.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setModel(e.target.value);
                      }}
                      className="px-3 py-2 bg-bg-app border border-border-subtle rounded-md text-[12px] text-text-secondary cursor-pointer focus:outline-none focus:border-brand-green"
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
                <p className="text-[11.5px] text-text-muted mt-1.5">
                  Leave empty to let the provider CLI use its own default model.
                </p>
              </div>

              {/* Endpoint configuration for OpenAI compatible */}
              {provider === 'openai' && (
                <div className="p-4 rounded-xl bg-bg-app border border-border-subtle space-y-3.5">
                  <div className="flex items-center gap-2 font-medium text-text-primary text-[13px]">
                    <Globe size={15} className="text-text-brand" />
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
                      className="w-full px-3 py-1.5 bg-bg-surface text-text-primary placeholder:text-text-muted border border-border-subtle rounded text-[12.5px] font-mono focus:outline-none focus:border-brand-green"
                    />
                    <p className="text-[11px] text-text-muted mt-1">
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
                      className="w-full px-3 py-1.5 bg-bg-surface text-text-primary placeholder:text-text-muted border border-border-subtle rounded text-[12.5px] font-mono focus:outline-none focus:border-brand-green"
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
                    className="w-32 px-3 py-1.5 bg-bg-app text-text-primary placeholder:text-text-muted border border-border-subtle rounded-md text-[13px] font-mono focus:outline-none focus:border-brand-green"
                  />
                  <span className="text-[11.5px] text-text-muted">
                    0 = use smart automatic timeout (3 to 10 minutes)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 flex items-center justify-between text-[12px] text-text-muted">
            <span className="flex items-center gap-2">
              <Shield size={14} className="text-text-brand" />
              CLI providers execute locally without sending credentials to third-party cloud servers.
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: AI System Instructions */}
      {activeSubTab === 'instructions' && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[16px] font-semibold text-text-primary">
                  Assistant System Instructions
                </h2>
                <p className="text-[12.5px] text-text-muted mt-0.5">
                  These instructions are prepended to every prompt sent to your AI assistant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomInstructions(DEFAULT_INSTRUCTIONS)}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary"
                title="Reset to default prompt"
              >
                <RotateCcw size={12} />
                <span>Reset to Default</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[11px] font-medium text-text-muted self-center mr-1">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => setCustomInstructions(RESUME_PRESET)}
                className="px-2.5 py-1 text-[11.5px] rounded-md border border-border-subtle bg-bg-app text-text-secondary hover:text-text-primary hover:border-brand-green transition-colors cursor-pointer"
              >
                1-Page Resume (STAR)
              </button>
              <button
                type="button"
                onClick={() => setCustomInstructions(ACADEMIC_PRESET)}
                className="px-2.5 py-1 text-[11.5px] rounded-md border border-border-subtle bg-bg-app text-text-secondary hover:text-text-primary hover:border-brand-green transition-colors cursor-pointer"
              >
                Academic Paper & BibTeX
              </button>
            </div>

            <textarea
              rows={8}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Always format work experience with the STAR method. Keep resume to exactly 1 page."
              className="w-full p-3.5 bg-bg-app text-text-primary placeholder:text-text-muted border border-border-subtle rounded-lg text-[12.5px] focus:outline-none focus:border-brand-green font-mono leading-relaxed resize-y"
            />

            <div className="flex justify-between items-center mt-2 text-[11px] text-text-muted">
              <span>{customInstructions.length} characters</span>
              <span>Changes take effect on your next Voyager AI prompt</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
