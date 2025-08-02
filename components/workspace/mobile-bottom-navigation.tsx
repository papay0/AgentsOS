'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Plus, Code2, Settings, Command } from 'lucide-react';
import { TerminalCommandPalette } from '@/components/terminal';
import type { TerminalTab } from '@/types/workspace';
import type { TTYDTerminalRef } from '@/components/terminal';

interface MobileBottomNavigationProps {
  tabs: TerminalTab[];
  activeTabId: string | null;
  currentView: 'terminal' | 'vscode';
  onTabClick: (tabId: string) => void;
  onAddTab: () => void;
  onVSCodeClick: () => void;
  onSettingsClick: () => void;
  terminalRefs: React.MutableRefObject<{ [key: string]: TTYDTerminalRef | null }>;
}

export function MobileBottomNavigation({
  tabs,
  activeTabId,
  currentView,
  onTabClick,
  onAddTab,
  onVSCodeClick,
  onSettingsClick,
  terminalRefs
}: MobileBottomNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showCommands, setShowCommands] = useState(true); // Commands visible by default

  // Auto-scroll to show active tab
  useEffect(() => {
    if (scrollContainerRef.current && activeTabId && currentView === 'terminal') {
      const activeButton = scrollContainerRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement;
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTabId, currentView]);

  return (
    <div className="flex-shrink-0 pb-safe">
      {/* Command Palette - Above the dock */}
      {showCommands && currentView === 'terminal' && activeTabId && (
        <div className="px-3 pt-3 pb-2 bg-gray-100">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-lg shadow-black/5">
            <TerminalCommandPalette
              terminalRef={{ current: terminalRefs.current[activeTabId] }}
              isConnected={true}
              defaultVisible={true}
              className=""
            />
          </div>
        </div>
      )}
      
      {/* Main Navigation Dock - Always at bottom */}
      <div className={`bg-gray-100 ${showCommands && currentView === 'terminal' && activeTabId ? 'px-3 pb-3' : 'p-3'}`}>
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-lg shadow-black/5 w-full">
          <div className="flex items-center h-14 px-2">
            {/* Terminal Tabs - Horizontally Scrollable */}
            <div className="flex-1 flex overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
              <div className="flex space-x-1 min-w-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => onTabClick(tab.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 min-w-0 ${
                      activeTabId === tab.id && currentView === 'terminal'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-700 hover:bg-gray-100/80 active:scale-95'
                    }`}
                  >
                    <span className="truncate">{tab.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed Right Section */}
            <div className="flex-shrink-0 flex items-center space-x-1 px-2">
              {/* Add Terminal Button */}
              <button
                onClick={onAddTab}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-blue-500 hover:bg-blue-50 active:scale-95 transition-all duration-200"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </button>

              {/* VSCode Button */}
              <button
                onClick={onVSCodeClick}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                  currentView === 'vscode'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-gray-700 hover:bg-gray-100/80 active:scale-95'
                }`}
              >
                <Code2 className="h-4 w-4" strokeWidth={2.5} />
              </button>

              {/* Commands Toggle Button */}
              <button
                onClick={() => setShowCommands(!showCommands)}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                  showCommands
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-700 hover:bg-gray-100/80 active:scale-95'
                }`}
              >
                <Command className="h-4 w-4" strokeWidth={2.5} />
              </button>

              {/* Settings Button */}
              <button
                onClick={onSettingsClick}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100/80 active:scale-95 transition-all duration-200"
              >
                <Settings className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}