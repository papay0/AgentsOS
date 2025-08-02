'use client';

import { useWindowStore } from '../stores/windowStore';
import { useState, useEffect } from 'react';
import Window from './Window';
import Dock from './Dock';
import MenuBar from './MenuBar';
import SnapZoneOverlay from './SnapZoneOverlay';

export default function Workspace() {
  const windows = useWindowStore((state) => state.windows);
  const [globalSnapState, setGlobalSnapState] = useState<{
    activeZone: { 
      id: 'left' | 'right' | 'top'; 
      bounds: { x: number; y: number; width: number; height: number }; 
      preview: { x: number; y: number; width: number; height: number }; 
    } | null;
    isVisible: boolean;
  }>({ activeZone: null, isVisible: false });

  // Listen for snap zone changes from any window
  useEffect(() => {
    const handleSnapZoneChange = (event: CustomEvent) => {
      setGlobalSnapState(event.detail);
    };

    window.addEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
    return () => window.removeEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
  }, []);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-gray-900">
      {/* Menu Bar */}
      <MenuBar />
      
      {/* Main workspace area - Full height, windows go behind dock */}
      <div className="absolute inset-x-0 top-8 bottom-0 overflow-hidden">
        {windows
          .filter((window) => !window.minimized)
          .map((window) => (
            <Window key={window.id} window={window} />
          ))}
      </div>

      {/* Dock - Floating over workspace */}
      <Dock />
      
      {/* Global snap zone overlay */}
      <SnapZoneOverlay 
        activeZone={globalSnapState.activeZone}
        isVisible={globalSnapState.isVisible}
      />
    </div>
  );
}