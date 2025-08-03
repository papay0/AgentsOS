'use client';

import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { VSCodeEditor } from './vscode-editor';
import { TerminalPanel } from './terminal-panel';
import type { TerminalTab, RepositoryWithUrls } from '@/types/workspace';

interface DesktopWorkspaceViewProps {
  vscodeUrl: string;
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onAddTab: () => void;
  onRemoveTab: (tabId: string) => void;
  onAddTerminal: () => void;
  onRemoveTerminal: (terminalId: string) => void;
  sandboxId: string;
  repositories?: RepositoryWithUrls[];
  selectedRepository?: RepositoryWithUrls | null;
  onRepositoryChange?: (repository: RepositoryWithUrls) => void;
}

export function DesktopWorkspaceView({ 
  vscodeUrl, 
  tabs, 
  activeTabId, 
  onTabChange, 
  onAddTab, 
  onRemoveTab, 
  onAddTerminal, 
  onRemoveTerminal,
  sandboxId,
  repositories = [],
  selectedRepository,
  onRepositoryChange
}: DesktopWorkspaceViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Repository Switcher Header */}
      {repositories.length > 1 && (
        <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-4">
          <span className="text-sm font-medium text-gray-700">Repository:</span>
          <select
            value={selectedRepository?.name || ''}
            onChange={(e) => {
              const repo = repositories.find(r => r.name === e.target.value);
              if (repo && onRepositoryChange) {
                onRepositoryChange(repo);
              }
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-[200px]"
          >
            {repositories.map(repo => (
              <option key={repo.name} value={repo.name}>
                {repo.name} {repo.tech && `(${repo.tech})`}
              </option>
            ))}
          </select>
          {selectedRepository?.description && (
            <span className="text-sm text-gray-500">
              {selectedRepository.description}
            </span>
          )}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={60} minSize={30} maxSize={80}>
            <VSCodeEditor url={vscodeUrl} />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-gray-300 hover:bg-blue-500 transition-colors" />

          <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
            <TerminalPanel
              tabs={tabs}
              activeTabId={activeTabId}
              onTabChange={onTabChange}
              onAddTab={onAddTab}
              onRemoveTab={onRemoveTab}
              onAddTerminal={onAddTerminal}
              onRemoveTerminal={onRemoveTerminal}
              sandboxId={sandboxId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}