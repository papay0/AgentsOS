'use client';

import React, { forwardRef } from 'react';

interface TerminalIframeProps {
  url: string;
  title?: string;
  className?: string;
  backgroundColor?: string;
}

export const TerminalIframe = forwardRef<HTMLIFrameElement, TerminalIframeProps>(
  ({ url, title = 'Terminal', className = '', backgroundColor = '#ffffff' }, ref) => {
    return (
      <iframe
        ref={ref}
        src={url}
        className={`w-full h-full border-0 ${className}`}
        title={title}
        style={{ backgroundColor }}
      />
    );
  }
);

TerminalIframe.displayName = 'TerminalIframe';