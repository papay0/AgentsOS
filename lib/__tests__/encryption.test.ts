import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

// Store original crypto functions
const originalPbkdf2Sync = crypto.pbkdf2Sync;
const originalRandomBytes = crypto.randomBytes;
const originalCreateCipheriv = crypto.createCipheriv;
const originalCreateDecipheriv = crypto.createDecipheriv;

describe('AgentsOSEncryption', () => {
  const testUserId = 'user-123';
  const mockMasterSecret = 'mock-master-secret-32-chars-long!';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable
    process.env.ENCRYPTION_SECRET = mockMasterSecret;
  });

  afterEach(() => {
    // Restore original functions
    crypto.pbkdf2Sync = originalPbkdf2Sync;
    crypto.randomBytes = originalRandomBytes;
    crypto.createCipheriv = originalCreateCipheriv;
    crypto.createDecipheriv = originalCreateDecipheriv;
  });

  // Import after setting up mocks
  const getModule = async () => {
    // eslint-disable-next-line @next/next/no-assign-module-variable
    const encryptionModule = await import('../encryption');
    return encryptionModule;
  };

  describe('Environment Validation', () => {
    it('should throw error when ENCRYPTION_SECRET is missing', async () => {
      delete process.env.ENCRYPTION_SECRET;
      const { AgentsOSEncryption } = await getModule();

      expect(() => {
        AgentsOSEncryption.encrypt('test', testUserId);
      }).toThrow('ENCRYPTION_SECRET environment variable is required');
    });

    it('should throw error when ENCRYPTION_SECRET is too short', async () => {
      process.env.ENCRYPTION_SECRET = 'short';
      const { AgentsOSEncryption } = await getModule();

      expect(() => {
        AgentsOSEncryption.encrypt('test', testUserId);
      }).toThrow('ENCRYPTION_SECRET must be at least 32 characters long');
    });

    it('should accept valid ENCRYPTION_SECRET', async () => {
      process.env.ENCRYPTION_SECRET = mockMasterSecret;
      const { AgentsOSEncryption } = await getModule();

      // This will use real crypto, so we just check it doesn't throw
      expect(() => {
        AgentsOSEncryption.encrypt('test', testUserId);
      }).not.toThrow();
    });
  });

  describe('Daytona API Key Validation', () => {
    it('should validate correct API key formats', async () => {
      const { AgentsOSEncryption } = await getModule();
      
      expect(AgentsOSEncryption.validateDaytonaApiKey('ABC123')).toBe(true);
      expect(AgentsOSEncryption.validateDaytonaApiKey('test-api-key-123')).toBe(true);
      expect(AgentsOSEncryption.validateDaytonaApiKey('user_token_456')).toBe(true);
      expect(AgentsOSEncryption.validateDaytonaApiKey('A1B2C3D4E5F6')).toBe(true);
    });

    it('should reject invalid API key formats', async () => {
      const { AgentsOSEncryption } = await getModule();
      
      expect(AgentsOSEncryption.validateDaytonaApiKey('')).toBe(false);
      expect(AgentsOSEncryption.validateDaytonaApiKey('short')).toBe(false);
      expect(AgentsOSEncryption.validateDaytonaApiKey('invalid@chars!')).toBe(false);
      expect(AgentsOSEncryption.validateDaytonaApiKey('spaces not allowed')).toBe(false);
      expect(AgentsOSEncryption.validateDaytonaApiKey('a'.repeat(201))).toBe(false); // too long
    });

    it('should handle null and undefined inputs', async () => {
      const { AgentsOSEncryption } = await getModule();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(AgentsOSEncryption.validateDaytonaApiKey(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(AgentsOSEncryption.validateDaytonaApiKey(undefined as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(AgentsOSEncryption.validateDaytonaApiKey({} as any)).toBe(false);
    });

    it('should trim whitespace before validation', async () => {
      const { AgentsOSEncryption } = await getModule();
      
      expect(AgentsOSEncryption.validateDaytonaApiKey('  ABC123  ')).toBe(true);
      expect(AgentsOSEncryption.validateDaytonaApiKey('\ttest-key\n')).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should generate secure master secret', async () => {
      const { AgentsOSEncryption } = await getModule();
      const secret = AgentsOSEncryption.generateMasterSecret();
      
      // Should be a base64 string
      expect(secret).toMatch(/^[A-Za-z0-9+/]+=*$/);
      // Should be at least 44 chars (32 bytes in base64)
      expect(secret.length).toBeGreaterThanOrEqual(44);
    });
  });
});

describe('EncryptionHelpers', () => {
  const testUserId = 'user-123';
  const validApiKey = 'test-api-key-123';
  const invalidApiKey = 'invalid@key!';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_SECRET = 'mock-master-secret-32-chars-long!';
  });

  const getModule = async () => {
    // eslint-disable-next-line @next/next/no-assign-module-variable
    const encryptionModule = await import('../encryption');
    return encryptionModule;
  };

  describe('encryptDaytonaApiKey', () => {
    it('should validate and encrypt valid API key', async () => {
      const { EncryptionHelpers } = await getModule();
      
      const result = EncryptionHelpers.encryptDaytonaApiKey(validApiKey, testUserId);
      
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(result.algorithm).toBe('aes-256-gcm');
      expect(result.version).toBe(1);
    });

    it('should throw error for invalid API key', async () => {
      const { EncryptionHelpers } = await getModule();
      
      expect(() => {
        EncryptionHelpers.encryptDaytonaApiKey(invalidApiKey, testUserId);
      }).toThrow('Invalid Daytona API key format');
    });

    it('should trim API key before validation', async () => {
      const { EncryptionHelpers } = await getModule();
      const keyWithSpaces = '  test-api-key-123  ';
      
      const result = EncryptionHelpers.encryptDaytonaApiKey(keyWithSpaces, testUserId);
      
      // Should succeed after trimming
      expect(result).toHaveProperty('value');
    });
  });

  describe('decryptDaytonaApiKey', () => {
    it('should decrypt and validate API key', async () => {
      const { EncryptionHelpers } = await getModule();
      
      // First encrypt
      const encrypted = EncryptionHelpers.encryptDaytonaApiKey(validApiKey, testUserId);
      
      // Then decrypt
      const decrypted = EncryptionHelpers.decryptDaytonaApiKey(encrypted, testUserId);
      
      expect(decrypted).toBe(validApiKey);
    });

    it('should handle decryption of invalid encrypted values', async () => {
      const { EncryptionHelpers } = await getModule();
      
      const invalidEncrypted = {
        value: 'invalid-base64!!!',
        iv: 'invalid-iv',
        tag: 'invalid-tag',
        algorithm: 'aes-256-gcm' as const,
        version: 1
      };
      
      expect(() => {
        EncryptionHelpers.decryptDaytonaApiKey(invalidEncrypted, testUserId);
      }).toThrow();
    });
  });
});

describe('End-to-End Encryption Flow', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_SECRET = 'test-master-secret-32-chars-long!!';
  });

  const getModule = async () => {
    // eslint-disable-next-line @next/next/no-assign-module-variable
    const encryptionModule = await import('../encryption');
    return encryptionModule;
  };

  it('should encrypt and decrypt the same value correctly', async () => {
    const { AgentsOSEncryption } = await getModule();
    const originalValue = 'test-daytona-api-key-12345';
    const userId = 'user-123';

    // Encrypt
    const encrypted = AgentsOSEncryption.encrypt(originalValue, userId);
    
    // Verify encrypted structure
    expect(encrypted).toHaveProperty('value');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('tag');
    expect(encrypted.algorithm).toBe('aes-256-gcm');
    expect(encrypted.version).toBe(1);

    // Decrypt
    const decrypted = AgentsOSEncryption.decrypt(encrypted, userId);
    
    expect(decrypted).toBe(originalValue);
  });

  it('should produce different encrypted values for same input', async () => {
    const { AgentsOSEncryption } = await getModule();
    const value = 'same-value';
    const userId = 'user-123';

    const encrypted1 = AgentsOSEncryption.encrypt(value, userId);
    const encrypted2 = AgentsOSEncryption.encrypt(value, userId);

    // Should be different due to random IV
    expect(encrypted1.value).not.toBe(encrypted2.value);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.tag).not.toBe(encrypted2.tag);

    // But both should decrypt to same value
    expect(AgentsOSEncryption.decrypt(encrypted1, userId)).toBe(value);
    expect(AgentsOSEncryption.decrypt(encrypted2, userId)).toBe(value);
  });

  it('should produce different encrypted values for different users', async () => {
    const { AgentsOSEncryption } = await getModule();
    const value = 'same-api-key';
    const user1 = 'user-123';
    const user2 = 'user-456';

    const encrypted1 = AgentsOSEncryption.encrypt(value, user1);
    const encrypted2 = AgentsOSEncryption.encrypt(value, user2);

    // Should be different
    expect(encrypted1.value).not.toBe(encrypted2.value);

    // Each user can only decrypt their own
    expect(AgentsOSEncryption.decrypt(encrypted1, user1)).toBe(value);
    expect(AgentsOSEncryption.decrypt(encrypted2, user2)).toBe(value);

    // Cross-user decryption should fail
    expect(() => {
      AgentsOSEncryption.decrypt(encrypted1, user2);
    }).toThrow();
  });

  it('should fail authentication with tampered data', async () => {
    const { AgentsOSEncryption } = await getModule();
    const value = 'test-api-key';
    const userId = 'user-123';

    const encrypted = AgentsOSEncryption.encrypt(value, userId);
    
    // Tamper with encrypted value
    const tampered = {
      ...encrypted,
      value: encrypted.value.slice(0, -1) + 'X' // Change last character
    };

    expect(() => {
      AgentsOSEncryption.decrypt(tampered, userId);
    }).toThrow();
  });

  it('should handle encryption with special characters', async () => {
    const { AgentsOSEncryption } = await getModule();
    const specialValue = 'test-api_key.123-ABC';
    const userId = 'user-123';

    const encrypted = AgentsOSEncryption.encrypt(specialValue, userId);
    const decrypted = AgentsOSEncryption.decrypt(encrypted, userId);
    
    expect(decrypted).toBe(specialValue);
  });

  it('should handle very long API keys', async () => {
    const { AgentsOSEncryption } = await getModule();
    const longValue = 'a'.repeat(200); // Max length
    const userId = 'user-123';

    const encrypted = AgentsOSEncryption.encrypt(longValue, userId);
    const decrypted = AgentsOSEncryption.decrypt(encrypted, userId);
    
    expect(decrypted).toBe(longValue);
  });
});