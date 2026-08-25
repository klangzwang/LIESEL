import { create } from 'zustand';
import { useEffect } from 'react';

export type LLMEngineStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'starting'
  | 'ready'
  | 'error'
  | 'developer';

export interface DownloadProgress {
  percent: number;       // -1 if unknown
  downloadedBytes: number;
  totalBytes: number | null;
}

export interface LLMEngineState {
  status: LLMEngineStatus;
  message: string;
  downloadProgress: DownloadProgress | null;
  done: boolean;
  /** Call this to retry after an error */
  retry: () => void;
  /** Internal initialization */
  init: () => void;
}

const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

let isBootstrapping = false;
let activeUnlisteners: Array<() => void> = [];

const isDevStatus = true;

// ─── Global Zustand Store ─────────────────────────────────────────────────────

export const useLLMEngineStore = create<LLMEngineState>((set, get) => ({
  status: 'idle',
  message: 'Initializing...',
  downloadProgress: null,
  done: false,
  init: () => {
    if (isBootstrapping || get().status !== 'idle') {
      return;
    }
    isBootstrapping = true;

    if (isDevStatus) {
      set({ status: 'developer', message: 'LLM engine not ready (Dev Mode)' });
      isBootstrapping = false;
      return;
    }

    if (!isTauri()) {
      set({ status: 'checking', message: 'Checking model...', downloadProgress: null, done: true });

      setTimeout(() => {
        set({ status: 'downloading', message: 'Downloading model (Mock Web Mode)...' });
        let percent = 0;
        const totalBytes = 1000000000;

        const interval = setInterval(() => {
          percent += 2;
          if (percent >= 100) {
            clearInterval(interval);
            set({ status: 'starting', message: 'Starting llama-server...' });
            setTimeout(() => {
              set({ status: 'ready', message: 'LLM engine ready' });
              isBootstrapping = false;
            }, 500);
          } else {
            set({
              downloadProgress: {
                percent,
                downloadedBytes: (percent / 100) * totalBytes,
                totalBytes,
              },
            });
          }
        }, 100);
      }, 500);

      return;
    }

    // Tauri Native Mode
    set({ status: 'checking', message: 'Checking model...', downloadProgress: null, done: false });

    (async () => {
      try {
        // Clean up previous listeners if any
        activeUnlisteners.forEach((fn) => fn());
        activeUnlisteners = [];

        // @ts-ignore
        const { invoke } = await import(/* @vite-ignore */ '@tauri-apps/api/core');
        // @ts-ignore
        const { listen } = await import(/* @vite-ignore */ '@tauri-apps/api/event');

        // 1. Listen for progress / status events from Rust
        const unProgress = await listen(
          'llm-download-progress',
          (event: { payload: { percent: number; downloaded_bytes: number; total_bytes: number | null } }) => {
            set({
              status: 'downloading',
              downloadProgress: {
                percent: event.payload.percent,
                downloadedBytes: event.payload.downloaded_bytes,
                totalBytes: event.payload.total_bytes,
              },
            });
          }
        );
        activeUnlisteners.push(unProgress as () => void);

        const unStatus = await listen(
          'llm-status',
          (event: { payload: { status: string; message: string } }) => {
            const s = event.payload.status as LLMEngineStatus;
            if (['checking', 'downloading', 'starting', 'ready', 'error'].includes(s)) {
              set({ status: s, message: event.payload.message });
            } else {
              set({ message: event.payload.message });
            }
          }
        );
        activeUnlisteners.push(unStatus as () => void);

        // 2. Check if model file already exists
        const modelPresent = await invoke('llm_check_model');

        if (!modelPresent) {
          // 3a. Download model (emits events while running)
          set({ status: 'downloading', message: 'Downloading model (~1 GB)...' });
          await invoke('llm_download_model');
        } else {
          set({ done: true });
        }

        // 4. Start server
        set({ status: 'starting', message: 'Starting llama-server...' });
        await invoke('llm_start_server');

        set({ status: 'ready', message: 'LLM engine ready' });
      } catch (err) {
        set({
          status: 'error',
          message: typeof err === 'string' ? err : (err as Error)?.message || 'Unknown error',
        });
      } finally {
        isBootstrapping = false;
      }
    })();
  },

  retry: () => {
    isBootstrapping = false;
    set({ status: 'idle', message: 'Retrying...', downloadProgress: null });
    get().init();
  },
}));

// Hook for components to access the singleton engine state
export function useLLMEngine(): LLMEngineState {
  const store = useLLMEngineStore();

  useEffect(() => {
    if (store.status === 'idle') {
      store.init();
    }
  }, [store.status, store.init]);

  return store;
}
