import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';
import { DaytonaClient } from '@/lib/daytona';
import type { UserWorkspace } from '@/types/workspace';
import type { Sandbox } from '@daytonaio/sdk';

export interface WorkspaceAuthResult {
  userId: string;
  userWorkspace: UserWorkspace;
  daytonaClient: DaytonaClient;
}

export interface WorkspaceAuthResultWithSandbox extends WorkspaceAuthResult {
  sandbox: Sandbox;
  rootDir: string;
}

export enum WorkspaceAuthErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  MISSING_API_KEY = 'MISSING_API_KEY', 
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class WorkspaceAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: WorkspaceAuthErrorCode
  ) {
    super(message);
    this.name = 'WorkspaceAuthError';
  }

  // Type guard for instanceof checks
  static isWorkspaceAuthError(error: unknown): error is WorkspaceAuthError {
    return error instanceof WorkspaceAuthError;
  }
}

/**
 * Centralized authentication and authorization for workspace APIs
 * Handles: Clerk auth, API key validation, workspace ownership verification
 */
export async function authenticateWorkspaceAccess(sandboxId: string): Promise<WorkspaceAuthResult> {
  // 1. Check Clerk authentication
  const { userId } = await auth();
  if (!userId) {
    throw new WorkspaceAuthError('Unauthorized', 401, WorkspaceAuthErrorCode.UNAUTHORIZED);
  }
  
  // 2. Get user's Daytona API key from Firebase
  const userService = UserServiceAdmin.getInstance();
  const apiKey = await userService.getDaytonaApiKey(userId);
  if (!apiKey) {
    throw new WorkspaceAuthError(
      'No Daytona API key found. Please provide your API key.', 
      400, 
      WorkspaceAuthErrorCode.MISSING_API_KEY
    );
  }

  // 3. Get user's workspace data from Firebase
  const userWorkspace = await userService.getUserWorkspace(userId);
  
  if (!userWorkspace) {
    throw new WorkspaceAuthError('Workspace not found', 404, WorkspaceAuthErrorCode.WORKSPACE_NOT_FOUND);
  }
  
  // 4. Verify sandbox ownership
  if (userWorkspace.sandboxId !== sandboxId) {
    throw new WorkspaceAuthError(
      'Access denied - workspace does not belong to user', 
      403, 
      WorkspaceAuthErrorCode.ACCESS_DENIED
    );
  }

  // 5. Return authenticated resources
  return {
    userId,
    userWorkspace,
    daytonaClient: new DaytonaClient(apiKey)
  };
}

/**
 * Enhanced authentication that includes sandbox object and rootDir
 * Used by APIs that need direct sandbox access (debug-services, github/repositories)
 * 
 * NOTE: Does NOT auto-start sandbox - only explicit start/restart operations should do that
 * - Uses sandbox.getUserRootDir() for actual root directory
 * - Requires sandbox to be already started by user
 */
export async function authenticateWorkspaceAccessWithSandbox(sandboxId: string): Promise<WorkspaceAuthResultWithSandbox> {
  // Get base auth result
  const authResult = await authenticateWorkspaceAccess(sandboxId);
  
  // Get sandbox 
  const sandbox = await authResult.daytonaClient.getSandbox(sandboxId);
  
  // Get root directory (sandbox must be started by explicit start operations)
  const rootDir = await sandbox.getUserRootDir();
  if (!rootDir) {
    throw new WorkspaceAuthError(
      'Unable to get sandbox root directory - sandbox may not be started', 
      500, 
      WorkspaceAuthErrorCode.INTERNAL_ERROR
    );
  }
  
  return {
    ...authResult,
    sandbox,
    rootDir
  };
}

/**
 * Standardized error handler for workspace auth errors
 */
export function handleWorkspaceAuthError(error: unknown): NextResponse {
  console.error('Workspace auth error:', error);
  
  if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  // Handle other types of errors
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json(
    { error: message, code: WorkspaceAuthErrorCode.INTERNAL_ERROR },
    { status: 500 }
  );
}