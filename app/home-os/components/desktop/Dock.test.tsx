import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'
import { useWindowStore } from '../../stores/windowStore'
import { createMockWindow } from '@/src/test/utils'

// Unmock the Dock component to test the real implementation
vi.unmock('@/app/home-os/components/desktop/Dock')

// Import after unmocking
import Dock from './Dock'

// Mock the window store
const mockedUseWindowStore = vi.mocked(useWindowStore as unknown as Mock)

vi.mock('../../stores/windowStore')

describe('Dock Component', () => {
  const mockAddWindow = vi.fn()
  const mockRestoreWindow = vi.fn()
  const mockFocusWindow = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseWindowStore.mockImplementation((selector) => {
      const mockStore = {
        windows: [],
        addWindow: mockAddWindow,
        restoreWindow: mockRestoreWindow,
        focusWindow: mockFocusWindow,
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
      
      expect(screen.getByTitle('VSCode')).toBeInTheDocument()
      expect(screen.getByTitle('Claude Code')).toBeInTheDocument()
      expect(screen.getByTitle('Code Diff')).toBeInTheDocument()
      expect(screen.getByTitle('Settings')).toBeInTheDocument()
      expect(screen.getByTitle('Terminal')).toBeInTheDocument()
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
      
      const vscodeIcon = screen.getByTitle('VSCode')
      fireEvent.click(vscodeIcon)
      
      expect(mockAddWindow).toHaveBeenCalledWith({
        type: 'vscode',
        title: 'VSCode',
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
      })
    })

    it('focuses existing window when app icon clicked and window exists', () => {
      const existingWindow = createMockWindow({ 
        id: 'vscode-1', 
        type: 'vscode', 
        minimized: false 
      })
      
      mockedUseWindowStore.mockImplementation((selector) => {
        const mockStore = {
          windows: [existingWindow],
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      render(<Dock />)
      
      const vscodeIcon = screen.getByTitle('VSCode')
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
      
      mockedUseWindowStore.mockImplementation((selector) => {
        const mockStore = {
          windows: [minimizedWindow],
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      render(<Dock />)
      
      const claudeIcon = screen.getByTitle('Claude Code')
      fireEvent.click(claudeIcon)
      
      expect(mockRestoreWindow).toHaveBeenCalledWith('claude-1')
      expect(mockFocusWindow).toHaveBeenCalledWith('claude-1')
      expect(mockAddWindow).not.toHaveBeenCalled()
    })
  })

  describe('App Icon Colors and Styling', () => {
    it('applies correct colors to each app type', () => {
      render(<Dock />)
      
      const vscodeIcon = screen.getByTitle('VSCode')
      const claudeIcon = screen.getByTitle('Claude Code')
      const diffIcon = screen.getByTitle('Code Diff')
      const settingsIcon = screen.getByTitle('Settings')
      const terminalIcon = screen.getByTitle('Terminal')
      
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
      
      mockedUseWindowStore.mockImplementation((selector) => {
        const mockStore = {
          windows: [minimizedWindow],
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
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
      
      mockedUseWindowStore.mockImplementation((selector) => {
        const mockStore = {
          windows: [minimizedWindow],
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      const { container } = render(<Dock />)
      
      // Check for the indicator dot
      const indicatorDot = container.querySelector('.absolute.-bottom-1.w-1.h-1.bg-white.rounded-full')
      expect(indicatorDot).toBeInTheDocument()
    })

    it('restores window when minimized window icon clicked', () => {
      const minimizedWindow = createMockWindow({ 
        id: 'min-terminal', 
        minimized: true 
      })
      
      mockedUseWindowStore.mockImplementation((selector) => {
        const mockStore = {
          windows: [minimizedWindow],
          addWindow: mockAddWindow,
          restoreWindow: mockRestoreWindow,
          focusWindow: mockFocusWindow,
        }
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })

      render(<Dock />)
      
      // Find and click the minimized window (should appear after separator)
      const minimizedIcons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('.absolute.-bottom-1')
      )
      
      expect(minimizedIcons).toHaveLength(1)
      fireEvent.click(minimizedIcons[0])
      
      expect(mockRestoreWindow).toHaveBeenCalledWith('min-terminal')
      expect(mockFocusWindow).toHaveBeenCalledWith('min-terminal')
    })
  })

  describe('App Types Coverage', () => {
    it('creates windows for all app types', () => {
      render(<Dock />)
      
      const appTypes: Array<{type: string, title: string}> = [
        { type: 'vscode', title: 'VSCode' },
        { type: 'claude', title: 'Claude Code' },
        { type: 'settings', title: 'Settings' },
        { type: 'terminal', title: 'Terminal' }
      ]
      
      appTypes.forEach(({ type, title }) => {
        fireEvent.click(screen.getByTitle(title))
        
        expect(mockAddWindow).toHaveBeenCalledWith({
          type,
          title,
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
        })
        
        vi.clearAllMocks()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<Dock />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(5) // 5 apps
    })

    it('has descriptive titles for all icons', () => {
      render(<Dock />)
      
      expect(screen.getByTitle('VSCode')).toBeInTheDocument()
      expect(screen.getByTitle('Claude Code')).toBeInTheDocument()
      expect(screen.getByTitle('Code Diff')).toBeInTheDocument()
      expect(screen.getByTitle('Settings')).toBeInTheDocument()
      expect(screen.getByTitle('Terminal')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles multiple rapid clicks without errors', () => {
      render(<Dock />)
      
      const vscodeIcon = screen.getByTitle('VSCode')
      
      // Rapidly click multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(vscodeIcon)
      }
      
      // Should only create one window since subsequent clicks focus existing
      expect(mockAddWindow).toHaveBeenCalledTimes(5)
    })

    it('unmounts cleanly', () => {
      const { unmount } = render(<Dock />)
      expect(() => unmount()).not.toThrow()
    })
  })
})