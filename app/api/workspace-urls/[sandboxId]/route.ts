import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get workspace data from Firebase
    const userService = UserServiceAdmin.getInstance();
    const workspace = await userService.getUserWorkspace(userId);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    if (workspace.sandboxId !== sandboxId) {
      return NextResponse.json(
        { error: 'Sandbox ID mismatch' },
        { status: 403 }
      );
    }
    
    // Return repository data with URLs
    if (workspace.repositories && workspace.repositories.length > 0) {
      // Return repository-specific URLs
      return NextResponse.json({
        repositories: workspace.repositories,
        // For backward compatibility, use first repository's URLs as defaults
        terminalUrl: workspace.repositories[0]?.urls?.terminal || '',
        claudeTerminalUrl: workspace.repositories[0]?.urls?.claude || '',
        vscodeUrl: workspace.repositories[0]?.urls?.vscode || ''
      });
    } else {
      // Fallback to legacy URLs if no repositories
      return NextResponse.json({
        repositories: [],
        terminalUrl: workspace.urls?.terminal || '',
        claudeTerminalUrl: workspace.urls?.claude || '',
        vscodeUrl: workspace.urls?.vscode || ''
      });
    }

  } catch (error) {
    console.error('Error fetching workspace URLs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspace URLs';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}