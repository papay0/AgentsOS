// App Registry - Central place to register all apps with strong typing
import { AppRegistry, validateApp, AppId, BaseApp } from './BaseApp';
import { VSCodeApp } from './VSCodeApp';
import { ClaudeApp } from './ClaudeApp';
import { GeminiApp } from './GeminiApp';
import { DiffApp } from './DiffApp';
import { SettingsApp } from './SettingsApp';
import { TerminalApp } from './TerminalApp';
import { SetupApp } from './setup';

// Strongly typed app store - each app must match its declared type
export const AppStore: AppRegistry = {
  vscode: VSCodeApp,
  claude: ClaudeApp,
  gemini: GeminiApp,
  diff: DiffApp,
  settings: SettingsApp,
  terminal: TerminalApp,
  setup: SetupApp,
} as const;

// Validate all apps at startup (development only)
if (process.env.NODE_ENV === 'development') {
  (Object.entries(AppStore) as Array<[AppId, AppRegistry[AppId]]>).forEach(([id, app]) => {
    // Type-safe validation using function overloading
    const validation = (() => {
      switch (id) {
        case 'terminal': return validateApp(app as BaseApp<'terminal'>);
        case 'claude': return validateApp(app as BaseApp<'claude'>);
        case 'gemini': return validateApp(app as BaseApp<'gemini'>);
        case 'vscode': return validateApp(app as BaseApp<'vscode'>);
        case 'settings': return validateApp(app as BaseApp<'settings'>);
        case 'diff': return validateApp(app as BaseApp<'diff'>);
        case 'setup': return validateApp(app as BaseApp<'setup'>);
        default: throw new Error(`Unknown app id: ${id}`);
      }
    })();
    
    if (!validation.valid) {
      console.error(`App validation failed for "${id}":`, validation.errors);
    }
  });
}

// Strongly typed helper functions for working with apps
export const getApp = <T extends AppId>(id: T): AppRegistry[T] => AppStore[id];

export const getAllApps = () => Object.values(AppStore) as readonly AppRegistry[AppId][];

export const getAvailableApps = () => 
  Object.values(AppStore).filter(app => 
    !app.metadata.comingSoon && !app.metadata.isFullyHidden
  ) as readonly AppRegistry[AppId][];

export const getComingSoonApps = () => 
  Object.values(AppStore).filter(app => app.metadata.comingSoon) as readonly AppRegistry[AppId][];

export const getAppsByCategory = (category: string) =>
  Object.values(AppStore).filter(app => app.metadata.category === category) as readonly AppRegistry[AppId][];

export const getStartupApps = () => 
  Object.values(AppStore).filter(app => 
    app.metadata.isOpenAtStartup && !app.metadata.isFullyHidden && !app.metadata.comingSoon
  ) as readonly AppRegistry[AppId][];

// Strongly typed exports for consumers
export type { 
  BaseApp, 
  AppMetadata, 
  AppWindow, 
  AppActions,
  AppId,
  AppType,
  AppContent,
  AppPropsMap,
  PropsForApp,
  TerminalAppProps,
  ClaudeAppProps,
  GeminiAppProps,
  VSCodeAppProps,
  SettingsAppProps,
  DiffAppProps,
  SetupAppProps,
  AppRegistry
} from './BaseApp';
export { createApp, validateApp } from './BaseApp';