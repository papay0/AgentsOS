import { ReactNode } from 'react';

// App-specific props interfaces - each app defines its own props
export interface TerminalAppProps {
  terminalPort?: number;
}

export interface ClaudeAppProps {
  claudePort?: number;
}

export interface VSCodeAppProps {
  repositoryUrl?: string;
  vscodePort?: number;
}

// Create a proper "no props" type that's explicit about having no properties
export type NoProps = Record<string, never>;

// Settings app doesn't need any props
export type SettingsAppProps = NoProps;

// Diff app doesn't need any props
export type DiffAppProps = NoProps;

// Setup app doesn't need any props
export type SetupAppProps = NoProps;

// Map app types to their prop types
export interface AppPropsMap {
  terminal: TerminalAppProps;
  claude: ClaudeAppProps;
  vscode: VSCodeAppProps;
  settings: SettingsAppProps;
  diff: DiffAppProps;
  setup: SetupAppProps;
}

export type AppType = keyof AppPropsMap;
export type AppId = AppType; // Alias for backward compatibility

export interface AppMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'development' | 'productivity' | 'system' | 'utility';
  icon: {
    emoji?: string;
    url?: string;
    icon?: ReactNode;
    fallback: string;
  };
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  comingSoon?: boolean;
  premium?: boolean;
}

export interface AppWindow {
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  maxSize?: { width: number; height: number };
  resizable: boolean;
  position: 'center' | 'cascade' | { x: number; y: number };
}

export interface AppContent<T extends AppType> {
  desktop: (props: AppPropsMap[T]) => ReactNode;
  mobile: (props: AppPropsMap[T]) => ReactNode;
}

export interface AppActions {
  onOpen?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export interface BaseApp<T extends AppType> {
  metadata: AppMetadata;
  window: AppWindow;
  content: AppContent<T>;
  actions?: AppActions;
}

// Type-safe app registration system
export type AppRegistry = {
  [K in AppType]: BaseApp<K>;
};

// Helper type to get props for a specific app type
export type PropsForApp<T extends AppType> = AppPropsMap[T];

// Helper function to create a new app with type safety
export function createApp<T extends AppType>(config: BaseApp<T>): BaseApp<T> {
  // Validate required fields at runtime
  if (!config.metadata.id) {
    throw new Error('App must have an id');
  }
  if (!config.metadata.name) {
    throw new Error('App must have a name');
  }
  if (!config.metadata.icon.emoji && !config.metadata.icon.url && !config.metadata.icon.icon) {
    throw new Error('App must have an icon (emoji, url, or icon component)');
  }
  if (!config.content.desktop || !config.content.mobile) {
    throw new Error('App must provide both desktop and mobile content');
  }

  return config;
}

// App store-like validation
export function validateApp<T extends AppType>(app: BaseApp<T>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required metadata
  if (!app.metadata.id.match(/^[a-z0-9-]+$/)) {
    errors.push('App ID must be lowercase alphanumeric with dashes only');
  }
  if (app.metadata.name.length < 1 || app.metadata.name.length > 30) {
    errors.push('App name must be 1-30 characters');
  }
  if (app.metadata.description.length < 10 || app.metadata.description.length > 200) {
    errors.push('App description must be 10-200 characters');
  }
  if (!app.metadata.version.match(/^\d+\.\d+\.\d+$/)) {
    errors.push('App version must follow semver format (e.g., 1.0.0)');
  }

  // Window configuration
  if (app.window.defaultSize.width < 200 || app.window.defaultSize.height < 150) {
    errors.push('Window default size must be at least 200x150');
  }
  if (app.window.minSize.width < 150 || app.window.minSize.height < 100) {
    errors.push('Window minimum size must be at least 150x100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}