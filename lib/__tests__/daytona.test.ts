/**
 * Unit tests for DaytonaClient
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DaytonaClient } from '../daytona';
import { WorkspaceManager } from '../workspace-manager';
import { WorkspaceCreator } from '../workspace-creator';
import { SandboxState } from '@daytonaio/api-client';
import type { CreateWorkspaceResponse } from '@/types/workspace';

// Mock dependencies
vi.mock('../workspace-manager');
vi.mock('../workspace-creator');

describe('DaytonaClient', () => {
  let daytonaClient: DaytonaClient;
  let mockWorkspaceManager: {
    getWorkspaceStatus: ReturnType<typeof vi.fn>;
    listWorkspaces: ReturnType<typeof vi.fn>;
    stopWorkspace: ReturnType<typeof vi.fn>;
    deleteWorkspace: ReturnType<typeof vi.fn>;
    getSandbox: ReturnType<typeof vi.fn>;
  };
  let mockWorkspaceCreator: {
    createWorkspace: ReturnType<typeof vi.fn>;
  };
  const apiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup WorkspaceManager mock
    mockWorkspaceManager = {
      getWorkspaceStatus: vi.fn(),
      listWorkspaces: vi.fn(),
      stopWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      getSandbox: vi.fn(),
    };
    (WorkspaceManager as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockWorkspaceManager);

    // Setup WorkspaceCreator mock
    mockWorkspaceCreator = {
      createWorkspace: vi.fn(),
    };
    (WorkspaceCreator as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockWorkspaceCreator);

    daytonaClient = new DaytonaClient(apiKey);
  });

  describe('constructor', () => {
    it('initializes WorkspaceManager and WorkspaceCreator with API key', () => {
      expect(WorkspaceManager).toHaveBeenCalledWith(apiKey);
      expect(WorkspaceCreator).toHaveBeenCalledWith(apiKey);
    });
  });

  describe('createWorkspace', () => {
    it('delegates to WorkspaceCreator', async () => {
      const options = {
        repositories: [{
          id: 'repo-1',
          name: 'test-repo',
          url: 'https://github.com/test/repo',
          description: 'Test repository',
          sourceType: 'github' as const,
          ports: { vscode: 8080, terminal: 10000, claude: 4000 },
        }],
        workspaceName: 'test-workspace',
        resources: { cpu: 2, memory: 4096, disk: 20480 },
      };

      const mockRepositoryWithUrls = {
        name: 'test-repo',
        url: 'https://github.com/test/repo',
        description: 'Test repository',
        urls: {
          vscode: 'https://vscode.example.com',
          terminal: 'https://terminal.example.com',
          claude: 'https://claude.example.com',
        },
      };

      const mockResponse: CreateWorkspaceResponse = {
        sandboxId: 'sandbox-123',
        repositories: [mockRepositoryWithUrls],
        message: 'Workspace created successfully',
      };

      mockWorkspaceCreator.createWorkspace.mockResolvedValue(mockResponse);

      const result = await daytonaClient.createWorkspace(options);

      expect(mockWorkspaceCreator.createWorkspace).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockResponse);
    });

    it('creates workspace with default options', async () => {
      const mockResponse: CreateWorkspaceResponse = {
        sandboxId: 'sandbox-123',
        repositories: [],
        message: 'Workspace created successfully',
      };

      mockWorkspaceCreator.createWorkspace.mockResolvedValue(mockResponse);

      const result = await daytonaClient.createWorkspace();

      expect(mockWorkspaceCreator.createWorkspace).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getWorkspaceStatus', () => {
    it('delegates to WorkspaceManager', async () => {
      const mockStatus = {
        status: 'started' as const,
        servicesHealthy: true,
        message: 'All services running',
      };

      mockWorkspaceManager.getWorkspaceStatus.mockResolvedValue(mockStatus);

      const result = await daytonaClient.getWorkspaceStatus('sandbox-123');

      expect(mockWorkspaceManager.getWorkspaceStatus).toHaveBeenCalledWith('sandbox-123');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('listWorkspaces', () => {
    it('delegates to WorkspaceManager without labels', async () => {
      const mockWorkspaces = [
        { id: 'sandbox-1', state: SandboxState.STARTED },
        { id: 'sandbox-2', state: SandboxState.STOPPED },
      ];

      mockWorkspaceManager.listWorkspaces.mockResolvedValue(mockWorkspaces);

      const result = await daytonaClient.listWorkspaces();

      expect(mockWorkspaceManager.listWorkspaces).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockWorkspaces);
    });

    it('delegates to WorkspaceManager with labels', async () => {
      const labels = { team: 'development', env: 'staging' };
      const mockWorkspaces = [
        { id: 'sandbox-1', state: SandboxState.STARTED },
      ];

      mockWorkspaceManager.listWorkspaces.mockResolvedValue(mockWorkspaces);

      const result = await daytonaClient.listWorkspaces(labels);

      expect(mockWorkspaceManager.listWorkspaces).toHaveBeenCalledWith(labels);
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('stopWorkspace', () => {
    it('delegates to WorkspaceManager', async () => {
      mockWorkspaceManager.stopWorkspace.mockResolvedValue(undefined);

      await daytonaClient.stopWorkspace('sandbox-123');

      expect(mockWorkspaceManager.stopWorkspace).toHaveBeenCalledWith('sandbox-123');
    });
  });

  describe('deleteWorkspace', () => {
    it('delegates to WorkspaceManager', async () => {
      mockWorkspaceManager.deleteWorkspace.mockResolvedValue(undefined);

      await daytonaClient.deleteWorkspace('sandbox-123');

      expect(mockWorkspaceManager.deleteWorkspace).toHaveBeenCalledWith('sandbox-123');
    });
  });

  describe('getSandbox', () => {
    it('delegates to WorkspaceManager', async () => {
      const mockSandbox = {
        id: 'sandbox-123',
        state: SandboxState.STARTED,
        createdAt: '2023-01-01T00:00:00Z',
      };

      mockWorkspaceManager.getSandbox.mockResolvedValue(mockSandbox);

      const result = await daytonaClient.getSandbox('sandbox-123');

      expect(mockWorkspaceManager.getSandbox).toHaveBeenCalledWith('sandbox-123');
      expect(result).toEqual(mockSandbox);
    });
  });

  describe('error handling', () => {
    it('propagates errors from WorkspaceManager', async () => {
      const error = new Error('Workspace not found');
      mockWorkspaceManager.getWorkspaceStatus.mockRejectedValue(error);

      await expect(daytonaClient.getWorkspaceStatus('invalid-id')).rejects.toThrow(
        'Workspace not found'
      );
    });

    it('propagates errors from WorkspaceCreator', async () => {
      const error = new Error('Creation failed');
      mockWorkspaceCreator.createWorkspace.mockRejectedValue(error);

      await expect(daytonaClient.createWorkspace()).rejects.toThrow('Creation failed');
    });
  });

  describe('facade pattern', () => {
    it('provides a clean interface to workspace operations', () => {
      // Test that DaytonaClient exposes all expected methods
      const methods = [
        'createWorkspace',
        'getWorkspaceStatus',
        'listWorkspaces',
        'stopWorkspace',
        'deleteWorkspace',
        'getSandbox',
      ];

      methods.forEach(method => {
        expect(typeof daytonaClient[method as keyof DaytonaClient]).toBe('function');
      });
    });

    it('separates creation concerns from management concerns', () => {
      // Verify the facade properly delegates creation vs management operations
      expect(WorkspaceManager).toHaveBeenCalledTimes(1);
      expect(WorkspaceCreator).toHaveBeenCalledTimes(1);
    });
  });
});