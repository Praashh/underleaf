import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useAISettingsStore } from '../store/aiSettingsStore';

export interface AiProgressPayload {
  key: string;
  provider: string;
  phase: 'starting' | 'thinking' | 'writing' | 'complete';
  message: string;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cachedTokens?: number | null;
}

export interface AiChunkPayload {
  key: string;
  delta: string;
}

export interface AiCompletePayload {
  key: string;
  ok: boolean;
  output?: string | null;
  error?: string | null;
  costUsd?: number | null;
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onProgress?: (progress: AiProgressPayload) => void;
  onComplete: (complete: AiCompletePayload) => void;
  onError: (error: string) => void;
}

export async function startAiStream(
  prompt: string,
  callbacks: StreamCallbacks,
  cwd?: string
): Promise<{ key: string; cancel: () => Promise<void> }> {
  const key = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const settings = useAISettingsStore.getState();
  settings.setActiveTaskId(key);

  const unlistenList: UnlistenFn[] = [];
  let isDone = false;

  const cleanup = () => {
    isDone = true;
    settings.setActiveTaskId(null);
    unlistenList.forEach((un) => un());
    unlistenList.length = 0;
  };

  const unChunk = await listen<AiChunkPayload>('ai:chunk', (event) => {
    if (event.payload.key === key && !isDone && event.payload.delta) {
      callbacks.onChunk(event.payload.delta);
    }
  });
  unlistenList.push(unChunk);

  const unProgress = await listen<AiProgressPayload>('ai:progress', (event) => {
    if (event.payload.key === key && !isDone) {
      callbacks.onProgress?.(event.payload);
    }
  });
  unlistenList.push(unProgress);

  const unComplete = await listen<AiCompletePayload>('ai:complete', (event) => {
    if (event.payload.key === key && !isDone) {
      cleanup();
      if (event.payload.ok) {
        callbacks.onComplete(event.payload);
      } else {
        callbacks.onError(event.payload.error || 'The model stopped without an answer.');
      }
    }
  });
  unlistenList.push(unComplete);

  const unDone = await listen<{ key: string; canceled?: boolean }>('ai:done', (event) => {
    if (event.payload.key === key && event.payload.canceled && !isDone) {
      cleanup();
      callbacks.onError('Generation was canceled.');
    }
  });
  unlistenList.push(unDone);

  try {
    await invoke('ai_stream', {
      key,
      provider: settings.provider,
      prompt,
      cwd: cwd || null,
      baseUrl: settings.baseUrl || null,
      model: settings.model || null,
      apiKey: settings.apiKey || null,
      timeoutSecs: settings.timeoutSecs > 0 ? settings.timeoutSecs : null,
    });
  } catch (err) {
    cleanup();
    callbacks.onError(String(err));
  }

  const cancel = async () => {
    cleanup();
    try {
      await invoke('ai_cancel', { key });
    } catch {}
  };

  return { key, cancel };
}

export async function cancelAiStream(key: string): Promise<void> {
  try {
    await invoke('ai_cancel', { key });
  } catch (err) {
    console.error('Failed to cancel AI task', err);
  }
}

