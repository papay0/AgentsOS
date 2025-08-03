'use client';

import { useWorkspaceStore } from '../stores/workspaceStore';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAgentsOSUser } from '@/hooks/use-agentsos-user';
import Window from './desktop/Window';
import Dock from './desktop/Dock';
import MenuBar from './desktop/MenuBar';
import SnapZoneOverlay from './desktop/SnapZoneOverlay';
import MobileWorkspace from './mobile/MobileWorkspace';
import { Onboarding } from './desktop/Onboarding';
import { MobileOnboarding } from './mobile/MobileOnboarding';
import { WorkspaceStatusPanel } from './workspace-status';

export default function Workspace() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    isLoading: isWorkspaceLoading, 
    sandboxId,
    initializeWorkspaces,
    setSandboxId 
  } = useWorkspaceStore();
  
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  // AgentsOS user data
  const { workspace, isReady, hasCompletedOnboarding, isLoading: isUserLoading, completeOnboarding: completeAgentsOSOnboarding } = useAgentsOSUser();
  const isMobile = useIsMobile();
  const [globalSnapState, setGlobalSnapState] = useState<{
    activeZone: { 
      id: 'left' | 'right' | 'top'; 
      bounds: { x: number; y: number; width: number; height: number }; 
      preview: { x: number; y: number; width: number; height: number }; 
    } | null;
    isVisible: boolean;
  }>({ activeZone: null, isVisible: false });

  // Initialize workspaces when AgentsOS user data changes
  useEffect(() => {
    if (workspace?.repositories && hasCompletedOnboarding) {
      // Set sandbox ID for status checking
      if (workspace.sandboxId) {
        setSandboxId(workspace.sandboxId);
      }
      
      // Check if we need to initialize workspaces
      if (workspaces.length === 0) {
        initializeWorkspaces(workspace.repositories);
        setOnboardingCompleted(true);
      }
    }
  }, [workspace, hasCompletedOnboarding, workspaces.length, initializeWorkspaces, setSandboxId]);

  // Listen for snap zone changes from any window
  useEffect(() => {
    const handleSnapZoneChange = (event: CustomEvent) => {
      setGlobalSnapState(event.detail);
    };

    window.addEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
    return () => window.removeEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      // Complete AgentsOS onboarding first
      await completeAgentsOSOnboarding();
      
      // Initialize workspaces if repository data is available
      if (workspace?.repositories) {
        initializeWorkspaces(workspace.repositories);
      }
      
      setOnboardingCompleted(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still complete onboarding to show the UI
      setOnboardingCompleted(true);
    }
  };

  // Show loading while AgentsOS data is loading or workspaces are being initialized
  if (isWorkspaceLoading || isUserLoading || !isReady) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading AgentsOS...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed (check both window store and AgentsOS user state)
  if (!onboardingCompleted || !hasCompletedOnboarding) {
    if (isMobile) {
      return <MobileOnboarding onComplete={handleOnboardingComplete} />;
    }
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Render mobile workspace on mobile devices
  if (isMobile) {
    return (
      <div data-testid="mobile-workspace" className="h-full w-full">
        <MobileWorkspace />
      </div>
    );
  }

  // Get the current workspace name for status panel
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const workspaceName = activeWorkspace?.name 
    ? `${activeWorkspace.name} Workspace` 
    : 'AgentsOS Workspace';

  // Render desktop workspace on desktop devices
  return (
    <div 
      data-testid="desktop-workspace"
      className="relative w-full h-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-gray-900"
    >
      {/* Menu Bar */}
      <MenuBar />
      
      {/* Workspace Status Panel - Shows when workspace needs attention */}
      <WorkspaceStatusPanel 
        sandboxId={sandboxId}
        workspaceName={workspaceName}
      />
      
      {/* Main workspace area - Full height, windows go behind dock */}
      <div className="absolute inset-x-0 top-8 bottom-0 overflow-hidden">
        {/* Render all workspaces but only show the active one */}
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
              workspace.id === activeWorkspaceId 
                ? 'translate-x-0' 
                : activeWorkspaceId && workspace.id < activeWorkspaceId 
                  ? '-translate-x-full' 
                  : 'translate-x-full'
            }`}
          >
            {workspace.windows
              .filter((window) => !window.minimized)
              .map((window) => (
                <Window key={window.id} window={window} />
              ))}
          </div>
        ))}
      </div>

      {/* Dock - Floating over workspace (workspace-scoped) */}
      <Dock />
      
      {/* Global snap zone overlay */}
      <SnapZoneOverlay 
        activeZone={globalSnapState.activeZone}
        isVisible={globalSnapState.isVisible}
      />
    </div>
  );
}