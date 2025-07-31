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
  Globe,
  Lock,
  ChevronRight,
  Copy,
  Check,
  StopCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SandboxListItem } from '@/types/sandbox';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StopWorkspaceDialog } from './stop-workspace-dialog';
import { toast } from 'sonner';
import { SandboxState } from '@daytonaio/api-client';

interface SandboxListItemProps {
  sandbox: SandboxListItem;
  onOpen?: (sandboxId: string) => void;
  onStop?: () => void;
  onStart?: () => void;
}

const stateConfig = {
  started: {
    label: 'Running',
    icon: Play,
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  stopped: {
    label: 'Stopped',
    icon: Square,
    className: 'bg-gray-500 hover:bg-gray-600 text-white'
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    className: 'bg-red-500 hover:bg-red-600 text-white'
  },
  pending_build: {
    label: 'Building',
    icon: Clock,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  starting: {
    label: 'Starting',
    icon: Clock,
    className: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  stopping: {
    label: 'Stopping',
    icon: Clock,
    className: 'bg-orange-500 hover:bg-orange-600 text-white'
  }
};

export function SandboxListItem({ sandbox, onOpen, onStop, onStart }: SandboxListItemProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const state = sandbox.state || 'unknown';
  const config = stateConfig[state as keyof typeof stateConfig] || {
    label: state,
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start workspace');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all",
      sandbox.state === 'error' && "border-red-200 dark:border-red-800"
    )}>
      {/* State Icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        state === 'started' && "bg-green-100 dark:bg-green-900",
        state === 'stopped' && "bg-gray-100 dark:bg-gray-800",
        state === 'error' && "bg-red-100 dark:bg-red-900",
        state === 'pending_build' && "bg-yellow-100 dark:bg-yellow-900",
        state === 'starting' && "bg-blue-100 dark:bg-blue-900",
        state === 'stopping' && "bg-orange-100 dark:bg-orange-900"
      )}>
        <StateIcon className={cn(
          "w-5 h-5",
          state === 'started' && "text-green-600 dark:text-green-400",
          state === 'stopped' && "text-gray-600 dark:text-gray-400",
          state === 'error' && "text-red-600 dark:text-red-400",
          state === 'pending_build' && "text-yellow-600 dark:text-yellow-400",
          state === 'starting' && "text-blue-600 dark:text-blue-400",
          state === 'stopping' && "text-orange-600 dark:text-orange-400"
        )} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate" title={sandbox.id}>
              {sandbox.id.slice(0, 8)}...{sandbox.id.slice(-8)}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
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
          <Badge className={config.className} variant="secondary">
            {config.label}
          </Badge>
          {sandbox.public ? (
            <Globe className="w-4 h-4 text-green-600" />
          ) : (
            <Lock className="w-4 h-4 text-gray-600" />
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>@{sandbox.user}</span>
          {createdAt && (
            <>
              <span>•</span>
              <span>Created {formatDistanceToNow(createdAt, { addSuffix: true })}</span>
            </>
          )}
        </div>

        {sandbox.errorReason && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {sandbox.errorReason}
          </p>
        )}
      </div>

      {/* Resources */}
      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Cpu className="w-4 h-4" />
          <span>{sandbox.cpu}</span>
        </div>
        <div className="flex items-center gap-1">
          <MemoryStick className="w-4 h-4" />
          <span>{sandbox.memory}GB</span>
        </div>
        <div className="flex items-center gap-1">
          <HardDrive className="w-4 h-4" />
          <span>{sandbox.disk}GB</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {String(sandbox.state) === SandboxState.STARTED ? (
          <>
            <Button 
              onClick={handleOpen} 
              variant="default"
              size="sm"
            >
              Open
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowStopDialog(true)}
                    variant="outline"
                    size="sm"
                    className="px-2"
                    disabled={isStopping}
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isStopping ? 'Stopping...' : 'Stop Workspace'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        ) : String(sandbox.state) === SandboxState.STOPPED ? (
          <Button 
            onClick={handleStartWorkspace}
            disabled={isStarting}
            variant="default"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            {isStarting ? 'Starting...' : 'Start'}
          </Button>
        ) : (
          <Button 
            onClick={handleOpen} 
            disabled={true}
            variant="secondary"
            size="sm"
          >
            {config.label}
          </Button>
        )}
      </div>

      <StopWorkspaceDialog
        open={showStopDialog}
        onOpenChange={setShowStopDialog}
        sandboxId={sandbox.id}
        onConfirm={handleStopWorkspace}
      />
    </div>
  );
}