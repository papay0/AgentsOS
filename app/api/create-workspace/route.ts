import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DaytonaClient } from '@/lib/daytona';
import { WorkspaceCreator } from '@/lib/workspace-creator';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import admin from 'firebase-admin';
import type { CreateWorkspaceResponse, UserWorkspace, Repository } from '@/types/workspace';
import { DEFAULT_WORKSPACE_RESOURCES } from '@/lib/workspace-defaults';

// Firebase-compatible workspace type
type FirebaseUserWorkspace = Omit<UserWorkspace, 'createdAt' | 'updatedAt'> & {
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
};

interface CreateWorkspaceRequest {
  repositories?: Repository[];
  workspaceName?: string;
  daytonaApiKey?: string;
  resources?: {
    cpu: number;
    memory: number;
    disk: number;
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
    
    // Get or store user's Daytona API key
    const userService = UserServiceAdmin.getInstance();
    let apiKey: string | null = null;
    
    if (body.daytonaApiKey) {
      // User provided a new API key - store it encrypted
      await userService.storeDaytonaApiKey(userId, body.daytonaApiKey);
      apiKey = body.daytonaApiKey;
    } else {
      // Try to get existing API key from user profile
      apiKey = await userService.getDaytonaApiKey(userId);
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Daytona API key is required. Please provide your API key.' },
        { status: 400 }
      );
    }

    // Create workspace using our service layer
    const daytonaClient = new DaytonaClient(apiKey);
    
    const workspace = await daytonaClient.createWorkspace({
      repositories: body.repositories,
      workspaceName: body.workspaceName,
      resources: body.resources || DEFAULT_WORKSPACE_RESOURCES
    });

    // Save workspace data to Firebase user profile
    
    // Get repositories with URLs from the workspace creation
    const repositoriesWithUrls = workspace.repositories || [];
    
    // Use WorkspaceCreator to create proper UserWorkspace structure
    const workspaceCreator = new WorkspaceCreator(apiKey);
    const userWorkspace = workspaceCreator.createUserWorkspace(workspace.sandboxId, repositoriesWithUrls);
    
    // Convert to Firebase format (with Timestamps)
    const workspaceData: FirebaseUserWorkspace = {
      ...userWorkspace,
      createdAt: admin.firestore.Timestamp.fromDate(userWorkspace.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(userWorkspace.updatedAt),
    };

    await userService.createOrUpdateWorkspace(userId, workspaceData as unknown as UserWorkspace);

    // Return workspace data with repositories
    return NextResponse.json({
      sandboxId: workspace.sandboxId,
      message: workspace.message,
      repositories: repositoriesWithUrls
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