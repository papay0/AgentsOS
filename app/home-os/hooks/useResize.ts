import { useCallback, useEffect, useRef, useState } from 'react';
import { MENU_BAR_HEIGHT, TOTAL_DOCK_AREA, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '../constants/layout';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseResizeOptions {
  windowRef: React.RefObject<HTMLElement | null>;
  onResize: (width: number, height: number, x: number, y: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: (width: number, height: number, x: number, y: number) => void;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface ResizeState {
  isResizing: boolean;
  direction: ResizeDirection | null;
  startBounds: DOMRect | null;
  startPointer: { x: number; y: number } | null;
  lastDimensions: { width: number; height: number; x: number; y: number } | null;
}

export function useResize({ 
  windowRef, 
  onResize, 
  onResizeStart, 
  onResizeEnd,
  minWidth = MIN_WINDOW_WIDTH,
  minHeight = MIN_WINDOW_HEIGHT,
  maxWidth = window.innerWidth,
  maxHeight = window.innerHeight - MENU_BAR_HEIGHT - TOTAL_DOCK_AREA
}: UseResizeOptions) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    direction: null,
    startBounds: null,
    startPointer: null,
    lastDimensions: null,
  });

  const animationFrame = useRef<number | undefined>(undefined);

  const getCursor = (direction: ResizeDirection): string => {
    const cursors = {
      n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
      ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
    };
    return cursors[direction];
  };

  const handleResizeStart = useCallback((event: PointerEvent, direction: ResizeDirection) => {
    event.preventDefault();
    event.stopPropagation();

    const element = windowRef.current;
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    
    setResizeState({
      isResizing: true,
      direction,
      startBounds: bounds,
      startPointer: { x: event.clientX, y: event.clientY },
      lastDimensions: { width: bounds.width, height: bounds.height, x: bounds.left, y: bounds.top },
    });

    onResizeStart?.();
    document.body.style.cursor = getCursor(direction);
    document.body.style.userSelect = 'none';
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [windowRef, onResizeStart]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!resizeState.isResizing || !resizeState.startBounds || !resizeState.startPointer || !resizeState.direction) {
      return;
    }

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    animationFrame.current = requestAnimationFrame(() => {
      const deltaX = event.clientX - resizeState.startPointer!.x;
      const deltaY = event.clientY - resizeState.startPointer!.y;
      
      let newWidth = resizeState.startBounds!.width;
      let newHeight = resizeState.startBounds!.height;
      let newX = resizeState.startBounds!.left;
      let newY = resizeState.startBounds!.top;

      if (resizeState.direction!.includes('e')) newWidth = resizeState.startBounds!.width + deltaX;
      if (resizeState.direction!.includes('w')) {
        newWidth = resizeState.startBounds!.width - deltaX;
        newX = resizeState.startBounds!.left + deltaX;
      }
      if (resizeState.direction!.includes('s')) newHeight = resizeState.startBounds!.height + deltaY;
      if (resizeState.direction!.includes('n')) {
        newHeight = resizeState.startBounds!.height - deltaY;
        newY = resizeState.startBounds!.top + deltaY;
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      if (resizeState.direction?.includes('w')) newX = Math.max(0, Math.min(window.innerWidth - newWidth, newX));
      if (resizeState.direction?.includes('n')) newY = Math.max(MENU_BAR_HEIGHT, Math.min(window.innerHeight - TOTAL_DOCK_AREA - newHeight, newY));
      
      const workspaceY = newY - MENU_BAR_HEIGHT;

      setResizeState(prev => ({ ...prev, lastDimensions: { width: newWidth, height: newHeight, x: newX, y: workspaceY } }));
      onResize(newWidth, newHeight, newX, workspaceY);
    });
  }, [resizeState, onResize, minWidth, minHeight, maxWidth, maxHeight]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!resizeState.isResizing) return;

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    if (onResizeEnd && resizeState.lastDimensions) {
      onResizeEnd(resizeState.lastDimensions.width, resizeState.lastDimensions.height, resizeState.lastDimensions.x, resizeState.lastDimensions.y);
    }

    setResizeState({
      isResizing: false,
      direction: null,
      startBounds: null,
      startPointer: null,
      lastDimensions: null,
    });

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  }, [resizeState, onResizeEnd]);

  useEffect(() => {
    if (resizeState.isResizing) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [resizeState.isResizing, handlePointerMove, handlePointerUp]);

  return {
    isResizing: resizeState.isResizing,
    handleResizeStart,
  };
}
