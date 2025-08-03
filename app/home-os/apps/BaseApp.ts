import { ReactNode } from 'react';

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

export interface AppContent {
  desktop: () => ReactNode;
  mobile: () => ReactNode;
}

export interface AppActions {
  onOpen?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export interface BaseApp {
  metadata: AppMetadata;
  window: AppWindow;
  content: AppContent;
  actions?: AppActions;
}

// Type-safe app registration system
export interface AppRegistry {
  [key: string]: BaseApp;
}

// Helper function to create a new app with type safety
export function createApp(config: BaseApp): BaseApp {
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
export function validateApp(app: BaseApp): { valid: boolean; errors: string[] } {
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