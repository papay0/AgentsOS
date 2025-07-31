'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Terminal, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CreateWorkspaceResponse } from '@/types/workspace';
import Link from 'next/link';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [loadingTerminal, setLoadingTerminal] = useState(false);
  const [error, setError] = useState('');

  const createWorkspace = async () => {
    setLoadingTerminal(true);
    setError('');

    try {
      const response = await fetch('/api/create-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: CreateWorkspaceResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create terminal container');
      }

      localStorage.setItem(`workspace-${data.sandboxId}`, JSON.stringify(data));
      router.push(`/home/workspace/${data.sandboxId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingTerminal(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-4">
          <Link href="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspaces
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Create New Workspace
            </CardTitle>
            <CardDescription>
              Launch a development environment with VSCode and Claude Code pre-installed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  This will:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Create a new Daytona sandbox with 4GB RAM</li>
                  <li>Install VSCode (code-server) for web-based development</li>
                  <li>Install Claude Code CLI globally</li>
                  <li>Set up multiple terminal instances</li>
                  <li>Provide a split-screen development environment</li>
                </ul>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Environment Setup Required:</p>
                <p className="text-xs text-muted-foreground">
                  Make sure your <code>.env.local</code> file contains your <code>DAYTONA_API_KEY</code>
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={createWorkspace}
                disabled={loadingTerminal}
                className="w-full"
              >
                {loadingTerminal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Environment...
                  </>
                ) : (
                  <>
                    <Terminal className="mr-2 h-4 w-4" />
                    Create Workspace
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}