import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';

export interface EnvVarData {
  key: string;
  value: string;
}

export interface EnvVarsResponse {
  success: boolean;
  envVars?: Record<string, string>;
  error?: string;
}

/**
 * GET /api/env-vars/[projectName] - Get all environment variables for a project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectName: string }> }
): Promise<NextResponse<EnvVarsResponse>> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { projectName } = await params;
    if (!projectName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project name is required' 
      }, { status: 400 });
    }

    // Get environment variables for the project
    const userService = UserServiceAdmin.getInstance();
    const envVars = await userService.getProjectEnvVars(userId, projectName);

    return NextResponse.json({
      success: true,
      envVars
    });

  } catch (error) {
    console.error('Error getting project environment variables:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get environment variables'
    }, { status: 500 });
  }
}

/**
 * POST /api/env-vars/[projectName] - Save/update environment variables for a project
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectName: string }> }
): Promise<NextResponse<EnvVarsResponse>> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { projectName } = await params;
    if (!projectName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project name is required' 
      }, { status: 400 });
    }

    const body: { envVars: EnvVarData[] } = await request.json();
    
    if (!body.envVars || !Array.isArray(body.envVars)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Environment variables array is required' 
      }, { status: 400 });
    }

    // Validate environment variables
    for (const envVar of body.envVars) {
      if (!envVar.key || typeof envVar.key !== 'string') {
        return NextResponse.json({ 
          success: false, 
          error: 'All environment variables must have a valid key' 
        }, { status: 400 });
      }
      
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(envVar.key)) {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid key format: ${envVar.key}. Keys must start with a letter or underscore and contain only letters, numbers, and underscores.` 
        }, { status: 400 });
      }

      if (envVar.key.length > 100) {
        return NextResponse.json({ 
          success: false, 
          error: `Key too long: ${envVar.key}. Maximum length is 100 characters.` 
        }, { status: 400 });
      }

      if (typeof envVar.value !== 'string') {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid value for key: ${envVar.key}` 
        }, { status: 400 });
      }

      if (envVar.value.length > 10000) {
        return NextResponse.json({ 
          success: false, 
          error: `Value too long for key: ${envVar.key}. Maximum length is 10,000 characters.` 
        }, { status: 400 });
      }
    }

    // Save each environment variable
    const userService = UserServiceAdmin.getInstance();
    
    for (const envVar of body.envVars) {
      await userService.storeProjectEnvVar(userId, projectName, envVar.key, envVar.value);
    }

    // Return updated environment variables
    const updatedEnvVars = await userService.getProjectEnvVars(userId, projectName);

    return NextResponse.json({
      success: true,
      envVars: updatedEnvVars
    });

  } catch (error) {
    console.error('Error saving project environment variables:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save environment variables'
    }, { status: 500 });
  }
}