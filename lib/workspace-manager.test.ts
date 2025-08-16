/**
 * Unit tests for WorkspaceManager environment file operations
 * Tests readEnvFile and writeEnvFile methods with project directory handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceManager } from './workspace-manager';
import { Daytona } from '@daytonaio/sdk';

// Mock Daytona SDK
vi.mock('@daytonaio/sdk', () => ({
  Daytona: vi.fn(),
  SandboxState: {
    STARTED: 'started',
    STOPPED: 'stopped'
  }
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    workspace: {
      checking: vi.fn(),
      starting: vi.fn()
    },
    debug: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    logError: vi.fn()
  }
}));

// Mock PortManager
vi.mock('./port-manager', () => ({
  PortManager: {
    getPortsForSlot: vi.fn().mockReturnValue({
      vscode: 8080,
      terminal: 9999,
      claude: 9998
    })
  }
}));

describe('WorkspaceManager Environment File Operations', () => {
  let workspaceManager: WorkspaceManager;
  let mockDaytona: {
    get: ReturnType<typeof vi.fn>;
  };
  let mockSandbox: {
    getUserRootDir: ReturnType<typeof vi.fn>;
    process: {
      executeCommand: ReturnType<typeof vi.fn>;
    };
    fs: {
      downloadFile: ReturnType<typeof vi.fn>;
      uploadFile: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSandbox = {
      getUserRootDir: vi.fn(),
      process: {
        executeCommand: vi.fn()
      },
      fs: {
        downloadFile: vi.fn(),
        uploadFile: vi.fn()
      }
    };

    mockDaytona = {
      get: vi.fn().mockResolvedValue(mockSandbox)
    };

    (Daytona as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockDaytona);
    
    workspaceManager = new WorkspaceManager('test-api-key');
  });

  describe('readEnvFile', () => {
    beforeEach(() => {
      mockSandbox.getUserRootDir.mockResolvedValue('/root');
    });

    it('should read from specific project directory when projectName provided', async () => {
      const mockBuffer = Buffer.from('KEY1=value1\nKEY2=value2');
      mockSandbox.process.executeCommand.mockResolvedValue({ result: 'projects exists' });
      mockSandbox.fs.downloadFile.mockResolvedValue(mockBuffer);

      const result = await workspaceManager.readEnvFile('sandbox-id', 'test-project');

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'ls -la "/root/projects/test-project" || echo "NOT_FOUND"',
        '/root'
      );
      expect(mockSandbox.fs.downloadFile).toHaveBeenCalledWith('/root/projects/test-project/.env.local');
      expect(result).toBe('KEY1=value1\nKEY2=value2');
    });

    it('should fallback to root directory when project directory not found', async () => {
      const mockBuffer = Buffer.from('KEY1=value1\nKEY2=value2');
      mockSandbox.process.executeCommand.mockResolvedValue({ result: 'NOT_FOUND' });
      mockSandbox.fs.downloadFile.mockResolvedValue(mockBuffer);

      const result = await workspaceManager.readEnvFile('sandbox-id', 'test-project');

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'ls -la "/root/projects/test-project" || echo "NOT_FOUND"',
        '/root'
      );
      expect(mockSandbox.fs.downloadFile).toHaveBeenCalledWith('/root/.env.local');
      expect(result).toBe('KEY1=value1\nKEY2=value2');
    });

    it('should read from root directory when no projectName provided', async () => {
      const mockBuffer = Buffer.from('KEY1=value1\nKEY2=value2');
      mockSandbox.fs.downloadFile.mockResolvedValue(mockBuffer);

      const result = await workspaceManager.readEnvFile('sandbox-id');

      expect(mockSandbox.process.executeCommand).not.toHaveBeenCalled();
      expect(mockSandbox.fs.downloadFile).toHaveBeenCalledWith('/root/.env.local');
      expect(result).toBe('KEY1=value1\nKEY2=value2');
    });

    it('should return null when file does not exist', async () => {
      mockSandbox.fs.downloadFile.mockRejectedValue(new Error('File not found'));

      const result = await workspaceManager.readEnvFile('sandbox-id', 'test-project');

      expect(result).toBeNull();
    });

    it('should return null when cannot get root directory (caught by try/catch)', async () => {
      mockSandbox.getUserRootDir.mockResolvedValue(null);

      // The readEnvFile method has a catch-all that returns null for any error
      const result = await workspaceManager.readEnvFile('sandbox-id');
      expect(result).toBeNull();
    });
  });

  describe('writeEnvFile', () => {
    beforeEach(() => {
      mockSandbox.getUserRootDir.mockResolvedValue('/root');
    });

    it('should write to specific project directory when projectName provided', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockSandbox.process.executeCommand.mockResolvedValue({ result: 'project-exists' });
      
      await workspaceManager.writeEnvFile('sandbox-id', content, false, 'test-project');

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'ls -la "/root/projects/test-project" || echo "NOT_FOUND"',
        '/root'
      );
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/projects/test-project/.env.local'
      );
    });

    it('should create backup when requested and file exists', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      const existingContent = Buffer.from('OLD_KEY=old_value');
      
      mockSandbox.process.executeCommand.mockResolvedValue({ result: 'project-exists' });
      mockSandbox.fs.downloadFile.mockResolvedValue(existingContent);
      
      await workspaceManager.writeEnvFile('sandbox-id', content, true, 'test-project');

      // Should attempt to backup
      expect(mockSandbox.fs.downloadFile).toHaveBeenCalledWith('/root/projects/test-project/.env.local');
      
      // Should create backup file with timestamp
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        existingContent,
        expect.stringMatching(/\/root\/projects\/test-project\/\.env\.local\.backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/)
      );
      
      // Should write new content
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/projects/test-project/.env.local'
      );
    });

    it('should skip backup when no existing file', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      
      mockSandbox.process.executeCommand.mockResolvedValue({ result: 'project-exists' });
      mockSandbox.fs.downloadFile.mockRejectedValue(new Error('File not found'));
      
      await workspaceManager.writeEnvFile('sandbox-id', content, true, 'test-project');

      // Should attempt to backup but fail silently
      expect(mockSandbox.fs.downloadFile).toHaveBeenCalledWith('/root/projects/test-project/.env.local');
      
      // Should only write new content (no backup call)
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledTimes(1);
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/projects/test-project/.env.local'
      );
    });

    it('should fallback to root directory when project not found', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockSandbox.process.executeCommand.mockRejectedValue(new Error('Projects directory not found'));
      
      await workspaceManager.writeEnvFile('sandbox-id', content, false, 'test-project');

      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/.env.local'
      );
    });

    it('should use first project directory when no projectName provided', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockSandbox.process.executeCommand.mockResolvedValue({ result: 'first-project\nsecond-project' });
      
      await workspaceManager.writeEnvFile('sandbox-id', content, false);

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('ls -1', '/root/projects');
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/projects/first-project/.env.local'
      );
    });

    it('should fallback to root when no projects found', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockSandbox.process.executeCommand.mockResolvedValue({ result: '' });
      
      await workspaceManager.writeEnvFile('sandbox-id', content, false);

      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/.env.local'
      );
    });

    it('should create backup in root directory fallback', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      const existingContent = Buffer.from('OLD_KEY=old_value');
      
      mockSandbox.process.executeCommand.mockRejectedValue(new Error('No projects directory'));
      mockSandbox.fs.downloadFile.mockResolvedValue(existingContent);
      
      await workspaceManager.writeEnvFile('sandbox-id', content, true, 'test-project');

      // Should backup in root directory
      expect(mockSandbox.fs.downloadFile).toHaveBeenCalledWith('/root/.env.local');
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        existingContent,
        expect.stringMatching(/\/root\/\.env\.local\.backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/)
      );
      
      // Should write to root directory
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/.env.local'
      );
    });

    it('should throw error when cannot get root directory', async () => {
      mockSandbox.getUserRootDir.mockResolvedValue(null);

      await expect(workspaceManager.writeEnvFile('sandbox-id', 'content')).rejects.toThrow(
        'Could not get root directory'
      );
    });

    it('should fallback to root directory when project verification fails', async () => {
      const content = 'KEY1=value1\nKEY2=value2';
      mockSandbox.process.executeCommand.mockRejectedValue(new Error('Project directory not found'));
      
      // Should not throw, should fallback to root directory
      await workspaceManager.writeEnvFile('sandbox-id', content, false, 'nonexistent-project');
      
      // Should write to root directory as fallback
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(
        Buffer.from(content, 'utf-8'),
        '/root/.env.local'
      );
    });
  });
});