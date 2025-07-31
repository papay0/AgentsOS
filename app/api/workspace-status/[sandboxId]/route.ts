import { NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Validate environment
    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing DAYTONA_API_KEY environment variable' },
        { status: 500 }
      );
    }

    // Check workspace status
    const daytonaClient = new DaytonaClient(apiKey);
    const status = await daytonaClient.getWorkspaceStatus(sandboxId);

    return NextResponse.json(status);

  } catch (error) {
    console.error('Error checking workspace status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check workspace status';
    
    return NextResponse.json(
      { 
        status: 'error',
        servicesHealthy: false,
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}