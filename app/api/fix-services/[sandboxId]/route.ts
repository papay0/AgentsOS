import { NextResponse } from 'next/server';
import { WorkspaceServiceManager } from '@/lib/workspace-service-manager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    const serviceManager = WorkspaceServiceManager.getInstance();
    
    // Use the shared method for complete service restart
    const result = await serviceManager.restartServicesComplete(sandboxId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fixing services:', error);
    
    // Handle known errors with appropriate status codes
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'Missing DAYTONA_API_KEY environment variable') {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    if (message === 'Workspace not found or access denied') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fix services',
        details: message
      },
      { status: 500 }
    );
  }
}