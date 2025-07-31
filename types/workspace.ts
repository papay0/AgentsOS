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

export interface CreateWorkspaceResponse {
  sandboxId: string;
  terminalUrl: string;
  claudeTerminalUrl: string;
  vscodeUrl: string;
  message: string;
  error?: string;
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