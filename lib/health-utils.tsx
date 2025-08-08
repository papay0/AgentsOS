import React from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import type { ServiceStatus, HealthCheckResponse } from '../types/health';

export const getHealthIcon = (
  sandboxId: string | null,
  isRestarting: boolean,
  isLoading: boolean,
  error: string | null,
  healthData: HealthCheckResponse | null
): React.ReactElement => {
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

export const getHealthText = (
  sandboxId: string | null,
  isRestarting: boolean,
  isLoading: boolean,
  error: string | null,
  healthData: HealthCheckResponse | null,
  restartStartTime: number | null
): React.ReactElement => {
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

export const getServiceIcon = (service: ServiceStatus): React.ReactElement => {
  if (service.status === 'running') {
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  } else if (service.status === 'error') {
    return <XCircle className="h-3 w-3 text-red-500" />;
  } else {
    return <AlertCircle className="h-3 w-3 text-amber-500" />;
  }
};