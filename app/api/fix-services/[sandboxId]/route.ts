import { NextResponse } from 'next/server';
import { WorkspaceServiceManager } from '@/lib/workspace-service-manager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    const serviceManager = WorkspaceServiceManager.getInstance();
    
    // Authenticate and validate workspace access
    const { userWorkspace, sandbox, rootDir } = await serviceManager.authenticateWorkspaceAccess(sandboxId);
    
    // Restart/fix services for all repositories
    const results = await serviceManager.restartServices(
      sandbox,
      userWorkspace.repositories,
      sandboxId,
      rootDir
    );
    
    // Summary
    const reposWithServices = results.filter(repo => 'services' in repo);
    const totalServices = reposWithServices.length * 3; // 3 services per repo
    const successfulServices = reposWithServices.reduce((count, repo) => {
      return count + Object.values(repo.services).filter(service => service.status === 'success').length;
    }, 0);
    
    return NextResponse.json({
      success: true,
      sandboxId,
      message: `Services restart completed for ${userWorkspace.repositories.length} repositories`,
      summary: {
        repositories: userWorkspace.repositories.length,
        totalServices,
        successful: successfulServices,
        failed: totalServices - successfulServices
      },
      results,
      timestamp: new Date().toISOString()
    });
    
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