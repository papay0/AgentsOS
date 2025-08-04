'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface ServiceStatus {
  service: string;
  port: number;
  listening: boolean;
  httpStatus: string;
  error?: string;
}

interface HealthCheckResponse {
  sandboxId: string;
  services: ServiceStatus[];
  processes: string[];
}

export function MobileHealthIcon() {
  const { activeWorkspaceId, workspaces, sandboxId } = useWorkspaceStore();
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const checkHealth = React.useCallback(async () => {
    if (!sandboxId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/debug-services/${sandboxId}`);
      if (!response.ok) {
        throw new Error('Failed to check health');
      }
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check health');
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId]);

  useEffect(() => {
    if (!sandboxId) {
      setIsLoading(false);
      setHealthData(null);
      setError(null);
      return;
    }

    // Initial check
    const initialTimer = setTimeout(() => {
      checkHealth();
    }, 2000);

    // Periodic checking
    const healthInterval = setInterval(() => {
      checkHealth();
    }, 100000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(healthInterval);
    };
  }, [sandboxId, checkHealth]);

  // Check health when opening the popover (on-demand)
  useEffect(() => {
    if (isOpen && sandboxId) {
      checkHealth();
    }
  }, [isOpen, sandboxId, checkHealth]);

  const getHealthIcon = () => {
    if (!sandboxId) {
      return <Activity className="h-4 w-4 text-gray-400" />;
    }
    
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />;
    }
    
    if (error || !healthData) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    
    const healthyStatuses = ['200', '302', '301'];
    const allHealthy = healthData.services.every(s => s.listening && healthyStatuses.includes(s.httpStatus));
    if (allHealthy) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    const someHealthy = healthData.services.some(s => s.listening);
    if (someHealthy) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getServiceIcon = (service: ServiceStatus) => {
    const healthyStatuses = ['200', '302', '301'];
    
    if (service.listening && healthyStatuses.includes(service.httpStatus)) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    } else if (service.listening) {
      return <AlertCircle className="h-3 w-3 text-amber-500" />;
    } else {
      return <XCircle className="h-3 w-3 text-red-500" />;
    }
  };

  const fixServices = async () => {
    if (!sandboxId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/fix-services/${sandboxId}`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        // Refresh health data
        await checkHealth();
      } else {
        setError(data.message || 'Failed to fix services');
      }
    } catch {
      setError('Failed to fix services');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
      >
        {getHealthIcon()}
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {activeWorkspace?.name || 'Workspace'} Health
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>
          
          {error && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}
          
          {healthData && (
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
                    {service.listening && (
                      <span className="text-xs">({service.httpStatus})</span>
                    )}
                  </div>
                </div>
              ))}
              
              {healthData.services.some(s => !s.listening || !['200', '302', '301'].includes(s.httpStatus)) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={fixServices}
                  disabled={isLoading}
                >
                  Fix Services
                </Button>
              )}
            </div>
          )}
          
          {!healthData && !error && !isLoading && (
            <div className="text-xs text-gray-500 text-center py-4">
              Click to check health status
            </div>
          )}
            </div>
          </div>
        </>
      )}
    </>
  );
}