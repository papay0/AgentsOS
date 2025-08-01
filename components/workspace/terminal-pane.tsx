'use client';

import React, { useRef } from 'react';
import { Terminal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TerminalPane as TerminalPaneType } from '@/types/workspace';

interface TerminalPaneProps {
  terminal: TerminalPaneType;
  onRemove: (id: string) => void;
}

export function TerminalPane({ terminal, onRemove }: TerminalPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.onbeforeunload = null;
        }
      } catch {
        // Cross-origin restrictions - ignore
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <div className="h-full bg-white border border-gray-300 overflow-hidden flex flex-col">
      <div className="h-7 bg-gray-100 border-b border-gray-300 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">{terminal.title}</span>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-sm transition-all opacity-0 group-hover:opacity-100"
            onClick={() => onRemove(terminal.id)}
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 bg-white overflow-hidden group">
        <iframe
          ref={iframeRef}
          src={terminal.url}
          className="w-full h-full border-0"
          title={terminal.title}
          style={{ backgroundColor: '#ffffff' }}
        />
      </div>
    </div>
  );
}