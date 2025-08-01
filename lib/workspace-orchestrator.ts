import { Sandbox } from '@daytonaio/sdk';
import { logger, type ErrorLogData } from './logger';
import { WorkspaceServices } from './workspace-services';

// Handles complex workspace orchestration (starting services, health checks, restarts)
export class WorkspaceOrchestrator {
  private logger = logger;
  private services: WorkspaceServices;

  constructor() {
    this.services = new WorkspaceServices();
  }

  async startWorkspaceAndServices(sandbox: Sandbox): Promise<{
    success: boolean;
    message: string;
    urls?: {
      vscodeUrl: string;
      terminalUrl: string;
      claudeTerminalUrl: string;
    };
  }> {
    try {
      this.logger.workspace.creating(`Starting workspace ${sandbox.id}`);
      
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

      // Ensure project directory exists
      const projectDir = `${rootDir}/project`;
      await sandbox.process.executeCommand(`mkdir -p ${projectDir}`, rootDir);
      this.logger.info(`Ensured project directory exists: ${projectDir}`);

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
          await this.services.restartServices(sandbox, rootDir, projectDir);
        }
      } catch {
        this.logger.warn('Services not responding, starting them...');
        await this.services.restartServices(sandbox, rootDir, projectDir);
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
        details: { sandboxId: sandbox.id }
      };
      this.logger.logError('Error starting workspace', errorData);
      return {
        success: false,
        message: `Failed to start workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createProjectDirectory(sandbox: Sandbox, rootDir: string): Promise<string> {
    const projectDir = `${rootDir}/project`;
    await sandbox.process.executeCommand(`mkdir -p ${projectDir}`, rootDir);
    this.logger.info(`Created project directory: ${projectDir}`);
    return projectDir;
  }
}