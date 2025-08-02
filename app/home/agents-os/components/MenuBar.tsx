'use client';

import { Clock, Wifi, Battery } from 'lucide-react';

export default function MenuBar() {
  const currentTime = new Date().toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="absolute top-0 left-0 right-0 h-8 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 text-white text-sm z-50">
      {/* Left side - AgentsOS logo */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black text-xs font-bold">A</span>
          </div>
          <span className="font-semibold">AgentsOS</span>
        </div>
      </div>

      {/* Center - Active window info (optional) */}
      <div className="flex-1 text-center">
        {/* Could show active window title here */}
      </div>

      {/* Right side - System status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <Wifi className="w-4 h-4" />
        </div>
        <div className="flex items-center space-x-1">
          <Battery className="w-4 h-4" />
          <span className="text-xs">87%</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span className="text-xs">{currentTime}</span>
        </div>
      </div>
    </div>
  );
}