import { NextResponse } from 'next/server';
import { Daytona } from '@daytonaio/sdk';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';

export async function GET(
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

    // Get user's workspace data from Firebase
    const userService = UserServiceAdmin.getInstance();
    const userWorkspace = await userService.getUserWorkspace(userId);
    
    if (!userWorkspace || userWorkspace.sandboxId !== sandboxId) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Get sandbox
    const daytona = new Daytona({ apiKey });
    const sandbox = await daytona.get(sandboxId);
    
    // If sandbox is not started, return early with status info
    if (sandbox.state !== 'started') {
      return NextResponse.json({
        sandboxId,
        sandboxState: sandbox.state,
        services: [],
        processes: [],
        message: `Sandbox is ${sandbox.state}. Services are not accessible when sandbox is not running.`
      });
    }
    
    const rootDir = await sandbox.getUserRootDir();
    
    // Build ports to check from user's actual repositories
    const portsToCheck = [];
    for (const repo of userWorkspace.repositories) {
      portsToCheck.push(
        { name: `VSCode (${repo.name})`, port: repo.ports.vscode },
        { name: `Terminal (${repo.name})`, port: repo.ports.terminal },
        { name: `Claude (${repo.name})`, port: repo.ports.claude }
      );
    }
    
    interface ServiceResult {
      service: string;
      port: number;
      status: 'running' | 'stopped' | 'error';
      pid?: number;
      url?: string;
      error?: string;
    }
    
    const serviceResults: ServiceResult[] = [];
    
    // Check each service port
    for (const { name, port } of portsToCheck) {
      try {
        // Check if process is listening on port
        const processCheck = await sandbox.process.executeCommand(
          `lsof -i :${port} | tail -n +2 | head -1`,
          rootDir
        );
        
        if (processCheck.result && processCheck.result.trim()) {
          // Extract PID from lsof output
          const pidMatch = processCheck.result.match(/\s+(\d+)\s+/);
          const pid = pidMatch ? parseInt(pidMatch[1]) : undefined;
          
          serviceResults.push({
            service: name,
            port,
            status: 'running',
            pid,
            url: `https://${port}-${sandboxId}.proxy.daytona.work`
          });
        } else {
          serviceResults.push({
            service: name,
            port,
            status: 'stopped'
          });
        }
      } catch (error) {
        serviceResults.push({
          service: name,
          port,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Get running processes for additional debugging
    const processResult = await sandbox.process.executeCommand(
      'ps aux | grep -E "(code-server|ttyd|claude)" | grep -v grep',
      rootDir
    );
    
    const processes = processResult.result 
      ? processResult.result.split('\n').filter(line => line.trim())
      : [];
    
    // Summary
    const runningServices = serviceResults.filter(s => s.status === 'running').length;
    const totalServices = serviceResults.length;
    
    return NextResponse.json({
      sandboxId,
      sandboxState: sandbox.state,
      summary: {
        running: runningServices,
        total: totalServices,
        healthy: runningServices === totalServices
      },
      services: serviceResults,
      processes,
      repositories: userWorkspace.repositories.map(repo => ({
        name: repo.name,
        sourceType: repo.sourceType,
        ports: repo.ports
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error debugging services:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug services',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}