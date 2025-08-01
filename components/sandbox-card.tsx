'use client';

import { formatDistanceToNow } from 'date-fns';
import { 
  Play, 
  Square, 
  AlertCircle, 
  Clock, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  User,
  Globe,
  Lock,
  ExternalLink,
  Copy,
  Check,
  StopCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SandboxListItem } from '@/types/sandbox';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StopWorkspaceDialog } from './stop-workspace-dialog';
import { toast } from 'sonner';
import { SandboxState } from '@daytonaio/api-client';

interface SandboxCardProps {
  sandbox: SandboxListItem;
  onOpen?: (sandboxId: string) => void;
  onStop?: () => void;
  onStart?: () => void;
}

const stateConfig = {
  started: {
    label: 'Running',
    variant: 'default' as const,
    icon: Play,
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  stopped: {
    label: 'Stopped',
    variant: 'secondary' as const,
    icon: Square,
    className: 'bg-gray-500 hover:bg-gray-600 text-white'
  },
  error: {
    label: 'Error',
    variant: 'destructive' as const,
    icon: AlertCircle,
    className: 'bg-red-500 hover:bg-red-600 text-white'
  },
  pending_build: {
    label: 'Building',
    variant: 'outline' as const,
    icon: Clock,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  starting: {
    label: 'Starting',
    variant: 'outline' as const,
    icon: Clock,
    className: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  stopping: {
    label: 'Stopping',
    variant: 'outline' as const,
    icon: Clock,
    className: 'bg-orange-500 hover:bg-orange-600 text-white'
  }
};

export function SandboxCard({ sandbox, onOpen, onStop, onStart }: SandboxCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const state = sandbox.state || 'unknown';
  const config = stateConfig[state as keyof typeof stateConfig] || {
    label: state,
    variant: 'outline' as const,
    icon: AlertCircle,
    className: 'bg-gray-400 hover:bg-gray-500 text-white'
  };

  const StateIcon = config.icon;
  const createdAt = sandbox.createdAt ? new Date(sandbox.createdAt) : null;

  const handleOpen = () => {
    if (onOpen) {
      onOpen(sandbox.id);
    } else {
      router.push(`/home/workspace/${sandbox.id}`);
    }
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(sandbox.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStopWorkspace = async (sandboxId: string) => {
    setIsStopping(true);
    try {
      const response = await fetch(`/api/workspace-stop/${sandboxId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop workspace');
      }

      toast.success('Workspace stopped successfully!');
      
      if (onStop) {
        onStop();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop workspace');
      throw error;
    } finally {
      setIsStopping(false);
    }
  };

  const handleStartWorkspace = async () => {
    setIsStarting(true);
    try {
      const response = await fetch(`/api/workspace-start/${sandbox.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start workspace');
      }

      toast.success('Workspace started successfully!');
      
      if (onStart) {
        onStart();
      }

      // Navigate to the workspace after successful start
      router.push(`/home/workspace/${sandbox.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start workspace');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate flex-1" title={sandbox.id}>
              {sandbox.id.slice(0, 8)}...{sandbox.id.slice(-8)}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyId}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? 'Copied!' : 'Copy full ID'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">@{sandbox.user}</p>
            <Badge className={config.className}>
              <StateIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Error Message */}
        {sandbox.errorReason && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              {sandbox.errorReason}
            </p>
          </div>
        )}

        {/* Resources */}
        <div className="grid grid-cols-2 gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  <span>{sandbox.cpu} CPU</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>CPU Cores</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm">
                  <MemoryStick className="w-4 h-4 text-muted-foreground" />
                  <span>{sandbox.memory} GB</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Memory</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span>{sandbox.disk} GB</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Disk Space</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-2 text-sm">
            {sandbox.public ? (
              <Globe className="w-4 h-4 text-green-600" />
            ) : (
              <Lock className="w-4 h-4 text-gray-600" />
            )}
            <span>{sandbox.public ? 'Public' : 'Private'}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{sandbox.user}</span>
          </div>

          {createdAt && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Created {formatDistanceToNow(createdAt, { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Labels */}
        {Object.keys(sandbox.labels).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(sandbox.labels).slice(0, 3).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {value}
              </Badge>
            ))}
            {Object.keys(sandbox.labels).length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{Object.keys(sandbox.labels).length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        {String(sandbox.state) === SandboxState.STARTED ? (
          <div className="flex gap-2 w-full">
            <Button 
              onClick={handleOpen} 
              className="flex-1"
              variant="default"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Workspace
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowStopDialog(true)}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    disabled={isStopping}
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isStopping ? 'Stopping...' : 'Stop Workspace'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : String(sandbox.state) === SandboxState.STOPPED ? (
          <Button 
            onClick={handleStartWorkspace}
            disabled={isStarting}
            className="w-full"
            variant="default"
          >
            <Play className="w-4 h-4 mr-2" />
            {isStarting ? 'Starting...' : 'Start Workspace'}
          </Button>
        ) : (
          <Button 
            onClick={handleOpen} 
            disabled={true}
            className="w-full"
            variant="secondary"
          >
            {config.label}
          </Button>
        )}
      </CardFooter>

      <StopWorkspaceDialog
        open={showStopDialog}
        onOpenChange={setShowStopDialog}
        sandboxId={sandbox.id}
        onConfirm={handleStopWorkspace}
      />
    </Card>
  );
}