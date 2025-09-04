'use client'

import { useState } from 'react'
import { Code, User, Eye, EyeOff, Key, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { workspaceApi } from '@/lib/api/workspace-api'
import { useAgentsOSUser } from '@/hooks/use-agentsos-user'
import type { CreateWorkspaceResponse } from '@/types/workspace'
import Image from 'next/image'

export interface OnboardingProps {
  onComplete: (workspaceData?: CreateWorkspaceResponse) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { clerkUser, userProfile, isLoading: isUserLoading } = useAgentsOSUser()
  const [isCreating, setIsCreating] = useState(false)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  
  // Feature flag to control whether users provide their own API key
  const requireUserApiKey = process.env.REQUIRE_USER_API_KEY === 'true'
  const defaultApiKey = process.env.DAYTONA_API_KEY || ''
  
  const [daytonaApiKey, setDaytonaApiKey] = useState(requireUserApiKey ? '' : defaultApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')

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

  const validateApiKey = (key: string): boolean => {
    setApiKeyError('')
    
    if (!key.trim()) {
      setApiKeyError('Daytona API key is required')
      return false
    }
    
    // Basic validation for Daytona API key format
    const cleanKey = key.trim()
    if (cleanKey.length < 10 || cleanKey.length > 200) {
      setApiKeyError('API key length should be between 10-200 characters')
      return false
    }
    
    if (!/^[a-zA-Z0-9\-_]+$/.test(cleanKey)) {
      setApiKeyError('API key contains invalid characters')
      return false
    }
    
    return true
  }

  const handleLaunch = async () => {
    // Only validate if user needs to provide key
    if (requireUserApiKey && !validateApiKey(daytonaApiKey)) {
      return
    }
    
    // Use environment key if not requiring user key
    const apiKeyToUse = requireUserApiKey ? daytonaApiKey.trim() : defaultApiKey

    setIsCreating(true)
    setCurrentActivityIndex(0)
    
    // Rotate through activity messages every 2 seconds
    const activityInterval = setInterval(() => {
      setCurrentActivityIndex(prev => (prev + 1) % creationActivities.length)
    }, 2000)
    
    try {
      // Create default workspace (no repositories specified)
      const workspaceData = await workspaceApi.createWorkspace({
        workspaceName: 'AgentsOS Workspace',
        daytonaApiKey: apiKeyToUse
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
      setApiKeyError(error instanceof Error ? error.message : 'Failed to create workspace')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-2xl p-8 space-y-8">
          {!isCreating ? (
            <>
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
                  <h3 className="font-semibold">
                    {clerkUser?.fullName || 'User'}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {clerkUser?.primaryEmailAddress?.emailAddress || 'No email'}
                  </p>
                  {userProfile ? (
                    <p className="text-sm text-green-600">
                      ✓ Synced
                    </p>
                  ) : !isUserLoading && clerkUser && (
                    <p className="text-sm text-amber-600">
                      ⚠ Local mode
                    </p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isUserLoading ? 'Syncing...' : userProfile ? '✓ Synced' : 'Local only'}
                </div>
              </div>

              {/* Welcome Content */}
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Code className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold">Welcome to AgentsOS</h1>
                  <p className="text-muted-foreground text-lg">
                    AI-native development on any device
                  </p>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>• VSCode, terminals, and Claude AI ready instantly</p>
                  <p>• No setup required, works on any device</p>
                  <p>• Start coding in under 60 seconds</p>
                </div>
              </div>

              {/* API Key Section - Only show if required */}
              {requireUserApiKey && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">
                          Use your own Daytona API key
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Use your own Daytona API key for free until we figure out scaling to millions of users.
                        </p>
                        <a 
                          href="https://app.daytona.io/dashboard/keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium underline underline-offset-2"
                        >
                          <Key className="w-3.5 h-3.5" />
                          Get your API key from Daytona
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="daytona-api-key" className="text-sm font-medium">
                      Daytona API Key
                    </label>
                    <div className="relative">
                      <Input
                        id="daytona-api-key"
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter your Daytona API key..."
                        value={daytonaApiKey}
                        onChange={(e) => {
                          setDaytonaApiKey(e.target.value)
                          if (apiKeyError) setApiKeyError('')
                        }}
                        className={apiKeyError ? "border-destructive" : ""}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {apiKeyError && (
                      <p className="text-sm text-destructive">{apiKeyError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Launch Button */}
              <Button 
                size="lg" 
                onClick={handleLaunch}
                disabled={(requireUserApiKey && !daytonaApiKey.trim()) || isCreating}
                className="w-full text-lg py-6 rounded-xl"
              >
                Launch Workspace
              </Button>
            </>
          ) : (
            <>
              {/* Creating State */}
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <Code className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold">Creating Workspace</h1>
                  <div className="min-h-[60px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center transition-opacity duration-500">
                      {creationActivities[currentActivityIndex]}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    This may take up to 60 seconds...
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}