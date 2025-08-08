'use client';

import { ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    switchToWorkspace, 
    getActiveWorkspace 
  } = useWorkspaceStore();

  const activeWorkspace = getActiveWorkspace();

  // Don't render if no workspaces
  if (workspaces.length === 0) {
    return null;
  }

  // Don't render if only one workspace (no need to switch)
  if (workspaces.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white">
        <FolderOpen className="h-4 w-4 text-white/60" />
        <span>{activeWorkspace?.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 font-medium text-white hover:bg-white/10 border-none"
        >
          <FolderOpen className="h-4 w-4 text-white/60" />
          <span className="max-w-[120px] truncate">
            {activeWorkspace?.name || 'Select Workspace'}
          </span>
          <ChevronDown className="h-3 w-3 text-white/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-black/90 backdrop-blur-xl border-white/20">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchToWorkspace(workspace.id)}
            className={cn(
              "flex items-center gap-3 cursor-pointer text-white hover:bg-white/10",
              workspace.id === activeWorkspaceId && "bg-white/20"
            )}
          >
            <Folder className="h-4 w-4 text-white/60" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{workspace.name}</div>
              <div className="text-xs text-white/60 truncate">
                {workspace.repository.tech || 'Repository'}
              </div>
            </div>
            {workspace.id === activeWorkspaceId && (
              <div className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}