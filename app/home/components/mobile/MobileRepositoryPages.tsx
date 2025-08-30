'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Repository } from '../../stores/workspaceStore';
import MobileApp from './MobileApp';
import { getAvailableApps } from '../../apps';
import { AppMetadata } from '../../apps/BaseApp';

export interface MobileApp {
  id: string;
  name: string;
  icon: AppMetadata['icon'];
  color: string;
  type: 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal' | 'setup';
  comingSoon?: boolean;
  repositoryUrl?: string;
}

const getMobileAppColor = (primaryColor: string): string => {
  const baseColor = primaryColor.replace('bg-', '');
  return `bg-${baseColor}`;
};

const getAppsForRepository = (repository: Repository): MobileApp[] => {
  const dockAppIds = ['settings']; // Only Settings is in the dock
  
  return getAvailableApps()
    .filter(app => !dockAppIds.includes(app.metadata.id)) // Exclude dock apps (only Settings)
    .map(app => ({
      id: `${app.metadata.id}-${repository.name}`,
      name: app.metadata.name,
      icon: app.metadata.icon,
      color: getMobileAppColor(app.metadata.colors.primary),
      type: app.metadata.id as 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal',
      comingSoon: app.metadata.comingSoon || app.metadata.id === 'diff', // Force Code Diff to be coming soon
      repositoryUrl: getRepositoryUrlForApp(repository, app.metadata.id)
    }));
};

const getRepositoryUrlForApp = (repository: Repository, appType: string): string => {
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

interface MobileRepositoryPagesProps {
  onAppOpen: (app: MobileApp, element: HTMLElement) => void;
}

export function MobileRepositoryPages({ onAppOpen }: MobileRepositoryPagesProps) {
  const { workspaces, activeWorkspaceId, switchToWorkspace } = useWorkspaceStore();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get repositories from workspaces
  const repositories = workspaces.map(workspace => workspace.repository);
  
  // Update current page when active workspace changes
  useEffect(() => {
    if (activeWorkspaceId && repositories.length > 0) {
      const activeIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
      if (activeIndex !== -1 && activeIndex < repositories.length) {
        setCurrentPageIndex(activeIndex);
      } else if (currentPageIndex >= repositories.length) {
        // Current page is out of bounds, reset to first page
        setCurrentPageIndex(0);
      }
    } else if (repositories.length === 0) {
      setCurrentPageIndex(0);
    }
  }, [activeWorkspaceId, workspaces, repositories.length, currentPageIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (repositories.length <= 1) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || repositories.length <= 1) return;
    
    const currentX = e.touches[0].clientX;
    let diffX = currentX - startX;
    
    // iOS-style resistance at edges
    const edgeResistance = 0.25;
    const normalResistance = 0.8; // Less resistance for smoother feel
    
    if (currentPageIndex === 0 && diffX > 0) {
      // At first page, swiping right
      diffX = diffX * edgeResistance;
    } else if (currentPageIndex === repositories.length - 1 && diffX < 0) {
      // At last page, swiping left  
      diffX = diffX * edgeResistance;
    } else {
      // Normal swiping
      diffX = diffX * normalResistance;
    }
    
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || repositories.length <= 1) return;
    
    setIsDragging(false);
    
    // Calculate velocity for momentum
    const velocity = Math.abs(translateX);
    
    // iOS-style threshold - responsive to screen width
    const snapThreshold = Math.max(20, window.innerWidth * 0.15); // 15% of screen width or 20px minimum
    
    // More sensitive snapping based on velocity
    const shouldSnap = Math.abs(translateX) > snapThreshold || velocity > 50;
    
    if (shouldSnap) {
      if (translateX > 0 && currentPageIndex > 0) {
        // Swipe right - go to previous page
        changePage(currentPageIndex - 1);
      } else if (translateX < 0 && currentPageIndex < repositories.length - 1) {
        // Swipe left - go to next page
        changePage(currentPageIndex + 1);
      }
    }
    
    // Reset translateX - this triggers the snap animation
    setTranslateX(0);
  };

  const changePage = (newIndex: number) => {
    // Ensure newIndex is within valid bounds
    const clampedIndex = Math.max(0, Math.min(newIndex, repositories.length - 1));
    
    if (clampedIndex !== currentPageIndex && repositories.length > 0) {
      setCurrentPageIndex(clampedIndex);
      const targetWorkspace = workspaces[clampedIndex];
      if (targetWorkspace) {
        switchToWorkspace(targetWorkspace.id);
      }
    }
  };

  const handleAppClick = (app: MobileApp, event: React.MouseEvent<HTMLButtonElement>) => {
    if (app.comingSoon) return;
    onAppOpen(app, event.currentTarget);
  };

  if (repositories.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/70 text-center">No repositories found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Apps Grid - Fixed Carousel */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="h-full flex"
          style={{
            // Much simpler transform - each page is exactly 100vw
            transform: `translateX(${isDragging 
              ? `calc(-${currentPageIndex * 100}vw + ${translateX}px)`
              : `-${currentPageIndex * 100}vw`
            })`,
            // Container width is exactly repositories.length * 100vw
            width: `${repositories.length * 100}vw`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transformStyle: 'preserve-3d',
            willChange: isDragging ? 'transform' : 'auto'
          }}
        >
          {repositories.map((repository) => {
            const pageApps = getAppsForRepository(repository);
            
            return (
              <div 
                key={repository.name}
                // Each page is exactly 100vw
                className="h-full flex-shrink-0 px-6"
                style={{ width: '100vw' }}
              >
                {pageApps.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/70 text-center">No apps available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 content-start">
                    {pageApps.slice(0, 16).map((app) => (
                    <button
                      key={app.id}
                      onClick={(e) => handleAppClick(app, e)}
                      className="flex flex-col items-center space-y-2 p-2 rounded-xl hover:bg-white/10 transition-colors relative"
                      disabled={app.comingSoon}
                    >
                      <div className={`w-14 h-14 rounded-xl ${app.color} flex items-center justify-center relative ${app.comingSoon ? 'opacity-50' : ''}`}>
                        {typeof app.icon.icon === 'string' ? (
                          <span className="text-2xl">{app.icon.icon}</span>
                        ) : app.icon.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={app.icon.url} 
                            alt={app.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          app.icon.icon
                        )}
                        
                        {app.comingSoon && (
                          <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">Soon</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-white text-xs text-center ${app.comingSoon ? 'opacity-50' : ''}`}>
                        {app.name}
                      </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Page Indicators */}
      {repositories.length > 1 && (
        <div className="flex justify-center items-center pb-4 space-x-2">
          {repositories.map((_, index) => (
            <button
              key={index}
              onClick={() => changePage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentPageIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

    </div>
  );
}