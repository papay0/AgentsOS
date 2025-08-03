'use client';

import { useWorkspaceStore } from '../stores/workspaceStore';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAgentsOSUser } from '@/hooks/use-agentsos-user';
import type { CreateWorkspaceResponse } from '@/types/workspace';
import { Timestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@clerk/nextjs';
import Window from './desktop/Window';
import Dock from './desktop/Dock';
import MenuBar from './desktop/MenuBar';
import SnapZoneOverlay from './desktop/SnapZoneOverlay';
import MobileWorkspace from './mobile/MobileWorkspace';
import { Onboarding } from './desktop/Onboarding';
import { MobileOnboarding } from './mobile/MobileOnboarding';
import { WorkspaceStatusPanel } from './workspace-status';

interface FirebaseUserData {
  agentsOS?: {
    onboardingCompleted: boolean;
    workspace?: {
      sandboxId: string;
      repositories: Array<{
        url: string;
        name: string;
        description?: string;
        tech?: string;
        urls?: {
          vscode: string;
          terminal: string;
          claude: string;
        };
      }>;
    };
  };
}

export default function Workspace() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    isLoading: isWorkspaceLoading, 
    sandboxId,
    initializeWorkspaces,
    setSandboxId 
  } = useWorkspaceStore();
  
  const { userId } = useAuth();
  const { 
    completeOnboarding: completeAgentsOSOnboarding,
    createOrUpdateWorkspace
  } = useAgentsOSUser();
  
  const isMobile = useIsMobile();
  
  // REAL-TIME Firebase state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserData | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  
  const [globalSnapState, setGlobalSnapState] = useState<{
    activeZone: { 
      id: 'left' | 'right' | 'top'; 
      bounds: { x: number; y: number; width: number; height: number }; 
      preview: { x: number; y: number; width: number; height: number }; 
    } | null;
    isVisible: boolean;
  }>({ activeZone: null, isVisible: false });

  // REAL-TIME Firebase listener with onSnapshot
  useEffect(() => {
    if (!userId || !db) {
      setIsFirebaseLoading(false);
      return;
    }

    console.log('Setting up real-time Firebase listener for user:', userId);
    
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          console.log('Firebase real-time update:', userData);
          setFirebaseUser(userData);
          
          // Initialize workspace if we have data
          const workspace = userData?.agentsOS?.workspace;
          if (workspace?.repositories && workspace.sandboxId) {
            console.log('Initializing workspace from Firebase:', workspace);
            setSandboxId(workspace.sandboxId);
            
            if (workspaces.length === 0) {
              initializeWorkspaces(workspace.repositories);
            }
          }
        } else {
          console.log('No Firebase user document found');
          setFirebaseUser(null);
        }
        setIsFirebaseLoading(false);
      },
      (error) => {
        console.error('Firebase listener error:', error);
        setIsFirebaseLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, workspaces.length, initializeWorkspaces, setSandboxId]);

  // Listen for snap zone changes from any window
  useEffect(() => {
    const handleSnapZoneChange = (event: CustomEvent) => {
      setGlobalSnapState(event.detail);
    };

    window.addEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
    return () => window.removeEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
  }, []);

  // ULTRA SIMPLE onboarding completion - save workspace to Firebase
  const handleOnboardingComplete = async (workspaceData?: CreateWorkspaceResponse) => {
    console.log('Onboarding completed - saving to Firebase');
    
    // Mark onboarding as complete
    await completeAgentsOSOnboarding();
    
    // Save workspace data to Firebase if we have it
    if (workspaceData?.repositories && workspaceData.sandboxId) {
      const now = Timestamp.now();
      await createOrUpdateWorkspace({
        id: workspaceData.sandboxId,
        sandboxId: workspaceData.sandboxId,
        name: `Workspace ${new Date().toLocaleDateString()}`,
        repositories: workspaceData.repositories.map(repo => ({
          url: repo.url,
          name: repo.name,
          description: repo.description,
          tech: repo.tech,
          urls: repo.urls, // IMPORTANT: Include the service URLs!
        })),
        status: 'running' as const,
        urls: {
          vscode: workspaceData.vscodeUrl,
          terminal: workspaceData.terminalUrl,
          claude: workspaceData.claudeTerminalUrl,
        },
        createdAt: now,
        lastAccessedAt: now,
      });
    }
    
    // Firebase listener will automatically show workspace when data is updated
  };

  // Derive state from Firebase data
  const hasCompletedOnboarding = firebaseUser?.agentsOS?.onboardingCompleted || false;
  const isReady = !isFirebaseLoading && userId !== undefined;

  // Show loading while data is loading
  if (isWorkspaceLoading || isFirebaseLoading || !isReady) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading AgentsOS...</p>
        </div>
      </div>
    );
  }

  // SIMPLE: Show onboarding if Firebase says user hasn't completed it
  if (!hasCompletedOnboarding) {
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
              .map((window) => {
                // Debug logging for window URLs
                if (workspace.id === activeWorkspaceId) {
                  console.log(`Window ${window.title} URL:`, window.repositoryUrl);
                }
                return <Window key={window.id} window={window} />;
              })}
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