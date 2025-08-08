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

async function saveWorkspaceToFirebase(
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
    // Convert provisioning results into repositories format
    const repositories = repositoryResults.details
      .filter((detail: RepositoryProvisionDetail) => detail.status === 'cloned' || detail.status === 'skipped')
      .map((detail: RepositoryProvisionDetail, index: number) => {
        const repoName = detail.repository.split('/').pop() || detail.repository;
        const ports = PortManager.getPortsForSlot(index);
        
        return {
          id: `repo-${Date.now()}-${index}`,
          url: detail.repository,
          name: repoName,
          description: `Repository: ${detail.repository}`,
          sourceType: 'github' as const,
          ports,
          tech: 'GitHub'
        };
      });

    // Save to Firebase using UserServiceAdmin
    const userService = UserServiceAdmin.getInstance();
    await userService.createOrUpdateWorkspace(userId, {
      id: sandboxId,
      sandboxId: sandboxId,
      repositories,
      status: 'running' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.success('Workspace saved to Firebase', { 
      userId, 
      sandboxId, 
      repositories: repositories.length 
    });
    
  } catch (error) {
    logger.error('Failed to save workspace to Firebase', error);
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
    
    // Save workspace with provisioned repositories to Firebase
    if (result.steps.repositories && result.success) {
      await saveWorkspaceToFirebase(userId, config.sandboxId, result.steps.repositories);
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