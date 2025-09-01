'use client';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useWindowAnimation } from '../../hooks/useWindowAnimation';
import type { Window } from '../../stores/windowStore';
import { Code } from 'lucide-react';
import { DOCK_Z_INDEX } from '../../constants/layout';
import { getAvailableApps, getApp, AppStore } from '../../apps';
import AppIcon from '../ui/AppIcon';
import React, { useState } from 'react';

// Glass Effect Components
interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  return (
    <div
      className={`relative flex overflow-visible cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-3xl"
        style={{
          backdropFilter: "blur(8px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-3xl"
        style={{ background: "rgba(255, 255, 255, 0.12)" }}
      />
      <div
        className="absolute inset-0 z-20 rounded-3xl overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 2px 0 rgba(255, 255, 255, 0.25), inset -2px -2px 2px 0 rgba(255, 255, 255, 0.15)",
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </div>
  );
};

// SVG Filter Component
const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

// macOS-style Tooltip Component
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const MacTooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl border border-gray-600/30 whitespace-nowrap">
            {text}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-gray-900/95"></div>
        </div>
      )}
    </div>
  );
};

export default function Dock() {
  const { 
    getActiveWorkspace, 
    addWindow, 
    restoreWindow, 
    focusWindow, 
    setWindowAnimating 
  } = useWorkspaceStore();
  
  const activeWorkspace = getActiveWorkspace();
  const windows = activeWorkspace?.windows || [];
  const minimizedWindows = windows.filter(w => w.minimized);

  // Window animation hook for restore animations
  const { animateRestoreFromTarget } = useWindowAnimation({
    onAnimationComplete: () => {
      // Animation complete callback handled per window
    }
  });

  const handleAppClick = (type: 'vscode' | 'claude' | 'gemini' | 'diff' | 'settings' | 'terminal' | 'setup') => {
    // Only work with the active workspace
    if (!activeWorkspace) return;
    
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

    // Get repository URLs and ports for this workspace
    const repositoryUrl = (() => {
      switch (type) {
        case 'vscode':
          return activeWorkspace.repository.urls?.vscode || '';
        case 'claude':
          return activeWorkspace.repository.urls?.claude || '';
        case 'gemini':
          return activeWorkspace.repository.urls?.gemini || '';
        case 'terminal':
          return activeWorkspace.repository.urls?.terminal || '';
        default:
          return '';
      }
    })();

    // Get port information for this window type
    const windowProps: Omit<Window, 'id' | 'zIndex'> = {
      type,
      title: `${app.metadata.name} - ${activeWorkspace.name}`,
      position,
      size: app.window.defaultSize,
      minimized: false,
      maximized: false,
      focused: true,
      repositoryName: activeWorkspace.name,
      repositoryUrl,
    };

    // Add type-specific port information
    switch (type) {
      case 'terminal':
        windowProps.terminalPort = activeWorkspace.repository.ports?.terminal;
        break;
      case 'claude':
        windowProps.claudePort = activeWorkspace.repository.ports?.claude;
        break;
      case 'gemini':
        windowProps.geminiPort = activeWorkspace.repository.ports?.gemini;
        console.log('🔍 [DOCK] Opening Gemini with port:', activeWorkspace.repository.ports?.gemini);
        console.log('🔍 [DOCK] Full activeWorkspace.repository.ports:', activeWorkspace.repository.ports);
        break;
      case 'vscode':
        windowProps.vscodePort = activeWorkspace.repository.ports?.vscode;
        break;
    }

    addWindow(windowProps);
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
    const app = AppStore[type as keyof typeof AppStore];
    if (!app) return <Code className="w-6 h-6" />;
    
    return <AppIcon icon={app.metadata.icon} size="md" />;
  };


  // Don't render dock if no active workspace
  if (!activeWorkspace) {
    return null;
  }

  return (
    <>
      <GlassFilter />
      <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2" style={{ zIndex: DOCK_Z_INDEX }}>
        <GlassEffect className="rounded-3xl p-3 hover:p-3.5 transition-all duration-300">
          <div className="flex items-center justify-center space-x-2 px-2 py-1">
            {/* Main app icons */}
            {getAvailableApps().map((app) => (
              <MacTooltip key={app.metadata.id} text={app.metadata.name}>
                <GlassDockIcon
                  onClick={() => handleAppClick(app.metadata.id as 'vscode' | 'claude' | 'gemini' | 'diff' | 'settings' | 'terminal' | 'setup')}
                  className={`${app.metadata.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="" // Remove default tooltip since we have custom one
                  dataAttribute={app.metadata.id}
                  disabled={app.metadata.comingSoon}
                >
                  {getAppIcon(app.metadata.id)}
                </GlassDockIcon>
              </MacTooltip>
            ))}

            {/* Separator */}
            {minimizedWindows.length > 0 && (
              <div className="w-px h-8 bg-white/25 mx-2" />
            )}

            {/* Minimized windows */}
            {minimizedWindows.map((window) => (
              <MacTooltip key={window.id} text={window.title}>
                <GlassDockIcon
                  onClick={() => handleMinimizedWindowClick(window.id)}
                  className="relative"
                  title="" // Remove default tooltip since we have custom one
                  dataAttribute={window.type}
                >
                  {getAppIcon(window.type)}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                </GlassDockIcon>
              </MacTooltip>
            ))}
          </div>
        </GlassEffect>
      </div>
    </>
  );
}

interface GlassDockIconProps {
  onClick: () => void;
  className?: string;
  title: string;
  children: React.ReactNode;
  dataAttribute?: string;
  disabled?: boolean;
}

function GlassDockIcon({ onClick, className = "", title, children, dataAttribute, disabled = false }: GlassDockIconProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`
        w-14 h-14 rounded-2xl flex items-center justify-center text-white
        transition-all duration-300 ease-out
        hover:scale-110 hover:shadow-xl hover:-translate-y-1
        active:scale-95
        bg-white/10 backdrop-blur-md
        border border-white/20
        shadow-lg
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
      title={title}
      data-dock-icon={dataAttribute}
      disabled={disabled}
    >
      {children}
    </button>
  );
}