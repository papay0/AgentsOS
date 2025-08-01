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

    // Get workspace URLs
    const daytonaClient = new DaytonaClient(apiKey);
    const urls = await daytonaClient.getWorkspaceUrls(sandboxId);

    return NextResponse.json(urls);

  } catch (error) {
    console.error('Error fetching workspace URLs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspace URLs';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}