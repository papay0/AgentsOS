import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock ClerkProvider for testing
const MockClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-clerk-provider">{children}</div>
}

// Create a custom render function that includes necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockClerkProvider>
      {children}
    </MockClerkProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

import type { Window } from '@/app/home-os/stores/windowStore'
import type { MobileApp } from '@/app/home-os/components/mobile/MobileWorkspace'
import type { TestWindowOptions, TestMobileAppOptions, TouchPoint } from './types'

// Test utilities for window management
export const createMockWindow = (overrides: TestWindowOptions = {}): Window => ({
  id: overrides.id ?? 'test-window-1',
  type: overrides.type ?? 'vscode',
  title: overrides.title ?? 'Test Window',
  position: overrides.position ?? { x: 100, y: 100 },
  size: overrides.size ?? { width: 800, height: 600 },
  minimized: overrides.minimized ?? false,
  maximized: overrides.maximized ?? false,
  focused: overrides.focused ?? true,
  zIndex: overrides.zIndex ?? 10,
})

// Test utilities for mobile apps
export const createMockMobileApp = (overrides: TestMobileAppOptions = {}): MobileApp => ({
  id: overrides.id ?? 'test-app-1',
  name: overrides.name ?? 'Test App',
  icon: overrides.icon ?? '🧪',
  color: overrides.color ?? 'bg-blue-500',
  type: overrides.type ?? 'vscode',
})

// Touch event utilities for mobile testing
export const createTouchEvent = (type: string, touches: TouchPoint[] = []): TouchEvent => {
  const mockTouches = touches.map((touch, index) => ({
    identifier: touch.identifier ?? index,
    target: touch.target ?? document.body,
    clientX: touch.clientX ?? 0,
    clientY: touch.clientY ?? 0,
    pageX: touch.pageX ?? 0,
    pageY: touch.pageY ?? 0,
    screenX: touch.screenX ?? 0,
    screenY: touch.screenY ?? 0,
    radiusX: touch.radiusX ?? 0,
    radiusY: touch.radiusY ?? 0,
    rotationAngle: touch.rotationAngle ?? 0,
    force: touch.force ?? 1,
  })) as Touch[]

  return new TouchEvent(type, {
    touches: mockTouches,
    targetTouches: mockTouches,
    changedTouches: mockTouches,
    bubbles: true,
    cancelable: true,
  })
}

// Coordinate utilities for window positioning
export const VIEWPORT_BOUNDS = {
  width: 1920,
  height: 1080,
}

export const MENU_BAR_HEIGHT = 32
export const DOCK_HEIGHT = 80

export const isValidWindowPosition = (position: { x: number; y: number }, size: { width: number; height: number }) => {
  return (
    position.x >= 0 &&
    position.y >= MENU_BAR_HEIGHT &&
    position.x + size.width <= VIEWPORT_BOUNDS.width &&
    position.y + size.height <= VIEWPORT_BOUNDS.height - DOCK_HEIGHT
  )
}

export const isValidWindowSize = (size: { width: number; height: number }) => {
  const MIN_WIDTH = 300
  const MIN_HEIGHT = 200
  return size.width >= MIN_WIDTH && size.height >= MIN_HEIGHT
}