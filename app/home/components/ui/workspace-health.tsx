'use client';

import React, { useState, useEffect } from 'react';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceHealth } from '@/hooks/use-workspace-health';
import { getHealthIcon, getHealthText, getServiceIcon } from '@/lib/health-utils';

export function WorkspaceHealth() {
  const {
    healthData,
    isLoading,
    error,
    isRestarting,
    restartStartTime,
    activeWorkspace,
    checkHealth,
    fixServices,
  } = useWorkspaceHealth();
  
  const [isOpen, setIsOpen] = useState(false);

  // Check health when opening the popover (on-demand)
  useEffect(() => {
    if (isOpen && healthData?.sandboxId) {
      checkHealth();
    }
  }, [isOpen, healthData?.sandboxId, checkHealth]);

  // Auto-open popup when sandbox is not started
  useEffect(() => {
    if (healthData && healthData.sandboxState !== 'started' && !isOpen) {
      setIsOpen(true);
    }
  }, [healthData, isOpen]);

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white hover:bg-white/10"
        >
          {getHealthIcon(healthData?.sandboxId || null, isRestarting, isLoading, error, healthData)}
          {getHealthText(healthData?.sandboxId || null, isRestarting, isLoading, error, healthData, restartStartTime)}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 max-h-96 overflow-y-auto" align="end">
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
              <div className="max-h-48 overflow-y-auto space-y-2">
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
              </div>
              
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