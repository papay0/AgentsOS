/**
 * Unit tests for SyncEnvVars React component
 * Tests UI interactions, API calls, and result display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncEnvVars } from './SyncEnvVars';

// Mock the workspace store
const mockWorkspaceStore = {
  getActiveWorkspace: vi.fn(),
  sandboxId: 'test-sandbox-id'
};

vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockWorkspaceStore);
    }
    return mockWorkspaceStore;
  })
}));

// Mock fetch
global.fetch = vi.fn();

describe('SyncEnvVars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silence console.error during tests to keep output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockWorkspaceStore.getActiveWorkspace.mockReturnValue({
      id: 'test-workspace',
      name: 'Test Workspace'
    });
    mockWorkspaceStore.sandboxId = 'test-sandbox-id';
  });

  describe('Rendering', () => {
    it('should render sync button when workspace is active and has variables', () => {
      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      expect(screen.getByText('Smart Sync to Workspace')).toBeInTheDocument();
      expect(screen.getByText(/Smart sync automatically creates/)).toBeInTheDocument();
    });

    it('should show message when no workspace is active', () => {
      mockWorkspaceStore.getActiveWorkspace.mockReturnValue(null);
      mockWorkspaceStore.sandboxId = null as unknown as string;
      
      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      expect(screen.getByText('Open a workspace to sync environment variables')).toBeInTheDocument();
      expect(screen.queryByText('Smart Sync to Workspace')).not.toBeInTheDocument();
    });

    it('should not render when no variables exist', () => {
      const { container } = render(<SyncEnvVars projectName="test-project" hasVariables={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should disable button during sync', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          json: () => Promise.resolve({ success: true, summary: { added: [], updated: [], preserved: [] } })
        }), 100))
      );

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      const button = screen.getByText('Smart Sync to Workspace');
      fireEvent.click(button);
      
      expect(screen.getByText('Writing to Workspace...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe('API Integration', () => {
    it('should make correct API call on sync', async () => {
      const mockResponse = {
        success: true,
        summary: {
          added: ['API_KEY'],
          updated: ['DATABASE_URL'],
          preserved: ['LOCAL_VAR'],
          conflicts: [],
          fileExisted: true,
          backupCreated: true
        }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      const button = screen.getByText('Smart Sync to Workspace');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/env-vars/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workspaceId: 'test-sandbox-id',
            projectName: 'test-project',
            mode: 'smart',
            conflictResolution: 'prefer-local'
          })
        });
      });
    });

    it('should not make API call when required data is missing', () => {
      mockWorkspaceStore.sandboxId = null as unknown as string;
      
      render(<SyncEnvVars projectName="" hasVariables={true} />);
      
      const button = screen.queryByText('Smart Sync to Workspace');
      expect(button).not.toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Success Results Display', () => {
    it('should display successful sync results', async () => {
      const mockResponse = {
        success: true,
        summary: {
          added: ['API_KEY', 'DATABASE_URL'],
          updated: ['UPDATED_VAR'],
          preserved: ['LOCAL_VAR'],
          conflicts: [],
          fileExisted: true,
          backupCreated: true
        }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(screen.getByText(/Smart sync complete!/)).toBeInTheDocument();
      });

      // Check added variables
      expect(screen.getByText('✅ Added (2):')).toBeInTheDocument();
      expect(screen.getByText('API_KEY')).toBeInTheDocument();
      expect(screen.getByText('DATABASE_URL')).toBeInTheDocument();

      // Check updated variables
      expect(screen.getByText('🔄 Updated (1):')).toBeInTheDocument();
      expect(screen.getByText('UPDATED_VAR')).toBeInTheDocument();

      // Check preserved variables
      expect(screen.getByText('💾 Preserved local (1):')).toBeInTheDocument();
      expect(screen.getByText('LOCAL_VAR')).toBeInTheDocument();

      // Check file location hint
      expect(screen.getByText(/Check your project directory for/)).toBeInTheDocument();
    });

    it('should display conflict resolutions', async () => {
      const mockResponse = {
        success: true,
        summary: {
          added: [],
          updated: [],
          preserved: [],
          conflicts: [
            {
              key: 'CONFLICT_VAR',
              localValue: 'local-value',
              cloudValue: 'cloud-value',
              resolution: 'local'
            }
          ],
          fileExisted: true,
          backupCreated: false
        }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(screen.getByText('⚠️ Conflicts resolved (1):')).toBeInTheDocument();
      });

      expect(screen.getByText('CONFLICT_VAR')).toBeInTheDocument();
      expect(screen.getByText(': Using local value')).toBeInTheDocument();
    });

    it('should display message for new file creation', async () => {
      const mockResponse = {
        success: true,
        summary: {
          added: ['NEW_VAR1', 'NEW_VAR2'],
          updated: [],
          preserved: [],
          conflicts: [],
          fileExisted: false,
          backupCreated: false
        }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(screen.getByText('Created .env.local with 2 variables')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message from API', async () => {
      const mockResponse = {
        success: false,
        error: 'Project directory not found'
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(screen.getByText('Project directory not found')).toBeInTheDocument();
      });

      // Check error styling - look for the right container element
      const errorContainer = screen.getByText('Project directory not found').closest('.bg-red-50');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(screen.getByText('An error occurred while syncing')).toBeInTheDocument();
      });
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(screen.getByText('An error occurred while syncing')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      const button = screen.getByRole('button', { name: /Smart Sync to Workspace/ });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be keyboard accessible', () => {
      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      const button = screen.getByText('Smart Sync to Workspace');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('UI States', () => {
    it('should show loading state during sync', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          json: () => Promise.resolve({ success: true, summary: { added: [] } })
        }), 100))
      );

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      const button = screen.getByText('Smart Sync to Workspace');
      fireEvent.click(button);
      
      expect(screen.getByText('Writing to Workspace...')).toBeInTheDocument();
      // Check for loading spinner by class (no test-id needed)
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should reset to normal state after sync completion', async () => {
      const mockResponse = {
        success: true,
        summary: {
          added: ['API_KEY'],
          updated: [],
          preserved: [],
          conflicts: [],
          fileExisted: false,
          backupCreated: false
        }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<SyncEnvVars projectName="test-project" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(screen.getByText('Smart Sync to Workspace')).toBeInTheDocument();
      });

      const button = screen.getByText('Smart Sync to Workspace');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Props Validation', () => {
    it('should handle empty project name', () => {
      render(<SyncEnvVars projectName="" hasVariables={true} />);
      
      // Button should still be rendered but won't sync (checked in handleSync function)
      const button = screen.getByText('Smart Sync to Workspace');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled(); // Button isn't visually disabled, but handleSync prevents action
    });

    it('should handle special characters in project name', async () => {
      const mockResponse = {
        success: true,
        summary: { added: [], updated: [], preserved: [], conflicts: [] }
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      render(<SyncEnvVars projectName="test-project-with-dashes_and_underscores" hasVariables={true} />);
      
      fireEvent.click(screen.getByText('Smart Sync to Workspace'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/env-vars/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: 'test-sandbox-id',
            projectName: 'test-project-with-dashes_and_underscores',
            mode: 'smart',
            conflictResolution: 'prefer-local'
          })
        });
      });
    });
  });
});