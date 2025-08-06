/**
 * Unit tests for WorkspaceServices port allocation updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceServices } from '../workspace-services';
import { PortManager } from '../port-manager';

// Type for accessing private methods in tests
type WorkspaceServicesPrivate = {
  allocatePorts: (slot: number) => { vscode: number; terminal: number; claude: number };
};

// Mock the Daytona SDK
vi.mock('@daytonaio/sdk', () => ({
  Sandbox: vi.fn(),
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('WorkspaceServices', () => {
  let workspaceServices: WorkspaceServices;
  
  beforeEach(() => {
    workspaceServices = new WorkspaceServices();
  });

  describe('port allocation integration', () => {
    it('should use PortManager for port allocation', () => {
      // Access the private method via reflection for testing
      const allocatePorts = (workspaceServices as unknown as WorkspaceServicesPrivate).allocatePorts;
      
      const ports0 = allocatePorts(0);
      const expectedPorts0 = PortManager.getPortsForSlot(0);
      
      expect(ports0).toEqual(expectedPorts0);
      expect(ports0).toEqual({
        vscode: 8080,
        terminal: 10000,
        claude: 4000,
      });
    });

    it('should allocate different ports for different repository indices', () => {
      const allocatePorts = (workspaceServices as unknown as WorkspaceServicesPrivate).allocatePorts;
      
      const ports0 = allocatePorts(0);
      const ports1 = allocatePorts(1);
      const ports2 = allocatePorts(2);
      
      // Should match PortManager results
      expect(ports0).toEqual(PortManager.getPortsForSlot(0));
      expect(ports1).toEqual(PortManager.getPortsForSlot(1));
      expect(ports2).toEqual(PortManager.getPortsForSlot(2));
      
      // Should be unique
      const allPorts = [
        ports0.vscode, ports0.terminal, ports0.claude,
        ports1.vscode, ports1.terminal, ports1.claude,
        ports2.vscode, ports2.terminal, ports2.claude,
      ];
      const uniquePorts = new Set(allPorts);
      expect(uniquePorts.size).toBe(allPorts.length);
    });

    it('should generate expected port sequences', () => {
      const allocatePorts = (workspaceServices as unknown as WorkspaceServicesPrivate).allocatePorts;
      
      const sequences = [];
      for (let i = 0; i < 5; i++) {
        sequences.push(allocatePorts(i));
      }
      
      expect(sequences).toEqual([
        { vscode: 8080, terminal: 10000, claude: 4000 }, // Default
        { vscode: 8081, terminal: 10001, claude: 4001 }, // Repo 1
        { vscode: 8082, terminal: 10002, claude: 4002 }, // Repo 2
        { vscode: 8083, terminal: 10003, claude: 4003 }, // Repo 3
        { vscode: 8084, terminal: 10004, claude: 4004 }, // Repo 4
      ]);
    });
  });

  describe('port allocation consistency', () => {
    it('should be consistent with PortManager across multiple calls', () => {
      const allocatePorts = (workspaceServices as unknown as WorkspaceServicesPrivate).allocatePorts;
      
      // Test consistency across multiple calls
      for (let i = 0; i < 10; i++) {
        const workspacePorts = allocatePorts(i);
        const managerPorts = PortManager.getPortsForSlot(i);
        
        expect(workspacePorts).toEqual(managerPorts);
      }
    });

    it('should handle edge cases same as PortManager', () => {
      const allocatePorts = (workspaceServices as unknown as WorkspaceServicesPrivate).allocatePorts;
      
      // Test slot 0
      expect(allocatePorts(0)).toEqual(PortManager.getPortsForSlot(0));
      
      // Test higher slots
      expect(allocatePorts(100)).toEqual(PortManager.getPortsForSlot(100));
      expect(allocatePorts(999)).toEqual(PortManager.getPortsForSlot(999));
    });
  });
});