import { NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';

export async function POST(
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

    // Start workspace and services
    const daytonaClient = new DaytonaClient(apiKey);
    const result = await daytonaClient.startWorkspaceAndServices(sandboxId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        urls: result.urls
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          message: result.message 
        },
        { status: 500 }
      );
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