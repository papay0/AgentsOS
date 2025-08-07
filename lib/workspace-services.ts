import { Sandbox } from '@daytonaio/sdk';
import { logger } from './logger';
import { TTYD_THEME } from './workspace-constants';
import { PortManager } from './port-manager';
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

  async setupServices(sandbox: Sandbox, rootDir: string, projectDir: string): Promise<void> {
    this.logger.info('Setting up services...');
    
    // Create startup scripts
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\ncd ${projectDir}\nclaude' > /tmp/start-claude.sh && chmod +x /tmp/start-claude.sh`,
      rootDir
    );
    
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\ncd ${projectDir}\nexec zsh' > /tmp/start-zsh.sh && chmod +x /tmp/start-zsh.sh`,
      rootDir
    );

    // Start all services in parallel
    await Promise.all([
      this.startCodeServer(sandbox, rootDir, projectDir),
      this.startZshTerminal(sandbox, rootDir, projectDir),
      this.startClaudeTerminal(sandbox, rootDir)
    ]);

    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    await this.verifyServices(sandbox, rootDir);
    
    // Health check - retry service startup if needed
    await this.healthCheckServices(sandbox, rootDir);
  }

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
    // Create Claude startup script for this repository
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\ncd ${repoPath}\nclaude' > /tmp/start-claude-${repoName}.sh && chmod +x /tmp/start-claude-${repoName}.sh`,
      rootDir
    );
    
    // Create zsh startup script for this repository
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\ncd ${repoPath}\nexec zsh' > /tmp/start-zsh-${repoName}.sh && chmod +x /tmp/start-zsh-${repoName}.sh`,
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

  async startCodeServer(sandbox: Sandbox, rootDir: string, projectDir: string): Promise<void> {
    this.logger.workspace.starting('VSCode server');
    await sandbox.process.executeCommand(
      `nohup code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry ${projectDir} > /tmp/code-server.log 2>&1 & echo "code-server started"`,
      rootDir
    );
  }

  async startZshTerminal(sandbox: Sandbox, rootDir: string, projectDir: string): Promise<void> {
    this.logger.workspace.starting('zsh terminal');
    
    // Create a startup script that changes to project directory
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\ncd ${projectDir}\nexec zsh' > /tmp/start-zsh.sh && chmod +x /tmp/start-zsh.sh`,
      rootDir
    );
    
    await sandbox.process.executeCommand(
      `nohup ttyd --port 9999 --writable -t 'theme=${TTYD_THEME}' /tmp/start-zsh.sh > /tmp/ttyd.log 2>&1 & echo "ttyd started"`,
      rootDir
    );
  }

  async startClaudeTerminal(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.starting('Claude terminal');
    await sandbox.process.executeCommand(
      `nohup ttyd --port 9998 --writable -t 'theme=${TTYD_THEME}' /tmp/start-claude.sh > /tmp/ttyd-claude.log 2>&1 & echo "claude ttyd started"`,
      rootDir
    );
  }

  async verifyServices(sandbox: Sandbox, rootDir: string): Promise<void> {
    // Silent verification - just check if ports are listening
    await sandbox.process.executeCommand(
      `netstat -tlnp | grep -E "(8080|9998|9999)" > /dev/null`,
      rootDir
    );
  }

  async healthCheckServices(sandbox: Sandbox, rootDir: string): Promise<void> {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      const healthCheck = await sandbox.process.executeCommand(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:9999 && echo "" && 
         curl -s -o /dev/null -w "%{http_code}" http://localhost:9998 && echo "" && 
         curl -s -o /dev/null -w "%{http_code}" http://localhost:8080`,
        rootDir,
        undefined,
        15000
      );
      
      // Accept 200, 302, and 301 as healthy responses
      if (healthCheck.result.includes('200') || healthCheck.result.includes('302') || healthCheck.result.includes('301')) {
        this.logger.success('All services are healthy');
        return;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        this.logger.workspace.retry(retryCount, maxRetries);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try restarting services
        this.logger.info('Attempting to restart services...');
        await sandbox.process.executeCommand(
          `pkill ttyd; pkill code-server; sleep 2 && 
           nohup code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry ${rootDir} > /tmp/code-server.log 2>&1 & 
           nohup ttyd --port 9999 --writable -t 'theme=${TTYD_THEME}' /tmp/start-zsh.sh > /tmp/ttyd.log 2>&1 & 
           nohup ttyd --port 9998 --writable -t 'theme=${TTYD_THEME}' /tmp/start-claude.sh > /tmp/ttyd-claude.log 2>&1 &`,
          rootDir
        );
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    this.logger.warn(`Health check failed after ${maxRetries} attempts`);
  }

  async restartServices(sandbox: Sandbox, rootDir: string, projectDir: string): Promise<void> {
    this.logger.workspace.starting('restarting services');
    
    // Kill existing services
    await sandbox.process.executeCommand(
      `pkill -f "code-server" || true; pkill -f "ttyd" || true`,
      rootDir
    );

    // Wait a moment for processes to die
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Recreate startup scripts
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\ncd ${projectDir}\nclaude' > /tmp/start-claude.sh && chmod +x /tmp/start-claude.sh`,
      rootDir
    );
    
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\ncd ${projectDir}\nexec zsh' > /tmp/start-zsh.sh && chmod +x /tmp/start-zsh.sh`,
      rootDir
    );

    // Start all services
    await Promise.all([
      this.startCodeServer(sandbox, rootDir, projectDir),
      this.startZshTerminal(sandbox, rootDir, projectDir),
      this.startClaudeTerminal(sandbox, rootDir)
    ]);

    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify services are running
    await this.verifyServices(sandbox, rootDir);
    
    this.logger.success('Services restarted successfully');
  }
}