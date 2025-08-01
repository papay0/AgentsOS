'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Terminal, Plus, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TerminalPane } from './terminal-pane';
import { CommandPaletteWS } from './command-palette-ws';
import type { TerminalTab } from '@/types/workspace';

interface TerminalGridProps {
  tab: TerminalTab;
  onRemoveTerminal: (terminalId: string) => void;
  onAddTerminal: (tabId: string) => void;
}

export function TerminalGrid({ tab, onRemoveTerminal, onAddTerminal }: TerminalGridProps) {
  const { terminals } = tab;
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(terminals[0]?.id || null);
  const terminalRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
  
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
      <div className="h-full flex flex-col">
        <div className="flex-1" onClick={() => setActiveTerminalId(terminals[0].id)}>
          <TerminalPane 
            ref={(el) => {
              terminalRefs.current[terminals[0].id] = el;
            }}
            terminal={terminals[0]} 
            onRemove={onRemoveTerminal}
          />
        </div>
        <div className="border-t border-gray-200">
          <div className="flex items-center justify-between px-2 py-1 bg-gray-50">
            <span className="text-xs text-gray-600">Active: {terminals.find(t => t.id === activeTerminalId)?.title || 'None'}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCommandPalette(!showCommandPalette)}
              className="h-6 px-2 text-xs"
            >
              <Keyboard className="h-3 w-3 mr-1" />
              Commands
            </Button>
          </div>
          {showCommandPalette && activeTerminalId && (
            <CommandPaletteWS 
              terminalUrl={terminals.find(t => t.id === activeTerminalId)?.url || ''} 
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={50}>
            <div onClick={() => setActiveTerminalId(terminals[0].id)}>
              <TerminalPane 
                ref={(el) => {
                  terminalRefs.current[terminals[0].id] = el;
                }}
                terminal={terminals[0]} 
                onRemove={onRemoveTerminal}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            {terminals.length > 2 ? (
              <ResizablePanelGroup direction="horizontal">
                {terminals.slice(1).map((terminal, index) => (
                  <React.Fragment key={terminal.id}>
                    <ResizablePanel defaultSize={100 / (terminals.length - 1)}>
                      <div onClick={() => setActiveTerminalId(terminal.id)}>
                        <TerminalPane 
                          ref={(el) => {
                            terminalRefs.current[terminal.id] = el;
                          }}
                          terminal={terminal} 
                          onRemove={onRemoveTerminal}
                        />
                      </div>
                    </ResizablePanel>
                    {index < terminals.length - 2 && <ResizableHandle withHandle />}
                  </React.Fragment>
                ))}
              </ResizablePanelGroup>
            ) : (
              terminals[1] && (
                <div onClick={() => setActiveTerminalId(terminals[1].id)}>
                  <TerminalPane 
                    ref={(el) => {
                      terminalRefs.current[terminals[1].id] = el;
                    }}
                    terminal={terminals[1]} 
                    onRemove={onRemoveTerminal}
                  />
                </div>
              )
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="border-t border-gray-200">
        <div className="flex items-center justify-between px-2 py-1 bg-gray-50">
          <span className="text-xs text-gray-600">Active: {terminals.find(t => t.id === activeTerminalId)?.title || 'None'}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCommandPalette(!showCommandPalette)}
            className="h-6 px-2 text-xs"
          >
            <Keyboard className="h-3 w-3 mr-1" />
            Commands
          </Button>
        </div>
        {showCommandPalette && activeTerminalId && (
          <CommandPaletteWS 
            terminalUrl={terminals.find(t => t.id === activeTerminalId)?.url || ''} 
          />
        )}
      </div>
    </div>
  );
}