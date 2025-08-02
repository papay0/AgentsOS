import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js hooks and router
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockForward = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}))

// Import React for proper mocking
import React from 'react'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: ({ children }: { children: React.ReactNode }) => null,
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }, 'User'),
  useUser: () => ({ user: { id: 'test-user' } }),
}))

// Mock the mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

// Mock desktop components
vi.mock('@/app/home-os/components/desktop/Window', () => ({
  default: ({ window }: { window: { title: string } }) => 
    React.createElement('div', { 'data-testid': `window-${window.title}` }, window.title)
}))

vi.mock('@/app/home-os/components/desktop/Dock', () => ({
  default: () => React.createElement('div', { 'data-testid': 'dock' }, 'Dock')
}))

vi.mock('@/app/home-os/components/desktop/MenuBar', () => ({
  default: () => React.createElement('div', { 'data-testid': 'menu-bar' }, 'MenuBar')
}))

vi.mock('@/app/home-os/components/desktop/SnapZoneOverlay', () => ({
  default: () => React.createElement('div', { 'data-testid': 'snap-zone-overlay' }, 'SnapZone')
}))

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock touch events for mobile testing
Object.defineProperty(window, 'TouchEvent', {
  value: class TouchEvent extends UIEvent {
    touches: Touch[] = []
    targetTouches: Touch[] = []
    changedTouches: Touch[] = []
    constructor(type: string, options?: TouchEventInit) {
      super(type, options)
      this.touches = options?.touches ? Array.from(options.touches) : []
      this.targetTouches = options?.targetTouches ? Array.from(options.targetTouches) : []
      this.changedTouches = options?.changedTouches ? Array.from(options.changedTouches) : []
    }
  },
})