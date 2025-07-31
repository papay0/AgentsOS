import { Daytona, Sandbox } from '@daytonaio/sdk';
import { SandboxState } from '@daytonaio/api-client';
import type { CreateWorkspaceResponse } from '@/types/workspace';
import { logger, type WorkspaceLogData, type ErrorLogData } from './logger';
import { WorkspaceInstaller } from './workspace-installer';
import { WorkspaceServices } from './workspace-services';

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
  private installer: WorkspaceInstaller;
  private services: WorkspaceServices;

  constructor(apiKey: string) {
    this.daytona = new Daytona({ apiKey });
    this.installer = new WorkspaceInstaller();
    this.services = new WorkspaceServices();
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
      await this.installer.installSystemPackages(sandbox, rootDir);
      await this.installer.installTtyd(sandbox, rootDir);
      await this.installer.installCodeServer(sandbox, rootDir);
      await this.installer.installClaudeCode(sandbox, rootDir);
      
      // Set up services
      await this.services.setupServices(sandbox, rootDir);
      
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
          await this.services.restartServices(sandbox, rootDir);
        }
      } catch {
        this.logger.warn('Services not responding, starting them...');
        await this.services.restartServices(sandbox, rootDir);
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

  async listWorkspaces(labels?: Record<string, string>): Promise<Sandbox[]> {
    try {
      this.logger.info('Fetching workspace list...');
      const sandboxes = await this.daytona.list(labels);
      
      this.logger.success(`Found ${sandboxes.length} workspaces`);
      
      // Sort by state (started first, then by creation date)
      return sandboxes.sort((a, b) => {
        // State priority: started > stopped > other states
        const stateOrder: Record<string, number> = {
          'started': 0,
          'starting': 1,
          'stopping': 2,
          'stopped': 3,
          'error': 4,
          'pending_build': 5,
          'building_snapshot': 6,
        };
        
        const aOrder = stateOrder[a.state || 'unknown'] ?? 4;
        const bOrder = stateOrder[b.state || 'unknown'] ?? 4;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // If same state, sort by creation date (newest first)
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
      });
    } catch (error) {
      const errorData: ErrorLogData = {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_LIST_FAILED'
      };
      this.logger.logError('Failed to list workspaces', errorData);
      throw new Error(`Failed to list workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopWorkspace(sandboxId: string): Promise<void> {
    try {
      this.logger.workspace.starting(`Stopping workspace ${sandboxId}`);
      
      const sandbox = await this.daytona.get(sandboxId);
      
      if (sandbox.state !== SandboxState.STARTED) {
        this.logger.warn(`Workspace ${sandboxId} is not running (current state: ${sandbox.state})`);
        return;
      }

      await sandbox.stop();
      
      this.logger.success(`Workspace ${sandboxId} stopped successfully`);
    } catch (error) {
      const errorData: ErrorLogData = {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_STOP_FAILED',
        details: { sandboxId }
      };
      this.logger.logError('Failed to stop workspace', errorData);
      throw new Error(`Failed to stop workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}