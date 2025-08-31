export interface WorkspaceData {
  sandboxId: string;
  terminalUrl: string;
  claudeTerminalUrl: string;
  vscodeUrl: string;
  message: string;
}

export interface TerminalPane {
  id: string;
  url: string;
  title: string;
}

export interface TerminalTab {
  id: string;
  title: string;
  terminals: TerminalPane[];
}

import { SandboxState } from '@daytonaio/sdk';

export interface RepositoryWithUrls {
  url: string;
  name: string;
  description?: string;
  tech?: string;
  urls: {
    vscode: string;
    terminal: string;
    claude: string;
  };
  tokens?: {
    vscode: string | null;
    terminal: string | null;
    claude: string | null;
  };
}

export interface CreateWorkspaceResponse {
  sandboxId: string;
  message: string;
  repositories: RepositoryWithUrls[];
  error?: string;
}

export interface WorkspaceStatusResponse {
  status: SandboxState | 'error';
  servicesHealthy: boolean;
  message: string;
}

export interface WorkspaceRestartResponse {
  success: boolean;
  message: string;
  urls?: {
    vscodeUrl: string;
    terminalUrl: string;
    claudeTerminalUrl: string;
  };
}

export type ViewMode = 'vscode' | 'terminals';

export interface WorkspaceViewProps {
  viewMode: ViewMode;
  vscodeUrl: string;
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string | null) => void;
  onAddTab: () => void;
  onRemoveTab: (tabId: string) => void;
  onAddTerminal: () => void;
  onRemoveTerminal: (terminalId: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}

// Simple multi-repository support
export interface Repository {
  id: string;
  url: string;           // Git URL, or empty for default/manual
  name: string;
  description?: string;
  sourceType: 'default' | 'github' | 'manual';
  ports: {
    vscode: number;    // 8080+
    terminal: number;  // 10000+  
    claude: number;    // 4000+
  };
  // Service URLs from Daytona
  serviceUrls?: {
    vscode: string;
    terminal: string;
    claude: string;
  };
  // Preview tokens for accessing private workspaces
  tokens?: {
    vscode: string | null;
    terminal: string | null;
    claude: string | null;
  };
}

export interface UserWorkspace {
  id: string;
  sandboxId: string;
  repositories: Repository[];
  status: 'creating' | 'running' | 'stopped' | 'error';
  createdAt: Date;
  updatedAt: Date;
}