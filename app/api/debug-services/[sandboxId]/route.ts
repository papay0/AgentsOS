import { NextResponse } from 'next/server';
import { WorkspaceServiceManager } from '@/lib/workspace-service-manager';
import { authenticateWorkspaceAccessWithSandbox, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    const serviceManager = WorkspaceServiceManager.getInstance();
    
    // Centralized auth & authorization with sandbox
    const { userWorkspace, sandbox, rootDir } = await authenticateWorkspaceAccessWithSandbox(sandboxId);
    
    // If sandbox is not started, return early with status info
    if (sandbox.state !== 'started') {
      return NextResponse.json({
        sandboxId,
        sandboxState: sandbox.state,
        summary: { running: 0, total: 0, healthy: false },
        services: [],
        processes: [],
        repositories: userWorkspace.repositories.map(repo => ({
          name: repo.name,
          sourceType: repo.sourceType,
          ports: repo.ports
        })),
        message: `Sandbox is ${sandbox.state}. Services are not accessible when sandbox is not running.`,
        timestamp: new Date().toISOString()
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
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Error debugging services:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug services',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}