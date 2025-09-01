import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { WINDOW_Z_INDEX_BASE, WINDOW_Z_INDEX_MAX } from '../constants/layout';

export interface Window {
  id: string;
  type: 'vscode' | 'claude' | 'gemini' | 'diff' | 'settings' | 'terminal' | 'setup';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
  content?: string; // For dummy content
  isAnimating?: boolean; // For window animations
  previousState?: { // Store previous state for restore
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  // Repository-specific data
  repositoryName?: string;
  repositoryUrl?: string; // vscode URL, terminal URL, or claude URL
  terminalPort?: number;
  claudePort?: number;
  geminiPort?: number;
  vscodePort?: number;
}

interface Repository {
  url: string;
  name: string;
  description?: string;
  tech?: string;
  urls?: {
    vscode: string;
    terminal: string;
    claude: string;
    gemini: string;
  };
  ports?: {
    vscode: number;
    terminal: number;
    claude: number;
    gemini: number;
  };
}

interface WorkspaceData {
  repositories: Repository[];
}

interface WindowStore {
  windows: Window[];
  nextZIndex: number;
  activeWindowId: string | null;
  onboardingCompleted: boolean;
  workspaceData: WorkspaceData | null;
  
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
  setWindowAnimating: (id: string, isAnimating: boolean) => void;
  initializeWindows: (workspaceData?: WorkspaceData) => void;
  completeOnboarding: () => void;
  setWorkspaceData: (workspaceData: WorkspaceData | null) => void;
}

export const useWindowStore = create<WindowStore>()(
  subscribeWithSelector((set) => ({
    windows: [],
    nextZIndex: WINDOW_Z_INDEX_BASE,
    activeWindowId: null,
    onboardingCompleted: false,
    workspaceData: null,

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
        w.id === id ? { 
          ...w, 
          maximized: true,
          previousState: {
            position: { ...w.position },
            size: { ...w.size }
          }
        } : w
      ),
    })),

    restoreWindow: (id) => set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        
        // If we have previous state, restore it
        if (w.previousState) {
          return {
            ...w,
            minimized: false,
            maximized: false,
            position: { ...w.previousState.position },
            size: { ...w.previousState.size },
            previousState: undefined
          };
        }
        
        // Otherwise just unset the flags
        return { ...w, minimized: false, maximized: false };
      }),
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

    setWindowAnimating: (id, isAnimating) => set((state) => ({
      windows: state.windows.map((w) => 
        w.id === id ? { ...w, isAnimating } : w
      ),
    })),

    initializeWindows: (workspaceData?: WorkspaceData) => set(() => {
      let newWindows: Window[] = [];
      let zIndex = WINDOW_Z_INDEX_BASE;
      
      if (workspaceData?.repositories && workspaceData.repositories.length > 0) {
        // Create 3 windows per repository: VSCode, Claude terminal, regular terminal
        workspaceData.repositories.forEach((repo, repoIndex) => {
          const baseX = 50 + (repoIndex * 100); // Offset X for each repository
          const baseY = 50 + (repoIndex * 80);  // Offset Y for each repository
          
          // VSCode window
          newWindows.push({
            id: `vscode-${repo.name}-${Date.now()}`,
            type: 'vscode',
            title: `VSCode - ${repo.name}`,
            position: { x: baseX, y: baseY },
            size: { width: 1000, height: 700 },
            zIndex: zIndex++,
            minimized: false,
            maximized: false,
            focused: repoIndex === 0, // Focus first repo's VSCode
            repositoryName: repo.name,
            repositoryUrl: repo.urls?.vscode || '',
            vscodePort: repo.ports?.vscode
          });
          
          // Claude terminal window
          newWindows.push({
            id: `claude-${repo.name}-${Date.now()}`,
            type: 'claude',
            title: `Claude - ${repo.name}`,
            position: { x: baseX + 300, y: baseY + 100 },
            size: { width: 600, height: 400 },
            zIndex: zIndex++,
            minimized: false,
            maximized: false,
            focused: false,
            repositoryName: repo.name,
            repositoryUrl: repo.urls?.claude || '',
            claudePort: repo.ports?.claude,
            geminiPort: repo.ports?.gemini
          });
          
          // Regular terminal window
          newWindows.push({
            id: `terminal-${repo.name}-${Date.now()}`,
            type: 'terminal',
            title: `Terminal - ${repo.name}`,
            position: { x: baseX + 150, y: baseY + 200 },
            size: { width: 700, height: 350 },
            zIndex: zIndex++,
            minimized: false,
            maximized: false,
            focused: false,
            repositoryName: repo.name,
            repositoryUrl: repo.urls?.terminal || '',
            terminalPort: repo.ports?.terminal
          });
        });
      } else {
        // Fallback to default windows if no repository data
        newWindows = [
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
        ];
        zIndex = WINDOW_Z_INDEX_BASE + 3;
      }
      
      return {
        windows: newWindows,
        nextZIndex: zIndex,
        activeWindowId: newWindows.find(w => w.focused)?.id || newWindows[0]?.id || null,
        workspaceData,
      };
    }),

    completeOnboarding: () => set(() => ({
      onboardingCompleted: true,
    })),

    setWorkspaceData: (workspaceData) => set(() => ({
      workspaceData,
    })),
  }))
);