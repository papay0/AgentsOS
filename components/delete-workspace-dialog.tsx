'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
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

interface DeleteWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sandboxId: string;
  onConfirm: (sandboxId: string) => Promise<void>;
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  sandboxId,
  onConfirm
}: DeleteWorkspaceDialogProps) {
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
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete Workspace
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete workspace{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
              {truncatedId}
            </code>
            ?
            <br />
            <br />
            <strong className="text-red-600">This action cannot be undone.</strong>{' '}
            All data, files, and configurations in this workspace will be permanently removed.
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
                Deleting...
              </>
            ) : (
              'Delete Workspace'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}