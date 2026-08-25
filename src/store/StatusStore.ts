//
// DONE!!!
//

import { create } from 'zustand';

interface StatusState {
  text: string;
  setText: (text: string) => void;
  clearText: () => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  text: 'Ready',
  setText: (text: string) => set({ text }),
  clearText: () => set({ text: 'Ready' }),
}));
