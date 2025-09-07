import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { Daytona } from '@daytonaio/sdk';
import { logger } from '@/lib/logger';

/**
 * GET /api/git/diff
 * 
 * Fetches git diff data from a workspace directory.
 * 
 * Query parameters:
 * - workspaceId: ID of the Daytona workspace
 * - mode: 'git' (runs git diff command) or 'file' (compares file versions)
 * - command: Git command to execute (default: 'git diff HEAD~1')
 * - workingDir: Directory to run git command in (optional, defaults to workspace root)
 * - path: File path for file comparison mode
 * 
 * Returns:
 * - For git mode: Raw git diff output with list of changed files
 * - For file mode: Old and new file content with metadata for diff library
 */
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
    const mode = searchParams.get('mode') || 'git'; // 'git' or 'file'
    const workspaceId = searchParams.get('workspaceId');
    const filePath = searchParams.get('path');
    const command = searchParams.get('command') || 'git diff HEAD~1'; // Default git command
    const workingDir = searchParams.get('workingDir'); // Directory to run git command in

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
          error: 'Daytona API key not configured. Please configure it in settings.' 
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

    // Use provided working directory or default to root
    const targetDir = workingDir || rootDir;

    if (mode === 'git') {
      // Execute git diff command
      console.log(`[DIFF API] Executing git command: ${command} in workspace: ${workspaceId} at path: ${targetDir}`);
      logger.info(`Executing git command: ${command} in workspace: ${workspaceId} at path: ${targetDir}`);
      
      try {
        const result = await sandbox.process.executeCommand(
          command,
          targetDir,
          undefined,
          30000 // 30 second timeout
        );

        const diff = result.result || '';
        console.log(`[DIFF API] Git command result:`, { diff, diffLength: diff.length });
        
        // Parse files from diff output
        const files: string[] = [];
        
        if (command.includes('--name-only')) {
          // For --name-only, each line is a filename
          const lines = diff.split('\n').filter(line => line.trim());
          files.push(...lines);
          console.log(`[DIFF API] Parsed files from --name-only:`, files);
        } else {
          // For regular diff, parse diff --git headers
          const lines = diff.split('\n');
          for (const line of lines) {
            if (line.startsWith('diff --git')) {
              const match = line.match(/b\/(.+)$/);
              if (match) {
                files.push(match[1]);
              }
            }
          }
          console.log(`[DIFF API] Parsed files from diff headers:`, files);
        }

        return NextResponse.json({
          success: true,
          data: {
            type: 'git',
            diff,
            files,
            command,
            isEmpty: diff.trim() === '',
            timestamp: new Date().toISOString()
          }
        });
      } catch (cmdError) {
        logger.error('Git command failed:', cmdError);
        return NextResponse.json({
          success: true,
          data: {
            type: 'git',
            diff: '',
            files: [],
            command,
            isEmpty: true,
            error: 'No changes found or git command failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    } else {
      // File comparison mode - read two versions of a file
      if (!filePath) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'File path is required for file comparison mode' 
          },
          { status: 400 }
        );
      }

      try {
        console.log(`[DIFF API] File comparison mode for: ${filePath} in ${targetDir}`);
        
        // Get current file content
        const currentContent = await sandbox.process.executeCommand(
          `cat "${filePath}" 2>/dev/null || echo ""`,
          targetDir,
          undefined,
          10000
        );
        console.log(`[DIFF API] Current content length:`, currentContent.result?.length || 0);

        // Get previous version from git
        const previousContent = await sandbox.process.executeCommand(
          `git show HEAD:"${filePath}" 2>/dev/null || echo ""`,
          targetDir,
          undefined,
          10000
        );
        console.log(`[DIFF API] Previous content length:`, previousContent.result?.length || 0);

        // Detect file language from extension
        const fileExt = filePath.split('.').pop() || '';
        const langMap: Record<string, string> = {
          'ts': 'typescript',
          'tsx': 'typescript',
          'js': 'javascript',
          'jsx': 'javascript',
          'py': 'python',
          'java': 'java',
          'go': 'go',
          'rs': 'rust',
          'cpp': 'cpp',
          'c': 'c',
          'cs': 'csharp',
          'php': 'php',
          'rb': 'ruby',
          'swift': 'swift',
          'kt': 'kotlin',
          'json': 'json',
          'xml': 'xml',
          'html': 'html',
          'css': 'css',
          'scss': 'scss',
          'yaml': 'yaml',
          'yml': 'yaml',
          'md': 'markdown'
        };

        const fileLang = langMap[fileExt] || 'text';

        return NextResponse.json({
          success: true,
          data: {
            type: 'file',
            oldFile: {
              fileName: filePath,
              content: previousContent.result || '',
              fileLang
            },
            newFile: {
              fileName: filePath,
              content: currentContent.result || '',
              fileLang
            }
          }
        });
      } catch (fileError) {
        logger.error('File comparison failed:', fileError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to read file for comparison' 
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    logger.error('Error fetching git diff:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch git diff' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/git/diff
 * 
 * Executes custom git commands in a workspace directory.
 * 
 * Request body:
 * - workspaceId: ID of the Daytona workspace
 * - command: Git command to execute (e.g., 'git diff HEAD~2', 'git diff --staged')
 * - workingDir: Directory to run git command in (optional, defaults to workspace root)
 * 
 * Returns:
 * - Git diff output with list of changed files and command metadata
 * 
 * Note: This allows more flexibility than GET for complex git commands
 * but both methods essentially do the same thing - run git diff commands.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workspaceId, command, workingDir } = body;
    
    if (!workspaceId || !command) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Workspace ID and command are required' 
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

    // Use provided working directory or default to root
    const targetDir = workingDir || rootDir;

    // Execute git command
    logger.info(`Executing git command: ${command} in workspace: ${workspaceId} at path: ${targetDir}`);
    
    try {
      const result = await sandbox.process.executeCommand(
        command,
        targetDir,
        undefined,
        30000 // 30 second timeout
      );

      const diff = result.result || '';
      
      // Parse files from diff output
      const diffFiles: string[] = [];
      
      if (command.includes('--name-only')) {
        // For --name-only, each line is a filename
        const lines = diff.split('\n').filter(line => line.trim());
        diffFiles.push(...lines);
      } else {
        // For regular diff, parse diff --git headers
        const lines = diff.split('\n');
        for (const line of lines) {
          if (line.startsWith('diff --git')) {
            const match = line.match(/b\/(.+)$/);
            if (match) {
              diffFiles.push(match[1]);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          type: 'git',
          diff,
          files: diffFiles,
          command,
          isEmpty: diff.trim() === '',
          timestamp: new Date().toISOString()
        }
      });
    } catch (cmdError) {
      logger.error('Git command failed:', cmdError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Git command failed: ${cmdError instanceof Error ? cmdError.message : 'Unknown error'}` 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error executing git command:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute git command' 
      },
      { status: 500 }
    );
  }
}