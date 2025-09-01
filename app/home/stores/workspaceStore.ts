import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { WINDOW_Z_INDEX_BASE } from '../constants/layout';
import type { Window } from './windowStore';
import { AppStore } from '../apps';

export interface Repository {
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

export interface Workspace {
  id: string;
  name: string;
  repository: Repository;
  windows: Window[];
  nextZIndex: number;
  activeWindowId: string | null;
  isInitialized: boolean;
}

export interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  sandboxId: string | null; // Current sandbox ID for status checking
  
  // Workspace management
  createWorkspace: (repository: Repository) => string;
  switchToWorkspace: (workspaceId: string) => void;
  removeWorkspace: (workspaceId: string) => void;
  getActiveWorkspace: () => Workspace | null;
  getWorkspace: (workspaceId: string) => Workspace | null;
  setSandboxId: (sandboxId: string | null) => void;
  
  // Window management for active workspace
  addWindow: (window: Omit<Window, 'id' | 'zIndex'>) => void;
  removeWindow: (windowId: string) => void;
  updateWindow: (windowId: string, updates: Partial<Window>) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  moveWindow: (windowId: string, x: number, y: number) => void;
  resizeWindow: (windowId: string, width: number, height: number) => void;
  setWindowAnimating: (windowId: string, isAnimating: boolean) => void;
  
  // Workspace initialization
  initializeWorkspaces: (repositories: Repository[]) => void;
  initializeWorkspaceWindows: (workspaceId: string) => void;
  updateWorkspaceUrls: (repositories: Repository[]) => void;
  
  // Reset
  reset: () => void;
}

const createDefaultWindows = (repository: Repository): Window[] => {
  const baseX = 50;
  const baseY = 50;
  let zIndex = WINDOW_Z_INDEX_BASE;
  const windows: Window[] = [];
  let xOffset = 0;
  let yOffset = 0;
  
  // Check each app's metadata to determine if it should open at startup
  // Only create windows for apps that:
  // 1. Are not fully hidden
  // 2. Have isOpenAtStartup flag set to true (or undefined for backward compatibility)
  
  const vscodeApp = AppStore.vscode;
  const claudeApp = AppStore.claude;
  const terminalApp = AppStore.terminal;
  
  // VSCode window - only if not hidden and should open at startup
  if (!vscodeApp.metadata.isFullyHidden && vscodeApp.metadata.isOpenAtStartup !== false) {
    windows.push({
      id: `vscode-${repository.name}-${Date.now()}`,
      type: 'vscode' as const,
      title: `VSCode - ${repository.name}`,
      position: { x: baseX + xOffset, y: baseY + yOffset },
      size: { width: 1000, height: 700 },
      zIndex: zIndex++,
      minimized: false,
      maximized: false,
      focused: windows.length === 0, // First window gets focus
      repositoryName: repository.name,
      repositoryUrl: repository.urls?.vscode || '',
      vscodePort: repository.ports?.vscode
    });
    xOffset += 150;
    yOffset += 100;
  }
  
  // Claude terminal window - only if not hidden and should open at startup
  if (!claudeApp.metadata.isFullyHidden && claudeApp.metadata.isOpenAtStartup !== false) {
    windows.push({
      id: `claude-${repository.name}-${Date.now()}`,
      type: 'claude' as const,
      title: `Claude - ${repository.name}`,
      position: { x: baseX + xOffset, y: baseY + yOffset },
      size: { width: 600, height: 400 },
      zIndex: zIndex++,
      minimized: false,
      maximized: false,
      focused: windows.length === 0, // First window gets focus
      repositoryName: repository.name,
      repositoryUrl: repository.urls?.claude || '',
      claudePort: repository.ports?.claude,
      geminiPort: repository.ports?.gemini
    });
    xOffset += 150;
    yOffset += 100;
  }
  
  // Regular terminal window - only if not hidden and should open at startup
  if (!terminalApp.metadata.isFullyHidden && terminalApp.metadata.isOpenAtStartup !== false) {
    windows.push({
      id: `terminal-${repository.name}-${Date.now()}`,
      type: 'terminal' as const,
      title: `Terminal - ${repository.name}`,
      position: { x: baseX + xOffset, y: baseY + yOffset },
      size: { width: 700, height: 350 },
      zIndex: zIndex++,
      minimized: false,
      maximized: false,
      focused: windows.length === 0, // First window gets focus
      repositoryName: repository.name,
      repositoryUrl: repository.urls?.terminal || '',
      terminalPort: repository.ports?.terminal
    });
  }
  
  return windows;
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  subscribeWithSelector((set, get) => ({
    workspaces: [],
    activeWorkspaceId: null,
    isLoading: false,
    sandboxId: null,

    createWorkspace: (repository: Repository) => {
      const workspaceId = `workspace-${repository.name.toLowerCase()}-${Date.now()}`;
      const newWorkspace: Workspace = {
        id: workspaceId,
        name: repository.name,
        repository,
        windows: [],
        nextZIndex: WINDOW_Z_INDEX_BASE,
        activeWindowId: null,
        isInitialized: false,
      };

      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        activeWorkspaceId: state.activeWorkspaceId || workspaceId, // Set as active if first workspace
      }));

      return workspaceId;
    },

    switchToWorkspace: (workspaceId: string) => {
      const workspace = get().workspaces.find(w => w.id === workspaceId);
      if (!workspace) return;


      set({ activeWorkspaceId: workspaceId });

      // Initialize workspace windows if not already done
      if (!workspace.isInitialized) {
        get().initializeWorkspaceWindows(workspaceId);
      }
    },

    removeWorkspace: (workspaceId: string) => {
      set((state) => {
        const newWorkspaces = state.workspaces.filter(w => w.id !== workspaceId);
        let newActiveId = state.activeWorkspaceId;

        // If we're removing the active workspace, switch to another one
        if (state.activeWorkspaceId === workspaceId) {
          newActiveId = newWorkspaces.length > 0 ? newWorkspaces[0].id : null;
        }

        return {
          workspaces: newWorkspaces,
          activeWorkspaceId: newActiveId,
        };
      });
    },

    getActiveWorkspace: () => {
      const state = get();
      return state.workspaces.find(w => w.id === state.activeWorkspaceId) || null;
    },

    getWorkspace: (workspaceId: string) => {
      return get().workspaces.find(w => w.id === workspaceId) || null;
    },

    // Window management methods - operate on active workspace
    addWindow: (windowData) => {
      const activeWorkspace = get().getActiveWorkspace();
      if (!activeWorkspace) return;

      const windowId = `window-${Date.now()}`;
      const newWindow: Window = {
        ...windowData,
        id: windowId,
        zIndex: activeWorkspace.nextZIndex,
      };

      set((state) => ({
        workspaces: state.workspaces.map(workspace => 
          workspace.id === activeWorkspace.id 
            ? {
                ...workspace,
                windows: [...workspace.windows, newWindow],
                nextZIndex: workspace.nextZIndex + 1,
                activeWindowId: windowId,
              }
            : workspace
        ),
      }));
    },

    removeWindow: (windowId: string) => {
      const activeWorkspace = get().getActiveWorkspace();
      if (!activeWorkspace) return;

      set((state) => ({
        workspaces: state.workspaces.map(workspace => 
          workspace.id === activeWorkspace.id 
            ? {
                ...workspace,
                windows: workspace.windows.filter(w => w.id !== windowId),
                activeWindowId: workspace.activeWindowId === windowId ? null : workspace.activeWindowId,
              }
            : workspace
        ),
      }));
    },

    updateWindow: (windowId: string, updates: Partial<Window>) => {
      const activeWorkspace = get().getActiveWorkspace();
      if (!activeWorkspace) return;

      set((state) => ({
        workspaces: state.workspaces.map(workspace => 
          workspace.id === activeWorkspace.id 
            ? {
                ...workspace,
                windows: workspace.windows.map(w => 
                  w.id === windowId ? { ...w, ...updates } : w
                ),
              }
            : workspace
        ),
      }));
    },

    focusWindow: (windowId: string) => {
      const activeWorkspace = get().getActiveWorkspace();
      if (!activeWorkspace) return;

      const maxZ = Math.max(...activeWorkspace.windows.map(w => w.zIndex));
      const newZIndex = maxZ + 1;

      set((state) => ({
        workspaces: state.workspaces.map(workspace => 
          workspace.id === activeWorkspace.id 
            ? {
                ...workspace,
                windows: workspace.windows.map(w => ({
                  ...w,
                  focused: w.id === windowId,
                  zIndex: w.id === windowId ? newZIndex : w.zIndex,
                })),
                nextZIndex: newZIndex + 1,
                activeWindowId: windowId,
              }
            : workspace
        ),
      }));
    },

    minimizeWindow: (windowId: string) => {
      get().updateWindow(windowId, { minimized: true, focused: false });
    },

    maximizeWindow: (windowId: string) => {
      const activeWorkspace = get().getActiveWorkspace();
      if (!activeWorkspace) return;

      const window = activeWorkspace.windows.find(w => w.id === windowId);
      if (!window) return;

      get().updateWindow(windowId, {
        maximized: true,
        previousState: {
          position: { ...window.position },
          size: { ...window.size }
        }
      });
    },

    restoreWindow: (windowId: string) => {
      const activeWorkspace = get().getActiveWorkspace();
      if (!activeWorkspace) return;

      const window = activeWorkspace.windows.find(w => w.id === windowId);
      if (!window) return;

      const updates: Partial<Window> = {
        minimized: false,
        maximized: false,
      };

      // Restore previous state if available
      if (window.previousState) {
        updates.position = { ...window.previousState.position };
        updates.size = { ...window.previousState.size };
        updates.previousState = undefined;
      }

      get().updateWindow(windowId, updates);
    },

    moveWindow: (windowId: string, x: number, y: number) => {
      get().updateWindow(windowId, { position: { x, y } });
    },

    resizeWindow: (windowId: string, width: number, height: number) => {
      get().updateWindow(windowId, { size: { width, height } });
    },

    setWindowAnimating: (windowId: string, isAnimating: boolean) => {
      get().updateWindow(windowId, { isAnimating });
    },

    initializeWorkspaces: (repositories: Repository[]) => {
      set({ isLoading: true });

      const newWorkspaces: Workspace[] = repositories.map(repository => ({
        id: `workspace-${repository.name.toLowerCase()}-${Date.now()}`,
        name: repository.name,
        repository,
        windows: [],
        nextZIndex: WINDOW_Z_INDEX_BASE,
        activeWindowId: null,
        isInitialized: false,
      }));

      set({
        workspaces: newWorkspaces,
        activeWorkspaceId: newWorkspaces.length > 0 ? newWorkspaces[0].id : null,
        isLoading: false,
      });

      // Initialize the first workspace
      if (newWorkspaces.length > 0) {
        get().initializeWorkspaceWindows(newWorkspaces[0].id);
      }
    },

    initializeWorkspaceWindows: (workspaceId: string) => {
      const workspace = get().getWorkspace(workspaceId);
      if (!workspace || workspace.isInitialized) return;

      const windows = createDefaultWindows(workspace.repository);
      const focusedWindow = windows.find(w => w.focused);

      set((state) => ({
        workspaces: state.workspaces.map(w => 
          w.id === workspaceId 
            ? {
                ...w,
                windows,
                nextZIndex: WINDOW_Z_INDEX_BASE + windows.length,
                activeWindowId: focusedWindow?.id || windows[0]?.id || null,
                isInitialized: true,
              }
            : w
        ),
      }));
    },

    updateWorkspaceUrls: (repositories: Repository[]) => {
      console.log('🔍 DEBUG: updateWorkspaceUrls called with repositories:', repositories.map((r, i) => ({ 
        index: i, 
        name: r.name, 
        ports: r.ports 
      })));
      
      set((state) => {
        console.log('🔍 DEBUG: Current workspaces:', state.workspaces.map(w => ({ 
          name: w.name, 
          repoName: w.repository.name 
        })));
        
        return {
          workspaces: state.workspaces.map(workspace => {
            console.log(`🔍 DEBUG: Looking for repository match for workspace "${workspace.name}" (repo: "${workspace.repository.name}")`);
            
            // Find the matching repository with updated URLs
            const updatedRepo = repositories.find(repo => repo.name === workspace.repository.name);
            console.log(`🔍 DEBUG: Found match:`, updatedRepo ? { 
              name: updatedRepo.name, 
              ports: updatedRepo.ports 
            } : 'NO MATCH');
            
            if (!updatedRepo) {
              console.warn(`⚠️ DEBUG: No repository found for workspace "${workspace.name}" looking for repo "${workspace.repository.name}"`);
              return workspace;
            }

            // Update the workspace's repository URLs
            const updatedWorkspace = {
              ...workspace,
              repository: { ...workspace.repository, urls: updatedRepo.urls }
            };

            // Update all windows in this workspace with new URLs and ports
            const updatedWindows = workspace.windows.map(window => {

              // Update URL and port based on window type
              let newUrl = '';
              const updates: Partial<typeof window> = {};
              
              switch (window.type) {
                case 'vscode':
                  newUrl = updatedRepo.urls?.vscode || '';
                  updates.vscodePort = updatedRepo.ports?.vscode;
                  break;
                case 'claude':
                  newUrl = updatedRepo.urls?.claude || '';
                  updates.claudePort = updatedRepo.ports?.claude;
                  break;
                case 'gemini':
                  newUrl = updatedRepo.urls?.gemini || '';
                  updates.geminiPort = updatedRepo.ports?.gemini;
                  break;
                case 'terminal':
                  newUrl = updatedRepo.urls?.terminal || '';
                  updates.terminalPort = updatedRepo.ports?.terminal;
                  break;
                default:
                  newUrl = window.repositoryUrl || '';
              }

              return { ...window, repositoryUrl: newUrl, ...updates };
            });

            return { ...updatedWorkspace, windows: updatedWindows };
          })
        }
      });
    },

    setSandboxId: (sandboxId: string | null) => {
      set({ sandboxId });
    },

    reset: () => {
      set({
        workspaces: [],
        activeWorkspaceId: null,
        isLoading: false,
        sandboxId: null,
      });
    },
  }))
);