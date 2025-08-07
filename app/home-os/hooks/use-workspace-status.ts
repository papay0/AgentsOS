'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WorkspaceStatusResponse, WorkspaceRestartResponse } from '@/types/workspace';

export interface UseWorkspaceStatusOptions {
  sandboxId: string | null;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
}

export function useWorkspaceStatus({ 
  sandboxId, 
  enabled = true, 
  pollingInterval = 60000 // 60 seconds (reduced frequency)
}: UseWorkspaceStatusOptions) {
  // Auto-restart configuration
  const AUTO_RESTART_ENABLED = false; // Toggle to enable/disable automatic workspace status checks
  
  const [status, setStatus] = useState<WorkspaceStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!sandboxId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use workspace-status (lightweight) instead of debug-services (heavy)
      const response = await fetch(`/api/workspace-status/${sandboxId}`);
      const statusData: WorkspaceStatusResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(statusData.message || 'Failed to check workspace status');
      }

      setStatus(statusData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check workspace status';
      setError(errorMessage);
      setStatus({
        status: 'error',
        servicesHealthy: false,
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId, enabled]);

  const restartWorkspace = useCallback(async () => {
    if (!sandboxId) {
      throw new Error('No workspace ID provided');
    }

    setIsRestarting(true);
    setError(null);

    try {
      const response = await fetch(`/api/fix-services/${sandboxId}`, {
        method: 'POST'
      });
      
      const result: WorkspaceRestartResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to restart workspace');
      }

      if (!result.success) {
        throw new Error(result.message || 'Workspace restart failed');
      }

      // After successful restart, wait a bit for services to fully start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check status again
      await checkStatus();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restart workspace';
      setError(errorMessage);
      throw err;
    } finally {
      setIsRestarting(false);
    }
  }, [sandboxId, checkStatus]);

  // Initial status check (ALWAYS needed to show restart UI)
  useEffect(() => {
    if (enabled && sandboxId) {
      checkStatus();
    }
  }, [checkStatus, enabled, sandboxId]);

  // Polling for status updates
  useEffect(() => {
    if (!enabled || !sandboxId || pollingInterval <= 0 || !AUTO_RESTART_ENABLED) return;

    const interval = setInterval(checkStatus, pollingInterval);
    return () => clearInterval(interval);
  }, [checkStatus, enabled, sandboxId, pollingInterval, AUTO_RESTART_ENABLED]);

  // Computed properties
  const isWorkspaceHealthy = status?.status === 'started' && status?.servicesHealthy;
  const needsRestart = status && (
    status.status === 'stopped' || 
    status.status === 'error' || 
    !status.servicesHealthy
  );

  return {
    status,
    isLoading,
    isRestarting,
    error,
    isWorkspaceHealthy,
    needsRestart,
    checkStatus,
    restartWorkspace,
  };
}