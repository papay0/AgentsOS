import { useCallback, useEffect, useRef, useState } from 'react';
import { MENU_BAR_HEIGHT, TOTAL_DOCK_AREA, MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from '../constants/layout';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseResizeOptions {
  windowRef: React.RefObject<HTMLElement | null>;
  onResize: (width: number, height: number, x?: number, y?: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
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
  });

  const animationFrame = useRef<number | undefined>(undefined);

  const getCursor = (direction: ResizeDirection): string => {
    const cursors = {
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize',
      ne: 'ne-resize',
      nw: 'nw-resize',
      se: 'se-resize',
      sw: 'sw-resize',
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
      startBounds: bounds, // Keep viewport coordinates for consistency
      startPointer: { x: event.clientX, y: event.clientY },
    });

    onResizeStart?.();

    // Set cursor on document body for consistent cursor during drag
    document.body.style.cursor = getCursor(direction);
    document.body.style.userSelect = 'none';

    // Capture pointer
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [windowRef, onResizeStart]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!resizeState.isResizing || !resizeState.startBounds || !resizeState.startPointer || !resizeState.direction) {
      return;
    }

    // Cancel previous animation frame
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    // Use RAF for smooth 60fps updates
    animationFrame.current = requestAnimationFrame(() => {
      const deltaX = event.clientX - resizeState.startPointer!.x;
      const deltaY = event.clientY - resizeState.startPointer!.y;
      
      let newWidth = resizeState.startBounds!.width;
      let newHeight = resizeState.startBounds!.height;
      let newX = resizeState.startBounds!.left;
      let newY = resizeState.startBounds!.top;

      // Calculate new dimensions based on resize direction
      switch (resizeState.direction) {
        case 'e': // East
          newWidth = resizeState.startBounds!.width + deltaX;
          break;
        case 'w': // West
          newWidth = resizeState.startBounds!.width - deltaX;
          newX = resizeState.startBounds!.left + deltaX;
          break;
        case 's': // South
          newHeight = resizeState.startBounds!.height + deltaY;
          break;
        case 'n': // North
          newHeight = resizeState.startBounds!.height - deltaY;
          newY = resizeState.startBounds!.top + deltaY;
          break;
        case 'se': // Southeast
          newWidth = resizeState.startBounds!.width + deltaX;
          newHeight = resizeState.startBounds!.height + deltaY;
          break;
        case 'sw': // Southwest
          newWidth = resizeState.startBounds!.width - deltaX;
          newHeight = resizeState.startBounds!.height + deltaY;
          newX = resizeState.startBounds!.left + deltaX;
          break;
        case 'ne': // Northeast
          newWidth = resizeState.startBounds!.width + deltaX;
          newHeight = resizeState.startBounds!.height - deltaY;
          newY = resizeState.startBounds!.top + deltaY;
          break;
        case 'nw': // Northwest
          newWidth = resizeState.startBounds!.width - deltaX;
          newHeight = resizeState.startBounds!.height - deltaY;
          newX = resizeState.startBounds!.left + deltaX;
          newY = resizeState.startBounds!.top + deltaY;
          break;
      }

      // Apply size constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      // Ensure window stays within workspace bounds
      if (resizeState.direction?.includes('w')) {
        newX = Math.max(0, Math.min(window.innerWidth - newWidth, newX));
      }
      if (resizeState.direction?.includes('n')) {
        newY = Math.max(MENU_BAR_HEIGHT, Math.min(window.innerHeight - TOTAL_DOCK_AREA - newHeight, newY));
      }

      // Apply changes directly to DOM for performance (bypass React)
      const element = windowRef.current;
      if (element) {
        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;
        
        // Only update position for resize directions that actually move the window
        if (resizeState.direction?.includes('w')) {
          element.style.left = `${newX}px`;
        }
        if (resizeState.direction?.includes('n')) {
          // Convert viewport Y coordinate to workspace Y coordinate
          element.style.top = `${newY - MENU_BAR_HEIGHT}px`;
        }
        
        element.style.transform = 'translate3d(0, 0, 0)'; // Force GPU layer
      }
    });
  }, [resizeState, windowRef, minWidth, minHeight, maxWidth, maxHeight]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!resizeState.isResizing) return;

    // Get final dimensions from DOM
    const element = windowRef.current;
    if (element) {
      const finalBounds = element.getBoundingClientRect();
      
      // Only update position for resize directions that actually move the window
      const shouldUpdateX = resizeState.direction?.includes('w');
      const shouldUpdateY = resizeState.direction?.includes('n');
      
      
      // Update React state with final values
      // Account for workspace container offset (menu bar height from top)
      onResize(
        finalBounds.width, 
        finalBounds.height,
        shouldUpdateX ? finalBounds.left : undefined,
        shouldUpdateY ? (finalBounds.top - MENU_BAR_HEIGHT) : undefined
      );
    }

    // Clean up
    setResizeState({
      isResizing: false,
      direction: null,
      startBounds: null,
      startPointer: null,
    });

    // Reset cursor and selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Release pointer capture
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);

    // Cancel animation frame
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    onResizeEnd?.();
  }, [resizeState.isResizing, resizeState.direction, windowRef, onResize, onResizeEnd]);

  // Global event listeners
  useEffect(() => {
    if (resizeState.isResizing) {
      document.addEventListener('pointermove', handlePointerMove, { passive: false });
      document.addEventListener('pointerup', handlePointerUp);

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [resizeState.isResizing, handlePointerMove, handlePointerUp]);

  return {
    isResizing: resizeState.isResizing,
    resizeDirection: resizeState.direction,
    handleResizeStart,
  };
}