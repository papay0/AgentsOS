import type { SandboxState } from '@daytonaio/api-client';

export interface SandboxListItem {
  id: string;
  state?: SandboxState;
  cpu: number;
  memory: number;
  disk: number;
  gpu: number;
  createdAt?: string;
  updatedAt?: string;
  user: string;
  public: boolean;
  errorReason?: string;
  labels: Record<string, string>;
  organizationId: string;
  target: string;
}

export interface ListWorkspacesResponse {
  sandboxes: SandboxListItem[];
}