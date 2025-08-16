/**
 * Repository Provisioner
 * 
 * Handles automated Git repository cloning within Daytona workspaces.
 * Clones repositories into the workspace's /projects directory with support for:
 * - GitHub repository URLs (various formats)
 * - Duplicate detection and skipping
 * - Fallback from gh CLI to git clone
 * - Detailed progress tracking and error handling
 * 
 * Used during workspace creation to set up user's repositories.
 */

import { Daytona, type Sandbox } from '@daytonaio/sdk';
import { Logger } from '@/lib/logger';

export interface RepositoryProvisionResult {
  success: boolean;
  cloned: number;
  skipped: number;
  failed: number;
  details: Array<{
    repository: string;
    status: 'cloned' | 'skipped' | 'failed';
    reason?: string;
    path?: string;
  }>;
}

export class RepositoryProvisioner {
  private logger: Logger;
  private sandboxId: string;
  private apiKey: string;
  private sandbox: Sandbox | null = null;
  private rootDir: string | null = null;
  
  constructor(sandboxId: string, apiKey: string) {
    this.sandboxId = sandboxId;
    this.apiKey = apiKey;
    this.logger = Logger.create('RepositoryProvisioner');
  }
  
  async provision(repositories: string[]): Promise<RepositoryProvisionResult> {
    const result: RepositoryProvisionResult = {
      success: true,
      cloned: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    try {
      // Initialize Daytona connection
      await this.initialize();
      
      if (!this.sandbox || !this.rootDir) {
        throw new Error('Failed to initialize sandbox connection');
      }
      
      // Create projects directory if it doesn't exist
      await this.ensureProjectsDirectory();
      
      // Process each repository
      for (const repoUrl of repositories) {
        const repoResult = await this.cloneRepository(repoUrl);
        result.details.push(repoResult);
        
        switch (repoResult.status) {
          case 'cloned':
            result.cloned++;
            break;
          case 'skipped':
            result.skipped++;
            break;
          case 'failed':
            result.failed++;
            result.success = false;
            break;
        }
      }
      
      this.logger.success('Repository provisioning completed', {
        total: repositories.length,
        cloned: result.cloned,
        skipped: result.skipped,
        failed: result.failed
      });
      
    } catch (error) {
      this.logger.error('Repository provisioning failed', error);
      result.success = false;
    }
    
    return result;
  }
  
  private async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Daytona API key is required');
    }
    
    const daytona = new Daytona({ apiKey: this.apiKey });
    this.sandbox = await daytona.get(this.sandboxId);
    
    // Ensure sandbox is started
    if (this.sandbox.state !== 'started') {
      this.logger.info('Starting sandbox', { sandboxId: this.sandboxId });
      await this.sandbox.start();
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    this.rootDir = await this.sandbox.getUserRootDir() || null;
    this.logger.info('Sandbox initialized', { 
      sandboxId: this.sandboxId,
      rootDir: this.rootDir 
    });
  }
  
  private async ensureProjectsDirectory(): Promise<void> {
    if (!this.sandbox || !this.rootDir) return;
    
    const projectsDir = `${this.rootDir}/projects`;
    
    // Create projects directory if it doesn't exist
    await this.sandbox.process.executeCommand(
      `mkdir -p "${projectsDir}"`,
      this.rootDir
    );
    
    this.logger.debug('Projects directory ensured', { path: projectsDir });
  }
  
  private async cloneRepository(repoUrl: string): Promise<{
    repository: string;
    status: 'cloned' | 'skipped' | 'failed';
    reason?: string;
    path?: string;
  }> {
    if (!this.sandbox || !this.rootDir) {
      return {
        repository: repoUrl,
        status: 'failed',
        reason: 'Sandbox not initialized'
      };
    }
    
    try {
      // Extract repo name from URL (works for both github.com/owner/repo and owner/repo formats)
      const repoName = this.extractRepoName(repoUrl);
      const repoPath = `${this.rootDir}/projects/${repoName}`;
      
      this.logger.info('Processing repository', { 
        repository: repoUrl,
        targetPath: repoPath 
      });
      
      // Check if repository already exists
      const checkResult = await this.sandbox.process.executeCommand(
        `[ -d "${repoPath}/.git" ] && echo "EXISTS" || echo "NOT_EXISTS"`,
        this.rootDir
      );
      
      if (checkResult.result.trim() === 'EXISTS') {
        this.logger.info('Repository already exists, skipping clone', { 
          repository: repoUrl,
          path: repoPath 
        });
        
        return {
          repository: repoUrl,
          status: 'skipped',
          reason: 'Already exists',
          path: repoPath
        };
      }
      
      // Clone the repository
      this.logger.info('Cloning repository', { repository: repoUrl });
      
      // Build the clone URL
      const cloneUrl = repoUrl.includes('github.com') 
        ? repoUrl 
        : `https://github.com/${repoUrl}.git`;
      
      const cloneResult = await this.sandbox.process.executeCommand(
        `cd "${this.rootDir}/projects" && gh repo clone "${repoUrl}" "${repoName}"`,
        this.rootDir
      );
      
      if (cloneResult.exitCode !== 0) {
        // Fallback to git clone if gh clone fails
        this.logger.warn('gh clone failed, trying git clone', { repository: repoUrl });
        
        const gitCloneResult = await this.sandbox.process.executeCommand(
          `cd "${this.rootDir}/projects" && git clone "${cloneUrl}" "${repoName}"`,
          this.rootDir
        );
        
        if (gitCloneResult.exitCode !== 0) {
          throw new Error(`Clone failed: ${gitCloneResult.result}`);
        }
      }
      
      // Verify the clone was successful
      const verifyResult = await this.sandbox.process.executeCommand(
        `[ -d "${repoPath}/.git" ] && echo "SUCCESS" || echo "FAILED"`,
        this.rootDir
      );
      
      if (verifyResult.result.trim() !== 'SUCCESS') {
        throw new Error('Repository clone verification failed');
      }
      
      this.logger.success('Repository cloned successfully', { 
        repository: repoUrl,
        path: repoPath 
      });
      
      return {
        repository: repoUrl,
        status: 'cloned',
        path: repoPath
      };
      
    } catch (error) {
      this.logger.error('Failed to clone repository', {
        repository: repoUrl,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        repository: repoUrl,
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  private extractRepoName(repoUrl: string): string {
    // Handle various URL formats
    // owner/repo -> repo
    // github.com/owner/repo -> repo
    // https://github.com/owner/repo.git -> repo
    
    let name = repoUrl;
    
    // Remove protocol and domain
    name = name.replace(/^https?:\/\//, '');
    name = name.replace(/^github\.com\//, '');
    name = name.replace(/^gitlab\.com\//, '');
    name = name.replace(/^bitbucket\.org\//, '');
    
    // Remove .git suffix
    name = name.replace(/\.git$/, '');
    
    // Get just the repo name (last part after /)
    const parts = name.split('/');
    return parts[parts.length - 1] || name;
  }
}