import React, { ReactNode } from 'react';

interface MobileAppTemplateProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  bottomContent?: ReactNode;
  backgroundColor?: string;
}

/**
 * Mobile App Template - A reusable template for mobile app content
 * 
 * This template provides:
 * - Proper full-height flexbox layout
 * - Title and subtitle header section
 * - Expandable content area
 * - Optional bottom section for status/actions
 * 
 * Usage:
 * ```tsx
 * const MyMobileContent = () => (
 *   <MobileAppTemplate
 *     title="My App"
 *     subtitle="App Description"
 *     bottomContent={<div>Status: Online</div>}
 *   >
 *     <div>Your app content here</div>
 *   </MobileAppTemplate>
 * );
 * ```
 */
export default function MobileAppTemplate({ 
  title, 
  subtitle, 
  children, 
  bottomContent,
  backgroundColor = "bg-white dark:bg-gray-800"
}: MobileAppTemplateProps) {
  return (
    <div className={`w-full h-full ${backgroundColor} text-gray-800 dark:text-gray-200 p-4 flex flex-col`}>
      {/* Header Section */}
      <div className="text-center mb-4">
        <div className="text-lg font-semibold">{title}</div>
        {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
      </div>
      
      {/* Main Content Area - Expandable */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      
      {/* Bottom Section (Optional) */}
      {bottomContent && (
        <div className="mt-4 text-center">
          {bottomContent}
        </div>
      )}
    </div>
  );
}