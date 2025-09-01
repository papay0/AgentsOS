import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceInstaller } from './workspace-installer'
import { Sandbox } from '@daytonaio/sdk'

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    workspace: {
      installing: vi.fn(),
    },
    info: vi.fn(),
    success: vi.fn(),
    logError: vi.fn(),
  },
}))

describe('WorkspaceInstaller', () => {
  let installer: WorkspaceInstaller
  let mockSandbox: Sandbox
  let mockLogger: {
    workspace: { installing: ReturnType<typeof vi.fn> }
    info: ReturnType<typeof vi.fn>
    success: ReturnType<typeof vi.fn>
    logError: ReturnType<typeof vi.fn>
  }
  const rootDir = '/home/user'

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked logger
    const { logger } = await import('./logger')
    mockLogger = logger as unknown as typeof mockLogger
    
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
        'system packages (tmux, curl, wget, git, zsh)'
      )
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'apt-get update -qq && apt-get install -y -qq tmux curl wget git zsh net-tools',
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

    it('ensureCLITools checks and installs missing CLI tools', async () => {
      // Mock which commands - gemini missing, claude present
      vi.mocked(mockSandbox.process.executeCommand)
        .mockResolvedValueOnce({ exitCode: 0, result: '/usr/local/bin/claude' }) // claude exists
        .mockResolvedValueOnce({ exitCode: 1, result: 'gemini: not found' }) // gemini missing
        .mockResolvedValueOnce({ exitCode: 0, result: 'Gemini CLI installed' }) // gemini install succeeds

      await installer.ensureCLITools(mockSandbox, rootDir)

      expect(mockLogger.info).toHaveBeenCalledWith('✓ Claude Code CLI already installed')
      expect(mockLogger.info).toHaveBeenCalledWith('✗ Gemini CLI missing, will install')
      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('Gemini CLI')
      expect(mockLogger.success).toHaveBeenCalledWith('Gemini CLI installed successfully')
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

  describe('ensureSystemPackages', () => {
    it('installs only missing packages when some are already present', async () => {
      // Mock responses: tmux and curl are present, others are missing
      vi.mocked(mockSandbox.process.executeCommand)
        .mockResolvedValueOnce({ exitCode: 0, result: '/usr/bin/tmux' }) // tmux found
        .mockResolvedValueOnce({ exitCode: 0, result: '/usr/bin/curl' }) // curl found
        .mockResolvedValueOnce({ exitCode: 1, result: 'wget: not found' }) // wget missing
        .mockResolvedValueOnce({ exitCode: 1, result: 'git: not found' }) // git missing
        .mockResolvedValueOnce({ exitCode: 1, result: 'zsh: not found' }) // zsh missing
        .mockResolvedValueOnce({ exitCode: 0, result: 'Installation successful' }) // apt install

      await installer.ensureSystemPackages(mockSandbox, rootDir)

      // Verify each package was checked
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which tmux', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which curl', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which wget', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which git', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which zsh', rootDir, undefined, 5000)

      // Verify only missing packages were installed
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'apt-get update -qq && apt-get install -y -qq wget git zsh net-tools',
        rootDir,
        undefined,
        60000
      )

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith('✓ tmux already installed')
      expect(mockLogger.info).toHaveBeenCalledWith('✓ curl already installed')
      expect(mockLogger.info).toHaveBeenCalledWith('✗ wget missing, will install')
      expect(mockLogger.info).toHaveBeenCalledWith('✗ git missing, will install')
      expect(mockLogger.info).toHaveBeenCalledWith('✗ zsh missing, will install')
      expect(mockLogger.workspace.installing).toHaveBeenCalledWith('missing system packages: wget, git, zsh')
      expect(mockLogger.success).toHaveBeenCalledWith('Installed missing packages: wget, git, zsh')
    })

    it('skips installation when all packages are already present', async () => {
      // Mock all packages as present
      vi.mocked(mockSandbox.process.executeCommand)
        .mockResolvedValue({ exitCode: 0, result: '/usr/bin/package' })

      await installer.ensureSystemPackages(mockSandbox, rootDir)

      // Should check all packages
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledTimes(5)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which tmux', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which curl', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which wget', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which git', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which zsh', rootDir, undefined, 5000)

      // Should not run apt install
      expect(mockSandbox.process.executeCommand).not.toHaveBeenCalledWith(
        expect.stringContaining('apt-get'),
        expect.any(String),
        expect.any(Object),
        expect.any(Number)
      )

      // Verify logging
      expect(mockLogger.success).toHaveBeenCalledWith('All critical system packages already present')
    })

    it('handles package check failures gracefully', async () => {
      // Mock some checks to throw errors, others to return missing
      vi.mocked(mockSandbox.process.executeCommand)
        .mockRejectedValueOnce(new Error('Network timeout')) // tmux check fails
        .mockResolvedValueOnce({ exitCode: 0, result: '/usr/bin/curl' }) // curl found
        .mockResolvedValueOnce({ exitCode: 1, result: 'not found' }) // wget missing
        .mockRejectedValueOnce(new Error('Command failed')) // git check fails
        .mockResolvedValueOnce({ exitCode: 1, result: 'not found' }) // zsh missing
        .mockResolvedValueOnce({ exitCode: 0, result: 'Installation successful' }) // apt install

      await installer.ensureSystemPackages(mockSandbox, rootDir)

      // Should install packages that failed checks or were missing
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'apt-get update -qq && apt-get install -y -qq tmux wget git zsh net-tools',
        rootDir,
        undefined,
        60000
      )

      // Verify error handling logging
      expect(mockLogger.info).toHaveBeenCalledWith('✗ tmux check failed, will install')
      expect(mockLogger.info).toHaveBeenCalledWith('✓ curl already installed')
      expect(mockLogger.info).toHaveBeenCalledWith('✗ wget missing, will install')
      expect(mockLogger.info).toHaveBeenCalledWith('✗ git check failed, will install')
      expect(mockLogger.info).toHaveBeenCalledWith('✗ zsh missing, will install')
    })

    it('throws error when package installation fails', async () => {
      // Mock all packages as missing
      vi.mocked(mockSandbox.process.executeCommand)
        .mockResolvedValue({ exitCode: 1, result: 'not found' }) // All packages missing
        .mockResolvedValueOnce({ exitCode: 1, result: 'not found' }) // tmux
        .mockResolvedValueOnce({ exitCode: 1, result: 'not found' }) // curl  
        .mockResolvedValueOnce({ exitCode: 1, result: 'not found' }) // wget
        .mockResolvedValueOnce({ exitCode: 1, result: 'not found' }) // git
        .mockResolvedValueOnce({ exitCode: 1, result: 'not found' }) // zsh
        .mockResolvedValueOnce({ exitCode: 1, result: 'apt-get failed' }) // Installation fails

      await expect(installer.ensureSystemPackages(mockSandbox, rootDir)).rejects.toThrow(
        'Failed to install missing packages: apt-get failed'
      )

      expect(mockLogger.logError).toHaveBeenCalledWith('Critical system packages installation failed', {
        error: 'apt-get failed',
        code: 'SYSTEM_PACKAGES_ENSURE_FAILED',
        details: { exitCode: 1, missingPackages: ['tmux', 'curl', 'wget', 'git', 'zsh'] }
      })
    })

    it('uses correct timeout for package checks (5 seconds)', async () => {
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 0,
        result: '/usr/bin/package'
      })

      await installer.ensureSystemPackages(mockSandbox, rootDir)

      // Verify all package checks use 5 second timeout
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which tmux', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which curl', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which wget', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which git', rootDir, undefined, 5000)
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('which zsh', rootDir, undefined, 5000)
    })

    it('uses single source of truth for package list', async () => {
      // This test verifies that the ensureSystemPackages uses the same package list as installSystemPackages
      vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
        exitCode: 1,
        result: 'not found'
      })

      try {
        await installer.ensureSystemPackages(mockSandbox, rootDir)
      } catch {
        // Ignore the error, we just want to check the packages being checked
      }

      // Verify it checks the exact same core packages as defined in SYSTEM_PACKAGES.core
      const checkedPackages = vi.mocked(mockSandbox.process.executeCommand).mock.calls
        .filter(call => call[0].startsWith('which '))
        .map(call => call[0].replace('which ', ''))

      expect(checkedPackages).toEqual(['tmux', 'curl', 'wget', 'git', 'zsh'])
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
        'ensureSystemPackages',
      ]

      for (const method of methods) {
        vi.clearAllMocks()
        vi.mocked(mockSandbox.process.executeCommand).mockResolvedValue({
          exitCode: 1,
          result: 'Installation failed',
        })

        await expect(installer[method as keyof WorkspaceInstaller](mockSandbox, rootDir)).rejects.toThrow()
        expect(mockLogger.logError).toHaveBeenCalled()
      }
    })
  })
})