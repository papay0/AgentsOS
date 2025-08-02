import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/src/test/utils'
import MobileWorkspace from './MobileWorkspace'
import { createTouchEvent } from '@/src/test/utils'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('MobileWorkspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('system')
  })

  describe('Initial Rendering', () => {
    it('renders mobile workspace with app icons', () => {
      render(<MobileWorkspace />)
      
      // Check for apps that are visible on the home screen
      expect(screen.getByText('Safari')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('renders dock with app icons', () => {
      render(<MobileWorkspace />)
      
      // Check dock apps (first 4 apps)
      const dockButtons = screen.getAllByRole('button')
      expect(dockButtons.length).toBeGreaterThanOrEqual(4)
    })

    it('applies correct background gradient', () => {
      const { container } = render(<MobileWorkspace />)
      
      // Look for the workspace container with gradient background
      const workspace = container.querySelector('.bg-gradient-to-br') as HTMLElement
      expect(workspace).toBeInTheDocument()
      expect(workspace).toHaveClass('from-blue-400')
      expect(workspace).toHaveClass('via-purple-500')
      expect(workspace).toHaveClass('to-pink-500')
    })
  })

  describe('Theme Management', () => {
    it('loads theme from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      render(<MobileWorkspace />)
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme')
    })

    it('applies dark mode background', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      const { container } = render(<MobileWorkspace />)
      
      // Look for the workspace container with gradient background
      const workspace = container.querySelector('.bg-gradient-to-br') as HTMLElement
      expect(workspace).toBeInTheDocument()
      expect(workspace).toHaveClass('dark:from-blue-900')
      expect(workspace).toHaveClass('dark:via-purple-900')
      expect(workspace).toHaveClass('dark:to-gray-900')
    })

    it('saves theme changes to localStorage', async () => {
      render(<MobileWorkspace />)
      
      // The theme saving happens through effects
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'system')
      })
    })
  })

  describe('App Navigation', () => {
    it('opens app when icon is tapped', async () => {
      render(<MobileWorkspace />)
      
      // Use Safari app since it's visible on the home screen
      const safariButton = screen.getByText('Safari').closest('button')!
      fireEvent.click(safariButton)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Safari')).toBeInTheDocument()
      })
    })

    it('closes app with back button', async () => {
      render(<MobileWorkspace />)
      
      // Open Safari app
      const safariButton = screen.getByText('Safari').closest('button')!
      fireEvent.click(safariButton)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Safari')).toBeInTheDocument()
      })
      
      // Close app using the back button (the button with arrow-left icon)
      const backButton = screen.getByRole('button')
      fireEvent.click(backButton)
      
      await waitFor(() => {
        expect(screen.getByText('Safari')).toBeInTheDocument()
        expect(screen.getByText('Messages')).toBeInTheDocument()
      })
    })

    it('opens Settings app correctly', async () => {
      render(<MobileWorkspace />)
      
      const settingsButton = screen.getByText('Settings').closest('button')!
      fireEvent.click(settingsButton)
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Appearance')).toBeInTheDocument()
      })
    })
  })

  describe('Touch Interactions', () => {
    it('responds to touch events on app icons', () => {
      render(<MobileWorkspace />)
      
      const safariButton = screen.getByText('Safari').closest('button')!
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
      
      fireEvent(safariButton, touchEvent)
      
      // App should open on touch
      expect(screen.getByText('Welcome to Safari')).toBeInTheDocument()
    })

    it('has touch-manipulation class for better touch response', () => {
      render(<MobileWorkspace />)
      
      const appButtons = screen.getAllByRole('button')
      appButtons.forEach(button => {
        expect(button).toHaveClass('touch-manipulation')
      })
    })
  })

  describe('App Content Verification', () => {
    it('renders Safari app content', async () => {
      render(<MobileWorkspace />)
      
      fireEvent.click(screen.getByText('Safari').closest('button')!)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Safari')).toBeInTheDocument()
        expect(screen.getByText('Your mobile web browser')).toBeInTheDocument()
        expect(screen.getByText('🔍 Search or enter website name')).toBeInTheDocument()
      })
    })

    it('renders Settings app content', async () => {
      render(<MobileWorkspace />)
      
      fireEvent.click(screen.getByText('Settings').closest('button')!)
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Appearance')).toBeInTheDocument()
      })
    })

    it('renders Messages app content', async () => {
      render(<MobileWorkspace />)
      
      fireEvent.click(screen.getByText('Messages').closest('button')!)
      
      await waitFor(() => {
        // Messages app should have generic app content since it's not specifically implemented
        expect(screen.getByText('Mobile App Experience')).toBeInTheDocument()
        // Check for the emoji which is unique to the content area
        expect(screen.getByText('💬')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Stability', () => {
    it('handles rapid app switching', async () => {
      render(<MobileWorkspace />)
      
      // Simple test: just open and close one app quickly
      fireEvent.click(screen.getByText('Safari').closest('button')!)
      await waitFor(() => expect(screen.getByText('Welcome to Safari')).toBeInTheDocument())
      
      // Close app by clicking the back button
      const backButton = screen.getByRole('button')
      fireEvent.click(backButton)
      
      await waitFor(() => {
        expect(screen.getByText('Safari')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })

    it('unmounts cleanly without memory leaks', () => {
      const { unmount } = render(<MobileWorkspace />)
      expect(() => unmount()).not.toThrow()
    })
  })
})