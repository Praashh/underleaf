import { create } from 'zustand';
import { getCurrentWindow } from '@tauri-apps/api/window';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'underleaf_theme_v1';
const LIGHT_THEME_COLOR = '#026046';
const DARK_THEME_COLOR = '#043d2e';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function loadStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
  } catch {
    // Ignore storage read errors
  }
  return 'system';
}

function saveStoredTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage write errors
  }
}

function syncNativeWindowTheme(mode: ThemeMode) {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return;
  }
  try {
    void getCurrentWindow()
      .setTheme(mode === 'system' ? null : mode)
      .catch(() => {
        // Ignore if unsupported on current platform
      });
  } catch {
    // Ignore outside Tauri runtime
  }
}

function applyThemeToDOM(mode: ThemeMode, resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      resolved === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
    );
  }

  syncNativeWindowTheme(mode);
}

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const initialMode = loadStoredTheme();
const initialResolved = resolveTheme(initialMode);

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolvedTheme: initialResolved,

  setMode: (mode) => {
    const resolved = resolveTheme(mode);
    saveStoredTheme(mode);
    applyThemeToDOM(mode, resolved);
    set({ mode, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().resolvedTheme === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },
}));

let initialized = false;

export function initTheme() {
  const { mode, resolvedTheme } = useThemeStore.getState();
  applyThemeToDOM(mode, resolvedTheme);

  if (initialized || typeof window === 'undefined' || !window.matchMedia) {
    return;
  }
  initialized = true;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    const current = useThemeStore.getState();
    if (current.mode === 'system') {
      const resolved = getSystemTheme();
      applyThemeToDOM('system', resolved);
      useThemeStore.setState({ resolvedTheme: resolved });
    }
  };

  mediaQuery.addEventListener('change', handleSystemChange);
}
