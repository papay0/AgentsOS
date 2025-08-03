import { vi } from 'vitest'
import type { Window } from '@/app/home-os/stores/windowStore'
import type { MobileApp } from '@/app/home-os/components/mobile/MobileWorkspace'

// Type for the window store mock
export interface MockWindowStore {
  windows: Window[]
  addWindow: ReturnType<typeof vi.fn>
  updateWindow: ReturnType<typeof vi.fn>
  focusWindow: ReturnType<typeof vi.fn>
  minimizeWindow: ReturnType<typeof vi.fn>
  maximizeWindow: ReturnType<typeof vi.fn>
  restoreWindow: ReturnType<typeof vi.fn>
  closeWindow: ReturnType<typeof vi.fn>
}

// Type for creating test windows
export interface TestWindowOptions {
  id?: string
  type?: 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal'
  title?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  minimized?: boolean
  maximized?: boolean
  focused?: boolean
  zIndex?: number
}

// Type for creating test mobile apps
export interface TestMobileAppOptions {
  id?: string
  name?: string
  icon?: string
  color?: string
  type?: MobileApp['type']
}

// Type for touch event creation
export interface TouchPoint {
  identifier?: number
  target?: EventTarget
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  screenX?: number
  screenY?: number
  radiusX?: number
  radiusY?: number
  rotationAngle?: number
  force?: number
}