import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { WorkspaceCreator } from './workspace-creator'
import { WorkspaceManager } from './workspace-manager'
import { WorkspaceInstaller } from './workspace-installer'
import { WorkspaceServices } from './workspace-services'
import { Sandbox } from '@daytonaio/sdk'

// Mock dependencies
vi.mock('./workspace-manager')
vi.mock('./workspace-installer')
vi.mock('./workspace-services')
vi.mock('./analytics', () => ({
  trackWorkspaceCreated: vi.fn(),
}))

vi.mock('./port-manager', () => ({
  PortManager: {
    createDefaultRepository: vi.fn().mockReturnValue({
      id: 'default-workspace',
      name: 'My Workspace',
      url: '',
      description: 'Default workspace',
      sourceType: 'default',
      ports: { vscode: 8080, terminal: 9999, claude: 9998 },
    }),
    getPortsForSlot: vi.fn().mockReturnValue({
      vscode: 8080,
      terminal: 9999,
      claude: 9998,
    }),
  },
}))

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    workspace: {
      creating: vi.fn(),
    },
    logWorkspace: vi.fn(),
    logError: vi.fn(),
    info: vi.fn(),
  },
}))

describe('WorkspaceCreator', () => {
  let workspaceCreator: WorkspaceCreator
  let mockWorkspaceManager: WorkspaceManager
  let mockWorkspaceInstaller: WorkspaceInstaller
  let mockWorkspaceServices: WorkspaceServices
  let mockSandbox: Sandbox
  let mockLogger: {
    workspace: { creating: ReturnType<typeof vi.fn> }
    logWorkspace: ReturnType<typeof vi.fn>
    logError: ReturnType<typeof vi.fn>
    info: ReturnType<typeof vi.fn>
  }

  const apiKey = 'test-api-key'
  const rootDir = '/home/user'

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked logger
    const { logger } = await import('./logger')
    mockLogger = logger as unknown as typeof mockLogger

    // Create mock sandbox
    mockSandbox = {
      id: 'test-sandbox-123',
      getUserRootDir: vi.fn().mockResolvedValue(rootDir),
      process: {
        executeCommand: vi.fn().mockResolvedValue({
          exitCode: 0,
          result: 'Success',
        }),
      },
    } as unknown as Sandbox

    // Mock WorkspaceManager
    mockWorkspaceManager = {
      createSandbox: vi.fn().mockResolvedValue(mockSandbox),
    } as unknown as WorkspaceManager

    // Mock WorkspaceInstaller with all install methods
    mockWorkspaceInstaller = {
      installSystemPackages: vi.fn().mockResolvedValue(undefined),
      installGitHubCLI: vi.fn().mockResolvedValue(undefined),
      installTtyd: vi.fn().mockResolvedValue(undefined),
      installCodeServer: vi.fn().mockResolvedValue(undefined),
      installClaudeCode: vi.fn().mockResolvedValue(undefined),
      installOhMyZsh: vi.fn().mockResolvedValue(undefined),
    } as unknown as WorkspaceInstaller

    // Mock WorkspaceServices
    mockWorkspaceServices = {
      setupRepositoryServices: vi.fn().mockResolvedValue([
        {
          name: 'test-repo',
          url: 'https://github.com/test/repo',
          description: 'Test repository',
          urls: {
            vscode: 'http://localhost:8080',
            terminal: 'http://localhost:9999',
            claude: 'http://localhost:9998',
          },
        },
      ]),
    } as unknown as WorkspaceServices

    // Setup constructor mocks
    vi.mocked(WorkspaceManager).mockImplementation(() => mockWorkspaceManager)
    vi.mocked(WorkspaceInstaller).mockImplementation(() => mockWorkspaceInstaller)
    vi.mocked(WorkspaceServices).mockImplementation(() => mockWorkspaceServices)

    workspaceCreator = new WorkspaceCreator(apiKey)
  })

  describe('createWorkspace', () => {
    it('calls installGitHubCLI during workspace creation', async () => {
      const result = await workspaceCreator.createWorkspace({
        repositories: [
          {
            id: 'repo1',
            name: 'test-repo',
            url: 'https://github.com/test/repo',
            description: 'Test repository',
            sourceType: 'github',
            ports: { vscode: 8080, terminal: 9999, claude: 9998 },
          },
        ],
        resources: { cpu: 2, memory: 4, disk: 10 },
      })

      // Verify GitHub CLI is installed in the correct order
      expect(mockWorkspaceInstaller.installSystemPackages).toHaveBeenCalledWith(mockSandbox, rootDir)
      expect(mockWorkspaceInstaller.installGitHubCLI).toHaveBeenCalledWith(mockSandbox, rootDir)
      expect(mockWorkspaceInstaller.installTtyd).toHaveBeenCalledWith(mockSandbox, rootDir)
      expect(mockWorkspaceInstaller.installCodeServer).toHaveBeenCalledWith(mockSandbox, rootDir)
      expect(mockWorkspaceInstaller.installClaudeCode).toHaveBeenCalledWith(mockSandbox, rootDir)
      expect(mockWorkspaceInstaller.installOhMyZsh).toHaveBeenCalledWith(mockSandbox, rootDir)

      // Verify proper response
      expect(result).toEqual({
        sandboxId: 'test-sandbox-123',
        message: '🚀 Services ready for 1 repositories!',
        repositories: [
          {
            name: 'test-repo',
            url: 'https://github.com/test/repo',
            description: 'Test repository',
            urls: {
              vscode: 'http://localhost:8080',
              terminal: 'http://localhost:9999',
              claude: 'http://localhost:9998',
            },
          },
        ],
      })
    })

    it('installs GitHub CLI even for default workspaces', async () => {
      // Create workspace without repositories (default workspace)
      await workspaceCreator.createWorkspace({})

      // GitHub CLI should still be installed
      expect(mockWorkspaceInstaller.installGitHubCLI).toHaveBeenCalledWith(mockSandbox, rootDir)
    })

    it('maintains correct installation order with GitHub CLI', async () => {
      await workspaceCreator.createWorkspace({})

      // Verify call order by checking call indices
      const installCalls = [
        mockWorkspaceInstaller.installSystemPackages,
        mockWorkspaceInstaller.installGitHubCLI,
        mockWorkspaceInstaller.installTtyd,
        mockWorkspaceInstaller.installCodeServer,
        mockWorkspaceInstaller.installClaudeCode,
        mockWorkspaceInstaller.installOhMyZsh,
      ]

      // Each method should have been called exactly once
      installCalls.forEach((method) => {
        expect(method).toHaveBeenCalledTimes(1)
      })

      // Verify order by ensuring system packages come first, GitHub CLI second
      expect(mockWorkspaceInstaller.installSystemPackages).toHaveBeenCalledBefore(
        mockWorkspaceInstaller.installGitHubCLI as Mock
      )
      expect(mockWorkspaceInstaller.installGitHubCLI).toHaveBeenCalledBefore(
        mockWorkspaceInstaller.installTtyd as Mock
      )
    })

    it('handles GitHub CLI installation failure gracefully', async () => {
      const gitHubError = new Error('GitHub CLI installation failed')
      vi.mocked(mockWorkspaceInstaller.installGitHubCLI).mockRejectedValue(gitHubError)

      await expect(workspaceCreator.createWorkspace({})).rejects.toThrow(
        'Failed to create workspace: GitHub CLI installation failed'
      )

      // Should still attempt to install system packages first
      expect(mockWorkspaceInstaller.installSystemPackages).toHaveBeenCalled()
      // But should fail before other installations
      expect(mockWorkspaceInstaller.installTtyd).not.toHaveBeenCalled()
      expect(mockWorkspaceInstaller.installCodeServer).not.toHaveBeenCalled()

      expect(mockLogger.logError).toHaveBeenCalledWith('Failed to create workspace', {
        error: gitHubError,
        code: 'WORKSPACE_CREATION_FAILED',
        details: {
          cpu: 4,
          memory: 8,
          image: 'node:20',
        },
      })
    })

    it('creates workspace successfully with GitHub CLI integration', async () => {
      const options = {
        repositories: [
          {
            id: 'repo1',
            name: 'my-project',
            url: 'https://github.com/user/my-project',
            description: 'My project',
            sourceType: 'github' as const,
            ports: { vscode: 8080, terminal: 9999, claude: 9998 },
          },
        ],
        workspaceName: 'Test Workspace',
        resources: { cpu: 4, memory: 8, disk: 10 },
      }

      const result = await workspaceCreator.createWorkspace(options)

      // Verify all installations including GitHub CLI
      expect(mockWorkspaceInstaller.installGitHubCLI).toHaveBeenCalledWith(mockSandbox, rootDir)
      
      // Verify workspace creation succeeded
      expect(result.sandboxId).toBe('test-sandbox-123')
      expect(result.message).toContain('Services ready')
      expect(result.repositories).toHaveLength(1)
    })

    it('passes correct parameters to all installation methods', async () => {
      await workspaceCreator.createWorkspace({})

      // All installation methods should receive the same sandbox and rootDir
      const installationMethods = [
        mockWorkspaceInstaller.installSystemPackages,
        mockWorkspaceInstaller.installGitHubCLI,
        mockWorkspaceInstaller.installTtyd,
        mockWorkspaceInstaller.installCodeServer,
        mockWorkspaceInstaller.installClaudeCode,
        mockWorkspaceInstaller.installOhMyZsh,
      ]

      installationMethods.forEach((method) => {
        expect(method).toHaveBeenCalledWith(mockSandbox, rootDir)
      })
    })
  })

  describe('integration with existing functionality', () => {
    it('does not break existing workspace creation flow', async () => {
      const result = await workspaceCreator.createWorkspace({
        repositories: [],
        resources: { cpu: 2, memory: 4, disk: 10 },
      })

      // Verify core workflow still works
      expect(mockWorkspaceManager.createSandbox).toHaveBeenCalled()
      expect(mockSandbox.getUserRootDir).toHaveBeenCalled()
      expect(mockWorkspaceServices.setupRepositoryServices).toHaveBeenCalled()

      expect(result).toBeDefined()
      expect(result.sandboxId).toBe('test-sandbox-123')
    })

    it('maintains backward compatibility', async () => {
      // Test with minimal options (old style)
      const result = await workspaceCreator.createWorkspace()

      expect(result.sandboxId).toBe('test-sandbox-123')
      expect(mockWorkspaceInstaller.installGitHubCLI).toHaveBeenCalled()
    })
  })

  describe('createUserWorkspace', () => {
    it('still works correctly with GitHub CLI integration', async () => {
      const repositoriesWithUrls = [
        {
          name: 'test-repo',
          url: 'https://github.com/test/repo',
          description: 'Test',
          urls: {
            vscode: 'http://localhost:8080',
            terminal: 'http://localhost:9999',
            claude: 'http://localhost:9998',
          },
        },
      ]

      const userWorkspace = workspaceCreator.createUserWorkspace('sandbox-123', repositoriesWithUrls)

      expect(userWorkspace).toBeDefined()
      expect(userWorkspace.sandboxId).toBe('sandbox-123')
      expect(userWorkspace.repositories).toHaveLength(1)
      expect(userWorkspace.status).toBe('running')
    })
  })
})