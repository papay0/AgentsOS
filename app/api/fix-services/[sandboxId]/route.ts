import { NextResponse } from 'next/server';
import { Daytona } from '@daytonaio/sdk';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';

export async function POST(
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
    
    // Start the sandbox if it's not started
    if (sandbox.state !== 'started') {
      console.log(`Sandbox is ${sandbox.state}, starting it...`);
      await sandbox.start();
      
      // Wait for container to be ready
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    const rootDir = await sandbox.getUserRootDir();
    
    console.log(`Starting services for ${userWorkspace.repositories.length} repositories...`);
    
    // Get all ports from user's repositories
    const allPorts = [];
    for (const repo of userWorkspace.repositories) {
      allPorts.push(repo.ports.vscode, repo.ports.terminal, repo.ports.claude);
    }
    
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
    
    const results = [];
    
    for (const repo of userWorkspace.repositories) {
      const repoPath = `${rootDir}/projects/${repo.name}`;
      
      // Check if repository directory exists
      const dirCheck = await sandbox.process.executeCommand(
        `ls -la "${repoPath}" || echo "DIRECTORY_NOT_FOUND"`,
        rootDir
      );
      
      if (dirCheck.result.includes('DIRECTORY_NOT_FOUND')) {
        console.log(`Skipping ${repo.name} - directory not found`);
        results.push({
          repository: repo.name,
          status: 'skipped',
          reason: 'Directory not found',
          path: repoPath
        });
        continue;
      }
      
      console.log(`Starting services for ${repo.name}...`);
      
      const repoResults = {
        repository: repo.name,
        sourceType: repo.sourceType,
        path: repoPath,
        ports: repo.ports,
        services: {
          vscode: { status: 'failed' as 'failed' | 'success', error: 'Unknown error' as string | undefined, url: undefined as string | undefined },
          terminal: { status: 'failed' as 'failed' | 'success', error: 'Unknown error' as string | undefined, url: undefined as string | undefined },
          claude: { status: 'failed' as 'failed' | 'success', error: 'Unknown error' as string | undefined, url: undefined as string | undefined }
        }
      };
      
      // Start VSCode
      try {
        await sandbox.process.executeCommand(
          `nohup code-server "${repoPath}" --bind-addr 0.0.0.0:${repo.ports.vscode} --auth none --disable-telemetry > /tmp/vscode-${repo.name}-${repo.ports.vscode}.log 2>&1 &`,
          rootDir
        );
        
        // Wait and verify VSCode started
        await new Promise(resolve => setTimeout(resolve, 5000));
        const vscodeCheck = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${repo.ports.vscode}`,
          rootDir
        );
        
        if (vscodeCheck.result.trim() === '200') {
          repoResults.services.vscode = { 
            status: 'success', 
            url: `https://${repo.ports.vscode}-${sandboxId}.proxy.daytona.work`,
            error: undefined
          };
        } else {
          repoResults.services.vscode = { 
            status: 'failed', 
            error: `Health check failed: HTTP ${vscodeCheck.result}`,
            url: undefined 
          };
        }
      } catch (error) {
        repoResults.services.vscode = { 
          status: 'failed', 
          error: error instanceof Error ? error.message : String(error),
          url: undefined 
        };
      }
      
      // Start Terminal (ttyd)
      try {
        // Create startup script for this repository
        const startupScript = `/tmp/start-zsh-${repo.name}.sh`;
        await sandbox.process.executeCommand(
          `cat > "${startupScript}" << 'EOF'
#!/bin/bash
cd "${repoPath}"
exec zsh
EOF`,
          rootDir
        );
        
        await sandbox.process.executeCommand(
          `chmod +x "${startupScript}"`,
          rootDir
        );
        
        await sandbox.process.executeCommand(
          `nohup ttyd -p ${repo.ports.terminal} "${startupScript}" > /tmp/terminal-${repo.name}-${repo.ports.terminal}.log 2>&1 &`,
          rootDir
        );
        
        // Wait and verify terminal started
        await new Promise(resolve => setTimeout(resolve, 3000));
        const terminalCheck = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${repo.ports.terminal}`,
          rootDir
        );
        
        if (terminalCheck.result.trim() === '200') {
          repoResults.services.terminal = { 
            status: 'success', 
            url: `https://${repo.ports.terminal}-${sandboxId}.proxy.daytona.work`,
            error: undefined 
          };
        } else {
          repoResults.services.terminal = { 
            status: 'failed', 
            error: `Health check failed: HTTP ${terminalCheck.result}`,
            url: undefined 
          };
        }
      } catch (error) {
        repoResults.services.terminal = { 
          status: 'failed', 
          error: error instanceof Error ? error.message : String(error),
          url: undefined 
        };
      }
      
      // Start Claude terminal  
      try {
        const claudeStartupScript = `/tmp/start-claude-${repo.name}.sh`;
        await sandbox.process.executeCommand(
          `cat > "${claudeStartupScript}" << 'EOF'
#!/bin/bash
cd "${repoPath}"
if command -v claude > /dev/null 2>&1; then
  exec claude
else
  echo "Claude CLI not found. Please run: npm install -g @claude-ai/cli"
  exec zsh
fi
EOF`,
          rootDir
        );
        
        await sandbox.process.executeCommand(
          `chmod +x "${claudeStartupScript}"`,
          rootDir
        );
        
        await sandbox.process.executeCommand(
          `nohup ttyd -p ${repo.ports.claude} "${claudeStartupScript}" > /tmp/claude-${repo.name}-${repo.ports.claude}.log 2>&1 &`,
          rootDir
        );
        
        // Wait and verify Claude terminal started
        await new Promise(resolve => setTimeout(resolve, 3000));
        const claudeCheck = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${repo.ports.claude}`,
          rootDir
        );
        
        if (claudeCheck.result.trim() === '200') {
          repoResults.services.claude = { 
            status: 'success', 
            url: `https://${repo.ports.claude}-${sandboxId}.proxy.daytona.work`,
            error: undefined 
          };
        } else {
          repoResults.services.claude = { 
            status: 'failed', 
            error: `Health check failed: HTTP ${claudeCheck.result}`,
            url: undefined 
          };
        }
      } catch (error) {
        repoResults.services.claude = { 
          status: 'failed', 
          error: error instanceof Error ? error.message : String(error),
          url: undefined 
        };
      }
      
      results.push(repoResults);
    }
    
    // Summary
    const reposWithServices = results.filter(repo => 'services' in repo);
    const totalServices = reposWithServices.length * 3; // 3 services per repo
    const successfulServices = reposWithServices.reduce((count, repo) => {
      return count + Object.values(repo.services).filter(service => service.status === 'success').length;
    }, 0);
    
    return NextResponse.json({
      sandboxId,
      message: `Services restart completed for ${userWorkspace.repositories.length} repositories`,
      summary: {
        repositories: userWorkspace.repositories.length,
        totalServices,
        successful: successfulServices,
        failed: totalServices - successfulServices
      },
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fixing services:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix services',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}