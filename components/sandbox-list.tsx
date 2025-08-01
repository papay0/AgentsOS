'use client';

import { useState } from 'react';
import { Grid3X3, List, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SandboxCard } from './sandbox-card';
import { SandboxListItem } from './sandbox-list-item';
import type { SandboxListItem as SandboxType } from '@/types/sandbox';
import { cn } from '@/lib/utils';

interface SandboxListProps {
  sandboxes: SandboxType[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onCreateNew?: () => void;
  onStopWorkspace?: () => void;
  onStartWorkspace?: () => void;
  onDeleteWorkspace?: (sandboxId?: string) => void;
}

export function SandboxList({ 
  sandboxes, 
  isLoading = false, 
  onRefresh,
  onCreateNew,
  onStopWorkspace,
  onStartWorkspace,
  onDeleteWorkspace
}: SandboxListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Group sandboxes by state
  const groupedSandboxes = sandboxes.reduce((acc, sandbox) => {
    const state = sandbox.state || 'unknown';
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(sandbox);
    return acc;
  }, {} as Record<string, SandboxType[]>);

  const stateOrder = ['started', 'starting', 'stopping', 'stopped', 'error', 'pending_build', 'building_snapshot'];
  const orderedStates = [
    ...stateOrder.filter(state => groupedSandboxes[state]),
    ...Object.keys(groupedSandboxes).filter(state => !stateOrder.includes(state))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Your Workspaces</h2>
            <p className="text-muted-foreground text-sm">
              {sandboxes.length} workspace{sandboxes.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
              className="hidden sm:flex"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid3X3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>

            {onCreateNew && (
              <Button onClick={onCreateNew} size="sm" className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Workspace</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sandboxes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No workspaces found</p>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workspace
            </Button>
          )}
        </div>
      )}

      {/* Sandbox List/Grid */}
      {viewMode === 'grid' ? (
        <div className="space-y-8">
          {orderedStates.map(state => (
            <div key={state}>
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {state} ({groupedSandboxes[state].length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedSandboxes[state].map(sandbox => (
                  <SandboxCard key={sandbox.id} sandbox={sandbox} onStop={onStopWorkspace} onStart={onStartWorkspace} onDelete={() => onDeleteWorkspace?.(sandbox.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {orderedStates.map(state => (
            <div key={state}>
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {state} ({groupedSandboxes[state].length})
              </h3>
              <div className="space-y-2">
                {groupedSandboxes[state].map(sandbox => (
                  <SandboxListItem key={sandbox.id} sandbox={sandbox} onStop={onStopWorkspace} onStart={onStartWorkspace} onDelete={() => onDeleteWorkspace?.(sandbox.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}