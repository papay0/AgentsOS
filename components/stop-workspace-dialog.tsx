'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StopWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sandboxId: string;
  onConfirm: (sandboxId: string) => Promise<void>;
}

export function StopWorkspaceDialog({
  open,
  onOpenChange,
  sandboxId,
  onConfirm
}: StopWorkspaceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(sandboxId);
      onOpenChange(false);
    } catch {
      // Error handling is done by the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const truncatedId = `${sandboxId.slice(0, 8)}...${sandboxId.slice(-8)}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Stop Workspace
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to stop workspace{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
              {truncatedId}
            </code>
            ?
            <br />
            <br />
            This will shut down all running processes and services in the workspace. 
            You can start it again later, but any unsaved work may be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stopping...
              </>
            ) : (
              'Stop Workspace'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}