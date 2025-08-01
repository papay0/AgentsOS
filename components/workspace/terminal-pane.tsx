'use client';

import React, { forwardRef } from 'react';
import { Terminal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TerminalIframe } from './terminal-iframe';
import type { TerminalPane as TerminalPaneType } from '@/types/workspace';

interface TerminalPaneProps {
  terminal: TerminalPaneType;
  onRemove: (id: string) => void;
}

export const TerminalPane = forwardRef<HTMLIFrameElement, TerminalPaneProps>(
  ({ terminal, onRemove }, ref) => {
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
          <TerminalIframe
            ref={ref}
            url={terminal.url}
            title={terminal.title}
          />
        </div>
      </div>
    );
  }
);

TerminalPane.displayName = 'TerminalPane';