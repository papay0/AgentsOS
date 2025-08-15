/**
 * Unit tests for WorkspaceCreator updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceCreator } from '../workspace-creator';
import { PortManager } from '../port-manager';
import type { RepositoryWithUrls } from '@/types/workspace';

// Mock all dependencies
vi.mock('@daytonaio/sdk', () => ({
  Sandbox: vi.fn(),
}));

vi.mock('../logger', () => ({
  logger: {
    workspace: { creating: vi.fn() },
    logWorkspace: vi.fn(),
    logError: vi.fn(),
  },
}));

vi.mock('../workspace-manager', () => ({
  WorkspaceManager: vi.fn().mockImplementation(() => ({
    createSandbox: vi.fn(),
  })),
}));

vi.mock('../workspace-installer', () => ({
  WorkspaceInstaller: vi.fn().mockImplementation(() => ({
    installSystemPackages: vi.fn(),
    installTtyd: vi.fn(),
    installCodeServer: vi.fn(),
    installClaudeCode: vi.fn(),
    installOhMyZsh: vi.fn(),
  })),
}));

vi.mock('../workspace-services', () => ({
  WorkspaceServices: vi.fn().mockImplementation(() => ({
    setupRepositoryServices: vi.fn(),
  })),
}));


vi.mock('../analytics', () => ({
  trackWorkspaceCreated: vi.fn(),
}));

describe('WorkspaceCreator', () => {
  let workspaceCreator: WorkspaceCreator;
  
  beforeEach(() => {
    workspaceCreator = new WorkspaceCreator('test-api-key');
  });

  describe('createUserWorkspace', () => {
    it('should create UserWorkspace structure from repositories with URLs', () => {
      const sandboxId = 'sandbox-123';
      const repositoriesWithUrls: RepositoryWithUrls[] = [
        {
          url: '',
          name: 'Default Workspace',
          urls: {
            vscode: 'http://example.com:8080',
            terminal: 'http://example.com:10000',
            claude: 'http://example.com:4000',
          }
        },
        {
          url: 'https://github.com/user/repo.git',
          name: 'GitHub Project',
          description: 'A test project',
          urls: {
            vscode: 'http://example.com:8081',
            terminal: 'http://example.com:10001',
            claude: 'http://example.com:4001',
          }
        }
      ];

      const userWorkspace = workspaceCreator.createUserWorkspace(sandboxId, repositoriesWithUrls);

      expect(userWorkspace).toMatchObject({
        sandboxId: 'sandbox-123',
        status: 'running',
        repositories: expect.arrayContaining([
          expect.objectContaining({
            name: 'Default Workspace',
            sourceType: 'default',
            url: '',
            ports: PortManager.getPortsForSlot(0),
          }),
          expect.objectContaining({
            name: 'GitHub Project',
            sourceType: 'github', 
            url: 'https://github.com/user/repo.git',
            ports: PortManager.getPortsForSlot(1),
          })
        ])
      });

      expect(userWorkspace.id).toMatch(/^workspace-\d+$/);
      expect(userWorkspace.createdAt).toBeInstanceOf(Date);
      expect(userWorkspace.updatedAt).toBeInstanceOf(Date);
      expect(userWorkspace.repositories).toHaveLength(2);
    });

    it('should assign correct ports using PortManager', () => {
      const repositoriesWithUrls: RepositoryWithUrls[] = [
        {
          url: 'https://github.com/user/repo1.git',
          name: 'Repo 1',
          urls: { vscode: '', terminal: '', claude: '' }
        },
        {
          url: 'https://github.com/user/repo2.git', 
          name: 'Repo 2',
          urls: { vscode: '', terminal: '', claude: '' }
        },
        {
          url: 'https://github.com/user/repo3.git',
          name: 'Repo 3', 
          urls: { vscode: '', terminal: '', claude: '' }
        }
      ];

      const userWorkspace = workspaceCreator.createUserWorkspace('test', repositoriesWithUrls);

      expect(userWorkspace.repositories[0].ports).toEqual(PortManager.getPortsForSlot(0));
      expect(userWorkspace.repositories[1].ports).toEqual(PortManager.getPortsForSlot(1));
      expect(userWorkspace.repositories[2].ports).toEqual(PortManager.getPortsForSlot(2));

      // Verify no port conflicts
      const allPorts = userWorkspace.repositories.flatMap(r => [r.ports.vscode, r.ports.terminal, r.ports.claude]);
      const uniquePorts = new Set(allPorts);
      expect(uniquePorts.size).toBe(allPorts.length);
    });

    it('should handle empty repository URL correctly', () => {
      const repositoriesWithUrls: RepositoryWithUrls[] = [
        {
          url: '',
          name: 'Manual Project',
          urls: { vscode: '', terminal: '', claude: '' }
        }
      ];

      const userWorkspace = workspaceCreator.createUserWorkspace('test', repositoriesWithUrls);

      expect(userWorkspace.repositories[0]).toMatchObject({
        url: '',
        name: 'Manual Project',
        sourceType: 'default', // Empty URL defaults to 'default'
        ports: PortManager.getPortsForSlot(0)
      });
    });

    it('should handle mixed repository types', () => {
      const repositoriesWithUrls: RepositoryWithUrls[] = [
        {
          url: '',
          name: 'Default Workspace',
          urls: { vscode: '', terminal: '', claude: '' }
        },
        {
          url: 'https://github.com/user/repo.git',
          name: 'GitHub Project',
          urls: { vscode: '', terminal: '', claude: '' }
        }
      ];

      const userWorkspace = workspaceCreator.createUserWorkspace('test', repositoriesWithUrls);

      expect(userWorkspace.repositories[0].sourceType).toBe('default');
      expect(userWorkspace.repositories[1].sourceType).toBe('github');
    });
  });

  describe('repository type detection', () => {
    it('should correctly identify repository source types', () => {
      const testCases = [
        { url: '', expected: 'default' },
        { url: 'https://github.com/user/repo.git', expected: 'github' },
        { url: 'https://gitlab.com/user/repo.git', expected: 'github' }, // Still categorized as github for now
      ];

      testCases.forEach(({ url, expected }, index) => {
        const repositoriesWithUrls: RepositoryWithUrls[] = [{
          url,
          name: `Test Repo ${index}`,
          urls: { vscode: '', terminal: '', claude: '' }
        }];

        const userWorkspace = workspaceCreator.createUserWorkspace('test', repositoriesWithUrls);
        expect(userWorkspace.repositories[0].sourceType).toBe(expected);
      });
    });
  });

  describe('UserWorkspace structure validation', () => {
    it('should create valid UserWorkspace structure', () => {
      const repositoriesWithUrls: RepositoryWithUrls[] = [
        {
          url: 'https://github.com/user/repo.git',
          name: 'Test Repo',
          description: 'Test description',
          urls: { vscode: '', terminal: '', claude: '' }
        }
      ];

      const userWorkspace = workspaceCreator.createUserWorkspace('sandbox-123', repositoriesWithUrls);

      // Check required fields
      expect(userWorkspace.id).toBeDefined();
      expect(userWorkspace.sandboxId).toBe('sandbox-123');
      expect(userWorkspace.repositories).toHaveLength(1);
      expect(userWorkspace.status).toBe('running');
      expect(userWorkspace.createdAt).toBeInstanceOf(Date);
      expect(userWorkspace.updatedAt).toBeInstanceOf(Date);

      // Check repository structure
      const repo = userWorkspace.repositories[0];
      expect(repo.id).toBeDefined();
      expect(repo.name).toBe('Test Repo');
      expect(repo.description).toBe('Test description');
      expect(repo.ports).toBeDefined();
      expect(repo.ports.vscode).toBeTypeOf('number');
      expect(repo.ports.terminal).toBeTypeOf('number');
      expect(repo.ports.claude).toBeTypeOf('number');
    });
  });
});