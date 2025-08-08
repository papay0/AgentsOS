'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Terminal } from 'lucide-react';
import TTYDTerminal, { TTYDTerminalRef } from '@/components/ttyd-terminal';
import { useAgentsOSUser } from '@/hooks/use-agentsos-user';
import { SetupData } from '../SetupWizard';

interface StepGithubAuthProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
  onComplete: () => void;
}

export const StepGithubAuth = ({ 
  setupData,
  updateSetupData,
  onNext
}: StepGithubAuthProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const terminalRef = useRef<TTYDTerminalRef>(null);
  const { workspace } = useAgentsOSUser();

  // Get terminal URL from workspace - simple approach
  const repositoryUrl = workspace?.sandboxId && workspace?.repositories?.[0]?.ports?.terminal
    ? `https://${workspace.repositories[0].ports.terminal}-${workspace.sandboxId}.proxy.daytona.work`
    : null;

  const handleStartAuth = () => {
    if (terminalRef.current && isConnected) {
      terminalRef.current.sendCommand('gh auth login', true);
      setHasStarted(true);
    }
  };

  const handleCheckAuth = async () => {
    if (terminalRef.current && isConnected) {
      // Send 'gh auth status' command to check if user is authenticated
      terminalRef.current.sendCommand('gh auth status', true);
      
      // For now, we'll still need to manually verify since we can't easily parse terminal output
      // In a real implementation, we'd need to capture and parse the terminal output
      setTimeout(() => {
        // TODO: Actually parse terminal output to verify auth status
        // For now, assume success after user has had time to see the status
        const userConfirmed = window.confirm('Did the GitHub authentication succeed? Click OK if you see "Logged in to github.com" in the terminal.');
        
        if (userConfirmed) {
          setIsAuthenticated(true);
          updateSetupData({
            githubRepos: {
              ...setupData.githubRepos,
              enabled: true,
              authenticated: true
            }
          });
        }
      }, 1000);
    }
  };

  const handleSkip = () => {
    // Mark GitHub repos as disabled when skipping
    updateSetupData({
      githubRepos: {
        enabled: false,
        authenticated: false,
        repos: []
      }
    });
    onNext();
  };

  if (!repositoryUrl) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center py-8">
          <Terminal className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Terminal Not Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Workspace terminal is not ready yet. Please wait a moment and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4 overflow-y-auto">
      {/* Header with Action Buttons */}
      <div className="text-center flex-shrink-0">
        <Terminal className="w-8 h-8 md:w-12 md:h-12 text-blue-500 mx-auto mb-2 md:mb-4" />
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Authenticate with GitHub
        </h3>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 px-2 mb-3 md:mb-4">
          Use the terminal below to sign in to your GitHub account.
        </p>
        
        {/* Action Buttons moved here */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-3 md:mb-4">
          {!hasStarted && (
            <Button
              onClick={handleStartAuth}
              disabled={!isConnected}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm w-full sm:w-auto"
            >
              <Terminal className="w-4 h-4 mr-2" />
              <span className="truncate">{isConnected ? 'Start Authentication' : 'Connecting...'}</span>
            </Button>
          )}

          {hasStarted && !isAuthenticated && (
            <Button
              onClick={handleCheckAuth}
              variant="outline"
              size="sm"
              className="px-4 py-2 text-sm w-full sm:w-auto"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="truncate">Verify Authentication</span>
            </Button>
          )}

          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="font-medium text-sm sm:text-base">Authentication Successful!</span>
              </div>
              <Button
                onClick={onNext}
                size="sm"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm w-full sm:w-auto"
              >
                <span className="truncate">Next: Select Repositories</span>
              </Button>
            </div>
          ) : (
            hasStarted && (
              <Button
                onClick={handleSkip}
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm w-full sm:w-auto"
              >
                <span className="truncate">Skip GitHub Integration</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* Terminal Container - fixed height for mobile */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex flex-col h-80 sm:h-96">
        <div className="bg-gray-800 px-2 sm:px-4 py-2 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs sm:text-sm text-gray-300 ml-1 sm:ml-2 truncate">GitHub Auth Terminal</span>
            {isConnected && (
              <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400"></div>
                <span className="text-xs text-green-400 hidden sm:inline">Connected</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          {repositoryUrl && (
            <TTYDTerminal
              key={repositoryUrl}
              ref={terminalRef}
              wsUrl={repositoryUrl.replace('https://', 'wss://') + '/ws'}
              className="w-full h-full"
              onConnectionChange={setIsConnected}
            />
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800 flex-shrink-0">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">
          Follow these steps:
        </h4>
        <ol className="space-y-1 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
          <li>1. Click the blue &ldquo;Start Authentication&rdquo; button above</li>
          <li>2. Follow the prompts in the terminal to authenticate with GitHub</li>
          <li>3. Once completed, click &ldquo;Verify Authentication&rdquo;</li>
          <li>4. Click &ldquo;Next&rdquo; to proceed to repository selection</li>
        </ol>
      </div>

    </div>
  );
};