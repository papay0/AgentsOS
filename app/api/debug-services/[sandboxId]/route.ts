import { NextResponse } from 'next/server';
import { WorkspaceServiceManager } from '@/lib/workspace-service-manager';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    const serviceManager = WorkspaceServiceManager.getInstance();
    
    // Authenticate and validate workspace access
    const { userWorkspace, sandbox, rootDir } = await serviceManager.authenticateWorkspaceAccess(sandboxId);
    
    // If sandbox is not started, return early with status info
    if (sandbox.state !== 'started') {
      return NextResponse.json({
        sandboxId,
        sandboxState: sandbox.state,
        services: [],
        processes: [],
        message: `Sandbox is ${sandbox.state}. Services are not accessible when sandbox is not running.`
      });
    }
    
    // Check service health
    const serviceResults = await serviceManager.checkServiceHealth(
      sandbox, 
      userWorkspace.repositories, 
      sandboxId, 
      rootDir
    );
    
    // Get running processes for additional debugging
    const processes = await serviceManager.getRunningProcesses(sandbox, rootDir);
    
    // Summary
    const runningServices = serviceResults.filter(s => s.status === 'running').length;
    const totalServices = serviceResults.length;
    
    return NextResponse.json({
      sandboxId,
      sandboxState: sandbox.state,
      summary: {
        running: runningServices,
        total: totalServices,
        healthy: runningServices === totalServices
      },
      services: serviceResults,
      processes,
      repositories: userWorkspace.repositories.map(repo => ({
        name: repo.name,
        sourceType: repo.sourceType,
        ports: repo.ports
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error debugging services:', error);
    
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
        error: 'Failed to debug services',
        details: message
      },
      { status: 500 }
    );
  }
}