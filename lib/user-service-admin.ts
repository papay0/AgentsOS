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

export interface Repository {
  url: string;
  name: string;
  description?: string;
  tech?: string;
  clonedAt?: admin.firestore.Timestamp;
  urls?: {
    vscode: string;
    terminal: string;
    claude: string;
  };
}

export interface UserWorkspace {
  id: string;
  sandboxId: string;
  name: string;
  repositories: Repository[];
  status: 'creating' | 'running' | 'stopped' | 'error';
  urls?: {
    vscode: string;
    terminal: string;
    claude: string;
  };
  createdAt: admin.firestore.Timestamp;
  lastAccessedAt: admin.firestore.Timestamp;
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
      
      // Create or update user's embedded workspace
      await userRef.set({
        agentsOS: {
          workspace: workspace,
          lastAccessedAt: Timestamp.now(),
          onboardingCompleted: true,
          preferences: {
            theme: 'system',
            notifications: true
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
    status: UserWorkspace['status'],
    urls?: UserWorkspace['urls']
  ): Promise<void> {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }
    
    try {
      const userRef = adminDb.collection('users').doc(uid);
      const now = Timestamp.now();
      
      const workspaceUpdate: Partial<UserWorkspace> = {
        status: status,
        lastAccessedAt: now,
      };
      
      if (urls) {
        workspaceUpdate.urls = urls;
      }
      
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
}