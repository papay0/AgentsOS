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
import { OSBootScreen } from './desktop/OSBootScreen';

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
  const [dragSelect, setDragSelect] = useState<{
    isSelecting: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  
  // REAL-TIME Firebase state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserData | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [showBootScreen, setShowBootScreen] = useState(true);
  
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

  // Handle drag selection (desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    // Allow drag select if not on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('[data-window-id]') || target.closest('[data-dock]') || target.closest('[data-menubar]')) return;
    console.log('Starting drag select');
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragSelect({
      isSelecting: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragSelect?.isSelecting || isMobile) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragSelect({
      ...dragSelect,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    });
  };

  const handleMouseUp = () => {
    if (!dragSelect?.isSelecting || isMobile) return;
    setDragSelect(null);
  };


  // Calculate drag selection rectangle
  const getSelectionRect = () => {
    if (!dragSelect?.isSelecting) return null;
    
    const { startX, startY, currentX, currentY } = dragSelect;
    return {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
    };
  };

  // ALWAYS render the main content if we have basic data - be aggressive!
  let mainContent = null;
  
  if (userId !== undefined) {  // We have user context
    if (isFirebaseLoading) {
      // Still loading Firebase data, but we can show a basic loading state
      mainContent = null;
    } else if (!hasCompletedOnboarding) {
      // User needs onboarding - render it immediately
      if (isMobile) {
        mainContent = <MobileOnboarding onComplete={handleOnboardingComplete} />;
      } else {
        mainContent = <Onboarding onComplete={handleOnboardingComplete} />;
      }
    } else {
      // User has completed onboarding - render workspace IMMEDIATELY to start loading
      if (isMobile) {
        mainContent = (
          <div data-testid="mobile-workspace" className="h-full w-full">
            <MobileWorkspace />
          </div>
        );
      } else {
        // Get the current workspace name for status panel
        const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
        const workspaceName = activeWorkspace?.name 
          ? `${activeWorkspace.name} Workspace` 
          : 'AgentsOS Workspace';

        // Render desktop workspace - terminals will start loading immediately
        mainContent = (
              <div 
                data-testid="desktop-workspace"
                className="relative w-full h-full wallpaper-background select-none"
                style={{
                  backgroundImage: 'var(--desktop-background, url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2560&h=1440&fit=crop&crop=center&q=80"))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  backgroundAttachment: 'fixed'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
            {/* Drag selection rectangle - absolutely first, behind everything */}
            {dragSelect?.isSelecting && getSelectionRect() && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                style={{
                  left: `${getSelectionRect()!.left}px`,
                  top: `${getSelectionRect()!.top}px`,
                  width: `${getSelectionRect()!.width}px`,
                  height: `${getSelectionRect()!.height}px`,
                  zIndex: 0,
                }}
              />
            )}
            
            {/* Menu Bar */}
            <div data-menubar>
              <MenuBar />
            </div>
            
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
                      return (
                        <div key={window.id} data-window-id={window.id}>
                          <Window window={window} />
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>

            {/* Dock - Floating over workspace (workspace-scoped) */}
            <div data-dock>
              <Dock />
            </div>
            
            
            {/* Global snap zone overlay */}
            <SnapZoneOverlay 
              activeZone={globalSnapState.activeZone}
              isVisible={globalSnapState.isVisible}
            />
              </div>
        );
      }
    }
  }
  
  // Show boot screen overlay ONLY for very initial load
  if (showBootScreen) {
    return (
      <>
        {/* Main content renders and starts loading behind boot screen */}
        {mainContent}
        
        {/* Boot screen overlay with high z-index */}
        <OSBootScreen 
          onComplete={() => {
            // Complete after minimum time, regardless of loading state
            setShowBootScreen(false);
          }}
        />
      </>
    );
  }

  // No boot screen needed, show main content directly
  return mainContent;
}