'use client';

import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Repository, UserWorkspace } from '@/types/workspace';

/**
 * User profile data structure in Firebase
 */
export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // AgentsOS specific data
  agentsOS?: {
    onboardingCompleted: boolean;
    workspace?: UserWorkspace; // Single workspace per user
    preferences: {
      theme: 'light' | 'dark' | 'system';
      notifications: boolean;
    };
    createdAt: Timestamp;
    lastAccessedAt: Timestamp;
  };
}

/**
 * Service for managing user data in Firebase
 * 
 * This service handles all user-related operations including profile management,
 * AgentsOS workspace tracking, and user preferences.
 */
export class UserService {
  private static instance: UserService;
  
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get user profile from Firebase
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateUserProfile(
    uid: string, 
    email: string, 
    name?: string
  ): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', uid);
      const existingUser = await getDoc(userRef);
      
      const now = Timestamp.now();
      
      if (existingUser.exists()) {
        // Update existing user
        const updateData = {
          email,
          name,
          updatedAt: now,
        };
        
        await updateDoc(userRef, updateData);
        
        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data() as UserProfile;
      } else {
        // Create new user
        const newUser: UserProfile = {
          uid,
          email,
          name,
          createdAt: now,
          updatedAt: now,
        };
        
        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw new Error('Failed to create/update user profile');
    }
  }

  /**
   * Initialize AgentsOS for a user (after onboarding)
   */
  async initializeAgentsOS(uid: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const now = Timestamp.now();
      
      const agentsOSData = {
        'agentsOS.onboardingCompleted': true,
        'agentsOS.preferences': {
          theme: 'system',
          notifications: true,
        },
        'agentsOS.createdAt': now,
        'agentsOS.lastAccessedAt': now,
        updatedAt: now,
      };
      
      await updateDoc(userRef, agentsOSData);
    } catch (error) {
      console.error('Error initializing AgentsOS:', error);
      throw new Error('Failed to initialize AgentsOS');
    }
  }

  /**
   * Create or update user's workspace (only one workspace per user)
   */
  async createOrUpdateWorkspace(uid: string, workspace: UserWorkspace): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      
      // Update user's embedded workspace
      await updateDoc(userRef, {
        'agentsOS.workspace': workspace,
        'agentsOS.lastAccessedAt': Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error creating/updating workspace:', error);
      throw new Error('Failed to create/update workspace');
    }
  }

  /**
   * Get user's workspace (single workspace per user)
   */
  async getUserWorkspace(uid: string): Promise<UserWorkspace | null> {
    try {
      const userProfile = await this.getUserProfile(uid);
      return userProfile?.agentsOS?.workspace || null;
    } catch (error) {
      console.error('Error getting user workspace:', error);
      throw new Error('Failed to get user workspace');
    }
  }

  /**
   * Update workspace status
   */
  async updateWorkspaceStatus(
    uid: string,
    status: UserWorkspace['status']
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const now = Timestamp.now();
      
      const updateData = {
        'agentsOS.workspace.status': status,
        'agentsOS.workspace.updatedAt': now,
        'agentsOS.lastAccessedAt': now,
        updatedAt: now,
      };
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating workspace status:', error);
      throw new Error('Failed to update workspace status');
    }
  }

  /**
   * Check if user has completed AgentsOS onboarding
   */
  async hasCompletedOnboarding(uid: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(uid);
      return userProfile?.agentsOS?.onboardingCompleted || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Add repositories to user's workspace
   */
  async addRepositoriesToWorkspace(uid: string, repositories: Repository[]): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const workspace = await this.getUserWorkspace(uid);
      
      if (!workspace) {
        throw new Error('No workspace found for user');
      }

      const existingRepos = workspace.repositories || [];
      const newRepos = repositories.filter(repo => 
        !existingRepos.some(existing => existing.url === repo.url)
      );

      const updatedRepositories = [...existingRepos, ...newRepos];

      await updateDoc(userRef, {
        'agentsOS.workspace.repositories': updatedRepositories,
        'agentsOS.workspace.lastAccessedAt': Timestamp.now(),
        'agentsOS.lastAccessedAt': Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding repositories to workspace:', error);
      throw new Error('Failed to add repositories to workspace');
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    uid: string, 
    preferences: Partial<NonNullable<UserProfile['agentsOS']>['preferences']>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        const currentPreferences = userData.agentsOS?.preferences || {
          theme: 'system',
          notifications: true,
        };
        
        await updateDoc(userRef, {
          'agentsOS.preferences': {
            ...currentPreferences,
            ...preferences,
          },
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }
}