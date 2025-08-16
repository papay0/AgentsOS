/**
 * Workspace Provisioner
 * 
 * Handles workspace customization and configuration within Daytona workspaces.
 * Applies user preferences and settings after workspace creation:
 * - VSCode color themes (light/dark/system)
 * - Editor settings (font size, formatting, minimap, etc.)
 * - VSCode extension installation via code-server
 * - Workspace-specific configurations
 * 
 * Used during workspace setup to personalize the development environment.
 */

import { Daytona, type Sandbox } from '@daytonaio/sdk';
import { Logger } from '@/lib/logger';

export interface WorkspaceConfig {
  theme?: 'light' | 'dark' | 'system';
  wallpaper?: string;
  extensions?: string[];
}

export interface WorkspaceProvisionResult {
  success: boolean;
  details: {
    theme?: { applied: boolean; value?: string };
    wallpaper?: { applied: boolean; value?: string };
    extensions?: { installed: number; failed: number; list?: string[] };
  };
}

export class WorkspaceProvisioner {
  private logger: Logger;
  private sandboxId: string;
  private apiKey: string;
  private sandbox: Sandbox | null = null;
  private rootDir: string | null = null;
  
  constructor(sandboxId: string, apiKey: string) {
    this.sandboxId = sandboxId;
    this.apiKey = apiKey;
    this.logger = Logger.create('WorkspaceProvisioner');
  }
  
  async provision(config: WorkspaceConfig): Promise<WorkspaceProvisionResult> {
    const result: WorkspaceProvisionResult = {
      success: true,
      details: {}
    };
    
    try {
      await this.initialize();
      
      if (!this.sandbox || !this.rootDir) {
        throw new Error('Failed to initialize sandbox connection');
      }
      
      // Apply theme settings
      if (config.theme) {
        const themeResult = await this.applyTheme(config.theme);
        result.details.theme = themeResult;
        if (!themeResult.applied) result.success = false;
      }
      
      // Apply wallpaper (store for frontend to use)
      if (config.wallpaper) {
        result.details.wallpaper = {
          applied: true,
          value: config.wallpaper
        };
      }
      
      // Install extensions (future feature)
      if (config.extensions && config.extensions.length > 0) {
        const extensionResult = await this.installExtensions(config.extensions);
        result.details.extensions = extensionResult;
        if (extensionResult.failed > 0) result.success = false;
      }
      
      this.logger.success('Workspace provisioning completed', result.details);
      
    } catch (error) {
      this.logger.error('Workspace provisioning failed', error);
      result.success = false;
    }
    
    return result;
  }
  
  private async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Daytona API key is required');
    }
    
    const daytona = new Daytona({ apiKey: this.apiKey });
    this.sandbox = await daytona.get(this.sandboxId);
    
    if (this.sandbox.state !== 'started') {
      await this.sandbox.start();
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    this.rootDir = await this.sandbox.getUserRootDir() || null;
    this.logger.info('Sandbox initialized', { 
      sandboxId: this.sandboxId,
      rootDir: this.rootDir 
    });
  }
  
  private async applyTheme(theme: 'light' | 'dark' | 'system'): Promise<{
    applied: boolean;
    value?: string;
  }> {
    if (!this.sandbox || !this.rootDir) {
      return { applied: false };
    }
    
    try {
      // Create VSCode settings directory
      await this.sandbox.process.executeCommand(
        `mkdir -p "${this.rootDir}/.vscode"`,
        this.rootDir
      );
      
      // Determine theme name for VSCode
      const vsCodeTheme = theme === 'dark' 
        ? 'Default Dark Modern' 
        : theme === 'light' 
        ? 'Default Light Modern'
        : 'Default Dark Modern'; // Default to dark for system
      
      // Create or update settings.json
      const settings = {
        "workbench.colorTheme": vsCodeTheme,
        "terminal.integrated.defaultProfile.linux": "zsh",
        "terminal.integrated.fontSize": 14,
        "editor.fontSize": 14,
        "editor.minimap.enabled": false,
        "editor.formatOnSave": true,
        "editor.tabSize": 2
      };
      
      const settingsJson = JSON.stringify(settings, null, 2);
      
      await this.sandbox.process.executeCommand(
        `echo '${settingsJson}' > "${this.rootDir}/.vscode/settings.json"`,
        this.rootDir
      );
      
      this.logger.success('Theme applied', { theme, vsCodeTheme });
      
      return {
        applied: true,
        value: vsCodeTheme
      };
      
    } catch (error) {
      this.logger.error('Failed to apply theme', error);
      return { applied: false };
    }
  }
  
  private async installExtensions(extensions: string[]): Promise<{
    installed: number;
    failed: number;
    list?: string[];
  }> {
    if (!this.sandbox || !this.rootDir) {
      return { installed: 0, failed: extensions.length };
    }
    
    let installed = 0;
    let failed = 0;
    const installedList: string[] = [];
    
    for (const extension of extensions) {
      try {
        this.logger.info('Installing extension', { extension });
        
        // Install via code-server
        const result = await this.sandbox.process.executeCommand(
          `code-server --install-extension ${extension}`,
          this.rootDir
        );
        
        if (result.exitCode === 0) {
          installed++;
          installedList.push(extension);
          this.logger.success('Extension installed', { extension });
        } else {
          failed++;
          this.logger.error('Extension installation failed', { 
            extension,
            error: result.result 
          });
        }
        
      } catch (error) {
        failed++;
        this.logger.error('Extension installation error', { extension, error });
      }
    }
    
    return {
      installed,
      failed,
      list: installedList
    };
  }
}