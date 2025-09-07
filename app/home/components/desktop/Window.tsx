'use client';

import React, { useRef, useCallback, useState, memo, useEffect } from 'react';
import { Window as WindowType } from '../../stores/windowStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useDrag } from '../../hooks/useDrag';
import { useResize } from '../../hooks/useResize';
import { useSnapZones, SnapZone } from '../../hooks/useSnapZones';
import { X, Minus, Square } from 'lucide-react';
import { TOTAL_DOCK_AREA, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT, MENU_BAR_HEIGHT } from '../../constants/layout';
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
  const [dockIconRect, setDockIconRect] = useState<DOMRect | null>(null);

  // State for optimized resizing
  const [optimizedSize, setOptimizedSize] = useState<{ width: number; height: number } | null>(null);
  const [optimizedPosition, setOptimizedPosition] = useState<{ x: number; y: number } | null>(null);

  const { focusWindow, removeWindow, minimizeWindow, maximizeWindow, restoreWindow, moveWindow, updateWindow, setWindowAnimating } = useWorkspaceStore();

  useEffect(() => {
    const dockIcon = document.querySelector(`[data-dock-icon="${window.type}"]`);
    if (dockIcon) {
      setDockIconRect(dockIcon.getBoundingClientRect());
    }
  }, [window.type]);

  const { handleDragMove, handleDragEnd } = useSnapZones({});

  const performSnap = useCallback((zone: SnapZone) => {
    updateWindow(window.id, {
      position: { x: zone.preview.x, y: zone.preview.y - MENU_BAR_HEIGHT },
      size: { width: zone.preview.width, height: zone.preview.height },
      maximized: zone.id === 'top',
      previousState: zone.id === 'top' ? { position: window.position, size: window.size } : undefined,
    });
  }, [window.id, updateWindow, window.position, window.size]);

  const handleDrag = useCallback((deltaX: number, deltaY: number, currentX: number, currentY: number) => {
    if (window.maximized) {
      const restoredWidth = window.previousState?.size.width || 800;
      const restoredHeight = window.previousState?.size.height || 600;
      
      // Calculate the new position centered under the cursor
      // The drag offset should be based on the new, un-maximized size
      const newX = currentX - (restoredWidth / 2);
      const newY = currentY - 20; // 20px for title bar height

      updateWindow(window.id, {
        maximized: false,
        position: { x: newX, y: newY },
        size: { width: restoredWidth, height: restoredHeight },
      });
      
      // Set the drag offset to start dragging from the cursor's position relative to the new window
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    setDragOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    handleDragMove(currentX, currentY);
  }, [window.id, window.maximized, window.previousState, handleDragMove, updateWindow]);

  const handleDragStart = useCallback(() => {
    focusWindow(window.id);
    setIsOptimizedDragging(true);
  }, [window.id, focusWindow]);

  const handleDragEndOptimized = useCallback((currentX: number, currentY: number) => {
    const snapZone = handleDragEnd(currentX, currentY);

    setIsOptimizedDragging(false);
    setDragOffset({ x: 0, y: 0 });

    if (snapZone) {
      performSnap(snapZone);
    } else {
      const finalX = Math.max(0, window.position.x + dragOffset.x);
      const finalY = Math.max(0, window.position.y + dragOffset.y);
      
      setSuppressTransitions(true);
      moveWindow(window.id, finalX, finalY);
      setTimeout(() => setSuppressTransitions(false), 50);
    }
  }, [window.id, window.position, dragOffset, moveWindow, handleDragEnd, performSnap]);

  const { isDragging } = useDrag({
    elementRef: titleBarRef,
    onDrag: handleDrag,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEndOptimized,
  });

  const handleResize = useCallback((width: number, height: number, x: number, y: number) => {
    setOptimizedSize({ width, height });
    setOptimizedPosition({ x, y });
  }, []);

  const handleResizeEnd = useCallback((width: number, height: number, x: number, y: number) => {
    setSuppressTransitions(true);
    setOptimizedSize(null);
    setOptimizedPosition(null);
    updateWindow(window.id, { size: { width, height }, position: { x, y } });
    setTimeout(() => setSuppressTransitions(false), 50);
  }, [window.id, updateWindow]);

  const { isResizing, handleResizeStart } = useResize({
    windowRef: windowRef,
    onResize: handleResize,
    onResizeStart: () => focusWindow(window.id),
    onResizeEnd: handleResizeEnd,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
  });

  const handleClose = () => removeWindow(window.id);
  
  const handleMinimize = useCallback(() => {
    setWindowAnimating(window.id, true);
    minimizeWindow(window.id);
  }, [window.id, minimizeWindow, setWindowAnimating]);

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

  const getWindowStyles = (): React.CSSProperties => {
    let left = window.position.x;
    let top = window.position.y;
    let width = window.size.width;
    let height = window.size.height;

    if (isResizing && optimizedSize && optimizedPosition) {
      width = optimizedSize.width;
      height = optimizedSize.height;
      left = optimizedPosition.x;
      top = optimizedPosition.y;
    }

    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      width, height, left, top,
      zIndex: window.zIndex,
    };

    if (window.maximized) {
      return { ...baseStyles, left: 0, top: 0, width: '100%', height: `calc(100% - ${TOTAL_DOCK_AREA}px)`, transform: 'none' };
    }

    let transform = 'translate(0, 0) scale(1)';
    let opacity = 1;

    if (window.minimized) {
      if (dockIconRect) {
        const scaleX = dockIconRect.width / width;
        const scaleY = dockIconRect.height / height;
        const translateX = dockIconRect.left - left + (dockIconRect.width - width) / 2;
        const translateY = dockIconRect.top - top + (dockIconRect.height - height) / 2;
        transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
        opacity = 0;
      } else {
        transform = 'scale(0)';
        opacity = 0;
      }
    }
    
    if (isOptimizedDragging) {
      return { ...baseStyles, transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`, willChange: 'transform' };
    }

    return { ...baseStyles, transform, opacity, willChange: 'transform, opacity' };
  };

  const onTransitionEnd = () => {
    if (window.isAnimating) {
      setWindowAnimating(window.id, false);
    }
  };

  return (
    <div
      ref={windowRef}
      style={getWindowStyles()}
      onTransitionEnd={onTransitionEnd}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        flex flex-col
        ${window.focused ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20' : 'ring-1 ring-gray-300 dark:ring-gray-600 shadow-xl'}
        ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
        ${isResizing ? 'select-none' : ''}
        ${window.minimized || window.isAnimating ? 'pointer-events-none' : ''}
        ${isDragging || isOptimizedDragging || isResizing || suppressTransitions ? '' : 'transition-all duration-300 ease-in-out'}
        transform-gpu contain-layout
      `}
      onClick={() => focusWindow(window.id)}
    >
      <div className="flex items-center justify-between h-8 px-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg border-b border-gray-200 dark:border-gray-600 select-none">
        <div ref={titleBarRef} className={`flex-1 flex items-center space-x-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
          <span className="text-sm">{getWindowIcon()}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{window.title}</span>
        </div>
        <div className="flex items-center space-x-1" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={(e) => { e.stopPropagation(); handleMinimize(); }} className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center group transition-colors" data-testid="minimize-button">
            <Minus className="w-2 h-2 text-yellow-800 opacity-0 group-hover:opacity-100" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleMaximize(); }} className="w-3 h-3 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center group transition-colors">
            <Square className="w-2 h-2 text-green-800 opacity-0 group-hover:opacity-100" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="w-3 h-3 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center group transition-colors">
            <X className="w-2 h-2 text-red-800 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden ${isDragging || isResizing ? 'opacity-90 pointer-events-none' : ''}`}>
        <WindowContent window={window} onFocus={() => focusWindow(window.id)} />
      </div>

      {!window.maximized && (
        <div data-testid="resize-handles">
          <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize hover:bg-blue-500/20" style={{ top: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'n')} />
          <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize hover:bg-blue-500/20" style={{ bottom: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 's')} />
          <div className="absolute top-2 bottom-2 right-0 w-1 cursor-e-resize hover:bg-blue-500/20" style={{ right: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'e')} />
          <div className="absolute top-2 bottom-2 left-0 w-1 cursor-w-resize hover:bg-blue-500/20" style={{ left: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'w')} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500/30" style={{ top: '-2px', right: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'ne')} />
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500/30" style={{ top: '-2px', left: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'nw')} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500/30" style={{ bottom: '-2px', right: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'se')} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500/30" style={{ bottom: '-2px', left: '-2px' }} onPointerDown={(e) => handleResizeStart(e.nativeEvent, 'sw')} />
        </div>
      )}
    </div>
  );
}

const WindowContent = memo(function WindowContent({ window, onFocus }: { window: WindowType; onFocus: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const app = getApp(window.type);
  const { sandboxId } = useWorkspaceStore();
  
  useEffect(() => {
    if (!contentRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      const resizeEvent = new CustomEvent('windowContentResize', { detail: { windowId: window.id } });
      globalThis.dispatchEvent(resizeEvent);
    });
    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
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
  
  // Render content with proper typed props based on app type
  const renderContent = () => {
    // Switch case ensures we handle all app types - compiler will error if we add new types
    switch (window.type) {
      case 'terminal': {
        const Component = DesktopContent as React.ComponentType<{ terminalPort?: number; onFocus?: () => void }>;
        return <Component terminalPort={window.terminalPort} onFocus={onFocus} />;
      }
      case 'claude': {
        const Component = DesktopContent as React.ComponentType<{ claudePort?: number; onFocus?: () => void }>;
        return <Component claudePort={window.claudePort} onFocus={onFocus} />;
      }
      case 'gemini': {
        const Component = DesktopContent as React.ComponentType<{ geminiPort?: number; onFocus?: () => void }>;
        return <Component geminiPort={window.geminiPort} onFocus={onFocus} />;
      }
      case 'vscode': {
        const Component = DesktopContent as React.ComponentType<{ repositoryUrl?: string }>;
        return <Component repositoryUrl={window.repositoryUrl} />;
      }
      case 'settings': {
        const Component = DesktopContent as React.ComponentType<Record<string, never>>;
        return <Component />;
      }
      case 'diff': {
        const Component = DesktopContent as React.ComponentType<{ workspaceId: string }>;
        return sandboxId ? <Component workspaceId={sandboxId} /> : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No workspace active
          </div>
        );
      }
      case 'setup': {
        const Component = DesktopContent as React.ComponentType<Record<string, never>>;
        return <Component />;
      }
      default: {
        // Fallback for any unhandled app types
        console.warn(`Unhandled window type: ${window.type}`);
        return <div className="w-full h-full flex items-center justify-center text-red-500">Unsupported app type: {window.type}</div>;
      }
    }
  };
  
  return (
    <div ref={contentRef} className="w-full h-full flex flex-col">
      {renderContent()}
    </div>
  );
});