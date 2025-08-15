import { NextResponse } from 'next/server';
import { WorkspaceServiceManager } from '@/lib/workspace-service-manager';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Centralized auth & authorization  
    await authenticateWorkspaceAccess(sandboxId);
    
    // Use the shared method for complete service restart (handles sandbox starting internally)
    const serviceManager = WorkspaceServiceManager.getInstance();
    const result = await serviceManager.restartServicesComplete(sandboxId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Error fixing services:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix services',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}