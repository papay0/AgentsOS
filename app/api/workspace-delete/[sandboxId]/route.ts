import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  try {
    const { sandboxId } = await params;
    
    // Validate sandbox ID
    if (!sandboxId) {
      return NextResponse.json(
        { error: 'Sandbox ID is required' },
        { status: 400 }
      );
    }

    // Centralized auth & authorization
    const { daytonaClient } = await authenticateWorkspaceAccess(sandboxId);

    // Business logic only
    await daytonaClient.deleteWorkspace(sandboxId);
    
    return NextResponse.json({ 
      success: true,
      message: `Workspace ${sandboxId} deleted successfully` 
    });

  } catch (error) {
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete workspace',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}