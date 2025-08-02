'use client';

import { useEffect, useState } from 'react';
import { SNAP_OVERLAY_Z_INDEX } from '../../constants/layout';

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

interface SnapZoneOverlayProps {
  activeZone: SnapZone | null;
  isVisible: boolean;
}

export default function SnapZoneOverlay({ activeZone, isVisible }: SnapZoneOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible || !activeZone) {
    return null;
  }

  const { preview } = activeZone;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: SNAP_OVERLAY_Z_INDEX }}>
      {/* Preview window - shows where window will snap to */}
      <div
        className="absolute border-2 border-blue-500 bg-blue-500/20 backdrop-blur-sm rounded-lg transition-all duration-200 ease-out"
        style={{
          left: `${preview.x}px`,
          top: `${preview.y}px`,
          width: `${preview.width}px`,
          height: `${preview.height}px`,
          transform: 'translate3d(0, 0, 0)', // Force GPU acceleration
        }}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-2 border border-blue-400/50 rounded-md" />
        
        {/* Snap zone label */}
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          {activeZone.id === 'left' && 'Snap Left'}
          {activeZone.id === 'right' && 'Snap Right'}
          {activeZone.id === 'top' && 'Maximize'}
        </div>
      </div>
      
      {/* Trigger zones visualization (optional - for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {/* Left trigger zone */}
          <div 
            className="absolute bg-red-500/10 border border-red-500/30"
            style={{
              left: 0,
              top: 32,
              width: 50,
              height: window.innerHeight - 32 - 100,
            }}
          />
          {/* Right trigger zone */}
          <div 
            className="absolute bg-red-500/10 border border-red-500/30"
            style={{
              right: 0,
              top: 32,
              width: 50,
              height: window.innerHeight - 32 - 100,
            }}
          />
          {/* Top trigger zone */}
          <div 
            className="absolute bg-red-500/10 border border-red-500/30"
            style={{
              left: 50,
              top: 32,
              width: window.innerWidth - 100,
              height: 30,
            }}
          />
        </>
      )}
    </div>
  );
}