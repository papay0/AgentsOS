import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Centralized auth & authorization
    const { userWorkspace, daytonaClient } = await authenticateWorkspaceAccess(sandboxId);
    
    // Get sandbox to generate URLs
    const sandbox = await daytonaClient.getSandbox(sandboxId);
    
    // Return repository data with URLs
    if (userWorkspace.repositories && userWorkspace.repositories.length > 0) {
      // Sort repositories deterministically by ID to ensure consistent ordering
      const sortedRepositories = [...userWorkspace.repositories].sort((a, b) => 
        (a.id || '').localeCompare(b.id || '')
      );
      
      console.log('🔍 DEBUG: Sorted repositories for URL generation:', sortedRepositories.map((r, i) => ({
        index: i,
        id: r.id,
        name: r.name,
        ports: r.ports
      })));
      
      // Generate URLs dynamically from ports for each repository
      const repositoriesWithUrls = await Promise.all(
        sortedRepositories.map(async (repo) => {
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
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Error fetching workspace URLs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch workspace URLs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}