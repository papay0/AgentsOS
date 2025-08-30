import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';
import { adminDb } from '@/lib/user-service-admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Centralized auth & authorization
    const { userId, userWorkspace, daytonaClient } = await authenticateWorkspaceAccess(sandboxId);
    
    console.log(`🔄 Bootstrap: Refreshing tokens for workspace ${sandboxId}`);
    
    // Get sandbox to refresh tokens
    const sandbox = await daytonaClient.getSandbox(sandboxId);
    
    // Refresh all tokens for this workspace
    if (userWorkspace.repositories && userWorkspace.repositories.length > 0) {
      // Sort repositories deterministically to match existing order
      const sortedRepositories = [...userWorkspace.repositories].sort((a, b) => 
        (a.id || '').localeCompare(b.id || '')
      );
      
      console.log(`🔄 Bootstrap: Refreshing tokens for ${sortedRepositories.length} repositories`);
      
      // Get fresh tokens for each repository
      const updatedRepositories = await Promise.all(
        sortedRepositories.map(async (repo) => {
          console.log(`🔄 Bootstrap: Refreshing tokens for ${repo.name} ports: ${repo.ports.vscode}, ${repo.ports.terminal}, ${repo.ports.claude}`);
          
          const [vscodeInfo, terminalInfo, claudeInfo] = await Promise.all([
            sandbox.getPreviewLink(repo.ports.vscode),
            sandbox.getPreviewLink(repo.ports.terminal),
            sandbox.getPreviewLink(repo.ports.claude)
          ]);
          
          console.log(`✅ Bootstrap: Got fresh tokens for ${repo.name}`);
          
          return {
            ...repo,
            tokens: {
              vscode: vscodeInfo.token || null,
              terminal: terminalInfo.token || null,
              claude: claudeInfo.token || null
            }
          };
        })
      );
      
      // Update Firebase with new tokens
      if (!adminDb) {
        throw new Error('Firebase Admin not initialized');
      }
      
      // Clean undefined values from repository data
      const cleanedRepositories = updatedRepositories.map(repo => {
        const cleanedRepo: any = {
          id: repo.id,
          name: repo.name,
          url: repo.url,
          sourceType: repo.sourceType,
          ports: repo.ports,
          tokens: repo.tokens
        };
        
        // Only include fields that have values
        if (repo.description !== undefined) {
          cleanedRepo.description = repo.description;
        }
        if (repo.serviceUrls !== undefined) {
          cleanedRepo.serviceUrls = repo.serviceUrls;
        }
        
        return cleanedRepo;
      });
      
      await adminDb.collection('users').doc(userId).update({
        'agentsOS.workspace.repositories': cleanedRepositories,
        'agentsOS.workspace.lastTokenRefresh': new Date().toISOString()
      });
      
      console.log(`✅ Bootstrap: Updated ${updatedRepositories.length} repositories with fresh tokens in Firebase`);
      
      return NextResponse.json({
        success: true,
        message: `Refreshed tokens for ${updatedRepositories.length} repositories`,
        refreshedAt: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ Bootstrap: No repositories found for workspace ${sandboxId}`);
      return NextResponse.json({
        success: true,
        message: 'No repositories to refresh',
        refreshedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Bootstrap error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh workspace tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}