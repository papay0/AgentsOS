/**
 * Service for managing files in Daytona workspaces
 */

import { DaytonaClient } from './daytona';

export class WorkspaceFileService {
  private daytonaClient: DaytonaClient;

  constructor(apiKey: string) {
    this.daytonaClient = new DaytonaClient(apiKey);
  }

  /**
   * Write content to a file in the workspace
   * Uses the Daytona API to write files to the workspace filesystem
   */
  async writeFile(workspaceId: string, filePath: string, content: string): Promise<void> {
    try {
      // For now, we'll use a command execution approach
      // Later this can be enhanced with direct file API if available
      
      // Execute via workspace (this would need workspace exec API)
      console.log(`Writing file ${filePath} to workspace ${workspaceId}`);
      
      // Placeholder for actual implementation
      // Would need to use Daytona's file API or exec API
      
    } catch (error) {
      console.error('Error writing file to workspace:', error);
      throw new Error(`Failed to write file ${filePath} to workspace`);
    }
  }

  /**
   * Read a file from the workspace
   */
  async readFile(workspaceId: string, filePath: string): Promise<string | null> {
    try {
      console.log(`Reading file ${filePath} from workspace ${workspaceId}`);
      
      // Placeholder for actual implementation
      // Would need to use Daytona's file API
      
      return null;
    } catch (error) {
      console.error('Error reading file from workspace:', error);
      return null;
    }
  }

  /**
   * Check if a file exists in the workspace
   */
  async fileExists(workspaceId: string, filePath: string): Promise<boolean> {
    try {
      const content = await this.readFile(workspaceId, filePath);
      return content !== null;
    } catch {
      return false;
    }
  }

  /**
   * Parse .env file content into key-value pairs
   */
  static parseEnvFile(content: string): Record<string, string> {
    const vars: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }

      // Parse KEY=VALUE format
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        vars[key] = value;
      }
    }

    return vars;
  }

  /**
   * Merge environment variables with smart conflict detection
   */
  static mergeEnvVars(
    existing: Record<string, string>,
    cloud: Record<string, string>
  ) {
    const result = {
      added: [] as string[],
      updated: [] as string[],
      preserved: [] as string[],
      conflicts: [] as { key: string; local: string; cloud: string }[],
      final: {} as Record<string, string>
    };

    // Add all cloud variables
    for (const [key, cloudValue] of Object.entries(cloud)) {
      if (existing[key]) {
        if (existing[key] !== cloudValue) {
          // Conflict detected
          result.conflicts.push({
            key,
            local: existing[key],
            cloud: cloudValue
          });
          // Keep local value for now
          result.final[key] = existing[key];
        } else {
          // Same value, no change needed
          result.final[key] = cloudValue;
        }
      } else {
        // New variable from cloud
        result.added.push(key);
        result.final[key] = cloudValue;
      }
    }

    // Check for local-only variables
    for (const [key, value] of Object.entries(existing)) {
      if (!cloud[key]) {
        result.preserved.push(key);
        result.final[key] = value;
      }
    }

    return result;
  }
}