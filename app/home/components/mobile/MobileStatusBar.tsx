'use client';

import { SignedIn, UserButton } from '@clerk/nextjs';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { MobileHealthIcon } from './MobileHealthIcon';
import { PortShortcutIcon } from '../ui/PortShortcutIcon';

export function MobileStatusBar() {
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <div className="absolute top-0 left-0 right-0 h-12 bg-black/10 backdrop-blur-md flex items-center px-4 text-white text-sm z-50 safe-area-top">
      {/* Left - User profile */}
      <div className="w-6 flex justify-start">
        <SignedIn>
          <div className="w-6 h-6">
            <UserButton 
              appearance={{
                elements: {
                  userButtonPopoverCard: "bg-black/90 backdrop-blur-xl border-white/20",
                  userButtonPopoverActionButton: "text-white hover:bg-white/10",
                  userButtonPopoverActionButtonText: "text-white",
                  userButtonPopoverActionButtonIcon: "text-white",
                  userButtonPopoverFooter: "hidden"
                }
              }}
            />
          </div>
        </SignedIn>
      </div>

      {/* Center - Project name perfectly centered */}
      <div className="flex-1 flex justify-center">
        {activeWorkspace && (
          <span className="text-sm font-medium truncate max-w-32">
            {activeWorkspace.name}
          </span>
        )}
      </div>

      {/* Right - Port shortcut and health indicator */}
      <div className="flex items-center gap-2">
        <PortShortcutIcon />
        <MobileHealthIcon />
      </div>
    </div>
  );
}