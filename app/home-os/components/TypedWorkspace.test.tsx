import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor } from '@/src/test/utils'
import { useWindowStore } from '../stores/windowStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuth } from '@clerk/nextjs'
import { useAgentsOSUser } from '@/hooks/use-agentsos-user'
import { useWorkspaceStore } from '../stores/workspaceStore'
import Workspace from './Workspace'
import { createMockWindowStore } from '../stores/windowStore.mock'
import { onSnapshot, doc } from 'firebase/firestore'

// Type the mocked modules
const mockedUseWindowStore = vi.mocked(useWindowStore as unknown as Mock)
const mockedUseIsMobile = vi.mocked(useIsMobile as unknown as Mock)
const mockedUseAuth = vi.mocked(useAuth as unknown as Mock)
const mockedUseAgentsOSUser = vi.mocked(useAgentsOSUser as unknown as Mock)
const mockedUseWorkspaceStore = vi.mocked(useWorkspaceStore as unknown as Mock)
const mockedOnSnapshot = vi.mocked(onSnapshot as unknown as Mock)
const mockedDoc = vi.mocked(doc as unknown as Mock)

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
      const mockStore = createMockWindowStore()
      // If a selector is provided, call it with the mock store
      if (typeof selector === 'function') {
        return selector(mockStore)
      }
      return mockStore
    })
    
    // Mock workspace store
    mockedUseWorkspaceStore.mockReturnValue({
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
        windows: []
      }],
      activeWorkspaceId: 'test-workspace',
      sandboxId: 'test-sandbox',
      initializeWorkspaces: vi.fn(),
      setSandboxId: vi.fn(),
      switchToWorkspace: vi.fn(),
      addWorkspace: vi.fn(),
      removeWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
    })
    
    // Mock auth
    mockedUseAuth.mockReturnValue({
      userId: 'test-user',
      isSignedIn: true,
    })
    
    // Mock AgentsOS user with completed onboarding
    mockedUseAgentsOSUser.mockReturnValue({
      clerkUser: { id: 'test-user', fullName: 'Test User' },
      userProfile: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
      isLoading: false,
      hasCompletedOnboarding: true,
      workspaces: [],
      completeOnboarding: vi.fn(),
      addWorkspace: vi.fn(),
      updateWorkspaceStatus: vi.fn(),
      createOrUpdateWorkspace: vi.fn(),
    })
    
    mockedUseIsMobile.mockReturnValue(false)
    
    // Mock Firebase onSnapshot to return completed onboarding user
    mockedDoc.mockReturnValue({} as any)
    mockedOnSnapshot.mockImplementation((docRef, onNext, onError) => {
      // Simulate Firebase returning user data with completed onboarding
      setTimeout(() => {
        onNext({
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
      
      mockedUseWorkspaceStore.mockReturnValue({
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
          windows: [mockWindow]
        }],
        activeWorkspaceId: 'test-workspace',
        sandboxId: 'test-sandbox',
        initializeWorkspaces: vi.fn(),
        setSandboxId: vi.fn(),
        switchToWorkspace: vi.fn(),
        addWorkspace: vi.fn(),
        removeWorkspace: vi.fn(),
        updateWorkspace: vi.fn(),
      })
      
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
    it('applies correct gradient classes on desktop', async () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      const workspace = screen.getByTestId('desktop-workspace')
      expect(workspace).toHaveClass('bg-gradient-to-br')
      expect(workspace).toHaveClass('from-blue-200')
      expect(workspace).toHaveClass('via-purple-200')
      expect(workspace).toHaveClass('to-pink-200')
    })

    it('includes dark mode gradient classes on desktop', async () => {
      mockedUseIsMobile.mockReturnValue(false)
      render(<Workspace />)
      
      // Wait for Firebase to complete
      await waitFor(() => {
        expect(screen.getByTestId('desktop-workspace')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      const workspace = screen.getByTestId('desktop-workspace')
      expect(workspace).toHaveClass('dark:from-blue-900')
      expect(workspace).toHaveClass('dark:via-purple-900')
      expect(workspace).toHaveClass('dark:to-gray-900')
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