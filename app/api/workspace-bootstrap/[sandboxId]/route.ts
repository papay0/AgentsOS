import { NextResponse } from 'next/server';
import { authenticateWorkspaceAccess, handleWorkspaceAuthError, WorkspaceAuthError } from '@/lib/auth/workspace-auth';
import { adminDb } from '@/lib/user-service-admin';
import { PortManager } from '@/lib/port-manager';
import { WORKSPACE_SERVICES } from '@/lib/workspace-constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sandboxId: string }> }
): Promise<NextResponse> {
  try {
    const { sandboxId } = await params;
    
    // Centralized auth & authorization
    const { userId, userWorkspace, daytonaClient } = await authenticateWorkspaceAccess(sandboxId);
    
    console.log(`🔄 Bootstrap: Refreshing tokens for workspace ${sandboxId}`);
    
    // Get sandbox to refresh tokens
    const sandbox = await daytonaClient.getSandbox(sandboxId);
    
    // Refresh all tokens for this workspace
    if (userWorkspace.repositories && userWorkspace.repositories.length > 0) {
      // Sort repositories deterministically to match existing order
      const sortedRepositories = [...userWorkspace.repositories].sort((a, b) => 
        (a.id || '').localeCompare(b.id || '')
      );
      
      console.log(`🔄 Bootstrap: Refreshing tokens for ${sortedRepositories.length} repositories`);
      
      // Get fresh tokens for each repository
      const updatedRepositories = await Promise.all(
        sortedRepositories.map(async (repo, index) => {
          // Check if any service ports are missing (for workspaces created before new services were added)
          const expectedPorts = PortManager.getPortsForSlot(index);
          const missingServices: string[] = [];
          let updatedPorts = { ...repo.ports };
          
          console.log(`🔍 Bootstrap: Checking ${repo.name} - current ports:`, repo.ports);
          console.log(`🔍 Bootstrap: Expected ports for slot ${index}:`, expectedPorts);
          
          // Check each service to see if port is missing
          for (const service of WORKSPACE_SERVICES) {
            console.log(`🔍 Bootstrap: Checking service ${service} - current: ${updatedPorts[service]}, expected: ${expectedPorts[service]}`);
            if (!updatedPorts[service]) {
              updatedPorts = { ...updatedPorts, [service]: expectedPorts[service] };
              missingServices.push(service);
              console.log(`➕ Bootstrap: Added missing service ${service} with port ${expectedPorts[service]}`);
            }
          }
          
          if (missingServices.length > 0) {
            console.log(`🔧 Bootstrap: Adding missing service ports for ${repo.name}: ${missingServices.join(', ')}`);
          }
          
          const serviceList = WORKSPACE_SERVICES.map(s => `${s}:${updatedPorts[s]}`).join(', ');
          console.log(`🔄 Bootstrap: Refreshing tokens for ${repo.name} (${serviceList})`);
          
          // Get fresh tokens for all services
          const servicePromises = WORKSPACE_SERVICES.map(service => 
            sandbox.getPreviewLink(updatedPorts[service])
          );
          const serviceInfos = await Promise.all(servicePromises);
          
          // Build tokens object dynamically
          const tokens: Record<string, string | null> = {};
          const serviceUrls: Record<string, string> = {};
          WORKSPACE_SERVICES.forEach((service, i) => {
            tokens[service] = serviceInfos[i].token || null;
            serviceUrls[service] = serviceInfos[i].url;
          });
          
          const migrationNote = missingServices.length > 0 ? ` (migrated ${missingServices.join(', ')})` : '';
          console.log(`✅ Bootstrap: Got fresh tokens and URLs for ${repo.name}${migrationNote}`);
          
          return {
            ...repo,
            ports: updatedPorts,
            tokens,
            serviceUrls
          };
        })
      );
      
      // Update Firebase with new tokens
      if (!adminDb) {
        throw new Error('Firebase Admin not initialized');
      }
      
      // Clean undefined values from repository data
      const cleanedRepositories = updatedRepositories.map(repo => {
        const cleanedRepo: Record<string, unknown> = {
          id: repo.id,
          name: repo.name,
          url: repo.url,
          sourceType: repo.sourceType,
          ports: repo.ports,
          tokens: repo.tokens,
          serviceUrls: repo.serviceUrls
        };
        
        // Only include fields that have values
        if (repo.description !== undefined) {
          cleanedRepo.description = repo.description;
        }
        
        return cleanedRepo;
      });
      
      await adminDb.collection('users').doc(userId).update({
        'agentsOS.workspace.repositories': cleanedRepositories,
        'agentsOS.workspace.lastTokenRefresh': new Date().toISOString()
      });
      
      console.log(`✅ Bootstrap: Updated ${updatedRepositories.length} repositories with fresh tokens and service URLs in Firebase`);
      
      return NextResponse.json({
        success: true,
        message: `Refreshed tokens for ${updatedRepositories.length} repositories`,
        refreshedAt: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ Bootstrap: No repositories found for workspace ${sandboxId}`);
      return NextResponse.json({
        success: true,
        message: 'No repositories to refresh',
        refreshedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    // Handle auth errors consistently
    if (WorkspaceAuthError.isWorkspaceAuthError(error)) {
      return handleWorkspaceAuthError(error);
    }
    
    // Handle business logic errors
    console.error('Bootstrap error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh workspace tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}