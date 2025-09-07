import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { Daytona } from '@daytonaio/sdk';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Workspace ID is required' 
        },
        { status: 400 }
      );
    }

    // Get user's Daytona API key
    const userService = UserServiceAdmin.getInstance();
    const apiKey = await userService.getDaytonaApiKey(userId);
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Daytona API key not configured' 
        },
        { status: 400 }
      );
    }

    // Create Daytona client and get sandbox
    const daytona = new Daytona({ apiKey });
    const sandbox = await daytona.get(workspaceId);
    
    // Get root directory
    const rootDir = await sandbox.getUserRootDir();
    if (!rootDir) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Could not access workspace directory' 
        },
        { status: 500 }
      );
    }

    const repositories: Array<{ path: string, name: string }> = [];

    // Check if root directory has git
    try {
      const rootGitCheck = await sandbox.process.executeCommand(
        'test -d .git && echo "HAS_GIT" || echo "NO_GIT"',
        rootDir,
        undefined,
        5000
      );
      
      if (rootGitCheck.result?.includes('HAS_GIT')) {
        repositories.push({ path: rootDir, name: 'Root' });
      }
    } catch (error) {
      logger.debug('Root git check failed:', error);
    }

    // Check projects directory
    try {
      const projectsDir = `${rootDir}/projects`;
      const projectsList = await sandbox.process.executeCommand(
        'ls -1',
        projectsDir,
        undefined,
        5000
      );

      if (projectsList.result && projectsList.result.trim()) {
        const projects = projectsList.result.trim().split('\n');
        
        for (const project of projects) {
          if (project.trim()) {
            const projectPath = `${projectsDir}/${project.trim()}`;
            
            // Check if this project has git
            try {
              const gitCheck = await sandbox.process.executeCommand(
                'test -d .git && echo "HAS_GIT" || echo "NO_GIT"',
                projectPath,
                undefined,
                5000
              );
              
              if (gitCheck.result?.includes('HAS_GIT')) {
                repositories.push({ 
                  path: projectPath, 
                  name: project.trim()
                });
              }
            } catch (error) {
              logger.debug(`Git check failed for project ${project}:`, error);
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Projects directory check failed:', error);
    }

    // Look for other common git locations
    const commonPaths = ['home', 'src', 'code', 'workspace'];
    for (const commonPath of commonPaths) {
      try {
        const fullPath = `${rootDir}/${commonPath}`;
        const gitCheck = await sandbox.process.executeCommand(
          'test -d .git && echo "HAS_GIT" || echo "NO_GIT"',
          fullPath,
          undefined,
          5000
        );
        
        if (gitCheck.result?.includes('HAS_GIT')) {
          // Avoid duplicates
          if (!repositories.some(repo => repo.path === fullPath)) {
            repositories.push({ 
              path: fullPath, 
              name: commonPath
            });
          }
        }
      } catch (error) {
        logger.debug(`Git check failed for ${commonPath}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        repositories,
        defaultPath: repositories.length > 0 ? repositories[0].path : rootDir
      }
    });
  } catch (error) {
    logger.error('Error discovering git repositories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to discover git repositories' 
      },
      { status: 500 }
    );
  }
}