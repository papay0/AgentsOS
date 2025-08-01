'use client';

import React, { useState, useRef, useEffect } from 'react';
import { VSCodeEditor } from './vscode-editor';
import { TTYDTerminal, TerminalCommandPalette } from '@/components/terminal';
import { Plus, Code2, Settings, Globe } from 'lucide-react';
import type { TerminalTab } from '@/types/workspace';
import type { TTYDTerminalRef } from '@/components/terminal';

interface MobileWorkspaceViewProps {
  vscodeUrl: string;
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onAddTab: () => void;
  sandboxId: string;
}

export function MobileWorkspaceView({ 
  vscodeUrl, 
  tabs, 
  activeTabId, 
  onTabChange, 
  onAddTab,
  sandboxId
}: MobileWorkspaceViewProps) {
  const [currentView, setCurrentView] = useState<'terminal' | 'vscode'>('terminal');
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const terminalRefs = useRef<{ [key: string]: TTYDTerminalRef | null }>({});

  const handleAddTab = () => {
    onAddTab();
    setCurrentView('terminal'); // Switch to terminal view when adding new tab
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setCurrentView('terminal');
  };

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

  const handleVSCodeClick = () => {
    setCurrentView('vscode');
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleGoHome = () => {
    // Navigate back to home - we'll need to pass this as a prop later
    window.location.href = '/home';
  };

  const handleCloseWorkspace = () => {
    // Close workspace and go home
    window.location.href = '/home';
  };

  const handleOpenApp = () => {
    const appUrl = `https://3000-${sandboxId}.proxy.daytona.work/`;
    window.open(appUrl, '_blank', 'width=1200,height=800');
    setShowSettings(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Full Screen Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* VSCode iframe */}
        <div className={`absolute inset-0 ${currentView === 'vscode' ? 'block' : 'hidden'}`}>
          <VSCodeEditor url={vscodeUrl} />
        </div>
        
        {/* Terminal components - keep all mounted to preserve state */}
        {tabs.map((tab) => (
          <div 
            key={tab.id}
            className={`absolute inset-0 bg-white overflow-hidden ${
              activeTabId === tab.id && currentView === 'terminal' ? 'block' : 'hidden'
            }`}
          >
            <div className="h-full relative">
              <TTYDTerminal
                ref={(el) => {
                  terminalRefs.current[tab.id] = el;
                }}
                wsUrl={(tab.terminals[0]?.url || '').replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws'}
              />
              <TerminalCommandPalette
                terminalRef={{ current: terminalRefs.current[tab.id] }}
                isConnected={true}
                className="absolute bottom-0 left-0 right-0"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Clean Bottom Tab Bar */}
      <div className="flex-shrink-0 pb-safe">
        <div className="p-3">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-lg shadow-black/5 w-full">
            <div className="flex items-center h-14 px-2">
              {/* Terminal Tabs - Horizontally Scrollable */}
              <div className="flex-1 flex overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
                <div className="flex space-x-1 min-w-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      data-tab-id={tab.id}
                      onClick={() => handleTabClick(tab.id)}
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
                  onClick={handleAddTab}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-blue-500 hover:bg-blue-50 active:scale-95 transition-all duration-200"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                </button>

                {/* VSCode Button */}
                <button
                  onClick={handleVSCodeClick}
                  className={`flex items-center justify-center px-4 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    currentView === 'vscode'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-gray-700 hover:bg-gray-100/80 active:scale-95'
                  }`}
                >
                  <Code2 className="h-4 w-4 mr-1.5" strokeWidth={2.5} />
                  <span>Code</span>
                </button>

                {/* Settings Button */}
                <button
                  onClick={handleSettingsClick}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100/80 active:scale-95 transition-all duration-200"
                >
                  <Settings className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS-Style Settings Popup */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
            onClick={() => setShowSettings(false)}
          />
          
          {/* Popup Menu */}
          <div className="fixed bottom-20 right-6 z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden min-w-52">
              <div className="py-2">
                <button
                  onClick={handleOpenApp}
                  className="block w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50/80 text-base font-medium transition-colors active:bg-gray-100"
                >
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-gray-600" />
                    <span className="ml-3">Open App</span>
                  </div>
                </button>
                <button
                  onClick={handleGoHome}
                  className="block w-full px-6 py-4 text-left text-gray-900 hover:bg-gray-50/80 text-base font-medium transition-colors active:bg-gray-100"
                >
                  <div className="flex items-center">
                    <span>🏠</span>
                    <span className="ml-3">Back to Home</span>
                  </div>
                </button>
                <button
                  onClick={handleCloseWorkspace}
                  className="block w-full px-6 py-4 text-left text-red-600 hover:bg-red-50/80 text-base font-medium transition-colors active:bg-red-100"
                >
                  <div className="flex items-center">
                    <span>✕</span>
                    <span className="ml-3">Close Workspace</span>
                  </div>
                </button>
              </div>
              <div className="border-t border-gray-200/50">
                <button
                  onClick={() => setShowSettings(false)}
                  className="block w-full px-6 py-4 text-left text-gray-500 hover:bg-gray-50/80 text-base font-medium transition-colors active:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}