import { Sandbox } from '@daytonaio/sdk';
import { SandboxState } from '@daytonaio/api-client';
import type { CreateWorkspaceResponse, Repository } from '@/types/workspace';
import { WorkspaceManager } from './workspace-manager';
import { WorkspaceCreator } from './workspace-creator';

interface WorkspaceSetupOptions {
  repositories?: Repository[];
  workspaceName?: string;
  resources?: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

// Main Daytona client - facade that delegates to specialized managers
export class DaytonaClient {
  private manager: WorkspaceManager;
  private creator: WorkspaceCreator;

  constructor(apiKey: string) {
    this.manager = new WorkspaceManager(apiKey);
    this.creator = new WorkspaceCreator(apiKey);
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

  async getSandbox(sandboxId: string): Promise<Sandbox> {
    return await this.manager.getSandbox(sandboxId);
  }

  // File System Operations
  async readEnvFile(sandboxId: string, projectName?: string): Promise<string | null> {
    return await this.manager.readEnvFile(sandboxId, projectName);
  }

  async writeEnvFile(sandboxId: string, content: string, createBackup: boolean = true, projectName?: string): Promise<void> {
    return await this.manager.writeEnvFile(sandboxId, content, createBackup, projectName);
  }
}