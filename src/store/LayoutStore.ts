//
// DONE!!!
//

import { create } from 'zustand';

interface LayoutState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  consoleOpen: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  consoleHeight: number;
  snapToGrid: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleConsole: () => void;
  toggleSnapToGrid: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setConsoleOpen: (open: boolean) => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setConsoleHeight: (height: number) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  consoleOpen: false,
  leftSidebarWidth: 300,
  rightSidebarWidth: 320,
  consoleHeight: 220,
  snapToGrid: true,
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  toggleConsole: () => set((state) => ({ consoleOpen: !state.consoleOpen })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  setConsoleOpen: (open) => set({ consoleOpen: open }),
  setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
  setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
  setConsoleHeight: (height) => set({ consoleHeight: height }),
}));
