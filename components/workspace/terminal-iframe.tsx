'use client';

import React from 'react';

interface TerminalIframeProps {
  url: string;
  title?: string;
  className?: string;
  backgroundColor?: string;
}

export function TerminalIframe({ 
  url, 
  title = 'Terminal', 
  className = '',
  backgroundColor = '#ffffff'
}: TerminalIframeProps) {
  return (
    <iframe
      src={url}
      className={`w-full h-full border-0 ${className}`}
      title={title}
      style={{ backgroundColor }}
    />
  );
}