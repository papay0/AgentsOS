import { Daytona } from '@daytonaio/sdk';
import type { CreateWorkspaceResponse } from '@/types/workspace';
import type { DaytonaSandbox } from '@/types/daytona';

interface WorkspaceSetupOptions {
  resources?: {
    cpu: number;
    memory: number;
  };
}

// Daytona client for managing workspaces with VSCode and terminals
export class DaytonaClient {
  private daytona: Daytona;

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
      console.log('Creating workspace...');
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
      
      return {
        sandboxId: sandbox.id,
        terminalUrl: terminalInfo.url,
        claudeTerminalUrl: claudeTerminalInfo.url,
        vscodeUrl: vscodeInfo.url,
        message: 'VSCode + Terminal ready! 🚀'
      };
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw new Error(`Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async installSystemPackages(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Installing system packages...');
    const result = await sandbox.process.executeCommand(
      `apt-get update -qq && apt-get install -y -qq curl wget git net-tools`,
      rootDir,
      undefined,
      60000
    );
    
    if (result.exitCode !== 0) {
      throw new Error(`System packages installation failed: ${result.result}`);
    }
  }

  private async installTtyd(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Installing terminal (ttyd)...');
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
      throw new Error(`ttyd installation failed: ${result.result}`);
    }
  }

  private async installCodeServer(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Installing VSCode (code-server)...');
    const result = await sandbox.process.executeCommand(
      `curl -fsSL https://code-server.dev/install.sh | sh`,
      rootDir,
      undefined,
      120000
    );
    
    if (result.exitCode !== 0) {
      throw new Error(`code-server installation failed: ${result.result}`);
    }
  }

  private async installClaudeCode(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Installing Claude Code CLI...');
    const result = await sandbox.process.executeCommand(
      `npm install -g @anthropic-ai/claude-code`,
      rootDir,
      undefined,
      180000
    );
    
    if (result.exitCode !== 0) {
      console.log('Claude CLI installation failed, continuing without it');
      return;
    }
  }

  private async setupServices(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Setting up services...');
    
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

  private async startCodeServer(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Starting VSCode server...');
    await sandbox.process.executeCommand(
      `nohup code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry ${rootDir} > /tmp/code-server.log 2>&1 & echo "code-server started"`,
      rootDir
    );
  }

  private async startBashTerminal(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Starting bash terminal...');
    await sandbox.process.executeCommand(
      `nohup ttyd --port 9999 --writable -t 'theme=${DaytonaClient.TTYD_THEME}' bash > /tmp/ttyd.log 2>&1 & echo "ttyd started"`,
      rootDir
    );
  }

  private async startClaudeTerminal(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    console.log('Starting Claude terminal...');
    await sandbox.process.executeCommand(
      `nohup ttyd --port 9998 --writable -t 'theme=${DaytonaClient.TTYD_THEME}' /tmp/start-claude.sh > /tmp/ttyd-claude.log 2>&1 & echo "claude ttyd started"`,
      rootDir
    );
  }


  private async verifyServices(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
    // Silent verification - just check if ports are listening
    await sandbox.process.executeCommand(
      `netstat -tlnp | grep -E "(8080|9998|9999)" > /dev/null`,
      rootDir
    );
  }

  private async healthCheckServices(sandbox: DaytonaSandbox, rootDir: string): Promise<void> {
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
        return;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try restarting services
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
  }
}