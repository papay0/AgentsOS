import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccessWithSandbox, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';

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
    
    // Centralized auth & authorization with sandbox
    const { sandbox, rootDir } = await authenticateWorkspaceAccessWithSandbox(sandboxId);
    
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
    interface GitHubAPIResponse {
      name: string;
      nameWithOwner: string;
      description: string | null;
      isPrivate: boolean;
      primaryLanguage: { name: string } | null;
      updatedAt: string;
    }
    
    const repositories: GitHubRepository[] = JSON.parse(repoListResult.result).map((repo: GitHubAPIResponse) => ({
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
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle GitHub CLI specific errors
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('not logged into') || message.includes('authentication')) {
      return NextResponse.json({ 
        error: 'GitHub authentication required',
        details: 'Please authenticate with GitHub CLI first using: gh auth login'
      }, { status: 401 });
    }
    
    // Handle business logic errors
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json({
      error: 'Failed to fetch GitHub repositories',
      details: message
    }, { status: 500 });
  }
}