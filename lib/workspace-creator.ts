import type { CreateWorkspaceResponse } from '@/types/workspace';
import { logger, type WorkspaceLogData, type ErrorLogData } from './logger';
import { WorkspaceManager } from './workspace-manager';
import { WorkspaceInstaller } from './workspace-installer';
import { WorkspaceServices } from './workspace-services';
import { WorkspaceOrchestrator } from './workspace-orchestrator';

interface WorkspaceSetupOptions {
  resources?: {
    cpu: number;
    memory: number;
  };
}

// Handles the complete workspace creation process
export class WorkspaceCreator {
  private logger = logger;
  private manager: WorkspaceManager;
  private installer: WorkspaceInstaller;
  private services: WorkspaceServices;
  private orchestrator: WorkspaceOrchestrator;

  constructor(apiKey: string) {
    this.manager = new WorkspaceManager(apiKey);
    this.installer = new WorkspaceInstaller();
    this.services = new WorkspaceServices();
    this.orchestrator = new WorkspaceOrchestrator();
  }

  async createWorkspace(options: WorkspaceSetupOptions = {}): Promise<CreateWorkspaceResponse> {
    try {
      this.logger.workspace.creating();
      
      // Create sandbox with specified resources
      const sandbox = await this.manager.createSandbox({
        cpu: options.resources?.cpu || 2,
        memory: options.resources?.memory || 4
      });
      
      const rootDir = await sandbox.getUserRootDir();
      if (!rootDir) {
        throw new Error('Failed to get sandbox root directory');
      }
      
      // Create project directory
      const projectDir = await this.orchestrator.createProjectDirectory(sandbox, rootDir);
      
      // Install all required packages
      await this.installer.installSystemPackages(sandbox, rootDir);
      await this.installer.installTtyd(sandbox, rootDir);
      await this.installer.installCodeServer(sandbox, rootDir);
      await this.installer.installClaudeCode(sandbox, rootDir);
      
      // Set up services with project directory
      await this.services.setupServices(sandbox, rootDir, projectDir);
      
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
}