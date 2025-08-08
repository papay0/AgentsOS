import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/src/test/utils'
import { useWindowStore } from '../stores/windowStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuth } from '@clerk/nextjs'
import { useAgentsOSUser } from '@/hooks/use-agentsos-user'
import { useWorkspaceStore } from '../stores/workspaceStore'
import Workspace from './Workspace'
import { createMockWindowStore } from '../stores/windowStore.mock'
import { onSnapshot, doc, type DocumentReference } from 'firebase/firestore'
import type { FirebaseUserData } from '@/lib/firebase-auth'

// Type the mocked modules
const mockedUseWindowStore = vi.mocked(useWindowStore)
const mockedUseIsMobile = vi.mocked(useIsMobile)
const mockedUseAuth = vi.mocked(useAuth)
const mockedUseAgentsOSUser = vi.mocked(useAgentsOSUser)
const mockedUseWorkspaceStore = vi.mocked(useWorkspaceStore)
const mockedOnSnapshot = vi.mocked(onSnapshot)
const mockedDoc = vi.mocked(doc)

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}))

vi.mock('@/lib/firebase', () => ({
  db: {}
}))

// Mock OSBootScreen to complete immediately
vi.mock('./desktop/OSBootScreen', () => ({
  OSBootScreen: ({ onComplete }: { onComplete: () => void }) => {
    setTimeout(onComplete, 0)
    return null
  }
}))

// Mock the store and hooks
vi.mock('../stores/windowStore')
vi.mock('@/hooks/use-mobile')
vi.mock('@clerk/nextjs')
vi.mock('@/hooks/use-agentsos-user')
vi.mock('../stores/workspaceStore')

describe('Workspace - Strongly Typed Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock implementation for the store selector
    mockedUseWindowStore.mockImplementation((selector) => {
      const mockStore = {
        ...createMockWindowStore(),
        workspaceData: null,
        setWorkspaceData: vi.fn()
      }
      // If a selector is provided, call it with the mock store
      if (typeof selector === 'function') {
        return selector(mockStore)
      }
      return mockStore
    })
    
    // Mock workspace store with complete interface
    const mockWorkspaceStoreState = {
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
        },
        windows: [],
        nextZIndex: 100,
        activeWindowId: null,
        isInitialized: true
      }],
      activeWorkspaceId: 'test-workspace',
      sandboxId: 'test-sandbox',
      isLoading: false,
      // Core methods
      createWorkspace: vi.fn(),
      switchToWorkspace: vi.fn(),
      removeWorkspace: vi.fn(),
      getActiveWorkspace: vi.fn(() => ({
        id: 'test-workspace',
        name: 'Test Workspace',
        repository: {
          name: 'test-repo',
          urls: {
            vscode: 'http://localhost:8080',
            claude: 'http://localhost:8081',
            terminal: 'http://localhost:8082'
          }
        },
        windows: [],
        nextZIndex: 100,
        activeWindowId: null,
        isInitialized: true
      })),
      getWorkspace: vi.fn(),
      setSandboxId: vi.fn(),
      // Window management
      addWindow: vi.fn(),
      removeWindow: vi.fn(),
      updateWindow: vi.fn(),
      focusWindow: vi.fn(),
      minimizeWindow: vi.fn(),
      maximizeWindow: vi.fn(),
      restoreWindow: vi.fn(),
      moveWindow: vi.fn(),
      resizeWindow: vi.fn(),
      setWindowAnimating: vi.fn(),
      // Workspace initialization
      initializeWorkspaces: vi.fn(),
      initializeWorkspaceWindows: vi.fn(),
      updateWorkspaceUrls: vi.fn(),
      reset: vi.fn()
    }
    
    mockedUseWorkspaceStore.mockReturnValue(mockWorkspaceStoreState)
    
    // Mock getState to return the same mock store state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useWorkspaceStore as any).getState = () => mockWorkspaceStoreState
    
    // Mock auth with complete UseAuthReturn interface
    mockedUseAuth.mockReturnValue({
      userId: 'test-user',
      isSignedIn: true,
      isLoaded: true,
      sessionId: 'test-session',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionClaims: {} as any,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      has: vi.fn() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signOut: vi.fn() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getToken: vi.fn() as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    
    // Mock AgentsOS user with completed onboarding
    mockedUseAgentsOSUser.mockReturnValue({
      // Authentication state
      isAuthenticated: true,
      isReady: true,
      isLoading: false,
      error: null,
      
      // User data
      clerkUser: {
        id: 'test-user',
        fullName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        emailAddresses: [],
        phoneNumbers: [],
        externalAccounts: [],
        organizationMemberships: [],
        primaryEmailAddressId: null,
        primaryPhoneNumberId: null,
        primaryEmailAddress: null,
        primaryPhoneNumber: null,
        externalId: null,
        username: null,
        profileImageUrl: '',
        imageUrl: '',
        hasImage: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignInAt: null,
        twoFactorEnabled: false,
        totpEnabled: false,
        backupCodeEnabled: false,
        publicMetadata: {},
        privateMetadata: {},
        unsafeMetadata: {},
        passwordEnabled: true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      userProfile: {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        profileImageUrl: '',
        clerkUserId: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date()
      } as FirebaseUserData,
      workspace: null,
      
      // Computed state
      hasCompletedOnboarding: true,
      needsOnboarding: false,
      
      // Actions
      completeOnboarding: vi.fn(),
      createOrUpdateWorkspace: vi.fn(),
      updateWorkspaceStatus: vi.fn(),
      updateUserPreferences: vi.fn(),
      refreshUserData: vi.fn(),
      
      // Utils
      getFirebaseUid: vi.fn(() => 'test-firebase-uid'),
      firebaseUser: {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        profileImageUrl: '',
        clerkUserId: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date()
      } as FirebaseUserData
    })
    
    mockedUseIsMobile.mockReturnValue(false)
    
    // Mock Firebase onSnapshot to return completed onboarding user
    mockedDoc.mockReturnValue({} as DocumentReference)
    mockedOnSnapshot.mockImplementation((_docRef, onNext) => {
      // Simulate Firebase returning user data with completed onboarding
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callback = onNext as (snapshot: any) => void
        callback({
          exists: () => true,
          data: () => ({
            agentsOS: {
              onboardingCompleted: true,
              workspace: {
                sandboxId: 'test-sandbox',
                repositories: [{
                  url: 'https://github.com/test/repo',
                  name: 'test-repo',
                  description: 'Test Repository',
                  tech: 'React',
                  urls: {
                    vscode: 'http://localhost:8080',
                    terminal: 'http://localhost:8082',
                    claude: 'http://localhost:8081'
                  }
                }]
              }
            }
          })
        })
      }, 0)
      
      // Return unsubscribe function
      return vi.fn()
    })
  })

  describe('Platform Detection', () => {
    it('renders desktop workspace when not mobile', async () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      // Wait for Firebase callback to complete and UI to update
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.queryByTestId('mobile-workspace')).not.toBeInTheDocument()
    })

    it('renders mobile workspace when on mobile', async () => {
      mockedUseIsMobile.mockReturnValue(true)
      render(<Workspace />)
      
      // Wait for Firebase callback to complete and UI to update
      await waitFor(() => {
        expect(screen.getByTestId('mobile-workspace')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.queryByTestId('desktop-workspace')).not.toBeInTheDocument()
    })
  })

  describe('Basic Rendering', () => {
    it('renders without crashing on desktop', async () => {
      mockedUseIsMobile.mockReturnValue(false)
      expect(() => render(<Workspace />)).not.toThrow()
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('renders without crashing on mobile', async () => {
      mockedUseIsMobile.mockReturnValue(true)
      expect(() => render(<Workspace />)).not.toThrow()
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('mobile-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Store Integration', () => {
    it('calls the window store hook on desktop', async () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      expect(mockedUseWorkspaceStore).toHaveBeenCalled()
    })

    it('renders windows from store on desktop', async () => {
      const mockWindow = {
        id: 'test-window',
        title: 'Test Window',
        type: 'terminal' as const,
        isMinimized: false,
        isMaximized: false,
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        zIndex: 1,
        repositoryUrl: 'http://localhost:3000',
        workspaceId: 'test-workspace'
      }
      
      const mockWorkspaceStoreStateWithWindow = {
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
          },
          windows: [mockWindow],
          nextZIndex: 100,
          activeWindowId: null,
          isInitialized: true
        }],
        activeWorkspaceId: 'test-workspace',
        sandboxId: 'test-sandbox',
        isLoading: false,
        // Core methods
        createWorkspace: vi.fn(),
        switchToWorkspace: vi.fn(),
        removeWorkspace: vi.fn(),
        getActiveWorkspace: vi.fn(() => ({
          id: 'test-workspace',
          name: 'Test Workspace',
          repository: {
            name: 'test-repo',
            urls: {
              vscode: 'http://localhost:8080',
              claude: 'http://localhost:8081',
              terminal: 'http://localhost:8082'
            }
          },
          windows: [mockWindow],
          nextZIndex: 100,
          activeWindowId: null,
          isInitialized: true
        })),
        getWorkspace: vi.fn(),
        setSandboxId: vi.fn(),
        // Window management
        addWindow: vi.fn(),
        removeWindow: vi.fn(),
        updateWindow: vi.fn(),
        focusWindow: vi.fn(),
        minimizeWindow: vi.fn(),
        maximizeWindow: vi.fn(),
        restoreWindow: vi.fn(),
        moveWindow: vi.fn(),
        resizeWindow: vi.fn(),
        setWindowAnimating: vi.fn(),
        // Workspace initialization
        initializeWorkspaces: vi.fn(),
        initializeWorkspaceWindows: vi.fn(),
        updateWorkspaceUrls: vi.fn(),
        reset: vi.fn()
      }
      
      mockedUseWorkspaceStore.mockReturnValue(mockWorkspaceStoreStateWithWindow)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(useWorkspaceStore as any).getState = () => mockWorkspaceStoreStateWithWindow
      
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      expect(mockedUseWorkspaceStore).toHaveBeenCalled()
    })
  })

  describe('Theme Support', () => {
    it('applies correct wallpaper background class on desktop', async () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      const workspace = screen.getByTestId('desktop-workspace')
      expect(workspace).toHaveClass('wallpaper-background')
      expect(workspace).toHaveClass('relative')
      expect(workspace).toHaveClass('w-full')
      expect(workspace).toHaveClass('h-full')
    })

    it('includes select-none class on desktop', async () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      const workspace = screen.getByTestId('desktop-workspace')
      expect(workspace).toHaveClass('select-none')
    })
  })

  describe('Responsive Behavior', () => {
    it('switches platforms without errors', async () => {
      const { rerender } = render(<Workspace />)
      
      // Start with desktop
      mockedUseIsMobile.mockReturnValue(false)
      rerender(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Switch to mobile
      mockedUseIsMobile.mockReturnValue(true)
      rerender(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('mobile-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Switch back to desktop
      mockedUseIsMobile.mockReturnValue(false)
      rerender(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})