'use client';

import React, { use, useEffect, useState, useRef } from 'react';
import { MobileWorkspaceView } from '@/components/workspace/mobile-workspace-view';
import { DesktopWorkspaceView } from '@/components/workspace/desktop-workspace-view';
import { useIsMobile } from '@/hooks/use-mobile';
import type { WorkspaceData, TerminalTab, TerminalPane, WorkspaceStatusResponse, WorkspaceRestartResponse, RepositoryWithUrls } from '@/types/workspace';

interface WorkspacePageProps {
  params: Promise<{
    sandboxId: string;
  }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const resolvedParams = use(params);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [repositories, setRepositories] = useState<RepositoryWithUrls[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<RepositoryWithUrls | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const isMobile = useIsMobile();
  
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const initializedRef = useRef(false);
  
  // Check workspace status
  const checkWorkspaceStatus = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/workspace-status/${resolvedParams.sandboxId}`);
      const status: WorkspaceStatusResponse = await response.json();
      setWorkspaceStatus(status);
      
      // If workspace is started and services are healthy, fetch workspace URLs
      if (status.status === 'started' && status.servicesHealthy) {
        try {
          const urlsResponse = await fetch(`/api/workspace-urls/${resolvedParams.sandboxId}`);
          if (urlsResponse.ok) {
            const data = await urlsResponse.json();
            
            // Set repository data
            if (data.repositories && data.repositories.length > 0) {
              setRepositories(data.repositories);
              setSelectedRepository(data.repositories[0]); // Default to first repository
            }
            
            // Set workspace data for backward compatibility
            setWorkspaceData({
              sandboxId: resolvedParams.sandboxId,
              terminalUrl: data.terminalUrl,
              claudeTerminalUrl: data.claudeTerminalUrl,
              vscodeUrl: data.vscodeUrl,
              message: 'Workspace loaded'
            });
          } else {
            console.error('Failed to fetch workspace URLs');
          }
        } catch (error) {
          console.error('Error fetching workspace URLs:', error);
        }
      }
    } catch (error) {
      console.error('Failed to check workspace status:', error);
      setWorkspaceStatus({
        status: 'error',
        servicesHealthy: false,
        message: 'Failed to check workspace status'
      });
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.sandboxId]);

  // Restart workspace
  const restartWorkspace = async () => {
    setIsRestarting(true);
    try {
      const response = await fetch(`/api/workspace-restart/${resolvedParams.sandboxId}`, {
        method: 'POST'
      });
      const result: WorkspaceRestartResponse = await response.json();
      
      if (result.success && result.urls) {
        // Update workspace data with new URLs
        const newWorkspaceData: WorkspaceData = {
          sandboxId: resolvedParams.sandboxId,
          terminalUrl: result.urls.terminalUrl,
          claudeTerminalUrl: result.urls.claudeTerminalUrl,
          vscodeUrl: result.urls.vscodeUrl,
          message: result.message
        };
        
        setWorkspaceData(newWorkspaceData);
        
        // Update status
        setWorkspaceStatus({
          status: 'started',
          servicesHealthy: true,
          message: 'All services running'
        });
      } else {
        setWorkspaceStatus({
          status: 'error',
          servicesHealthy: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Failed to restart workspace:', error);
      setWorkspaceStatus({
        status: 'error',
        servicesHealthy: false,
        message: 'Failed to restart workspace'
      });
    } finally {
      setIsRestarting(false);
    }
  };

  useEffect(() => {
    checkWorkspaceStatus();
  }, [checkWorkspaceStatus]);
  
  // Use selected repository URLs or fall back to workspace data for backward compatibility
  const baseTerminalUrl = selectedRepository?.urls?.terminal || workspaceData?.terminalUrl || `https://9999-${resolvedParams.sandboxId}.proxy.daytona.work/`;
  const claudeTerminalUrl = selectedRepository?.urls?.claude || workspaceData?.claudeTerminalUrl || `https://9998-${resolvedParams.sandboxId}.proxy.daytona.work/`;
  const vscodeUrl = selectedRepository?.urls?.vscode || workspaceData?.vscodeUrl || `https://8080-${resolvedParams.sandboxId}.proxy.daytona.work/`;

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

  // Reset tabs when repository changes
  useEffect(() => {
    if (selectedRepository && baseTerminalUrl && claudeTerminalUrl) {
      const claudeTab: TerminalTab = {
        id: `tab-${Date.now()}`,
        title: `Claude (${selectedRepository.name})`,
        terminals: [{
          id: `terminal-${Date.now()}`,
          url: claudeTerminalUrl,
          title: 'Terminal 1'
        }]
      };
      const terminalTab: TerminalTab = {
        id: `tab-${Date.now() + 1}`,
        title: `Terminal (${selectedRepository.name})`,
        terminals: [{
          id: `terminal-${Date.now() + 1}`,
          url: baseTerminalUrl,
          title: 'Terminal 1'
        }]
      };
      setTabs([claudeTab, terminalTab]);
      setActiveTabId(claudeTab.id);
    }
  }, [selectedRepository?.name, baseTerminalUrl, claudeTerminalUrl]);

  // Initialize tabs for backward compatibility (single workspace mode)
  useEffect(() => {
    if (baseTerminalUrl && tabs.length === 0 && !initializedRef.current && !selectedRepository) {
      initializedRef.current = true;
      const claudeTab: TerminalTab = {
        id: `tab-${Date.now()}`,
        title: 'Claude',
        terminals: [{
          id: `terminal-${Date.now()}`,
          url: claudeTerminalUrl,
          title: 'Terminal 1'
        }]
      };
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
  }, [baseTerminalUrl, claudeTerminalUrl, tabs.length, selectedRepository]);

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
    sandboxId: resolvedParams.sandboxId,
    repositories,
    selectedRepository,
    onRepositoryChange: setSelectedRepository,
  };

  const mobileWorkspaceViewProps = {
    vscodeUrl,
    tabs,
    activeTabId,
    onTabChange: setActiveTabId,
    onAddTab: addNewTab,
    sandboxId: resolvedParams.sandboxId,
    repositories,
    selectedRepository,
    onRepositoryChange: setSelectedRepository,
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 top-14 bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking workspace status...</p>
        </div>
      </div>
    );
  }

  // Show restart UI if workspace needs to be started
  if (workspaceStatus && (workspaceStatus.status !== 'started' || !workspaceStatus.servicesHealthy)) {
    return (
      <div className="fixed inset-0 top-14 bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            {workspaceStatus.status === 'stopped' ? (
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {workspaceStatus.status === 'stopped' ? 'Workspace Stopped' : 'Services Not Running'}
            </h2>
            <p className="text-gray-600 mb-6">{workspaceStatus.message}</p>
          </div>

          <button
            onClick={restartWorkspace}
            disabled={isRestarting}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestarting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting workspace...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Workspace
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 mt-4">
            This will start the container and all services (VSCode, terminals)
          </p>
        </div>
      </div>
    );
  }

  // Show workspace UI if everything is started
  if (workspaceData && workspaceStatus?.status === 'started' && workspaceStatus?.servicesHealthy) {
    return (
      <div className="fixed inset-0 top-14 bg-gray-100 overflow-hidden">
        {isMobile ? (
          <MobileWorkspaceView {...mobileWorkspaceViewProps} />
        ) : (
          <DesktopWorkspaceView {...desktopWorkspaceViewProps} />
        )}
      </div>
    );
  }

  // Fallback error state
  return (
    <div className="fixed inset-0 top-14 bg-gray-100 overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Something went wrong</p>
        <button 
          onClick={checkWorkspaceStatus}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

