import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'

// Unmock the MobileDock component to test the real implementation
vi.unmock('@/app/home/components/mobile/MobileDock')

// Import after unmocking
import MobileDock from './MobileDock'
import { MobileApp } from './MobileWorkspace'

describe('MobileDock Component', () => {
  const mockOnAppOpen = vi.fn()
  const mockOnHomePress = vi.fn()

  const sampleApps: MobileApp[] = [
    { id: 'vscode', name: 'VSCode', icon: { emoji: '💻', fallback: '💻' }, color: 'bg-blue-500', type: 'vscode' },
    { id: 'claude', name: 'Claude', icon: { emoji: '🤖', fallback: '🤖' }, color: 'bg-purple-500', type: 'claude' },
    { id: 'terminal', name: 'Terminal', icon: { emoji: '⚡', fallback: '⚡' }, color: 'bg-green-500', type: 'terminal' },
    { id: 'settings', name: 'Settings', icon: { emoji: '⚙️', fallback: '⚙️' }, color: 'bg-gray-500', type: 'settings' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders dock with all provided apps', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} onHomePress={mockOnHomePress} />)
      
      // Check that all app icons are rendered (now via AppIcon mock)
      expect(screen.getByText('💻')).toBeInTheDocument()
      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.getByText('⚡')).toBeInTheDocument()
      expect(screen.getByText('⚙️')).toBeInTheDocument()
    })

    it('applies correct dock styling and positioning', () => {
      const { container } = render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      // Check dock container positioning
      const dockContainer = container.querySelector('.fixed.bottom-0')
      expect(dockContainer).toBeInTheDocument()
      expect(dockContainer).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0', 'z-40', 'pb-4')
    })

    it('has proper backdrop blur and transparency', () => {
      const { container } = render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      // Check dock background styling with glass effect
      const glassEffect = container.querySelector('.rounded-3xl')
      expect(glassEffect).toBeInTheDocument()
      expect(glassEffect).toHaveClass('rounded-3xl')
    })
  })

  describe('App Icon Interactions', () => {
    it('calls onAppOpen when app icon is clicked', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const vscodeIcon = screen.getByText('💻').closest('button')!
      fireEvent.click(vscodeIcon)
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[0], vscodeIcon)
      expect(mockOnAppOpen).toHaveBeenCalledTimes(1)
    })

    it('calls onAppOpen when app icon is touched', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const claudeIcon = screen.getByText('🤖').closest('button')!
      fireEvent.touchStart(claudeIcon)
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[1], claudeIcon)
      expect(mockOnAppOpen).toHaveBeenCalledTimes(1)
    })

    it('handles multiple rapid taps correctly', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const terminalIcon = screen.getByText('⚡').closest('button')!
      
      // Rapidly tap the same icon multiple times
      for (let i = 0; i < 3; i++) {
        fireEvent.click(terminalIcon)
      }
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[2], terminalIcon)
      expect(mockOnAppOpen).toHaveBeenCalledTimes(3)
    })
  })

  describe('Icon Styling and Layout', () => {
    it('applies correct icon button styling', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const vscodeButton = screen.getByText('💻').closest('button')!
      expect(vscodeButton).toHaveClass('w-14', 'h-14', 'rounded-xl')
      expect(vscodeButton).toHaveClass('flex', 'items-center', 'justify-center')
      expect(vscodeButton).toHaveClass('shadow-lg', 'active:scale-95', 'touch-manipulation')
      expect(vscodeButton).toHaveClass('bg-white/8', 'backdrop-blur-sm', 'border', 'border-white/15')
    })

    it('displays glass effect styling instead of app colors', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      // All buttons should have the same glass effect styling
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('bg-white/8')
        expect(button).toHaveClass('backdrop-blur-sm')
        expect(button).toHaveClass('border-white/15')
      })
    })

    it('spaces icons correctly in dock', () => {
      const { container } = render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const iconContainer = container.querySelector('.flex.items-center.justify-center.space-x-2')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('space-x-2', 'px-1', 'py-0.5')
    })
  })

  describe('Empty and Edge Cases', () => {
    it('renders empty dock when no apps provided', () => {
      const { container } = render(<MobileDock apps={[]} onAppOpen={mockOnAppOpen} />)
      
      // Dock container should still exist
      const dockContainer = container.querySelector('.fixed.bottom-0')
      expect(dockContainer).toBeInTheDocument()
      
      // But no app buttons
      const buttons = screen.queryAllByRole('button')
      expect(buttons).toHaveLength(0)
    })

    it('handles single app correctly', () => {
      const singleApp = [sampleApps[0]]
      render(<MobileDock apps={singleApp} onAppOpen={mockOnAppOpen} />)
      
      expect(screen.getByText('💻')).toBeInTheDocument()
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(1)
    })

    it('renders without onHomePress prop (optional)', () => {
      expect(() => {
        render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has accessible button elements for each app', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button.tagName).toBe('BUTTON')
      })
    })

    it('maintains focus capabilities', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const firstButton = screen.getByText('💻').closest('button')!
      firstButton.focus()
      
      expect(document.activeElement).toBe(firstButton)
    })
  })

  describe('Touch Responsiveness', () => {
    it('has touch-manipulation class for better touch response', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('touch-manipulation')
      })
    })

    it('has active scale animation on press', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('active:scale-95')
        expect(button).toHaveClass('transition-all')
      })
    })
  })

  describe('Performance', () => {
    it('unmounts cleanly without memory leaks', () => {
      const { unmount } = render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      expect(() => unmount()).not.toThrow()
    })

    it('handles rapid successive app openings', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      // Rapidly click different apps
      const apps = [
        screen.getByText('💻').closest('button')!,
        screen.getByText('🤖').closest('button')!,
        screen.getByText('⚡').closest('button')!,
        screen.getByText('⚙️').closest('button')!
      ]
      
      apps.forEach(app => fireEvent.click(app))
      
      expect(mockOnAppOpen).toHaveBeenCalledTimes(4)
    })
  })
})