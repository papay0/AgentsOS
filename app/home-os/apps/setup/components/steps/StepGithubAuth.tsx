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
    // We'll assume authentication is successful for now
    setTimeout(() => {
      setIsAuthenticated(true);
      
      // Update setup data to indicate GitHub is configured and authenticated
      updateSetupData({
        githubRepos: {
          ...setupData.githubRepos,
          enabled: true,
          authenticated: true
        }
      });
    }, 2000);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Action Buttons */}
      <div className="text-center">
        <Terminal className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Authenticate with GitHub
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
          Use the terminal below to sign in to your GitHub account.
        </p>
        
        {/* Action Buttons moved here */}
        <div className="flex gap-3 justify-center mb-4">
          {!hasStarted && (
            <Button
              onClick={handleStartAuth}
              disabled={!isConnected}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              <Terminal className="w-4 h-4 mr-2" />
              {isConnected ? 'Start Authentication' : 'Connecting...'}
            </Button>
          )}

          {hasStarted && !isAuthenticated && (
            <Button
              onClick={handleCheckAuth}
              variant="outline"
              size="lg"
              className="px-6"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Authentication
            </Button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Authentication Successful!</span>
              </div>
              <Button
                onClick={onNext}
                size="lg"
                className="bg-green-600 hover:bg-green-700 px-6"
              >
                Next: Select Repositories
              </Button>
            </div>
          ) : (
            hasStarted && (
              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
                className="px-6"
              >
                Skip GitHub Integration
              </Button>
            )
          )}
        </div>
      </div>

      {/* Terminal Container */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-sm text-gray-300 ml-2">GitHub Authentication Terminal</span>
            {isConnected && (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs text-green-400">Connected</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-80">
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
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Follow these steps:
        </h4>
        <ol className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>1. Click the blue &ldquo;Start Authentication&rdquo; button above</li>
          <li>2. Follow the prompts in the terminal to authenticate with GitHub</li>
          <li>3. Once completed, click &ldquo;Verify Authentication&rdquo;</li>
          <li>4. Click &ldquo;Next&rdquo; to proceed to repository selection</li>
        </ol>
      </div>

    </div>
  );
};