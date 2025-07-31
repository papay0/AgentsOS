import { NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';
import type { CreateWorkspaceResponse } from '@/types/workspace';

export async function POST(): Promise<NextResponse<CreateWorkspaceResponse | { error: string }>> {
  try {
    // Validate environment
    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing DAYTONA_API_KEY environment variable' },
        { status: 500 }
      );
    }

    // Create workspace using our service layer
    const daytonaClient = new DaytonaClient(apiKey);
    
    const workspace = await daytonaClient.createWorkspace({
      resources: {
        cpu: 2,
        memory: 4
      }
    });

    return NextResponse.json(workspace);

  } catch (error) {
    console.error('Error creating workspace:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}