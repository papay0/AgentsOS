'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft, Code, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { workspaceApi } from '@/lib/api/workspace-api'
import { useAgentsOSUser } from '@/hooks/use-agentsos-user'
import type { CreateWorkspaceResponse } from '@/types/workspace'
import Image from 'next/image'

export interface OnboardingProps {
  onComplete: (workspaceData?: CreateWorkspaceResponse) => void
  onSkip?: () => void
}

type OnboardingStep = 'welcome' | 'github' | 'repository' | 'launch'

const repositories = [
  {
    id: 'agentspod',
    name: 'AgentsPod',
    description: 'AI-native development environment platform',
    url: 'https://github.com/papay0/AgentsPod.git',
    icon: <Code className="w-8 h-8" />,
    tech: 'Next.js, TypeScript, React',
  },
  {
    id: 'pettitude',
    name: 'Pettitude',
    description: 'Pet care application',
    url: 'https://github.com/papay0/Pettitude.git',
    icon: <FileText className="w-8 h-8" />,
    tech: 'React, TypeScript',
  },
]

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { clerkUser, userProfile, isLoading: isUserLoading } = useAgentsOSUser()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)

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

  const handleLaunch = async () => {
    setIsCreating(true)
    
    try {
      // Get selected repositories
      const selectedRepos = repositories.filter(repo => selectedRepositories.includes(repo.id))
      
      // Create workspace with repositories
      setCreationProgress(25)
      const workspaceResponse = await workspaceApi.createWorkspace({
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
      
      setCreationProgress(100)
      
      // Onboarding's job: Create workspace AND save to Firebase
      onComplete(workspaceResponse)
    } catch (error) {
      console.error('Failed to create workspace:', error)
      setIsCreating(false)
      setCreationProgress(0)
      // TODO: Show error message to user
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[600px] bg-background rounded-xl shadow-2xl border">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <button 
              onClick={onSkip}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              aria-label="Close"
            />
            <button className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
          </div>
          <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
            AgentsOS Setup Assistant
          </div>
        </div>

        <div className="p-8 max-h-[600px] min-h-[500px] flex flex-col">
          {currentStep === 'welcome' && (
            <div className="flex-1 flex flex-col justify-center space-y-8">
              {/* User Profile Section */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {clerkUser?.imageUrl ? (
                    <Image 
                      src={clerkUser.imageUrl} 
                      alt={clerkUser.fullName || 'User'} 
                      className="w-full h-full rounded-full object-cover"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
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
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Profile synced with Firebase
                    </p>
                  ) : !isUserLoading && clerkUser && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Firebase not configured - using local mode
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
                  <h1 className="text-3xl font-bold">Welcome to AgentsOS</h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    The AI-native development environment that brings the power of cloud computing to a familiar desktop experience.
                  </p>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground max-w-md mx-auto">
                  <p>• Pre-installed VSCode, terminals, and Claude AI</p>
                  <p>• Works on any device with a browser</p>
                  <p>• Start coding in under 60 seconds</p>
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
                <h1 className="text-3xl font-bold">Connect GitHub (Optional)</h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Sign in with GitHub to easily clone repositories and manage your code.
                </p>
              </div>
              <Button size="lg" className="gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Connect GitHub Account
              </Button>
              <button 
                onClick={skipGitHub}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {currentStep === 'repository' && (
            <div className="flex-1 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Choose Repositories</h1>
                <p className="text-lg text-muted-foreground">
                  Select one or more projects to clone into your workspace.
                </p>
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedRepositories.length} repository{selectedRepositories.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {repositories.map((repository) => {
                  const isSelected = selectedRepositories.includes(repository.id)
                  return (
                    <button
                      key={repository.id}
                      onClick={() => toggleRepository(repository.id)}
                      className={cn(
                        "p-6 rounded-lg border-2 transition-all hover:border-primary/50",
                        "flex items-center gap-4 text-left relative",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        isSelected 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground"
                      )}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                      </div>

                      <div className={cn(
                        "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0",
                        isSelected 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted"
                      )}>
                        {repository.icon}
                      </div>
                      <div className="flex-1 pr-8">
                        <h3 className="font-semibold text-lg">{repository.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {repository.description}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
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
                    <h1 className="text-3xl font-bold">Ready to Launch!</h1>
                    <p className="text-lg text-muted-foreground max-w-md">
                      Click below to create your workspace. This takes about 60 seconds.
                    </p>
                  </div>
                  <Button size="lg" onClick={handleLaunch}>
                    Launch Workspace
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                    <Code className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Creating Your Workspace</h1>
                    <p className="text-lg text-muted-foreground">
                      {creationProgress === 25 && 'Creating workspace...'}
                      {creationProgress === 50 && 'Installing VSCode...'}
                      {creationProgress === 75 && 'Setting up Claude...'}
                      {creationProgress === 100 && 'Configuring terminal...'}
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${creationProgress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          {!isCreating && (
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="ghost"
                onClick={goToPrev}
                disabled={currentStep === 'welcome'}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div className="flex gap-1">
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

              <Button
                onClick={currentStep === 'launch' ? undefined : goToNext}
                disabled={currentStep === 'launch' || (currentStep === 'repository' && selectedRepositories.length === 0)}
                className="gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}