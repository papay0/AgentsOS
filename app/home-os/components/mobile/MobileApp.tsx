'use client';

import React from 'react';
import { type MobileApp } from './MobileWorkspace';
import { ArrowLeft } from 'lucide-react';
import { getApp } from '../../apps';
import { type AppType } from '../../apps/BaseApp';
import MobileSettings from './MobileSettings';
import AppIcon from '../ui/AppIcon';

interface MobileAppProps {
  app: MobileApp;
  onClose: () => void;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  isOpening?: boolean;
}

export default function MobileApp({ app, onClose, theme, onThemeChange, isOpening }: MobileAppProps) {

  const getAppContent = () => {
    // Special handling for settings app that needs theme props
    if (app.type === 'settings') {
      return <MobileSettings theme={theme} onThemeChange={onThemeChange} />;
    }

    // Get app from registry
    const appConfig = getApp(app.type);
    if (!appConfig) {
      return (
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
          <div className="text-center text-white">
            <div className="mb-4 w-16 h-16 mx-auto">
              <AppIcon icon={app.icon} size="lg" className="text-white" />
            </div>
            <div className="text-2xl font-bold mb-2">{app.name}</div>
            <div className="text-white/80">App not found</div>
          </div>
        </div>
      );
    }

    // Use the mobile content from the app with proper typed props
    const MobileContent = appConfig.content.mobile;
    
    // Switch case ensures we handle all app types - compiler will error if we add new types  
    // Force TypeScript to recognize this as the full AppType union
    switch (app.type as AppType) {
      case 'terminal': {
        const Component = MobileContent as React.ComponentType<{ repositoryUrl?: string }>;
        return <Component repositoryUrl={app.repositoryUrl} />;
      }
      case 'claude': {
        const Component = MobileContent as React.ComponentType<{ repositoryUrl?: string }>;
        return <Component repositoryUrl={app.repositoryUrl} />;
      }
      case 'vscode': {
        const Component = MobileContent as React.ComponentType<{ repositoryUrl?: string }>;
        return <Component repositoryUrl={app.repositoryUrl} />;
      }
      case 'settings': {
        const Component = MobileContent as React.ComponentType<Record<string, never>>;
        return <Component />;
      }
      case 'diff': {
        const Component = MobileContent as React.ComponentType<Record<string, never>>;
        return <Component />;
      }
      case 'setup': {
        const Component = MobileContent as React.ComponentType<Record<string, never>>;
        return <Component />;
      }
    }
  };


  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* App header with close button */}
      <div className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b transition-opacity duration-300 ${
        isOpening ? 'opacity-100 delay-150' : 'opacity-0'
      }`}>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center transition-transform active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="font-semibold">{app.name}</div>
        <div className="w-8 h-8"></div> {/* Spacer for centering */}
      </div>
      
      {/* App content */}
      <div className={`flex-1 w-full overflow-hidden relative transition-opacity duration-300 ${
        isOpening ? 'opacity-100 delay-200' : 'opacity-0'
      }`}>
        {getAppContent()}
      </div>
    </div>
  );
}