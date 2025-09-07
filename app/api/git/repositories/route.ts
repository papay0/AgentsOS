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

    // Check projects directory structure
    try {
      const projectsDir = `${rootDir}/projects`;
      
      // First check if projects directory exists
      const projectsDirCheck = await sandbox.process.executeCommand(
        'test -d projects && echo "EXISTS" || echo "NOT_EXISTS"',
        rootDir,
        undefined,
        5000
      );

      if (projectsDirCheck.result?.includes('EXISTS')) {
        // List all subdirectories in projects (including 'default' subdirectory)
        const projectsList = await sandbox.process.executeCommand(
          'find projects -type d -name ".git" | sed "s|/.git$||"',
          rootDir,
          undefined,
          10000
        );

        logger.debug('Git directories found:', projectsList.result);

        if (projectsList.result && projectsList.result.trim()) {
          const gitDirs = projectsList.result.trim().split('\n');
          
          for (const gitDir of gitDirs) {
            if (gitDir.trim()) {
              const fullPath = `${rootDir}/${gitDir.trim()}`;
              const projectName = gitDir.split('/').pop() || gitDir;
              
              repositories.push({ 
                path: fullPath, 
                name: projectName
              });
              logger.debug(`Added git repository: ${projectName} at ${fullPath}`);
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Projects directory scan failed:', error);
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