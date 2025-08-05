import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Clear the mock before importing to ensure we get the real implementation
beforeAll(() => {
  vi.unmock('@/app/home-os/stores/windowStore')
})

import { useWindowStore, Window } from './windowStore'

// Mock Date.now for consistent IDs
const mockDateNow = vi.fn()
Object.defineProperty(Date, 'now', {
  value: mockDateNow,
  writable: true,
})

// Helper to reset store to clean state  
const resetStore = () => {
  act(() => {
    useWindowStore.setState({
      windows: [],
      nextZIndex: 10, // WINDOW_Z_INDEX_BASE
      activeWindowId: null,
      onboardingCompleted: false,
      isCheckingWorkspaces: false,
      workspaceData: null,
    });
  });
}

describe('WindowStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDateNow.mockReturnValue(1234567890)
    
    // Reset store to clean state before each test
    resetStore()
  })

  afterEach(() => {
    // Also reset after each test to ensure clean state
    resetStore()
  })

  describe('Initial State', () => {
    it('initializes with empty state', () => {
      const { result } = renderHook(() => useWindowStore())
      
      console.log('Store state:', result.current)
      console.log('Windows:', result.current.windows)
      
      // The test expects empty state, but let's see what we actually get
      expect(result.current.windows).toEqual([])
      expect(result.current.nextZIndex).toBe(10) // WINDOW_Z_INDEX_BASE
      expect(result.current.activeWindowId).toBe(null)
    })
  })

  describe('Adding Windows', () => {
    it('adds a new window with generated ID and z-index', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test VSCode',
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      expect(result.current.windows).toHaveLength(1)
      expect(result.current.windows[0]).toMatchObject({
        ...windowData,
        id: 'window-1234567890',
        zIndex: 10,
      })
      expect(result.current.nextZIndex).toBe(11)
      expect(result.current.activeWindowId).toBe('window-1234567890')
    })

    it('increments z-index for subsequent windows', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: false,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      mockDateNow.mockReturnValue(1234567891)

      act(() => {
        result.current.addWindow({
          ...windowData,
          title: 'Second Window',
        })
      })

      expect(result.current.windows).toHaveLength(2)
      expect(result.current.windows[0].zIndex).toBe(10)
      expect(result.current.windows[1].zIndex).toBe(11)
      expect(result.current.nextZIndex).toBe(12)
    })

    it('respects maximum z-index limit', () => {
      const { result } = renderHook(() => useWindowStore())
      
      // Set nextZIndex to near maximum
      act(() => {
        useWindowStore.setState({ nextZIndex: 89 })
      })

      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: false,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      expect(result.current.windows[0].zIndex).toBe(89)
      expect(result.current.nextZIndex).toBe(90) // Should not exceed max
    })
  })

  describe('Removing Windows', () => {
    it('removes a window by ID', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id

      act(() => {
        result.current.removeWindow(windowId)
      })

      expect(result.current.windows).toHaveLength(0)
      expect(result.current.activeWindowId).toBe(null)
    })

    it('clears activeWindowId when removing active window', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.activeWindowId!

      act(() => {
        result.current.removeWindow(windowId)
      })

      expect(result.current.activeWindowId).toBe(null)
    })

    it('preserves activeWindowId when removing non-active window', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: false,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const firstWindowId = result.current.windows[0].id

      mockDateNow.mockReturnValue(1234567891)

      act(() => {
        result.current.addWindow({
          ...windowData,
          title: 'Second Window',
        })
      })

      const activeWindowId = result.current.activeWindowId

      act(() => {
        result.current.removeWindow(firstWindowId)
      })

      expect(result.current.activeWindowId).toBe(activeWindowId)
    })
  })

  describe('Updating Windows', () => {
    it('basic updateWindow functionality test', () => {
      // Start completely fresh - reset first
      resetStore();
      
      act(() => {
        useWindowStore.setState({
          windows: [{
            id: 'test-123',
            type: 'vscode' as const,
            title: 'Original Title',
            position: { x: 0, y: 0 },
            size: { width: 400, height: 300 },
            zIndex: 10,
            minimized: false,
            maximized: false,
            focused: true,
          }],
          nextZIndex: 11,
          activeWindowId: 'test-123',
        })
      })
      
      // Call updateWindow directly on the store
      useWindowStore.getState().updateWindow('test-123', {
        title: 'New Title',
      })
      
      // Check the result
      const result = useWindowStore.getState()
      expect(result.windows[0].title).toBe('New Title')
    })

    it('updates window properties', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id
      const initialTitle = result.current.windows[0].title
      
      // Debug: Check initial state
      expect(initialTitle).toBe('Test Window')
      expect(windowId).toBeDefined()
      
      act(() => {
        result.current.updateWindow(windowId, {
          title: 'Updated Title',
          position: { x: 100, y: 100 },
        })
      })

      // Debug: Check if the window exists and what its properties are
      const store = useWindowStore.getState()
      expect(store.windows).toHaveLength(1)
      expect(store.windows[0].id).toBe(windowId)
      
      // Now check the actual updates
      expect(store.windows[0].title).toBe('Updated Title')
      expect(store.windows[0].position).toEqual({ x: 100, y: 100 })
      expect(store.windows[0].size).toEqual({ width: 400, height: 300 }) // Unchanged
    })

    it('does not affect other windows', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: false,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      mockDateNow.mockReturnValue(1234567891)

      act(() => {
        result.current.addWindow({
          ...windowData,
          title: 'Second Window',
        })
      })

      const firstWindowId = result.current.windows[0].id

      act(() => {
        useWindowStore.getState().updateWindow(firstWindowId, {
          title: 'Updated First Window',
        })
      })

      // Use getState() to check the updates
      const store = useWindowStore.getState()
      expect(store.windows[0].title).toBe('Updated First Window')
      expect(store.windows[1].title).toBe('Second Window')
    })
  })

  describe('Window Focus', () => {
    it('focuses a window and updates z-index', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: false,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      mockDateNow.mockReturnValue(1234567891)

      act(() => {
        result.current.addWindow({
          ...windowData,
          title: 'Second Window',
        })
      })

      const firstWindowId = result.current.windows[0].id

      act(() => {
        result.current.focusWindow(firstWindowId)
      })

      const focusedWindow = result.current.windows.find(w => w.id === firstWindowId)!
      expect(focusedWindow.focused).toBe(true)
      expect(focusedWindow.zIndex).toBe(12) // Should be higher than second window
      expect(result.current.activeWindowId).toBe(firstWindowId)
      expect(result.current.nextZIndex).toBe(13)
    })

    it('unfocuses other windows when focusing one', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: false,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      mockDateNow.mockReturnValue(1234567891)

      act(() => {
        result.current.addWindow({
          ...windowData,
          title: 'Second Window',
        })
      })

      const firstWindowId = result.current.windows[0].id
      const secondWindowId = result.current.windows[1].id

      act(() => {
        result.current.focusWindow(firstWindowId)
      })

      const firstWindow = result.current.windows.find(w => w.id === firstWindowId)!
      const secondWindow = result.current.windows.find(w => w.id === secondWindowId)!

      expect(firstWindow.focused).toBe(true)
      expect(secondWindow.focused).toBe(false)
    })
  })

  describe('Window Minimize', () => {
    it('minimizes a window and unfocuses it', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id

      act(() => {
        result.current.minimizeWindow(windowId)
      })

      const minimizedWindow = result.current.windows[0]
      expect(minimizedWindow.minimized).toBe(true)
      expect(minimizedWindow.focused).toBe(false)
      expect(result.current.activeWindowId).toBe(null)
    })

    it('clears activeWindowId when minimizing active window', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.activeWindowId!

      act(() => {
        result.current.minimizeWindow(windowId)
      })

      expect(result.current.activeWindowId).toBe(null)
    })
  })

  describe('Window Maximize', () => {
    it('maximizes a window', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id

      act(() => {
        result.current.maximizeWindow(windowId)
      })

      const maximizedWindow = result.current.windows[0]
      expect(maximizedWindow.maximized).toBe(true)
    })
  })

  describe('Window Restore', () => {
    it('restores a minimized window', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: true,
        maximized: false,
        focused: false,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id

      act(() => {
        result.current.restoreWindow(windowId)
      })

      const restoredWindow = result.current.windows[0]
      expect(restoredWindow.minimized).toBe(false)
      expect(restoredWindow.maximized).toBe(false)
    })

    it('restores a maximized window', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: true,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id

      act(() => {
        result.current.restoreWindow(windowId)
      })

      const restoredWindow = result.current.windows[0]
      expect(restoredWindow.minimized).toBe(false)
      expect(restoredWindow.maximized).toBe(false)
    })
  })

  describe('Window Movement', () => {
    it('moves a window to new position', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id

      act(() => {
        result.current.moveWindow(windowId, 150, 200)
      })

      const movedWindow = result.current.windows[0]
      expect(movedWindow.position).toEqual({ x: 150, y: 200 })
    })
  })

  describe('Window Resize', () => {
    it('resizes a window', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      const windowId = result.current.windows[0].id

      act(() => {
        result.current.resizeWindow(windowId, 600, 450)
      })

      const resizedWindow = result.current.windows[0]
      expect(resizedWindow.size).toEqual({ width: 600, height: 450 })
    })
  })

  describe('Initialize Windows', () => {
    it('initializes with default windows', () => {
      const { result } = renderHook(() => useWindowStore())
      
      act(() => {
        result.current.initializeWindows()
      })

      expect(result.current.windows).toHaveLength(3)
      expect(result.current.windows[0].id).toBe('vscode-1')
      expect(result.current.windows[1].id).toBe('claude-1')
      expect(result.current.windows[2].id).toBe('terminal-1')
      expect(result.current.activeWindowId).toBe('vscode-1')
      expect(result.current.nextZIndex).toBe(13)
    })

    it('replaces existing windows when initializing', () => {
      const { result } = renderHook(() => useWindowStore())
      
      // Add a custom window first
      act(() => {
        result.current.addWindow({
          type: 'vscode',
          title: 'Custom Window',
          position: { x: 0, y: 0 },
          size: { width: 400, height: 300 },
          minimized: false,
          maximized: false,
          focused: true,
        })
      })

      expect(result.current.windows).toHaveLength(1)

      // Initialize should replace the custom window
      act(() => {
        result.current.initializeWindows()
      })

      expect(result.current.windows).toHaveLength(3)
      expect(result.current.windows.find(w => w.title === 'Custom Window')).toBeUndefined()
    })
  })

  describe('Window Types and Properties', () => {
    it('handles different window types', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowTypes: Array<Window['type']> = ['vscode', 'claude', 'file-manager', 'terminal', 'preview']

      windowTypes.forEach((type, index) => {
        mockDateNow.mockReturnValue(1234567890 + index)
        
        act(() => {
          result.current.addWindow({
            type,
            title: `${type} Window`,
            position: { x: index * 50, y: index * 50 },
            size: { width: 400, height: 300 },
            minimized: false,
            maximized: false,
            focused: false,
          })
        })
      })

      expect(result.current.windows).toHaveLength(5)
      windowTypes.forEach(type => {
        expect(result.current.windows.find(w => w.type === type)).toBeDefined()
      })
    })

    it('handles window content property', () => {
      const { result } = renderHook(() => useWindowStore())
      
      const windowData = {
        type: 'vscode' as const,
        title: 'Test Window',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        minimized: false,
        maximized: false,
        focused: true,
        content: 'console.log("Hello World");',
      }

      act(() => {
        result.current.addWindow(windowData)
      })

      expect(result.current.windows[0].content).toBe('console.log("Hello World");')
    })
  })

  describe('Edge Cases', () => {
    it('handles operations on non-existent windows gracefully', () => {
      const { result } = renderHook(() => useWindowStore())
      
      expect(() => {
        act(() => {
          result.current.updateWindow('non-existent-id', { title: 'Updated' })
          result.current.focusWindow('non-existent-id')
          result.current.minimizeWindow('non-existent-id')
          result.current.maximizeWindow('non-existent-id')
          result.current.restoreWindow('non-existent-id')
          result.current.moveWindow('non-existent-id', 100, 100)
          result.current.resizeWindow('non-existent-id', 400, 300)
          result.current.removeWindow('non-existent-id')
        })
      }).not.toThrow()

      expect(result.current.windows).toHaveLength(0)
    })

    it('handles focus with empty window list', () => {
      const { result } = renderHook(() => useWindowStore())
      
      expect(() => {
        act(() => {
          result.current.focusWindow('any-id')
        })
      }).not.toThrow()

      expect(result.current.activeWindowId).toBe('any-id')
    })

    it('handles z-index overflow correctly', () => {
      const { result } = renderHook(() => useWindowStore())
      
      // Add window and manually set high z-index
      act(() => {
        result.current.addWindow({
          type: 'vscode',
          title: 'Test Window',
          position: { x: 0, y: 0 },
          size: { width: 400, height: 300 },
          minimized: false,
          maximized: false,
          focused: true,
        })
      })

      const windowId = result.current.windows[0].id

      // Manually set z-index to near maximum  
      act(() => {
        useWindowStore.setState((state) => ({
          windows: state.windows.map(w => 
            w.id === windowId ? { ...w, zIndex: 89 } : w
          ),
          nextZIndex: 90
        }))
      })

      // Focus should handle max z-index properly
      act(() => {
        result.current.focusWindow(windowId)
      })

      // Use getState() to check the final z-index
      const store = useWindowStore.getState()
      expect(store.windows[0].zIndex).toBe(90) // Should not exceed max
    })
  })
})