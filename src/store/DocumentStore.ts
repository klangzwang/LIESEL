//
// DONE!!!
//

import { create } from 'zustand';

export interface DocumentState {
  filePath: string | null;
  documentId: string;
  translateToEnglish: boolean;
  setTranslateToEnglish: (val: boolean) => void;
  createNew: () => void;
  openDocument: () => Promise<void>;
  saveDocument: () => Promise<void>;
  closeDocument: () => void;
}

const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  filePath: null,
  documentId: Date.now().toString(),
  translateToEnglish: true,
  setTranslateToEnglish: (val: boolean) => set({ translateToEnglish: val }),

  createNew: () => {
    localStorage.removeItem('prompt-edges');
    localStorage.removeItem('prompt-nodes');
    set({ filePath: null, documentId: Date.now().toString() });
  },

  openDocument: async () => {
    try {
      if (isTauri()) {
        // @ts-ignore
        const { open } = await import(/* @vite-ignore */ '@tauri-apps/plugin-dialog');
        // @ts-ignore
        const { readTextFile } = await import(/* @vite-ignore */ '@tauri-apps/plugin-fs');
        
        const selected = await open({
          multiple: false,
          filters: [{ name: 'Liesel Document', extensions: ['json'] }]
        });
        
        if (selected && typeof selected === 'string') {
          const content = await readTextFile(selected);
          const data = JSON.parse(content);

          if (data.edges) {
             localStorage.setItem('prompt-edges', JSON.stringify(data.edges));
          } else {
             localStorage.removeItem('prompt-edges');
          }
          if (data.nodes) {
             localStorage.setItem('prompt-nodes', JSON.stringify(data.nodes));
          } else {
             localStorage.removeItem('prompt-nodes');
          }
          
          set({ filePath: selected, documentId: Date.now().toString() });
        }
      } else {
        console.log("Mock Open Document");
        set({ filePath: 'mock-document.json', documentId: Date.now().toString() });
      }
    } catch (e) {
      console.error("Failed to open document", e);
    }
  },

  saveDocument: async () => {
    try {
      const state = get();
      const edgesStr = localStorage.getItem('prompt-edges') || '[]';
      const edges = JSON.parse(edgesStr);
      const nodesStr = localStorage.getItem('prompt-nodes') || '[]';
      const nodes = JSON.parse(nodesStr);
      
      const content = JSON.stringify({ edges, nodes }, null, 2);

      if (isTauri()) {
        // @ts-ignore
        const { save } = await import(/* @vite-ignore */ '@tauri-apps/plugin-dialog');
        // @ts-ignore
        const { writeTextFile } = await import(/* @vite-ignore */ '@tauri-apps/plugin-fs');
        
        let path = state.filePath;
        
        if (!path) {
          const selected = await save({
            filters: [{ name: 'Liesel Document', extensions: ['json'] }]
          });
          if (selected) {
            path = selected;
            set({ filePath: path });
          }
        }
        
        if (path) {
          await writeTextFile(path, content);
        }
      } else {
        console.log("Mock Save Document:", content);
        alert("Document would be saved via Tauri.");
      }
    } catch (e) {
      console.error("Failed to save document", e);
    }
  },

  closeDocument: () => {
    set({ filePath: null, documentId: Date.now().toString() });
  }
}));
