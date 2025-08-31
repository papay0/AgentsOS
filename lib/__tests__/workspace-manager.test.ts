/**
 * Unit tests for WorkspaceManager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceManager } from '../workspace-manager';
import { Daytona } from '@daytonaio/sdk';
import { SandboxState } from '@daytonaio/api-client';
import { PortManager } from '../port-manager';

// Mock dependencies
vi.mock('@daytonaio/sdk');
vi.mock('../logger', () => ({
  logger: {
    workspace: {
      checking: vi.fn(),
      starting: vi.fn(),
    },
    debug: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    logError: vi.fn(),
  },
}));

vi.mock('../port-manager');

describe('WorkspaceManager', () => {
  let workspaceManager: WorkspaceManager;
  let mockDaytona: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let mockSandbox: {
    id: string;
    state: string;
    createdAt: string;
    getUserRootDir: ReturnType<typeof vi.fn>;
    process: {
      executeCommand: ReturnType<typeof vi.fn>;
    };
    getPreviewLink: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  const apiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Sandbox
    mockSandbox = {
      id: 'sandbox-123',
      state: SandboxState.STARTED,
      createdAt: '2023-01-01T00:00:00Z',
      getUserRootDir: vi.fn().mockResolvedValue('/home/user'),
      process: {
        executeCommand: vi.fn().mockResolvedValue({
          exitCode: 0,
          result: 'Success',
        }),
      },
      getPreviewLink: vi.fn().mockResolvedValue({ url: 'https://example.com' }),
      stop: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    // Setup mock Daytona
    mockDaytona = {
      get: vi.fn().mockResolvedValue(mockSandbox),
      list: vi.fn().mockResolvedValue([mockSandbox]),
      create: vi.fn().mockResolvedValue(mockSandbox),
    };
    (Daytona as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockDaytona);

    // Setup PortManager mock
    (PortManager.getPortsForSlot as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      vscode: 8080,
      terminal: 10000,
      claude: 4000,
    });

    workspaceManager = new WorkspaceManager(apiKey);
  });

  describe('constructor', () => {
    it('initializes with Daytona client', () => {
      expect(Daytona).toHaveBeenCalledWith({ apiKey });
    });
  });

  describe('getWorkspaceStatus', () => {
    it('returns healthy status when sandbox is started and services are running', async () => {
      mockSandbox.process.executeCommand.mockResolvedValue({
        result: '200\n200\n200',
      });

      const result = await workspaceManager.getWorkspaceStatus('sandbox-123');

      expect(result).toEqual({
        status: 'started',
        servicesHealthy: true,
        message: 'All services running',
      });
    });

    it('returns unhealthy status when services are not responding', async () => {
      mockSandbox.process.executeCommand.mockResolvedValue({
        result: '404\n500\n503',
      });

      const result = await workspaceManager.getWorkspaceStatus('sandbox-123');

      expect(result).toEqual({
        status: 'started',
        servicesHealthy: false,
        message: 'Services need restart',
      });
    });

    it('returns stopped status when sandbox is not started', async () => {
      const stoppedSandbox = { ...mockSandbox, state: SandboxState.STOPPED };
      mockDaytona.get.mockResolvedValue(stoppedSandbox);

      const result = await workspaceManager.getWorkspaceStatus('sandbox-123');

      expect(result).toEqual({
        status: 'stopped',
        servicesHealthy: false,
        message: 'Container is stopped',
      });
    });

    it('handles service check errors gracefully', async () => {
      mockSandbox.process.executeCommand.mockRejectedValue(new Error('Service check failed'));

      const result = await workspaceManager.getWorkspaceStatus('sandbox-123');

      expect(result).toEqual({
        status: 'started',
        servicesHealthy: false,
        message: 'Services not responding',
      });
    });

    it('handles sandbox fetch errors', async () => {
      mockDaytona.get.mockRejectedValue(new Error('Sandbox not found'));

      const result = await workspaceManager.getWorkspaceStatus('sandbox-123');

      expect(result).toEqual({
        status: 'error',
        servicesHealthy: false,
        message: 'Error: Sandbox not found',
      });
    });

    it('handles missing root directory', async () => {
      mockSandbox.getUserRootDir.mockResolvedValue(null);

      const result = await workspaceManager.getWorkspaceStatus('sandbox-123');

      expect(result).toEqual({
        status: 'started',
        servicesHealthy: false,
        message: 'Services not responding',
      });
    });
  });

  describe('listWorkspaces', () => {
    it('lists and sorts workspaces correctly', async () => {
      const mockSandboxes = [
        { id: '1', state: SandboxState.STOPPED, createdAt: '2023-01-01T00:00:00Z' },
        { id: '2', state: SandboxState.STARTED, createdAt: '2023-01-02T00:00:00Z' },
        { id: '3', state: SandboxState.STARTING, createdAt: '2023-01-03T00:00:00Z' },
      ];
      mockDaytona.list.mockResolvedValue(mockSandboxes);

      const result = await workspaceManager.listWorkspaces();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('2'); // started first
      expect(result[1].id).toBe('3'); // starting second
      expect(result[2].id).toBe('1'); // stopped last
    });

    it('passes labels to Daytona list method', async () => {
      const labels = { team: 'development' };
      mockDaytona.list.mockResolvedValue([]);

      await workspaceManager.listWorkspaces(labels);

      expect(mockDaytona.list).toHaveBeenCalledWith(labels);
    });

    it('handles list errors', async () => {
      mockDaytona.list.mockRejectedValue(new Error('API Error'));

      await expect(workspaceManager.listWorkspaces()).rejects.toThrow(
        'Failed to list workspaces: API Error'
      );
    });

    it('sorts by creation date when states are the same', async () => {
      const mockSandboxes = [
        { id: '1', state: SandboxState.STARTED, createdAt: '2023-01-01T00:00:00Z' },
        { id: '2', state: SandboxState.STARTED, createdAt: '2023-01-03T00:00:00Z' },
        { id: '3', state: SandboxState.STARTED, createdAt: '2023-01-02T00:00:00Z' },
      ];
      mockDaytona.list.mockResolvedValue(mockSandboxes);

      const result = await workspaceManager.listWorkspaces();

      expect(result[0].id).toBe('2'); // newest first
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1'); // oldest last
    });
  });

  describe('stopWorkspace', () => {
    it('stops a running workspace successfully', async () => {
      await workspaceManager.stopWorkspace('sandbox-123');

      expect(mockSandbox.stop).toHaveBeenCalled();
    });

    it('handles already stopped workspace', async () => {
      const stoppedSandbox = { ...mockSandbox, state: SandboxState.STOPPED };
      mockDaytona.get.mockResolvedValue(stoppedSandbox);

      await workspaceManager.stopWorkspace('sandbox-123');

      expect(mockSandbox.stop).not.toHaveBeenCalled();
    });

    it('handles stop errors', async () => {
      mockSandbox.stop.mockRejectedValue(new Error('Stop failed'));

      await expect(workspaceManager.stopWorkspace('sandbox-123')).rejects.toThrow(
        'Failed to stop workspace: Stop failed'
      );
    });
  });

  describe('deleteWorkspace', () => {
    it('deletes workspace successfully', async () => {
      await workspaceManager.deleteWorkspace('sandbox-123');

      expect(mockSandbox.delete).toHaveBeenCalled();
    });

    it('handles delete errors', async () => {
      mockSandbox.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(workspaceManager.deleteWorkspace('sandbox-123')).rejects.toThrow(
        'Failed to delete workspace: Delete failed'
      );
    });
  });

  describe('getSandbox', () => {
    it('returns sandbox from Daytona', async () => {
      const result = await workspaceManager.getSandbox('sandbox-123');

      expect(result).toBe(mockSandbox);
      expect(mockDaytona.get).toHaveBeenCalledWith('sandbox-123');
    });
  });

  describe('createSandbox', () => {
    it('creates sandbox with correct options', async () => {
      const options = { cpu: 2, memory: 4096, disk: 20480 };

      const result = await workspaceManager.createSandbox(options);

      expect(result).toBe(mockSandbox);
      expect(mockDaytona.create).toHaveBeenCalledWith({
        public: false,
        image: 'node:20',
        resources: options,
      });
    });
  });
});