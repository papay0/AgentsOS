import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserServiceAdmin } from '@/lib/user-service-admin';

export interface DeleteEnvVarResponse {
  success: boolean;
  error?: string;
}

/**
 * DELETE /api/env-vars/[projectName]/[key] - Delete a specific environment variable
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectName: string; key: string }> }
): Promise<NextResponse<DeleteEnvVarResponse>> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { projectName, key } = await params;
    
    if (!projectName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project name is required' 
      }, { status: 400 });
    }

    if (!key) {
      return NextResponse.json({ 
        success: false, 
        error: 'Environment variable key is required' 
      }, { status: 400 });
    }

    // Delete the environment variable
    const userService = UserServiceAdmin.getInstance();
    await userService.deleteProjectEnvVar(userId, projectName, key);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error deleting project environment variable:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete environment variable'
    }, { status: 500 });
  }
}