import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL environment variables are required');
    }
    
    const credential = admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    
    admin.initializeApp({
      credential,
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    
    // Only log during development or actual runtime (not during build)
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV) {
      console.log('🔥 Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

// Export admin services only if initialized
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

// Use Firebase Admin timestamp
const Timestamp = admin.firestore.Timestamp;

import type { UserWorkspace } from '@/types/workspace';

/**
 * Clean undefined values from object to avoid Firestore errors
 */
function cleanUndefinedValues(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  }
  
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Server-side service for managing user data in Firebase (Admin SDK)
 */
export class UserServiceAdmin {
  private static instance: UserServiceAdmin;
  
  static getInstance(): UserServiceAdmin {
    if (!UserServiceAdmin.instance) {
      UserServiceAdmin.instance = new UserServiceAdmin();
    }
    return UserServiceAdmin.instance;
  }

  /**
   * Create or update user's workspace (only one workspace per user)
   */
  async createOrUpdateWorkspace(uid: string, workspace: UserWorkspace): Promise<void> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    
    try {
      const userRef = adminDb.collection('users').doc(uid);
      
      // Clean the workspace data to avoid undefined values
      const cleanedWorkspace = cleanUndefinedValues(workspace);
      
      // Create or update user's embedded workspace
      await userRef.set({
        agentsOS: {
          workspace: cleanedWorkspace,
          lastAccessedAt: Timestamp.now(),
          onboardingCompleted: true,
          preferences: {
            theme: 'system'
          }
        },
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error creating/updating workspace:', error);
      throw new Error('Failed to create/update workspace');
    }
  }

  /**
   * Get user's workspace (single workspace per user)
   */
  async getUserWorkspace(uid: string): Promise<UserWorkspace | null> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    
    try {
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        return userData?.agentsOS?.workspace || null;
      }
      
      return null;
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
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    
    try {
      const userRef = adminDb.collection('users').doc(uid);
      const now = Timestamp.now();
      
      const workspaceUpdate = {
        status: status,
        updatedAt: now.toDate(),
      };
      
      await userRef.set({
        agentsOS: {
          workspace: workspaceUpdate,
          lastAccessedAt: now,
        },
        updatedAt: now,
      }, { merge: true });
    } catch (error) {
      console.error('Error updating workspace status:', error);
      throw new Error('Failed to update workspace status');
    }
  }

  /**
   * Store encrypted Daytona API key in environments collection
   */
  async storeDaytonaApiKey(uid: string, apiKey: string): Promise<void> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      const { EncryptionHelpers } = await import('./encryption');
      const encryptedApiKey = EncryptionHelpers.encryptDaytonaApiKey(apiKey, uid);
      
      const envRef = adminDb.collection('environments').doc(uid);
      const now = Timestamp.now();

      // Check if environment document exists
      const envDoc = await envRef.get();
      
      if (envDoc.exists) {
        // Update existing document
        await envRef.update({
          daytonaApiKey: encryptedApiKey,
          updatedAt: now
        });
      } else {
        // Create new environment document
        await envRef.set({
          userId: uid,
          daytonaApiKey: encryptedApiKey,
          projects: {},
          createdAt: now,
          updatedAt: now
        });
      }
    } catch (error) {
      console.error('Error storing Daytona API key:', error);
      throw new Error('Failed to store Daytona API key');
    }
  }

  /**
   * Retrieve and decrypt Daytona API key from environments collection
   */
  async getDaytonaApiKey(uid: string): Promise<string | null> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      const envRef = adminDb.collection('environments').doc(uid);
      const envDoc = await envRef.get();

      if (envDoc.exists) {
        const envData = envDoc.data();
        const encryptedApiKey = envData?.daytonaApiKey;

        if (encryptedApiKey) {
          const { EncryptionHelpers } = await import('./encryption');
          return EncryptionHelpers.decryptDaytonaApiKey(encryptedApiKey, uid);
        }
      }

      return null;
    } catch (error) {
      console.error('Error retrieving Daytona API key:', error);
      throw new Error('Failed to retrieve Daytona API key');
    }
  }

  /**
   * Store an environment variable for a specific project
   */
  async storeProjectEnvVar(uid: string, projectName: string, key: string, value: string): Promise<void> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      const { EncryptionHelpers } = await import('./encryption');
      const encryptedValue = EncryptionHelpers.encryptEnvVar(value, uid);
      
      const envRef = adminDb.collection('environments').doc(uid);
      const now = Timestamp.now();

      // First get the current document to preserve existing data
      const currentDoc = await envRef.get();
      const currentData = currentDoc.exists ? currentDoc.data() : {};
      
      // Create the nested structure properly
      const projects = currentData.projects || {};
      if (!projects[projectName]) {
        projects[projectName] = {};
      }
      projects[projectName][key] = encryptedValue;

      // Update the entire projects object to ensure proper nesting
      await envRef.set({
        ...currentData,
        projects: projects,
        updatedAt: now
      }, { merge: true });
    } catch (error) {
      console.error('Error storing project environment variable:', error);
      throw new Error('Failed to store project environment variable');
    }
  }

  /**
   * Get all environment variables for a specific project (decrypted)
   */
  async getProjectEnvVars(uid: string, projectName: string): Promise<Record<string, string>> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      const envRef = adminDb.collection('environments').doc(uid);
      const envDoc = await envRef.get();

      if (envDoc.exists) {
        const envData = envDoc.data();
        const projectEnvs = envData?.projects?.[projectName] || {};
        
        const decryptedEnvs: Record<string, string> = {};
        const { EncryptionHelpers } = await import('./encryption');

        for (const [key, encryptedValue] of Object.entries(projectEnvs)) {
          try {
            decryptedEnvs[key] = EncryptionHelpers.decryptEnvVar(encryptedValue as import('./encryption').EncryptedValue, uid);
          } catch (error) {
            console.error(`Failed to decrypt env var ${key}:`, error);
            // Skip this variable but continue with others
          }
        }

        return decryptedEnvs;
      }

      return {};
    } catch (error) {
      console.error('Error retrieving project environment variables:', error);
      throw new Error('Failed to retrieve project environment variables');
    }
  }

  /**
   * Delete a specific environment variable for a project
   */
  async deleteProjectEnvVar(uid: string, projectName: string, key: string): Promise<void> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      const envRef = adminDb.collection('environments').doc(uid);
      const now = Timestamp.now();

      // Get current document to properly update nested structure
      const currentDoc = await envRef.get();
      if (!currentDoc.exists) {
        return; // Nothing to delete
      }

      const currentData = currentDoc.data();
      const projects = currentData?.projects || {};
      
      if (projects[projectName] && projects[projectName][key]) {
        delete projects[projectName][key];
        
        // If project has no more env vars, remove the project entirely
        if (Object.keys(projects[projectName]).length === 0) {
          delete projects[projectName];
        }

        // Update the document with the modified projects structure
        await envRef.set({
          ...currentData,
          projects: projects,
          updatedAt: now
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error deleting project environment variable:', error);
      throw new Error('Failed to delete project environment variable');
    }
  }

  /**
   * Get user's full environment document
   */
  async getUserEnvironment(uid: string): Promise<import('@/types/environments').UserEnvironment | null> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      const envRef = adminDb.collection('environments').doc(uid);
      const envDoc = await envRef.get();

      if (envDoc.exists) {
        return envDoc.data() as import('@/types/environments').UserEnvironment;
      }

      return null;
    } catch (error) {
      console.error('Error retrieving user environment:', error);
      throw new Error('Failed to retrieve user environment');
    }
  }
}