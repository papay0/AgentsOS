import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// React 19 compatibility fixes
// Set up the React 19 act environment
if (typeof globalThis !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
}

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

// React is already imported above

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: ({ }: { children: React.ReactNode }) => null,
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }, 'User'),
  useUser: () => ({ user: { id: 'test-user' } }),
}))

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithCustomToken: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  Timestamp: {
    fromDate: vi.fn(),
    now: vi.fn(),
  },
}))

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  logEvent: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(true)),
}))

// Mock Firebase auth hooks
vi.mock('@/lib/firebase-auth', () => ({
  FirebaseAuthService: vi.fn(),
  useFirebaseAuth: () => ({
    firebaseUser: null,
    isFirebaseSignedIn: false,
    isLoading: false,
    error: null,
  }),
}))

// Mock user service
vi.mock('@/lib/user-service', () => ({
  UserService: vi.fn(),
}))

// Mock AgentsOS user hook
vi.mock('@/hooks/use-agentsos-user', () => ({
  useAgentsOSUser: () => ({
    clerkUser: {
      id: 'test-user',
      fullName: 'Test User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      imageUrl: null,
    },
    userProfile: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    },
    isLoading: false,
    hasCompletedOnboarding: true,
    workspaces: [],
    completeOnboarding: vi.fn(),
    addWorkspace: vi.fn(),
    updateWorkspaceStatus: vi.fn(),
  }),
}))

// Mock workspace API
vi.mock('@/lib/api/workspace-api', () => ({
  workspaceApi: {
    createWorkspace: vi.fn(),
    listWorkspaces: vi.fn(),
    getWorkspaceStatus: vi.fn(),
    stopWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
  },
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

// Mock onboarding components
vi.mock('@/app/home-os/components/desktop/Onboarding', () => ({
  Onboarding: ({ onComplete }: { onComplete: () => void }) => 
    React.createElement('div', { 'data-testid': 'desktop-onboarding' }, 
      React.createElement('button', { onClick: onComplete }, 'Complete Onboarding')
    )
}))

vi.mock('@/app/home-os/components/mobile/MobileOnboarding', () => ({
  MobileOnboarding: ({ onComplete }: { onComplete: () => void }) => 
    React.createElement('div', { 'data-testid': 'mobile-onboarding' }, 
      React.createElement('button', { onClick: onComplete }, 'Complete Onboarding')
    )
}))

// Mock mobile workspace
vi.mock('@/app/home-os/components/mobile/MobileWorkspace', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mobile-workspace-content' }, 'Mobile Workspace')
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