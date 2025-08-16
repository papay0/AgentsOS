/**
 * Unit tests for /api/env-vars/sync API route
 * Tests authentication, validation, and sync operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/user-service-admin', () => ({
  UserServiceAdmin: {
    getInstance: vi.fn()
  }
}));

vi.mock('@/lib/workspace-env-sync', () => ({
  WorkspaceEnvSync: vi.fn()
}));

import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { WorkspaceEnvSync } from '@/lib/workspace-env-sync';

describe('/api/env-vars/sync', () => {
  let mockUserService: {
    getProjectEnvVars: ReturnType<typeof vi.fn>;
    getDaytonaApiKey: ReturnType<typeof vi.fn>;
  };
  let mockWorkspaceEnvSync: {
    syncEnvironmentVariables: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Silence console.error during tests to keep output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockUserService = {
      getProjectEnvVars: vi.fn(),
      getDaytonaApiKey: vi.fn()
    };

    mockWorkspaceEnvSync = {
      syncEnvironmentVariables: vi.fn()
    };

    (UserServiceAdmin.getInstance as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockUserService);
    (WorkspaceEnvSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockWorkspaceEnvSync);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });
      
      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized'
      });
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user-123' });
    });

    it('should return 400 when workspaceId is missing', async () => {
      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          projectName: 'test-project'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Workspace ID is required'
      });
    });

    it('should return 400 when projectName is missing', async () => {
      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Project name is required'
      });
    });

    it('should return 404 when no environment variables found', async () => {
      mockUserService.getProjectEnvVars.mockResolvedValue({});

      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'No environment variables found for project "test-project". Check your project name and environment variables in settings.'
      });
    });
  });

  describe('Smart Sync Mode', () => {
    beforeEach(() => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user-123' });
      mockUserService.getProjectEnvVars.mockResolvedValue({
        API_KEY: 'test-api-key',
        DATABASE_URL: 'test-db-url'
      });
    });

    it('should return 400 when Daytona API key not found', async () => {
      mockUserService.getDaytonaApiKey.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project',
          mode: 'smart'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Daytona API key not found. Please configure it in settings.'
      });
    });

    it('should perform smart sync successfully', async () => {
      mockUserService.getDaytonaApiKey.mockResolvedValue('daytona-api-key');
      mockWorkspaceEnvSync.syncEnvironmentVariables.mockResolvedValue({
        added: ['API_KEY'],
        updated: ['DATABASE_URL'],
        preserved: ['LOCAL_VAR'],
        conflicts: [
          {
            key: 'CONFLICT_VAR',
            localValue: 'local-value',
            cloudValue: 'cloud-value',
            resolution: 'local'
          }
        ],
        fileExisted: true,
        backupCreated: true
      });

      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project',
          mode: 'smart',
          conflictResolution: 'prefer-local'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        summary: {
          added: ['API_KEY'],
          updated: ['DATABASE_URL'],
          preserved: ['LOCAL_VAR'],
          conflicts: [
            {
              key: 'CONFLICT_VAR',
              localValue: 'local-value',
              cloudValue: 'cloud-value',
              resolution: 'local'
            }
          ],
          fileExisted: true,
          backupCreated: true
        }
      });

      expect(WorkspaceEnvSync).toHaveBeenCalledWith('daytona-api-key');
      expect(mockWorkspaceEnvSync.syncEnvironmentVariables).toHaveBeenCalledWith(
        'sandbox-id',
        {
          API_KEY: 'test-api-key',
          DATABASE_URL: 'test-db-url'
        },
        'test-project',
        {
          conflictResolution: 'prefer-local',
          createBackup: true
        }
      );
    });

    it('should handle smart sync failure', async () => {
      mockUserService.getDaytonaApiKey.mockResolvedValue('daytona-api-key');
      mockWorkspaceEnvSync.syncEnvironmentVariables.mockRejectedValue(
        new Error('Sandbox not found')
      );

      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project',
          mode: 'smart'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Smart sync failed: Sandbox not found. Try using Manual Command mode instead.'
      });
    });
  });

  describe('Command Mode', () => {
    beforeEach(() => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user-123' });
      mockUserService.getProjectEnvVars.mockResolvedValue({
        API_KEY: 'test-api-key',
        DATABASE_URL: 'test-db-url'
      });
    });

    it('should return command mode response', async () => {
      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project',
          mode: 'command'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary).toEqual({
        added: ['API_KEY', 'DATABASE_URL'],
        updated: [],
        preserved: [],
        conflicts: [],
        fileExisted: false,
        backupCreated: false,
        content: expect.stringContaining('API_KEY=test-api-key'),
        command: expect.stringContaining("cat > .env.local << 'AGENTSOS_ENV_EOF'")
      });
    });

    it('should default to command mode when mode not specified', async () => {
      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary?.command).toContain("cat > .env.local << 'AGENTSOS_ENV_EOF'");
    });
  });

  describe('Content Generation', () => {
    beforeEach(() => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user-123' });
    });

    it('should generate correct env file content', async () => {
      mockUserService.getProjectEnvVars.mockResolvedValue({
        API_KEY: 'test-api-key',
        DATABASE_URL: 'postgresql://user:pass@localhost/db',
        QUOTED_VALUE: 'value with spaces'
      });

      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project',
          mode: 'command'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      const content = data.summary?.content;
      expect(content).toContain('# AgentsOS Managed Environment Variables');
      expect(content).toContain('# Project: test-project');
      expect(content).toContain('API_KEY=test-api-key');
      expect(content).toContain('DATABASE_URL=postgresql://user:pass@localhost/db');
      expect(content).toContain('QUOTED_VALUE="value with spaces"');
    });

    it('should escape special characters in values', async () => {
      mockUserService.getProjectEnvVars.mockResolvedValue({
        QUOTED_VAR: 'value"with"quotes',
        HASH_VAR: 'value#with#hash',
        SPACE_VAR: 'value with spaces'
      });

      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project',
          mode: 'command'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      const content = data.summary?.content;
      expect(content).toContain('QUOTED_VAR="value\\"with\\"quotes"');
      expect(content).toContain('HASH_VAR=value#with#hash'); // Command mode doesn't quote hash values
      expect(content).toContain('SPACE_VAR="value with spaces"');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: 'user-123' });
    });

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: 'invalid-json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to sync environment variables'
      });
    });

    it('should handle UserServiceAdmin errors', async () => {
      mockUserService.getProjectEnvVars.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/env-vars/sync', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'sandbox-id',
          projectName: 'test-project'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to sync environment variables'
      });
    });
  });

});