'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { FirebaseAuthService, FirebaseUserData } from '@/lib/firebase-auth';

/**
 * Hook to manage Firebase authentication with Clerk integration
 */
export function useFirebaseAuth() {
  const { getToken, userId, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firebaseAuthService = FirebaseAuthService.getInstance();

  /**
   * Sign into Firebase and sync user data
   */
  const signIntoFirebase = useCallback(async () => {
    if (!isSignedIn || !getToken || !clerkUser) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Sign into Firebase with Clerk token
      await firebaseAuthService.signInWithClerk(getToken);
      
      // Sync user data with Firestore
      await firebaseAuthService.syncUserWithFirestore(clerkUser);
      
      // Get updated user data
      const userData = await firebaseAuthService.getUserData();
      setFirebaseUser(userData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Firebase authentication failed';
      
      // Don't show error for expected Firebase integration disabled case
      if (errorMessage.includes('firebase is disabled') || errorMessage.includes('integration_firebase')) {
        console.log('Firebase integration not enabled - continuing in Clerk-only mode');
        setError(null);
      } else {
        setError(errorMessage);
        console.error('Firebase authentication error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken, clerkUser, firebaseAuthService]);

  /**
   * Sign out from Firebase
   */
  const signOut = useCallback(async () => {
    try {
      await firebaseAuthService.signOut();
      setFirebaseUser(null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
    }
  }, [firebaseAuthService]);

  /**
   * Refresh user data from Firestore
   */
  const refreshUserData = useCallback(async () => {
    try {
      const userData = await firebaseAuthService.getUserData();
      setFirebaseUser(userData);
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  }, [firebaseAuthService]);

  // Auto-authenticate when Clerk user is available
  useEffect(() => {
    if (isSignedIn && clerkUser && !firebaseUser && !isLoading) {
      signIntoFirebase();
    }
  }, [isSignedIn, clerkUser, firebaseUser, isLoading, signIntoFirebase]);

  // Clear state when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      setFirebaseUser(null);
      setError(null);
    }
  }, [isSignedIn]);

  return {
    // State
    firebaseUser,
    isLoading,
    error,
    
    // Computed state
    isAuthenticated: isSignedIn && !!firebaseUser,
    isReady: isSignedIn && !isLoading,
    hasCompletedOnboarding: firebaseUser?.agentsOS?.onboardingCompleted || false,
    
    // Actions
    signIntoFirebase,
    signOut,
    refreshUserData,
    
    // Utils
    getFirebaseUid: () => firebaseUser?.uid || userId || null,
  };
}