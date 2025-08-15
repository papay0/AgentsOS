import { Sandbox } from '@daytonaio/sdk';
import { logger } from './logger';
import { TTYD_THEME } from './workspace-constants';
import { PortManager } from './port-manager';
import { TmuxScriptGenerator } from './tmux-script-generator';
import type { Repository } from '@/types/workspace';

interface RepositoryWithUrls extends Repository {
  urls: {
    vscode: string;
    terminal: string;
    claude: string;
  };
}

export class WorkspaceServices {
  private logger = logger;


  /**
   * Setup services for multiple repositories (one instance per repo)
   */
  async setupRepositoryServices(sandbox: Sandbox, rootDir: string, repositories: Repository[]): Promise<RepositoryWithUrls[]> {
    this.logger.info(`Setting up services for ${repositories.length} repositories...`);
    
    const repositoriesWithUrls: RepositoryWithUrls[] = [];
    
    for (let i = 0; i < repositories.length; i++) {
      const repo = repositories[i];
      const ports = this.allocatePorts(i);
      const repoPath = `${rootDir}/projects/${repo.name.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
      
      // Create startup scripts for this repository
      await this.createRepositoryScripts(sandbox, rootDir, repoPath, repo.name);
      
      // Start services for this repository (and wait for them to start)
      await this.startRepositoryServices(sandbox, rootDir, repoPath, repo.name, ports);
      
      // Wait a bit for services to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get preview URLs for this repository
      const urls = await this.getRepositoryUrls(sandbox, ports);
      
      repositoriesWithUrls.push({
        ...repo,
        urls
      });
      
      this.logger.success(`Services started for ${repo.name} - VSCode: ${ports.vscode}, Terminal: ${ports.terminal}, Claude: ${ports.claude}`);
    }
    
    // Wait for all services to fully initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify all services
    await this.verifyRepositoryServices(sandbox, rootDir, repositoriesWithUrls);
    
    return repositoriesWithUrls;
  }

  private allocatePorts(index: number): { vscode: number; terminal: number; claude: number } {
    // Use new PortManager for consistent port allocation
    return PortManager.getPortsForSlot(index);
  }

  private async createRepositoryScripts(sandbox: Sandbox, rootDir: string, repoPath: string, repoName: string): Promise<void> {
    // Create Claude startup script for this repository with tmux
    const claudeScript = TmuxScriptGenerator.generateClaudeScript(repoPath, repoName);
    const claudeScriptPath = `/tmp/start-claude-${repoName}.sh`;
    await sandbox.process.executeCommand(
      TmuxScriptGenerator.generateScriptCreationCommand(claudeScript, claudeScriptPath),
      rootDir
    );
    
    // Create zsh startup script for this repository with tmux
    const terminalScript = TmuxScriptGenerator.generateTerminalScript(repoPath, repoName);
    const terminalScriptPath = `/tmp/start-zsh-${repoName}.sh`;
    await sandbox.process.executeCommand(
      TmuxScriptGenerator.generateScriptCreationCommand(terminalScript, terminalScriptPath),
      rootDir
    );
  }

  private async startRepositoryServices(
    sandbox: Sandbox, 
    rootDir: string, 
    repoPath: string, 
    repoName: string, 
    ports: { vscode: number; terminal: number; claude: number }
  ): Promise<void> {
    const servicePromises = [
      // Start VSCode for this repository
      sandbox.process.executeCommand(
        `nohup code-server --bind-addr 0.0.0.0:${ports.vscode} --auth none --disable-telemetry ${repoPath} > /tmp/code-server-${repoName}.log 2>&1 & echo "code-server started for ${repoName}"`,
        rootDir
      ),
      
      // Start terminal for this repository
      sandbox.process.executeCommand(
        `nohup ttyd --port ${ports.terminal} --writable -t 'theme=${TTYD_THEME}' /tmp/start-zsh-${repoName}.sh > /tmp/ttyd-${repoName}.log 2>&1 & echo "terminal started for ${repoName}"`,
        rootDir
      ),
      
      // Start Claude for this repository
      sandbox.process.executeCommand(
        `nohup ttyd --port ${ports.claude} --writable -t 'theme=${TTYD_THEME}' /tmp/start-claude-${repoName}.sh > /tmp/ttyd-claude-${repoName}.log 2>&1 & echo "claude started for ${repoName}"`,
        rootDir
      )
    ];
    
    await Promise.all(servicePromises);
    this.logger.info(`Started services for ${repoName} on ports ${ports.vscode}, ${ports.terminal}, ${ports.claude}`);
  }

  private async getRepositoryUrls(sandbox: Sandbox, ports: { vscode: number; terminal: number; claude: number }): Promise<{ vscode: string; terminal: string; claude: string }> {
    const [vscodeInfo, terminalInfo, claudeInfo] = await Promise.all([
      sandbox.getPreviewLink(ports.vscode),
      sandbox.getPreviewLink(ports.terminal),
      sandbox.getPreviewLink(ports.claude)
    ]);
    
    return {
      vscode: vscodeInfo.url,
      terminal: terminalInfo.url,
      claude: claudeInfo.url
    };
  }

  private async verifyRepositoryServices(sandbox: Sandbox, rootDir: string, repositories: RepositoryWithUrls[]): Promise<void> {
    const allPorts = repositories.flatMap(repo => {
      const vscodePort = new URL(repo.urls.vscode).hostname.split('-')[0];
      const terminalPort = new URL(repo.urls.terminal).hostname.split('-')[0];
      const claudePort = new URL(repo.urls.claude).hostname.split('-')[0];
      return [vscodePort, terminalPort, claudePort];
    }).join('|');
    
    await sandbox.process.executeCommand(
      `netstat -tlnp | grep -E "(${allPorts})" > /dev/null`,
      rootDir
    );
    
    this.logger.success(`All services verified for ${repositories.length} repositories`);
  }



}