'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '../app/home/stores/workspaceStore';
import type { HealthCheckResponse } from '../types/health';

export interface WorkspaceHealthConfig {
  autoHealthCheckEnabled?: boolean;
  restartingInterval?: number;
  normalInterval?: number;
  initialDelay?: number;
  restartingDelay?: number;
}

export function useWorkspaceHealth(config: WorkspaceHealthConfig = {}) {
  const {
    autoHealthCheckEnabled = true,
    restartingInterval = 5000,
    normalInterval = 120000,
    initialDelay = 2000,
    restartingDelay = 8000,
  } = config;

  const { activeWorkspaceId, workspaces, sandboxId } = useWorkspaceStore();
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartStartTime, setRestartStartTime] = useState<number | null>(null);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const checkHealth = useCallback(async (skipLoadingState = false) => {
    if (!sandboxId) return;
    
    if (!skipLoadingState) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch(`/api/debug-services/${sandboxId}`);
      if (!response.ok) {
        throw new Error('Failed to check health');
      }
      const data = await response.json();
      setHealthData(data);
      
      // If we were restarting and services are now healthy, clear restart state
      if (isRestarting && data.summary.healthy) {
        setIsRestarting(false);
        setRestartStartTime(null);
      }
    } catch (err) {
      // During restart, don't show errors immediately - services are expected to be down
      if (!isRestarting) {
        setError(err instanceof Error ? err.message : 'Failed to check health');
      }
    } finally {
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, [sandboxId, isRestarting]);

  // Consolidated health checking effects
  useEffect(() => {
    if (!sandboxId) {
      // Reset state when no sandbox
      setIsLoading(false);
      setHealthData(null);
      setError(null);
      return;
    }

    // Skip automatic health checks if disabled
    if (!autoHealthCheckEnabled) {
      setIsLoading(false);
      return;
    }

    // Initial check after workspace loads (with delay, longer if restarting)
    const delay = isRestarting ? restartingDelay : initialDelay;
    const initialTimer = setTimeout(() => {
      checkHealth();
    }, delay);

    // Periodic health checking - more frequent during restart, every 2 minutes normally
    const interval = isRestarting ? restartingInterval : normalInterval;
    const healthInterval = setInterval(() => {
      checkHealth(true); // Skip loading state for background checks
    }, interval);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(healthInterval);
    };
  }, [sandboxId, activeWorkspaceId, checkHealth, isRestarting, autoHealthCheckEnabled, restartingDelay, initialDelay, restartingInterval, normalInterval]);

  const fixServices = useCallback(async () => {
    if (!sandboxId || isRestarting) return;
    
    setIsRestarting(true);
    setRestartStartTime(Date.now());
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/fix-services/${sandboxId}`, { method: 'POST' });
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Wait a bit longer before first health check after restart
        setTimeout(() => {
          checkHealth();
        }, 3000);
      } else {
        setError(data.error || data.message || 'Failed to restart services');
        setIsRestarting(false);
        setRestartStartTime(null);
      }
    } catch {
      setError('Failed to restart services');
      setIsRestarting(false);
      setRestartStartTime(null);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId, isRestarting, checkHealth]);

  return {
    healthData,
    isLoading,
    error,
    isRestarting,
    restartStartTime,
    activeWorkspace,
    checkHealth,
    fixServices,
  };
}