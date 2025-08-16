import crypto from 'crypto';

/**
 * AgentsOS Encryption Service
 * 
 * Uses a master secret stored in Vercel environment variables combined with
 * user-specific salts to derive per-user encryption keys.
 * 
 * Security Model:
 * - Master secret stored in ENCRYPTION_SECRET env var (Vercel)
 * - Per-user keys derived using PBKDF2 with userId as salt
 * - AES-256-GCM for authenticated encryption
 * 
 * TODO: Migrate to Google Cloud KMS for production scale
 */
export class AgentsOSEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16;  // 128 bits
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations
  
  /**
   * Get the master encryption secret from environment
   */
  private static getMasterSecret(): string {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error(
        'ENCRYPTION_SECRET environment variable is required for secure storage. ' +
        'Please add it to your Vercel environment variables.'
      );
    }
    if (secret.length < 32) {
      throw new Error(
        'ENCRYPTION_SECRET must be at least 32 characters long for security. ' +
        'Generate a strong secret: openssl rand -base64 32'
      );
    }
    return secret;
  }
  
  /**
   * Derive a user-specific encryption key from master secret + userId
   */
  private static deriveUserKey(userId: string): Buffer {
    const masterSecret = this.getMasterSecret();
    const salt = `agentsos-v1-${userId}`; // Versioned salt for future migrations
    
    return crypto.pbkdf2Sync(
      masterSecret,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );
  }
  
  /**
   * Encrypt a value for a specific user
   */
  static encrypt(value: string, userId: string): EncryptedValue {
    try {
      const key = this.deriveUserKey(userId);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv) as crypto.CipherGCM;
      
      const encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final()
      ]);
      
      const tag = cipher.getAuthTag();
      
      return {
        value: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        algorithm: this.ALGORITHM,
        version: 1 // For future migrations
      };
    } catch (error) {
      throw new Error(
        `Failed to encrypt value: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Decrypt a value for a specific user
   */
  static decrypt(encryptedValue: EncryptedValue, userId: string): string {
    try {
      // Validate version compatibility
      if (encryptedValue.version !== 1) {
        throw new Error(`Unsupported encryption version: ${encryptedValue.version}`);
      }
      
      const key = this.deriveUserKey(userId);
      const iv = Buffer.from(encryptedValue.iv, 'base64');
      const tag = Buffer.from(encryptedValue.tag, 'base64');
      const encrypted = Buffer.from(encryptedValue.value, 'base64');
      
      const decipher = crypto.createDecipheriv(encryptedValue.algorithm, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(
        `Failed to decrypt value: ${error instanceof Error ? error.message : 'Invalid encrypted data'}`
      );
    }
  }
  
  /**
   * Validate that an API key has the expected format
   */
  static validateDaytonaApiKey(apiKey: string): boolean {
    // Daytona API keys typically follow a specific format
    // This is a basic validation - adjust based on actual Daytona key format
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Remove whitespace
    const cleanKey = apiKey.trim();
    
    // Check if empty after trimming
    if (!cleanKey) {
      return false;
    }
    
    // Basic length and character validation
    if (cleanKey.length < 6 || cleanKey.length > 200) {
      return false;
    }
    
    // Should contain alphanumeric characters and possibly hyphens/underscores
    const validFormat = /^[a-zA-Z0-9\-_]+$/.test(cleanKey);
    
    return validFormat;
  }
  
  /**
   * Generate a secure random secret for ENCRYPTION_SECRET
   * This is a utility function for setup - not used in production
   */
  static generateMasterSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }
}

/**
 * Structure for encrypted values stored in Firebase
 */
export interface EncryptedValue {
  value: string;      // Base64 encoded encrypted data
  iv: string;         // Base64 encoded initialization vector
  tag: string;        // Base64 encoded authentication tag
  algorithm: string;  // Encryption algorithm used
  version: number;    // Version for future migrations
}

/**
 * Helper functions for common encryption operations
 */
export const EncryptionHelpers = {
  /**
   * Encrypt a Daytona API key for storage
   */
  encryptDaytonaApiKey(apiKey: string, userId: string): EncryptedValue {
    const trimmedKey = apiKey.trim();
    if (!AgentsOSEncryption.validateDaytonaApiKey(trimmedKey)) {
      throw new Error('Invalid Daytona API key format');
    }
    return AgentsOSEncryption.encrypt(trimmedKey, userId);
  },
  
  /**
   * Decrypt a Daytona API key for use
   */
  decryptDaytonaApiKey(encryptedValue: EncryptedValue, userId: string): string {
    const decrypted = AgentsOSEncryption.decrypt(encryptedValue, userId);
    if (!AgentsOSEncryption.validateDaytonaApiKey(decrypted)) {
      throw new Error('Decrypted API key is invalid');
    }
    return decrypted;
  }
};