import { Daytona, Sandbox } from '@daytonaio/sdk';
import { SandboxState } from '@daytonaio/api-client';
import { logger } from './logger';
import { PortManager } from './port-manager';

// Handles basic workspace lifecycle operations (start, stop, list, get status)
export class WorkspaceManager {
  private daytona: Daytona;
  private logger = logger;

  constructor(apiKey: string) {
    this.daytona = new Daytona({ apiKey });
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

        const ports = PortManager.getPortsForSlot(0);
        const healthCheck = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${ports.vscode} && echo "" && 
           curl -s -o /dev/null -w "%{http_code}" http://localhost:${ports.terminal} && echo "" && 
           curl -s -o /dev/null -w "%{http_code}" http://localhost:${ports.claude}`,
          rootDir,
          undefined,
          10000
        );

        const servicesHealthy = healthCheck.result.includes('200') || healthCheck.result.includes('302') || healthCheck.result.includes('301');
        this.logger.debug(`Services healthy: ${servicesHealthy}`);

        return {
          status: 'started',
          servicesHealthy,
          message: servicesHealthy ? 'All services running' : 'Services need restart'
        };

      } catch (serviceError) {
        const errorData= {
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
      const errorData= {
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
      const errorData= {
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
      const errorData= {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_STOP_FAILED',
        details: { sandboxId }
      };
      this.logger.logError('Failed to stop workspace', errorData);
      throw new Error(`Failed to stop workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteWorkspace(sandboxId: string): Promise<void> {
    try {
      this.logger.workspace.starting(`Deleting workspace ${sandboxId}`);
      
      const sandbox = await this.daytona.get(sandboxId);
      await sandbox.delete();
      
      this.logger.success(`Workspace ${sandboxId} deleted successfully`);
    } catch (error) {
      const errorData= {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_DELETE_FAILED',
        details: { sandboxId }
      };
      this.logger.logError('Failed to delete workspace', errorData);
      throw new Error(`Failed to delete workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSandbox(sandboxId: string): Promise<Sandbox> {
    return await this.daytona.get(sandboxId);
  }

  async createSandbox(options: {
    cpu: number;
    memory: number;
    disk: number;
  }): Promise<Sandbox> {
    return await this.daytona.create({
      public: true,
      image: "node:20",
      resources: {
        cpu: options.cpu,
        memory: options.memory,
        disk: options.disk
      }
    });
  }

  async getWorkspaceUrls(sandboxId: string): Promise<{
    terminalUrl: string;
    claudeTerminalUrl: string;
    vscodeUrl: string;
  }> {
    try {
      const sandbox = await this.daytona.get(sandboxId);
      
      // Get the preview links for each service
      const ports = PortManager.getPortsForSlot(0);
      const [terminalInfo, claudeTerminalInfo, vscodeInfo] = await Promise.all([
        sandbox.getPreviewLink(ports.terminal),
        sandbox.getPreviewLink(ports.claude),
        sandbox.getPreviewLink(ports.vscode)
      ]);
      
      return {
        terminalUrl: terminalInfo.url,
        claudeTerminalUrl: claudeTerminalInfo.url,
        vscodeUrl: vscodeInfo.url
      };
    } catch (error) {
      const errorData= {
        error: error instanceof Error ? error : String(error),
        code: 'GET_URLS_FAILED',
        details: { sandboxId }
      };
      this.logger.logError('Failed to get workspace URLs', errorData);
      throw error;
    }
  }
}