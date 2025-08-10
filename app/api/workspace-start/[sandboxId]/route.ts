import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Centralized auth & authorization
    const { daytonaClient } = await authenticateWorkspaceAccess(sandboxId);

    // Business logic only
    const result = await daytonaClient.startWorkspaceAndServices(sandboxId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        urls: result.urls
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          message: result.message 
        },
        { status: 500 }
      );
    }

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