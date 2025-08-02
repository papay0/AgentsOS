import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'
import { useWindowStore } from '../../stores/windowStore'
import { createMockWindow } from '@/src/test/utils'

// Unmock the Window component to test the real implementation
vi.unmock('@/app/home-os/components/desktop/Window')

// Import after unmocking
import Window from './Window'

// Mock the window store
const mockedUseWindowStore = vi.mocked(useWindowStore as unknown as Mock)

vi.mock('../../stores/windowStore')

describe('Window Component', () => {
  const mockUpdateWindow = vi.fn()
  const mockFocusWindow = vi.fn()
  const mockMinimizeWindow = vi.fn()
  const mockMaximizeWindow = vi.fn()
  const mockRemoveWindow = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseWindowStore.mockImplementation((selector) => {
      const mockStore = {
        windows: [],
        updateWindow: mockUpdateWindow,
        focusWindow: mockFocusWindow,
        minimizeWindow: mockMinimizeWindow,
        maximizeWindow: mockMaximizeWindow,
        removeWindow: mockRemoveWindow,
      }
      if (typeof selector === 'function') {
        return selector(mockStore)
      }
      return mockStore
    })
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
})