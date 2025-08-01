import { Sandbox } from '@daytonaio/sdk';
import { SandboxState } from '@daytonaio/api-client';
import type { CreateWorkspaceResponse } from '@/types/workspace';
import { WorkspaceManager } from './workspace-manager';
import { WorkspaceCreator } from './workspace-creator';
import { WorkspaceOrchestrator } from './workspace-orchestrator';

interface WorkspaceSetupOptions {
  resources?: {
    cpu: number;
    memory: number;
  };
}

// Main Daytona client - facade that delegates to specialized managers
export class DaytonaClient {
  private manager: WorkspaceManager;
  private creator: WorkspaceCreator;
  private orchestrator: WorkspaceOrchestrator;

  constructor(apiKey: string) {
    this.manager = new WorkspaceManager(apiKey);
    this.creator = new WorkspaceCreator(apiKey);
    this.orchestrator = new WorkspaceOrchestrator();
  }

  // Workspace Creation
  async createWorkspace(options: WorkspaceSetupOptions = {}): Promise<CreateWorkspaceResponse> {
    return await this.creator.createWorkspace(options);
  }

  // Workspace Management
  async getWorkspaceStatus(sandboxId: string): Promise<{
    status: SandboxState | 'error';
    servicesHealthy: boolean;
    message: string;
  }> {
    return await this.manager.getWorkspaceStatus(sandboxId);
  }

  async listWorkspaces(labels?: Record<string, string>): Promise<Sandbox[]> {
    return await this.manager.listWorkspaces(labels);
  }

  async stopWorkspace(sandboxId: string): Promise<void> {
    return await this.manager.stopWorkspace(sandboxId);
  }

  async deleteWorkspace(sandboxId: string): Promise<void> {
    return await this.manager.deleteWorkspace(sandboxId);
  }

  async getWorkspaceUrls(sandboxId: string): Promise<{
    terminalUrl: string;
    claudeTerminalUrl: string;
    vscodeUrl: string;
  }> {
    return await this.manager.getWorkspaceUrls(sandboxId);
  }

  // Workspace Orchestration
  async startWorkspaceAndServices(sandboxId: string): Promise<{
    success: boolean;
    message: string;
    urls?: {
      vscodeUrl: string;
      terminalUrl: string;
      claudeTerminalUrl: string;
    };
  }> {
    const sandbox = await this.manager.getSandbox(sandboxId);
    return await this.orchestrator.startWorkspaceAndServices(sandbox);
  }
}