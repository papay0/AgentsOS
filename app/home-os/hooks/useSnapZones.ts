import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { MENU_BAR_HEIGHT, TOTAL_DOCK_AREA, SNAP_TRIGGER_WIDTH, SNAP_TRIGGER_HEIGHT } from '../constants/layout';

interface SnapZone {
  id: 'left' | 'right' | 'top';
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  preview: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface UseSnapZonesOptions {
  windowId: string;
  onSnapStart?: () => void;
  onSnapEnd?: () => void;
}

export function useSnapZones({ windowId, onSnapStart, onSnapEnd }: UseSnapZonesOptions) {
  const [activeZone, setActiveZone] = useState<SnapZone | null>(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const snapTimeout = useRef<number | undefined>(undefined);
  
  const { updateWindow } = useWindowStore();

  // Get snap zones based on screen dimensions
  const getSnapZones = useCallback((): SnapZone[] => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const workspaceHeight = screenHeight - MENU_BAR_HEIGHT - TOTAL_DOCK_AREA;
    
    return [
      // Left snap zone
      {
        id: 'left',
        bounds: {
          x: 0,
          y: MENU_BAR_HEIGHT,
          width: SNAP_TRIGGER_WIDTH,
          height: workspaceHeight,
        },
        preview: {
          x: 0,
          y: MENU_BAR_HEIGHT, // For overlay display (viewport coordinates)
          width: screenWidth / 2,
          height: workspaceHeight,
        },
      },
      // Right snap zone  
      {
        id: 'right',
        bounds: {
          x: screenWidth - SNAP_TRIGGER_WIDTH,
          y: MENU_BAR_HEIGHT,
          width: SNAP_TRIGGER_WIDTH,
          height: workspaceHeight,
        },
        preview: {
          x: screenWidth / 2,
          y: MENU_BAR_HEIGHT, // For overlay display (viewport coordinates)
          width: screenWidth / 2,
          height: workspaceHeight,
        },
      },
      // Top snap zone (maximize)
      {
        id: 'top',
        bounds: {
          x: SNAP_TRIGGER_WIDTH,
          y: MENU_BAR_HEIGHT,
          width: screenWidth - (SNAP_TRIGGER_WIDTH * 2),
          height: SNAP_TRIGGER_HEIGHT,
        },
        preview: {
          x: 0,
          y: MENU_BAR_HEIGHT, // For overlay display (viewport coordinates)
          width: screenWidth,
          height: workspaceHeight,
        },
      },
    ];
  }, []);

  // Check if point is in snap zone
  const checkSnapZone = useCallback((x: number, y: number): SnapZone | null => {
    const zones = getSnapZones();
    
    for (const zone of zones) {
      const { bounds } = zone;
      if (
        x >= bounds.x && 
        x <= bounds.x + bounds.width &&
        y >= bounds.y && 
        y <= bounds.y + bounds.height
      ) {
        return zone;
      }
    }
    
    return null;
  }, [getSnapZones]);

  // Handle drag over for snap zone detection
  const handleDragMove = useCallback((x: number, y: number) => {
    if (isSnapping) return;
    
    const zone = checkSnapZone(x, y);
    
    if (zone !== activeZone) {
      setActiveZone(zone);
      
      // Dispatch event to update global snap state
      window.dispatchEvent(new CustomEvent('snapZoneChange', {
        detail: {
          activeZone: zone,
          isVisible: !!zone
        }
      }));
      
      if (zone) {
        // Clear any existing timeout
        if (snapTimeout.current) {
          clearTimeout(snapTimeout.current);
        }
        
        // Add small delay before showing preview to prevent jitter
        snapTimeout.current = window.setTimeout(() => {
          onSnapStart?.();
        }, 100);
      } else {
        // Clear timeout if moving away from zone
        if (snapTimeout.current) {
          clearTimeout(snapTimeout.current);
        }
        onSnapEnd?.();
      }
    }
  }, [activeZone, isSnapping, checkSnapZone, onSnapStart, onSnapEnd]);

  // Perform the actual snap with animation
  const performSnap = useCallback((zone: SnapZone) => {
    if (isSnapping) return;
    
    setIsSnapping(true);
    onSnapStart?.();
    
    const { preview } = zone;
    
    // Get current window state before updating
    const currentWindow = useWindowStore.getState().windows.find(w => w.id === windowId);
    
    // Update window with smooth animation
    // Convert viewport coordinates to workspace coordinates
    updateWindow(windowId, {
      position: { 
        x: preview.x, 
        y: preview.y - MENU_BAR_HEIGHT // Convert viewport Y to workspace Y
      },
      size: { width: preview.width, height: preview.height },
      maximized: zone.id === 'top',
      // Save previous state when maximizing via snap
      previousState: zone.id === 'top' && currentWindow ? {
        position: { ...currentWindow.position },
        size: { ...currentWindow.size }
      } : undefined,
    });
    
    // Reset state after animation
    setTimeout(() => {
      setIsSnapping(false);
      setActiveZone(null);
      onSnapEnd?.();
    }, 300); // Match animation duration
    
  }, [windowId, isSnapping, updateWindow, onSnapStart, onSnapEnd]);

  // Handle drag end - snap if in zone
  const handleDragEnd = useCallback((x: number, y: number) => {
    const zone = checkSnapZone(x, y);
    
    if (zone && !isSnapping) {
      performSnap(zone);
    } else {
      setActiveZone(null);
      onSnapEnd?.();
    }
    
    // Clear global snap state
    window.dispatchEvent(new CustomEvent('snapZoneChange', {
      detail: {
        activeZone: null,
        isVisible: false
      }
    }));
    
    // Clear any pending timeouts
    if (snapTimeout.current) {
      clearTimeout(snapTimeout.current);
    }
  }, [checkSnapZone, isSnapping, performSnap, onSnapEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (snapTimeout.current) {
        clearTimeout(snapTimeout.current);
      }
    };
  }, []);

  return {
    activeZone,
    isSnapping,
    handleDragMove,
    handleDragEnd,
    getSnapZones,
  };
}