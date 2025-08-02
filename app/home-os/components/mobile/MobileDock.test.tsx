import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'
import { createTouchEvent } from '@/src/test/utils'
import MobileDock from './MobileDock'
import { MobileApp } from './MobileWorkspace'

describe('MobileDock Component', () => {
  const mockOnAppOpen = vi.fn()
  const mockOnHomePress = vi.fn()

  const sampleApps: MobileApp[] = [
    { id: 'vscode', name: 'VSCode', icon: '💻', color: 'bg-blue-500', type: 'vscode' },
    { id: 'claude', name: 'Claude', icon: '🤖', color: 'bg-purple-500', type: 'claude' },
    { id: 'terminal', name: 'Terminal', icon: '⚡', color: 'bg-green-500', type: 'terminal' },
    { id: 'files', name: 'Files', icon: '📁', color: 'bg-yellow-500', type: 'file-manager' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders dock with all provided apps', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} onHomePress={mockOnHomePress} />)
      
      // Check that all app icons are rendered
      expect(screen.getByText('💻')).toBeInTheDocument()
      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.getByText('⚡')).toBeInTheDocument()
      expect(screen.getByText('📁')).toBeInTheDocument()
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
      
      // Check dock background styling
      const dockBackground = container.querySelector('.bg-white\\/20')
      expect(dockBackground).toBeInTheDocument()
      expect(dockBackground).toHaveClass('bg-white/20', 'dark:bg-gray-800/40', 'backdrop-blur-xl', 'rounded-3xl')
      expect(dockBackground).toHaveClass('border', 'border-white/10', 'dark:border-gray-600/20')
    })
  })

  describe('App Icon Interactions', () => {
    it('calls onAppOpen when app icon is clicked', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const vscodeIcon = screen.getByText('💻').closest('button')!
      fireEvent.click(vscodeIcon)
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[0])
      expect(mockOnAppOpen).toHaveBeenCalledTimes(1)
    })

    it('calls onAppOpen when app icon is touched', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const claudeIcon = screen.getByText('🤖').closest('button')!
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
      
      fireEvent(claudeIcon, touchEvent)
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[1])
      expect(mockOnAppOpen).toHaveBeenCalledTimes(1)
    })

    it('handles multiple rapid taps correctly', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const terminalIcon = screen.getByText('⚡').closest('button')!
      
      // Rapidly tap the same icon multiple times
      for (let i = 0; i < 3; i++) {
        fireEvent.click(terminalIcon)
      }
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[2])
      expect(mockOnAppOpen).toHaveBeenCalledTimes(3)
    })
  })

  describe('Icon Styling and Layout', () => {
    it('applies correct icon button styling', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const vscodeButton = screen.getByText('💻').closest('button')!
      expect(vscodeButton).toHaveClass('w-14', 'h-14', 'bg-blue-500', 'rounded-xl')
      expect(vscodeButton).toHaveClass('flex', 'items-center', 'justify-center', 'text-2xl')
      expect(vscodeButton).toHaveClass('shadow-lg', 'active:scale-95', 'transition-transform', 'duration-100')
      expect(vscodeButton).toHaveClass('touch-manipulation')
    })

    it('displays correct app colors', () => {
      render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      expect(screen.getByText('💻').closest('button')).toHaveClass('bg-blue-500')
      expect(screen.getByText('🤖').closest('button')).toHaveClass('bg-purple-500')
      expect(screen.getByText('⚡').closest('button')).toHaveClass('bg-green-500')
      expect(screen.getByText('📁').closest('button')).toHaveClass('bg-yellow-500')
    })

    it('spaces icons correctly in dock', () => {
      const { container } = render(<MobileDock apps={sampleApps} onAppOpen={mockOnAppOpen} />)
      
      const iconContainer = container.querySelector('.flex.items-center.justify-center.space-x-4')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('space-x-4', 'px-6', 'py-4')
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
        expect(button).toHaveClass('transition-transform', 'duration-100')
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
        screen.getByText('📁').closest('button')!
      ]
      
      apps.forEach(app => fireEvent.click(app))
      
      expect(mockOnAppOpen).toHaveBeenCalledTimes(4)
    })
  })
})