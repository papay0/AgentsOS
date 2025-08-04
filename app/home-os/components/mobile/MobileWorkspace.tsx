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
  const [openApp, setOpenApp] = useState<MobileApp | null>(null);
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
    setOpenApp(app);
  };

  const handleAppClose = () => {
    setOpenApp(null);
  };

  const handleHomePress = () => {
    setOpenApp(null);
  };

  if (openApp) {
    return (
      <div className="h-full bg-black dark:bg-gray-900 overflow-hidden">
        <MobileApp app={openApp} onClose={handleAppClose} theme={theme} onThemeChange={setTheme} />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-gray-900 overflow-hidden relative">
      
      {/* Mobile Status Bar */}
      <MobileStatusBar />
      
      {/* Main Content Area */}
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
  );
}