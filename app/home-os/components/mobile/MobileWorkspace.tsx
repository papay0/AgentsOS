'use client';

import { useState, useEffect } from 'react';
import MobileDock from './MobileDock';
import MobileApp from './MobileApp';
import { MobileRepositoryPages } from './MobileRepositoryPages';
import { MobileStatusBar } from './MobileStatusBar';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { getAllApps } from '../../apps';
import { AppMetadata } from '../../apps/BaseApp';

export interface MobileApp {
  id: string;
  name: string;
  icon: AppMetadata['icon'];
  color: string;
  type: 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal';
  comingSoon?: boolean;
  repositoryUrl?: string;
}

const getMobileAppColor = (primaryColor: string): string => {
  // Extract the base color from the app's primary color
  const baseColor = primaryColor.replace('bg-', '');
  return `bg-${baseColor}`;
};

// Get dock apps - only common apps (Settings)
const getDockApps = (): MobileApp[] => {
  const allApps = getAllApps();
  const settingsApp = allApps.find(app => app.metadata.id === 'settings');
  
  return [
    {
      id: 'dock-settings',
      name: 'Settings',
      icon: settingsApp?.metadata.icon || { icon: '⚙️', fallback: '⚙️' },
      color: getMobileAppColor(settingsApp?.metadata.colors.primary || 'bg-gray-500'),
      type: 'settings' as const
    }
  ];
};

export default function MobileWorkspace() {
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [loadedApps, setLoadedApps] = useState<Map<string, MobileApp>>(new Map());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const { workspaces } = useWorkspaceStore();

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
  }, []);

  // Apply theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);


  const handleAppOpen = (app: MobileApp) => {
    // Don't open coming soon apps
    if (app.comingSoon) {
      // TODO: Show coming soon toast
      return;
    }
    
    // Add app to loaded apps Map if not already loaded (preserves the app data)
    setLoadedApps(prev => new Map(prev.set(app.id, app)));
    
    // Set as active app
    setActiveAppId(app.id);
  };

  const handleAppClose = () => {
    // Don't remove from loaded apps, just hide
    setActiveAppId(null);
  };

  const handleHomePress = () => {
    // Don't remove from loaded apps, just hide
    setActiveAppId(null);
  };
  
  // Get all available apps data
  const getAllMobileApps = () => {
    const allApps: MobileApp[] = [];
    workspaces.forEach(workspace => {
      const apps = getDockApps().concat(
        getAllApps()
          .filter(app => !['settings'].includes(app.metadata.id))
          .map(app => ({
            id: `${app.metadata.id}-${workspace.repository.name}`,
            name: app.metadata.name,  
            icon: app.metadata.icon,
            color: getMobileAppColor(app.metadata.colors.primary),
            type: app.metadata.id as 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal',
            comingSoon: app.metadata.comingSoon || app.metadata.id === 'diff',
            repositoryUrl: getRepositoryUrlForApp(workspace.repository, app.metadata.id)
          }))
      );
      allApps.push(...apps);
    });
    return allApps;
  };
  
  const getRepositoryUrlForApp = (repository: any, appType: string): string => {
    switch (appType) {
      case 'vscode':
        return repository.urls?.vscode || '';
      case 'claude':
        return repository.urls?.claude || '';
      case 'terminal':
        return repository.urls?.terminal || '';
      default:
        return '';
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-gray-900 overflow-hidden relative">
      {/* Desktop view */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          activeAppId ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <MobileStatusBar />
        <div className="pt-20 pb-24 h-full flex flex-col">
          {workspaces.length > 0 ? (
            <MobileRepositoryPages onAppOpen={handleAppOpen} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/70 text-center">
                No workspace found.<br />
                Please complete onboarding first.
              </p>
            </div>
          )}
        </div>
        <MobileDock
          apps={getDockApps()}
          onAppOpen={handleAppOpen}
          onHomePress={handleHomePress}
        />
      </div>

      {/* Apps view */}
      {Array.from(loadedApps.entries()).map(([appId, app]) => (
        <div
          key={appId}
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            appId === activeAppId ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <MobileApp
            app={app}
            onClose={handleAppClose}
            theme={theme}
            onThemeChange={setTheme}
          />
        </div>
      ))}
    </div>
  );
}