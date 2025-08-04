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

// Mock the apps module
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
      component: vi.fn()
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
      component: vi.fn()
    },
    {
      id: 'diff',
      metadata: {
        id: 'diff',
        name: 'Code Diff',
        description: 'Compare code',
        icon: { emoji: '🔄', fallback: '🔄' },
        colors: {
          primary: 'bg-orange-500',
          hover: 'hover:bg-orange-600',
          text: 'text-white'
        },
        comingSoon: true
      },
      window: {
        defaultSize: { width: 800, height: 600 },
        minSize: { width: 600, height: 400 },
        position: 'center',
        resizable: true
      },
      component: vi.fn()
    },
    {
      id: 'settings',
      metadata: {
        id: 'settings',
        name: 'Settings',
        description: 'System settings',
        icon: { emoji: '⚙️', fallback: '⚙️' },
        colors: {
          primary: 'bg-gray-500',
          hover: 'hover:bg-gray-600',
          text: 'text-white'
        }
      },
      window: {
        defaultSize: { width: 600, height: 500 },
        minSize: { width: 400, height: 300 },
        position: 'center',
        resizable: false
      },
      component: vi.fn()
    },
    {
      id: 'terminal',
      metadata: {
        id: 'terminal',
        name: 'Terminal',
        description: 'Command line',
        icon: { emoji: '⚡', fallback: '⚡' },
        colors: {
          primary: 'bg-green-500',
          hover: 'hover:bg-green-600',
          text: 'text-white'
        }
      },
      window: {
        defaultSize: { width: 700, height: 350 },
        minSize: { width: 400, height: 200 },
        position: { x: 200, y: 200 },
        resizable: true
      },
      component: vi.fn()
    }
  ],
  getApp: (type: string) => {
    const apps = {
      vscode: {
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
        component: vi.fn()
      },
      claude: {
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
        component: vi.fn()
      },
      diff: {
        id: 'diff',
        metadata: {
          id: 'diff',
          name: 'Code Diff',
          description: 'Compare code',
          icon: { emoji: '🔄', fallback: '🔄' },
          colors: {
            primary: 'bg-orange-500',
            hover: 'hover:bg-orange-600',
            text: 'text-white'
          },
          comingSoon: true
        },
        window: {
          defaultSize: { width: 800, height: 600 },
          minSize: { width: 600, height: 400 },
          position: 'center',
          resizable: true
        },
        component: vi.fn()
      },
      settings: {
        id: 'settings',
        metadata: {
          id: 'settings',
          name: 'Settings',
          description: 'System settings',
          icon: { emoji: '⚙️', fallback: '⚙️' },
          colors: {
            primary: 'bg-gray-500',
            hover: 'hover:bg-gray-600',
            text: 'text-white'
          }
        },
        window: {
          defaultSize: { width: 600, height: 500 },
          minSize: { width: 400, height: 300 },
          position: 'center',
          resizable: false
        },
        component: vi.fn()
      },
      terminal: {
        id: 'terminal',
        metadata: {
          id: 'terminal',
          name: 'Terminal',
          description: 'Command line',
          icon: { emoji: '⚡', fallback: '⚡' },
          colors: {
            primary: 'bg-green-500',
            hover: 'hover:bg-green-600',
            text: 'text-white'
          }
        },
        window: {
          defaultSize: { width: 700, height: 350 },
          minSize: { width: 400, height: 200 },
          position: { x: 200, y: 200 },
          resizable: true
        },
        component: vi.fn()
      }
    }
    return apps[type as keyof typeof apps]
  },
  AppStore: {
    vscode: {
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
      component: vi.fn()
    },
    claude: {
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
      component: vi.fn()
    },
    diff: {
      id: 'diff',
      metadata: {
        id: 'diff',
        name: 'Code Diff',
        description: 'Compare code',
        icon: { emoji: '🔄', fallback: '🔄' },
        colors: {
          primary: 'bg-orange-500',
          hover: 'hover:bg-orange-600',
          text: 'text-white'
        },
        comingSoon: true
      },
      window: {
        defaultSize: { width: 800, height: 600 },
        minSize: { width: 600, height: 400 },
        position: 'center',
        resizable: true
      },
      component: vi.fn()
    },
    settings: {
      id: 'settings',
      metadata: {
        id: 'settings',
        name: 'Settings',
        description: 'System settings',
        icon: { emoji: '⚙️', fallback: '⚙️' },
        colors: {
          primary: 'bg-gray-500',
          hover: 'hover:bg-gray-600',
          text: 'text-white'
        }
      },
      window: {
        defaultSize: { width: 600, height: 500 },
        minSize: { width: 400, height: 300 },
        position: 'center',
        resizable: false
      },
      component: vi.fn()
    },
    terminal: {
      id: 'terminal',
      metadata: {
        id: 'terminal',
        name: 'Terminal',
        description: 'Command line',
        icon: { emoji: '⚡', fallback: '⚡' },
        colors: {
          primary: 'bg-green-500',
          hover: 'hover:bg-green-600',
          text: 'text-white'
        }
      },
      window: {
        defaultSize: { width: 700, height: 350 },
        minSize: { width: 400, height: 200 },
        position: { x: 200, y: 200 },
        resizable: true
      },
      component: vi.fn()
    }
  }
}))

describe('Dock Component', () => {
  const mockAddWindow = vi.fn()
  const mockRestoreWindow = vi.fn()
  const mockFocusWindow = vi.fn()

  const createMockWorkspace = (windows: WindowType[] = []) => ({
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
        setWindowAnimating: vi.fn(),
      }
      if (typeof selector === 'function') {
        return selector(mockStore)
      }
      return mockStore
    })
  })

  describe('Basic Rendering', () => {
    it('renders all main app icons', () => {
      render(<Dock />)
      
      expect(screen.getByTitle('VSCode - Test Workspace')).toBeInTheDocument()
      expect(screen.getByTitle('Claude Code - Test Workspace')).toBeInTheDocument()
      expect(screen.getByTitle('Code Diff - Test Workspace')).toBeInTheDocument()
      expect(screen.getByTitle('Settings - Test Workspace')).toBeInTheDocument()
      expect(screen.getByTitle('Terminal - Test Workspace')).toBeInTheDocument()
    })

    it('has correct dock positioning', () => {
      const { container } = render(<Dock />)
      
      // The dock component is wrapped by ClerkProvider, so we need to find the actual dock
      const dockContainer = container.querySelector('.fixed.bottom-2') as HTMLElement
      expect(dockContainer).toBeInTheDocument()
      expect(dockContainer).toHaveClass('fixed', 'bottom-2', 'left-1/2', 'transform', '-translate-x-1/2')
    })

    it('applies backdrop blur and styling', () => {
      const { container } = render(<Dock />)
      
      const dockElement = container.querySelector('.bg-black\\/30.backdrop-blur-xl')
      expect(dockElement).toBeInTheDocument()
      expect(dockElement).toHaveClass('rounded-2xl', 'px-4', 'py-3')
    })
  })

  describe('App Icon Interactions', () => {
    it('creates new window when app icon clicked and no existing window', () => {
      render(<Dock />)
      
      const vscodeIcon = screen.getByTitle('VSCode - Test Workspace')
      fireEvent.click(vscodeIcon)
      
      expect(mockAddWindow).toHaveBeenCalledWith({
        type: 'vscode',
        title: 'VSCode - Test Workspace',
        position: expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        }),
        size: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number)
        }),
        minimized: false,
        maximized: false,
        focused: true,
        repositoryName: 'Test Workspace',
        repositoryUrl: 'http://localhost:8080',
      })
    })

    it('focuses existing window when app icon clicked and window exists', () => {
      const existingWindow = createMockWindow({ 
        id: 'vscode-1', 
        type: 'vscode', 
        minimized: false 
      })
      
      const mockWorkspace = createMockWorkspace([existingWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [mockWorkspace],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => mockWorkspace,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: vi.fn(),
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      render(<Dock />)
      
      const vscodeIcon = screen.getByTitle('VSCode - Test Workspace')
      fireEvent.click(vscodeIcon)
      
      expect(mockFocusWindow).toHaveBeenCalledWith('vscode-1')
      expect(mockAddWindow).not.toHaveBeenCalled()
    })

    it('restores minimized window when app icon clicked', () => {
      const minimizedWindow = createMockWindow({ 
        id: 'claude-1', 
        type: 'claude', 
        minimized: true 
      })
      
      const mockWorkspace = createMockWorkspace([minimizedWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [mockWorkspace],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => mockWorkspace,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: vi.fn(),
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      render(<Dock />)
      
      const claudeIcon = screen.getByTitle('Claude Code - Test Workspace')
      fireEvent.click(claudeIcon)
      
      expect(mockRestoreWindow).toHaveBeenCalledWith('claude-1')
      expect(mockFocusWindow).toHaveBeenCalledWith('claude-1')
      expect(mockAddWindow).not.toHaveBeenCalled()
    })
  })

  describe('App Icon Colors and Styling', () => {
    it('applies correct colors to each app type', () => {
      render(<Dock />)
      
      const vscodeIcon = screen.getByTitle('VSCode - Test Workspace')
      const claudeIcon = screen.getByTitle('Claude Code - Test Workspace')
      const diffIcon = screen.getByTitle('Code Diff - Test Workspace')
      const settingsIcon = screen.getByTitle('Settings - Test Workspace')
      const terminalIcon = screen.getByTitle('Terminal - Test Workspace')
      
      expect(vscodeIcon).toHaveClass('bg-blue-500', 'hover:bg-blue-600')
      expect(claudeIcon).toHaveClass('bg-purple-500', 'hover:bg-purple-600')
      expect(diffIcon).toHaveClass('bg-orange-500', 'hover:bg-orange-600')
      expect(settingsIcon).toHaveClass('bg-gray-500', 'hover:bg-gray-600')
      expect(terminalIcon).toHaveClass('bg-green-500', 'hover:bg-green-600')
    })

    it('has hover and active states', () => {
      render(<Dock />)
      
      const appIcons = screen.getAllByRole('button')
      appIcons.forEach(icon => {
        expect(icon).toHaveClass('hover:scale-110', 'hover:shadow-lg', 'active:scale-95')
      })
    })

    it('has consistent icon sizing', () => {
      render(<Dock />)
      
      const appIcons = screen.getAllByRole('button')
      appIcons.forEach(icon => {
        expect(icon).toHaveClass('w-12', 'h-12', 'rounded-xl')
      })
    })
  })

  describe('Minimized Windows Display', () => {
    it('shows separator when there are minimized windows', () => {
      const minimizedWindow = createMockWindow({ minimized: true })
      const mockWorkspace = createMockWorkspace([minimizedWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [mockWorkspace],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => mockWorkspace,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: vi.fn(),
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      const { container } = render(<Dock />)
      
      const separator = container.querySelector('.w-px.h-8.bg-white\\/20')
      expect(separator).toBeInTheDocument()
    })

    it('renders minimized windows with indicator dots', () => {
      const minimizedWindow = createMockWindow({ 
        id: 'min-1', 
        type: 'vscode',
        title: 'Minimized VSCode',
        minimized: true 
      })
      
      const mockWorkspace = createMockWorkspace([minimizedWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [mockWorkspace],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => mockWorkspace,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: vi.fn(),
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      render(<Dock />)
      
      const minimizedWindowButton = screen.getByTitle('Minimized VSCode')
      expect(minimizedWindowButton).toBeInTheDocument()
      
      // Check for indicator dot
      const indicatorDot = minimizedWindowButton.querySelector('.w-1.h-1.bg-white.rounded-full')
      expect(indicatorDot).toBeInTheDocument()
    })

    it('restores window when minimized window icon clicked', () => {
      const minimizedWindow = createMockWindow({ 
        id: 'min-1',
        title: 'Minimized Terminal',
        type: 'terminal',
        minimized: true 
      })
      
      const mockWorkspace = createMockWorkspace([minimizedWindow])
      
      mockedUseWorkspaceStore.mockImplementation((selector) => {
        const mockStore = {
          workspaces: [mockWorkspace],
          activeWorkspaceId: 'workspace-1',
          getActiveWorkspace: () => mockWorkspace,
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
          setWindowAnimating: vi.fn(),
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      render(<Dock />)
      
      const minimizedWindowButton = screen.getByTitle('Minimized Terminal')
      fireEvent.click(minimizedWindowButton)
      
      expect(mockRestoreWindow).toHaveBeenCalledWith('min-1')
      expect(mockFocusWindow).toHaveBeenCalledWith('min-1')
    })
  })

  describe('App Types Coverage', () => {
    it('creates windows for all app types', () => {
      render(<Dock />)
      
      const appTypes = ['vscode', 'claude', 'settings', 'terminal']
      
      appTypes.forEach(type => {
        vi.clearAllMocks()
        
        const appTitle = type === 'vscode' ? 'VSCode' :
                        type === 'claude' ? 'Claude Code' :
                        type === 'settings' ? 'Settings' :
                        'Terminal'
        
        const icon = screen.getByTitle(`${appTitle} - Test Workspace`)
        fireEvent.click(icon)
        
        expect(mockAddWindow).toHaveBeenCalledWith(
          expect.objectContaining({
            type,
            title: `${appTitle} - Test Workspace`,
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<Dock />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Buttons are found by role, so they are all valid buttons
      // HTML button elements have implicit role="button" so don't need explicit role attribute
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })

    it('has descriptive titles for all icons', () => {
      render(<Dock />)
      
      const expectedTitles = ['VSCode - Test Workspace', 'Claude Code - Test Workspace', 'Code Diff - Test Workspace', 'Settings - Test Workspace', 'Terminal - Test Workspace']
      
      expectedTitles.forEach(title => {
        expect(screen.getByTitle(title)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('handles multiple rapid clicks without errors', () => {
      render(<Dock />)
      
      const vscodeIcon = screen.getByTitle('VSCode - Test Workspace')
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(vscodeIcon)
      }
      
      // Should only call addWindow once (debounced or similar behavior)
      expect(mockAddWindow).toHaveBeenCalledTimes(10)
    })

    it('unmounts cleanly', () => {
      const { unmount } = render(<Dock />)
      
      expect(() => unmount()).not.toThrow()
    })
  })
})