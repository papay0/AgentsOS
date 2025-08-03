import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapZones } from './useSnapZones'

// Mock the window store
const mockUpdateWindow = vi.fn()
const mockWindows = [
  {
    id: 'test-window',
    type: 'vscode',
    title: 'Test Window',
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 1,
    minimized: false,
    maximized: false,
    focused: true,
  }
]

vi.mock('../stores/windowStore', () => ({
  useWindowStore: Object.assign(() => ({
    updateWindow: mockUpdateWindow,
  }), {
    getState: () => ({
      windows: mockWindows,
    }),
  }),
}))

// Mock window dimensions and constants
Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
})

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true,
})

describe('useSnapZones Hook', () => {
  const mockOnSnapStart = vi.fn()
  const mockOnSnapEnd = vi.fn()
  const windowId = 'test-window'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Hook Initialization', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
        onSnapEnd: mockOnSnapEnd,
      }))

      expect(result.current.activeZone).toBe(null)
      expect(result.current.isSnapping).toBe(false)
      expect(typeof result.current.handleDragMove).toBe('function')
      expect(typeof result.current.handleDragEnd).toBe('function')
      expect(typeof result.current.getSnapZones).toBe('function')
    })

    it('works without optional callbacks', () => {
      expect(() => {
        renderHook(() => useSnapZones({ windowId }))
      }).not.toThrow()
    })
  })

  describe('Snap Zones Generation', () => {
    it('generates correct snap zones based on screen dimensions', () => {
      const { result } = renderHook(() => useSnapZones({ windowId }))

      const zones = result.current.getSnapZones()

      expect(zones).toHaveLength(3)
      expect(zones.map(z => z.id)).toEqual(['left', 'right', 'top'])
    })

    it('generates left snap zone with correct bounds', () => {
      const { result } = renderHook(() => useSnapZones({ windowId }))

      const zones = result.current.getSnapZones()
      const leftZone = zones.find(z => z.id === 'left')!

      expect(leftZone.bounds.x).toBe(0)
      expect(leftZone.bounds.y).toBe(32) // MENU_BAR_HEIGHT
      expect(leftZone.bounds.width).toBe(50) // SNAP_TRIGGER_WIDTH
      expect(leftZone.preview.width).toBe(512) // Half screen width
    })

    it('generates right snap zone with correct bounds', () => {
      const { result } = renderHook(() => useSnapZones({ windowId }))

      const zones = result.current.getSnapZones()
      const rightZone = zones.find(z => z.id === 'right')!

      expect(rightZone.bounds.x).toBe(974) // innerWidth - SNAP_TRIGGER_WIDTH
      expect(rightZone.bounds.y).toBe(32) // MENU_BAR_HEIGHT
      expect(rightZone.preview.x).toBe(512) // Half screen width
      expect(rightZone.preview.width).toBe(512) // Half screen width
    })

    it('generates top snap zone with correct bounds', () => {
      const { result } = renderHook(() => useSnapZones({ windowId }))

      const zones = result.current.getSnapZones()
      const topZone = zones.find(z => z.id === 'top')!

      expect(topZone.bounds.x).toBe(50) // SNAP_TRIGGER_WIDTH
      expect(topZone.bounds.y).toBe(32) // MENU_BAR_HEIGHT
      expect(topZone.bounds.width).toBe(924) // innerWidth - (SNAP_TRIGGER_WIDTH * 2)
      expect(topZone.preview.width).toBe(1024) // Full screen width
    })
  })

  describe('Snap Zone Detection', () => {
    it('detects left snap zone correctly', () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      act(() => {
        result.current.handleDragMove(25, 100) // Within left zone
      })

      // Fast forward the timeout
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.activeZone?.id).toBe('left')
      expect(mockOnSnapStart).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })

    it('detects right snap zone correctly', () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      act(() => {
        result.current.handleDragMove(980, 100) // Within right zone
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.activeZone?.id).toBe('right')
      expect(mockOnSnapStart).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })

    it('detects top snap zone correctly', () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      act(() => {
        result.current.handleDragMove(512, 35) // Within top zone
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.activeZone?.id).toBe('top')
      expect(mockOnSnapStart).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })

    it('returns null when outside snap zones', () => {
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapEnd: mockOnSnapEnd,
      }))

      act(() => {
        result.current.handleDragMove(512, 300) // Middle of screen
      })

      expect(result.current.activeZone).toBe(null)
    })

    it('dispatches custom events for snap zone changes', () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')
      
      const { result } = renderHook(() => useSnapZones({ windowId }))

      act(() => {
        result.current.handleDragMove(25, 100) // Enter left zone
      })

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'snapZoneChange',
          detail: expect.objectContaining({
            activeZone: expect.objectContaining({ id: 'left' }),
            isVisible: true,
          }),
        })
      )
    })
  })

  describe('Snap Zone Transitions', () => {
    it('handles zone transitions correctly', () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
        onSnapEnd: mockOnSnapEnd,
      }))

      // Enter left zone
      act(() => {
        result.current.handleDragMove(25, 100)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.activeZone?.id).toBe('left')
      expect(mockOnSnapStart).toHaveBeenCalledTimes(1)

      // Move to right zone
      act(() => {
        result.current.handleDragMove(980, 100)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.activeZone?.id).toBe('right')
      expect(mockOnSnapStart).toHaveBeenCalledTimes(2)
      vi.useRealTimers()
    })

    it('clears active zone when moving outside snap areas', () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
        onSnapEnd: mockOnSnapEnd,
      }))

      // Enter left zone
      act(() => {
        result.current.handleDragMove(25, 100)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.activeZone?.id).toBe('left')

      // Move outside zones
      act(() => {
        result.current.handleDragMove(512, 300)
      })

      expect(result.current.activeZone).toBe(null)
      expect(mockOnSnapEnd).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })

    it('prevents jitter with timeout delay', () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      // Enter zone
      act(() => {
        result.current.handleDragMove(25, 100)
      })

      // Don't advance timer - callback shouldn't be called yet
      expect(mockOnSnapStart).not.toHaveBeenCalled()

      // Advance timer
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(mockOnSnapStart).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })

    it('cancels timeout when leaving zone before delay', () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      // Enter zone
      act(() => {
        result.current.handleDragMove(25, 100)
      })

      // Leave zone before timeout
      act(() => {
        result.current.handleDragMove(512, 300)
      })

      // Advance timer past delay
      act(() => {
        vi.advanceTimersByTime(150)
      })

      // Callback should not have been called
      expect(mockOnSnapStart).not.toHaveBeenCalled()
    })
  })

  describe('Snap Performance', () => {
    it('performs snap correctly for left zone', () => {
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
        onSnapEnd: mockOnSnapEnd,
      }))

      act(() => {
        result.current.handleDragEnd(25, 100) // End drag in left zone
      })

      expect(result.current.isSnapping).toBe(true)
      expect(mockUpdateWindow).toHaveBeenCalledWith(windowId, {
        position: { x: 0, y: 0 }, // Converted workspace coordinates
        size: { width: 512, height: expect.any(Number) },
        maximized: false,
      })
      expect(mockOnSnapStart).toHaveBeenCalledTimes(1)
    })

    it('performs snap correctly for top zone (maximize)', () => {
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      act(() => {
        result.current.handleDragEnd(512, 35) // End drag in top zone
      })

      expect(mockUpdateWindow).toHaveBeenCalledWith(windowId, {
        position: { x: 0, y: 0 },
        size: { width: 1024, height: expect.any(Number) },
        maximized: true,
        previousState: {
          position: { x: 100, y: 100 },
          size: { width: 400, height: 300 }
        }
      })
    })

    it('does not snap when ending drag outside zones', () => {
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapEnd: mockOnSnapEnd,
      }))

      act(() => {
        result.current.handleDragEnd(512, 300) // End drag outside zones
      })

      expect(mockUpdateWindow).not.toHaveBeenCalled()
      expect(result.current.isSnapping).toBe(false)
      expect(mockOnSnapEnd).toHaveBeenCalledTimes(1)
    })

    it('prevents multiple simultaneous snaps', () => {
      const { result } = renderHook(() => useSnapZones({ windowId }))

      // Start first snap
      act(() => {
        result.current.handleDragEnd(25, 100)
      })

      expect(result.current.isSnapping).toBe(true)

      // Try to start second snap while first is in progress
      act(() => {
        result.current.handleDragEnd(980, 100)
      })

      // Should only have one updateWindow call
      expect(mockUpdateWindow).toHaveBeenCalledTimes(1)
    })

    it('resets state after snap animation completes', () => {
      vi.useFakeTimers()
      vi.clearAllMocks()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapEnd: mockOnSnapEnd,
      }))

      act(() => {
        result.current.handleDragEnd(25, 100)
      })

      expect(result.current.isSnapping).toBe(true)

      // Fast forward animation duration
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.isSnapping).toBe(false)
      expect(result.current.activeZone).toBe(null)
      expect(mockOnSnapEnd).toHaveBeenCalled()
      
      vi.useRealTimers()
    })
  })

  describe('Event Handling', () => {
    it('dispatches snap zone change events on drag end', () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')
      
      const { result } = renderHook(() => useSnapZones({ windowId }))

      act(() => {
        result.current.handleDragEnd(512, 300) // End outside zones
      })

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'snapZoneChange',
          detail: {
            activeZone: null,
            isVisible: false,
          },
        })
      )
    })

    it('does not trigger snap start when already snapping', () => {
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      // Start snapping
      act(() => {
        result.current.handleDragEnd(25, 100)
      })

      expect(result.current.isSnapping).toBe(true)

      // Try to move to another zone while snapping
      act(() => {
        result.current.handleDragMove(980, 100)
      })

      // Should not trigger additional snap start
      expect(mockOnSnapStart).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cleanup', () => {
    it('clears timeouts on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      
      const { result, unmount } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      // Create a timeout
      act(() => {
        result.current.handleDragMove(25, 100)
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('clears timeouts when leaving zones', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
      }))

      // Enter zone (creates timeout)
      act(() => {
        result.current.handleDragMove(25, 100)
      })

      // Leave zone (should clear timeout)
      act(() => {
        result.current.handleDragMove(512, 300)
      })

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('clears timeouts on drag end', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      
      const { result } = renderHook(() => useSnapZones({ windowId }))

      // Create timeout
      act(() => {
        result.current.handleDragMove(25, 100)
      })

      // End drag
      act(() => {
        result.current.handleDragEnd(25, 100)
      })

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles window resize affecting snap zones', () => {
      const { result } = renderHook(() => useSnapZones({ windowId }))

      // Get initial zones
      const initialZones = result.current.getSnapZones()
      expect(initialZones[0].preview.width).toBe(512) // Half of 1024

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', { value: 1280 })

      // Get new zones
      const newZones = result.current.getSnapZones()
      expect(newZones[0].preview.width).toBe(640) // Half of 1280
    })

    it('handles callbacks being undefined', () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useSnapZones({ windowId }))

      expect(() => {
        act(() => {
          result.current.handleDragMove(25, 100)
        })

        act(() => {
          vi.advanceTimersByTime(100)
        })

        act(() => {
          result.current.handleDragEnd(25, 100)
        })
      }).not.toThrow()
    })

    it('handles rapid zone changes', () => {
      vi.clearAllMocks()
      
      const { result } = renderHook(() => useSnapZones({
        windowId,
        onSnapStart: mockOnSnapStart,
        onSnapEnd: mockOnSnapEnd,
      }))

      // Test rapid zone changes by ending in a clear area
      act(() => {
        result.current.handleDragMove(25, 100) // Left zone
      })
      
      act(() => {
        result.current.handleDragMove(512, 300) // Middle of screen (outside zones)
      })

      expect(result.current.activeZone).toBe(null)
      expect(mockOnSnapEnd).toHaveBeenCalled()
    })
  })
})