'use client';

import { MobileApp } from './MobileWorkspace';

interface MobileDockProps {
  apps: MobileApp[];
  onAppOpen: (app: MobileApp) => void;
  onHomePress?: () => void; // Optional since not currently used
}

export default function MobileDock({ apps, onAppOpen, onHomePress }: MobileDockProps) {
  const DockIcon = ({ app }: { app: MobileApp }) => (
    <button
      onClick={() => onAppOpen(app)}
      onTouchStart={() => onAppOpen(app)}
      className={`w-14 h-14 ${app.color} rounded-xl flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform duration-100 touch-manipulation`}
    >
      {app.icon}
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-4">
      {/* Dock background - fully rounded like real iOS */}
      <div className="bg-white/20 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl mx-4 border border-white/10 dark:border-gray-600/20">
        <div className="flex items-center justify-center space-x-4 px-6 py-4">
          {apps.map((app) => (
            <DockIcon key={app.id} app={app} />
          ))}
        </div>
      </div>
    </div>
  );
}