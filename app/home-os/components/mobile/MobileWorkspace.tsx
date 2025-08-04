'use client';

import { useState, useEffect } from 'react';
import MobileDock from './MobileDock';
import MobileApp from './MobileApp';
import { MobileRepositoryPages } from './MobileRepositoryPages';
import { MobileStatusBar } from './MobileStatusBar';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { getAllApps } from '../../apps';
import { AppMetadata, AppType } from '../../apps/BaseApp';

export interface MobileApp {
  id: string;
  name: string;
  icon: AppMetadata['icon'];
  color: string;
  type: AppType;
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
  const [animationOriginRect, setAnimationOriginRect] = useState<DOMRect | null>(null);
  const [animationState, setAnimationState] = useState<'idle' | 'opening' | 'open' | 'closing'>('idle');

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


  const handleAppOpen = (app: MobileApp, element: HTMLElement) => {
    // Don't open coming soon apps
    if (app.comingSoon) {
      // TODO: Show coming soon toast
      return;
    }
    
    // Get the icon position for animation
    const rect = element.getBoundingClientRect();
    setAnimationOriginRect(rect);
    
    // Add app to loaded apps Map if not already loaded (preserves the app data)
    setLoadedApps(prev => new Map(prev.set(app.id, app)));
    
    // Set as active app and start animation
    setActiveAppId(app.id);
    setAnimationState('opening');
    
    // Transition to open state
    setTimeout(() => {
      setAnimationState('open');
    }, 50);
  };

  const handleAppClose = () => {
    // Start closing animation
    setAnimationState('closing');
    
    // Complete close after animation
    setTimeout(() => {
      setActiveAppId(null);
      setAnimationState('idle');
    }, 300);
  };

  const handleHomePress = () => {
    if (activeAppId) {
      handleAppClose();
    }
  };
  

  return (
    <div className="h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-gray-900 overflow-hidden relative">
      {/* Desktop view */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          animationState !== 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100'
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
      {Array.from(loadedApps.entries()).map(([appId, app]) => {
        const isActive = appId === activeAppId;
        const shouldAnimate = isActive && animationOriginRect;
        
        let appStyles: React.CSSProperties = {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: isActive ? 20 : -1,
        };
        
        if (!isActive) {
          // Hidden apps
          appStyles.transform = 'translateX(100%)';
        } else if (shouldAnimate) {
          // iOS-style animation
          if (animationState === 'opening') {
            // Start from icon position
            appStyles = {
              position: 'fixed',
              top: animationOriginRect.top,
              left: animationOriginRect.left,
              width: animationOriginRect.width,
              height: animationOriginRect.height,
              borderRadius: '12px',
              overflow: 'hidden',
              zIndex: 20,
              transition: 'none',
            };
          } else if (animationState === 'open') {
            // Animate to fullscreen
            appStyles = {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              borderRadius: '0px',
              overflow: 'hidden',
              zIndex: 20,
              transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            };
          } else if (animationState === 'closing') {
            // Animate back to icon position
            appStyles = {
              position: 'fixed',
              top: animationOriginRect.top,
              left: animationOriginRect.left,
              width: animationOriginRect.width,
              height: animationOriginRect.height,
              borderRadius: '12px',
              overflow: 'hidden',
              zIndex: 20,
              transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            };
          }
        }
        
        return (
          <div
            key={appId}
            style={appStyles}
          >
            <MobileApp
              app={app}
              onClose={handleAppClose}
              theme={theme}
              onThemeChange={setTheme}
              isOpening={animationState === 'open'}
            />
          </div>
        );
      })}
    </div>
  );
}