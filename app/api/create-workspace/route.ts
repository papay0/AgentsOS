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
      resources: body.resources || DEFAULT_WORKSPACE_RESOURCES
    });

    // Save workspace data to Firebase user profile
    const userService = UserServiceAdmin.getInstance();
    
    // Get repositories with URLs from the workspace creation
    const repositoriesWithUrls = workspace.repositories || [];
    
    // Use WorkspaceCreator to create proper UserWorkspace structure
    const workspaceCreator = new WorkspaceCreator(process.env.DAYTONA_API_KEY!);
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