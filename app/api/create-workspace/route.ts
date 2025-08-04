import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DaytonaClient } from '@/lib/daytona';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import admin from 'firebase-admin';
import type { CreateWorkspaceResponse } from '@/types/workspace';

interface Repository {
  url: string;
  name: string;
  description?: string;
  tech?: string;
}

interface CreateWorkspaceRequest {
  repositories?: Repository[];
  workspaceName?: string;
  resources?: {
    cpu: number;
    memory: number;
  };
}

export async function POST(request: Request): Promise<NextResponse<CreateWorkspaceResponse | { error: string }>> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateWorkspaceRequest = await request.json().catch(() => ({}));
    
    // Validate environment
    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing DAYTONA_API_KEY environment variable' },
        { status: 500 }
      );
    }

    // Create workspace using our service layer
    const daytonaClient = new DaytonaClient(apiKey);
    
    const workspace = await daytonaClient.createWorkspace({
      repositories: body.repositories,
      workspaceName: body.workspaceName,
      resources: body.resources || {
        cpu: 2,
        memory: 4
      }
    });

    // Save workspace data to Firebase user profile
    const userService = UserServiceAdmin.getInstance();
    
    // Use the repositories with URLs from the workspace creation, or fallback to body repositories
    const repositoriesWithUrls = workspace.repositories || (body.repositories || []).map(repo => ({
      ...repo,
      urls: {
        vscode: workspace.vscodeUrl,
        terminal: workspace.terminalUrl,
        claude: workspace.claudeTerminalUrl,
      }
    }));
    
    const workspaceData = {
      id: workspace.sandboxId,
      sandboxId: workspace.sandboxId,
      name: body.workspaceName || 'AgentsOS Workspace',
      repositories: repositoriesWithUrls,
      status: 'running' as const,
      createdAt: admin.firestore.Timestamp.now(),
      lastAccessedAt: admin.firestore.Timestamp.now(),
    };

    await userService.createOrUpdateWorkspace(userId, workspaceData);

    // Return the complete workspace data with all repositories for AgentsOS
    return NextResponse.json({
      sandboxId: workspace.sandboxId,
      message: workspace.message,
      repositories: repositoriesWithUrls,
      // Legacy compatibility fields
      terminalUrl: workspace.terminalUrl,
      claudeTerminalUrl: workspace.claudeTerminalUrl,
      vscodeUrl: workspace.vscodeUrl
    });

  } catch (error) {
    console.error('Error creating workspace:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}