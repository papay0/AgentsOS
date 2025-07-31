import { Daytona, Sandbox, SandboxState } from '@daytonaio/sdk';
import type { CreateWorkspaceResponse } from '@/types/workspace';
import { logger, type WorkspaceLogData, type ErrorLogData } from './logger';

interface WorkspaceSetupOptions {
  resources?: {
    cpu: number;
    memory: number;
  };
}

// Daytona client for managing workspaces with VSCode and terminals
export class DaytonaClient {
  private daytona: Daytona;
  private logger = logger;

  private static readonly TTYD_THEME = JSON.stringify({
    background: "#ffffff",
    foreground: "#000000",
    cursor: "#000000",
    selectionBackground: "#316AC5",
    black: "#000000",
    red: "#C91B00",
    green: "#00C200",
    yellow: "#C7C400",
    blue: "#0037DA",
    magenta: "#C800C8",
    cyan: "#00C5C7",
    white: "#C7C7C7",
    brightBlack: "#686868",
    brightRed: "#FF6D6B",
    brightGreen: "#6BC46D",
    brightYellow: "#F9F871",
    brightBlue: "#6B9EFF",
    brightMagenta: "#FF6BFF",
    brightCyan: "#6BFFFF",
    brightWhite: "#FFFFFF"
  });

  constructor(apiKey: string) {
    this.daytona = new Daytona({ apiKey });
  }

  async createWorkspace(options: WorkspaceSetupOptions = {}): Promise<CreateWorkspaceResponse> {
    try {
      this.logger.workspace.creating();
      // Create sandbox with specified resources
      const sandbox = await this.daytona.create({
        public: true,
        image: "node:20",
        resources: {
          cpu: options.resources?.cpu || 2,
          memory: options.resources?.memory || 4
        }
      });
      
      const rootDir = await sandbox.getUserRootDir();
      if (!rootDir) {
        throw new Error('Failed to get sandbox root directory');
      }
      
      // Install all required packages
      await this.installSystemPackages(sandbox, rootDir);
      await this.installTtyd(sandbox, rootDir);
      await this.installCodeServer(sandbox, rootDir);
      await this.installClaudeCode(sandbox, rootDir);
      
      // Set up services
      await this.setupServices(sandbox, rootDir);
      
      // Get service URLs
      const [terminalInfo, claudeTerminalInfo, vscodeInfo] = await Promise.all([
        sandbox.getPreviewLink(9999),
        sandbox.getPreviewLink(9998),
        sandbox.getPreviewLink(8080)
      ]);
      
      const workspaceData: WorkspaceLogData = {
        sandboxId: sandbox.id,
        image: 'node:20',
        resources: {
          cpu: options.resources?.cpu || 2,
          memory: options.resources?.memory || 4
        },
        urls: {
          vscode: vscodeInfo.url,
          terminal: terminalInfo.url,
          claude: claudeTerminalInfo.url
        }
      };
      
      this.logger.logWorkspace('VSCode + Terminal ready! 🚀', workspaceData);
      
      return {
        sandboxId: sandbox.id,
        terminalUrl: terminalInfo.url,
        claudeTerminalUrl: claudeTerminalInfo.url,
        vscodeUrl: vscodeInfo.url,
        message: 'VSCode + Terminal ready! 🚀'
      };
    } catch (error) {
      const errorData: ErrorLogData = {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_CREATION_FAILED',
        details: {
          cpu: options.resources?.cpu || 2,
          memory: options.resources?.memory || 4,
          image: 'node:20'
        }
      };
      this.logger.logError('Failed to create workspace', errorData);
      throw new Error(`Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async installSystemPackages(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.installing('system packages (curl, wget, git)');
    const result = await sandbox.process.executeCommand(
      `apt-get update -qq && apt-get install -y -qq curl wget git net-tools`,
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

  private async installTtyd(sandbox: Sandbox, rootDir: string): Promise<void> {
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

  private async installCodeServer(sandbox: Sandbox, rootDir: string): Promise<void> {
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

  private async installClaudeCode(sandbox: Sandbox, rootDir: string): Promise<void> {
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

  private async setupServices(sandbox: Sandbox, rootDir: string): Promise<void> {
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

  private async startCodeServer(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.starting('VSCode server');
    await sandbox.process.executeCommand(
      `nohup code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry ${rootDir} > /tmp/code-server.log 2>&1 & echo "code-server started"`,
      rootDir
    );
  }

  private async startBashTerminal(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.starting('bash terminal');
    await sandbox.process.executeCommand(
      `nohup ttyd --port 9999 --writable -t 'theme=${DaytonaClient.TTYD_THEME}' bash > /tmp/ttyd.log 2>&1 & echo "ttyd started"`,
      rootDir
    );
  }

  private async startClaudeTerminal(sandbox: Sandbox, rootDir: string): Promise<void> {
    this.logger.workspace.starting('Claude terminal');
    await sandbox.process.executeCommand(
      `nohup ttyd --port 9998 --writable -t 'theme=${DaytonaClient.TTYD_THEME}' /tmp/start-claude.sh > /tmp/ttyd-claude.log 2>&1 & echo "claude ttyd started"`,
      rootDir
    );
  }


  private async verifyServices(sandbox: Sandbox, rootDir: string): Promise<void> {
    // Silent verification - just check if ports are listening
    await sandbox.process.executeCommand(
      `netstat -tlnp | grep -E "(8080|9998|9999)" > /dev/null`,
      rootDir
    );
  }

  private async healthCheckServices(sandbox: Sandbox, rootDir: string): Promise<void> {
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
           nohup ttyd --port 9999 --writable -t 'theme=${DaytonaClient.TTYD_THEME}' bash > /tmp/ttyd.log 2>&1 & 
           nohup ttyd --port 9998 --writable -t 'theme=${DaytonaClient.TTYD_THEME}' /tmp/start-claude.sh > /tmp/ttyd-claude.log 2>&1 &`,
          rootDir
        );
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    this.logger.warn(`Health check failed after ${maxRetries} attempts`);
  }

  async getWorkspaceStatus(sandboxId: string): Promise<{
    status: SandboxState | 'error';
    servicesHealthy: boolean;
    message: string;
  }> {
    try {
      this.logger.workspace.checking(`workspace status for ${sandboxId}`);
      
      // Get sandbox info
      const sandbox = await this.daytona.get(sandboxId);
      const sandboxStatus = sandbox.state;
      
      this.logger.debug(`Sandbox status: ${sandboxStatus}`);
      
      // If sandbox is not started, return early
      if (sandboxStatus !== 'started') {
        return {
          status: sandboxStatus || 'error',
          servicesHealthy: false,
          message: `Container is ${sandboxStatus || 'unknown'}`
        };
      }

      // Check if services are healthy
      try {
        const rootDir = await sandbox.getUserRootDir();
        if (!rootDir) {
          throw new Error('Could not get root directory');
        }

        const healthCheck = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 && echo "" && 
           curl -s -o /dev/null -w "%{http_code}" http://localhost:9999 && echo "" && 
           curl -s -o /dev/null -w "%{http_code}" http://localhost:9998`,
          rootDir,
          undefined,
          10000
        );

        const servicesHealthy = healthCheck.result.includes('200');
        this.logger.debug(`Services healthy: ${servicesHealthy}`);

        return {
          status: 'started',
          servicesHealthy,
          message: servicesHealthy ? 'All services running' : 'Services need restart'
        };

      } catch (serviceError) {
        const errorData: ErrorLogData = {
          error: serviceError instanceof Error ? serviceError : String(serviceError),
          code: 'SERVICE_CHECK_FAILED'
        };
        this.logger.logError('Service check failed', errorData);
        return {
          status: 'started',
          servicesHealthy: false,
          message: 'Services not responding'
        };
      }

    } catch (error) {
      const errorData: ErrorLogData = {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_STATUS_CHECK_FAILED',
        details: { sandboxId }
      };
      this.logger.logError('Error checking workspace status', errorData);
      return {
        status: 'error',
        servicesHealthy: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async startWorkspaceAndServices(sandboxId: string): Promise<{
    success: boolean;
    message: string;
    urls?: {
      vscodeUrl: string;
      terminalUrl: string;
      claudeTerminalUrl: string;
    };
  }> {
    try {
      this.logger.workspace.creating(`Starting workspace ${sandboxId}`);
      
      const sandbox = await this.daytona.get(sandboxId);
      
      // Start the sandbox if it's not started
      if (sandbox.state !== 'started') {
        this.logger.workspace.starting('container');
        await sandbox.start();
        
        // Wait for container to be ready
        this.logger.info('⏳ Waiting for container to be ready...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      // Get root directory
      const rootDir = await sandbox.getUserRootDir();
      if (!rootDir) {
        throw new Error('Failed to get sandbox root directory');
      }

      // Check if services are already running
      this.logger.workspace.checking('if services are already running');
      try {
        const healthCheck = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 && echo "" && 
           curl -s -o /dev/null -w "%{http_code}" http://localhost:9999 && echo "" && 
           curl -s -o /dev/null -w "%{http_code}" http://localhost:9998`,
          rootDir,
          undefined,
          10000
        );

        if (healthCheck.result.includes('200')) {
          this.logger.success('Services already running');
        } else {
          this.logger.workspace.starting('services');
          await this.restartServices(sandbox, rootDir);
        }
      } catch {
        this.logger.warn('Services not responding, starting them...');
        await this.restartServices(sandbox, rootDir);
      }

      // Get service URLs
      const [terminalInfo, claudeTerminalInfo, vscodeInfo] = await Promise.all([
        sandbox.getPreviewLink(9999),
        sandbox.getPreviewLink(9998),
        sandbox.getPreviewLink(8080)
      ]);

      return {
        success: true,
        message: 'Workspace started successfully',
        urls: {
          vscodeUrl: vscodeInfo.url,
          terminalUrl: terminalInfo.url,
          claudeTerminalUrl: claudeTerminalInfo.url
        }
      };

    } catch (error) {
      const errorData: ErrorLogData = {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_START_FAILED',
        details: { sandboxId }
      };
      this.logger.logError('Error starting workspace', errorData);
      return {
        success: false,
        message: `Failed to start workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async restartServices(sandbox: Sandbox, rootDir: string): Promise<void> {
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