/**
 * Unit tests for WorkspaceEnvSync class
 * Tests smart merge logic, conflict resolution, and file content generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceEnvSync } from './workspace-env-sync';

// Mock DaytonaClient
vi.mock('./daytona', () => ({
  DaytonaClient: vi.fn().mockImplementation(() => ({
    readEnvFile: vi.fn(),
    writeEnvFile: vi.fn()
  }))
}));

describe('WorkspaceEnvSync', () => {
  let envSync: WorkspaceEnvSync;
  let mockDaytonaClient: {
    readEnvFile: ReturnType<typeof vi.fn>;
    writeEnvFile: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    envSync = new WorkspaceEnvSync('test-api-key');
    mockDaytonaClient = (envSync as unknown as { daytonaClient: typeof mockDaytonaClient }).daytonaClient;
  });

  describe('parseEnvFile', () => {
    it('should parse basic key-value pairs', () => {
      const content = `
# Comment line
KEY1=value1
KEY2=value2

# Another comment
KEY3=value3
`;
      const result = (envSync as unknown as { parseEnvFile: (content: string) => Record<string, string> }).parseEnvFile(content);
      
      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2',
        KEY3: 'value3'
      });
    });

    it('should handle quoted values', () => {
      const content = `
KEY1="quoted value"
KEY2='single quoted'
KEY3="value with \\"escaped\\" quotes"
`;
      const result = (envSync as unknown as { parseEnvFile: (content: string) => Record<string, string> }).parseEnvFile(content);
      
      expect(result).toEqual({
        KEY1: 'quoted value',
        KEY2: 'single quoted',
        KEY3: 'value with "escaped" quotes'
      });
    });

    it('should handle values with special characters', () => {
      const content = `
API_URL=https://api.example.com/v1
DATABASE_URL=postgresql://user:pass@localhost:5432/db
SPECIAL_CHARS=!@#$%^&*()
`;
      const result = (envSync as unknown as { parseEnvFile: (content: string) => Record<string, string> }).parseEnvFile(content);
      
      expect(result).toEqual({
        API_URL: 'https://api.example.com/v1',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        SPECIAL_CHARS: '!@#$%^&*()'
      });
    });

    it('should ignore empty lines and comments', () => {
      const content = `
# This is a comment

KEY1=value1

# Another comment
KEY2=value2

`;
      const result = (envSync as unknown as { parseEnvFile: (content: string) => Record<string, string> }).parseEnvFile(content);
      
      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2'
      });
    });
  });

  describe('mergeEnvironmentVariables', () => {
    it('should add new cloud variables when local is empty', () => {
      const local = null;
      const cloud = {
        API_KEY: 'cloud-api-key',
        DATABASE_URL: 'cloud-db-url'
      };

      const result = envSync.mergeEnvironmentVariables(local, cloud);

      expect(result).toEqual({
        final: {
          API_KEY: 'cloud-api-key',
          DATABASE_URL: 'cloud-db-url'
        },
        added: ['API_KEY', 'DATABASE_URL'],
        updated: [],
        preserved: [],
        conflicts: [],
        fileExisted: false,
        backupCreated: false
      });
    });

    it('should preserve local-only variables', () => {
      const local = {
        LOCAL_VAR: 'local-value',
        SHARED_VAR: 'shared-value'
      };
      const cloud = {
        SHARED_VAR: 'shared-value',
        CLOUD_VAR: 'cloud-value'
      };

      const result = envSync.mergeEnvironmentVariables(local, cloud);

      expect(result).toEqual({
        final: {
          SHARED_VAR: 'shared-value',
          CLOUD_VAR: 'cloud-value',
          LOCAL_VAR: 'local-value'
        },
        added: ['CLOUD_VAR'],
        updated: [],
        preserved: ['LOCAL_VAR'],
        conflicts: [],
        fileExisted: true,
        backupCreated: false
      });
    });

    it('should handle conflicts with prefer-local resolution', () => {
      const local = {
        API_KEY: 'local-api-key',
        DATABASE_URL: 'local-db-url'
      };
      const cloud = {
        API_KEY: 'cloud-api-key',
        DATABASE_URL: 'cloud-db-url'
      };

      const result = envSync.mergeEnvironmentVariables(local, cloud, 'prefer-local');

      expect(result).toEqual({
        final: {
          API_KEY: 'local-api-key',
          DATABASE_URL: 'local-db-url'
        },
        added: [],
        updated: [],
        preserved: [],
        conflicts: [
          {
            key: 'API_KEY',
            localValue: 'local-api-key',
            cloudValue: 'cloud-api-key',
            resolution: 'local'
          },
          {
            key: 'DATABASE_URL',
            localValue: 'local-db-url',
            cloudValue: 'cloud-db-url',
            resolution: 'local'
          }
        ],
        fileExisted: true,
        backupCreated: false
      });
    });

    it('should handle conflicts with prefer-cloud resolution', () => {
      const local = {
        API_KEY: 'local-api-key',
        DATABASE_URL: 'local-db-url'
      };
      const cloud = {
        API_KEY: 'cloud-api-key',
        DATABASE_URL: 'cloud-db-url'
      };

      const result = envSync.mergeEnvironmentVariables(local, cloud, 'prefer-cloud');

      expect(result).toEqual({
        final: {
          API_KEY: 'cloud-api-key',
          DATABASE_URL: 'cloud-db-url'
        },
        added: [],
        updated: ['API_KEY', 'DATABASE_URL'],
        preserved: [],
        conflicts: [
          {
            key: 'API_KEY',
            localValue: 'local-api-key',
            cloudValue: 'cloud-api-key',
            resolution: 'cloud'
          },
          {
            key: 'DATABASE_URL',
            localValue: 'local-db-url',
            cloudValue: 'cloud-db-url',
            resolution: 'cloud'
          }
        ],
        fileExisted: true,
        backupCreated: false
      });
    });

    it('should handle complex merge scenario', () => {
      const local = {
        EXISTING_SAME: 'same-value',
        EXISTING_DIFFERENT: 'local-value',
        LOCAL_ONLY: 'local-only-value'
      };
      const cloud = {
        EXISTING_SAME: 'same-value',
        EXISTING_DIFFERENT: 'cloud-value',
        CLOUD_ONLY: 'cloud-only-value'
      };

      const result = envSync.mergeEnvironmentVariables(local, cloud, 'prefer-local');

      expect(result).toEqual({
        final: {
          EXISTING_SAME: 'same-value',
          EXISTING_DIFFERENT: 'local-value',
          CLOUD_ONLY: 'cloud-only-value',
          LOCAL_ONLY: 'local-only-value'
        },
        added: ['CLOUD_ONLY'],
        updated: [],
        preserved: ['LOCAL_ONLY'],
        conflicts: [
          {
            key: 'EXISTING_DIFFERENT',
            localValue: 'local-value',
            cloudValue: 'cloud-value',
            resolution: 'local'
          }
        ],
        fileExisted: true,
        backupCreated: false
      });
    });
  });

  describe('generateEnvFileContent', () => {
    it('should generate content with cloud-managed and local sections', () => {
      const mergeResult = {
        final: {
          CLOUD_VAR1: 'cloud-value1',
          CLOUD_VAR2: 'cloud-value2',
          LOCAL_VAR: 'local-value'
        },
        added: ['CLOUD_VAR1', 'CLOUD_VAR2'],
        updated: [],
        preserved: ['LOCAL_VAR'],
        conflicts: [],
        fileExisted: true,
        backupCreated: true
      };

      const cloudVars = {
        CLOUD_VAR1: 'cloud-value1',
        CLOUD_VAR2: 'cloud-value2'
      };

      const content = envSync.generateEnvFileContent(mergeResult, 'test-project', cloudVars);

      expect(content).toContain('# AgentsOS Environment Variables');
      expect(content).toContain('# Project: test-project');
      expect(content).toContain('# --- Managed by AgentsOS (synced from cloud) ---');
      expect(content).toContain('CLOUD_VAR1=cloud-value1');
      expect(content).toContain('CLOUD_VAR2=cloud-value2');
      expect(content).toContain('# --- Local variables (preserved) ---');
      expect(content).toContain('LOCAL_VAR=local-value');
    });

    it('should handle conflicts section', () => {
      const mergeResult = {
        final: {
          CONFLICT_VAR: 'local-value'
        },
        added: [],
        updated: [],
        preserved: [],
        conflicts: [
          {
            key: 'CONFLICT_VAR',
            localValue: 'local-value',
            cloudValue: 'cloud-value',
            resolution: 'local' as const
          }
        ],
        fileExisted: true,
        backupCreated: false
      };

      const content = envSync.generateEnvFileContent(mergeResult, 'test-project', {});

      expect(content).toContain('# --- Resolved conflicts ---');
      expect(content).toContain('# CONFLICT_VAR: Using local value');
      expect(content).toContain('#   Cloud value was: cloud-value');
      expect(content).toContain('CONFLICT_VAR=local-value');
    });

    it('should escape values with special characters', () => {
      const mergeResult = {
        final: {
          QUOTED_VAR: 'value with spaces',
          HASH_VAR: 'value#with#hash',
          QUOTE_VAR: 'value"with"quotes'
        },
        added: ['QUOTED_VAR', 'HASH_VAR', 'QUOTE_VAR'],
        updated: [],
        preserved: [],
        conflicts: [],
        fileExisted: false,
        backupCreated: false
      };

      const cloudVars = {
        QUOTED_VAR: 'value with spaces',
        HASH_VAR: 'value#with#hash',
        QUOTE_VAR: 'value"with"quotes'
      };

      const content = envSync.generateEnvFileContent(mergeResult, 'test-project', cloudVars);

      expect(content).toContain('QUOTED_VAR="value with spaces"');
      expect(content).toContain('HASH_VAR="value#with#hash"');
      expect(content).toContain('QUOTE_VAR="value\\"with\\"quotes"');
    });
  });

  describe('readExistingEnvFile', () => {
    it('should return parsed variables when file exists', async () => {
      const mockContent = 'KEY1=value1\nKEY2=value2';
      mockDaytonaClient.readEnvFile.mockResolvedValue(mockContent);

      const result = await envSync.readExistingEnvFile('sandbox-id', 'project-name');

      expect(mockDaytonaClient.readEnvFile).toHaveBeenCalledWith('sandbox-id', 'project-name');
      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2'
      });
    });

    it('should return null when file does not exist', async () => {
      mockDaytonaClient.readEnvFile.mockResolvedValue(null);

      const result = await envSync.readExistingEnvFile('sandbox-id', 'project-name');

      expect(mockDaytonaClient.readEnvFile).toHaveBeenCalledWith('sandbox-id', 'project-name');
      expect(result).toBeNull();
    });
  });

  describe('syncEnvironmentVariables', () => {
    it('should perform complete sync with all steps', async () => {
      // Mock existing local file
      const localContent = 'LOCAL_VAR=local-value\nSHARED_VAR=local-shared';
      mockDaytonaClient.readEnvFile.mockResolvedValue(localContent);
      mockDaytonaClient.writeEnvFile.mockResolvedValue(undefined);

      const cloudVars = {
        SHARED_VAR: 'cloud-shared',
        CLOUD_VAR: 'cloud-value'
      };

      const result = await envSync.syncEnvironmentVariables(
        'sandbox-id',
        cloudVars,
        'test-project',
        {
          conflictResolution: 'prefer-local',
          createBackup: true
        }
      );

      expect(mockDaytonaClient.readEnvFile).toHaveBeenCalledWith('sandbox-id', 'test-project');
      expect(mockDaytonaClient.writeEnvFile).toHaveBeenCalledWith(
        'sandbox-id',
        expect.stringContaining('# AgentsOS Environment Variables'),
        true,
        'test-project'
      );

      expect(result).toEqual({
        final: {
          SHARED_VAR: 'local-shared',
          CLOUD_VAR: 'cloud-value',
          LOCAL_VAR: 'local-value'
        },
        added: ['CLOUD_VAR'],
        updated: [],
        preserved: ['LOCAL_VAR'],
        conflicts: [
          {
            key: 'SHARED_VAR',
            localValue: 'local-shared',
            cloudValue: 'cloud-shared',
            resolution: 'local'
          }
        ],
        fileExisted: true,
        backupCreated: true
      });
    });

    it('should handle first-time sync with no existing file', async () => {
      mockDaytonaClient.readEnvFile.mockResolvedValue(null);
      mockDaytonaClient.writeEnvFile.mockResolvedValue(undefined);

      const cloudVars = {
        API_KEY: 'cloud-api-key',
        DATABASE_URL: 'cloud-db-url'
      };

      const result = await envSync.syncEnvironmentVariables(
        'sandbox-id',
        cloudVars,
        'test-project'
      );

      expect(result).toEqual({
        final: {
          API_KEY: 'cloud-api-key',
          DATABASE_URL: 'cloud-db-url'
        },
        added: ['API_KEY', 'DATABASE_URL'],
        updated: [],
        preserved: [],
        conflicts: [],
        fileExisted: false,
        backupCreated: false
      });
    });
  });

  describe('escapeValue', () => {
    it('should not quote simple values', () => {
      const escapeValue = (envSync as unknown as { escapeValue: (value: string) => string }).escapeValue.bind(envSync);
      
      expect(escapeValue('simple')).toBe('simple');
      expect(escapeValue('123')).toBe('123');
      expect(escapeValue('simple_value')).toBe('simple_value');
    });

    it('should quote values with spaces', () => {
      const escapeValue = (envSync as unknown as { escapeValue: (value: string) => string }).escapeValue.bind(envSync);
      
      expect(escapeValue('value with spaces')).toBe('"value with spaces"');
    });

    it('should quote and escape values with quotes', () => {
      const escapeValue = (envSync as unknown as { escapeValue: (value: string) => string }).escapeValue.bind(envSync);
      
      expect(escapeValue('value"with"quotes')).toBe('"value\\"with\\"quotes"');
    });

    it('should quote values with hash symbols', () => {
      const escapeValue = (envSync as unknown as { escapeValue: (value: string) => string }).escapeValue.bind(envSync);
      
      expect(escapeValue('value#with#hash')).toBe('"value#with#hash"');
    });
  });
});