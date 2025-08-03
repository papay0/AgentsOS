import type { CreateWorkspaceResponse, RepositoryWithUrls } from '@/types/workspace';
import { logger, type WorkspaceLogData, type ErrorLogData } from './logger';
import { WorkspaceManager } from './workspace-manager';
import { WorkspaceInstaller } from './workspace-installer';
import { WorkspaceServices } from './workspace-services';
import { WorkspaceOrchestrator } from './workspace-orchestrator';
import { trackWorkspaceCreated } from './analytics';
import { Sandbox } from '@daytonaio/sdk';

interface Repository {
  url: string;
  name: string;
  description?: string;
  tech?: string;
  urls?: {
    vscode: string;
    terminal: string;
    claude: string;
  };
}

interface WorkspaceSetupOptions {
  repositories?: Repository[];
  workspaceName?: string;
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
      
      // Clone repositories if provided
      if (options.repositories && options.repositories.length > 0) {
        this.logger.workspace.creating(`Cloning ${options.repositories.length} repositories`);
        await this.cloneRepositories(sandbox, projectDir, options.repositories);
      }
      
      // Install all required packages
      await this.installer.installSystemPackages(sandbox, rootDir);
      await this.installer.installTtyd(sandbox, rootDir);
      await this.installer.installCodeServer(sandbox, rootDir);
      await this.installer.installClaudeCode(sandbox, rootDir);
      
      // Set up services for each repository (separate instances)
      let repositoriesWithUrls: RepositoryWithUrls[] = [];
      if (options.repositories && options.repositories.length > 0) {
        repositoriesWithUrls = await this.services.setupRepositoryServices(sandbox, rootDir, options.repositories);
      } else {
        // Fallback to old method if no repositories specified
        await this.services.setupServices(sandbox, rootDir, projectDir);
        
        // Get service URLs for legacy mode
        const [terminalInfo, claudeTerminalInfo, vscodeInfo] = await Promise.all([
          sandbox.getPreviewLink(9999),
          sandbox.getPreviewLink(9998),
          sandbox.getPreviewLink(8080)
        ]);
        
        // Create a default repository entry
        repositoriesWithUrls = [{
          url: '',
          name: 'Default',
          urls: {
            vscode: vscodeInfo.url,
            terminal: terminalInfo.url,
            claude: claudeTerminalInfo.url
          }
        }];
      }
      
      // Use the primary repository's URLs for legacy compatibility
      const primaryRepo = repositoriesWithUrls[0];
      
      if (!primaryRepo?.urls) {
        throw new Error('Primary repository missing URLs');
      }
      
      const workspaceData: WorkspaceLogData = {
        sandboxId: sandbox.id,
        image: 'node:20',
        resources: {
          cpu: options.resources?.cpu || 2,
          memory: options.resources?.memory || 4
        },
        urls: primaryRepo.urls
      };
      
      this.logger.logWorkspace(`🚀 Services ready for ${repositoriesWithUrls.length} repositories!`, workspaceData);
      
      // Track workspace creation
      trackWorkspaceCreated(sandbox.id);
      
      return {
        sandboxId: sandbox.id,
        terminalUrl: primaryRepo.urls.terminal,
        claudeTerminalUrl: primaryRepo.urls.claude,
        vscodeUrl: primaryRepo.urls.vscode,
        message: `🚀 Services ready for ${repositoriesWithUrls.length} repositories!`,
        repositories: repositoriesWithUrls
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

  private async cloneRepositories(sandbox: Sandbox, projectDir: string, repositories: Repository[]): Promise<void> {
    try {
      const clonedRepos: string[] = [];
      
      for (const repository of repositories) {
        this.logger.workspace.creating(`Cloning repository: ${repository.name}`);
        
        // Clone the repository into the project directory  
        // Escape folder name to handle spaces and special characters
        const safeFolderName = repository.name.replace(/[^a-zA-Z0-9-_]/g, '-');
        const cloneCommand = `cd "${projectDir}" && git clone "${repository.url}" "${safeFolderName}"`;
        
        this.logger.workspace.creating(`Executing: ${cloneCommand}`);
        
        const result = await sandbox.process.executeCommand(cloneCommand, projectDir);
        
        if (result.exitCode !== 0) {
          this.logger.workspace.creating(`Warning: Failed to clone ${repository.name}: Command failed`);
          continue; // Continue with other repositories even if one fails
        }
        
        this.logger.workspace.creating(`Successfully cloned ${repository.name}`);
        clonedRepos.push(safeFolderName);
      }
      
      if (clonedRepos.length === 0) {
        throw new Error('Failed to clone any repositories');
      }
      
      // Clean up any existing symlinks (legacy cleanup)
      await sandbox.process.executeCommand(`rm -f "${projectDir}/project"`, projectDir).catch(() => {
        // Ignore errors if symlink doesn't exist
      });
      
      // All repositories are now available directly in the projects directory
      
      this.logger.workspace.creating(`Successfully cloned ${clonedRepos.length}/${repositories.length} repositories`);
      
    } catch (error) {
      this.logger.logError(`Failed to clone repositories`, {
        error: error instanceof Error ? error : String(error),
        code: 'REPOSITORIES_CLONE_FAILED',
        details: {
          repositoryCount: repositories.length,
          projectDir
        }
      });
      throw new Error(`Failed to clone repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}