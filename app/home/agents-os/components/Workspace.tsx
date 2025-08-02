'use client';

import { useWindowStore } from '../stores/windowStore';
import Window from './Window';
import Dock from './Dock';
import MenuBar from './MenuBar';

export default function Workspace() {
  const windows = useWindowStore((state) => state.windows);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
      {/* Menu Bar */}
      <MenuBar />
      
      {/* Main workspace area */}
      <div className="absolute inset-x-0 top-8 bottom-16 overflow-hidden">
        {windows
          .filter((window) => !window.minimized)
          .map((window) => (
            <Window key={window.id} window={window} />
          ))}
      </div>

      {/* Dock */}
      <Dock />
    </div>
  );
}