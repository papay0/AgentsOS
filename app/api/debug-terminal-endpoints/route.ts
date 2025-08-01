import { NextRequest, NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';

export async function POST(request: NextRequest) {
  try {
    const { sandboxId } = await request.json();

    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'No API key' });
    }

    const client = new DaytonaClient(apiKey);
    const sandbox = await client['manager']['daytona'].get(sandboxId);
    
    if (!sandbox || sandbox.state !== 'started') {
      return NextResponse.json({ success: false, message: 'Workspace not running' });
    }

    const rootDir = await sandbox.getUserRootDir();
    if (!rootDir) {
      return NextResponse.json({ success: false, message: 'No root dir' });
    }

    // Investigate what's running on port 9999
    const debugCommands = [
      'ps aux | grep ttyd',
      'netstat -tlnp | grep 9999',
      'curl -s https://9999-' + sandboxId + '.proxy.daytona.work/ | head -20',
      'ls -la /proc/*/fd/ 2>/dev/null | grep pts || echo "No PTY info"',
      'who | head -5',
      'w | head -5',
      'ls -la /dev/pts/',
      'fuser 9999/tcp 2>/dev/null || echo "No process on 9999"'
    ];

    const results: { [key: string]: string } = {};

    for (const cmd of debugCommands) {
      try {
        const result = await sandbox.process.executeCommand(cmd, rootDir, undefined, 5000);
        results[cmd] = result.result || 'No output';
      } catch (error) {
        results[cmd] = `Error: ${error}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Debug info collected',
      debug: results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}