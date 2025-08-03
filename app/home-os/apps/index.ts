// App Registry - Central place to register all apps
import { AppRegistry, validateApp } from './BaseApp';
import { VSCodeApp } from './VSCodeApp';
import { ClaudeApp } from './ClaudeApp';
import { DiffApp } from './DiffApp';
import { SettingsApp } from './SettingsApp';
import { TerminalApp } from './TerminalApp';

// Register all apps
export const AppStore: AppRegistry = {
  vscode: VSCodeApp,
  claude: ClaudeApp,
  diff: DiffApp,
  settings: SettingsApp,
  terminal: TerminalApp,
};

// Validate all apps at startup (development only)
if (process.env.NODE_ENV === 'development') {
  Object.entries(AppStore).forEach(([id, app]) => {
    const validation = validateApp(app);
    if (!validation.valid) {
      console.error(`App validation failed for "${id}":`, validation.errors);
    }
  });
}

// Helper functions for working with apps
export const getApp = (id: string) => AppStore[id];

export const getAllApps = () => Object.values(AppStore);

export const getAvailableApps = () => 
  Object.values(AppStore).filter(app => !app.metadata.comingSoon);

export const getComingSoonApps = () => 
  Object.values(AppStore).filter(app => app.metadata.comingSoon);

export const getAppsByCategory = (category: string) =>
  Object.values(AppStore).filter(app => app.metadata.category === category);

// Type exports for consumers
export type { BaseApp, AppMetadata, AppWindow, AppContent } from './BaseApp';
export { createApp, validateApp } from './BaseApp';