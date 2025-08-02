import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { WINDOW_Z_INDEX_BASE, WINDOW_Z_INDEX_MAX } from '../constants/layout';

export interface Window {
  id: string;
  type: 'vscode' | 'claude' | 'file-manager' | 'terminal' | 'preview';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
  content?: string; // For dummy content
}

interface WindowStore {
  windows: Window[];
  nextZIndex: number;
  activeWindowId: string | null;
  
  // Actions
  addWindow: (window: Omit<Window, 'id' | 'zIndex'>) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  initializeWindows: () => void;
}

export const useWindowStore = create<WindowStore>()(
  subscribeWithSelector((set) => ({
    windows: [],
    nextZIndex: WINDOW_Z_INDEX_BASE,
    activeWindowId: null,

    addWindow: (windowData) => set((state) => {
      const id = `window-${Date.now()}`;
      const zIndex = Math.min(state.nextZIndex, WINDOW_Z_INDEX_MAX);
      const newWindow: Window = {
        ...windowData,
        id,
        zIndex,
      };
      return {
        windows: [...state.windows, newWindow],
        nextZIndex: Math.min(state.nextZIndex + 1, WINDOW_Z_INDEX_MAX),
        activeWindowId: id,
      };
    }),

    removeWindow: (id) => set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),

    updateWindow: (id, updates) => set((state) => ({
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

    focusWindow: (id) => set((state) => {
      const maxZ = Math.max(...state.windows.map((w) => w.zIndex));
      const newZIndex = Math.min(maxZ + 1, WINDOW_Z_INDEX_MAX);
      return {
        windows: state.windows.map((w) => ({
          ...w,
          focused: w.id === id,
          zIndex: w.id === id ? newZIndex : w.zIndex,
        })),
        nextZIndex: Math.min(newZIndex + 1, WINDOW_Z_INDEX_MAX),
        activeWindowId: id,
      };
    }),

    minimizeWindow: (id) => set((state) => ({
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, minimized: true, focused: false } : w
      ),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),

    maximizeWindow: (id) => set((state) => ({
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, maximized: true } : w
      ),
    })),

    restoreWindow: (id) => set((state) => ({
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, minimized: false, maximized: false } : w
      ),
    })),

    moveWindow: (id, x, y) => set((state) => ({
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, position: { x, y } } : w
      ),
    })),

    resizeWindow: (id, width, height) => set((state) => ({
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, size: { width, height } } : w
      ),
    })),

    initializeWindows: () => set(() => ({
      windows: [
        {
          id: 'vscode-1',
          type: 'vscode',
          title: 'VSCode - Frontend',
          position: { x: 50, y: 50 },
          size: { width: 800, height: 600 },
          zIndex: WINDOW_Z_INDEX_BASE,
          minimized: false,
          maximized: false,
          focused: true,
          content: '// Welcome to AgentsOS!\\nconst hello = "world";'
        },
        {
          id: 'claude-1',
          type: 'claude',
          title: 'Claude - Full Stack',
          position: { x: 300, y: 150 },
          size: { width: 600, height: 400 },
          zIndex: WINDOW_Z_INDEX_BASE + 1,
          minimized: false,
          maximized: false,
          focused: false,
          content: 'Claude is ready to help!'
        },
        {
          id: 'terminal-1',
          type: 'terminal',
          title: 'Terminal',
          position: { x: 500, y: 250 },
          size: { width: 700, height: 350 },
          zIndex: WINDOW_Z_INDEX_BASE + 2,
          minimized: false,
          maximized: false,
          focused: false,
          content: '$ npm run dev\\n✓ Server running on http://localhost:3000'
        }
      ],
      nextZIndex: WINDOW_Z_INDEX_BASE + 3,
      activeWindowId: 'vscode-1',
    })),
  }))
);