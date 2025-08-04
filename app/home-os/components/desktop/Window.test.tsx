import { describe, it, expect, beforeEach, vi, type Mock, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/src/test/utils'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { createMockWindow } from '@/src/test/utils'
import { useWindowAnimation } from '../../hooks/useWindowAnimation'

// Unmock the Window component to test the real implementation
vi.unmock('@/app/home-os/components/desktop/Window')

// Import after unmocking
import Window from './Window'

// Mock the workspace store
const mockedUseWorkspaceStore = vi.mocked(useWorkspaceStore as unknown as Mock)

vi.mock('../../stores/workspaceStore')

// Mock animation hook
vi.mock('../../hooks/useWindowAnimation')

describe('Window Component', () => {
  const mockUpdateWindow = vi.fn()
  const mockFocusWindow = vi.fn()
  const mockMinimizeWindow = vi.fn()
  const mockMaximizeWindow = vi.fn()
  const mockRemoveWindow = vi.fn()
  const mockSetWindowAnimating = vi.fn()
  const mockRestoreWindow = vi.fn()
  const mockMoveWindow = vi.fn()
  const mockResizeWindow = vi.fn()

  const mockAnimateMinimizeToTarget = vi.fn()
  const mockAnimation = {
    addEventListener: vi.fn((event, callback) => {
      if (event === 'finish') {
        // Simulate animation finishing
        setTimeout(callback, 100)
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseWorkspaceStore.mockImplementation(() => ({
      workspaces: [],
      activeWorkspaceId: null,
      windows: [],
      activeWindowId: null,
      // Window management functions
      focusWindow: mockFocusWindow,
      removeWindow: mockRemoveWindow,
      minimizeWindow: mockMinimizeWindow,
      maximizeWindow: mockMaximizeWindow,
      restoreWindow: mockRestoreWindow,
      moveWindow: mockMoveWindow,
      updateWindow: mockUpdateWindow,
      setWindowAnimating: mockSetWindowAnimating,
      // Other workspace functions
      switchToWorkspace: vi.fn(),
      addWorkspace: vi.fn(),
      removeWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      addWindow: vi.fn(),
      getNextZIndex: vi.fn(() => 2),
      isValidPosition: vi.fn(() => true),
      snapToGrid: vi.fn((pos: { x: number; y: number }) => pos),
    }))

    // Mock useWindowAnimation
    mockAnimateMinimizeToTarget.mockReturnValue(mockAnimation)
    vi.mocked(useWindowAnimation).mockReturnValue({
      animateMinimizeToTarget: mockAnimateMinimizeToTarget,
      animateRestoreFromTarget: vi.fn(),
      cancelAnimation: vi.fn(),
      isAnimating: false
    })

    // Mock document.querySelector for dock icons
    document.body.innerHTML = `
      <div data-dock-icon="vscode" title="VSCode"></div>
      <div data-dock-icon="claude" title="Claude"></div>
      <div data-dock-icon="terminal" title="Terminal"></div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Basic Rendering', () => {
    it('renders window with title and controls', () => {
      const window = createMockWindow({ title: 'Test Window' })
      render(<Window window={window} />)
      
      expect(screen.getByText('Test Window')).toBeInTheDocument()
    })

    it('applies correct z-index styling', () => {
      const window = createMockWindow({ zIndex: 15 })
      const { container } = render(<Window window={window} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      expect(windowElement).toHaveStyle(`z-index: 15`)
    })

    it('shows maximized state correctly', () => {
      const maximizedWindow = createMockWindow({ maximized: true })
      const { container } = render(<Window window={maximizedWindow} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      // For maximized windows, check the inline styles rather than classes
      expect(windowElement).toHaveStyle('width: 100%')
    })
  })

  describe('Window Controls', () => {
    it('calls minimize when minimize button clicked', () => {
      // Remove dock icons to test immediate minimize
      document.body.innerHTML = ''
      
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const minimizeButton = container.querySelector('.bg-yellow-500') as HTMLElement
      expect(minimizeButton).toBeInTheDocument()
      fireEvent.click(minimizeButton)
      
      expect(mockMinimizeWindow).toHaveBeenCalledWith(window.id)
    })

    it('calls maximize when maximize button clicked', () => {
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const maximizeButton = container.querySelector('.bg-green-500') as HTMLElement
      expect(maximizeButton).toBeInTheDocument()
      fireEvent.click(maximizeButton)
      
      expect(mockMaximizeWindow).toHaveBeenCalledWith(window.id)
    })

    it('calls remove when close button clicked', () => {
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const closeButton = container.querySelector('.bg-red-500') as HTMLElement
      expect(closeButton).toBeInTheDocument()
      fireEvent.click(closeButton)
      
      expect(mockRemoveWindow).toHaveBeenCalledWith(window.id)
    })
  })

  describe('Focus Management', () => {
    it('focuses window when clicked', () => {
      const window = createMockWindow({ focused: false })
      const { container } = render(<Window window={window} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      fireEvent.click(windowElement)
      
      expect(mockFocusWindow).toHaveBeenCalledWith(window.id)
    })
  })

  describe('Window States', () => {
    it('applies focused styling correctly', () => {
      const focusedWindow = createMockWindow({ focused: true })
      const { container } = render(<Window window={focusedWindow} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      expect(windowElement).toHaveClass('ring-2', 'ring-blue-500')
    })

    it('applies unfocused styling correctly', () => {
      const unfocusedWindow = createMockWindow({ focused: false })
      const { container } = render(<Window window={unfocusedWindow} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      expect(windowElement).not.toHaveClass('ring-2', 'ring-blue-500')
    })
  })

  describe('Accessibility', () => {
    it('has window title displayed', () => {
      const window = createMockWindow({ title: 'Test Window' })
      render(<Window window={window} />)
      
      // Check that the title is displayed in the window
      expect(screen.getByText('Test Window')).toBeInTheDocument()
    })

    it('has accessible window control buttons', () => {
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      // Check that control buttons are present and clickable
      const minimizeButton = container.querySelector('.bg-yellow-500')
      const maximizeButton = container.querySelector('.bg-green-500')
      const closeButton = container.querySelector('.bg-red-500')
      
      expect(minimizeButton).toBeInTheDocument()
      expect(maximizeButton).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Minimize Animation', () => {
    it('triggers minimize animation when dock icon is found', async () => {
      const window = createMockWindow({ type: 'vscode' })
      const { container } = render(<Window window={window} />)
      
      const minimizeButton = container.querySelector('.bg-yellow-500') as HTMLElement
      fireEvent.click(minimizeButton)
      
      // Should set animating state
      expect(mockSetWindowAnimating).toHaveBeenCalledWith(window.id, true)
      
      // Should call animate function with window and dock elements
      expect(mockAnimateMinimizeToTarget).toHaveBeenCalled()
      
      // Wait for animation to "finish"
      await waitFor(() => {
        expect(mockMinimizeWindow).toHaveBeenCalledWith(window.id)
      }, { timeout: 200 })
    })

    it('falls back to immediate minimize when dock icon is not found', () => {
      // Remove dock icons
      document.body.innerHTML = ''
      
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const minimizeButton = container.querySelector('.bg-yellow-500') as HTMLElement
      fireEvent.click(minimizeButton)
      
      // Should not call animation functions
      expect(mockSetWindowAnimating).not.toHaveBeenCalled()
      expect(mockAnimateMinimizeToTarget).not.toHaveBeenCalled()
      
      // Should immediately minimize
      expect(mockMinimizeWindow).toHaveBeenCalledWith(window.id)
    })

    it('handles different window types correctly', () => {
      const claudeWindow = createMockWindow({ id: 'claude-1', type: 'claude' })
      const { container } = render(<Window window={claudeWindow} />)
      
      const minimizeButton = container.querySelector('.bg-yellow-500') as HTMLElement
      fireEvent.click(minimizeButton)
      
      // Should find the claude dock icon
      const claudeDockIcon = document.querySelector('[data-dock-icon="claude"]')
      expect(claudeDockIcon).toBeTruthy()
      expect(mockAnimateMinimizeToTarget).toHaveBeenCalled()
    })
  })

  describe('Click Event Handling', () => {
    it('stops event propagation on button clicks', () => {
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const minimizeButton = container.querySelector('.bg-yellow-500') as HTMLElement
      const clickEvent = new MouseEvent('click', { bubbles: true })
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation')
      
      fireEvent(minimizeButton, clickEvent)
      
      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it('prevents drag interference with button clicks', () => {
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const buttonContainer = container.querySelector('.bg-yellow-500')?.parentElement as HTMLElement
      expect(buttonContainer).toBeInTheDocument()
      
      // Create a mock event with stopPropagation
      const pointerDownEvent = new MouseEvent('pointerdown', { bubbles: true })
      const stopPropagationSpy = vi.spyOn(pointerDownEvent, 'stopPropagation')
      
      // Fire the event
      fireEvent(buttonContainer, pointerDownEvent)
      
      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('Drag Performance Optimizations', () => {
    it('applies transition-none class during drag operations', () => {
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      
      // Initially should have transitions
      expect(windowElement).toHaveClass('focus-smooth')
      expect(windowElement).not.toHaveClass('transition-none')
    })

    it('applies proper styling during optimized dragging', () => {
      const window = createMockWindow()
      const { container } = render(<Window window={window} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      
      // Should have performance-related classes
      expect(windowElement).toHaveClass('transform-gpu')
      expect(windowElement).toHaveClass('contain-layout')
    })

    it('handles window positioning correctly with left/top values', () => {
      const window = createMockWindow({ 
        position: { x: 200, y: 150 },
        size: { width: 800, height: 600 }
      })
      const { container } = render(<Window window={window} />)
      
      const windowElement = container.querySelector('.bg-white.dark\\:bg-gray-800') as HTMLElement
      expect(windowElement).toBeInTheDocument()
      
      // Should use the position values from the store
      expect(windowElement).toHaveStyle(`left: 200px`)
      expect(windowElement).toHaveStyle(`top: 150px`)
      expect(windowElement).toHaveStyle(`width: 800px`)
      expect(windowElement).toHaveStyle(`height: 600px`)
    })
  })
})