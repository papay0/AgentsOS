/**
 * Unit tests for PortManager
 */

import { describe, it, expect } from 'vitest';
import { PortManager } from '../port-manager';
import type { Repository } from '@/types/workspace';

describe('PortManager', () => {
  describe('getPortsForSlot', () => {
    it('should calculate correct ports for slot 0 (default)', () => {
      const ports = PortManager.getPortsForSlot(0);
      
      expect(ports).toEqual({
        vscode: 8080,
        terminal: 10000,
        claude: 4000,
        gemini: 5000,
      });
    });

    it('should calculate correct ports for slot 1', () => {
      const ports = PortManager.getPortsForSlot(1);
      
      expect(ports).toEqual({
        vscode: 8081,
        terminal: 10001,
        claude: 4001,
        gemini: 5001,
      });
    });

    it('should calculate correct ports for higher slots', () => {
      const ports = PortManager.getPortsForSlot(10);
      
      expect(ports).toEqual({
        vscode: 8090,
        terminal: 10010,
        claude: 4010,
        gemini: 5010,
      });
    });

    it('should handle large slot numbers', () => {
      const ports = PortManager.getPortsForSlot(999);
      
      expect(ports).toEqual({
        vscode: 9079,
        terminal: 10999,
        claude: 4999,
        gemini: 5999,
      });
    });
  });

  describe('createDefaultRepository', () => {
    it('should create default repository with correct properties', () => {
      const defaultRepo = PortManager.createDefaultRepository();
      
      expect(defaultRepo).toEqual({
        id: 'repo-0000000000000-0',
        url: '',
        name: 'default',
        description: 'Default workspace for new projects',
        sourceType: 'default',
        ports: {
          vscode: 8080,
          terminal: 10000,
          claude: 4000,
          gemini: 5000,
        },
      });
    });

    it('should always use slot 0 ports for default repository', () => {
      const defaultRepo = PortManager.createDefaultRepository();
      const slot0Ports = PortManager.getPortsForSlot(0);
      
      expect(defaultRepo.ports).toEqual(slot0Ports);
    });

    it('should have correct sourceType for default repository', () => {
      const defaultRepo = PortManager.createDefaultRepository();
      
      expect(defaultRepo.sourceType).toBe('default');
      expect(defaultRepo.url).toBe(''); // No URL for default workspace
    });
  });

  describe('repository scenarios', () => {
    it('should support all sourceType variants', () => {
      // This test demonstrates the supported source types
      const repositories: Repository[] = [
        {
          id: 'repo-0000000000000-0',
          url: '',
          name: 'default',
          description: 'Default workspace for new projects',
          sourceType: 'default',
          ports: PortManager.getPortsForSlot(0),
        },
        {
          id: 'github-repo',
          url: 'https://github.com/user/repo.git',
          name: 'GitHub Project',
          sourceType: 'github', 
          ports: PortManager.getPortsForSlot(1),
        },
        {
          id: 'manual-project',
          url: '',
          name: 'My Next.js App',
          sourceType: 'manual',
          ports: PortManager.getPortsForSlot(2),
        }
      ];

      expect(repositories).toHaveLength(3);
      expect(repositories[0].sourceType).toBe('default');
      expect(repositories[1].sourceType).toBe('github');
      expect(repositories[2].sourceType).toBe('manual');

      // Each should have unique ports
      const allPorts = repositories.flatMap(r => [r.ports.vscode, r.ports.terminal, r.ports.claude, r.ports.gemini]);
      const uniquePorts = new Set(allPorts);
      expect(uniquePorts.size).toBe(allPorts.length);
    });
  });

  describe('port allocation scenarios', () => {
    it('should not have port conflicts for multiple repositories', () => {
      const allPorts: number[] = [];
      const numRepos = 50;

      // Generate ports for 50 repositories
      for (let i = 0; i < numRepos; i++) {
        const ports = PortManager.getPortsForSlot(i);
        allPorts.push(ports.vscode, ports.terminal, ports.claude, ports.gemini);
      }

      // Check no duplicates
      const uniquePorts = new Set(allPorts);
      expect(uniquePorts.size).toBe(allPorts.length);
      expect(allPorts.length).toBe(numRepos * 4); // 4 ports per repo
    });

    it('should generate predictable port sequences', () => {
      const ports = [];
      
      for (let i = 0; i < 5; i++) {
        ports.push(PortManager.getPortsForSlot(i));
      }

      expect(ports).toEqual([
        { vscode: 8080, terminal: 10000, claude: 4000, gemini: 5000 },
        { vscode: 8081, terminal: 10001, claude: 4001, gemini: 5001 },
        { vscode: 8082, terminal: 10002, claude: 4002, gemini: 5002 },
        { vscode: 8083, terminal: 10003, claude: 4003, gemini: 5003 },
        { vscode: 8084, terminal: 10004, claude: 4004, gemini: 5004 },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle slot 0 correctly', () => {
      const ports = PortManager.getPortsForSlot(0);
      
      expect(ports.vscode).toBe(8080);
      expect(ports.terminal).toBe(10000);
      expect(ports.claude).toBe(4000);
      expect(ports.gemini).toBe(5000);
    });

    it('should handle negative slots (though not recommended)', () => {
      const ports = PortManager.getPortsForSlot(-1);
      
      expect(ports.vscode).toBe(8079);
      expect(ports.terminal).toBe(9999);
      expect(ports.claude).toBe(3999);
      expect(ports.gemini).toBe(4999);
    });
  });

  describe('port ranges', () => {
    it('should keep VSCode ports in expected range for reasonable slot counts', () => {
      for (let slot = 0; slot < 100; slot++) {
        const ports = PortManager.getPortsForSlot(slot);
        expect(ports.vscode).toBeGreaterThanOrEqual(8080);
        expect(ports.vscode).toBeLessThan(8200); // Reasonable upper limit for 100 repos
      }
    });

    it('should keep Terminal ports in expected range for reasonable slot counts', () => {
      for (let slot = 0; slot < 100; slot++) {
        const ports = PortManager.getPortsForSlot(slot);
        expect(ports.terminal).toBeGreaterThanOrEqual(10000);
        expect(ports.terminal).toBeLessThan(10100); // Reasonable upper limit for 100 repos
      }
    });

    it('should keep Claude ports in expected range for reasonable slot counts', () => {
      for (let slot = 0; slot < 100; slot++) {
        const ports = PortManager.getPortsForSlot(slot);
        expect(ports.claude).toBeGreaterThanOrEqual(4000);
        expect(ports.claude).toBeLessThan(4100); // Reasonable upper limit for 100 repos
      }
    });
  });
});