/**
 * Simple port manager for multi-repository workspaces
 */

import { Repository } from '@/types/workspace';

export class PortManager {
  /**
   * Calculate ports for a repository slot
   * Slot 0 = default (8080, 10000, 4000)
   * Slot N = (8080+N, 10000+N, 4000+N)
   */
  static getPortsForSlot(slot: number) {
    return {
      vscode: 8080 + slot,
      terminal: 10000 + slot,
      claude: 4000 + slot,
    };
  }

  /**
   * Create default repository
   */
  static createDefaultRepository(): Repository {
    return {
      id: 'default-workspace',
      url: '',
      name: 'Default Workspace',
      sourceType: 'default',
      ports: this.getPortsForSlot(0),
    };
  }
}

export default PortManager;