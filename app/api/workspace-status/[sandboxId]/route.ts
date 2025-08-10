import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Centralized auth & authorization
    const { daytonaClient } = await authenticateWorkspaceAccess(sandboxId);

    // Business logic only
    const status = await daytonaClient.getWorkspaceStatus(sandboxId);
    return NextResponse.json(status);

  } catch (error) {
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Error checking workspace status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check workspace status';
    
    return NextResponse.json(
      { 
        status: 'error',
        servicesHealthy: false,
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}