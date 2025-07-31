import { NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';
import type { SandboxListItem } from '@/types/sandbox';

export async function GET() {
  try {
    const apiKey = process.env.DAYTONA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DAYTONA_API_KEY not configured' },
        { status: 500 }
      );
    }

    const client = new DaytonaClient(apiKey);
    const sandboxes = await client.listWorkspaces();
    
    // Map Sandbox objects to SandboxListItem
    const sandboxListItems: SandboxListItem[] = sandboxes.map(sandbox => ({
      id: sandbox.id,
      state: sandbox.state,
      cpu: sandbox.cpu,
      memory: sandbox.memory,
      disk: sandbox.disk,
      gpu: sandbox.gpu,
      createdAt: sandbox.createdAt,
      updatedAt: sandbox.updatedAt,
      user: sandbox.user,
      public: sandbox.public,
      errorReason: sandbox.errorReason,
      labels: sandbox.labels || {},
      organizationId: sandbox.organizationId,
      target: sandbox.target
    }));
    
    return NextResponse.json({ sandboxes: sandboxListItems });
  } catch (error) {
    console.error('Error listing workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to list workspaces' },
      { status: 500 }
    );
  }
}