'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFirebaseAuth } from './use-firebase-auth';
import { UserService } from '@/lib/user-service';
import type { UserWorkspace } from '@/types/workspace';
import type { FirebaseUserData } from '@/lib/firebase-auth';

type UserPreferences = NonNullable<FirebaseUserData['agentsOS']>['preferences'];

/**
 * Hook for managing AgentsOS user state and operations
 * 
 * This hook combines Clerk authentication, Firebase integration, and user data management
 * to provide a complete user experience for AgentsOS.
 */
export function useAgentsOSUser() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { firebaseUser, isLoading: isFirebaseLoading, isReady: isFirebaseReady, getFirebaseUid } = useFirebaseAuth();
  
  const [workspace, setWorkspace] = useState<UserWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userService = UserService.getInstance();

  /**
   * Load user workspace from Firebase
   */
  const loadWorkspace = useCallback(async (uid: string) => {
    try {
      setError(null);
      const userWorkspace = await userService.getUserWorkspace(uid);
      setWorkspace(userWorkspace);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workspace';
      setError(errorMessage);
      console.error('Error loading workspace:', err);
    }
  }, [userService]);

  /**
   * Complete AgentsOS onboarding
   */
  const completeOnboarding = useCallback(async () => {
    const uid = getFirebaseUid();
    if (!uid) {
      throw new Error('User not authenticated');
    }

    try {
      await userService.initializeAgentsOS(uid);
      
      // Refresh Firebase user data
      // Note: The Firebase hook will automatically update when Firestore changes
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }, [getFirebaseUid, userService]);

  /**
   * Create or update user's workspace
   */
  const createOrUpdateWorkspace = useCallback(async (workspace: UserWorkspace) => {
    const uid = getFirebaseUid();
    if (!uid) {
      throw new Error('User not authenticated');
    }

    try {
      await userService.createOrUpdateWorkspace(uid, workspace);
      
      // Update local state
      setWorkspace(workspace);
    } catch (error) {
      console.error('Error creating/updating workspace:', error);
      throw error;
    }
  }, [getFirebaseUid, userService]);

  /**
   * Update workspace status
   */
  const updateWorkspaceStatus = useCallback(async (
    status: UserWorkspace['status']
  ) => {
    const uid = getFirebaseUid();
    if (!uid) {
      throw new Error('User not authenticated');
    }

    try {
      await userService.updateWorkspaceStatus(uid, status);
      
      // Update local state
      setWorkspace(prev => 
        prev ? { ...prev, status, updatedAt: new Date() } : null
      );
    } catch (error) {
      console.error('Error updating workspace status:', error);
      throw error;
    }
  }, [getFirebaseUid, userService]);

  /**
   * Update user preferences
   */
  const updateUserPreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    const uid = getFirebaseUid();
    if (!uid) {
      throw new Error('User not authenticated');
    }

    try {
      await userService.updateUserPreferences(uid, preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }, [getFirebaseUid, userService]);


  // Load workspace when Firebase user changes or onboarding status changes
  useEffect(() => {
    const loadUserWorkspace = async (uid: string) => {
      try {
        setError(null);
        const userWorkspace = await userService.getUserWorkspace(uid);
        setWorkspace(userWorkspace);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load workspace';
        setError(errorMessage);
        console.error('Error loading workspace:', err);
      }
    };

    if (isFirebaseReady && firebaseUser?.uid) {
      loadUserWorkspace(firebaseUser.uid);
    }
  }, [isFirebaseReady, firebaseUser?.uid, firebaseUser?.agentsOS?.onboardingCompleted, userService]);

  // Computed values
  const isAuthenticated = isClerkLoaded && isFirebaseReady && !!firebaseUser;
  const hasCompletedOnboarding = firebaseUser?.agentsOS?.onboardingCompleted || false;
  const isReady = isClerkLoaded && isFirebaseReady;

  return {
    // Authentication state
    isAuthenticated,
    isReady,
    isLoading: isFirebaseLoading || !isClerkLoaded,
    error,
    
    // User data  
    userProfile: firebaseUser,
    workspace,
    
    // Computed state
    hasCompletedOnboarding,
    needsOnboarding: isAuthenticated && !hasCompletedOnboarding,
    
    // Actions
    completeOnboarding,
    createOrUpdateWorkspace,
    updateWorkspaceStatus,
    updateUserPreferences,
    refreshUserData: () => {
      const uid = getFirebaseUid();
      if (uid) {
        loadWorkspace(uid);
      }
    },
    
    // Utils
    getFirebaseUid,
    clerkUser,
    firebaseUser,
  };
}