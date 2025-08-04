'use client';

import React from 'react';
import { AlertTriangle, Play, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceStatus } from '../../hooks/use-workspace-status';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { cn } from '@/lib/utils';

interface WorkspaceStatusPanelProps {
  sandboxId: string | null;
  workspaceName?: string;
  onStatusChange?: (isHealthy: boolean) => void;
  className?: string;
}

export function WorkspaceStatusPanel({ 
  sandboxId, 
  workspaceName = 'Workspace',
  onStatusChange,
  className 
}: WorkspaceStatusPanelProps) {
  const { updateWorkspaceUrls } = useWorkspaceStore();
  
  const {
    status,
    isLoading,
    isRestarting,
    error,
    isWorkspaceHealthy,
    needsRestart,
    restartWorkspace,
  } = useWorkspaceStatus({ 
    sandboxId,
    enabled: !!sandboxId,
    pollingInterval: 60000 // Check every 60 seconds (less aggressive since menubar handles frequent checks)
  });

  const refreshWorkspaceUrls = React.useCallback(async () => {
    if (!sandboxId) return;

    try {
      const response = await fetch(`/api/workspace-urls/${sandboxId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.repositories) {
          updateWorkspaceUrls(data.repositories);
        }
      }
    } catch (error) {
      console.error('Failed to refresh workspace URLs:', error);
    }
  }, [sandboxId, updateWorkspaceUrls]);

  // Notify parent of status changes and refresh URLs when workspace becomes healthy
  React.useEffect(() => {
    onStatusChange?.(isWorkspaceHealthy);
    
    // Refresh workspace URLs when workspace becomes healthy
    if (isWorkspaceHealthy) {
      refreshWorkspaceUrls();
    }
  }, [isWorkspaceHealthy, onStatusChange, refreshWorkspaceUrls]);

  if (!sandboxId) {
    return null;
  }

  // Only show panel for critical issues that require user intervention
  const shouldShowPanel = (
    // Show for critical errors that prevent workspace functionality
    (error && error !== 'Failed to check workspace status') ||
    // Show when workspace is completely stopped or in error state (not just unhealthy services)
    (status && (status.status === 'stopped' || status.status === 'error')) ||
    // Show when we need restart and user hasn't been recently notified
    (needsRestart && status?.status !== 'started')
  );

  if (!shouldShowPanel) {
    return null;
  }

  // Don't show if we're just doing routine loading and everything was working
  if (isLoading && !error && status?.status === 'started') {
    return null;
  }

  const handleRestart = async () => {
    try {
      const result = await restartWorkspace();
      
      // If restart was successful, refresh workspace URLs
      if (result?.success) {
        await refreshWorkspaceUrls();
      }
    } catch (err) {
      // Error is already handled in the hook
      console.error('Failed to restart workspace:', err);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    }
    
    if (error || status?.status === 'error') {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    
    if (needsRestart) {
      return <WifiOff className="h-5 w-5 text-amber-500" />;
    }
    
    return <Wifi className="h-5 w-5 text-green-500" />;
  };

  const getStatusMessage = () => {
    if (isLoading) {
      return 'Checking workspace status...';
    }
    
    if (error) {
      return `Error: ${error}`;
    }
    
    if (status?.message) {
      return status.message;
    }
    
    if (needsRestart) {
      return 'Workspace services are not running';
    }
    
    return 'Workspace status unknown';
  };

  const getStatusColor = () => {
    if (isLoading) return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    if (error || status?.status === 'error') return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    if (needsRestart) return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950';
    return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
  };

  return (
    <div className={cn(
      "fixed top-20 left-1/2 transform -translate-x-1/2 z-40",
      "max-w-md w-full mx-4",
      className
    )}>
      <div className={cn(
        "rounded-xl border-2 p-6 backdrop-blur-xl shadow-2xl",
        "transition-all duration-300 ease-in-out",
        getStatusColor()
      )}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
              {workspaceName}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {getStatusMessage()}
            </p>
            
            {needsRestart && !isLoading && !error && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Your workspace services need to be restarted to continue working.
                </p>
                
                <Button
                  onClick={handleRestart}
                  disabled={isRestarting}
                  className="w-full gap-2"
                  size="sm"
                >
                  {isRestarting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Restarting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Restart Workspace
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {status && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Status: {status.status}</span>
                  <span>Services: {status.servicesHealthy ? 'Healthy' : 'Unhealthy'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}