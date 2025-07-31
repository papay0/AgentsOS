import { NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  try {
    const apiKey = process.env.DAYTONA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DAYTONA_API_KEY not configured' },
        { status: 500 }
      );
    }

    const { sandboxId } = await params;
    
    if (!sandboxId) {
      return NextResponse.json(
        { error: 'Sandbox ID is required' },
        { status: 400 }
      );
    }

    const client = new DaytonaClient(apiKey);
    await client.stopWorkspace(sandboxId);
    
    return NextResponse.json({ 
      success: true,
      message: `Workspace ${sandboxId} stopped successfully` 
    });

  } catch (error) {
    console.error('Error stopping workspace:', error);
    return NextResponse.json(
      { 
        error: 'Failed to stop workspace',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}