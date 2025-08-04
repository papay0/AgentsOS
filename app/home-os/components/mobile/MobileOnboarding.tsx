'use client'

import { useState } from 'react'
import { ChevronRight, Code, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { workspaceApi } from '@/lib/api/workspace-api'
import { useAgentsOSUser } from '@/hooks/use-agentsos-user'
import Image from 'next/image'

export interface MobileOnboardingProps {
  onComplete: () => void
  onSkip?: () => void
}

type OnboardingStep = 'welcome' | 'github' | 'repository' | 'launch'

const repositories = [
  {
    id: 'agentspod',
    name: 'AgentsPod',
    description: 'AI-native development platform',
    url: 'https://github.com/papay0/AgentsPod.git',
    icon: <Code className="w-6 h-6" />,
    tech: 'Next.js, TypeScript',
  },
  {
    id: 'pettitude',
    name: 'Pettitude',
    description: 'Pet care application',
    url: 'https://github.com/papay0/Pettitude.git',
    icon: <FileText className="w-6 h-6" />,
    tech: 'React, TypeScript',
  },
]

export function MobileOnboarding({ onComplete, onSkip }: MobileOnboardingProps) {
  const { clerkUser, userProfile, isLoading: isUserLoading } = useAgentsOSUser()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)

  const goToNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'github', 'repository', 'launch']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const goToPrev = () => {
    const steps: OnboardingStep[] = ['welcome', 'github', 'repository', 'launch']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const skipGitHub = () => {
    setCurrentStep('repository')
  }

  const toggleRepository = (repositoryId: string) => {
    setSelectedRepositories(prev => 
      prev.includes(repositoryId)
        ? prev.filter(id => id !== repositoryId)
        : [...prev, repositoryId]
    )
  }

  const creationActivities = [
    "Initializing cloud workspace...",
    "Spinning up virtual machine...",
    "Installing Ubuntu system packages...",
    "Setting up Node.js 20 environment...",
    "Installing development tools...",
    "Configuring Git and SSH keys...",
    "Installing VSCode Server...",
    "Setting up code-server extensions...",
    "Installing terminal multiplexer...",
    "Configuring ttyd for web terminals...",
    "Installing Claude Code CLI...",
    "Setting up AI assistant integration...",
    "Cloning selected repositories...",
    "Installing project dependencies...",
    "Configuring workspace settings...",
    "Starting background services...",
    "Initializing file watchers...",
    "Setting up port forwarding...",
    "Configuring security policies...",
    "Optimizing performance settings...",
    "Running initial health checks...",
    "Preparing development environment...",
    "Synchronizing workspace state...",
    "Finalizing service connections...",
    "Almost ready..."
  ]

  const handleLaunch = async () => {
    setIsCreating(true)
    setCurrentActivityIndex(0)
    
    // Rotate through activity messages every 2 seconds
    const activityInterval = setInterval(() => {
      setCurrentActivityIndex(prev => (prev + 1) % creationActivities.length)
    }, 2000)
    
    try {
      // Get selected repositories
      const selectedRepos = repositories.filter(repo => selectedRepositories.includes(repo.id))
      
      // Create workspace with repositories
      await workspaceApi.createWorkspace({
        repositories: selectedRepos.map(repo => ({
          url: repo.url,
          name: repo.name,
          description: repo.description,
          tech: repo.tech
        })),
        workspaceName: selectedRepos.length > 1 
          ? `Multi-Project Workspace` 
          : selectedRepos[0]?.name || 'AgentsOS Workspace'
      })
      
      clearInterval(activityInterval)
      
      // Show completion message briefly
      setCurrentActivityIndex(creationActivities.length - 1)
      setTimeout(() => {
        onComplete()
      }, 1000)
    } catch (error) {
      console.error('Failed to create workspace:', error)
      clearInterval(activityInterval)
      setIsCreating(false)
      setCurrentActivityIndex(0)
      // TODO: Show error message to user
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* iOS-style Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur">
        <div className="flex-1" />
        <h1 className="text-sm font-semibold">Setup</h1>
        <div className="flex-1 flex justify-end">
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-sm text-primary font-medium"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-8">
        {currentStep === 'welcome' && (
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {clerkUser?.imageUrl ? (
                  <Image 
                    src={clerkUser.imageUrl} 
                    alt={clerkUser.fullName || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">
                  {clerkUser?.fullName || 'User'}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {clerkUser?.primaryEmailAddress?.emailAddress || 'No email'}
                </p>
                {userProfile ? (
                  <p className="text-xs text-green-600">
                    ✓ Synced
                  </p>
                ) : !isUserLoading && clerkUser && (
                  <p className="text-xs text-amber-600">
                    ⚠ Local mode
                  </p>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {isUserLoading ? 'Syncing...' : userProfile ? '✓ Synced' : 'Local only'}
              </div>
            </div>

            {/* Welcome Content */}
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Code className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Welcome to AgentsOS</h1>
                <p className="text-muted-foreground">
                  AI-native development on any device
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• VSCode, terminals, and Claude AI</p>
                <p>• No setup required</p>
                <p>• Start coding in 60 seconds</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'github' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Connect GitHub</h1>
              <p className="text-muted-foreground">
                Optional: Sign in to clone repos
              </p>
            </div>
            <Button size="lg" className="gap-2 w-full max-w-xs">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Connect GitHub
            </Button>
            <button 
              onClick={skipGitHub}
              className="text-sm text-muted-foreground"
            >
              Skip for now
            </button>
          </div>
        )}

        {currentStep === 'repository' && (
          <div className="flex-1 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Choose Repositories</h1>
              <p className="text-muted-foreground text-sm">
                Select projects to clone
              </p>
              <p className="text-xs text-muted-foreground">
                Selected: {selectedRepositories.length}
              </p>
            </div>
            <div className="space-y-3">
              {repositories.map((repository) => {
                const isSelected = selectedRepositories.includes(repository.id)
                return (
                  <button
                    key={repository.id}
                    onClick={() => toggleRepository(repository.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all w-full relative",
                      "flex items-center gap-3 text-left",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border"
                    )}
                  >
                    {/* Selection indicator */}
                    <div className={cn(
                      "absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      isSelected 
                        ? "border-primary bg-primary" 
                        : "border-muted-foreground"
                    )}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                    </div>

                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      isSelected 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted"
                    )}>
                      {repository.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-semibold text-sm">{repository.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {repository.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {repository.tech}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {currentStep === 'launch' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            {!isCreating ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Code className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Ready to Launch!</h1>
                  <p className="text-muted-foreground">
                    Create your workspace in 60 seconds
                  </p>
                </div>
                <Button size="lg" onClick={handleLaunch} className="w-full max-w-xs">
                  Launch Workspace
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                  <Code className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">Creating Workspace</h1>
                  <div className="min-h-[60px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm text-center transition-opacity duration-500">
                      {creationActivities[currentActivityIndex]}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    This may take up to 60 seconds...
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        {!isCreating && (
          <div className="space-y-4">
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2">
              {['welcome', 'github', 'repository', 'launch'].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    step === currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {currentStep !== 'welcome' && (
                <Button
                  variant="outline"
                  onClick={goToPrev}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              
              {currentStep !== 'launch' && (
                <Button
                  onClick={goToNext}
                  disabled={currentStep === 'repository' && selectedRepositories.length === 0}
                  className="flex-1 gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}