'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
import { SetupData } from '../SetupWizard';

interface StepWallpaperProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
  onComplete?: () => void;
}

// Reuse wallpapers from SettingsApp
const wallpapers = [
  {
    id: 'wallpaper-1',
    name: 'Mountain Lake',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=240&fit=crop&crop=center&q=85'
  },
  {
    id: 'wallpaper-2',
    name: 'Forest Path',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=240&fit=crop&crop=center&q=85'
  },
  {
    id: 'wallpaper-3',
    name: 'Ocean Waves',
    url: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=400&h=240&fit=crop&crop=center&q=85'
  },
  {
    id: 'wallpaper-4',
    name: 'Forest Valley',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=240&fit=crop&crop=center&q=85'
  }
];

export const StepWallpaper = ({ 
  setupData, 
  updateSetupData, 
  isMobile
}: Omit<StepWallpaperProps, 'onNext'>) => {
  const handleWallpaperChange = (wallpaperId: string) => {
    updateSetupData({ wallpaper: wallpaperId });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wallpaper Grid */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {wallpapers.map((wallpaper) => (
          <div key={wallpaper.id} className="relative">
            <button
              onClick={() => handleWallpaperChange(wallpaper.id)}
              className={`relative w-full h-32 rounded-xl overflow-hidden border-3 transition-all duration-300 transform hover:scale-105 ${
                setupData.wallpaper === wallpaper.id 
                  ? 'border-blue-500 ring-4 ring-blue-200 dark:ring-blue-800 scale-105' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <Image
                src={wallpaper.thumb}
                alt={wallpaper.name}
                fill
                className="object-cover"
                sizes={isMobile ? "100vw" : "300px"}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {/* Selected Indicator */}
              {setupData.wallpaper === wallpaper.id && (
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};