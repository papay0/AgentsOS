import type { CreateWorkspaceResponse } from '@/types/workspace';
import type { SandboxListItem } from '@/types/sandbox';

export interface Repository {
  url: string;
  name: string;
  description?: string;
  tech?: string;
}

export interface CreateWorkspaceRequest {
  repositories?: Repository[];
  workspaceName?: string;
  resources?: {
    cpu: number;
    memory: number;
  };
}

export interface WorkspaceUrls {
  vscodeUrl: string;
  terminalUrl: string;
  claudeTerminalUrl: string;
}

// Client-side API for workspace management
export class WorkspaceApi {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async createWorkspace(request: CreateWorkspaceRequest): Promise<CreateWorkspaceResponse> {
    const response = await fetch(`${this.baseUrl}/api/create-workspace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create workspace' }));
      throw new Error(error.error || 'Failed to create workspace');
    }

    return response.json();
  }

  async listWorkspaces(): Promise<{ sandboxes: SandboxListItem[] }> {
    const response = await fetch(`${this.baseUrl}/api/list-workspaces`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to list workspaces' }));
      throw new Error(error.error || 'Failed to list workspaces');
    }

    return response.json();
  }

  async getWorkspaceUrls(sandboxId: string): Promise<WorkspaceUrls> {
    const response = await fetch(`${this.baseUrl}/api/workspace-urls/${sandboxId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get workspace URLs' }));
      throw new Error(error.error || 'Failed to get workspace URLs');
    }

    return response.json();
  }

  async getWorkspaceStatus(sandboxId: string): Promise<{
    status: string;
    servicesHealthy: boolean;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/workspace-status/${sandboxId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get workspace status' }));
      throw new Error(error.error || 'Failed to get workspace status');
    }

    return response.json();
  }

  async startWorkspace(sandboxId: string): Promise<{ success: boolean; message: string; urls?: WorkspaceUrls }> {
    const response = await fetch(`${this.baseUrl}/api/workspace-start/${sandboxId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to start workspace' }));
      throw new Error(error.error || 'Failed to start workspace');
    }

    return response.json();
  }

  async stopWorkspace(sandboxId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/workspace-stop/${sandboxId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to stop workspace' }));
      throw new Error(error.error || 'Failed to stop workspace');
    }

    return response.json();
  }

  async restartWorkspace(sandboxId: string): Promise<{ success: boolean; message: string; urls?: WorkspaceUrls }> {
    const response = await fetch(`${this.baseUrl}/api/fix-services/${sandboxId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to restart workspace' }));
      throw new Error(error.error || 'Failed to restart workspace');
    }

    return response.json();
  }

  async deleteWorkspace(sandboxId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/workspace-delete/${sandboxId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete workspace' }));
      throw new Error(error.error || 'Failed to delete workspace');
    }

    return response.json();
  }
}

// Singleton instance for the app
export const workspaceApi = new WorkspaceApi();