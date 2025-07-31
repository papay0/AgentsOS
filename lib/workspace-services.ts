import { Sandbox } from '@daytonaio/sdk';
import { logger } from './logger';
import { TTYD_THEME } from './workspace-constants';

export class WorkspaceServices {
  private logger = logger;

  async setupServices(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.info('Setting up services...');
    
    // Create Claude startup script first
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\necho "Starting Claude Code CLI..."\ncd ${rootDir}\nclaude\n' > /tmp/start-claude.sh && chmod +x /tmp/start-claude.sh`,
      rootDir
    );

    // Start all services in parallel
    await Promise.all([
      this.startCodeServer(sandbox, rootDir),
      this.startBashTerminal(sandbox, rootDir),
      this.startClaudeTerminal(sandbox, rootDir)
    ]);

    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    await this.verifyServices(sandbox, rootDir);
    
    // Health check - retry service startup if needed
    await this.healthCheckServices(sandbox, rootDir);
  }

  async startCodeServer(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.starting('VSCode server');
    await sandbox.process.executeCommand(
      `nohup code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry ${rootDir} > /tmp/code-server.log 2>&1 & echo "code-server started"`,
      rootDir
    );
  }

  async startBashTerminal(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.starting('bash terminal');
    await sandbox.process.executeCommand(
      `nohup ttyd --port 9999 --writable -t 'theme=${TTYD_THEME}' bash > /tmp/ttyd.log 2>&1 & echo "ttyd started"`,
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
      
      if (healthCheck.result.includes('200')) {
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
           nohup ttyd --port 9999 --writable -t 'theme=${TTYD_THEME}' bash > /tmp/ttyd.log 2>&1 & 
           nohup ttyd --port 9998 --writable -t 'theme=${TTYD_THEME}' /tmp/start-claude.sh > /tmp/ttyd-claude.log 2>&1 &`,
          rootDir
        );
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    this.logger.warn(`Health check failed after ${maxRetries} attempts`);
  }

  async restartServices(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.starting('restarting services');
    
    // Kill existing services
    await sandbox.process.executeCommand(
      `pkill -f "code-server" || true; pkill -f "ttyd" || true`,
      rootDir
    );

    // Wait a moment for processes to die
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Recreate Claude startup script
    await sandbox.process.executeCommand(
      `echo '#!/bin/bash\\necho "Starting Claude Code CLI..."\\ncd ${rootDir}\\nclaude\\n' > /tmp/start-claude.sh && chmod +x /tmp/start-claude.sh`,
      rootDir
    );

    // Start all services
    await Promise.all([
      this.startCodeServer(sandbox, rootDir),
      this.startBashTerminal(sandbox, rootDir),
      this.startClaudeTerminal(sandbox, rootDir)
    ]);

    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify services are running
    await this.verifyServices(sandbox, rootDir);
    
    this.logger.success('Services restarted successfully');
  }
}