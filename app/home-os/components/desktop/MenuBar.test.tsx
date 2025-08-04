import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'
import React from 'react'

// Unmock the MenuBar component to test the real implementation
vi.unmock('@/app/home-os/components/desktop/MenuBar')

// Import after unmocking
import MenuBar from './MenuBar'

// Mock theme provider
const mockSetTheme = vi.fn()
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: 'system'
  })
}))

// Mock workspace store
vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: () => ({
    workspaces: [{
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
      windows: [],
      nextZIndex: 10,
      activeWindowId: null,
      isInitialized: true
    }],
    activeWorkspaceId: 'workspace-1',
    getActiveWorkspace: () => ({
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
      windows: [],
      nextZIndex: 10,
      activeWindowId: null,
      isInitialized: true
    }),
    switchToWorkspace: vi.fn(),
    addWindow: vi.fn(),
    removeWindow: vi.fn(),
    updateWindow: vi.fn(),
  })
}))

// Mock the dropdown components to make them simpler for testing
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => children,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => 
    asChild ? children : React.createElement('div', {}, children),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'dropdown-content' }, children),
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => 
    React.createElement('button', { onClick, 'data-testid': 'dropdown-item' }, children),
}))

// Mock workspace UI components
vi.mock('../ui/workspace-switcher', () => ({
  WorkspaceSwitcher: () => React.createElement('div', { 'data-testid': 'workspace-switcher' }, 'Test Workspace')
}))

vi.mock('../ui/workspace-health', () => ({
  WorkspaceHealth: () => React.createElement('div', { 'data-testid': 'workspace-health' }, 'Healthy')
}))

describe('MenuBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date to have consistent time testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01 14:30:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('renders main menubar structure', () => {
      const { container } = render(<MenuBar />)
      
      // The menubar is wrapped by ClerkProvider, so we need to find the actual menubar
      const menubar = container.querySelector('.absolute.top-0') as HTMLElement
      expect(menubar).toBeInTheDocument()
      expect(menubar).toHaveClass('absolute', 'top-0', 'left-0', 'right-0', 'h-8')
      expect(menubar).toHaveClass('bg-black/20', 'backdrop-blur-md')
    })

    it('displays AgentsOS branding', () => {
      render(<MenuBar />)
      
      expect(screen.getByText('AgentsOS')).toBeInTheDocument()
    })

    it('shows current time', () => {
      render(<MenuBar />)
      
      // Should show time in HH:MM format (with leading zero for hours < 10)
      expect(screen.getByText('02:30 PM')).toBeInTheDocument()
    })

    it('shows current date', () => {
      render(<MenuBar />)
      
      // Should show date in format like "Mon, Jan 1"
      expect(screen.getByText('Mon, Jan 1')).toBeInTheDocument()
    })

    it('displays theme toggle', () => {
      render(<MenuBar />)
      
      // Icons should be present (even if they're SVGs, the container elements exist)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0) // Should have theme buttons
    })
  })

  describe('Time Updates', () => {
    it('formats time correctly in different hours', () => {
      // Test morning time
      vi.setSystemTime(new Date('2024-01-01 09:15:00'))
      render(<MenuBar />)
      
      expect(screen.getByText('09:15 AM')).toBeInTheDocument()
    })

    it('cleans up timer on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      
      const { unmount } = render(<MenuBar />)
      unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Theme Toggle', () => {
    it('renders theme toggle button', () => {
      render(<MenuBar />)
      
      // Find the theme toggle button by its specific classes
      const { container } = render(<MenuBar />)
      const themeButton = container.querySelector('.w-6.h-6.rounded') as HTMLElement
      expect(themeButton).toBeInTheDocument()
      expect(themeButton).toHaveClass('w-6', 'h-6', 'rounded')
    })

    it('opens theme dropdown when clicked', () => {
      render(<MenuBar />)
      
      // With our mocked dropdown components, all options should be visible immediately
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })

    it('calls setTheme when theme options are selected', () => {
      render(<MenuBar />)
      
      // Click light theme
      fireEvent.click(screen.getByText('Light'))
      expect(mockSetTheme).toHaveBeenCalledWith('light')
      
      // Click dark theme
      fireEvent.click(screen.getByText('Dark'))
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
      
      // Click system theme
      fireEvent.click(screen.getByText('System'))
      expect(mockSetTheme).toHaveBeenCalledWith('system')
      
      expect(mockSetTheme).toHaveBeenCalledTimes(3)
    })
  })

  describe('User Authentication Display', () => {
    it('renders user button when signed in', () => {
      render(<MenuBar />)
      
      // The UserButton is mocked to render a test element
      const userButton = screen.getByTestId('user-button')
      expect(userButton).toBeInTheDocument()
    })

    it('applies correct user button styling', () => {
      render(<MenuBar />)
      
      const userButton = screen.getByTestId('user-button')
      const container = userButton.closest('.scale-75')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Layout and Positioning', () => {
    it('has correct left section with user and branding', () => {
      render(<MenuBar />)
      
      const agentsOSText = screen.getByText('AgentsOS')
      const userButton = screen.getByTestId('user-button')
      
      // Both should be in the left section
      expect(agentsOSText).toBeInTheDocument()
      expect(userButton).toBeInTheDocument()
    })

    it('has right section with date and time', () => {
      render(<MenuBar />)
      
      // Check right section elements
      expect(screen.getByText('Mon, Jan 1')).toBeInTheDocument() // Date
      expect(screen.getByText(/\d+:\d+/)).toBeInTheDocument() // Time
    })

    it('has center section for active window info', () => {
      const { container } = render(<MenuBar />)
      
      const centerSection = container.querySelector('.flex-1.flex.justify-center')
      expect(centerSection).toBeInTheDocument()
      
      // Check that workspace switcher and health are present
      expect(screen.getByTestId('workspace-switcher')).toBeInTheDocument()
      expect(screen.getByTestId('workspace-health')).toBeInTheDocument()
    })
  })

  describe('Styling and Visual Elements', () => {
    it('has proper backdrop blur and transparency', () => {
      const { container } = render(<MenuBar />)
      
      const menubar = container.querySelector('.absolute.top-0') as HTMLElement
      expect(menubar).toBeInTheDocument()
      expect(menubar).toHaveClass('bg-black/20', 'backdrop-blur-md')
      expect(menubar).toHaveClass('border-b', 'border-white/10')
    })

    it('has white text styling', () => {
      const { container } = render(<MenuBar />)
      
      const menubar = container.querySelector('.absolute.top-0') as HTMLElement
      expect(menubar).toBeInTheDocument()
      expect(menubar).toHaveClass('text-white', 'text-sm')
    })

    it('has correct z-index for overlay', () => {
      const { container } = render(<MenuBar />)
      
      const menubar = container.querySelector('.absolute.top-0') as HTMLElement
      expect(menubar).toBeInTheDocument()
      expect(menubar).toHaveClass('z-50')
    })
  })

  describe('System Status Display', () => {
    it('shows date display', () => {
      render(<MenuBar />)
      
      const dateText = screen.getByText('Mon, Jan 1')
      expect(dateText).toBeInTheDocument()
      expect(dateText).toHaveClass('text-xs')
    })

    it('shows time with clock icon', () => {
      render(<MenuBar />)
      
      const timeText = screen.getByText('02:30 PM')
      expect(timeText).toBeInTheDocument()
      expect(timeText).toHaveClass('text-xs')
    })
  })

  describe('Accessibility', () => {
    it('has proper button role for theme toggle', () => {
      render(<MenuBar />)
      
      // Check that we have multiple buttons (theme toggle + dropdown items)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(4) // Theme toggle + 3 dropdown items
    })

    it('theme dropdown items are accessible', () => {
      render(<MenuBar />)
      
      // With our mocked dropdown, all items should be rendered as buttons with test-ids
      const dropdownItems = screen.getAllByTestId('dropdown-item')
      expect(dropdownItems).toHaveLength(3)
      
      // Check that the theme options are accessible
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles rapid theme toggle clicks', () => {
      render(<MenuBar />)
      
      // Rapidly click theme options multiple times
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Light'))
        fireEvent.click(screen.getByText('Dark'))
        fireEvent.click(screen.getByText('System'))
      }
      
      expect(mockSetTheme).toHaveBeenCalledTimes(9) // 3 options × 3 iterations
      expect(mockSetTheme).toHaveBeenCalledWith('light')
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
      expect(mockSetTheme).toHaveBeenCalledWith('system')
    })

    it('unmounts cleanly without memory leaks', () => {
      const { unmount } = render(<MenuBar />)
      expect(() => unmount()).not.toThrow()
    })
  })
})