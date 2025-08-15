import { describe, it, expect } from 'vitest';
import { TmuxScriptGenerator } from '../tmux-script-generator';

describe('TmuxScriptGenerator', () => {
  const testRepoPath = '/home/user/projects/test-repo';
  const testRepoName = 'test-repo';

  describe('generateTerminalScript', () => {
    it('generates correct terminal script with tmux session management', () => {
      const script = TmuxScriptGenerator.generateTerminalScript(testRepoPath, testRepoName);
      
      expect(script).toContain('#!/bin/bash');
      expect(script).toContain(`cd ${testRepoPath}`);
      expect(script).toContain('export TERM=screen-256color');
      expect(script).toContain('export LANG=en_US.UTF-8');
      expect(script).toContain('export LC_ALL=en_US.UTF-8');
      expect(script).toContain('tmux start-server 2>/dev/null || true');
      expect(script).toContain('tmux set -g mouse on 2>/dev/null || true');
      expect(script).toContain('tmux set -g history-limit 50000 2>/dev/null || true');
      expect(script).toContain(`if tmux has-session -t main-${testRepoName} 2>/dev/null; then`);
      expect(script).toContain(`exec tmux attach-session -t main-${testRepoName}`);
      expect(script).toContain(`exec tmux new-session -s main-${testRepoName} "cd ${testRepoPath} && exec zsh"`);
    });

    it('generates script with proper session name for terminal', () => {
      const script = TmuxScriptGenerator.generateTerminalScript(testRepoPath, testRepoName);
      
      expect(script).toContain(`main-${testRepoName}`);
      expect(script).not.toContain(`claude-${testRepoName}`);
    });
  });

  describe('generateClaudeScript', () => {
    it('generates correct Claude script with tmux session management', () => {
      const script = TmuxScriptGenerator.generateClaudeScript(testRepoPath, testRepoName);
      
      expect(script).toContain('#!/bin/bash');
      expect(script).toContain(`cd ${testRepoPath}`);
      expect(script).toContain('export TERM=screen-256color');
      expect(script).toContain('export LANG=en_US.UTF-8');
      expect(script).toContain('export LC_ALL=en_US.UTF-8');
      expect(script).toContain('tmux start-server 2>/dev/null || true');
      expect(script).toContain('tmux set -g mouse on 2>/dev/null || true');
      expect(script).toContain(`if tmux has-session -t claude-${testRepoName} 2>/dev/null; then`);
      expect(script).toContain(`exec tmux attach-session -t claude-${testRepoName}`);
      expect(script).toContain(`exec tmux new-session -s claude-${testRepoName} "cd ${testRepoPath} && claude"`);
    });

    it('generates script with proper session name for Claude', () => {
      const script = TmuxScriptGenerator.generateClaudeScript(testRepoPath, testRepoName);
      
      expect(script).toContain(`claude-${testRepoName}`);
      expect(script).not.toContain(`main-${testRepoName}`);
    });
  });

  describe('generateCustomScript', () => {
    it('generates custom script with specified command and session prefix', () => {
      const customCommand = 'npm run dev';
      const sessionPrefix = 'dev';
      const script = TmuxScriptGenerator.generateCustomScript(testRepoPath, testRepoName, customCommand, sessionPrefix);
      
      expect(script).toContain(`exec tmux new-session -s ${sessionPrefix}-${testRepoName} "cd ${testRepoPath} && ${customCommand}"`);
      expect(script).toContain(`if tmux has-session -t ${sessionPrefix}-${testRepoName} 2>/dev/null; then`);
    });

    it('uses default "custom" prefix when not specified', () => {
      const customCommand = 'python app.py';
      const script = TmuxScriptGenerator.generateCustomScript(testRepoPath, testRepoName, customCommand);
      
      expect(script).toContain(`custom-${testRepoName}`);
    });
  });

  describe('generateScriptCreationCommand', () => {
    it('generates proper shell command to create script file', () => {
      const scriptContent = 'echo "test script"';
      const scriptPath = '/tmp/test-script.sh';
      const command = TmuxScriptGenerator.generateScriptCreationCommand(scriptContent, scriptPath);
      
      expect(command).toContain(`echo '${scriptContent}' > ${scriptPath}`);
      expect(command).toContain(`chmod +x ${scriptPath}`);
    });

    it('handles script content with single quotes correctly', () => {
      const scriptContent = "echo 'hello world'";
      const scriptPath = '/tmp/test-script.sh';
      const command = TmuxScriptGenerator.generateScriptCreationCommand(scriptContent, scriptPath);
      
      // Should escape single quotes in content
      expect(command).toContain(`echo 'echo '"'"'hello world'"'"'' > ${scriptPath}`);
    });
  });

  describe('getTmuxConfiguration', () => {
    it('returns tmux configuration object', () => {
      const config = TmuxScriptGenerator.getTmuxConfiguration();
      
      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('settings');
      expect(config.env).toHaveProperty('TERM');
      expect(config.env).toHaveProperty('LANG');
      expect(config.env).toHaveProperty('LC_ALL');
      expect(config.settings).toContain('tmux set -g mouse on');
      expect(config.settings).toContain('tmux set -g history-limit 50000');
    });
  });

  describe('consistency', () => {
    it('ensures both terminal and Claude scripts have consistent tmux configuration', () => {
      const terminalScript = TmuxScriptGenerator.generateTerminalScript(testRepoPath, testRepoName);
      const claudeScript = TmuxScriptGenerator.generateClaudeScript(testRepoPath, testRepoName);
      
      // Both should have the same environment variables
      expect(terminalScript).toContain('export TERM=screen-256color');
      expect(claudeScript).toContain('export TERM=screen-256color');
      
      // Both should have the same tmux settings
      expect(terminalScript).toContain('tmux set -g mouse on');
      expect(claudeScript).toContain('tmux set -g mouse on');
      
      expect(terminalScript).toContain('tmux set -g history-limit 50000');
      expect(claudeScript).toContain('tmux set -g history-limit 50000');
    });

    it('generates different session names but same configuration', () => {
      const terminalScript = TmuxScriptGenerator.generateTerminalScript(testRepoPath, testRepoName);
      const claudeScript = TmuxScriptGenerator.generateClaudeScript(testRepoPath, testRepoName);
      
      // Different session names
      expect(terminalScript).toContain(`main-${testRepoName}`);
      expect(claudeScript).toContain(`claude-${testRepoName}`);
      
      // Same working directory
      expect(terminalScript).toContain(`cd ${testRepoPath}`);
      expect(claudeScript).toContain(`cd ${testRepoPath}`);
    });
  });

  describe('error handling and edge cases', () => {
    it('handles special characters in repo paths', () => {
      const specialPath = '/home/user/projects/repo-with-special-chars_123';
      const specialName = 'repo-with-special-chars_123';
      
      const script = TmuxScriptGenerator.generateTerminalScript(specialPath, specialName);
      
      expect(script).toContain(`cd ${specialPath}`);
      expect(script).toContain(`main-${specialName}`);
    });

    it('handles empty strings gracefully', () => {
      expect(() => {
        TmuxScriptGenerator.generateTerminalScript('', '');
      }).not.toThrow();
      
      expect(() => {
        TmuxScriptGenerator.generateClaudeScript('', '');
      }).not.toThrow();
    });
  });
});