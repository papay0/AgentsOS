import { Daytona, type Sandbox } from '@daytonaio/sdk';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import type { UserWorkspace, Repository } from '@/types/workspace';
import { Logger } from '@/lib/logger';
import { TTYD_THEME, SERVICES_PER_REPOSITORY } from '@/lib/workspace-constants';
import { WorkspaceInstaller } from '@/lib/workspace-installer';
import { TmuxScriptGenerator } from '@/lib/tmux-script-generator';

export interface ServiceRestartResult {
  success: boolean;
  sandboxId: string;
  message: string;
  summary: {
    repositories: number;
    totalServices: number;
    successful: number;
    failed: number;
  };
  results: ServiceResult[];
  timestamp: string;
}

export interface ServiceStatus {
  service: string;
  port: number;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  url?: string;
  error?: string;
}

export interface ServiceResult {
  repository: string;
  sourceType: string;
  path: string;
  ports: {
    vscode: number;
    terminal: number;
    claude: number;
    gemini: number;
  };
  services: {
    vscode: { status: 'success' | 'failed'; error?: string; url?: string; };
    terminal: { status: 'success' | 'failed'; error?: string; url?: string; };
    claude: { status: 'success' | 'failed'; error?: string; url?: string; };
    gemini: { status: 'success' | 'failed'; error?: string; url?: string; };
  };
}

export interface WorkspaceAuthResult {
  userId: string;
  userWorkspace: UserWorkspace;
  sandbox: Sandbox;
  rootDir: string;
}

/**
 * Centralized service for managing workspace operations and eliminating API duplication
 */
export class WorkspaceServiceManager {
  private static instance: WorkspaceServiceManager;
  private logger: Logger;
  private installer: WorkspaceInstaller;
  
  constructor() {
    this.logger = Logger.create('WorkspaceManager');
    this.installer = new WorkspaceInstaller();
  }
  
  static getInstance(): WorkspaceServiceManager {
    if (!WorkspaceServiceManager.instance) {
      WorkspaceServiceManager.instance = new WorkspaceServiceManager();
    }
    return WorkspaceServiceManager.instance;
  }

  /**
   * Authenticate user and validate workspace access
   */
  async authenticateWorkspaceAccess(sandboxId: string, shouldStartSandbox: boolean = false): Promise<WorkspaceAuthResult> {
    this.logger.info(`Authenticating access to sandbox`, { sandboxId }, 'AUTH');
    
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      this.logger.error(`No user ID found`, undefined, 'AUTH');
      throw new Error('Unauthorized');
    }
    this.logger.success(`User authenticated`, { userId }, 'AUTH');
    
    // Get user's encrypted API key from Firebase
    const userService = UserServiceAdmin.getInstance();
    const apiKey = await userService.getDaytonaApiKey(userId);
    if (!apiKey) {
      this.logger.error(`No Daytona API key found for user`, { userId }, 'AUTH');
      throw new Error('No Daytona API key found. Please provide your API key.');
    }
    this.logger.success(`User's Daytona API key retrieved`, undefined, 'AUTH');

    // Get user's workspace data from Firebase
    this.logger.debug(`Getting workspace data for user`, { userId }, 'FIREBASE');
    const userWorkspace = await userService.getUserWorkspace(userId);
    
    if (!userWorkspace || userWorkspace.sandboxId !== sandboxId) {
      this.logger.error(`Workspace not found or access denied`, { 
        details: { 
          found: userWorkspace?.sandboxId || 'none', 
          expected: sandboxId 
        }
      }, 'FIREBASE');
      throw new Error('Workspace not found or access denied');
    }
    this.logger.success(`Workspace found`, { 
      repositories: userWorkspace.repositories.length,
      sandboxId: userWorkspace.sandboxId
    }, 'FIREBASE');

    // Get sandbox
    this.logger.debug(`Getting sandbox from Daytona`, { sandboxId }, 'DAYTONA');
    const daytona = new Daytona({ apiKey });
    const sandbox = await daytona.get(sandboxId);
    this.logger.info(`Sandbox retrieved`, { sandboxId, state: sandbox.state }, 'DAYTONA');
    
    // Start sandbox if requested and not already started
    if (shouldStartSandbox && sandbox.state !== 'started') {
      this.logger.workspace.starting('container for restart');
      await sandbox.start();
      
      // Wait for container to be ready
      this.logger.info('⏳ Waiting for container to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      this.logger.success(`Sandbox started`, { sandboxId }, 'DAYTONA');
    }
    
    // Get root directory (sandbox must be started by explicit start operations)
    this.logger.debug(`Getting root directory...`, { sandboxId }, 'DAYTONA');
    const rootDir = await sandbox.getUserRootDir();
    if (!rootDir) {
      this.logger.error(`Unable to get sandbox root directory - sandbox may not be started`, { 
        details: { sandboxId, sandboxState: sandbox.state } 
      }, 'DAYTONA');
      throw new Error('Unable to get sandbox root directory - sandbox may not be started');
    }
    this.logger.success(`Root directory retrieved`, { sandboxId, rootDir }, 'DAYTONA');

    return {
      userId,
      userWorkspace,
      sandbox,
      rootDir
    };
  }

  /**
   * Check health status of all services for a workspace
   */
  async checkServiceHealth(
    sandbox: Sandbox, 
    repositories: Repository[], 
    sandboxId: string,
    rootDir: string
  ): Promise<ServiceStatus[]> {
    this.logger.info(`Starting health check`, { 
      sandboxId, 
      repositories: repositories.length 
    }, 'HEALTH');
    
    // If sandbox is not started, return empty array
    if (sandbox.state !== 'started') {
      this.logger.warn(`Sandbox not started, skipping health check`, { 
        sandboxId, 
        state: sandbox.state 
      }, 'HEALTH');
      return [];
    }
    
    // Build ports to check from user's actual repositories
    const portsToCheck = [];
    for (const repo of repositories) {
      portsToCheck.push(
        { name: `VSCode (${repo.name})`, port: repo.ports.vscode },
        { name: `Terminal (${repo.name})`, port: repo.ports.terminal },
        { name: `Claude (${repo.name})`, port: repo.ports.claude },
        { name: `Gemini (${repo.name})`, port: repo.ports.gemini }
      );
    }
    
    const portsList = portsToCheck.map(p => `${p.name}:${p.port}`).join(', ');
    this.logger.debug(`Checking services`, { 
      sandboxId, 
      totalServices: portsToCheck.length, 
      ports: portsList
    }, 'HEALTH');
    
    const serviceResults: ServiceStatus[] = [];
    
    // Check each service port
    for (const { name, port } of portsToCheck) {
      try {
        this.logger.debug(`Checking service`, { service: name, port }, 'HEALTH');
        
        // Check if process is listening on port
        const processCheck = await sandbox.process.executeCommand(
          `lsof -i :${port} | tail -n +2 | head -1`,
          rootDir
        );
        
        if (processCheck.result && processCheck.result.trim()) {
          // Extract PID from lsof output
          const pidMatch = processCheck.result.match(/\s+(\d+)\s+/);
          const pid = pidMatch ? parseInt(pidMatch[1]) : undefined;
          
          this.logger.logService(`Service is running`, {
            service: name,
            port,
            status: 'running',
            pid,
            url: `https://${port}-${sandboxId}.proxy.daytona.work`
          }, 'HEALTH');
          
          serviceResults.push({
            service: name,
            port,
            status: 'running',
            pid,
            url: `https://${port}-${sandboxId}.proxy.daytona.work`
          });
        } else {
          this.logger.warn(`Service is stopped`, { service: name, port }, 'HEALTH');
          serviceResults.push({
            service: name,
            port,
            status: 'stopped'
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Service health check failed`, {
          error: errorMsg,
          details: { service: name, port }
        }, 'HEALTH');
        serviceResults.push({
          service: name,
          port,
          status: 'error',
          error: errorMsg
        });
      }
    }
    
    const runningCount = serviceResults.filter(s => s.status === 'running').length;
    const stoppedCount = serviceResults.filter(s => s.status === 'stopped').length;
    const errorCount = serviceResults.filter(s => s.status === 'error').length;
    
    this.logger.success(`Health check completed`, {
      sandboxId,
      running: runningCount,
      stopped: stoppedCount,
      errors: errorCount,
      total: serviceResults.length
    }, 'HEALTH');
    
    return serviceResults;
  }

  /**
   * Restart/fix services for all repositories in a workspace
   */
  async restartServices(
    sandbox: Sandbox,
    repositories: Repository[],
    sandboxId: string,
    rootDir: string
  ): Promise<ServiceResult[]> {
    return await this.logger.time('Service Restart', async () => {
      // IMPORTANT: Sort repositories deterministically by ID to ensure consistent port assignments
      const sortedRepositories = [...repositories].sort((a, b) => {
        // Sort by ID which includes creation timestamp, ensuring consistent order
        return (a.id || '').localeCompare(b.id || '');
      });
      
      console.log('🔍 DEBUG: Sorted repositories for service restart:', sortedRepositories.map((r, i) => ({
        index: i,
        id: r.id,
        name: r.name,
        ports: r.ports
      })));
      
      this.logger.info(`Starting service restart`, { 
        sandboxId, 
        repositories: sortedRepositories.length 
      }, 'RESTART');
      
      // Sandbox should already be started by authenticateWorkspaceAccess, but double-check
      if (sandbox.state !== 'started') {
        this.logger.warn(`Sandbox not started, starting it`, { 
          sandboxId, 
          currentState: sandbox.state 
        }, 'RESTART');
        
        await this.logger.time('Sandbox Start', async () => {
          await sandbox.start();
          this.logger.debug(`Waiting for container to be ready...`, { sandboxId }, 'RESTART');
          await new Promise(resolve => setTimeout(resolve, 10000));
        });
      }
      
      // Get all ports from user's repositories (sorted)
      const allPorts: number[] = [];
      for (const repo of sortedRepositories) {
        allPorts.push(repo.ports.vscode, repo.ports.terminal, repo.ports.claude, repo.ports.gemini);
      }
      
      this.logger.debug(`Killing existing processes`, { 
        sandboxId, 
        portCount: allPorts.length,
        ports: allPorts.join(', ')
      }, 'RESTART');
      
      // Kill any existing processes on these ports first (in parallel)
      await this.logger.time('Process Termination', async () => {
        const killPromises = allPorts.map(port => Promise.all([
          sandbox.process.executeCommand(`pkill -f "code-server.*${port}" || true`, rootDir),
          sandbox.process.executeCommand(`pkill -f "ttyd.*${port}" || true`, rootDir)
        ]));
        
        await Promise.all(killPromises);
      });
      
      this.logger.debug(`Waiting for processes to fully stop...`, { sandboxId }, 'RESTART');
      await new Promise(resolve => setTimeout(resolve, 1500));
    
    const results: ServiceResult[] = [];
    
    for (const repo of sortedRepositories) {
      const repoPath = `${rootDir}/projects/${repo.name}`;
      
      // Check if repository directory exists (for fix-services compatibility)
      const dirCheck = await sandbox.process.executeCommand(
        `ls -la "${repoPath}" || echo "DIRECTORY_NOT_FOUND"`,
        rootDir
      );
      
      if (dirCheck.result.includes('DIRECTORY_NOT_FOUND')) {
        console.log(`Skipping ${repo.name} - directory not found`);
        continue;
      }
      
      this.logger.info(`Starting services for repository`, { 
        repository: repo.name, 
        sourceType: repo.sourceType,
        vscodePort: repo.ports.vscode,
        terminalPort: repo.ports.terminal,
        claudePort: repo.ports.claude,
        geminiPort: repo.ports.gemini
      }, 'RESTART');
      
      const repoResult: ServiceResult = {
        repository: repo.name,
        sourceType: repo.sourceType,
        path: repoPath,
        ports: repo.ports,
        services: {
          vscode: { status: 'failed', error: 'Unknown error' },
          terminal: { status: 'failed', error: 'Unknown error' },
          claude: { status: 'failed', error: 'Unknown error' },
          gemini: { status: 'failed', error: 'Unknown error' }
        }
      };
      
      // Prepare startup scripts first (parallel script creation)
      const terminalScript = `/tmp/start-zsh-${repo.name}.sh`;
      const claudeScript = `/tmp/start-claude-${repo.name}.sh`;
      const geminiScript = `/tmp/start-gemini-${repo.name}.sh`;
      
      const scriptPromises = [
        // Terminal script with tmux and environment variables
        sandbox.process.executeCommand(
          TmuxScriptGenerator.generateScriptCreationCommand(
            TmuxScriptGenerator.generateTerminalScript(repoPath, repo.name),
            terminalScript
          ),
          rootDir
        ),
        
        // Claude script with tmux and environment variables
        sandbox.process.executeCommand(
          TmuxScriptGenerator.generateScriptCreationCommand(
            TmuxScriptGenerator.generateClaudeScript(repoPath, repo.name),
            claudeScript
          ),
          rootDir
        ),
        
        // Gemini script with tmux and environment variables
        sandbox.process.executeCommand(
          TmuxScriptGenerator.generateScriptCreationCommand(
            TmuxScriptGenerator.generateGeminiScript(repoPath, repo.name),
            geminiScript
          ),
          rootDir
        )
      ];
      
      await this.logger.time(`Script Creation (${repo.name})`, async () => {
        await Promise.all(scriptPromises);
      });
      
      // Start all services in parallel
      const startPromises = [
        // VSCode
        sandbox.process.executeCommand(
          `nohup code-server "${repoPath}" --bind-addr 0.0.0.0:${repo.ports.vscode} --auth none --disable-telemetry > /tmp/vscode-${repo.name}-${repo.ports.vscode}.log 2>&1 &`,
          rootDir
        ),
        
        // Terminal
        sandbox.process.executeCommand(
          `nohup ttyd --port ${repo.ports.terminal} --writable -t 'theme=${TTYD_THEME}' "${terminalScript}" > /tmp/terminal-${repo.name}-${repo.ports.terminal}.log 2>&1 &`,
          rootDir
        ),
        
        // Claude
        sandbox.process.executeCommand(
          `nohup ttyd --port ${repo.ports.claude} --writable -t 'theme=${TTYD_THEME}' "${claudeScript}" > /tmp/claude-${repo.name}-${repo.ports.claude}.log 2>&1 &`,
          rootDir
        ),
        
        // Gemini
        sandbox.process.executeCommand(
          `nohup ttyd --port ${repo.ports.gemini} --writable -t 'theme=${TTYD_THEME}' "${geminiScript}" > /tmp/gemini-${repo.name}-${repo.ports.gemini}.log 2>&1 &`,
          rootDir
        )
      ];
      
      // Start all services simultaneously
      await this.logger.time(`Service Startup (${repo.name})`, async () => {
        await Promise.all(startPromises);
      });
      
      // Single optimized wait for all services to initialize
      this.logger.debug(`Waiting for services to initialize`, { repository: repo.name }, 'RESTART');
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      // Health check all services in parallel
      const healthPromises = [
        // VSCode health check
        sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${repo.ports.vscode}`,
          rootDir
        ).then(result => {
          if (result.result.trim() === '200') {
            repoResult.services.vscode = { 
              status: 'success', 
              url: `https://${repo.ports.vscode}-${sandboxId}.proxy.daytona.work`
            };
          } else {
            repoResult.services.vscode = { 
              status: 'failed', 
              error: `Health check failed: HTTP ${result.result}`
            };
          }
        }).catch(error => {
          repoResult.services.vscode = { 
            status: 'failed', 
            error: error instanceof Error ? error.message : String(error)
          };
        }),
        
        // Terminal health check
        sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${repo.ports.terminal}`,
          rootDir
        ).then(result => {
          if (result.result.trim() === '200') {
            repoResult.services.terminal = { 
              status: 'success', 
              url: `https://${repo.ports.terminal}-${sandboxId}.proxy.daytona.work`
            };
          } else {
            repoResult.services.terminal = { 
              status: 'failed', 
              error: `Health check failed: HTTP ${result.result}`
            };
          }
        }).catch(error => {
          repoResult.services.terminal = { 
            status: 'failed', 
            error: error instanceof Error ? error.message : String(error)
          };
        }),
        
        // Claude health check
        sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${repo.ports.claude}`,
          rootDir
        ).then(result => {
          if (result.result.trim() === '200') {
            repoResult.services.claude = { 
              status: 'success', 
              url: `https://${repo.ports.claude}-${sandboxId}.proxy.daytona.work`
            };
          } else {
            repoResult.services.claude = { 
              status: 'failed', 
              error: `Health check failed: HTTP ${result.result}`
            };
          }
        }).catch(error => {
          repoResult.services.claude = { 
            status: 'failed', 
            error: error instanceof Error ? error.message : String(error)
          };
        }),
        
        // Gemini health check
        sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${repo.ports.gemini}`,
          rootDir
        ).then(result => {
          if (result.result.trim() === '200') {
            repoResult.services.gemini = { 
              status: 'success', 
              url: `https://${repo.ports.gemini}-${sandboxId}.proxy.daytona.work`
            };
          } else {
            repoResult.services.gemini = { 
              status: 'failed', 
              error: `Health check failed: HTTP ${result.result}`
            };
          }
        }).catch(error => {
          repoResult.services.gemini = { 
            status: 'failed', 
            error: error instanceof Error ? error.message : String(error)
          };
        })
      ];
      
      // Wait for all health checks to complete
      await this.logger.time(`Health Checks (${repo.name})`, async () => {
        await Promise.all(healthPromises);
      });
      
      const successCount = Object.values(repoResult.services).filter(s => s.status === 'success').length;
      const failedCount = Object.values(repoResult.services).filter(s => s.status === 'failed').length;
      
      this.logger.success(`Repository services completed`, {
        repository: repo.name,
        successful: successCount,
        failed: failedCount,
        total: 3
      }, 'RESTART');
      
      results.push(repoResult);
    }
    
    const totalSuccessful = results.reduce((count, repo) => {
      return count + Object.values(repo.services).filter(service => service.status === 'success').length;
    }, 0);
    const totalServices = results.length * SERVICES_PER_REPOSITORY;
    
    this.logger.success(`Service restart completed`, {
      sandboxId,
      repositories: results.length,
      totalServices,
      successful: totalSuccessful,
      failed: totalServices - totalSuccessful
    }, 'RESTART');
    
    return results;
    }); // End of timer
  }

  /**
   * Get running processes for debugging
   */
  async getRunningProcesses(sandbox: Sandbox, rootDir: string): Promise<string[]> {
    this.logger.debug('Getting running processes for debugging', undefined, 'DEBUG');
    
    const processResult = await sandbox.process.executeCommand(
      'ps aux | grep -E "(code-server|ttyd|claude)" | grep -v grep',
      rootDir
    );
    
    const processes = processResult.result 
      ? processResult.result.split('\n').filter(line => line.trim())
      : [];
      
    this.logger.debug(`Found running processes`, { 
      count: processes.length,
      sample: processes.slice(0, 3).join(' | ') // Only show first 3 for brevity
    }, 'DEBUG');
    
    return processes;
  }

  /**
   * Complete service restart operation with authentication and result formatting
   * This method is shared by both the API route and provisioning
   */
  async restartServicesComplete(sandboxId: string): Promise<ServiceRestartResult> {
    try {
      this.logger.info('Starting complete service restart operation', { sandboxId });

      // Authenticate and validate workspace access (with sandbox starting for restart)
      const { userWorkspace, sandbox, rootDir } = await this.authenticateWorkspaceAccess(sandboxId, true);
      
      // Ensure critical system packages are installed (for workspaces created before tmux support)
      this.logger.info('Ensuring critical system packages are present...');
      await this.installer.ensureSystemPackages(sandbox, rootDir);
      
      // Ensure all CLI tools are installed (for workspaces created before CLI tools support)
      this.logger.info('Ensuring CLI tools are installed...');
      await this.installer.ensureCLITools(sandbox, rootDir);
      
      // Restart/fix services for all repositories
      const results = await this.restartServices(
        sandbox,
        userWorkspace.repositories,
        sandboxId,
        rootDir
      );
      
      // Summary
      const reposWithServices = results.filter(repo => 'services' in repo);
      const totalServices = reposWithServices.length * SERVICES_PER_REPOSITORY; // services per repo
      const successfulServices = reposWithServices.reduce((count, repo) => {
        return count + Object.values(repo.services).filter(service => service.status === 'success').length;
      }, 0);
      
      return {
        success: true,
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
      };
      
    } catch (error) {
      this.logger.error('Complete service restart failed', error);
      
      // Re-throw for the caller to handle HTTP status codes
      throw error;
    }
  }
}