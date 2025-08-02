import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDragOptions {
  elementRef: React.RefObject<HTMLElement | null>;
  onDrag: (deltaX: number, deltaY: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function useDrag({ elementRef, onDrag, onDragStart, onDragEnd }: UseDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | undefined>(undefined);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    event.preventDefault();
    setIsDragging(true);
    lastPosition.current = { x: event.clientX, y: event.clientY };
    onDragStart?.();

    // Capture pointer to ensure we get all events
    if (elementRef.current) {
      elementRef.current.setPointerCapture(event.pointerId);
    }
  }, [elementRef, onDragStart]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!isDragging) return;

    // Cancel previous animation frame if it exists
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    // Use RAF for smooth performance
    animationFrame.current = requestAnimationFrame(() => {
      const deltaX = event.clientX - lastPosition.current.x;
      const deltaY = event.clientY - lastPosition.current.y;
      
      lastPosition.current = { x: event.clientX, y: event.clientY };
      onDrag(deltaX, deltaY);
    });
  }, [isDragging, onDrag]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    onDragEnd?.();

    // Release pointer capture
    if (elementRef.current) {
      elementRef.current.releasePointerCapture(event.pointerId);
    }

    // Cancel any pending animation frame
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  }, [isDragging, onDragEnd, elementRef]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add pointer event listeners
    element.addEventListener('pointerdown', handlePointerDown);
    
    // Global listeners for move and up (to handle dragging outside element)
    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      
      // Clean up animation frame
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [elementRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  return { isDragging };
}