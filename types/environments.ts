import type { EncryptedValue } from '@/lib/encryption';

/**
 * Simple environment collection structure
 * Root collection: environments/{userId}
 */
export interface UserEnvironment {
  userId: string;
  daytonaApiKey: EncryptedValue;
  projects: Record<string, ProjectEnvironment>; // projectName -> env vars
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project environment variables
 * Simple key-value map of encrypted values
 */
export interface ProjectEnvironment {
  [key: string]: EncryptedValue; // envKey -> encrypted value
}

/**
 * Firebase-compatible version with Timestamps
 */
export interface FirebaseUserEnvironment {
  userId: string;
  daytonaApiKey: EncryptedValue;
  projects: Record<string, ProjectEnvironment>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}