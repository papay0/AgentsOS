'use client'

import { useState } from 'react'
import { Code, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { workspaceApi } from '@/lib/api/workspace-api'
import { useAgentsOSUser } from '@/hooks/use-agentsos-user'
import type { CreateWorkspaceResponse } from '@/types/workspace'
import Image from 'next/image'

export interface MobileOnboardingProps {
  onComplete: (workspaceData?: CreateWorkspaceResponse) => void
  onSkip?: () => void
}

export function MobileOnboarding({ onComplete, onSkip }: MobileOnboardingProps) {
  const { clerkUser, userProfile, isLoading: isUserLoading } = useAgentsOSUser()
  const [isCreating, setIsCreating] = useState(false)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)

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
      // Create default workspace (no repositories specified)
      const workspaceData = await workspaceApi.createWorkspace({
        workspaceName: 'AgentsOS Workspace'
      })
      
      clearInterval(activityInterval)
      
      // Show completion message briefly
      setCurrentActivityIndex(creationActivities.length - 1)
      setTimeout(() => {
        onComplete(workspaceData)
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
        {!isCreating ? (
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

            {/* Launch Button */}
            <Button size="lg" onClick={handleLaunch} className="w-full">
              Launch Workspace
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
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
          </div>
        )}
      </div>
    </div>
  )
}