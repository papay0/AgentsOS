'use client';

import { useState, useEffect } from 'react';
import MobileDock from './MobileDock';
import MobileHome from './MobileHome';
import MobileApp from './MobileApp';
import { getAllApps } from '../../apps';
import { AppMetadata } from '../../apps/BaseApp';

export interface MobileApp {
  id: string;
  name: string;
  icon: AppMetadata['icon'];
  color: string;
  type: 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal';
  comingSoon?: boolean;
}

const getMobileAppColor = (primaryColor: string): string => {
  // Extract the base color from the app's primary color
  const baseColor = primaryColor.replace('bg-', '');
  return `bg-${baseColor}`;
};

const defaultApps: MobileApp[] = getAllApps().map(app => ({
  id: app.metadata.id,
  name: app.metadata.name,
  icon: app.metadata.icon,
  color: getMobileAppColor(app.metadata.colors.primary),
  type: app.metadata.id as 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal',
  comingSoon: app.metadata.comingSoon
}));

export default function MobileWorkspace() {
  const [currentPage, setCurrentPage] = useState(0);
  const [openApp, setOpenApp] = useState<MobileApp | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

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
    setCurrentPage(0);
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
      
      <MobileHome 
        apps={defaultApps}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onAppOpen={handleAppOpen}
      />
      
      <MobileDock 
        apps={defaultApps.filter(app => !app.comingSoon).slice(0, 4)} // First 4 available apps in dock
        onAppOpen={handleAppOpen}
        onHomePress={handleHomePress}
      />
    </div>
  );
}