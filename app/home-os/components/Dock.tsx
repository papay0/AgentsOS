'use client';

import { useWindowStore } from '../stores/windowStore';
import { Plus, Code, Bot, FolderOpen, Terminal, Globe } from 'lucide-react';
import { DOCK_Z_INDEX } from '../constants/layout';

export default function Dock() {
  const { windows, addWindow, restoreWindow, focusWindow } = useWindowStore();
  const minimizedWindows = windows.filter(w => w.minimized);

  const handleAppClick = (type: 'vscode' | 'claude' | 'terminal' | 'file-manager' | 'preview') => {
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

    // Create a new window
    const titles = {
      vscode: 'VSCode - New Project',
      claude: 'Claude - Assistant',
      terminal: 'Terminal',
      'file-manager': 'File Manager',
      preview: 'Preview'
    };

    addWindow({
      type,
      title: titles[type],
      position: { 
        x: 100 + Math.random() * 200, 
        y: 100 + Math.random() * 150 
      },
      size: { width: 800, height: 600 },
      minimized: false,
      maximized: false,
      focused: true,
    });
  };

  const handleMinimizedWindowClick = (windowId: string) => {
    restoreWindow(windowId);
    focusWindow(windowId);
  };

  const getAppIcon = (type: string) => {
    switch (type) {
      case 'vscode': return <Code className="w-6 h-6" />;
      case 'claude': return <Bot className="w-6 h-6" />;
      case 'terminal': return <Terminal className="w-6 h-6" />;
      case 'file-manager': return <FolderOpen className="w-6 h-6" />;
      case 'preview': return <Globe className="w-6 h-6" />;
      default: return <Code className="w-6 h-6" />;
    }
  };

  const getAppColor = (type: string) => {
    switch (type) {
      case 'vscode': return 'bg-blue-500 hover:bg-blue-600';
      case 'claude': return 'bg-purple-500 hover:bg-purple-600';
      case 'terminal': return 'bg-green-500 hover:bg-green-600';
      case 'file-manager': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'preview': return 'bg-indigo-500 hover:bg-indigo-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2" style={{ zIndex: DOCK_Z_INDEX }}>
      <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10 shadow-2xl">
        {/* Main app icons */}
        <DockIcon 
          onClick={() => handleAppClick('vscode')}
          className={getAppColor('vscode')}
          title="VSCode"
        >
          {getAppIcon('vscode')}
        </DockIcon>

        <DockIcon 
          onClick={() => handleAppClick('claude')}
          className={getAppColor('claude')}
          title="Claude"
        >
          {getAppIcon('claude')}
        </DockIcon>

        <DockIcon 
          onClick={() => handleAppClick('terminal')}
          className={getAppColor('terminal')}
          title="Terminal"
        >
          {getAppIcon('terminal')}
        </DockIcon>

        <DockIcon 
          onClick={() => handleAppClick('file-manager')}
          className={getAppColor('file-manager')}
          title="Files"
        >
          {getAppIcon('file-manager')}
        </DockIcon>

        <DockIcon 
          onClick={() => handleAppClick('preview')}
          className={getAppColor('preview')}
          title="Preview"
        >
          {getAppIcon('preview')}
        </DockIcon>

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
          >
            {getAppIcon(window.type)}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
          </DockIcon>
        ))}

        {/* Add new window */}
        <div className="w-px h-8 bg-white/20 mx-2" />
        <DockIcon 
          onClick={() => {/* TODO: Show app picker */}}
          className="bg-gray-600 hover:bg-gray-700"
          title="Add App"
        >
          <Plus className="w-6 h-6" />
        </DockIcon>
      </div>
    </div>
  );
}

interface DockIconProps {
  onClick: () => void;
  className: string;
  title: string;
  children: React.ReactNode;
}

function DockIcon({ onClick, className, title, children }: DockIconProps) {
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
    >
      {children}
    </button>
  );
}