'use client';

import { useWindowStore } from '../stores/windowStore';
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

export default function Workspace() {
  const windows = useWindowStore((state) => state.windows);
  const onboardingCompleted = useWindowStore((state) => state.onboardingCompleted);
  const isCheckingWorkspaces = useWindowStore((state) => state.isCheckingWorkspaces);
  const completeOnboarding = useWindowStore((state) => state.completeOnboarding);
  const initializeWindows = useWindowStore((state) => state.initializeWindows);
  const checkExistingWorkspaces = useWindowStore((state) => state.checkExistingWorkspaces);
  const setWorkspaceData = useWindowStore((state) => state.setWorkspaceData);
  
  // AgentsOS user data
  const { workspace, isReady, hasCompletedOnboarding, isLoading, completeOnboarding: completeAgentsOSOnboarding } = useAgentsOSUser();
  const isMobile = useIsMobile();
  const [globalSnapState, setGlobalSnapState] = useState<{
    activeZone: { 
      id: 'left' | 'right' | 'top'; 
      bounds: { x: number; y: number; width: number; height: number }; 
      preview: { x: number; y: number; width: number; height: number }; 
    } | null;
    isVisible: boolean;
  }>({ activeZone: null, isVisible: false });

  // Check for existing workspaces on mount and update workspace data
  useEffect(() => {
    checkExistingWorkspaces();
  }, [checkExistingWorkspaces]);

  // Update workspace data when AgentsOS user data changes
  useEffect(() => {
    if (workspace?.repositories) {
      const workspaceData = { repositories: workspace.repositories };
      setWorkspaceData(workspaceData);
      
      // Auto-initialize windows if onboarding is completed and no windows exist
      if (hasCompletedOnboarding && windows.length === 0) {
        initializeWindows(workspaceData);
      }
    }
  }, [workspace, setWorkspaceData, hasCompletedOnboarding, windows.length, initializeWindows]);

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
      
      // Then complete window store onboarding
      completeOnboarding();
      
      // Initialize windows with workspace data if available
      const workspaceData = workspace?.repositories ? { repositories: workspace.repositories } : undefined;
      initializeWindows(workspaceData);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still complete window store onboarding to show the UI
      completeOnboarding();
    }
  };

  // Show loading while checking for existing workspaces or AgentsOS data is loading
  if (isCheckingWorkspaces || isLoading || !isReady) {
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

  // Render desktop workspace on desktop devices
  return (
    <div 
      data-testid="desktop-workspace"
      className="relative w-full h-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-gray-900"
    >
      {/* Menu Bar */}
      <MenuBar />
      
      {/* Main workspace area - Full height, windows go behind dock */}
      <div className="absolute inset-x-0 top-8 bottom-0 overflow-hidden">
        {windows
          .filter((window) => !window.minimized)
          .map((window) => (
            <Window key={window.id} window={window} />
          ))}
      </div>

      {/* Dock - Floating over workspace */}
      <Dock />
      
      {/* Global snap zone overlay */}
      <SnapZoneOverlay 
        activeZone={globalSnapState.activeZone}
        isVisible={globalSnapState.isVisible}
      />
    </div>
  );
}