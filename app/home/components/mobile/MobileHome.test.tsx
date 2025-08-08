import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@/src/test/utils'
import { createTouchEvent } from '@/src/test/utils'
import MobileHome from './MobileHome'
import { MobileApp } from './MobileWorkspace'

describe('MobileHome Component', () => {
  const mockOnPageChange = vi.fn()
  const mockOnAppOpen = vi.fn()

  // Create a larger set of apps to test pagination
  const sampleApps: MobileApp[] = [
    // First 4 apps (dock apps, excluded from home)
    { id: 'vscode', name: 'VSCode', icon: { emoji: '💻', fallback: '💻' } as any, color: 'bg-blue-500', type: 'vscode' },
    { id: 'claude', name: 'Claude', icon: { emoji: '🤖', fallback: '🤖' } as any, color: 'bg-purple-500', type: 'claude' },
    { id: 'terminal', name: 'Terminal', icon: { emoji: '⚡', fallback: '⚡' } as any, color: 'bg-green-500', type: 'terminal' },
    { id: 'settings', name: 'Settings', icon: { emoji: '⚙️', fallback: '⚙️' } as any, color: 'bg-yellow-500', type: 'settings' },
    // Home screen apps (these will be shown)
    { id: 'safari', name: 'Safari', icon: { emoji: '🌐', fallback: '🌐' } as any, color: 'bg-blue-400', type: 'settings' },
    { id: 'messages', name: 'Messages', icon: { emoji: '💬', fallback: '💬' } as any, color: 'bg-green-400', type: 'settings' },
    { id: 'settings2', name: 'Settings', icon: { emoji: '⚙️', fallback: '⚙️' } as any, color: 'bg-gray-500', type: 'settings' },
    { id: 'preview', name: 'Preview', icon: { emoji: '🖼️', fallback: '🖼️' } as any, color: 'bg-indigo-500', type: 'settings' },
    // Additional apps for pagination testing
    { id: 'app9', name: 'App9', icon: { emoji: '📝', fallback: '📝' } as any, color: 'bg-red-500', type: 'settings' },
    { id: 'app10', name: 'App10', icon: { emoji: '📊', fallback: '📊' } as any, color: 'bg-pink-500', type: 'settings' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders home screen with apps excluding dock apps', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      // Should show home apps (not first 4 dock apps)
      expect(screen.getByText('Safari')).toBeInTheDocument()
      expect(screen.getByText('Messages')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Preview')).toBeInTheDocument()
      
      // Should NOT show dock apps in home screen
      expect(screen.queryByText('VSCode')).not.toBeInTheDocument()
      expect(screen.queryByText('Claude')).not.toBeInTheDocument()
    })

    it('applies correct layout and spacing', () => {
      const { container } = render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      // Check main container
      const mainContainer = container.querySelector('.flex-1.overflow-hidden')
      expect(mainContainer).toBeInTheDocument()
      expect(mainContainer).toHaveClass('pt-8', 'pb-24')
      
      // Check grid layout
      const grid = container.querySelector('.grid.grid-cols-4')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('gap-4', 'h-full', 'content-start', 'pt-2')
    })
  })

  describe('App Icon Interactions', () => {
    it('calls onAppOpen when app icon is clicked', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const safariButton = screen.getByText('Safari').closest('button')!
      fireEvent.click(safariButton)
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[4]) // Safari is index 4
      expect(mockOnAppOpen).toHaveBeenCalledTimes(1)
    })

    it('calls onAppOpen when app icon is touched', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const messagesButton = screen.getByText('Messages').closest('button')!
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
      
      fireEvent(messagesButton, touchEvent)
      
      expect(mockOnAppOpen).toHaveBeenCalledWith(sampleApps[5]) // Messages is index 5
      expect(mockOnAppOpen).toHaveBeenCalledTimes(1)
    })
  })

  describe('App Icon Styling', () => {
    it('applies correct app icon styling', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const safariButton = screen.getByText('Safari').closest('button')!
      expect(safariButton).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1', 'p-2')
      expect(safariButton).toHaveClass('rounded-xl', 'active:scale-95', 'transition-transform', 'duration-100')
      expect(safariButton).toHaveClass('touch-manipulation')
      
      // Check icon container
      const iconContainer = safariButton.querySelector('.w-14.h-14')
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('bg-blue-400', 'rounded-xl', 'flex', 'items-center', 'justify-center')
      expect(iconContainer).toHaveClass('shadow-lg', 'active:shadow-md', 'transition-shadow')
    })

    it('displays app names with correct styling', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const safariName = screen.getByText('Safari')
      expect(safariName).toHaveClass('text-white', 'dark:text-gray-200', 'text-xs', 'font-medium')
      expect(safariName).toHaveClass('drop-shadow-sm', 'max-w-[60px]', 'truncate')
    })

    it('displays correct app colors', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const safariIcon = screen.getByText('🌐').closest('.w-14')!
      const messagesIcon = screen.getByText('💬').closest('.w-14')!
      const settingsIcon = screen.getByText('⚙️').closest('.w-14')!
      const previewIcon = screen.getByText('🖼️').closest('.w-14')!
      
      expect(safariIcon).toHaveClass('bg-blue-400')
      expect(messagesIcon).toHaveClass('bg-green-400')
      expect(settingsIcon).toHaveClass('bg-gray-500')
      expect(previewIcon).toHaveClass('bg-indigo-500')
    })
  })

  describe('Pagination', () => {
    const manyApps: MobileApp[] = [
      ...sampleApps,
      // Add more apps to force pagination (total 20+ apps to exceed 16 per page)
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `extra-${i}`,
        name: `Extra${i}`,
        icon: { emoji: '📱', fallback: '📱' } as any,
        color: 'bg-gray-400',
        type: 'settings' as const
      }))
    ]

    it('shows page indicators when multiple pages exist', () => {
      const { container } = render(
        <MobileHome 
          apps={manyApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      // Should have page indicators
      const indicators = container.querySelectorAll('.w-2.h-2.rounded-full')
      expect(indicators.length).toBeGreaterThan(1)
    })

    it('highlights current page indicator', () => {
      const { container } = render(
        <MobileHome 
          apps={manyApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const indicators = container.querySelectorAll('.w-2.h-2.rounded-full')
      expect(indicators[0]).toHaveClass('bg-white', 'dark:bg-gray-200') // Active
      expect(indicators[1]).toHaveClass('bg-white/30', 'dark:bg-gray-400/30') // Inactive
    })

    it('does not show page indicators for single page', () => {
      const fewApps = sampleApps.slice(0, 8) // Only 4 home apps after excluding dock
      const { container } = render(
        <MobileHome 
          apps={fewApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const indicators = container.querySelectorAll('.w-2.h-2.rounded-full')
      expect(indicators).toHaveLength(0)
    })
  })

  describe('Touch Gestures', () => {
    const manyApps: MobileApp[] = [
      ...sampleApps,
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `extra-${i}`,
        name: `Extra${i}`,
        icon: { emoji: '📱', fallback: '📱' } as any,
        color: 'bg-gray-400',
        type: 'settings' as const
      }))
    ]

    it('handles swipe right to go to previous page', () => {
      const { container } = render(
        <MobileHome 
          apps={manyApps} 
          currentPage={1} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const swipeContainer = container.querySelector('.h-full.px-6')!
      
      // Simulate swipe right (positive X direction)
      fireEvent.touchStart(swipeContainer, {
        touches: [{ clientX: 100 }]
      })
      fireEvent.touchMove(swipeContainer, {
        touches: [{ clientX: 200 }]
      })
      fireEvent.touchEnd(swipeContainer)
      
      expect(mockOnPageChange).toHaveBeenCalledWith(0) // Previous page
    })

    it('handles swipe left to go to next page', () => {
      const { container } = render(
        <MobileHome 
          apps={manyApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const swipeContainer = container.querySelector('.h-full.px-6')!
      
      // Simulate swipe left (negative X direction)
      fireEvent.touchStart(swipeContainer, {
        touches: [{ clientX: 200 }]
      })
      fireEvent.touchMove(swipeContainer, {
        touches: [{ clientX: 100 }]
      })
      fireEvent.touchEnd(swipeContainer)
      
      expect(mockOnPageChange).toHaveBeenCalledWith(1) // Next page
    })

    it('does not change page for small swipes', () => {
      const { container } = render(
        <MobileHome 
          apps={manyApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const swipeContainer = container.querySelector('.h-full.px-6')!
      
      // Simulate small swipe (below threshold)
      fireEvent.touchStart(swipeContainer, {
        touches: [{ clientX: 100 }]
      })
      fireEvent.touchMove(swipeContainer, {
        touches: [{ clientX: 120 }] // Only 20px movement
      })
      fireEvent.touchEnd(swipeContainer)
      
      expect(mockOnPageChange).not.toHaveBeenCalled()
    })

    it('prevents swiping beyond page boundaries', () => {
      const { container } = render(
        <MobileHome 
          apps={manyApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const swipeContainer = container.querySelector('.h-full.px-6')!
      
      // Try to swipe right when already on first page
      fireEvent.touchStart(swipeContainer, {
        touches: [{ clientX: 100 }]
      })
      fireEvent.touchMove(swipeContainer, {
        touches: [{ clientX: 200 }]
      })
      fireEvent.touchEnd(swipeContainer)
      
      expect(mockOnPageChange).not.toHaveBeenCalled()
    })
  })

  describe('Layout and Positioning', () => {
    it('applies correct transform based on current page', () => {
      const { container } = render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={1} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const swipeContainer = container.querySelector('.h-full.px-6') as HTMLElement
      expect(swipeContainer).toHaveStyle('transform: translateX(-100%)')
    })

    it('has smooth transitions when not dragging', () => {
      const { container } = render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const swipeContainer = container.querySelector('.h-full.px-6') as HTMLElement
      expect(swipeContainer).toHaveStyle('transition: transform 0.3s ease-out')
    })
  })

  describe('Accessibility', () => {
    it('has accessible button elements for each app', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })

    it('has touch-manipulation class for better touch response', () => {
      render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('touch-manipulation')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty app list gracefully', () => {
      const emptyApps = sampleApps.slice(0, 4) // Only dock apps, no home apps
      expect(() => {
        render(
          <MobileHome 
            apps={emptyApps} 
            currentPage={0} 
            onPageChange={mockOnPageChange} 
            onAppOpen={mockOnAppOpen} 
          />
        )
      }).not.toThrow()
    })

    it('handles single app correctly', () => {
      const singleHomeApp = [...sampleApps.slice(0, 4), sampleApps[4]] // 4 dock + 1 home
      render(
        <MobileHome 
          apps={singleHomeApp} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      
      expect(screen.getByText('Safari')).toBeInTheDocument()
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(1)
    })
  })

  describe('Performance', () => {
    it('unmounts cleanly without memory leaks', () => {
      const { unmount } = render(
        <MobileHome 
          apps={sampleApps} 
          currentPage={0} 
          onPageChange={mockOnPageChange} 
          onAppOpen={mockOnAppOpen} 
        />
      )
      expect(() => unmount()).not.toThrow()
    })
  })
})