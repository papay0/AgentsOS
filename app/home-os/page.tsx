'use client';

import { useEffect } from 'react';
import Workspace from './components/Workspace';
import { useWindowStore } from './stores/windowStore';

export default function AgentsOSPage() {
  const initializeWindows = useWindowStore((state) => state.initializeWindows);

  useEffect(() => {
    // Initialize with some dummy windows
    initializeWindows();
  }, [initializeWindows]);

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
      <Workspace />
    </div>
  );
}