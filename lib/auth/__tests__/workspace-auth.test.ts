import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { DaytonaClient } from '@/lib/daytona';
import type { UserWorkspace } from '@/types/workspace';
import {
  authenticateWorkspaceAccess,
  authenticateWorkspaceAccessWithSandbox,
  WorkspaceAuthError,
  WorkspaceAuthErrorCode
} from '../workspace-auth';

// Mock types for cleaner testing
interface MockSandbox {
  id: string;
  state: string;
  start: ReturnType<typeof vi.fn>;
  getUserRootDir: ReturnType<typeof vi.fn>;
}

// Mock external dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/daytona');

// Mock UserServiceAdmin to prevent Firebase Admin initialization
vi.mock('@/lib/user-service-admin', () => ({
  UserServiceAdmin: {
    getInstance: vi.fn()
  }
}));

const mockAuth = vi.mocked(auth);
const mockUserServiceAdmin = vi.mocked(UserServiceAdmin);
const mockDaytonaClient = vi.mocked(DaytonaClient);

describe('workspace-auth', () => {
  const mockUserId = 'user-123';
  const mockSandboxId = 'sandbox-456';
  const mockApiKey = 'test-api-key';
  const mockRootDir = '/workspace/test-repo';

  const mockUserWorkspace: UserWorkspace = {
    id: 'workspace-123',
    sandboxId: mockSandboxId,
    repositories: [
      {
        id: 'repo-1',
        name: 'test-repo',
        url: 'https://github.com/test/repo',
        sourceType: 'github',
        ports: { vscode: 8080, terminal: 9999, claude: 9998 }
      }
    ],
    status: 'running',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  let mockSandbox: MockSandbox;
  let mockUserService: {
    getUserWorkspace: ReturnType<typeof vi.fn>;
    createOrUpdateWorkspace: ReturnType<typeof vi.fn>;
    updateWorkspaceStatus: ReturnType<typeof vi.fn>;
  };
  let mockDaytonaInstance: {
    getSandbox: ReturnType<typeof vi.fn>;
    manager: unknown;
    creator: unknown;
    orchestrator: unknown;
    createWorkspace: ReturnType<typeof vi.fn>;
    getWorkspaceStatus: ReturnType<typeof vi.fn>;
    listWorkspaces: ReturnType<typeof vi.fn>;
    stopWorkspace: ReturnType<typeof vi.fn>;
    deleteWorkspace: ReturnType<typeof vi.fn>;
    getWorkspaceUrls: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set environment variable
    process.env.DAYTONA_API_KEY = mockApiKey;

    // Mock sandbox
    mockSandbox = {
      id: mockSandboxId,
      state: 'started',
      start: vi.fn().mockResolvedValue(undefined),
      getUserRootDir: vi.fn().mockResolvedValue(mockRootDir)
    };

    // Mock UserService
    mockUserService = {
      getUserWorkspace: vi.fn().mockResolvedValue(mockUserWorkspace),
      createOrUpdateWorkspace: vi.fn(),
      updateWorkspaceStatus: vi.fn()
    };

    // Mock DaytonaClient instance
    mockDaytonaInstance = {
      getSandbox: vi.fn().mockResolvedValue(mockSandbox),
      manager: {},
      creator: {},
      orchestrator: {},
      createWorkspace: vi.fn(),
      getWorkspaceStatus: vi.fn(),
      listWorkspaces: vi.fn(),
      stopWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      getWorkspaceUrls: vi.fn(),
    };

    // Setup mocks (casting due to complex Clerk types)
    (mockAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: mockUserId });
    mockUserServiceAdmin.getInstance.mockReturnValue(mockUserService as unknown as UserServiceAdmin);
    (mockDaytonaClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockDaytonaInstance as unknown as DaytonaClient);
  });

  afterEach(() => {
    delete process.env.DAYTONA_API_KEY;
  });

  describe('authenticateWorkspaceAccess', () => {
    it('should successfully authenticate and return auth result', async () => {
      const result = await authenticateWorkspaceAccess(mockSandboxId);

      expect(result).toEqual({
        userId: mockUserId,
        userWorkspace: mockUserWorkspace,
        daytonaClient: mockDaytonaInstance
      });

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(mockUserService.getUserWorkspace).toHaveBeenCalledWith(mockUserId);
      expect(mockDaytonaClient).toHaveBeenCalledWith(mockApiKey);
    });

    it('should throw UNAUTHORIZED when no userId', async () => {
      (mockAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

      await expect(authenticateWorkspaceAccess(mockSandboxId))
        .rejects
        .toThrow(WorkspaceAuthError);

      try {
        await authenticateWorkspaceAccess(mockSandboxId);
      } catch (error) {
        expect(WorkspaceAuthError.isWorkspaceAuthError(error)).toBe(true);
        if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
          expect(error.code).toBe(WorkspaceAuthErrorCode.UNAUTHORIZED);
          expect(error.statusCode).toBe(401);
        }
      }
    });

    it('should throw MISSING_API_KEY when no API key', async () => {
      delete process.env.DAYTONA_API_KEY;

      await expect(authenticateWorkspaceAccess(mockSandboxId))
        .rejects
        .toThrow(WorkspaceAuthError);

      try {
        await authenticateWorkspaceAccess(mockSandboxId);
      } catch (error) {
        expect(WorkspaceAuthError.isWorkspaceAuthError(error)).toBe(true);
        if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
          expect(error.code).toBe(WorkspaceAuthErrorCode.MISSING_API_KEY);
          expect(error.statusCode).toBe(500);
        }
      }
    });

    it('should throw WORKSPACE_NOT_FOUND when no workspace', async () => {
      mockUserService.getUserWorkspace.mockResolvedValue(null);

      await expect(authenticateWorkspaceAccess(mockSandboxId))
        .rejects
        .toThrow(WorkspaceAuthError);

      try {
        await authenticateWorkspaceAccess(mockSandboxId);
      } catch (error) {
        expect(WorkspaceAuthError.isWorkspaceAuthError(error)).toBe(true);
        if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
          expect(error.code).toBe(WorkspaceAuthErrorCode.WORKSPACE_NOT_FOUND);
          expect(error.statusCode).toBe(404);
        }
      }
    });

    it('should throw ACCESS_DENIED when sandbox ID mismatch', async () => {
      const wrongUserWorkspace = { ...mockUserWorkspace, sandboxId: 'different-sandbox' };
      mockUserService.getUserWorkspace.mockResolvedValue(wrongUserWorkspace);

      await expect(authenticateWorkspaceAccess(mockSandboxId))
        .rejects
        .toThrow(WorkspaceAuthError);

      try {
        await authenticateWorkspaceAccess(mockSandboxId);
      } catch (error) {
        expect(WorkspaceAuthError.isWorkspaceAuthError(error)).toBe(true);
        if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
          expect(error.code).toBe(WorkspaceAuthErrorCode.ACCESS_DENIED);
          expect(error.statusCode).toBe(403);
        }
      }
    });
  });

  describe('authenticateWorkspaceAccessWithSandbox', () => {
    it('should return result with sandbox and rootDir when sandbox has rootDir available', async () => {
      const result = await authenticateWorkspaceAccessWithSandbox(mockSandboxId);

      expect(result).toEqual({
        userId: mockUserId,
        userWorkspace: mockUserWorkspace,
        daytonaClient: mockDaytonaInstance,
        sandbox: mockSandbox,
        rootDir: mockRootDir
      });

      // Should NEVER call sandbox.start() - not auth's responsibility
      expect(mockSandbox.start).not.toHaveBeenCalled();
      expect(mockSandbox.getUserRootDir).toHaveBeenCalledOnce();
      expect(mockDaytonaInstance.getSandbox).toHaveBeenCalledWith(mockSandboxId);
    });

    it('should work regardless of sandbox state', async () => {
      // Test with stopped sandbox - should still work if getUserRootDir succeeds
      mockSandbox.state = 'stopped';
      
      const result = await authenticateWorkspaceAccessWithSandbox(mockSandboxId);

      expect(result).toEqual({
        userId: mockUserId,
        userWorkspace: mockUserWorkspace,
        daytonaClient: mockDaytonaInstance,
        sandbox: mockSandbox,
        rootDir: mockRootDir
      });

      // CRITICAL: Must NEVER start sandbox - that's not auth's job
      expect(mockSandbox.start).not.toHaveBeenCalled();
      expect(mockSandbox.getUserRootDir).toHaveBeenCalledOnce();
    });

    it('should throw error when getUserRootDir returns null', async () => {
      mockSandbox.getUserRootDir.mockResolvedValue(null);

      await expect(authenticateWorkspaceAccessWithSandbox(mockSandboxId))
        .rejects
        .toThrow(WorkspaceAuthError);

      try {
        await authenticateWorkspaceAccessWithSandbox(mockSandboxId);
      } catch (error) {
        expect(WorkspaceAuthError.isWorkspaceAuthError(error)).toBe(true);
        if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
          expect(error.code).toBe(WorkspaceAuthErrorCode.INTERNAL_ERROR);
          expect(error.statusCode).toBe(500);
          expect(error.message).toBe('Unable to get sandbox root directory - sandbox may not be started');
        }
      }
    });

    it('should throw error when getUserRootDir returns undefined', async () => {
      mockSandbox.getUserRootDir.mockResolvedValue(undefined);

      await expect(authenticateWorkspaceAccessWithSandbox(mockSandboxId))
        .rejects
        .toThrow(WorkspaceAuthError);

      try {
        await authenticateWorkspaceAccessWithSandbox(mockSandboxId);
      } catch (error) {
        expect(WorkspaceAuthError.isWorkspaceAuthError(error)).toBe(true);
        if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
          expect(error.code).toBe(WorkspaceAuthErrorCode.INTERNAL_ERROR);
          expect(error.statusCode).toBe(500);
        }
      }
    });

    it('should inherit all authentication errors from base function', async () => {
      (mockAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

      await expect(authenticateWorkspaceAccessWithSandbox(mockSandboxId))
        .rejects
        .toThrow(WorkspaceAuthError);

      try {
        await authenticateWorkspaceAccessWithSandbox(mockSandboxId);
      } catch (error) {
        expect(WorkspaceAuthError.isWorkspaceAuthError(error)).toBe(true);
        if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
          expect(error.code).toBe(WorkspaceAuthErrorCode.UNAUTHORIZED);
        }
      }
    });
  });

  describe('WorkspaceAuthError', () => {
    it('should correctly identify WorkspaceAuthError instances', () => {
      const authError = new WorkspaceAuthError('Test', 400, WorkspaceAuthErrorCode.UNAUTHORIZED);
      const regularError = new Error('Regular error');
      const randomObject = { name: 'WorkspaceAuthError' };

      expect(WorkspaceAuthError.isWorkspaceAuthError(authError)).toBe(true);
      expect(WorkspaceAuthError.isWorkspaceAuthError(regularError)).toBe(false);
      expect(WorkspaceAuthError.isWorkspaceAuthError(randomObject)).toBe(false);
      expect(WorkspaceAuthError.isWorkspaceAuthError(null)).toBe(false);
      expect(WorkspaceAuthError.isWorkspaceAuthError(undefined)).toBe(false);
    });

    it('should have correct properties', () => {
      const error = new WorkspaceAuthError('Test message', 401, WorkspaceAuthErrorCode.UNAUTHORIZED);

      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(WorkspaceAuthErrorCode.UNAUTHORIZED);
      expect(error.name).toBe('WorkspaceAuthError');
    });
  });

  describe('Critical Behavior Verification', () => {
    /**
     * CRITICAL TEST: This test ensures authenticateWorkspaceAccessWithSandbox
     * provides proper authentication and sandbox access WITHOUT auto-starting
     * 
     * If this test fails, it means we've introduced a regression that could break
     * existing functionality that depends on the auth behavior.
     */
    it('should provide complete auth result without auto-starting sandbox', async () => {
      const result = await authenticateWorkspaceAccessWithSandbox(mockSandboxId);

      // Verify all critical behaviors:
      
      // 1. Must authenticate user
      expect(mockAuth).toHaveBeenCalledOnce();
      
      // 2. Must get user workspace from Firebase
      expect(mockUserService.getUserWorkspace).toHaveBeenCalledWith(mockUserId);
      
      // 3. Must create DaytonaClient with API key
      expect(mockDaytonaClient).toHaveBeenCalledWith(mockApiKey);
      
      // 4. Must get sandbox
      expect(mockDaytonaInstance.getSandbox).toHaveBeenCalledWith(mockSandboxId);
      
      // 5. CRITICAL: Must NEVER start sandbox - that's for explicit start operations only
      expect(mockSandbox.start).not.toHaveBeenCalled();
      
      // 6. CRITICAL: Must call getUserRootDir() for actual root directory
      expect(mockSandbox.getUserRootDir).toHaveBeenCalledOnce();
      
      // 7. Must return all required properties
      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('userWorkspace', mockUserWorkspace);
      expect(result).toHaveProperty('daytonaClient', mockDaytonaInstance);
      expect(result).toHaveProperty('sandbox', mockSandbox);
      expect(result).toHaveProperty('rootDir', mockRootDir);
    });
  });
});