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
  ClerkProvider: ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'mock-clerk-provider' }, children),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: ({ }: { children: React.ReactNode }) => null,
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }, 'User'),
  useUser: () => ({ user: { id: 'test-user' } }),
  useAuth: () => ({ userId: 'test-user', isSignedIn: true }),
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
  doc: vi.fn(() => ({ id: 'test-user' })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn((docRef, callback) => {
    // Mock successful Firebase document with completed onboarding
    const mockSnapshot = {
      exists: () => true,
      data: () => ({
        agentsOS: {
          onboardingCompleted: true,
          workspace: {
            sandboxId: 'test-sandbox',
            repositories: [{
              name: 'test-repo',
              url: 'https://github.com/test/repo',
              urls: {
                vscode: 'http://localhost:8080',
                claude: 'http://localhost:8081',
                terminal: 'http://localhost:8082'
              }
            }]
          }
        }
      })
    };
    // Immediately call the callback with mock data
    setTimeout(() => callback(mockSnapshot), 0);
    // Return unsubscribe function
    return vi.fn();
  }),
  Timestamp: {
    fromDate: vi.fn(),
    now: vi.fn(() => ({ seconds: Date.now() / 1000 })),
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
    workspaces: [{
      id: 'test-workspace',
      name: 'Test Workspace',
      sandboxId: 'sandbox-123',
      repositories: [{
        name: 'test-repo',
        urls: {
          vscode: 'http://localhost:8080',
          claude: 'http://localhost:8081', 
          terminal: 'http://localhost:8082'
        }
      }],
      createdAt: new Date(),
      lastAccessedAt: new Date()
    }],
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

// Mock workspace store
vi.mock('@/app/home-os/stores/workspaceStore', () => ({
  useWorkspaceStore: () => ({
    workspaces: [{
      id: 'test-workspace',
      name: 'Test Workspace',
      repository: {
        name: 'test-repo',
        urls: {
          vscode: 'http://localhost:8080',
          claude: 'http://localhost:8081',
          terminal: 'http://localhost:8082'
        }
      }
    }],
    activeWorkspaceId: 'test-workspace',
    switchToWorkspace: vi.fn(),
    addWorkspace: vi.fn(),
    removeWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
  })
}))

// Mock window store with all required functions  
vi.mock('@/app/home-os/stores/windowStore', () => ({
  useWindowStore: () => ({
    windows: [{
      id: 'test-window',
      title: 'Test Window',
      appType: 'terminal',
      isMaximized: false,
      isMinimized: false,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
      zIndex: 1,
      isAnimating: false
    }],
    activeWindowId: 'test-window',
    addWindow: vi.fn(),
    removeWindow: vi.fn(),
    updateWindow: vi.fn(),
    bringToFront: vi.fn(),
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    restoreWindow: vi.fn(),
    setWindowPosition: vi.fn(),
    setWindowSize: vi.fn(),
    setWindowAnimating: vi.fn(),
    getNextZIndex: vi.fn(() => 2),
    isValidPosition: vi.fn(() => true),
    snapToGrid: vi.fn((pos: { x: number; y: number }) => pos),
  })
}))

// Mock getAllApps function
vi.mock('@/app/home-os/apps', () => ({
  getAllApps: () => [
    {
      metadata: {
        id: 'vscode',
        name: 'VSCode',
        icon: { icon: '💻', fallback: '💻' },
        colors: { primary: 'bg-blue-500' }
      }
    },
    {
      metadata: {
        id: 'claude',
        name: 'Claude Code', 
        icon: { icon: '🤖', fallback: '🤖' },
        colors: { primary: 'bg-purple-500' }
      }
    },
    {
      metadata: {
        id: 'terminal',
        name: 'Terminal',
        icon: { icon: '⚡', fallback: '⚡' },
        colors: { primary: 'bg-green-500' }
      }
    },
    {
      metadata: {
        id: 'settings',
        name: 'Settings',
        icon: { icon: '⚙️', fallback: '⚙️' },
        colors: { primary: 'bg-gray-500' }
      }
    }
  ],
  getApp: vi.fn(),
  AppStore: {}
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

// Mock mobile workspace with proper app rendering
vi.mock('@/app/home-os/components/mobile/MobileWorkspace', () => ({
  default: () => {
    const mockApps = ['VSCode', 'Claude Code', 'Terminal', 'Settings'];
    return React.createElement('div', { 'data-testid': 'mobile-workspace-content' },
      React.createElement('div', { className: 'app-grid' },
        mockApps.map((appName: string) => 
          React.createElement('button', {
            key: appName,
            'data-testid': `app-${appName.toLowerCase().replace(' ', '-')}`,
            role: 'button',
            'aria-label': `Open ${appName}`,
            className: 'app-icon'
          },
            React.createElement('div', { className: 'app-icon-container' },
              React.createElement('img', { 
                src: `/icons/${appName.toLowerCase()}.png`, 
                alt: 'App icon',
                'data-testid': 'app-icon-image'
              })
            ),
            React.createElement('span', null, appName)
          )
        )
      )
    );
  }
}))

// Mock MobileRepositoryPages
vi.mock('@/app/home-os/components/mobile/MobileRepositoryPages', () => ({
  MobileRepositoryPages: ({ onAppOpen }: { onAppOpen: (app: any, element: HTMLElement) => void }) => {
    const mockApps = ['VSCode', 'Claude Code', 'Terminal'];
    return React.createElement('div', { 'data-testid': 'mobile-repository-pages' },
      React.createElement('div', { className: 'apps-grid' },
        mockApps.map((appName: string) => 
          React.createElement('button', {
            key: appName,
            'data-testid': `repo-app-${appName.toLowerCase().replace(' ', '-')}`,
            onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
              onAppOpen({
                id: appName.toLowerCase().replace(' ', '-'),
                name: appName,
                type: appName.toLowerCase().replace(' ', '-')
              }, e.currentTarget);
            },
            className: 'repo-app-button'
          },
            React.createElement('div', { className: 'app-icon' },
              React.createElement('img', { 
                src: `/icons/${appName.toLowerCase()}.png`, 
                alt: 'App icon'
              })
            ),
            React.createElement('span', null, appName)
          )
        )
      )
    );
  }
}))

// Mock MobileDock
vi.mock('@/app/home-os/components/mobile/MobileDock', () => ({
  default: ({ apps, onAppOpen, onHomePress }: {
    apps: Array<{ id: string; name: string; type: string }>;
    onAppOpen: (app: any, element: HTMLElement) => void;
    onHomePress: () => void;
  }) => React.createElement('div', { 'data-testid': 'mobile-dock' },
    React.createElement('button', {
      'data-testid': 'home-button',
      onClick: onHomePress
    }, 'Home'),
    apps.map((app: { id: string; name: string; type: string }) => 
      React.createElement('button', {
        key: app.id,
        'data-testid': `dock-app-${app.id}`,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          onAppOpen(app, e.currentTarget);
        }
      }, app.name)
    )
  )
}))

// Mock MobileApp
vi.mock('@/app/home-os/components/mobile/MobileApp', () => ({
  default: ({ app, onClose }: {
    app: { id: string; name: string; type: string };
    onClose: () => void;
  }) => React.createElement('div', { 'data-testid': `mobile-app-${app.id}` },
    React.createElement('button', {
      'data-testid': 'close-app-button',
      onClick: onClose
    }, 'Close'),
    React.createElement('div', null, `${app.name} App Content`)
  )
}))

// Mock MobileStatusBar
vi.mock('@/app/home-os/components/mobile/MobileStatusBar', () => ({
  MobileStatusBar: () => React.createElement('div', { 'data-testid': 'mobile-status-bar' }, 'Status Bar')
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

// Mock HTMLCanvasElement for xterm compatibility
const mockCanvas = {
  getContext: vi.fn().mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
    }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
    }),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }),
  }),
  width: 0,
  height: 0,
  style: {},
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext,
})

// Mock TTYDTerminal component
vi.mock('@/components/ttyd-terminal', () => ({
  default: React.forwardRef<
    { sendCommand: (cmd: string, addEnter?: boolean) => void; sendKey: (key: string) => void; isConnected: () => boolean },
    { wsUrl: string; className?: string; onConnectionChange?: (connected: boolean) => void; onStatusChange?: (status: string) => void }
  >((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      sendCommand: vi.fn(),
      sendKey: vi.fn(),
      isConnected: () => true,
    }))
    return React.createElement('div', { 
      'data-testid': 'ttyd-terminal',
      className: props.className 
    }, 'Terminal')
  }),
}))

// Mock MobileTerminalPalette component
vi.mock('@/components/mobile-terminal-palette', () => ({
  default: ({ terminalRef, isConnected, className }: {
    terminalRef: React.RefObject<{ sendCommand: (cmd: string, addEnter?: boolean) => void; sendKey: (key: string) => void; isConnected: () => boolean } | null>;
    isConnected: boolean;
    className?: string;
  }) => React.createElement('div', { 
    'data-testid': 'mobile-terminal-palette',
    className,
    'data-connected': isConnected.toString()
  }, 'Terminal Palette')
}))

// Mock terminal command palette
vi.mock('@/components/terminal-command-palette', () => ({
  default: ({ terminalRef, isConnected, className }: {
    terminalRef: React.RefObject<{ sendCommand: (cmd: string, addEnter?: boolean) => void; sendKey: (key: string) => void; isConnected: () => boolean } | null>;
    isConnected: boolean;
    className?: string;
  }) => React.createElement('div', { 
    'data-testid': 'terminal-command-palette',
    className,
    'data-connected': isConnected.toString()
  }, 'Command Palette')
}))

// Mock AppIcon component to render emoji directly
vi.mock('@/app/home-os/components/ui/AppIcon', () => ({
  default: ({ icon, size, className }: {
    icon: { icon?: React.ReactNode; url?: string; emoji?: string; fallback: string };
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }) => {
    // Render the emoji or fallback directly for easier testing
    const displayText = icon.emoji || icon.fallback;
    return React.createElement('span', { 
      className: `app-icon ${className}`,
      'data-testid': 'app-icon'
    }, displayText);
  }
}))