'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { SignedIn, UserButton } from '@clerk/nextjs';

interface MobileSettingsProps {
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

export default function MobileSettings({ theme = 'system', onThemeChange }: MobileSettingsProps) {

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
        {title}
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl mx-4 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const ThemeSelector = () => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onThemeChange?.('light')}
        className={`p-2 rounded-lg ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => onThemeChange?.('dark')}
        className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => onThemeChange?.('system')}
        className={`p-2 rounded-lg ${theme === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900 overflow-y-auto pt-6">
      {/* Profile Section */}
      <SettingsSection title="Profile">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-12 h-12"
                  }
                }}
              />
            </SignedIn>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Your Profile</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Manage your account</div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Moon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Theme</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Current: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </div>
              </div>
            </div>
            <ThemeSelector />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}