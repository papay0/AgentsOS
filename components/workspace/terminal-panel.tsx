'use client';

import React from 'react';
import { Terminal, Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TerminalTabs } from './terminal-tabs';
import { TerminalGrid } from './terminal-grid';
import type { TerminalTab } from '@/types/workspace';

interface TerminalPanelProps {
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onAddTab: () => void;
  onRemoveTab: (tabId: string) => void;
  onAddTerminal: () => void;
  onRemoveTerminal: (terminalId: string) => void;
  sandboxId: string;
}

export function TerminalPanel({
  tabs,
  activeTabId,
  onTabChange,
  onAddTab,
  onRemoveTab,
  onAddTerminal,
  onRemoveTerminal,
  sandboxId
}: TerminalPanelProps) {
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleAddTerminalToTab = (tabId: string) => {
    if (activeTabId !== tabId) {
      onTabChange(tabId);
    }
    onAddTerminal();
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <TerminalTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
        onAddTab={onAddTab}
        onRemoveTab={onRemoveTab}
        onAddTerminal={onAddTerminal}
        activeTab={activeTab}
        sandboxId={sandboxId}
      />
      
      <div className="flex-1 overflow-hidden">
        {tabs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Terminal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 text-lg">No tabs open</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={onAddTab} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Tab
                </Button>
                <Link href="/home">
                  <Button variant="outline" className="px-6 py-3">
                    <Home className="h-5 w-5 mr-2" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          tabs.map(tab => (
            <div
              key={tab.id}
              className={`h-full ${tab.id === activeTabId ? 'block' : 'hidden'}`}
            >
              <TerminalGrid
                tab={tab}
                onRemoveTerminal={onRemoveTerminal}
                onAddTerminal={handleAddTerminalToTab}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}