import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';
import { WorkspaceServiceManager } from '@/lib/workspace-service-manager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Centralized auth & authorization
    await authenticateWorkspaceAccess(sandboxId);

    // Use WorkspaceServiceManager for service restart (handles sandbox starting internally)
    const serviceManager = WorkspaceServiceManager.getInstance();
    const result = await serviceManager.restartServicesComplete(sandboxId);

    return NextResponse.json(result);

  } catch (error) {
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Error starting workspace:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start workspace';
    
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}