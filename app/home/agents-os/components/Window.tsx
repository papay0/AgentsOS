'use client';

import React, { useRef, useCallback } from 'react';
import { Window as WindowType } from '../stores/windowStore';
import { useWindowStore } from '../stores/windowStore';
import { useDrag } from '../hooks/useDrag';
import { useResize } from '../hooks/useResize';
import { X, Minus, Square } from 'lucide-react';

interface WindowProps {
  window: WindowType;
}

export default function Window({ window }: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  
  const { focusWindow, removeWindow, minimizeWindow, maximizeWindow, restoreWindow, moveWindow, resizeWindow, updateWindow } = useWindowStore();

  // Handle window dragging
  const handleDrag = useCallback((deltaX: number, deltaY: number) => {
    if (window.maximized) return; // Don't allow dragging maximized windows
    const newX = Math.max(0, window.position.x + deltaX);
    const newY = Math.max(0, window.position.y + deltaY);
    moveWindow(window.id, newX, newY);
  }, [window.id, window.position, moveWindow, window.maximized]);

  const { isDragging } = useDrag({
    elementRef: titleBarRef,
    onDrag: handleDrag,
    onDragStart: () => focusWindow(window.id),
  });

  // Handle window resizing
  const handleResize = useCallback((width: number, height: number, x?: number, y?: number) => {
    // Update both size and position if provided
    if (x !== undefined && y !== undefined) {
      updateWindow(window.id, {
        size: { width, height },
        position: { x, y }
      });
    } else {
      resizeWindow(window.id, width, height);
    }
  }, [window.id, updateWindow, resizeWindow]);

  const { isResizing, handleResizeStart } = useResize({
    windowRef: windowRef,
    onResize: handleResize,
    onResizeStart: () => focusWindow(window.id),
    minWidth: 250,
    minHeight: 200,
  });

  const handleClose = () => removeWindow(window.id);
  const handleMinimize = () => minimizeWindow(window.id);
  const handleMaximize = () => {
    if (window.maximized) {
      restoreWindow(window.id);
    } else {
      maximizeWindow(window.id);
    }
  };

  const getWindowIcon = () => {
    switch (window.type) {
      case 'vscode': return '🖥️';
      case 'claude': return '🤖';
      case 'terminal': return '⚡';
      case 'file-manager': return '📁';
      case 'preview': return '🌐';
      default: return '📱';
    }
  };

  const getWindowStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      left: window.position.x,
      top: window.position.y,
      width: window.maximized ? '100%' : window.size.width,
      height: window.maximized ? '100%' : window.size.height,
      zIndex: window.zIndex,
      transform: window.maximized ? 'none' : undefined,
    };

    if (window.maximized) {
      return {
        ...baseStyles,
        left: 0,
        top: 0,
      };
    }

    return baseStyles;
  };

  return (
    <div
      ref={windowRef}
      style={getWindowStyles()}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700
        ${window.focused ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-300 dark:ring-gray-600'}
        ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
        ${isResizing ? 'select-none' : ''}
        transition-all duration-150 ease-out
        will-change-transform
      `}
      onClick={() => focusWindow(window.id)}
    >
      {/* Title Bar */}
      <div
        ref={titleBarRef}
        className={`
          flex items-center justify-between h-8 px-3 bg-gray-50 dark:bg-gray-700 
          rounded-t-lg border-b border-gray-200 dark:border-gray-600
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          select-none
        `}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm">{getWindowIcon()}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {window.title}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center group"
          >
            <Minus className="w-2 h-2 text-yellow-800 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
            className="w-3 h-3 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center group"
          >
            <Square className="w-2 h-2 text-green-800 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center group"
          >
            <X className="w-2 h-2 text-red-800 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="h-full pb-8 overflow-hidden">
        <WindowContent window={window} />
      </div>

      {/* Resize Handles - Only show when not maximized */}
      {!window.maximized && (
        <>
          {/* Edge Handles */}
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize hover:bg-blue-500/20 transition-colors"
            style={{ top: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'n')}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize hover:bg-blue-500/20 transition-colors"
            style={{ bottom: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 's')}
          />
          <div
            className="absolute top-2 bottom-2 right-0 w-1 cursor-e-resize hover:bg-blue-500/20 transition-colors"
            style={{ right: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'e')}
          />
          <div
            className="absolute top-2 bottom-2 left-0 w-1 cursor-w-resize hover:bg-blue-500/20 transition-colors"
            style={{ left: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'w')}
          />

          {/* Corner Handles */}
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500/30 transition-colors"
            style={{ top: '-2px', right: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'ne')}
          />
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500/30 transition-colors"
            style={{ top: '-2px', left: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'nw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500/30 transition-colors"
            style={{ bottom: '-2px', right: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'se')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500/30 transition-colors"
            style={{ bottom: '-2px', left: '-2px' }}
            onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'sw')}
          />
        </>
      )}
    </div>
  );
}

function WindowContent({ window }: { window: WindowType }) {
  const getContentBackground = () => {
    switch (window.type) {
      case 'vscode': return 'bg-gray-900 text-green-400';
      case 'claude': return 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200';
      case 'terminal': return 'bg-black text-green-400';
      default: return 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={`w-full h-full p-4 font-mono text-sm ${getContentBackground()}`}>
      {window.type === 'vscode' && (
        <div>
          <div className="text-blue-400 mb-2">{`// ${window.title}`}</div>
          <div className="text-purple-400">import</div>
          <div className="ml-4 text-yellow-400">React</div>
          <div className="text-purple-400">from</div>
          <div className="ml-4 text-green-300">&apos;react&apos;;</div>
          <br />
          <div className="text-blue-400">const</div>
          <div className="ml-4 text-yellow-400">AgentsOS</div>
          <div className="text-purple-400">=</div>
          <div className="ml-4">() =&gt; &#123;</div>
          <div className="ml-8 text-blue-400">return</div>
          <div className="ml-12 text-green-300">&lt;div&gt;Welcome to AgentsOS!&lt;/div&gt;</div>
          <div className="ml-4">&#125;</div>
        </div>
      )}
      
      {window.type === 'claude' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              C
            </div>
            <div>
              <div className="font-semibold">Claude</div>
              <div className="text-sm text-gray-500">AI Assistant</div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
            👋 Hello! I&apos;m Claude, your AI assistant. I can help you with coding, writing, analysis, and more. 
            What would you like to work on today?
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Ready to help</span>
          </div>
        </div>
      )}
      
      {window.type === 'terminal' && (
        <div>
          <div className="text-green-400">$ npm run dev</div>
          <div className="text-blue-400">✓ Local: http://localhost:3000</div>
          <div className="text-green-400">✓ Ready in 2.1s</div>
          <br />
          <div className="text-green-400">$ _</div>
          <div className="animate-pulse bg-green-400 w-2 h-4 inline-block ml-1"></div>
        </div>
      )}
      
      {!['vscode', 'claude', 'terminal'].includes(window.type) && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-4">{window.type === 'file-manager' ? '📁' : '🌐'}</div>
            <div className="text-lg font-semibold">{window.title}</div>
            <div className="text-gray-500 mt-2">Content loading...</div>
          </div>
        </div>
      )}
    </div>
  );
}