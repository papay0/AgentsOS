import type { CreateWorkspaceResponse, RepositoryWithUrls, Repository, UserWorkspace } from '@/types/workspace';
import { logger, type WorkspaceLogData } from './logger';
import { WorkspaceManager } from './workspace-manager';
import { WorkspaceInstaller } from './workspace-installer';
import { WorkspaceServices } from './workspace-services';
import { PortManager } from './port-manager';
import { trackWorkspaceCreated } from './analytics';
import { Sandbox } from '@daytonaio/sdk';
import { DEFAULT_WORKSPACE_RESOURCES } from './workspace-defaults';

interface WorkspaceSetupOptions {
  repositories?: Repository[];
  workspaceName?: string;
  resources?: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

// Handles the complete workspace creation process
export class WorkspaceCreator {
  private logger = logger;
  private manager: WorkspaceManager;
  private installer: WorkspaceInstaller;
  private services: WorkspaceServices;

  constructor(apiKey: string) {
    this.manager = new WorkspaceManager(apiKey);
    this.installer = new WorkspaceInstaller();
    this.services = new WorkspaceServices();
  }

  private async createProjectDirectory(sandbox: Sandbox, rootDir: string): Promise<string> {
    const projectDir = `${rootDir}/projects`;
    await sandbox.process.executeCommand(`mkdir -p ${projectDir}`, rootDir);
    this.logger.info(`Created projects directory: ${projectDir}`);
    return projectDir;
  }

  async createWorkspace(options: WorkspaceSetupOptions = {}): Promise<CreateWorkspaceResponse> {
    try {
      this.logger.workspace.creating();
      
      // Create sandbox with specified resources
      const sandbox = await this.manager.createSandbox({
        cpu: options.resources?.cpu || DEFAULT_WORKSPACE_RESOURCES.cpu,
        memory: options.resources?.memory || DEFAULT_WORKSPACE_RESOURCES.memory,
        disk: options.resources?.disk || DEFAULT_WORKSPACE_RESOURCES.disk
      });
      
      const rootDir = await sandbox.getUserRootDir();
      if (!rootDir) {
        throw new Error('Failed to get sandbox root directory');
      }
      
      // Create project directory
      const projectDir = await this.createProjectDirectory(sandbox, rootDir);
      
      // Clone repositories if provided
      if (options.repositories && options.repositories.length > 0) {
        this.logger.workspace.creating(`Cloning ${options.repositories.length} repositories`);
        await this.cloneRepositories(sandbox, projectDir, options.repositories);
      }
      
      // Install all required packages
      await this.installer.installSystemPackages(sandbox, rootDir);
      await this.installer.installGitHubCLI(sandbox, rootDir);
      await this.installer.installTtyd(sandbox, rootDir);
      await this.installer.installCodeServer(sandbox, rootDir);
      await this.installer.ensureCLITools(sandbox, rootDir); // This handles Claude + Gemini + future CLIs
      await this.installer.installOhMyZsh(sandbox, rootDir);
      
      // Set up services for each repository (separate instances)
      let repositoriesWithUrls: RepositoryWithUrls[] = [];
      if (options.repositories && options.repositories.length > 0) {
        repositoriesWithUrls = await this.services.setupRepositoryServices(sandbox, rootDir, options.repositories);
      } else {
        // Create default workspace repository
        const defaultRepo = PortManager.createDefaultRepository();
        
        // Create directory for default repository (since cloneRepositories wasn't called)
        this.logger.workspace.creating(`Creating default repository directory`);
        await this.cloneRepositories(sandbox, projectDir, [defaultRepo]);
        
        // Set up services for default repository
        repositoriesWithUrls = await this.services.setupRepositoryServices(sandbox, rootDir, [defaultRepo]);
      }
      
      // Use the primary repository's URLs
      const primaryRepo = repositoriesWithUrls[0];
      
      if (!primaryRepo?.urls) {
        throw new Error('Primary repository missing URLs');
      }
      
      const workspaceData: WorkspaceLogData = {
        sandboxId: sandbox.id,
        image: 'node:20',
        resources: {
          cpu: options.resources?.cpu || DEFAULT_WORKSPACE_RESOURCES.cpu,
          memory: options.resources?.memory || DEFAULT_WORKSPACE_RESOURCES.memory
        },
        urls: primaryRepo.urls
      };
      
      this.logger.logWorkspace(`🚀 Services ready for ${repositoriesWithUrls.length} repositories!`, workspaceData);
      
      // Track workspace creation
      trackWorkspaceCreated(sandbox.id);
      
      return {
        sandboxId: sandbox.id,
        message: `🚀 Services ready for ${repositoriesWithUrls.length} repositories!`,
        repositories: repositoriesWithUrls
      };
    } catch (error) {
      const errorData = {
        error: error instanceof Error ? error : String(error),
        code: 'WORKSPACE_CREATION_FAILED',
        details: {
          cpu: options.resources?.cpu || DEFAULT_WORKSPACE_RESOURCES.cpu,
          memory: options.resources?.memory || DEFAULT_WORKSPACE_RESOURCES.memory,
          image: 'node:20'
        }
      };
      this.logger.logError('Failed to create workspace', errorData);
      throw new Error(`Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create UserWorkspace structure from repositories with URLs
   * This helps with Firebase integration and new data structure
   */
  createUserWorkspace(sandboxId: string, repositoriesWithUrls: RepositoryWithUrls[]): UserWorkspace {
    // Convert RepositoryWithUrls to Repository with ports, URLs, and tokens
    const repositories: Repository[] = repositoriesWithUrls.map((repo, index) => ({
      id: repo.url ? `repo-${Date.now()}-${index}` : 'repo-0000000000000-0',
      url: repo.url || '',
      name: repo.name,
      description: repo.description,
      sourceType: repo.url ? 'github' : 'default',
      ports: PortManager.getPortsForSlot(index),
      // Include service URLs
      serviceUrls: repo.urls ? {
        vscode: repo.urls.vscode,
        terminal: repo.urls.terminal,
        claude: repo.urls.claude,
        gemini: repo.urls.gemini
      } : undefined,
      // Include tokens if available
      tokens: repo.tokens ? {
        vscode: repo.tokens.vscode,
        terminal: repo.tokens.terminal,
        claude: repo.tokens.claude,
        gemini: repo.tokens.gemini
      } : undefined
    }));

    return {
      id: `workspace-${Date.now()}`,
      sandboxId,
      repositories,
      status: 'running',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async cloneRepositories(sandbox: Sandbox, projectDir: string, repositories: Repository[]): Promise<void> {
    try {
      const clonedRepos: string[] = [];
      
      for (const repository of repositories) {
        // Handle repositories without URLs (default, manual workspaces)
        if (!repository.url || repository.sourceType === 'default' || repository.sourceType === 'manual') {
          this.logger.workspace.creating(`Creating ${repository.sourceType} repository directory: ${repository.name}`);
          
          // Create empty directory for default/manual workspaces
          const safeFolderName = repository.name.replace(/[^a-zA-Z0-9-_]/g, '-');
          const mkdirCommand = `mkdir -p "${projectDir}/${safeFolderName}"`;
          
          await sandbox.process.executeCommand(mkdirCommand, projectDir);
          this.logger.workspace.creating(`Created directory: ${projectDir}/${safeFolderName}`);
          
          clonedRepos.push(safeFolderName);
          continue;
        }
        
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
      
      // Clean up any existing symlinks
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