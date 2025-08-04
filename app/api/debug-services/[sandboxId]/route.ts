import { NextResponse } from 'next/server';
import { Daytona } from '@daytonaio/sdk';

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
    
    // Check all possible service ports
    const portsToCheck = [
      // First repository (AgentsPod)
      { name: 'VSCode (AgentsPod)', port: 8080 },
      { name: 'Terminal (AgentsPod)', port: 9999 },
      { name: 'Claude (AgentsPod)', port: 9998 },
      // Second repository (Pettitude)
      { name: 'VSCode (Pettitude)', port: 8081 },
      { name: 'Terminal (Pettitude)', port: 9989 },
      { name: 'Claude (Pettitude)', port: 9988 },
    ];
    
    interface ServiceResult {
      service: string;
      port: number;
      listening: boolean;
      httpStatus: string;
      portInfo?: string;
      error?: string;
    }
    
    const results: ServiceResult[] = [];
    
    for (const service of portsToCheck) {
      try {
        // Check if port is listening
        const portCheck = await sandbox.process.executeCommand(
          `netstat -tlnp | grep :${service.port} || echo "Port ${service.port} not listening"`,
          rootDir
        );
        
        // Try to curl the service
        const curlCheck = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${service.port} || echo "Failed"`,
          rootDir,
          undefined,
          5000
        );
        
        results.push({
          service: service.name,
          port: service.port,
          listening: !portCheck.result.includes('not listening'),
          httpStatus: curlCheck.result.trim(),
          portInfo: portCheck.result.trim()
        });
      } catch (error) {
        results.push({
          service: service.name,
          port: service.port,
          listening: false,
          httpStatus: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Also check processes
    const processCheck = await sandbox.process.executeCommand(
      `ps aux | grep -E "(code-server|ttyd)" | grep -v grep`,
      rootDir
    );
    
    return NextResponse.json({
      sandboxId,
      services: results,
      processes: processCheck.result.split('\n').filter(line => line.trim())
    });

  } catch (error) {
    console.error('Error checking services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check services';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}