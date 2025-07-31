'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VSCodeEditor } from './vscode-editor';
import { TerminalPanel } from './terminal-panel';
import { Code2, Terminal as TerminalIcon } from 'lucide-react';
import type { WorkspaceViewProps, ViewMode } from '@/types/workspace';

export function MobileWorkspaceView({ 
  viewMode, 
  vscodeUrl, 
  tabs, 
  activeTabId, 
  onTabChange, 
  onAddTab, 
  onRemoveTab, 
  onAddTerminal, 
  onRemoveTerminal,
  onViewModeChange 
}: WorkspaceViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Segmented Control - Mobile Only */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value: ViewMode) => value && onViewModeChange?.(value)}
            className="w-full grid grid-cols-2 bg-gray-100 p-1 rounded-lg"
            variant="outline"
          >
            <ToggleGroupItem
              value="vscode"
              className="flex items-center justify-center gap-2 data-[state=on]:bg-white data-[state=on]:shadow-sm transition-all"
            >
              <Code2 className="h-4 w-4" />
              <span className="font-medium">VSCode</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="terminals"
              className="flex items-center justify-center gap-2 data-[state=on]:bg-white data-[state=on]:shadow-sm transition-all"
            >
              <TerminalIcon className="h-4 w-4" />
              <span className="font-medium">Terminals</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'vscode' ? (
          <VSCodeEditor url={vscodeUrl} />
        ) : (
          <TerminalPanel
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={onTabChange}
            onAddTab={onAddTab}
            onRemoveTab={onRemoveTab}
            onAddTerminal={onAddTerminal}
            onRemoveTerminal={onRemoveTerminal}
          />
        )}
      </div>
    </div>
  );
}