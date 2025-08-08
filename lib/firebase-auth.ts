'use client';

import { signInWithCustomToken, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserResource } from '@clerk/types';

export interface FirebaseUserData {
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImageUrl: string;
  clerkUserId: string;
  createdAt: unknown;
  updatedAt: unknown;
  // AgentsOS specific data
  agentsOS?: {
    onboardingCompleted: boolean;
    workspace?: {
      id: string;
      sandboxId: string;
      name: string;
      repositories: Array<{
        url: string;
        name: string;
        description?: string;
        tech?: string;
      }>;
      status: 'creating' | 'running' | 'stopped' | 'error';
      urls?: {
        vscode: string;
        terminal: string;
        claude: string;
      };
      createdAt: unknown;
      lastAccessedAt: unknown;
    };
    preferences: {
      theme: 'light' | 'dark' | 'system';
      setupDone?: boolean;
      githubReposEnabled?: boolean;
      githubRepos?: string[];
      wallpaper?: string;
    };
    createdAt: unknown;
    lastAccessedAt: unknown;
  };
}

export class FirebaseAuthService {
  private static instance: FirebaseAuthService;
  private firebaseUser: FirebaseUser | null = null;

  static getInstance(): FirebaseAuthService {
    if (!FirebaseAuthService.instance) {
      FirebaseAuthService.instance = new FirebaseAuthService();
    }
    return FirebaseAuthService.instance;
  }

  async signInWithClerk(getToken: (options: { template: string }) => Promise<string | null>): Promise<FirebaseUser | null> {
    try {
      const token = await getToken({ template: "integration_firebase" });
      
      if (!token) {
        console.warn('Firebase integration not configured in Clerk - using Clerk-only mode');
        return null;
      }

      const userCredential = await signInWithCustomToken(auth, token);
      this.firebaseUser = userCredential.user;
      
      return this.firebaseUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a Firebase integration disabled error
      if (errorMessage.includes('firebase is disabled') || errorMessage.includes('integration_firebase')) {
        console.warn('Firebase integration not enabled in Clerk - proceeding in Clerk-only mode');
        return null;
      }
      
      console.error('Firebase authentication failed:', error);
      throw error;
    }
  }

  async syncUserWithFirestore(clerkUser: UserResource): Promise<void> {
    if (!this.firebaseUser) {
      throw new Error('Firebase user not authenticated');
    }

    const userRef = doc(db, 'users', this.firebaseUser.uid);
    
    try {
      const userDoc = await getDoc(userRef);
      const userData: Partial<FirebaseUserData> = {
        uid: this.firebaseUser.uid,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        displayName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'User',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        username: clerkUser.username || '',
        profileImageUrl: clerkUser.imageUrl || '',
        clerkUserId: clerkUser.id,
        updatedAt: serverTimestamp(),
      };

      if (!userDoc.exists()) {
        userData.createdAt = serverTimestamp();
        // Initialize AgentsOS data for new users
        userData.agentsOS = {
          onboardingCompleted: false,
          preferences: {
            theme: 'system'
          },
          createdAt: serverTimestamp(),
          lastAccessedAt: serverTimestamp(),
        };
      }

      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error('Failed to sync user with Firestore:', error);
      throw error;
    }
  }

  async getUserData(): Promise<FirebaseUserData | null> {
    if (!this.firebaseUser) {
      return null;
    }

    try {
      const userRef = doc(db, 'users', this.firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as FirebaseUserData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  getCurrentFirebaseUser(): FirebaseUser | null {
    return this.firebaseUser;
  }

  async signOut(): Promise<void> {
    try {
      await auth.signOut();
      this.firebaseUser = null;
    } catch (error) {
      console.error('Firebase sign out failed:', error);
      throw error;
    }
  }
}