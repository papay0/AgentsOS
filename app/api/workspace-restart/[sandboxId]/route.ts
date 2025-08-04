import { NextResponse } from 'next/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { auth } from '@clerk/nextjs/server';

export async function POST(
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
    
    // Validate environment
    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing DAYTONA_API_KEY environment variable' },
        { status: 500 }
      );
    }

    // Get user workspace data for AgentsOS multi-repository architecture
    const userService = UserServiceAdmin.getInstance();
    const userWorkspace = await userService.getUserWorkspace(userId);
    
    console.log(`Restarting AgentsOS workspace ${sandboxId} with ${userWorkspace?.repositories?.length || 0} repositories`);
    
    // Use the fix-services approach which handles AgentsOS multi-repository architecture
    const response = await fetch(`${request.url.replace('/workspace-restart/', '/fix-services/')}`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Restarted AgentsOS services for ${result.repositories?.length || 0} repositories`,
        repositories: result.repositories
      });
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('Error restarting workspace:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to restart workspace';
    
    return NextResponse.json(
      { 
        success: false,
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}