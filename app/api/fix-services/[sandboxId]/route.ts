import { NextResponse } from 'next/server';
import { Daytona } from '@daytonaio/sdk';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
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
    
    // Start the sandbox if it's not started
    if (sandbox.state !== 'started') {
      console.log(`Sandbox is ${sandbox.state}, starting it...`);
      await sandbox.start();
      
      // Wait for container to be ready
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    const rootDir = await sandbox.getUserRootDir();
    
    console.log('Starting services for all repositories...');
    
    // Get all possible service ports that might need to be restarted
    const allPorts = [8080, 8081, 9999, 9998, 9989, 9988];
    
    // Kill any existing processes on these ports first
    for (const port of allPorts) {
      await sandbox.process.executeCommand(
        `pkill -f "code-server.*${port}" || true`,
        rootDir
      );
      await sandbox.process.executeCommand(
        `pkill -f "ttyd.*${port}" || true`,
        rootDir
      );
    }
    
    // Wait for processes to stop
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Repository configurations
    const repositories = [
      { name: 'AgentsPod', ports: { vscode: 8080, terminal: 9999, claude: 9998 } },
      { name: 'Pettitude', ports: { vscode: 8081, terminal: 9989, claude: 9988 } }
    ];
    
    const results = [];
    
    for (const repo of repositories) {
      const repoPath = `${rootDir}/projects/${repo.name}`;
      
      // Check if repository directory exists
      const dirCheck = await sandbox.process.executeCommand(
        `ls -la ${repoPath} || echo "DIRECTORY_NOT_FOUND"`,
        rootDir
      );
      
      if (dirCheck.result.includes('DIRECTORY_NOT_FOUND')) {
        console.log(`Skipping ${repo.name} - directory not found`);
        continue;
      }
      
      console.log(`Starting services for ${repo.name}...`);
      
      // Start VSCode
      await sandbox.process.executeCommand(
        `nohup code-server --bind-addr 0.0.0.0:${repo.ports.vscode} --auth none --disable-telemetry ${repoPath} > /tmp/code-server-${repo.name.toLowerCase()}.log 2>&1 & echo "code-server started for ${repo.name}"`,
        rootDir
      );
      
      // Create startup scripts
      await sandbox.process.executeCommand(
        `echo '#!/bin/bash\ncd ${repoPath}\nexec bash' > /tmp/start-bash-${repo.name}.sh && chmod +x /tmp/start-bash-${repo.name}.sh`,
        rootDir
      );
      
      await sandbox.process.executeCommand(
        `echo '#!/bin/bash\ncd ${repoPath}\nexec claude' > /tmp/start-claude-${repo.name}.sh && chmod +x /tmp/start-claude-${repo.name}.sh`,
        rootDir
      );
      
      // Start terminals with light theme
      const terminalTheme = '{"background":"#ffffff","foreground":"#333333","cursor":"#333333","black":"#000000","brightBlack":"#666666","red":"#cc0000","brightRed":"#ff0000","green":"#4e9a06","brightGreen":"#8ae234","yellow":"#c4a000","brightYellow":"#fce94f","blue":"#3465a4","brightBlue":"#729fcf","magenta":"#75507b","brightMagenta":"#ad7fa8","cyan":"#06989a","brightCyan":"#34e2e2","white":"#d3d7cf","brightWhite":"#eeeeec"}';
      
      await sandbox.process.executeCommand(
        `nohup ttyd --port ${repo.ports.terminal} --writable -t 'theme=${terminalTheme}' /tmp/start-bash-${repo.name}.sh > /tmp/ttyd-terminal-${repo.name.toLowerCase()}.log 2>&1 & echo "terminal started for ${repo.name}"`,
        rootDir
      );
      
      await sandbox.process.executeCommand(
        `nohup ttyd --port ${repo.ports.claude} --writable -t 'theme=${terminalTheme}' /tmp/start-claude-${repo.name}.sh > /tmp/ttyd-claude-${repo.name.toLowerCase()}.log 2>&1 & echo "claude started for ${repo.name}"`,
        rootDir
      );
      
      results.push({
        repository: repo.name,
        ports: repo.ports
      });
    }
    
    // Wait for all services to start
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Verify all services are running
    const verification = await sandbox.process.executeCommand(
      `netstat -tlnp | grep -E "(${allPorts.join('|')})" | wc -l`,
      rootDir
    );
    
    const runningCount = parseInt(verification.result.trim());
    const expectedCount = results.length * 3; // 3 services per repository
    
    if (runningCount >= expectedCount) {
      return NextResponse.json({
        success: true,
        message: `Services started successfully for ${results.length} repositories`,
        repositories: results,
        servicesRunning: runningCount
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Only ${runningCount} of ${expectedCount} expected services started`,
        repositories: results,
        servicesRunning: runningCount
      });
    }

  } catch (error) {
    console.error('Error fixing services:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fix services' 
      },
      { status: 500 }
    );
  }
}