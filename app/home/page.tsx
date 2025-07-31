'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SandboxList } from '@/components/sandbox-list';
import { SandboxListSkeleton } from '@/components/sandbox-skeleton';
import type { ListWorkspacesResponse, SandboxListItem } from '@/types/sandbox';

export default function HomePage() {
  const router = useRouter();
  const [sandboxes, setSandboxes] = useState<SandboxListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSandboxes = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/list-workspaces');
      const data: ListWorkspacesResponse = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      setSandboxes(data.sandboxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSandboxes();
  }, [fetchSandboxes]);

  const handleCreateNew = () => {
    router.push('/home/create');
  };

  const handleRefresh = () => {
    fetchSandboxes();
  };

  const handleStopWorkspace = () => {
    // Refresh the list after stopping a workspace
    fetchSandboxes();
  };

  const handleStartWorkspace = () => {
    // Refresh the list after starting a workspace
    fetchSandboxes();
  };

  if (error && !isLoading && sandboxes.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              onClick={handleRefresh}
              className="ml-2 p-0 h-auto"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading && sandboxes.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <SandboxListSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <SandboxList
        sandboxes={sandboxes}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        onStopWorkspace={handleStopWorkspace}
        onStartWorkspace={handleStartWorkspace}
      />
    </div>
  );
}