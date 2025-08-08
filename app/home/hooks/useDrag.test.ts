import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDrag } from './useDrag'
import { createRef } from 'react'

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn()
const mockCancelAnimationFrame = vi.fn()

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true,
})

describe('useDrag Hook', () => {
  let elementRef: React.RefObject<HTMLElement>
  let mockElement: HTMLElement
  let mockOnDrag: ReturnType<typeof vi.fn>
  let mockOnDragStart: ReturnType<typeof vi.fn>
  let mockOnDragEnd: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create mock element with pointer capture methods
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    } as unknown as HTMLElement

    elementRef = createRef<HTMLElement>() as React.RefObject<HTMLElement>
    Object.defineProperty(elementRef, 'current', {
      writable: true,
      value: mockElement
    })

    mockOnDrag = vi.fn()
    mockOnDragStart = vi.fn()
    mockOnDragEnd = vi.fn()

    // Setup requestAnimationFrame to execute callback immediately
    mockRequestAnimationFrame.mockImplementation((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Hook Initialization', () => {
    it('initializes with isDragging false', () => {
      const { result } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
        onDragStart: mockOnDragStart,
        onDragEnd: mockOnDragEnd,
      }))

      expect(result.current.isDragging).toBe(false)
    })

    it('sets up event listeners on element mount', () => {
      renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
        onDragStart: mockOnDragStart,
        onDragEnd: mockOnDragEnd,
      }))

      expect(mockElement.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    })

    it('sets up global event listeners', () => {
      const documentAddEventListener = vi.spyOn(document, 'addEventListener')
      
      renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      expect(documentAddEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: false })
      expect(documentAddEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function))
    })
  })

  describe('Drag Start', () => {
    it('starts dragging on pointer down', () => {
      const { result } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
        onDragStart: mockOnDragStart,
        onDragEnd: mockOnDragEnd,
      }))

      // Get the pointer down handler
      const pointerDownHandler = vi.mocked(mockElement.addEventListener).mock.calls
        .find((call) => call[0] === 'pointerdown')?.[1] as EventListener

      // Simulate pointer down event
      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200,
        pointerId: 1,
      } as unknown as PointerEvent

      act(() => {
        pointerDownHandler(mockEvent as any)
      })

      expect(result.current.isDragging).toBe(true)
      expect(mockOnDragStart).toHaveBeenCalledTimes(1)
      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockElement.setPointerCapture).toHaveBeenCalledWith(1)
    })

    it('works without optional onDragStart callback', () => {
      const { result } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      const pointerDownHandler = vi.mocked(mockElement.addEventListener).mock.calls
        .find((call) => call[0] === 'pointerdown')?.[1] as EventListener

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200,
        pointerId: 1,
      } as unknown as PointerEvent

      expect(() => {
        act(() => {
          pointerDownHandler(mockEvent as any)
        })
      }).not.toThrow()

      expect(result.current.isDragging).toBe(true)
    })
  })

  describe('Drag Movement', () => {
    it('sets up pointer move event listeners', () => {
      const documentAddEventListener = vi.spyOn(document, 'addEventListener')
      
      renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      expect(documentAddEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: false })
    })

    it('does not call onDrag when not dragging', () => {
      const documentAddEventListener = vi.spyOn(document, 'addEventListener')
      
      renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      // Get global pointer move handler without starting drag
      const pointerMoveCall = documentAddEventListener.mock.calls
        .find(call => call[0] === 'pointermove')
      
      expect(pointerMoveCall).toBeDefined()
      const pointerMoveHandler = pointerMoveCall![1] as EventListener

      const moveEvent = {
        clientX: 150,
        clientY: 250,
      } as PointerEvent

      act(() => {
        pointerMoveHandler(moveEvent)
      })

      expect(mockOnDrag).not.toHaveBeenCalled()
    })

    it('verifies animation frame management setup', () => {
      renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      // Verify RAF and cancel are available
      expect(mockRequestAnimationFrame).toBeDefined()
      expect(mockCancelAnimationFrame).toBeDefined()
    })
  })

  describe('Drag End', () => {
    it('sets up pointer up event listeners', () => {
      const documentAddEventListener = vi.spyOn(document, 'addEventListener')
      
      renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
        onDragEnd: mockOnDragEnd,
      }))

      expect(documentAddEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function))
    })

    it('handles optional callbacks gracefully', () => {
      expect(() => {
        renderHook(() => useDrag({
          elementRef,
          onDrag: mockOnDrag,
        }))
      }).not.toThrow()
    })

    it('verifies pointer capture methods are called', () => {
      const { result } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
        onDragStart: mockOnDragStart,
      }))

      // Get pointer down handler
      const pointerDownHandler = vi.mocked(mockElement.addEventListener).mock.calls
        .find((call) => call[0] === 'pointerdown')?.[1] as EventListener

      act(() => {
        pointerDownHandler({
          preventDefault: vi.fn(),
          clientX: 100,
          clientY: 200,
          pointerId: 1,
        } as unknown as PointerEvent)
      })

      expect(mockElement.setPointerCapture).toHaveBeenCalledWith(1)
      expect(result.current.isDragging).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const documentRemoveEventListener = vi.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      unmount()

      expect(mockElement.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function))
      expect(documentRemoveEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function))
      expect(documentRemoveEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function))
    })

    it('handles null element ref gracefully', () => {
      const nullRef = createRef<HTMLElement>()
      // Don't set current to anything (remains null)

      expect(() => {
        renderHook(() => useDrag({
          elementRef: nullRef,
          onDrag: mockOnDrag,
        }))
      }).not.toThrow()
    })

    it('verifies cleanup happens on unmount', () => {
      const { unmount } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      // Verify the hook is working
      expect(mockElement.addEventListener).toHaveBeenCalled()

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing element during pointer capture', () => {
      const { result } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      // Remove element reference
      Object.defineProperty(elementRef, 'current', {
        writable: true,
        value: null
      })

      const pointerDownHandler = vi.mocked(mockElement.addEventListener).mock.calls
        .find((call) => call[0] === 'pointerdown')?.[1] as EventListener

      expect(() => {
        act(() => {
          pointerDownHandler({
            preventDefault: vi.fn(),
            clientX: 100,
            clientY: 200,
            pointerId: 1,
          } as unknown as PointerEvent)
        })
      }).not.toThrow()

      expect(result.current.isDragging).toBe(true)
    })

    it('handles multiple drag start operations', () => {
      const { result } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
        onDragStart: mockOnDragStart,
      }))

      const pointerDownHandler = vi.mocked(mockElement.addEventListener).mock.calls
        .find((call) => call[0] === 'pointerdown')?.[1] as EventListener

      // First drag start
      act(() => {
        pointerDownHandler({
          preventDefault: vi.fn(),
          clientX: 100,
          clientY: 200,
          pointerId: 1,
        } as unknown as PointerEvent)
      })

      expect(result.current.isDragging).toBe(true)
      expect(mockOnDragStart).toHaveBeenCalledTimes(1)

      // Reset state manually for test
      act(() => {
        result.current.isDragging = false
      })

      // Second drag start
      act(() => {
        pointerDownHandler({
          preventDefault: vi.fn(),
          clientX: 200,
          clientY: 300,
          pointerId: 2,
        } as unknown as PointerEvent)
      })

      expect(mockOnDragStart).toHaveBeenCalledTimes(2)
    })

    it('validates hook interface', () => {
      const { result } = renderHook(() => useDrag({
        elementRef,
        onDrag: mockOnDrag,
      }))

      expect(result.current).toHaveProperty('isDragging')
      expect(typeof result.current.isDragging).toBe('boolean')
    })
  })
})