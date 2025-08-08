/**
 * Default workspace resource configuration
 * Shared across workspace creation endpoints and services
 * 
 * These are the maximum allowed values per sandbox:
 * - CPU: 4 cores max
 * - Memory: 8 GB max  
 * - Disk: 10 GB max (confirmed by error: "Disk request 100GB exceeds maximum allowed per sandbox (10GB)")
 */
export const DEFAULT_WORKSPACE_RESOURCES = {
  cpu: 4,
  memory: 8,
  disk: 10
} as const;

export type WorkspaceResources = typeof DEFAULT_WORKSPACE_RESOURCES;