'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AppMetadata } from '../../apps/BaseApp';

interface AppIconProps {
  icon: AppMetadata['icon'];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { imageSize: 20, emojiSize: 'text-lg', imageClasses: 'w-5 h-5' },
  md: { imageSize: 24, emojiSize: 'text-2xl', imageClasses: 'w-6 h-6' },
  lg: { imageSize: 32, emojiSize: 'text-3xl', imageClasses: 'w-8 h-8' }
};

/**
 * AppIcon Component - Displays app icons with URL fallback to emoji
 * 
 * Features:
 * - Tries to load icon from URL first
 * - Falls back to emoji if URL fails or doesn't exist
 * - Multiple sizes (sm, md, lg)
 * - Graceful error handling
 * - Optimized with Next.js Image component
 */
export default function AppIcon({ icon, size = 'md', className = '' }: AppIconProps) {
  const [imageError, setImageError] = useState(false);
  const { imageSize, emojiSize, imageClasses } = sizeMap[size];
  
  // Priority: React icon component > URL image > emoji > fallback
  
  // If React icon component is provided, use it
  if (icon.icon) {
    return (
      <div className={`${imageClasses} ${className}`}>
        {icon.icon}
      </div>
    );
  }
  
  // If URL provided and hasn't failed, try to load image
  if (icon.url && !imageError) {
    return (
      <Image
        src={icon.url}
        alt={`App icon`}
        width={imageSize}
        height={imageSize}
        className={`${imageClasses} ${className}`}
        onError={() => setImageError(true)}
        priority={false}
        unoptimized
        draggable={false}
      />
    );
  }
  
  // Fall back to emoji or fallback
  return (
    <span className={`${emojiSize} ${className}`}>
      {icon.emoji || icon.fallback}
    </span>
  );
}