'use client';

import React, { useState, useEffect } from 'react';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { cn } from '@/lib/utils';

interface ServiceStatus {
  service: string;
  port: number;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  url?: string;
  error?: string;
}

interface HealthCheckResponse {
  sandboxId: string;
  sandboxState: string;
  summary: {
    running: number;
    total: number;
    healthy: boolean;
  };
  services: ServiceStatus[];
  processes: string[];
  repositories: Array<{
    name: string;
    sourceType: string;
    ports: { vscode: number; terminal: number; claude: number; };
  }>;
  timestamp: string;
}

export function WorkspaceHealth() {
  // Health check configuration
  const AUTO_HEALTH_CHECK_ENABLED = true;  // Always check health periodically
  
  const { activeWorkspaceId, workspaces, sandboxId } = useWorkspaceStore();
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartStartTime, setRestartStartTime] = useState<number | null>(null);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const checkHealth = React.useCallback(async (skipLoadingState = false) => {
    if (!sandboxId) return;
    
    if (!skipLoadingState) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      // Only call debug-services when AUTO_RESTART_ENABLED or user manually requests it
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
    if (!AUTO_HEALTH_CHECK_ENABLED) {
      setIsLoading(false);
      return;
    }

    // Initial check after workspace loads (with delay, longer if restarting)
    const delay = isRestarting ? 8000 : 2000;
    const initialTimer = setTimeout(() => {
      checkHealth();
    }, delay);

    // Periodic health checking - more frequent during restart, every 2 minutes normally
    const interval = isRestarting ? 5000 : 120000;
    const healthInterval = setInterval(() => {
      checkHealth(true); // Skip loading state for background checks
    }, interval);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(healthInterval);
    };
  }, [sandboxId, activeWorkspaceId, checkHealth, isRestarting, AUTO_HEALTH_CHECK_ENABLED]);

  // Check health when opening the popover (on-demand)
  useEffect(() => {
    if (isOpen && sandboxId) {
      checkHealth();
    }
  }, [isOpen, sandboxId, checkHealth]);

  // Auto-open popup when sandbox is not started
  useEffect(() => {
    if (healthData && healthData.sandboxState !== 'started' && !isOpen) {
      setIsOpen(true);
    }
  }, [healthData, isOpen]);

  const getHealthIcon = () => {
    if (!sandboxId) {
      return <Activity className="h-4 w-4 text-gray-400" />;
    }
    
    if (isRestarting || isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />;
    }
    
    if (error || !healthData) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }

    // Check if sandbox is not started
    if (healthData.sandboxState !== 'started') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    const allHealthy = healthData.services.every(s => s.status === 'running');
    if (allHealthy) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    const someHealthy = healthData.services.some(s => s.status === 'running');
    if (someHealthy) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getHealthText = () => {
    if (!sandboxId) {
      return <span className="text-xs">Health</span>;
    }
    
    if (isRestarting) {
      const elapsed = restartStartTime ? Math.floor((Date.now() - restartStartTime) / 1000) : 0;
      return <span className="text-xs text-blue-300">Restarting... ({elapsed}s)</span>;
    }
    
    if (isLoading) {
      return <span className="text-xs text-blue-300">Checking...</span>;
    }
    
    if (error || !healthData) {
      return <span className="text-xs">Health</span>;
    }

    // Check if sandbox is not started
    if (healthData.sandboxState !== 'started') {
      return <span className="text-xs text-red-300">Stopped</span>;
    }
    
    const allHealthy = healthData.services.every(s => s.status === 'running');
    if (allHealthy) {
      return <span className="text-xs text-green-300">Healthy</span>;
    }
    
    return <span className="text-xs text-amber-300">Issues</span>;
  };

  const getServiceIcon = (service: ServiceStatus) => {
    if (service.status === 'running') {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    } else if (service.status === 'error') {
      return <XCircle className="h-3 w-3 text-red-500" />;
    } else {
      return <AlertCircle className="h-3 w-3 text-amber-500" />;
    }
  };

  const fixServices = async () => {
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
  };

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white hover:bg-white/10"
        >
          {getHealthIcon()}
          {getHealthText()}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {activeWorkspace?.name || 'Workspace'} Health
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => checkHealth()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>
          
          {isRestarting && (
            <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 p-2 rounded flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Restarting services... This may take 15-20 seconds.
            </div>
          )}
          
          {healthData && healthData.sandboxState !== 'started' && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium">Workspace is {healthData.sandboxState}</p>
                <p className="text-xs text-red-500 mt-1">Start your workspace to access development services</p>
              </div>
            </div>
          )}

          {error && !isRestarting && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}
          
          {healthData && healthData.sandboxState === 'started' && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500">Services</div>
              {healthData.services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 rounded bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    {getServiceIcon(service)}
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>:{service.port}</span>
                    <span className="text-xs">({service.status})</span>
                    {service.pid && (
                      <span className="text-xs">PID: {service.pid}</span>
                    )}
                  </div>
                </div>
              ))}
              
              {healthData.services.some(s => s.status !== 'running') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={fixServices}
                  disabled={isLoading || isRestarting}
                >
                  {isRestarting ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                      Restarting...
                    </>
                  ) : (
                    'Restart Services'
                  )}
                </Button>
              )}
              
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Debug Actions
                </summary>
                <div className="mt-2 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={fixServices}
                    disabled={isLoading || isRestarting}
                  >
                    {isRestarting ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                        Restarting...
                      </>
                    ) : (
                      'Force Restart All Services'
                    )}
                  </Button>
                </div>
              </details>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Running Processes ({healthData.processes.length})
                </summary>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {healthData.processes.map((process, index) => (
                    <div key={index} className="text-xs font-mono text-gray-600 truncate">
                      {process}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {healthData && healthData.sandboxState !== 'started' && (
            <Button
              variant="default"
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={fixServices}
              disabled={isLoading || isRestarting}
            >
              {isRestarting ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                'Start Workspace'
              )}
            </Button>
          )}
          
          {!healthData && !error && !isLoading && (
            <div className="text-xs text-gray-500 text-center py-4">
              Click to check health status
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}