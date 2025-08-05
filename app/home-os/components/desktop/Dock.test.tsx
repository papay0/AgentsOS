import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { createMockWindow } from '@/src/test/utils'

// Unmock the Dock component to test the real implementation
vi.unmock('@/app/home-os/components/desktop/Dock')

// Import after unmocking
import Dock from './Dock'

// Mock the workspace store
const mockedUseWorkspaceStore = vi.mocked(useWorkspaceStore as unknown as Mock)

vi.mock('../../stores/workspaceStore')

// Mock the apps module with simple apps
vi.mock('../../apps', () => ({
  getAllApps: () => [
    {
      id: 'vscode',
      metadata: {
        id: 'vscode',
        name: 'VSCode',
        description: 'Code editor',
        icon: { emoji: '💻', fallback: '💻' },
        colors: {
          primary: 'bg-blue-500',
          hover: 'hover:bg-blue-600',
          text: 'text-white'
        }
      },
      window: {
        defaultSize: { width: 1000, height: 700 },
        minSize: { width: 600, height: 400 },
        position: 'center',
        resizable: true
      },
      component: () => null
    },
    {
      id: 'claude',
      metadata: {
        id: 'claude',
        name: 'Claude Code',
        description: 'AI assistant',
        icon: { emoji: '🤖', fallback: '🤖' },
        colors: {
          primary: 'bg-purple-500',
          hover: 'hover:bg-purple-600',
          text: 'text-white'
        }
      },
      window: {
        defaultSize: { width: 600, height: 400 },
        minSize: { width: 400, height: 300 },
        position: 'cascade',
        resizable: true
      },
      component: () => null
    }
  ],
  getApp: (type: string) => ({
    metadata: {
      id: type,
      name: type,
      comingSoon: false
    },
    window: {
      defaultSize: { width: 800, height: 600 },
      position: 'center'
    }
  }),
  AppStore: {
    vscode: {
      metadata: {
        icon: { emoji: '💻', fallback: '💻' }
      }
    },
    claude: {
      metadata: {
        icon: { emoji: '🤖', fallback: '🤖' }
      }
    }
  }
}))

describe('Dock Component', () => {
  const mockAddWindow = vi.fn()
  const mockRestoreWindow = vi.fn()
  const mockFocusWindow = vi.fn()
  const mockSetWindowAnimating = vi.fn()

  const createMockWorkspace = (windows: Array<ReturnType<typeof createMockWindow>> = []) => ({
    id: 'workspace-1',
    name: 'Test Workspace',
    repository: {
      name: 'test-repo',
      url: 'https://github.com/test/repo',
      urls: {
        vscode: 'http://localhost:8080',
        claude: 'http://localhost:8081',
        terminal: 'http://localhost:8082'
      }
    },
    windows,
    nextZIndex: 10,
    activeWindowId: null,
    isInitialized: true
  })

  beforeEach(() => {
    vi.clearAllMocks()
    const mockWorkspace = createMockWorkspace()
    
    mockedUseWorkspaceStore.mockImplementation((selector) => {
      const mockStore = {
        workspaces: [mockWorkspace],
        activeWorkspaceId: 'workspace-1',
        getActiveWorkspace: () => mockWorkspace,
        addWindow: mockAddWindow,
        restoreWindow: mockRestoreWindow,
        focusWindow: mockFocusWindow,
        setWindowAnimating: mockSetWindowAnimating,
      }
      if (typeof selector === 'function') {
        return selector(mockStore)
      }
      return mockStore
    })
  })

  describe('Basic Rendering', () => {
    it('renders dock component when workspace exists', () => {
      render(<Dock />)
      
      // Check that buttons are rendered
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('has correct dock positioning', () => {
      const { container } = render(<Dock />)
      
      const dockContainer = container.querySelector('.fixed.bottom-2')
      expect(dockContainer).toBeInTheDocument()
      expect(dockContainer).toHaveClass('fixed', 'bottom-2', 'left-1/2', 'transform', '-translate-x-1/2')
    })

    it('applies glass effect styling', () => {
      const { container } = render(<Dock />)
      
      const glassEffect = container.querySelector('.rounded-3xl')
      expect(glassEffect).toBeInTheDocument()
    })

    it('does not render when no active workspace', () => {
      // Mock no active workspace
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [],
          activeWorkspaceId: null,
          getActiveWorkspace: () => null,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: mockSetWindowAnimating,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      const { container } = render(<Dock />)
      
      // Check that dock-specific elements are not present
      expect(container.querySelector('.fixed.bottom-2')).not.toBeInTheDocument()
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })
  })

  describe('App Icon Interactions', () => {
    it('calls addWindow when app icon is clicked', () => {
      render(<Dock />)
      
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])
      
      expect(mockAddWindow).toHaveBeenCalled()
    })

    it('handles window focusing for existing windows', () => {
      const existingWindow = createMockWindow({ 
        id: 'vscode-1', 
        type: 'vscode',
        minimized: false
      })
      
      const workspaceWithWindow = createMockWorkspace([existingWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [workspaceWithWindow],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => workspaceWithWindow,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: mockSetWindowAnimating,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })
      
      render(<Dock />)
      
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])
      
      // Should focus existing window instead of creating new one
      expect(mockFocusWindow).toHaveBeenCalledWith('vscode-1')
      expect(mockAddWindow).not.toHaveBeenCalled()
    })

    it('handles minimized window restoration', () => {
      const minimizedWindow = createMockWindow({ 
        id: 'vscode-1', 
        type: 'vscode',
        minimized: true
      })
      
      const workspaceWithMinimized = createMockWorkspace([minimizedWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [workspaceWithMinimized],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => workspaceWithMinimized,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: mockSetWindowAnimating,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })
      
      render(<Dock />)
      
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])
      
      expect(mockRestoreWindow).toHaveBeenCalledWith('vscode-1')
      expect(mockFocusWindow).toHaveBeenCalledWith('vscode-1')
    })
  })

  describe('Minimized Windows Display', () => {
    it('shows separator when there are minimized windows', () => {
      const minimizedWindow = createMockWindow({ 
        id: 'vscode-1', 
        type: 'vscode',
        minimized: true
      })
      
      const workspaceWithMinimized = createMockWorkspace([minimizedWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [workspaceWithMinimized],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => workspaceWithMinimized,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: mockSetWindowAnimating,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })
      
      const { container } = render(<Dock />)
      
      // Look for separator div
      const separator = container.querySelector('.w-px.h-8.bg-white\\/25')
      expect(separator).toBeInTheDocument()
    })

    it('shows indicator dots for minimized windows', () => {
      const minimizedWindow = createMockWindow({ 
        id: 'vscode-1', 
        type: 'vscode',
        minimized: true
      })
      
      const workspaceWithMinimized = createMockWorkspace([minimizedWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [workspaceWithMinimized],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => workspaceWithMinimized,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: mockSetWindowAnimating,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })
      
      const { container } = render(<Dock />)
      
      // Look for indicator dot
      const indicatorDot = container.querySelector('.w-1\\.5.h-1\\.5.bg-white.rounded-full')
      expect(indicatorDot).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<Dock />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })

  describe('Performance', () => {
    it('unmounts cleanly without memory leaks', () => {
      const { unmount } = render(<Dock />)
      expect(() => unmount()).not.toThrow()
    })
  })
})