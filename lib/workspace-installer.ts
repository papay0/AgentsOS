import { Sandbox } from '@daytonaio/sdk';
import { logger, type ErrorLogData } from './logger';

export class WorkspaceInstaller {
  private logger = logger;

  async installSystemPackages(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.installing('system packages (curl, wget, git, zsh)');
    const result = await sandbox.process.executeCommand(
      `apt-get update -qq && apt-get install -y -qq curl wget git net-tools zsh`,
      rootDir,
      undefined,
      60000
    );
    
    if (result.exitCode !== 0) {
      const errorData: ErrorLogData = {
        error: result.result,
        code: 'SYSTEM_PACKAGES_INSTALL_FAILED',
        details: { exitCode: result.exitCode }
      };
      this.logger.logError('System packages installation failed', errorData);
      throw new Error(`System packages installation failed: ${result.result}`);
    }
  }

  async installTtyd(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.installing('terminal (ttyd)');
    // Install ttyd using the install script for better compatibility
    const result = await sandbox.process.executeCommand(
      `apt-get install -y build-essential cmake git libjson-c-dev libwebsockets-dev && 
       curl -Lo /tmp/ttyd-install.sh https://raw.githubusercontent.com/tsl0922/ttyd/main/scripts/install.sh && 
       chmod +x /tmp/ttyd-install.sh && 
       /tmp/ttyd-install.sh || (
         echo "Fallback: trying direct binary download..." && 
         curl -Lo /usr/local/bin/ttyd https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.x86_64 && 
         chmod +x /usr/local/bin/ttyd
       ) && 
       which ttyd && ttyd --version`,
      rootDir,
      undefined,
      120000
    );
    
    if (result.exitCode !== 0) {
      const errorData: ErrorLogData = {
        error: result.result,
        code: 'TTYD_INSTALL_FAILED',
        details: { exitCode: result.exitCode }
      };
      this.logger.logError('ttyd installation failed', errorData);
      throw new Error(`ttyd installation failed: ${result.result}`);
    }
  }

  async installCodeServer(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.installing('VSCode (code-server)');
    const result = await sandbox.process.executeCommand(
      `curl -fsSL https://code-server.dev/install.sh | sh`,
      rootDir,
      undefined,
      120000
    );
    
    if (result.exitCode !== 0) {
      const errorData: ErrorLogData = {
        error: result.result,
        code: 'CODE_SERVER_INSTALL_FAILED',
        details: { exitCode: result.exitCode }
      };
      this.logger.logError('code-server installation failed', errorData);
      throw new Error(`code-server installation failed: ${result.result}`);
    }
  }

  async installClaudeCode(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.installing('Claude Code CLI');
    const result = await sandbox.process.executeCommand(
      `npm install -g @anthropic-ai/claude-code`,
      rootDir,
      undefined,
      180000
    );
    
    if (result.exitCode !== 0) {
      const errorData: ErrorLogData = {
        error: result.result,
        code: 'CLAUDE_CLI_INSTALL_FAILED',
        details: { exitCode: result.exitCode, optional: true }
      };
      this.logger.logError('Claude CLI installation failed, continuing without it', errorData);
      return;
    }
  }

  async installOhMyZsh(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.installing('Oh My Zsh');
    const result = await sandbox.process.executeCommand(
      `sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended && 
       echo 'export ZSH="$HOME/.oh-my-zsh"' > ~/.zshrc && 
       echo 'ZSH_THEME="robbyrussell"' >> ~/.zshrc && 
       echo 'plugins=(git)' >> ~/.zshrc && 
       echo 'source $ZSH/oh-my-zsh.sh' >> ~/.zshrc && 
       echo 'PROMPT="%{$fg[cyan]%}%c%{$reset_color%} $ "' >> ~/.zshrc &&
       chsh -s $(which zsh)`,
      rootDir,
      undefined,
      120000
    );
    
    if (result.exitCode !== 0) {
      const errorData: ErrorLogData = {
        error: result.result,
        code: 'OH_MY_ZSH_INSTALL_FAILED',
        details: { exitCode: result.exitCode }
      };
      this.logger.logError('Oh My Zsh installation failed', errorData);
      throw new Error(`Oh My Zsh installation failed: ${result.result}`);
    }
  }
}