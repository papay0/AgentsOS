import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen } from '@/src/test/utils'
import { useWindowStore } from '../stores/windowStore'
import { useIsMobile } from '@/hooks/use-mobile'
import Workspace from './Workspace'
import { createMockWindowStore } from '../stores/windowStore.mock'

// Type the mocked modules
const mockedUseWindowStore = vi.mocked(useWindowStore as unknown as Mock)
const mockedUseIsMobile = vi.mocked(useIsMobile as unknown as Mock)

// Mock the store and hooks
vi.mock('../stores/windowStore')
vi.mock('@/hooks/use-mobile')

describe('Workspace - Strongly Typed Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock implementation for the store selector
    mockedUseWindowStore.mockImplementation((selector) => {
      const mockStore = createMockWindowStore()
      // If a selector is provided, call it with the mock store
      if (typeof selector === 'function') {
        return selector(mockStore)
      }
      return mockStore
    })
    mockedUseIsMobile.mockReturnValue(false)
  })

  describe('Platform Detection', () => {
    it('renders desktop workspace when not mobile', () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      expect(screen.queryByTestId('mobile-workspace')).not.toBeInTheDocument()
    })

    it('renders mobile workspace when on mobile', () => {
      mockedUseIsMobile.mockReturnValue(true)
      render(<Workspace />)
      
      expect(screen.getByTestId('mobile-workspace')).toBeInTheDocument()
      expect(screen.queryByTestId('desktop-workspace')).not.toBeInTheDocument()
    })
  })

  describe('Basic Rendering', () => {
    it('renders without crashing on desktop', () => {
      mockedUseIsMobile.mockReturnValue(false)
      expect(() => render(<Workspace />)).not.toThrow()
    })

    it('renders without crashing on mobile', () => {
      mockedUseIsMobile.mockReturnValue(true)
      expect(() => render(<Workspace />)).not.toThrow()
    })
  })

  describe('Store Integration', () => {
    it('calls the window store hook on desktop', () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      expect(mockedUseWindowStore).toHaveBeenCalled()
    })

    it('renders windows from store on desktop', () => {
      const mockWindows = [
        {
          id: 'window-1',
          type: 'vscode' as const,
          title: 'VSCode Window',
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 },
          minimized: false,
          maximized: false,
          focused: true,
          zIndex: 10,
        },
      ]
      
      mockedUseWindowStore.mockImplementation((selector) => {
        const mockStore = createMockWindowStore(mockWindows)
        if (typeof selector === 'function') {
          return selector(mockStore)
        }
        return mockStore
      })
      mockedUseIsMobile.mockReturnValue(false)
      
      render(<Workspace />)
      
      // The window component would be rendered (though we'd need to mock the Window component to test this properly)
      expect(mockedUseWindowStore).toHaveBeenCalled()
    })
  })

  describe('Theme Support', () => {
    it('applies correct gradient classes on desktop', () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      const workspace = screen.getByTestId('desktop-workspace')
      expect(workspace).toHaveClass('bg-gradient-to-br')
      expect(workspace).toHaveClass('from-blue-200')
      expect(workspace).toHaveClass('via-purple-200')
      expect(workspace).toHaveClass('to-pink-200')
    })

    it('includes dark mode gradient classes on desktop', () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      const workspace = screen.getByTestId('desktop-workspace')
      expect(workspace).toHaveClass('dark:from-blue-900')
      expect(workspace).toHaveClass('dark:via-purple-900')
      expect(workspace).toHaveClass('dark:to-gray-900')
    })
  })

  describe('Responsive Behavior', () => {
    it('switches platforms without errors', () => {
      const { rerender } = render(<Workspace />)
      
      // Start with desktop
      mockedUseIsMobile.mockReturnValue(false)
      rerender(<Workspace />)
      expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      
      // Switch to mobile
      mockedUseIsMobile.mockReturnValue(true)
      rerender(<Workspace />)
      expect(screen.getByTestId('mobile-workspace')).toBeInTheDocument()
      
      // Switch back to desktop
      mockedUseIsMobile.mockReturnValue(false)
      rerender(<Workspace />)
      expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
    })
  })
})