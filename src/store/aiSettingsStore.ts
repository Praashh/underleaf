import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type AIProvider = 'claude' | 'gemini' | 'agy' | 'opencode' | 'codex' | 'openai';

export interface ProviderMeta {
  id: AIProvider;
  name: string;
  badge: string;
  description: string;
}

export const PROVIDERS_LIST: ProviderMeta[] = [
  { id: 'claude', name: 'Claude CLI', badge: 'claude', description: 'Anthropic Claude Code CLI' },
  { id: 'agy', name: 'Antigravity CLI', badge: 'agy', description: 'Google DeepMind Antigravity CLI' },
  { id: 'gemini', name: 'Gemini CLI', badge: 'gemini', description: 'Google Gemini Developer CLI' },
  { id: 'opencode', name: 'OpenCode CLI', badge: 'opencode', description: 'OpenCode Agent CLI' },
  { id: 'codex', name: 'Codex CLI', badge: 'codex', description: 'OpenAI Codex CLI' },
  { id: 'openai', name: 'OpenAI-Compatible', badge: 'http', description: 'Ollama, LM Studio, Groq, OpenRouter, OpenAI' },
];

export const MODEL_SUGGESTIONS: Record<AIProvider, string[]> = {
  claude: ['claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
  agy: ['gemini-3.8-flash-high', 'gemini-3.8-flash-medium', 'gemini-3.8-flash-low'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  opencode: ['gpt-4o', 'claude-3-5-sonnet', 'deepseek-r1'],
  codex: ['gpt-5-codex', 'gpt-4o', 'o3-mini'],
  openai: ['llama3.2', 'deepseek-r1', 'gpt-4o', 'mistral'],
};

interface AISettingsState {
  provider: AIProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  timeoutSecs: number;
  customInstructions: string;
  isAiPanelOpen: boolean;
  activeTaskId: string | null;
  availableProviders: Record<AIProvider, boolean>;
  isCheckingAvailability: boolean;

  setProvider: (provider: AIProvider) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setTimeoutSecs: (secs: number) => void;
  setCustomInstructions: (instructions: string) => void;
  setIsAiPanelOpen: (open: boolean) => void;
  toggleAiPanel: () => void;
  setActiveTaskId: (id: string | null) => void;
  checkAvailability: () => Promise<void>;
}

const STORAGE_KEY = 'underleaf_ai_settings_v1';

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load AI settings from localStorage', e);
  }
  return null;
}

const saved = loadStoredSettings() || {};

export const useAISettingsStore = create<AISettingsState>((set, get) => ({
  provider: saved.provider || 'claude',
  model: saved.model || '',
  baseUrl: saved.baseUrl || 'http://localhost:11434/v1',
  apiKey: saved.apiKey || '',
  timeoutSecs: saved.timeoutSecs || 0,
  customInstructions:
    saved.customInstructions ||
    'Format all resume entries cleanly. Use standard packages (article, geometry, enumitem, hyperref, tabularx). When proposing code improvements, wrap them in <action> tags.',
  isAiPanelOpen: false,
  activeTaskId: null,
  availableProviders: {
    claude: false,
    agy: false,
    gemini: false,
    opencode: false,
    codex: false,
    openai: true,
  },
  isCheckingAvailability: false,

  setProvider: (provider) => {
    set({ provider });
    saveSettings({ ...get(), provider });
  },
  setModel: (model) => {
    set({ model });
    saveSettings({ ...get(), model });
  },
  setBaseUrl: (baseUrl) => {
    set({ baseUrl });
    saveSettings({ ...get(), baseUrl });
  },
  setApiKey: (apiKey) => {
    set({ apiKey });
    saveSettings({ ...get(), apiKey });
  },
  setTimeoutSecs: (timeoutSecs) => {
    set({ timeoutSecs });
    saveSettings({ ...get(), timeoutSecs });
  },
  setCustomInstructions: (customInstructions) => {
    set({ customInstructions });
    saveSettings({ ...get(), customInstructions });
  },
  setIsAiPanelOpen: (isAiPanelOpen) => set({ isAiPanelOpen }),
  toggleAiPanel: () => set((s) => ({ isAiPanelOpen: !s.isAiPanelOpen })),
  setActiveTaskId: (activeTaskId) => set({ activeTaskId }),

  checkAvailability: async () => {
    set({ isCheckingAvailability: true });
    const providers: AIProvider[] = ['claude', 'agy', 'gemini', 'opencode', 'codex', 'openai'];
    const results: Record<AIProvider, boolean> = {
      claude: false,
      agy: false,
      gemini: false,
      opencode: false,
      codex: false,
      openai: true,
    };

    await Promise.all(
      providers.map(async (p) => {
        try {
          const avail = await invoke<boolean>('ai_available', { provider: p });
          results[p] = avail;
        } catch {
          results[p] = p === 'openai';
        }
      })
    );

    set({ availableProviders: results, isCheckingAvailability: false });
  },
}));

function saveSettings(state: AISettingsState) {
  try {
    const toSave = {
      provider: state.provider,
      model: state.model,
      baseUrl: state.baseUrl,
      apiKey: state.apiKey,
      timeoutSecs: state.timeoutSecs,
      customInstructions: state.customInstructions,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save AI settings to localStorage', e);
  }
}

