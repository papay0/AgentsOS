import { useCallback, useEffect, useRef, useState } from 'react';
import { MENU_BAR_HEIGHT, TOTAL_DOCK_AREA, SNAP_TRIGGER_WIDTH, SNAP_TRIGGER_HEIGHT } from '../constants/layout';

export interface SnapZone {
  id: 'left' | 'right' | 'top';
  bounds: { x: number; y: number; width: number; height: number };
  preview: { x: number; y: number; width: number; height: number };
}

interface UseSnapZonesOptions {
  onSnapStart?: () => void;
  onSnapEnd?: () => void;
}

export function useSnapZones({ onSnapStart, onSnapEnd }: UseSnapZonesOptions) {
  const [activeZone, setActiveZone] = useState<SnapZone | null>(null);
  const snapTimeout = useRef<number | undefined>(undefined);

  const getSnapZones = useCallback((): SnapZone[] => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const workspaceHeight = screenHeight - MENU_BAR_HEIGHT - TOTAL_DOCK_AREA;
    
    return [
      {
        id: 'left',
        bounds: { x: 0, y: MENU_BAR_HEIGHT, width: SNAP_TRIGGER_WIDTH, height: workspaceHeight },
        preview: { x: 0, y: MENU_BAR_HEIGHT, width: screenWidth / 2, height: workspaceHeight },
      },
      {
        id: 'right',
        bounds: { x: screenWidth - SNAP_TRIGGER_WIDTH, y: MENU_BAR_HEIGHT, width: SNAP_TRIGGER_WIDTH, height: workspaceHeight },
        preview: { x: screenWidth / 2, y: MENU_BAR_HEIGHT, width: screenWidth / 2, height: workspaceHeight },
      },
      {
        id: 'top',
        bounds: { x: SNAP_TRIGGER_WIDTH, y: MENU_BAR_HEIGHT, width: screenWidth - (SNAP_TRIGGER_WIDTH * 2), height: SNAP_TRIGGER_HEIGHT },
        preview: { x: 0, y: MENU_BAR_HEIGHT, width: screenWidth, height: workspaceHeight },
      },
    ];
  }, []);

  const checkSnapZone = useCallback((x: number, y: number): SnapZone | null => {
    const zones = getSnapZones();
    for (const zone of zones) {
      const { bounds } = zone;
      if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
        return zone;
      }
    }
    return null;
  }, [getSnapZones]);

  const handleDragMove = useCallback((x: number, y: number) => {
    const zone = checkSnapZone(x, y);
    
    if (zone !== activeZone) {
      setActiveZone(zone);
      
      window.dispatchEvent(new CustomEvent('snapZoneChange', {
        detail: { activeZone: zone, isVisible: !!zone }
      }));
      
      if (snapTimeout.current) clearTimeout(snapTimeout.current);

      if (zone) {
        snapTimeout.current = window.setTimeout(() => onSnapStart?.(), 100);
      } else {
        onSnapEnd?.();
      }
    }
  }, [activeZone, checkSnapZone, onSnapStart, onSnapEnd]);

  const handleDragEnd = useCallback((x: number, y: number): SnapZone | null => {
    const zone = checkSnapZone(x, y);
    
    setActiveZone(null);
    onSnapEnd?.();
    
    window.dispatchEvent(new CustomEvent('snapZoneChange', {
      detail: { activeZone: null, isVisible: false }
    }));
    
    if (snapTimeout.current) clearTimeout(snapTimeout.current);
    
    return zone;
  }, [checkSnapZone, onSnapEnd]);

  useEffect(() => {
    return () => {
      if (snapTimeout.current) clearTimeout(snapTimeout.current);
    };
  }, []);

  return {
    activeZone,
    handleDragMove,
    handleDragEnd,
  };
}