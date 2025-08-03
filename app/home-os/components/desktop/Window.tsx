'use client';

import React, { useRef, useCallback, useState, memo, useEffect } from 'react';
import { Window as WindowType } from '../../stores/windowStore';
import { useWindowStore } from '../../stores/windowStore';
import { useDrag } from '../../hooks/useDrag';
import { useResize } from '../../hooks/useResize';
import { useSnapZones } from '../../hooks/useSnapZones';
import { useWindowAnimation } from '../../hooks/useWindowAnimation';
import { X, Minus, Square } from 'lucide-react';
import { TOTAL_DOCK_AREA, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '../../constants/layout';
import { getApp } from '../../apps';

interface WindowProps {
  window: WindowType;
}

export default function Window({ window }: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isOptimizedDragging, setIsOptimizedDragging] = useState(false);
  const [suppressTransitions, setSuppressTransitions] = useState(false);
  
  const { focusWindow, removeWindow, minimizeWindow, maximizeWindow, restoreWindow, moveWindow, resizeWindow, updateWindow, setWindowAnimating } = useWindowStore();

  // Snap zones integration
  const { handleDragMove, handleDragEnd } = useSnapZones({
    windowId: window.id,
  });

  // Handle window dragging with optimized transform updates
  const handleDrag = useCallback((deltaX: number, deltaY: number, currentX: number, currentY: number) => {
    // If window is maximized, restore it to normal size and start dragging
    if (window.maximized) {
      // Restore window to a reasonable size centered under cursor
      const restoredWidth = 800;
      const restoredHeight = 600;
      const newX = Math.max(0, currentX - restoredWidth / 2);
      const newY = Math.max(0, currentY - 40); // 40px offset for title bar
      
      restoreWindow(window.id);
      moveWindow(window.id, newX, newY);
      resizeWindow(window.id, restoredWidth, restoredHeight);
      
      // Start dragging from this position
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    
    // Update transform offset for smooth dragging
    setDragOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    // Check for snap zones during drag
    handleDragMove(currentX, currentY);
  }, [window.maximized, handleDragMove, restoreWindow, moveWindow, resizeWindow, window.id]);

  const handleDragStart = useCallback(() => {
    focusWindow(window.id);
    setIsOptimizedDragging(true);
  }, [window.id, focusWindow]);

  const handleDragEndOptimized = useCallback((currentX: number, currentY: number) => {
    // Calculate final position
    const finalX = Math.max(0, window.position.x + dragOffset.x);
    const finalY = Math.max(0, window.position.y + dragOffset.y);
    
    // Suppress transitions during the position change
    setSuppressTransitions(true);
    
    // Reset optimized dragging and offset FIRST to prevent double-offsetting
    setIsOptimizedDragging(false);
    setDragOffset({ x: 0, y: 0 });
    
    // Then update the store position - this will cause a re-render with correct positioning
    moveWindow(window.id, finalX, finalY);
    
    // Re-enable transitions after a short delay
    setTimeout(() => setSuppressTransitions(false), 50);
    
    // Handle snap zones
    handleDragEnd(currentX, currentY);
  }, [window.id, window.position, dragOffset, moveWindow, handleDragEnd]);

  const { isDragging } = useDrag({
    elementRef: titleBarRef,
    onDrag: handleDrag,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEndOptimized,
  });

  // Handle window resizing
  const handleResize = useCallback((width: number, height: number, x?: number, y?: number) => {
    // Update size and position if any position values are provided
    if (x !== undefined || y !== undefined) {
      updateWindow(window.id, {
        size: { width, height },
        position: { 
          x: x !== undefined ? x : window.position.x, 
          y: y !== undefined ? y : window.position.y 
        }
      });
    } else {
      resizeWindow(window.id, width, height);
    }
  }, [window.id, updateWindow, resizeWindow, window.position]);

  const { isResizing, handleResizeStart } = useResize({
    windowRef: windowRef,
    onResize: handleResize,
    onResizeStart: () => focusWindow(window.id),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
  });

  // Window animation hook
  const { animateMinimizeToTarget } = useWindowAnimation({
    onAnimationComplete: () => {
      setWindowAnimating(window.id, false);
    }
  });

  const handleClose = () => removeWindow(window.id);
  
  const handleMinimize = useCallback(() => {
    // Find the dock icon for this window type
    const dockIcon = document.querySelector(`[data-dock-icon="${window.type}"]`) as HTMLElement;
    
    if (windowRef.current && dockIcon) {
      setWindowAnimating(window.id, true);
      const animation = animateMinimizeToTarget(windowRef.current, dockIcon);
      animation.addEventListener('finish', () => {
        minimizeWindow(window.id);
      });
    } else {
      // Fallback to immediate minimize if dock icon not found
      minimizeWindow(window.id);
    }
  }, [window.id, window.type, animateMinimizeToTarget, minimizeWindow, setWindowAnimating]);

  const handleMaximize = () => {
    if (window.maximized) {
      restoreWindow(window.id);
    } else {
      maximizeWindow(window.id);
    }
  };

  const getWindowIcon = () => {
    const app = getApp(window.type);
    return app?.metadata.icon.emoji || '📱';
  };

  const getWindowStyles = () => {
    if (window.maximized) {
      return {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        width: '100%',
        height: `calc(100% - ${TOTAL_DOCK_AREA}px)`,
        zIndex: window.zIndex,
        transform: 'none',
      };
    }

    // Use left/top for reliable positioning, only use transform for drag optimization
    if (isOptimizedDragging) {
      return {
        position: 'absolute' as const,
        left: window.position.x,
        top: window.position.y,
        width: window.size.width,
        height: window.size.height,
        zIndex: window.zIndex,
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
        willChange: 'transform',
      };
    }

    return {
      position: 'absolute' as const,
      left: window.position.x,
      top: window.position.y,
      width: window.size.width,
      height: window.size.height,
      zIndex: window.zIndex,
      willChange: 'auto',
    };
  };

  return (
    <div
      ref={windowRef}
      style={getWindowStyles()}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        flex flex-col
        ${window.focused 
          ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20' 
          : 'ring-1 ring-gray-300 dark:ring-gray-600 shadow-xl'
        }
        ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
        ${isResizing ? 'select-none' : ''}
        ${window.isAnimating ? 'pointer-events-none' : ''}
        ${isDragging || isOptimizedDragging || suppressTransitions ? 'transition-none' : 'focus-smooth'}
        ${isDragging ? 'scale-[1.01]' : 'scale-100'}
        transform-gpu
        contain-layout
      `}
      onClick={() => focusWindow(window.id)}
    >
      {/* Title Bar */}
      <div
        className={`
          flex items-center justify-between h-8 px-3 bg-gray-50 dark:bg-gray-700 
          rounded-t-lg border-b border-gray-200 dark:border-gray-600
          select-none
        `}
      >
        <div 
          ref={titleBarRef}
          className={`flex-1 flex items-center space-x-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <span className="text-sm">{getWindowIcon()}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {window.title}
          </span>
        </div>
        
        <div className="flex items-center space-x-1" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center group transition-colors"
            data-testid="minimize-button"
          >
            <Minus className="w-2 h-2 text-yellow-800 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
            className="w-3 h-3 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center group transition-colors"
          >
            <Square className="w-2 h-2 text-green-800 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center group transition-colors"
          >
            <X className="w-2 h-2 text-red-800 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className={`flex-1 overflow-hidden ${isDragging ? 'opacity-90 pointer-events-none' : ''}`}>
        <WindowContent window={window} />
      </div>

      {/* Resize Handles - Only show when not maximized */}
      {!window.maximized && (
        <div data-testid="resize-handles">
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
        </div>
      )}
    </div>
  );
}

const WindowContent = memo(function WindowContent({ window }: { window: WindowType }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const app = getApp(window.type);
  
  // Add resize observer to trigger terminal resize when window size changes
  useEffect(() => {
    if (!contentRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      // Dispatch a custom resize event that the terminal can listen to
      const resizeEvent = new CustomEvent('windowContentResize', {
        detail: { windowId: window.id }
      });
      globalThis.dispatchEvent(resizeEvent);
    });
    
    resizeObserver.observe(contentRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [window.id]);
  
  if (!app) {
    return (
      <div ref={contentRef} className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
        <div className="text-center">
          <div className="text-4xl mb-4">❓</div>
          <div className="text-lg font-semibold">Unknown App</div>
          <div className="text-gray-500 mt-2">App type &quot;{window.type}&quot; not found</div>
        </div>
      </div>
    );
  }

  const DesktopContent = app.content.desktop;
  
  return (
    <div ref={contentRef} className="w-full h-full flex flex-col">
      <DesktopContent repositoryUrl={window.repositoryUrl} />
    </div>
  );
});