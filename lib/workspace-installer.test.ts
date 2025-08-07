import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceInstaller } from './workspace-installer'
import { Sandbox } from '@daytonaio/sdk'

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    workspace: {
      installing: vi.fn(),
    },
    logError: vi.fn(),
  },
}))

describe('WorkspaceInstaller', () => {
  let installer: WorkspaceInstaller
  let mockSandbox: Sandbox
  let mockLogger: {
    workspace: { installing: ReturnType<typeof vi.fn> }
    logError: ReturnType<typeof vi.fn>
  }
  const rootDir = '/home/user'

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked logger
    const { logger } = await import('./logger')
    mockLogger = logger
    
    installer = new WorkspaceInstaller()
    
    // Create mock sandbox
    mockSandbox = {
      process: {
        executeCommand: vi.fn(),
      },
    } as unknown as Sandbox
  })

  describe('installGitHubCLI', () => {
    it('successfully installs GitHub CLI with correct commands', async () => {
      // Mock successful execution
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'GitHub CLI installed successfully',
      })

      await installer.installGitHubCLI(mockSandbox, rootDir)

      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('GitHub CLI (gh)')
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        `(type -p wget >/dev/null || (apt update && apt install wget -y)) && 
       mkdir -p -m 755 /etc/apt/keyrings && 
       out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg && 
       cat $out | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null && 
       chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg && 
       mkdir -p -m 755 /etc/apt/sources.list.d && 
       echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && 
       apt update && 
       apt install gh -y`,
        rootDir,
        undefined,
        180000
      )
    })

    it('uses correct timeout of 3 minutes (180000ms)', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'Success',
      })

      await installer.installGitHubCLI(mockSandbox, rootDir)

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        expect.any(String),
        rootDir,
        undefined,
        180000
      )
    })

    it('throws error when installation fails', async () => {
      const errorMessage = 'Failed to install GitHub CLI'
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 1,
        result: errorMessage,
      })

      await expect(installer.installGitHubCLI(mockSandbox, rootDir)).rejects.toThrow(
        `GitHub CLI installation failed: ${errorMessage}`
      )

      expect(mockLogger.logError).toHaveBeenCalledWith('GitHub CLI installation failed', {
        error: errorMessage,
        code: 'GITHUB_CLI_INSTALL_FAILED',
        details: { exitCode: 1 },
      })
    })

    it('executes the exact GitHub CLI installation script provided', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'Success',
      })

      await installer.installGitHubCLI(mockSandbox, rootDir)

      const executedCommand = vi.mocked(mockSandbox.process.executeCommand).mock.calls[0][0]
      
      // Verify the command contains all the required GitHub CLI installation steps
      expect(executedCommand).toContain('type -p wget')
      expect(executedCommand).toContain('apt update && apt install wget -y')
      expect(executedCommand).toContain('mkdir -p -m 755 /etc/apt/keyrings')
      expect(executedCommand).toContain('wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg')
      expect(executedCommand).toContain('chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg')
      expect(executedCommand).toContain('mkdir -p -m 755 /etc/apt/sources.list.d')
      expect(executedCommand).toContain('deb [arch=$(dpkg --print-architecture)')
      expect(executedCommand).toContain('signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg')
      expect(executedCommand).toContain('https://cli.github.com/packages stable main')
      expect(executedCommand).toContain('tee /etc/apt/sources.list.d/github-cli.list')
      expect(executedCommand).toContain('apt install gh -y')
    })

    it('logs installation start with correct message', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'Success',
      })

      await installer.installGitHubCLI(mockSandbox, rootDir)

      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('GitHub CLI (gh)')
    })

    it('handles command execution errors properly', async () => {
      const error = new Error('Network error')
      vi.mocked(mockSandbox.process.executeCommand).mockRejectedValue(error)

      await expect(installer.installGitHubCLI(mockSandbox, rootDir)).rejects.toThrow('Network error')
    })
  })

  describe('existing installation methods', () => {
    it('installSystemPackages still works correctly', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'System packages installed',
      })

      await installer.installSystemPackages(mockSandbox, rootDir)

      expect(mockLogger.workspace.installing).toHaveBeenCalledWith(
        'system packages (curl, wget, git, zsh)'
      )
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'apt-get update -qq && apt-get install -y -qq curl wget git net-tools zsh',
        rootDir,
        undefined,
        60000
      )
    })

    it('installTtyd still works correctly', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'ttyd installed',
      })

      await installer.installTtyd(mockSandbox, rootDir)

      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('terminal (ttyd)')
    })

    it('installCodeServer still works correctly', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'code-server installed',
      })

      await installer.installCodeServer(mockSandbox, rootDir)

      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('VSCode (code-server)')
    })

    it('installClaudeCode still works correctly', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'Claude CLI installed',
      })

      await installer.installClaudeCode(mockSandbox, rootDir)

      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('Claude Code CLI')
    })

    it('installOhMyZsh still works correctly', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: 'Oh My Zsh installed',
      })

      await installer.installOhMyZsh(mockSandbox, rootDir)

      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('Oh My Zsh')
    })
  })

  describe('error handling consistency', () => {
    it('all installation methods follow the same error pattern', async () => {
      const methods = [
        'installSystemPackages',
        'installGitHubCLI',
        'installTtyd',
        'installCodeServer',
        'installOhMyZsh',
      ]

      for (const method of methods) {
        vi.clearAllMocks()
        vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
          exitCode: 1,
          result: 'Installation failed',
        })

        if (method === 'installClaudeCode') {
          // Claude CLI installation is allowed to fail
          await expect(installer[method as keyof WorkspaceInstaller](mockSandbox, rootDir)).resolves.toBeUndefined()
          expect(mockLogger.logError).toHaveBeenCalled()
        } else {
          await expect(installer[method as keyof WorkspaceInstaller](mockSandbox, rootDir)).rejects.toThrow()
          expect(mockLogger.logError).toHaveBeenCalled()
        }
      }
    })
  })
})