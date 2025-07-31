'use client';

import React from 'react';
import { Terminal, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TerminalTab } from '@/types/workspace';

interface TerminalTabsProps {
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onAddTab: () => void;
  onRemoveTab: (tabId: string) => void;
  onAddTerminal: () => void;
  activeTab: TerminalTab | undefined;
}

export function TerminalTabs({
  tabs,
  activeTabId,
  onTabChange,
  onAddTab,
  onRemoveTab,
  onAddTerminal,
  activeTab
}: TerminalTabsProps) {
  return (
    <div className="h-9 bg-gray-200 border-b border-gray-300 flex items-center px-0 flex-shrink-0">
      <div className="flex items-center flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div 
            key={tab.id}
            className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 whitespace-nowrap border-r border-gray-300 relative group min-w-[120px] ${
              activeTabId === tab.id 
                ? 'bg-white text-gray-800 border-t-2 border-t-blue-500 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <Terminal className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{tab.title}</span>
            <span className="text-[10px] opacity-60 ml-auto">({tab.terminals.length})</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-sm transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTab(tab.id);
              }}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        ))}
        <Button 
          onClick={onAddTab}
          size="sm"
          variant="ghost"
          className="h-7 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ml-1"
          title="New Tab"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-1 mr-2">
        <Button
          onClick={onAddTerminal}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs h-6"
          disabled={!activeTab}
        >
          <Plus className="h-3 w-3 mr-1" />
          Split
        </Button>
      </div>
    </div>
  );
}