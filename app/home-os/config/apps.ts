export interface AppConfig {
  id: string;
  name: string;
  type: 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal';
  title: string;
  description: string;
  iconUrl?: string;
  comingSoon?: boolean;
}

export const APPS: AppConfig[] = [
  {
    id: 'vscode',
    name: 'VSCode',
    type: 'vscode',
    title: 'VSCode - Code Editor',
    description: 'Visual Studio Code editor for development',
    iconUrl: 'vscode-icon'
  },
  {
    id: 'claude',
    name: 'Claude Code',
    type: 'claude',
    title: 'Claude Code - AI Assistant',
    description: 'AI-powered coding assistant',
    iconUrl: 'claude-icon'
  },
  {
    id: 'diff',
    name: 'Code Diff',
    type: 'diff',
    title: 'Code Diff - Compare Files',
    description: 'Visual diff tool for comparing code changes',
    comingSoon: true
  },
  {
    id: 'settings',
    name: 'Settings',
    type: 'settings',
    title: 'Settings - App Configuration',
    description: 'Application settings and user profile'
  },
  {
    id: 'terminal',
    name: 'Terminal',
    type: 'terminal',
    title: 'Terminal - Command Line',
    description: 'Command line interface'
  }
];

export const getAppConfig = (type: string): AppConfig | undefined => {
  return APPS.find(app => app.type === type);
};

export const getAvailableApps = (): AppConfig[] => {
  return APPS.filter(app => !app.comingSoon);
};

export const getComingSoonApps = (): AppConfig[] => {
  return APPS.filter(app => app.comingSoon);
};