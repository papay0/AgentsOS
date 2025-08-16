import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EncryptedValue } from '../encryption';

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  default: {
    apps: [],
    credential: {
      cert: vi.fn()
    },
    initializeApp: vi.fn(),
    firestore: vi.fn(() => ({
      collection: vi.fn()
    }))
  }
}));

// Mock the encryption module
vi.mock('../encryption', () => ({
  EncryptionHelpers: {
    encryptDaytonaApiKey: vi.fn(),
    decryptDaytonaApiKey: vi.fn()
  }
}));

describe('UserServiceAdmin - Environment Management', () => {
  const testUserId = 'user-123';
  const testApiKey = 'test-daytona-api-key';
  const mockEncryptedValue: EncryptedValue = {
    value: 'encrypted-value',
    iv: 'initialization-vector',
    tag: 'auth-tag',
    algorithm: 'aes-256-gcm',
    version: 1
  };

  // Mock Firestore methods
  const mockDocRef = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn()
  };

  const mockCollectionRef = {
    doc: vi.fn(() => mockDocRef)
  };

  const mockFirestore = {
    collection: vi.fn(() => mockCollectionRef)
  };

  // Mock timestamp
  const mockTimestamp = {
    now: vi.fn(() => ({ toDate: () => new Date('2024-01-01T00:00:00Z') }))
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Silence console.error during tests to keep output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup Firebase Admin mock
    const firebaseAdmin = await import('firebase-admin');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (firebaseAdmin.default as any).apps = [{ name: 'test' }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    firebaseAdmin.default.firestore = vi.fn(() => mockFirestore) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (firebaseAdmin.default.firestore as any).Timestamp = mockTimestamp;
    
    // Setup encryption mock
    const { EncryptionHelpers } = await import('../encryption');
    vi.mocked(EncryptionHelpers.encryptDaytonaApiKey).mockReturnValue(mockEncryptedValue);
    vi.mocked(EncryptionHelpers.decryptDaytonaApiKey).mockReturnValue(testApiKey);
    
    // Reset mock implementations
    mockDocRef.get.mockResolvedValue({ exists: false });
    mockDocRef.set.mockResolvedValue(undefined);
    mockDocRef.update.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Import the module after mocks are set up
  const getUserServiceAdmin = async () => {
    vi.resetModules();
    const userServiceModule = await import('../user-service-admin');
    return userServiceModule.UserServiceAdmin.getInstance();
  };

  describe('storeDaytonaApiKey', () => {
    it('should create new environment document when none exists', async () => {
      mockDocRef.get.mockResolvedValue({ exists: false });
      const { EncryptionHelpers } = await import('../encryption');
      
      const userService = await getUserServiceAdmin();
      await userService.storeDaytonaApiKey(testUserId, testApiKey);

      expect(mockFirestore.collection).toHaveBeenCalledWith('environments');
      expect(mockCollectionRef.doc).toHaveBeenCalledWith(testUserId);
      expect(EncryptionHelpers.encryptDaytonaApiKey).toHaveBeenCalledWith(testApiKey, testUserId);
      
      expect(mockDocRef.set).toHaveBeenCalledWith({
        userId: testUserId,
        daytonaApiKey: mockEncryptedValue,
        projects: {},
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      });
    });

    it('should update existing environment document', async () => {
      mockDocRef.get.mockResolvedValue({ exists: true });

      const userService = await getUserServiceAdmin();
      await userService.storeDaytonaApiKey(testUserId, testApiKey);

      expect(mockDocRef.update).toHaveBeenCalledWith({
        daytonaApiKey: mockEncryptedValue,
        updatedAt: expect.any(Object)
      });
    });

    it('should handle encryption errors', async () => {
      const { EncryptionHelpers } = await import('../encryption');
      vi.mocked(EncryptionHelpers.encryptDaytonaApiKey).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const userService = await getUserServiceAdmin();
      await expect(userService.storeDaytonaApiKey(testUserId, testApiKey))
        .rejects
        .toThrow('Failed to store Daytona API key');
    });

    it('should handle Firebase errors', async () => {
      mockDocRef.get.mockRejectedValue(new Error('Firebase error'));

      const userService = await getUserServiceAdmin();
      await expect(userService.storeDaytonaApiKey(testUserId, testApiKey))
        .rejects
        .toThrow('Failed to store Daytona API key');
    });
  });

  describe('getDaytonaApiKey', () => {
    it('should retrieve and decrypt API key when document exists', async () => {
      const mockDocData = {
        userId: testUserId,
        daytonaApiKey: mockEncryptedValue,
        projects: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => mockDocData
      });

      const { EncryptionHelpers } = await import('../encryption');
      const userService = await getUserServiceAdmin();
      const result = await userService.getDaytonaApiKey(testUserId);

      expect(mockFirestore.collection).toHaveBeenCalledWith('environments');
      expect(mockCollectionRef.doc).toHaveBeenCalledWith(testUserId);
      expect(EncryptionHelpers.decryptDaytonaApiKey).toHaveBeenCalledWith(mockEncryptedValue, testUserId);
      expect(result).toBe(testApiKey);
    });

    it('should return null when document does not exist', async () => {
      mockDocRef.get.mockResolvedValue({ exists: false });

      const { EncryptionHelpers } = await import('../encryption');
      const userService = await getUserServiceAdmin();
      const result = await userService.getDaytonaApiKey(testUserId);

      expect(result).toBeNull();
      expect(EncryptionHelpers.decryptDaytonaApiKey).not.toHaveBeenCalled();
    });

    it('should return null when document exists but no API key', async () => {
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ userId: testUserId, projects: {} })
      });

      const userService = await getUserServiceAdmin();
      const result = await userService.getDaytonaApiKey(testUserId);

      expect(result).toBeNull();
    });

    it('should handle decryption errors', async () => {
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ daytonaApiKey: mockEncryptedValue })
      });

      const { EncryptionHelpers } = await import('../encryption');
      vi.mocked(EncryptionHelpers.decryptDaytonaApiKey).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const userService = await getUserServiceAdmin();
      await expect(userService.getDaytonaApiKey(testUserId))
        .rejects
        .toThrow('Failed to retrieve Daytona API key');
    });

    it('should handle Firebase errors', async () => {
      mockDocRef.get.mockRejectedValue(new Error('Firebase error'));

      const userService = await getUserServiceAdmin();
      await expect(userService.getDaytonaApiKey(testUserId))
        .rejects
        .toThrow('Failed to retrieve Daytona API key');
    });
  });

  describe('storeProjectEnvVar', () => {
    const projectName = 'test-project';
    const envKey = 'API_KEY';
    const envValue = 'secret-value';

    it('should store encrypted environment variable for project', async () => {
      const { EncryptionHelpers } = await import('../encryption');
      const userService = await getUserServiceAdmin();
      
      await userService.storeProjectEnvVar(testUserId, projectName, envKey, envValue);

      expect(EncryptionHelpers.encryptDaytonaApiKey).toHaveBeenCalledWith(envValue, testUserId);
      expect(mockDocRef.set).toHaveBeenCalledWith({
        [`projects.${projectName}.${envKey}`]: mockEncryptedValue,
        updatedAt: expect.any(Object)
      }, { merge: true });
    });

    it('should handle encryption errors', async () => {
      const { EncryptionHelpers } = await import('../encryption');
      vi.mocked(EncryptionHelpers.encryptDaytonaApiKey).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const userService = await getUserServiceAdmin();
      await expect(userService.storeProjectEnvVar(testUserId, projectName, envKey, envValue))
        .rejects
        .toThrow('Failed to store project environment variable');
    });

    it('should handle Firebase errors', async () => {
      mockDocRef.set.mockRejectedValue(new Error('Firebase error'));

      const userService = await getUserServiceAdmin();
      await expect(userService.storeProjectEnvVar(testUserId, projectName, envKey, envValue))
        .rejects
        .toThrow('Failed to store project environment variable');
    });

    it('should handle special characters in project name and env key', async () => {
      const specialProjectName = 'my-awesome-project_v2';
      const specialEnvKey = 'DATABASE_URL_V2';

      const userService = await getUserServiceAdmin();
      await userService.storeProjectEnvVar(testUserId, specialProjectName, specialEnvKey, envValue);

      expect(mockDocRef.set).toHaveBeenCalledWith({
        [`projects.${specialProjectName}.${specialEnvKey}`]: mockEncryptedValue,
        updatedAt: expect.any(Object)
      }, { merge: true });
    });
  });

  describe('getProjectEnvVars', () => {
    const projectName = 'test-project';

    it('should retrieve and decrypt all environment variables for project', async () => {
      const mockProjectEnvs = {
        'API_KEY': mockEncryptedValue,
        'DATABASE_URL': { ...mockEncryptedValue, value: 'different-encrypted-value' }
      };

      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: testUserId,
          projects: {
            [projectName]: mockProjectEnvs
          }
        })
      });

      const { EncryptionHelpers } = await import('../encryption');
      vi.mocked(EncryptionHelpers.decryptDaytonaApiKey)
        .mockReturnValueOnce('api-key-value')
        .mockReturnValueOnce('database-url-value');

      const userService = await getUserServiceAdmin();
      const result = await userService.getProjectEnvVars(testUserId, projectName);

      expect(result).toEqual({
        'API_KEY': 'api-key-value',
        'DATABASE_URL': 'database-url-value'
      });

      expect(EncryptionHelpers.decryptDaytonaApiKey).toHaveBeenCalledTimes(2);
    });

    it('should return empty object when document does not exist', async () => {
      mockDocRef.get.mockResolvedValue({ exists: false });

      const userService = await getUserServiceAdmin();
      const result = await userService.getProjectEnvVars(testUserId, projectName);

      expect(result).toEqual({});
    });

    it('should return empty object when project does not exist', async () => {
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: testUserId,
          projects: {}
        })
      });

      const userService = await getUserServiceAdmin();
      const result = await userService.getProjectEnvVars(testUserId, projectName);

      expect(result).toEqual({});
    });

    it('should skip variables that fail to decrypt', async () => {
      const mockProjectEnvs = {
        'VALID_KEY': mockEncryptedValue,
        'INVALID_KEY': { ...mockEncryptedValue, value: 'corrupted' }
      };

      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          projects: { [projectName]: mockProjectEnvs }
        })
      });

      const { EncryptionHelpers } = await import('../encryption');
      vi.mocked(EncryptionHelpers.decryptDaytonaApiKey)
        .mockReturnValueOnce('valid-value')
        .mockImplementationOnce(() => { throw new Error('Decryption failed'); });

      const userService = await getUserServiceAdmin();
      const result = await userService.getProjectEnvVars(testUserId, projectName);

      expect(result).toEqual({
        'VALID_KEY': 'valid-value'
      });
    });

    it('should handle Firebase errors', async () => {
      mockDocRef.get.mockRejectedValue(new Error('Firebase error'));

      const userService = await getUserServiceAdmin();
      await expect(userService.getProjectEnvVars(testUserId, projectName))
        .rejects
        .toThrow('Failed to retrieve project environment variables');
    });
  });

  describe('getUserEnvironment', () => {
    it('should return user environment document when it exists', async () => {
      const mockEnvData = {
        userId: testUserId,
        daytonaApiKey: mockEncryptedValue,
        projects: {
          'project1': {
            'API_KEY': mockEncryptedValue
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => mockEnvData
      });

      const userService = await getUserServiceAdmin();
      const result = await userService.getUserEnvironment(testUserId);

      expect(result).toEqual(mockEnvData);
      expect(mockFirestore.collection).toHaveBeenCalledWith('environments');
      expect(mockCollectionRef.doc).toHaveBeenCalledWith(testUserId);
    });

    it('should return null when document does not exist', async () => {
      mockDocRef.get.mockResolvedValue({ exists: false });

      const userService = await getUserServiceAdmin();
      const result = await userService.getUserEnvironment(testUserId);

      expect(result).toBeNull();
    });

    it('should handle Firebase errors', async () => {
      mockDocRef.get.mockRejectedValue(new Error('Firebase error'));

      const userService = await getUserServiceAdmin();
      await expect(userService.getUserEnvironment(testUserId))
        .rejects
        .toThrow('Failed to retrieve user environment');
    });
  });

  describe('Integration Tests', () => {
    it('should maintain data consistency across operations', async () => {
      const projectName = 'integration-test-project';
      const envKey = 'TEST_API_KEY';
      const envValue = 'test-value-123';

      // Mock document doesn't exist initially
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      const userService = await getUserServiceAdmin();
      
      // Store API key (creates document)
      await userService.storeDaytonaApiKey(testUserId, testApiKey);

      // Store project env var
      await userService.storeProjectEnvVar(testUserId, projectName, envKey, envValue);

      // Mock document exists with both API key and project env
      const mockCompleteEnvData = {
        userId: testUserId,
        daytonaApiKey: mockEncryptedValue,
        projects: {
          [projectName]: {
            [envKey]: mockEncryptedValue
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => mockCompleteEnvData
      });

      // Verify all data is accessible
      const retrievedApiKey = await userService.getDaytonaApiKey(testUserId);
      const projectEnvs = await userService.getProjectEnvVars(testUserId, projectName);
      const fullEnv = await userService.getUserEnvironment(testUserId);

      expect(retrievedApiKey).toBe(testApiKey);
      expect(projectEnvs[envKey]).toBe(testApiKey); // Uses same mock return value
      expect(fullEnv).toEqual(mockCompleteEnvData);
    });

    it('should handle sequential operations correctly', async () => {
      const userService = await getUserServiceAdmin();
      
      // Reset mocks and ensure they succeed
      vi.clearAllMocks();
      mockDocRef.get.mockResolvedValue({ exists: false });
      mockDocRef.set.mockResolvedValue(undefined);
      mockDocRef.update.mockResolvedValue(undefined);
      
      // Ensure encryption mocks are working
      const { EncryptionHelpers } = await import('../encryption');
      vi.mocked(EncryptionHelpers.encryptDaytonaApiKey).mockReturnValue(mockEncryptedValue);
      
      // Test sequential operations
      await userService.storeDaytonaApiKey(testUserId, 'test-key-123');
      await userService.storeProjectEnvVar(testUserId, 'project1', 'KEY1', 'value1');
      await userService.storeProjectEnvVar(testUserId, 'project2', 'KEY2', 'value2');

      // Verify Firebase operations were called
      expect(mockDocRef.set.mock.calls.length + mockDocRef.update.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project names', async () => {
      const userService = await getUserServiceAdmin();
      
      await expect(userService.storeProjectEnvVar(testUserId, '', 'KEY', 'value'))
        .resolves
        .not.toThrow();

      expect(mockDocRef.set).toHaveBeenCalledWith({
        'projects..KEY': mockEncryptedValue,
        updatedAt: expect.any(Object)
      }, { merge: true });
    });

    it('should handle empty environment keys', async () => {
      const userService = await getUserServiceAdmin();
      
      await expect(userService.storeProjectEnvVar(testUserId, 'project', '', 'value'))
        .resolves
        .not.toThrow();

      expect(mockDocRef.set).toHaveBeenCalledWith({
        'projects.project.': mockEncryptedValue,
        updatedAt: expect.any(Object)
      }, { merge: true });
    });

    it('should handle empty environment values', async () => {
      const { EncryptionHelpers } = await import('../encryption');
      const userService = await getUserServiceAdmin();
      
      await expect(userService.storeProjectEnvVar(testUserId, 'project', 'KEY', ''))
        .resolves
        .not.toThrow();

      expect(EncryptionHelpers.encryptDaytonaApiKey).toHaveBeenCalledWith('', testUserId);
    });

    it('should handle very long values', async () => {
      const { EncryptionHelpers } = await import('../encryption');
      const longValue = 'x'.repeat(10000);
      const userService = await getUserServiceAdmin();

      await expect(userService.storeProjectEnvVar(testUserId, 'project', 'LONG_KEY', longValue))
        .resolves
        .not.toThrow();

      expect(EncryptionHelpers.encryptDaytonaApiKey).toHaveBeenCalledWith(longValue, testUserId);
    });
  });
});