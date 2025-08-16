import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { WorkspaceEnvSync } from '@/lib/workspace-env-sync';

export interface SyncEnvVarsRequest {
  workspaceId: string;
  projectName: string;
  mode?: 'smart' | 'command';  // 'smart' uses Daytona API, 'command' returns shell command
  conflictResolution?: 'prefer-local' | 'prefer-cloud';
}

export interface SyncEnvVarsResponse {
  success: boolean;
  summary?: {
    added: string[];
    updated: string[];
    preserved: string[];
    conflicts: Array<{ 
      key: string; 
      localValue?: string; 
      cloudValue?: string;
      resolution?: 'local' | 'cloud';
    }>;
    fileExisted?: boolean;
    backupCreated?: boolean;
    content?: string;
    command?: string;
  };
  error?: string;
}

/**
 * POST /api/env-vars/sync - Sync environment variables to active workspace
 */
export async function POST(request: Request): Promise<NextResponse<SyncEnvVarsResponse>> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body: SyncEnvVarsRequest = await request.json();
    
    if (!body.workspaceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Workspace ID is required' 
      }, { status: 400 });
    }

    if (!body.projectName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project name is required' 
      }, { status: 400 });
    }

    // Get environment variables from Firestore
    const userService = UserServiceAdmin.getInstance();
    const envVars = await userService.getProjectEnvVars(userId, body.projectName);

    console.log(`🔍 [DEBUG] Sync request for project "${body.projectName}":`, {
      userId,
      cloudVarsCount: Object.keys(envVars).length,
      cloudVarsKeys: Object.keys(envVars),
      workspaceId: body.workspaceId
    });

    if (Object.keys(envVars).length === 0) {
      return NextResponse.json({
        success: false,
        error: `No environment variables found for project "${body.projectName}". Check your project name and environment variables in settings.`
      }, { status: 404 });
    }

    // Determine sync mode
    const mode = body.mode || 'command';
    const conflictResolution = body.conflictResolution || 'prefer-local';

    if (mode === 'smart') {
      // Use Daytona API for smart sync
      try {
        // Get user's Daytona API key
        const daytonaApiKey = await userService.getDaytonaApiKey(userId);
        if (!daytonaApiKey) {
          return NextResponse.json({
            success: false,
            error: 'Daytona API key not found. Please configure it in settings.'
          }, { status: 400 });
        }

        // Perform smart sync
        const syncService = new WorkspaceEnvSync(daytonaApiKey);
        const mergeResult = await syncService.syncEnvironmentVariables(
          body.workspaceId,
          envVars,
          body.projectName,
          {
            conflictResolution,
            createBackup: true
          }
        );

        return NextResponse.json({
          success: true,
          summary: {
            added: mergeResult.added,
            updated: mergeResult.updated,
            preserved: mergeResult.preserved,
            conflicts: mergeResult.conflicts.map(c => ({
              key: c.key,
              localValue: c.localValue,
              cloudValue: c.cloudValue,
              resolution: c.resolution
            })),
            fileExisted: mergeResult.fileExisted,
            backupCreated: mergeResult.backupCreated
          }
        });
      } catch (error) {
        console.error('Smart sync failed:', error);
        // Return error for smart sync
        return NextResponse.json({
          success: false,
          error: `Smart sync failed: ${error instanceof Error ? error.message : 'Unknown error'}. Try using Manual Command mode instead.`
        }, { status: 500 });
      }
    }

    // Command mode - return shell command
    const envContent = generateEnvFileContent(envVars, body.projectName);
    const command = generateWriteCommand(envContent);

    return NextResponse.json({
      success: true,
      summary: {
        added: Object.keys(envVars),
        updated: [],
        preserved: [],
        conflicts: [],
        fileExisted: false,
        backupCreated: false,
        content: envContent,
        command: command
      }
    });

  } catch (error) {
    console.error('Error syncing environment variables:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync environment variables'
    }, { status: 500 });
  }
}

/**
 * Generate the .env.local file content
 */
function generateEnvFileContent(envVars: Record<string, string>, projectName: string): string {
  const timestamp = new Date().toISOString();
  const header = `# ============================================
# AgentsOS Managed Environment Variables
# Last synced: ${timestamp}
# Project: ${projectName}
# ============================================
#
# This file is automatically generated from your
# AgentsOS Settings. To modify these variables:
# 1. Update them in AgentsOS Settings app
# 2. Click "Sync to Workspace" to update this file
#
# You can also edit this file directly, but changes
# will be overwritten on the next sync.
# ============================================

`;

  const variables = Object.entries(envVars)
    .map(([key, value]) => {
      // Escape values that contain special characters
      const escapedValue = value.includes(' ') || value.includes('"') 
        ? `"${value.replace(/"/g, '\\"')}"` 
        : value;
      return `${key}=${escapedValue}`;
    })
    .join('\n');

  return header + variables + '\n';
}

/**
 * Generate a shell command to write the env file
 */
function generateWriteCommand(content: string): string {
  // Use cat with heredoc for cleaner command (no escaping needed)
  return `cat > .env.local << 'AGENTSOS_ENV_EOF'
${content}
AGENTSOS_ENV_EOF`;
}