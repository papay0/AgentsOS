'use client';

import { useWindowStore } from '../../stores/windowStore';
import { useWindowAnimation } from '../../hooks/useWindowAnimation';
import { Code } from 'lucide-react';
import { DOCK_Z_INDEX } from '../../constants/layout';
import { getAllApps, getApp } from '../../apps';

export default function Dock() {
  const { windows, addWindow, restoreWindow, focusWindow, setWindowAnimating } = useWindowStore();
  const minimizedWindows = windows.filter(w => w.minimized);

  // Window animation hook for restore animations
  const { animateRestoreFromTarget } = useWindowAnimation({
    onAnimationComplete: () => {
      // Animation complete callback handled per window
    }
  });

  const handleAppClick = (type: 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal') => {
    // Check if there's already a window of this type
    const existingWindow = windows.find(w => w.type === type && !w.minimized);
    
    if (existingWindow) {
      focusWindow(existingWindow.id);
      return;
    }

    // Check if there's a minimized window of this type
    const minimizedWindow = windows.find(w => w.type === type && w.minimized);
    if (minimizedWindow) {
      restoreWindow(minimizedWindow.id);
      focusWindow(minimizedWindow.id);
      return;
    }

    // Get app from registry
    const app = getApp(type);
    if (!app) return;

    // Don't create windows for coming soon apps
    if (app.metadata.comingSoon) {
      // TODO: Show coming soon toast
      return;
    }

    // Calculate position based on app config
    const position = app.window.position === 'center' 
      ? { x: (window.innerWidth - app.window.defaultSize.width) / 2, y: (window.innerHeight - app.window.defaultSize.height) / 2 }
      : app.window.position === 'cascade'
      ? { x: 100 + Math.random() * 200, y: 100 + Math.random() * 150 }
      : app.window.position;

    addWindow({
      type,
      title: app.metadata.name,
      position,
      size: app.window.defaultSize,
      minimized: false,
      maximized: false,
      focused: true,
    });
  };

  const handleMinimizedWindowClick = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    // First restore the window to make it visible
    restoreWindow(windowId);
    focusWindow(windowId);

    // Then try to animate if elements are available
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        if (typeof document === 'undefined') return; // Safety check for SSR/tests
        
        const windowElement = document.querySelector(`[data-testid="window-${windowId}"]`) as HTMLElement;
        const dockIcon = document.querySelector(`[data-dock-icon="${window.type}"]`) as HTMLElement;
        
        if (windowElement && dockIcon) {
          setWindowAnimating(windowId, true);
          animateRestoreFromTarget(windowElement, dockIcon, {
            x: window.position.x,
            y: window.position.y + 32, // Account for menu bar
            width: window.size.width,
            height: window.size.height
          }).addEventListener('finish', () => {
            setWindowAnimating(windowId, false);
          });
        }
      }, 50); // Small delay to ensure DOM is updated
    }
  };

  const getAppIcon = (type: string) => {
    const app = getApp(type);
    if (!app) return <Code className="w-6 h-6" />;
    
    // For now, use emoji since URL images are more complex
    // TODO: Implement proper image loading for URLs
    return <span className="text-2xl">{app.metadata.icon.emoji}</span>;
  };

  const getAppColor = (type: string) => {
    const app = getApp(type);
    if (!app) return 'bg-gray-500 hover:bg-gray-600';
    
    // Extract the base color from the app's primary color
    const primaryColor = app.metadata.colors.primary;
    const baseColor = primaryColor.replace('bg-', '');
    return `bg-${baseColor} hover:bg-${baseColor.replace('-500', '-600')}`;
  };

  return (
    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2" style={{ zIndex: DOCK_Z_INDEX }}>
      <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10 shadow-2xl">
        {/* Main app icons */}
        {getAllApps().map((app) => (
          <DockIcon 
            key={app.metadata.id}
            onClick={() => handleAppClick(app.metadata.id as 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal')}
            className={`${getAppColor(app.metadata.id)} ${app.metadata.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={app.metadata.name}
            dataAttribute={app.metadata.id}
          >
            {getAppIcon(app.metadata.id)}
          </DockIcon>
        ))}

        {/* Separator */}
        {minimizedWindows.length > 0 && (
          <div className="w-px h-8 bg-white/20 mx-2" />
        )}

        {/* Minimized windows */}
        {minimizedWindows.map((window) => (
          <DockIcon
            key={window.id}
            onClick={() => handleMinimizedWindowClick(window.id)}
            className={`${getAppColor(window.type)} relative`}
            title={window.title}
            dataAttribute={window.type}
          >
            {getAppIcon(window.type)}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
          </DockIcon>
        ))}

      </div>
    </div>
  );
}

interface DockIconProps {
  onClick: () => void;
  className: string;
  title: string;
  children: React.ReactNode;
  dataAttribute?: string;
}

function DockIcon({ onClick, className, title, children, dataAttribute }: DockIconProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-12 h-12 rounded-xl flex items-center justify-center text-white
        transition-all duration-200 ease-out
        hover:scale-110 hover:shadow-lg
        active:scale-95
        ${className}
      `}
      title={title}
      data-dock-icon={dataAttribute}
    >
      {children}
    </button>
  );
}