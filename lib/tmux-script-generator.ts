/**
 * TmuxScriptGenerator - Centralized utility for generating tmux startup scripts
 * 
 * Provides consistent tmux session management across all workspace services
 * with proper environment variables, mouse support, and session persistence.
 */
export class TmuxScriptGenerator {
  
  // Single source of truth for tmux configuration
  private static readonly TMUX_CONFIG = {
    // Environment variables for proper terminal behavior
    env: {
      TERM: 'screen-256color',
      LANG: 'en_US.UTF-8', 
      LC_ALL: 'en_US.UTF-8'
    },
    
    // Global tmux settings applied to all sessions
    settings: [
      'tmux set -g mouse on',                    // Enable mouse scrolling and selection
      'tmux set -g history-limit 50000',        // Large scrollback buffer
      'tmux set -g terminal-overrides "xterm*:smcup@:rmcup@"'  // Better scrolling in terminals
    ]
  } as const;

  /**
   * Generate terminal (zsh) startup script with tmux session management
   */
  static generateTerminalScript(repoPath: string, repoName: string): string {
    return this.generateScript({
      repoPath,
      repoName,
      sessionName: `main-${repoName}`,
      command: 'exec zsh'
    });
  }

  /**
   * Generate Claude CLI startup script with tmux session management
   */
  static generateClaudeScript(repoPath: string, repoName: string): string {
    return this.generateScript({
      repoPath,
      repoName,
      sessionName: `claude-${repoName}`,
      command: 'claude'
    });
  }

  /**
   * Generate custom command startup script with tmux session management
   */
  static generateCustomScript(repoPath: string, repoName: string, command: string, sessionPrefix = 'custom'): string {
    return this.generateScript({
      repoPath,
      repoName,
      sessionName: `${sessionPrefix}-${repoName}`,
      command
    });
  }

  /**
   * Core script generation logic with proper tmux session handling
   */
  private static generateScript(options: {
    repoPath: string;
    repoName: string;
    sessionName: string;
    command: string;
  }): string {
    // Generate environment variable exports
    const envExports = Object.entries(this.TMUX_CONFIG.env)
      .map(([key, value]) => `export ${key}=${value}`)
      .join('\n');

    // Generate tmux global settings with error suppression
    const tmuxSettings = this.TMUX_CONFIG.settings
      .map(setting => `${setting} 2>/dev/null || true`)
      .join('\n');

    return `#!/bin/bash
cd ${options.repoPath}
${envExports}
tmux start-server 2>/dev/null || true
${tmuxSettings}
if tmux has-session -t ${options.sessionName} 2>/dev/null; then
  exec tmux attach-session -t ${options.sessionName}
else
  exec tmux new-session -s ${options.sessionName} "cd ${options.repoPath} && ${options.command}"
fi`;
  }

  /**
   * Get all configured tmux settings for documentation or debugging
   */
  static getTmuxConfiguration(): typeof TmuxScriptGenerator.TMUX_CONFIG {
    return this.TMUX_CONFIG;
  }

  /**
   * Generate script creation command for sandbox execution
   * @param scriptContent The script content to write
   * @param scriptPath The full path where the script should be created
   * @returns Command string to create and make executable the script
   */
  static generateScriptCreationCommand(scriptContent: string, scriptPath: string): string {
    // Escape single quotes in script content for proper shell handling
    const escapedContent = scriptContent.replace(/'/g, "'\"'\"'");
    return `echo '${escapedContent}' > ${scriptPath} && chmod +x ${scriptPath}`;
  }
}