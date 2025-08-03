'use client';

import { useState, useRef } from 'react';
import { MobileApp } from './MobileWorkspace';
import AppIcon from '../ui/AppIcon';

interface MobileHomeProps {
  apps: MobileApp[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onAppOpen: (app: MobileApp) => void;
}

const APPS_PER_PAGE = 16; // 4x4 grid
const DOCK_APPS = 4;

export default function MobileHome({ apps, currentPage, onPageChange, onAppOpen }: MobileHomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  
  // Filter out dock apps and organize into pages
  const homeApps = apps.slice(DOCK_APPS);
  const totalPages = Math.ceil(homeApps.length / APPS_PER_PAGE);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = startX - currentX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentPage < totalPages - 1) {
        onPageChange(currentPage + 1);
      } else if (diff < 0 && currentPage > 0) {
        onPageChange(currentPage - 1);
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const translateX = isDragging ? (currentX - startX) / 3 : 0;

  const AppButton = ({ app }: { app: MobileApp }) => (
    <button
      onClick={() => onAppOpen(app)}
      onTouchStart={() => onAppOpen(app)}
      className="flex flex-col items-center space-y-1 p-2 rounded-xl active:scale-95 transition-transform duration-100 touch-manipulation"
    >
      <div className={`w-14 h-14 ${app.color} rounded-xl flex items-center justify-center shadow-lg active:shadow-md transition-shadow`}>
        <AppIcon icon={app.icon} size="lg" className="text-white" />
      </div>
      <span className="text-white dark:text-gray-200 text-xs font-medium drop-shadow-sm max-w-[60px] truncate">
        {app.name}
      </span>
    </button>
  );

  return (
    <div className="flex-1 overflow-hidden pt-8 pb-24">
      {/* Page indicator */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4 pb-2">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentPage ? 'bg-white dark:bg-gray-200' : 'bg-white/30 dark:bg-gray-400/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* App grid container */}
      <div
        ref={containerRef}
        className="h-full px-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${-currentPage * 100 + translateX}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div className="flex h-full" style={{ width: `${totalPages * 100}%` }}>
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div key={pageIndex} className="w-full h-full flex-shrink-0">
              <div className="grid grid-cols-4 gap-4 h-full content-start pt-2">
                {homeApps
                  .slice(pageIndex * APPS_PER_PAGE, (pageIndex + 1) * APPS_PER_PAGE)
                  .map((app) => (
                    <AppButton key={app.id} app={app} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}