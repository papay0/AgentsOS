'use client';

import { useState, useEffect } from 'react';
import MobileDock from './MobileDock';
import MobileHome from './MobileHome';
import MobileApp from './MobileApp';

export interface MobileApp {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'vscode' | 'claude' | 'terminal' | 'file-manager' | 'preview' | 'settings' | 'safari' | 'messages';
}

const defaultApps: MobileApp[] = [
  { id: 'vscode', name: 'VSCode', icon: '💻', color: 'bg-blue-500', type: 'vscode' },
  { id: 'claude', name: 'Claude', icon: '🤖', color: 'bg-purple-500', type: 'claude' },
  { id: 'terminal', name: 'Terminal', icon: '⚡', color: 'bg-green-500', type: 'terminal' },
  { id: 'files', name: 'Files', icon: '📁', color: 'bg-yellow-500', type: 'file-manager' },
  { id: 'safari', name: 'Safari', icon: '🌐', color: 'bg-blue-400', type: 'safari' },
  { id: 'messages', name: 'Messages', icon: '💬', color: 'bg-green-400', type: 'messages' },
  { id: 'settings', name: 'Settings', icon: '⚙️', color: 'bg-gray-500', type: 'settings' },
  { id: 'preview', name: 'Preview', icon: '🖼️', color: 'bg-indigo-500', type: 'preview' },
];

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
        apps={defaultApps.slice(0, 4)} // First 4 apps in dock
        onAppOpen={handleAppOpen}
        onHomePress={handleHomePress}
      />
    </div>
  );
}