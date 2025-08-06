import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { WorkspaceManager } from '@/lib/workspace-manager';

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
    
    // Get sandbox to generate URLs
    const workspaceManager = new WorkspaceManager(process.env.DAYTONA_API_KEY!);
    const sandbox = await workspaceManager.getSandbox(sandboxId);
    
    // Return repository data with URLs
    if (workspace.repositories && workspace.repositories.length > 0) {
      // Generate URLs dynamically from ports for each repository
      const repositoriesWithUrls = await Promise.all(
        workspace.repositories.map(async (repo) => {
          const [vscodeInfo, terminalInfo, claudeInfo] = await Promise.all([
            sandbox.getPreviewLink(repo.ports.vscode),
            sandbox.getPreviewLink(repo.ports.terminal),
            sandbox.getPreviewLink(repo.ports.claude)
          ]);
          
          return {
            ...repo,
            urls: {
              vscode: vscodeInfo.url,
              terminal: terminalInfo.url,
              claude: claudeInfo.url
            }
          };
        })
      );

      return NextResponse.json({
        repositories: repositoriesWithUrls
      });
    } else {
      // No repositories found
      return NextResponse.json({
        repositories: []
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