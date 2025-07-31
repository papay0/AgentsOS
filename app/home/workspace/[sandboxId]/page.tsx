'use client';

import React, { use, useEffect, useState, useRef } from 'react';
import { MobileWorkspaceView } from '@/components/workspace/mobile-workspace-view';
import { DesktopWorkspaceView } from '@/components/workspace/desktop-workspace-view';
import { useIsMobile } from '@/hooks/use-mobile';
import type { WorkspaceData, TerminalTab, TerminalPane } from '@/types/workspace';

interface WorkspacePageProps {
  params: Promise<{
    sandboxId: string;
  }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const resolvedParams = use(params);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const isMobile = useIsMobile();
  
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Get workspace data from localStorage
    const data = localStorage.getItem(`workspace-${resolvedParams.sandboxId}`);
    if (data) {
      setWorkspaceData(JSON.parse(data));
    }
  }, [resolvedParams.sandboxId]);
  
  const baseTerminalUrl = workspaceData?.terminalUrl || `https://9999-${resolvedParams.sandboxId}.proxy.daytona.work/`;
  const claudeTerminalUrl = workspaceData?.claudeTerminalUrl || `https://9998-${resolvedParams.sandboxId}.proxy.daytona.work/`;
  const vscodeUrl = workspaceData?.vscodeUrl || `https://8080-${resolvedParams.sandboxId}.proxy.daytona.work/`;

  const addNewTab = React.useCallback(() => {
    const tabNumber = tabs.length + 1;
    const terminalUrl = tabNumber === 1 ? claudeTerminalUrl : baseTerminalUrl;
    const tabTitle = tabNumber === 1 ? 'Claude' : `Terminal ${tabNumber}`;
    const newTab: TerminalTab = {
      id: `tab-${Date.now()}`,
      title: tabTitle,
      terminals: [{
        id: `terminal-${Date.now()}`,
        url: terminalUrl,
        title: `Terminal 1`
      }]
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length, claudeTerminalUrl, baseTerminalUrl]);

  useEffect(() => {
    if (baseTerminalUrl && tabs.length === 0 && !initializedRef.current) {
      initializedRef.current = true;
      // Add Claude tab first
      const claudeTab: TerminalTab = {
        id: `tab-${Date.now()}`,
        title: 'Claude',
        terminals: [{
          id: `terminal-${Date.now()}`,
          url: claudeTerminalUrl,
          title: 'Terminal 1'
        }]
      };
      // Add Terminal 2 tab
      const terminalTab: TerminalTab = {
        id: `tab-${Date.now() + 1}`,
        title: 'Terminal 2',
        terminals: [{
          id: `terminal-${Date.now() + 1}`,
          url: baseTerminalUrl,
          title: 'Terminal 1'
        }]
      };
      setTabs([claudeTab, terminalTab]);
      setActiveTabId(claudeTab.id);
    }
  }, [baseTerminalUrl, claudeTerminalUrl, tabs.length]);

  const addTerminalToCurrentTab = React.useCallback(() => {
    if (!activeTabId) return;
    
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    const newTerminal: TerminalPane = {
      id: `terminal-${Date.now()}`,
      url: baseTerminalUrl,
      title: `Terminal ${(activeTab?.terminals.length || 0) + 1}`
    };

    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, terminals: [...tab.terminals, newTerminal] }
        : tab
    ));
  }, [activeTabId, baseTerminalUrl, tabs]);

  const removeTerminal = React.useCallback((terminalId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      terminals: tab.terminals.filter(t => t.id !== terminalId)
    })).filter(tab => tab.terminals.length > 0));
  }, []);

  const removeTab = React.useCallback((tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[0].id : null);
    }
  }, [tabs, activeTabId]);

  const desktopWorkspaceViewProps = {
    vscodeUrl,
    tabs,
    activeTabId,
    onTabChange: setActiveTabId,
    onAddTab: addNewTab,
    onRemoveTab: removeTab,
    onAddTerminal: addTerminalToCurrentTab,
    onRemoveTerminal: removeTerminal,
  };

  const mobileWorkspaceViewProps = {
    vscodeUrl,
    tabs,
    activeTabId,
    onTabChange: setActiveTabId,
    onAddTab: addNewTab,
  };

  return (
    <div className={`fixed inset-0 bg-gray-100 overflow-hidden ${!isMobile ? 'top-14' : 'top-0'}`}>
      {isMobile ? (
        <MobileWorkspaceView {...mobileWorkspaceViewProps} />
      ) : (
        <DesktopWorkspaceView {...desktopWorkspaceViewProps} />
      )}
    </div>
  );
}

