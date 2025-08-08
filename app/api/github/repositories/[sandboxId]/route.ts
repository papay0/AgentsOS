import { NextResponse } from 'next/server';
import { WorkspaceServiceManager } from '@/lib/workspace-service-manager';

export interface GitHubRepository {
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  language: string | null;
  updatedAt: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    const serviceManager = WorkspaceServiceManager.getInstance();
    
    // Authenticate and validate workspace access
    const { sandbox, rootDir } = await serviceManager.authenticateWorkspaceAccess(sandboxId);
    
    // Execute gh repo list command
    const repoListResult = await sandbox.process.executeCommand(
      'gh repo list --limit 100 --json name,nameWithOwner,description,isPrivate,primaryLanguage,updatedAt',
      rootDir
    );
    
    if (!repoListResult.result) {
      return NextResponse.json({ 
        error: 'Failed to fetch repositories',
        details: 'GitHub CLI returned no data. Ensure you are authenticated.' 
      }, { status: 500 });
    }
    
    // Parse JSON response from GitHub CLI
    const repositories: GitHubRepository[] = JSON.parse(repoListResult.result).map((repo: any) => ({
      name: repo.name,
      fullName: repo.nameWithOwner,
      description: repo.description || null,
      isPrivate: repo.isPrivate,
      language: repo.primaryLanguage?.name || null,
      updatedAt: repo.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      sandboxId,
      repositories,
      total: repositories.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    
    const message = error instanceof Error ? error.message : String(error);
    
    // Handle authentication errors
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (message.includes('not logged into') || message.includes('authentication')) {
      return NextResponse.json({ 
        error: 'GitHub authentication required',
        details: 'Please authenticate with GitHub CLI first using: gh auth login'
      }, { status: 401 });
    }
    
    return NextResponse.json({
      error: 'Failed to fetch GitHub repositories',
      details: message
    }, { status: 500 });
  }
}