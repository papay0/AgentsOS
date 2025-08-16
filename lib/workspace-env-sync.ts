/**
 * Smart environment variable sync service for workspaces
 * Handles reading, merging, and writing .env.local files with intelligent conflict resolution
 */

import { DaytonaClient } from './daytona';

export interface EnvVariable {
  key: string;
  value: string;
  source: 'cloud' | 'local' | 'both';
}

export interface MergeResult {
  // Variables that will be written to the file
  final: Record<string, string>;
  
  // Tracking what happened
  added: string[];           // New from cloud
  updated: string[];          // Cloud overwrites local
  preserved: string[];        // Local kept (not in cloud)
  conflicts: Array<{         // Different values
    key: string;
    localValue: string;
    cloudValue: string;
    resolution: 'local' | 'cloud';
  }>;
  
  // File state
  fileExisted: boolean;
  backupCreated: boolean;
}

export class WorkspaceEnvSync {
  private daytonaClient: DaytonaClient;

  constructor(apiKey: string) {
    this.daytonaClient = new DaytonaClient(apiKey);
  }

  /**
   * Read the existing .env.local file from the workspace
   */
  async readExistingEnvFile(sandboxId: string, projectName?: string): Promise<Record<string, string> | null> {
    const content = await this.daytonaClient.readEnvFile(sandboxId, projectName);
    if (!content) {
      return null;
    }
    return this.parseEnvFile(content);
  }

  /**
   * Parse .env file content into key-value pairs
   */
  private parseEnvFile(content: string): Record<string, string> {
    const vars: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip comments and empty lines
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#') || trimmedLine === '') {
        continue;
      }

      // Parse KEY=VALUE format
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Handle escaped quotes inside the value
        value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
        
        vars[key] = value;
      }
    }

    return vars;
  }

  /**
   * Smart merge of cloud and local environment variables
   */
  mergeEnvironmentVariables(
    local: Record<string, string> | null,
    cloud: Record<string, string>,
    conflictResolution: 'prefer-local' | 'prefer-cloud' | 'interactive' = 'prefer-local'
  ): MergeResult {
    const result: MergeResult = {
      final: {},
      added: [],
      updated: [],
      preserved: [],
      conflicts: [],
      fileExisted: local !== null,
      backupCreated: false
    };

    const localVars = local || {};

    // Process cloud variables
    for (const [key, cloudValue] of Object.entries(cloud)) {
      if (localVars[key] !== undefined) {
        if (localVars[key] !== cloudValue) {
          // Conflict detected
          const resolution = conflictResolution === 'prefer-cloud' ? 'cloud' : 'local';
          result.conflicts.push({
            key,
            localValue: localVars[key],
            cloudValue,
            resolution
          });
          
          // Apply resolution
          if (resolution === 'cloud') {
            result.final[key] = cloudValue;
            result.updated.push(key);
          } else {
            result.final[key] = localVars[key];
          }
        } else {
          // Same value, no conflict
          result.final[key] = cloudValue;
        }
      } else {
        // New variable from cloud
        result.added.push(key);
        result.final[key] = cloudValue;
      }
    }

    // Process local-only variables (preserve them)
    for (const [key, value] of Object.entries(localVars)) {
      if (!cloud[key]) {
        result.preserved.push(key);
        result.final[key] = value;
      }
    }

    return result;
  }

  /**
   * Generate the .env.local file content with smart sections
   */
  generateEnvFileContent(
    mergeResult: MergeResult,
    projectName: string,
    cloudVars: Record<string, string> = {}
  ): string {
    const timestamp = new Date().toISOString();
    let content = `# ============================================
# AgentsOS Environment Variables
# Last synced: ${timestamp}
# Project: ${projectName}
# ============================================
#
# Sync Summary:
#   - Added: ${mergeResult.added.length} new variables
#   - Updated: ${mergeResult.updated.length} variables
#   - Preserved: ${mergeResult.preserved.length} local variables
#   - Conflicts: ${mergeResult.conflicts.length} resolved
# ============================================

`;

    // Group variables by source
    const cloudManaged = new Set([
      ...mergeResult.added, 
      ...mergeResult.updated,
      // Include variables that exist in both cloud and local (even if values match)
      ...Object.keys(cloudVars)
    ]);
    const localOnly = new Set(mergeResult.preserved);
    const conflicted = new Set(mergeResult.conflicts.map(c => c.key));

    // Section 1: Cloud-managed variables
    if (cloudManaged.size > 0) {
      content += '# --- Managed by AgentsOS (synced from cloud) ---\n';
      for (const [key, value] of Object.entries(mergeResult.final)) {
        if (cloudManaged.has(key) && !conflicted.has(key)) {
          content += `${key}=${this.escapeValue(value)}\n`;
        }
      }
      content += '\n';
    }

    // Section 2: Local-only variables
    if (localOnly.size > 0) {
      content += '# --- Local variables (preserved) ---\n';
      content += '# These variables exist only in this workspace\n';
      for (const [key, value] of Object.entries(mergeResult.final)) {
        if (localOnly.has(key)) {
          content += `${key}=${this.escapeValue(value)}\n`;
        }
      }
      content += '\n';
    }

    // Section 3: Conflict resolutions
    if (mergeResult.conflicts.length > 0) {
      content += '# --- Resolved conflicts ---\n';
      for (const conflict of mergeResult.conflicts) {
        content += `# ${conflict.key}: Using ${conflict.resolution} value\n`;
        if (conflict.resolution === 'local') {
          content += `#   Cloud value was: ${this.escapeValue(conflict.cloudValue)}\n`;
        } else {
          content += `#   Local value was: ${this.escapeValue(conflict.localValue)}\n`;
        }
        content += `${conflict.key}=${this.escapeValue(mergeResult.final[conflict.key])}\n`;
      }
      content += '\n';
    }

    return content;
  }

  /**
   * Escape value for .env file format
   */
  private escapeValue(value: string): string {
    // Check if value needs quotes
    if (value.includes(' ') || value.includes('"') || value.includes("'") || value.includes('#')) {
      // Escape quotes and wrap in double quotes
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  /**
   * Write the merged environment variables to .env.local
   */
  async writeEnvFile(sandboxId: string, content: string, createBackup: boolean = true, projectName?: string): Promise<void> {
    await this.daytonaClient.writeEnvFile(sandboxId, content, createBackup, projectName);
  }

  /**
   * Perform a complete smart sync operation
   */
  async syncEnvironmentVariables(
    sandboxId: string,
    cloudVars: Record<string, string>,
    projectName: string,
    options: {
      conflictResolution?: 'prefer-local' | 'prefer-cloud';
      createBackup?: boolean;
    } = {}
  ): Promise<MergeResult> {
    const { 
      conflictResolution = 'prefer-local',
      createBackup = true
    } = options;

    // Read existing .env.local
    const localVars = await this.readExistingEnvFile(sandboxId, projectName);

    console.log(`🔍 [DEBUG] Smart sync merge input:`, {
      projectName,
      sandboxId,
      localVarsCount: localVars ? Object.keys(localVars).length : 0,
      localVarsKeys: localVars ? Object.keys(localVars) : [],
      cloudVarsCount: Object.keys(cloudVars).length,
      cloudVarsKeys: Object.keys(cloudVars),
      conflictResolution
    });

    // Perform smart merge
    const mergeResult = this.mergeEnvironmentVariables(
      localVars,
      cloudVars,
      conflictResolution
    );

    console.log(`🔍 [DEBUG] Smart sync merge result:`, {
      added: mergeResult.added,
      updated: mergeResult.updated,
      preserved: mergeResult.preserved,
      conflicts: mergeResult.conflicts.length,
      finalVarsCount: Object.keys(mergeResult.final).length,
      finalVarsKeys: Object.keys(mergeResult.final)
    });

    // Generate new content
    const content = this.generateEnvFileContent(mergeResult, projectName, cloudVars);

    // Write to workspace
    await this.writeEnvFile(sandboxId, content, createBackup && mergeResult.fileExisted, projectName);
    mergeResult.backupCreated = createBackup && mergeResult.fileExisted;

    return mergeResult;
  }
}