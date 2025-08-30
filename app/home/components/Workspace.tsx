'use client';

import { useWorkspaceStore } from '../stores/workspaceStore';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAgentsOSUser } from '@/hooks/use-agentsos-user';
import { doc, onSnapshot } from 'firebase/firestore';
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
import { FirebaseUserData } from '@/lib/firebase-auth';

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
    completeOnboarding: completeAgentsOSOnboarding
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
  const [shouldShowSetup, setShouldShowSetup] = useState(false);
  
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

    // Setting up real-time Firebase listener
    
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data() as FirebaseUserData;
          // Firebase real-time update received
          setFirebaseUser(userData);
          
          // Check if setup is complete
          const hasCompletedSetup = userData?.agentsOS?.preferences?.setupDone === true;
          
          if (!hasCompletedSetup) {
            // Just mark that we should show setup - don't mess with workspaces!
            setShouldShowSetup(true);
          } else {
            setShouldShowSetup(false);
          }
          
          // Initialize workspace if we have data (regardless of setup status)
          const workspace = userData?.agentsOS?.workspace;
          if (workspace?.repositories && workspace.sandboxId) {
            // Initializing workspace from Firebase data
            setSandboxId(workspace.sandboxId);
            
            if (workspaces.length === 0) {
              initializeWorkspaces(workspace.repositories);
            }
          }
        } else {
          // No Firebase user document found
          setFirebaseUser(null);
        }
        setIsFirebaseLoading(false);
      },
      () => {
        setIsFirebaseLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, workspaces.length, initializeWorkspaces, setSandboxId]);

  // Open setup app when needed
  useEffect(() => {
    if (shouldShowSetup && workspaces.length > 0 && workspaces[0]?.id) {
      const { addWindow, getActiveWorkspace } = useWorkspaceStore.getState();
      const activeWorkspace = getActiveWorkspace();
      
      if (activeWorkspace) {
        // Check if setup window is already open
        const existingSetupWindow = activeWorkspace.windows.find(w => w.type === 'setup');
        if (!existingSetupWindow) {
          setTimeout(() => {
            addWindow({
              type: 'setup',
              title: 'Welcome to AgentsOS',
              position: { x: 50, y: 50 },
              size: { width: 1200, height: 800 },
              minimized: false,
              maximized: true,
              focused: true,
              repositoryName: activeWorkspace.name,
              repositoryUrl: ''
            });
          }, 100);
        }
      }
    }
  }, [shouldShowSetup, workspaces]);

  // Listen for snap zone changes from any window
  useEffect(() => {
    const handleSnapZoneChange = (event: CustomEvent) => {
      setGlobalSnapState(event.detail);
    };

    window.addEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
    return () => window.removeEventListener('snapZoneChange', handleSnapZoneChange as EventListener);
  }, []);

  // ULTRA SIMPLE onboarding completion
  const handleOnboardingComplete = async () => {
    // Onboarding completed
    
    // Mark onboarding as complete
    await completeAgentsOSOnboarding();
    
    // Note: Workspace data is now saved to Firebase by the backend during provisioning
    // in /api/workspace/provision - no need to duplicate that here
    
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
    // Starting drag select
    
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
                        // Debug: Window URL logging removed
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
          sandboxId={sandboxId || undefined}
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