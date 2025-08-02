'use client';

import React, { useState, useRef } from 'react';
import { VSCodeEditor } from './vscode-editor';
import { TTYDTerminal, TerminalCommandPalette } from '@/components/terminal';
import { MobileBottomNavigation } from './mobile-bottom-navigation';
import { Globe } from 'lucide-react';
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
  const terminalRefs = useRef<{ [key: string]: TTYDTerminalRef | null }>({});

  const handleAddTab = () => {
    onAddTab();
    setCurrentView('terminal'); // Switch to terminal view when adding new tab
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setCurrentView('terminal');
  };

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
      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* VSCode iframe */}
        {currentView === 'vscode' && (
          <VSCodeEditor url={vscodeUrl} />
        )}
        
        {/* Terminal components */}
        {currentView === 'terminal' && tabs.map((tab) => (
          activeTabId === tab.id && (
            <div key={tab.id} className="h-full">
              <TTYDTerminal
                ref={(el) => {
                  terminalRefs.current[tab.id] = el;
                }}
                wsUrl={(tab.terminals[0]?.url || '').replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws'}
              />
            </div>
          )
        ))}
      </div>

      {/* Bottom Navigation - Always visible */}
      <MobileBottomNavigation
        tabs={tabs}
        activeTabId={activeTabId}
        currentView={currentView}
        onTabClick={handleTabClick}
        onAddTab={handleAddTab}
        onVSCodeClick={handleVSCodeClick}
        onSettingsClick={handleSettingsClick}
        terminalRefs={terminalRefs}
      />

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
                  className="block w-full px-6 py-4 text-left text-red-600 hover:bg-red-50/80 text-base font-medium transition-colors active:bg-gray-100"
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