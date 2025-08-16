/**
 * Unit tests for DaytonaClient environment file operations
 * Tests the delegation to WorkspaceManager methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DaytonaClient } from './daytona';
import { WorkspaceManager } from './workspace-manager';

// Mock WorkspaceManager
vi.mock('./workspace-manager', () => ({
  WorkspaceManager: vi.fn()
}));

describe('DaytonaClient Environment File Operations', () => {
  let daytonaClient: DaytonaClient;
  let mockWorkspaceManager: {
    readEnvFile: ReturnType<typeof vi.fn>;
    writeEnvFile: ReturnType<typeof vi.fn>;
    getWorkspaceStatus: ReturnType<typeof vi.fn>;
    listWorkspaces: ReturnType<typeof vi.fn>;
    stopWorkspace: ReturnType<typeof vi.fn>;
    deleteWorkspace: ReturnType<typeof vi.fn>;
    getSandbox: ReturnType<typeof vi.fn>;
    createSandbox: ReturnType<typeof vi.fn>;
    getWorkspaceUrls: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockWorkspaceManager = {
      readEnvFile: vi.fn(),
      writeEnvFile: vi.fn(),
      // Other methods that might be called
      getWorkspaceStatus: vi.fn(),
      listWorkspaces: vi.fn(),
      stopWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      getSandbox: vi.fn(),
      createSandbox: vi.fn(),
      getWorkspaceUrls: vi.fn()
    };

    (WorkspaceManager as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockWorkspaceManager);
    
    daytonaClient = new DaytonaClient('test-api-key');
  });

  describe('readEnvFile', () => {
    it('should delegate to WorkspaceManager with correct parameters', async () => {
      const expectedResult = 'KEY1=value1\nKEY2=value2';
      mockWorkspaceManager.readEnvFile.mockResolvedValue(expectedResult);

      const result = await daytonaClient.readEnvFile('sandbox-id', 'project-name');

      expect(mockWorkspaceManager.readEnvFile).toHaveBeenCalledWith('sandbox-id', 'project-name');
      expect(result).toBe(expectedResult);
    });

    it('should delegate to WorkspaceManager without projectName', async () => {
      const expectedResult = 'KEY1=value1\nKEY2=value2';
      mockWorkspaceManager.readEnvFile.mockResolvedValue(expectedResult);

      const result = await daytonaClient.readEnvFile('sandbox-id');

      expect(mockWorkspaceManager.readEnvFile).toHaveBeenCalledWith('sandbox-id', undefined);
      expect(result).toBe(expectedResult);
    });

    it('should return null when file does not exist', async () => {
      mockWorkspaceManager.readEnvFile.mockResolvedValue(null);

      const result = await daytonaClient.readEnvFile('sandbox-id', 'project-name');

      expect(mockWorkspaceManager.readEnvFile).toHaveBeenCalledWith('sandbox-id', 'project-name');
      expect(result).toBeNull();
    });

    it('should propagate errors from WorkspaceManager', async () => {
      const error = new Error('Failed to read file');
      mockWorkspaceManager.readEnvFile.mockRejectedValue(error);

      await expect(daytonaClient.readEnvFile('sandbox-id', 'project-name')).rejects.toThrow('Failed to read file');
      expect(mockWorkspaceManager.readEnvFile).toHaveBeenCalledWith('sandbox-id', 'project-name');
    });
  });

  describe('writeEnvFile', () => {
    it('should delegate to WorkspaceManager with all parameters', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockWorkspaceManager.writeEnvFile.mockResolvedValue(undefined);

      await daytonaClient.writeEnvFile('sandbox-id', content, true, 'project-name');

      expect(mockWorkspaceManager.writeEnvFile).toHaveBeenCalledWith(
        'sandbox-id',
        content,
        true,
        'project-name'
      );
    });

    it('should delegate to WorkspaceManager with default createBackup', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockWorkspaceManager.writeEnvFile.mockResolvedValue(undefined);

      await daytonaClient.writeEnvFile('sandbox-id', content);

      expect(mockWorkspaceManager.writeEnvFile).toHaveBeenCalledWith(
        'sandbox-id',
        content,
        true,
        undefined
      );
    });

    it('should delegate to WorkspaceManager with createBackup false', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockWorkspaceManager.writeEnvFile.mockResolvedValue(undefined);

      await daytonaClient.writeEnvFile('sandbox-id', content, false, 'project-name');

      expect(mockWorkspaceManager.writeEnvFile).toHaveBeenCalledWith(
        'sandbox-id',
        content,
        false,
        'project-name'
      );
    });

    it('should propagate errors from WorkspaceManager', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      const error = new Error('Failed to write file');
      mockWorkspaceManager.writeEnvFile.mockRejectedValue(error);

      await expect(daytonaClient.writeEnvFile('sandbox-id', content, true, 'project-name')).rejects.toThrow('Failed to write file');
      expect(mockWorkspaceManager.writeEnvFile).toHaveBeenCalledWith(
        'sandbox-id',
        content,
        true,
        'project-name'
      );
    });
  });

  describe('Constructor', () => {
    it('should create WorkspaceManager with provided API key', () => {
      const apiKey = 'test-api-key-123';
      new DaytonaClient(apiKey);

      expect(WorkspaceManager).toHaveBeenCalledWith(apiKey);
    });
  });
});