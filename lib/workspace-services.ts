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
    gemini: string;
  };
  tokens?: {
    vscode: string | null;
    terminal: string | null;
    claude: string | null;
    gemini: string | null;
  };
}

export class WorkspaceServices {
  private logger = logger;


  /**
   * Setup services for multiple repositories (one instance per repo)
   */
  async setupRepositoryServices(sandbox: Sandbox, rootDir: string, repositories: Repository[]): Promise<RepositoryWithUrls[]> {
    console.log('🔍 DEBUG: setupRepositoryServices input order:', repositories.map((r, i) => ({ 
      index: i, 
      name: r.name,
      id: r.id,
      sourceType: r.sourceType 
    })));
    this.logger.info(`Setting up services for ${repositories.length} repositories...`);
    
    const repositoriesWithUrls: RepositoryWithUrls[] = [];
    
    for (let i = 0; i < repositories.length; i++) {
      const repo = repositories[i];
      const ports = this.allocatePorts(i);
      const repoPath = `${rootDir}/projects/${repo.name.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
      
      console.log(`🔍 DEBUG: Repository[${i}] "${repo.name}" → Path: ${repoPath}, Ports: ${JSON.stringify(ports)}`);
      
      // Create startup scripts for this repository
      await this.createRepositoryScripts(sandbox, rootDir, repoPath, repo.name);
      
      // Start services for this repository (and wait for them to start)
      await this.startRepositoryServices(sandbox, rootDir, repoPath, repo.name, ports);
      
      // Wait a bit for services to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get preview URLs and tokens for this repository
      const urlsAndTokens = await this.getRepositoryUrls(sandbox, ports);
      
      repositoriesWithUrls.push({
        ...repo,
        urls: urlsAndTokens.urls,
        tokens: urlsAndTokens.tokens
      });
      
      this.logger.success(`Services started for ${repo.name} - VSCode: ${ports.vscode}, Terminal: ${ports.terminal}, Claude: ${ports.claude}, Gemini: ${ports.gemini}`);
    }
    
    // Wait for all services to fully initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify all services
    await this.verifyRepositoryServices(sandbox, rootDir, repositoriesWithUrls);
    
    console.log('🔍 DEBUG: setupRepositoryServices output order:', repositoriesWithUrls.map((r, i) => ({ 
      index: i, 
      name: r.name,
      id: r.id,
      ports: PortManager.getPortsForSlot(i),
      urls: r.urls 
    })));
    
    return repositoriesWithUrls;
  }

  private allocatePorts(index: number): { vscode: number; terminal: number; claude: number; gemini: number } {
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
    
    // Create Gemini startup script for this repository with tmux
    const geminiScript = TmuxScriptGenerator.generateGeminiScript(repoPath, repoName);
    const geminiScriptPath = `/tmp/start-gemini-${repoName}.sh`;
    await sandbox.process.executeCommand(
      TmuxScriptGenerator.generateScriptCreationCommand(geminiScript, geminiScriptPath),
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
    ports: { vscode: number; terminal: number; claude: number; gemini: number }
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
      ),
      
      // Start Gemini for this repository
      sandbox.process.executeCommand(
        `nohup ttyd --port ${ports.gemini} --writable -t 'theme=${TTYD_THEME}' /tmp/start-gemini-${repoName}.sh > /tmp/ttyd-gemini-${repoName}.log 2>&1 & echo "gemini started for ${repoName}"`,
        rootDir
      )
    ];
    
    await Promise.all(servicePromises);
    this.logger.info(`Started services for ${repoName} on ports ${ports.vscode}, ${ports.terminal}, ${ports.claude}, ${ports.gemini}`);
  }

  private async getRepositoryUrls(sandbox: Sandbox, ports: { vscode: number; terminal: number; claude: number; gemini: number }): Promise<{ 
    urls: { vscode: string; terminal: string; claude: string; gemini: string };
    tokens: { vscode: string | null; terminal: string | null; claude: string | null; gemini: string | null };
  }> {
    const [vscodeInfo, terminalInfo, claudeInfo, geminiInfo] = await Promise.all([
      sandbox.getPreviewLink(ports.vscode),
      sandbox.getPreviewLink(ports.terminal),
      sandbox.getPreviewLink(ports.claude),
      sandbox.getPreviewLink(ports.gemini)
    ]);
    
    return {
      urls: {
        vscode: vscodeInfo.url,
        terminal: terminalInfo.url,
        claude: claudeInfo.url,
        gemini: geminiInfo.url
      },
      tokens: {
        vscode: vscodeInfo.token || null,
        terminal: terminalInfo.token || null,
        claude: claudeInfo.token || null,
        gemini: geminiInfo.token || null
      }
    };
  }

  private async verifyRepositoryServices(sandbox: Sandbox, rootDir: string, repositories: RepositoryWithUrls[]): Promise<void> {
    const allPorts = repositories.flatMap(repo => {
      const vscodePort = new URL(repo.urls.vscode).hostname.split('-')[0];
      const terminalPort = new URL(repo.urls.terminal).hostname.split('-')[0];
      const claudePort = new URL(repo.urls.claude).hostname.split('-')[0];
      const geminiPort = new URL(repo.urls.gemini).hostname.split('-')[0];
      return [vscodePort, terminalPort, claudePort, geminiPort];
    }).join('|');
    
    await sandbox.process.executeCommand(
      `netstat -tlnp | grep -E "(${allPorts})" > /dev/null`,
      rootDir
    );
    
    this.logger.success(`All services verified for ${repositories.length} repositories`);
  }



}