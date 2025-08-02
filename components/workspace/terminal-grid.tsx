'use client';

import React, { useRef } from 'react';
import { Terminal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TerminalPane } from './terminal-pane';
import type { TerminalTab } from '@/types/workspace';
import type { TTYDTerminalRef } from '@/components/terminal';

interface TerminalGridProps {
  tab: TerminalTab;
  onRemoveTerminal: (terminalId: string) => void;
  onAddTerminal: (tabId: string) => void;
}

export function TerminalGrid({ tab, onRemoveTerminal, onAddTerminal }: TerminalGridProps) {
  const { terminals } = tab;
  const terminalRefs = useRef<{ [key: string]: TTYDTerminalRef | null }>({});
  
  if (terminals.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Terminal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg">No terminals in this tab</p>
          <Button 
            onClick={() => onAddTerminal(tab.id)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Terminal
          </Button>
        </div>
      </div>
    );
  }

  if (terminals.length === 1) {
    return (
      <div className="h-full">
        <TerminalPane 
          ref={(el) => {
            terminalRefs.current[terminals[0].id] = el;
          }}
          terminal={terminals[0]} 
          onRemove={onRemoveTerminal}
        />
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={50}>
          <TerminalPane 
            ref={(el) => {
              terminalRefs.current[terminals[0].id] = el;
            }}
            terminal={terminals[0]} 
            onRemove={onRemoveTerminal}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          {terminals.length > 2 ? (
            <ResizablePanelGroup direction="horizontal">
              {terminals.slice(1).map((terminal, index) => (
                <React.Fragment key={terminal.id}>
                  <ResizablePanel defaultSize={100 / (terminals.length - 1)}>
                    <TerminalPane 
                      ref={(el) => {
                        terminalRefs.current[terminal.id] = el;
                      }}
                      terminal={terminal} 
                      onRemove={onRemoveTerminal}
                    />
                  </ResizablePanel>
                  {index < terminals.length - 2 && <ResizableHandle withHandle />}
                </React.Fragment>
              ))}
            </ResizablePanelGroup>
          ) : (
            terminals[1] && (
              <TerminalPane 
                ref={(el) => {
                  terminalRefs.current[terminals[1].id] = el;
                }}
                terminal={terminals[1]} 
                onRemove={onRemoveTerminal}
              />
            )
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}