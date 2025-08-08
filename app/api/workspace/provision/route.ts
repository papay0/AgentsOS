import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RepositoryProvisioner } from '@/lib/provisioning/repository-provisioner';
import { WorkspaceProvisioner } from '@/lib/provisioning/workspace-provisioner';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { PortManager } from '@/lib/port-manager';
import { Logger } from '@/lib/logger';

export interface ProvisioningConfig {
  sandboxId: string;
  repositories?: string[];
  aiAgents?: string[];
  theme?: 'light' | 'dark' | 'system';
  wallpaper?: string;
  extensions?: string[];
}

interface RepositoryProvisionDetail {
  repository: string;
  status: 'cloned' | 'skipped' | 'failed';
  reason?: string;
  path?: string;
}

export interface ProvisioningResult {
  success: boolean;
  provisioningId: string;
  steps: {
    repositories?: { 
      success: boolean; 
      cloned: number; 
      skipped: number; 
      failed: number; 
      details: RepositoryProvisionDetail[] 
    };
    workspace?: { 
      success: boolean; 
      details: {
        theme?: { applied: boolean; value?: string };
        wallpaper?: { applied: boolean; value?: string };
      }
    };
    agents?: { 
      success: boolean; 
      details: Record<string, unknown> 
    };
  };
  errors?: string[];
  timestamp: string;
}

async function addRepositoriesToWorkspace(
  userId: string, 
  sandboxId: string, 
  repositoryResults: {
    success: boolean;
    cloned: number;
    skipped: number;
    failed: number;
    details: RepositoryProvisionDetail[];
  }
): Promise<void> {
  const logger = Logger.create('WorkspaceFirebase');
  
  try {
    const userService = UserServiceAdmin.getInstance();
    
    // Get existing workspace
    const existingWorkspace = await userService.getUserWorkspace(userId);
    
    let repositories = [];
    
    if (existingWorkspace?.repositories) {
      // Keep existing repositories
      repositories = [...existingWorkspace.repositories];
      logger.info('Found existing workspace with repositories', { 
        existing: repositories.length,
        repoNames: repositories.map(r => r.name)
      });
    } else {
      // No existing workspace - create default repository as slot 0
      const defaultPorts = PortManager.getPortsForSlot(0);
      repositories.push({
        id: 'repo-default',
        url: '',
        name: 'Default',
        description: 'Default workspace for new projects',
        sourceType: 'default' as const,
        ports: defaultPorts,
        tech: 'Default'
      });
      logger.info('Created new workspace with default repository');
    }

    // Add new cloned repositories
    if (repositoryResults.details.length > 0) {
      const clonedRepos = repositoryResults.details
        .filter((detail: RepositoryProvisionDetail) => detail.status === 'cloned' || detail.status === 'skipped')
        .map((detail: RepositoryProvisionDetail, index: number) => {
          const repoName = detail.repository.split('/').pop() || detail.repository;
          const nextSlot = repositories.length + index; // Use next available slot
          const ports = PortManager.getPortsForSlot(nextSlot);
          
          return {
            id: `repo-${Date.now()}-${nextSlot}`,
            url: detail.repository,
            name: repoName,
            description: `Repository: ${detail.repository}`,
            sourceType: 'github' as const,
            ports,
            tech: 'GitHub'
          };
        });
      
      repositories.push(...clonedRepos);
      logger.info('Added new repositories', { 
        added: clonedRepos.length,
        newRepoNames: clonedRepos.map(r => r.name)
      });
    }

    // Save updated workspace to Firebase
    await userService.createOrUpdateWorkspace(userId, {
      id: existingWorkspace?.id || sandboxId,
      sandboxId: sandboxId,
      repositories,
      status: 'running' as const,
      createdAt: existingWorkspace?.createdAt || new Date(),
      updatedAt: new Date(),
    });

    logger.success('Workspace updated in Firebase', { 
      userId, 
      sandboxId, 
      totalRepositories: repositories.length,
      allRepoNames: repositories.map(r => r.name)
    });
    
  } catch (error) {
    logger.error('Failed to add repositories to workspace', error);
    throw error;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const logger = Logger.create('WorkspaceProvisioning');
  
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const config: ProvisioningConfig = await request.json();
    const provisioningId = `prov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Starting workspace provisioning', { 
      provisioningId, 
      userId,
      repositories: config.repositories?.length || 0,
      agents: config.aiAgents?.length || 0
    });
    
    const result: ProvisioningResult = {
      success: true,
      provisioningId,
      steps: {},
      errors: [],
      timestamp: new Date().toISOString()
    };
    
    // Step 1: Clone repositories if provided
    if (config.repositories && config.repositories.length > 0) {
      logger.info('Provisioning repositories', { count: config.repositories.length });
      
      const repoProvisioner = new RepositoryProvisioner(config.sandboxId);
      const repoResult = await repoProvisioner.provision(config.repositories);
      
      result.steps.repositories = repoResult;
      if (!repoResult.success) {
        result.success = false;
        result.errors?.push('Some repositories failed to clone');
      }
      
      logger.success('Repository provisioning complete', {
        cloned: repoResult.cloned,
        skipped: repoResult.skipped,
        failed: repoResult.failed
      });
    }
    
    // Step 2: Configure workspace settings
    if (config.theme || config.wallpaper) {
      logger.info('Configuring workspace settings');
      
      const workspaceProvisioner = new WorkspaceProvisioner(config.sandboxId);
      const workspaceResult = await workspaceProvisioner.provision({
        theme: config.theme,
        wallpaper: config.wallpaper
      });
      
      result.steps.workspace = workspaceResult;
      
      logger.success('Workspace configuration complete');
    }
    
    // Step 3: Future - Install AI agents
    if (config.aiAgents && config.aiAgents.length > 0) {
      // Placeholder for future AI agent provisioning
      logger.info('AI agent provisioning not yet implemented', { agents: config.aiAgents });
    }
    
    // Add repositories to workspace (preserves existing + adds new ones)
    if (result.steps.repositories) {
      await addRepositoriesToWorkspace(userId, config.sandboxId, result.steps.repositories);
    }
    
    logger.success('Provisioning completed', { 
      provisioningId,
      success: result.success 
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('Provisioning failed', error);
    
    return NextResponse.json({
      error: 'Provisioning failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}