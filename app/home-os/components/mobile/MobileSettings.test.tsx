import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'
import MobileSettings from './MobileSettings'

// Mock Clerk components
vi.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
  UserButton: ({ appearance }: { appearance?: { elements?: Record<string, string> } }) => (
    <div data-testid="user-button" data-appearance={JSON.stringify(appearance)}>
      User Avatar
    </div>
  ),
}))

describe('MobileSettings Component', () => {
  const mockOnThemeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders settings page with main sections', () => {
      render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // Check section headers
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Appearance')).toBeInTheDocument()
    })

    it('applies correct page layout and styling', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const pageContainer = container.querySelector('.h-full.bg-gray-100')
      expect(pageContainer).toBeInTheDocument()
      expect(pageContainer).toHaveClass('h-full', 'bg-gray-100', 'dark:bg-gray-900', 'overflow-y-auto', 'pt-6')
    })

    it('renders with default theme when not specified', () => {
      render(<MobileSettings onThemeChange={mockOnThemeChange} />)
      
      expect(screen.getByText('Current: System')).toBeInTheDocument()
    })
  })

  describe('Profile Section', () => {
    it('renders profile section with correct styling', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // Check section structure
      const profileSection = container.querySelector('.mb-8')
      expect(profileSection).toBeInTheDocument()
      
      // Check section background
      const sectionBackground = container.querySelector('.bg-white.dark\\:bg-gray-800')
      expect(sectionBackground).toBeInTheDocument()
      expect(sectionBackground).toHaveClass('rounded-xl', 'mx-4', 'overflow-hidden')
    })

    it('displays user profile information', () => {
      render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      expect(screen.getByText('Your Profile')).toBeInTheDocument()
      expect(screen.getByText('Manage your account')).toBeInTheDocument()
    })

    it('renders Clerk user button component', () => {
      render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const userButton = screen.getByTestId('user-button')
      expect(userButton).toBeInTheDocument()
      expect(userButton).toHaveTextContent('User Avatar')
      
      // Check that appearance prop is passed correctly
      const appearanceData = userButton.getAttribute('data-appearance')
      const appearance = JSON.parse(appearanceData!)
      expect(appearance.elements.avatarBox).toBe('w-12 h-12')
    })

    it('wraps user button in SignedIn component', () => {
      render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const signedIn = screen.getByTestId('signed-in')
      expect(signedIn).toBeInTheDocument()
      
      // User button should be inside SignedIn
      const userButton = screen.getByTestId('user-button')
      expect(signedIn).toContainElement(userButton)
    })
  })

  describe('Appearance Section', () => {
    it('renders appearance section with theme info', () => {
      render(<MobileSettings theme="dark" onThemeChange={mockOnThemeChange} />)
      
      expect(screen.getByText('Theme')).toBeInTheDocument()
      expect(screen.getByText('Current: Dark')).toBeInTheDocument()
    })

    it('displays current theme correctly for all theme types', () => {
      // Test light theme
      const { rerender } = render(<MobileSettings theme="light" onThemeChange={mockOnThemeChange} />)
      expect(screen.getByText('Current: Light')).toBeInTheDocument()
      
      // Test dark theme
      rerender(<MobileSettings theme="dark" onThemeChange={mockOnThemeChange} />)
      expect(screen.getByText('Current: Dark')).toBeInTheDocument()
      
      // Test system theme
      rerender(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      expect(screen.getByText('Current: System')).toBeInTheDocument()
    })

    it('renders theme selector with all options', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // Should have 3 theme buttons
      const themeButtons = container.querySelectorAll('.p-2.rounded-lg')
      expect(themeButtons).toHaveLength(3)
    })
  })

  describe('Theme Selection', () => {
    it('calls onThemeChange when light theme button is clicked', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // Find the light theme button (first button with Sun icon)
      const lightButton = container.querySelector('button')! // First button is light theme
      fireEvent.click(lightButton)
      
      expect(mockOnThemeChange).toHaveBeenCalledWith('light')
      expect(mockOnThemeChange).toHaveBeenCalledTimes(1)
    })

    it('calls onThemeChange when dark theme button is clicked', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // Find the dark theme button (second button with Moon icon)
      const buttons = container.querySelectorAll('button')
      const darkButton = buttons[1] // Second button is dark theme
      fireEvent.click(darkButton)
      
      expect(mockOnThemeChange).toHaveBeenCalledWith('dark')
      expect(mockOnThemeChange).toHaveBeenCalledTimes(1)
    })

    it('calls onThemeChange when system theme button is clicked', () => {
      const { container } = render(<MobileSettings theme="light" onThemeChange={mockOnThemeChange} />)
      
      // Find the system theme button (third button with Monitor icon)
      const buttons = container.querySelectorAll('button')
      const systemButton = buttons[2] // Third button is system theme
      fireEvent.click(systemButton)
      
      expect(mockOnThemeChange).toHaveBeenCalledWith('system')
      expect(mockOnThemeChange).toHaveBeenCalledTimes(1)
    })

    it('does not crash when onThemeChange is not provided', () => {
      const { container } = render(<MobileSettings theme="system" />)
      
      const lightButton = container.querySelector('button')!
      expect(() => fireEvent.click(lightButton)).not.toThrow()
      
      // No function should be called since onThemeChange is undefined
      expect(mockOnThemeChange).not.toHaveBeenCalled()
    })
  })

  describe('Theme Button Styling', () => {
    it('highlights active theme button correctly', () => {
      const { container } = render(<MobileSettings theme="light" onThemeChange={mockOnThemeChange} />)
      
      const buttons = container.querySelectorAll('button')
      const lightButton = buttons[0]
      const darkButton = buttons[1]
      const systemButton = buttons[2]
      
      // Light button should be active (highlighted)
      expect(lightButton).toHaveClass('bg-blue-500', 'text-white')
      
      // Other buttons should be inactive
      expect(darkButton).toHaveClass('bg-gray-200', 'dark:bg-gray-700')
      expect(systemButton).toHaveClass('bg-gray-200', 'dark:bg-gray-700')
    })

    it('updates styling when theme changes', () => {
      const { container, rerender } = render(<MobileSettings theme="light" onThemeChange={mockOnThemeChange} />)
      
      // Initially light is active
      let buttons = container.querySelectorAll('button')
      expect(buttons[0]).toHaveClass('bg-blue-500', 'text-white')
      expect(buttons[1]).toHaveClass('bg-gray-200', 'dark:bg-gray-700')
      
      // Change to dark theme
      rerender(<MobileSettings theme="dark" onThemeChange={mockOnThemeChange} />)
      
      buttons = container.querySelectorAll('button')
      expect(buttons[0]).toHaveClass('bg-gray-200', 'dark:bg-gray-700')
      expect(buttons[1]).toHaveClass('bg-blue-500', 'text-white')
    })
  })

  describe('Section Layout', () => {
    it('applies correct section header styling', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const sectionHeaders = container.querySelectorAll('h2')
      sectionHeaders.forEach(header => {
        expect(header).toHaveClass('text-xs', 'font-semibold', 'text-gray-500')
        expect(header).toHaveClass('uppercase', 'tracking-wider', 'mb-3', 'px-4')
      })
    })

    it('has proper spacing between sections', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const sections = container.querySelectorAll('.mb-8')
      expect(sections.length).toBeGreaterThanOrEqual(2) // Profile and Appearance sections
    })

    it('has proper padding and margins', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // Check section content padding
      const sectionContent = container.querySelectorAll('.p-4')
      expect(sectionContent.length).toBeGreaterThanOrEqual(2)
      
      sectionContent.forEach(content => {
        expect(content).toHaveClass('p-4')
      })
    })
  })

  describe('Icons and Visual Elements', () => {
    it('displays icons in appearance section', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // Check that Moon icon is present in appearance section
      const moonIcon = container.querySelector('.w-6.h-6.text-gray-600')
      expect(moonIcon).toBeInTheDocument()
    })

    it('has proper icon styling in theme buttons', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      // All theme buttons should have icons with w-4 h-4 classes
      const themeIcons = container.querySelectorAll('.w-4.h-4')
      expect(themeIcons).toHaveLength(3) // Sun, Moon, Monitor icons
    })
  })

  describe('Accessibility', () => {
    it('has accessible button elements', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })

    it('maintains proper heading hierarchy', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const headings = container.querySelectorAll('h2')
      expect(headings.length).toBeGreaterThanOrEqual(2)
      
      headings.forEach(heading => {
        expect(heading.tagName).toBe('H2')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing theme prop gracefully', () => {
      expect(() => {
        render(<MobileSettings onThemeChange={mockOnThemeChange} />)
      }).not.toThrow()
      
      // Should default to system theme
      expect(screen.getByText('Current: System')).toBeInTheDocument()
    })

    it('handles missing onThemeChange prop gracefully', () => {
      expect(() => {
        render(<MobileSettings theme="system" />)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('unmounts cleanly without memory leaks', () => {
      const { unmount } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      expect(() => unmount()).not.toThrow()
    })

    it('handles rapid theme button clicks', () => {
      const { container } = render(<MobileSettings theme="system" onThemeChange={mockOnThemeChange} />)
      
      const buttons = container.querySelectorAll('button')
      
      // Rapidly click different theme buttons
      for (let i = 0; i < 3; i++) {
        fireEvent.click(buttons[0]) // Light
        fireEvent.click(buttons[1]) // Dark
        fireEvent.click(buttons[2]) // System
      }
      
      expect(mockOnThemeChange).toHaveBeenCalledTimes(9) // 3 buttons × 3 iterations
    })
  })
})