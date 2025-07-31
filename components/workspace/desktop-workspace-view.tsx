'use client';

import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { VSCodeEditor } from './vscode-editor';
import { TerminalPanel } from './terminal-panel';
import type { WorkspaceViewProps } from '@/types/workspace';

export function DesktopWorkspaceView({ 
  vscodeUrl, 
  tabs, 
  activeTabId, 
  onTabChange, 
  onAddTab, 
  onRemoveTab, 
  onAddTerminal, 
  onRemoveTerminal 
}: Omit<WorkspaceViewProps, 'viewMode' | 'onViewModeChange'>) {
  return (
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
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}