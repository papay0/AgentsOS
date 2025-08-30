'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Terminal } from 'lucide-react';

// Global flag to prevent multiple token refresh calls for the same workspace
const tokenRefreshInProgress = new Set<string>();

interface OSBootScreenProps {
  onComplete?: () => void;
  sandboxId?: string;
}

export function OSBootScreen({ onComplete, sandboxId }: OSBootScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [tokenRefreshComplete, setTokenRefreshComplete] = useState(false);
  const [tokenRefreshError, setTokenRefreshError] = useState<string | null>(null);

  const bootMessages = [
    "Refreshing workspace tokens",
    "Initializing AI Core Systems",
    "Loading Workspace Database", 
    "Establishing Cloud Connections",
    "Securing Agent Environment",
    "Starting Development Services",
    "Finalizing OS Components"
  ];

  const MINIMUM_BOOT_TIME = 1800; // 1.8 seconds minimum

  // Token refresh function
  const refreshTokens = useCallback(async () => {
    if (!sandboxId) {
      setTokenRefreshComplete(true);
      return;
    }

    // Check if token refresh is already in progress for this workspace
    if (tokenRefreshInProgress.has(sandboxId)) {
      console.log(`🔄 OSBootScreen: Token refresh already in progress for ${sandboxId}, skipping`);
      setTokenRefreshComplete(true);
      return;
    }

    try {
      // Mark as in progress
      tokenRefreshInProgress.add(sandboxId);
      
      console.log(`🔄 OSBootScreen: Refreshing tokens for workspace ${sandboxId}`);
      const response = await fetch(`/api/workspace-bootstrap/${sandboxId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Token refresh failed');
      }

      const result = await response.json();
      console.log(`✅ OSBootScreen: Token refresh completed:`, result.message);
      setTokenRefreshComplete(true);
    } catch (error) {
      console.error('❌ OSBootScreen: Token refresh failed:', error);
      setTokenRefreshError(error instanceof Error ? error.message : 'Token refresh failed');
      setTokenRefreshComplete(true); // Continue boot sequence even on error
    } finally {
      // Clear the in-progress flag after a delay to allow for boot screen completion
      setTimeout(() => {
        tokenRefreshInProgress.delete(sandboxId);
      }, 5000); // 5 second cooldown
    }
  }, [sandboxId]);

  useEffect(() => {
    const startTime = Date.now();
    
    // Start token refresh immediately
    refreshTokens();

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < bootMessages.length - 1) {
          // Fade out
          setFadeClass('opacity-0');
          setTimeout(() => {
            // Fade back in with new message
            setFadeClass('opacity-100');
          }, 200);
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const elapsed = Date.now() - startTime;
        const targetProgress = Math.min((elapsed / MINIMUM_BOOT_TIME) * 100, 100);
        
        if (prev < targetProgress - 5) {
          return prev + Math.random() * 4 + 2;
        } else if (prev < targetProgress) {
          return prev + Math.random() * 1.5;
        }
        return prev;
      });
    }, 80);

    // Complete after minimum time AND token refresh is done
    const completeTimer = setTimeout(() => {
      setProgress(100);
      
      // Check if token refresh is complete before calling onComplete
      const checkAndComplete = () => {
        if (tokenRefreshComplete) {
          setTimeout(() => {
            onComplete?.();
          }, 300); // Small delay after reaching 100%
        } else {
          // Wait a bit longer and check again
          setTimeout(checkAndComplete, 100);
        }
      };
      
      checkAndComplete();
    }, MINIMUM_BOOT_TIME);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
    // Note: tokenRefreshComplete intentionally excluded from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootMessages.length, onComplete, refreshTokens]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden z-[9999]">
      {/* Main content */}
      <div className="text-center space-y-8 max-w-lg w-full px-6">
        {/* Logo */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Terminal className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white tracking-wider">AgentsOS</h1>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-4">
          <div className="w-full bg-gray-700/50 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
              }}
            />
          </div>
          
          {/* Changing text with fade animation */}
          <p 
            className={`text-lg text-blue-200 font-medium transition-opacity duration-300 ${fadeClass} h-8 flex items-center justify-center`}
          >
            {bootMessages[currentStep]}
          </p>
          
          {/* Error message if token refresh failed */}
          {tokenRefreshError && (
            <p className="text-sm text-red-300 mt-2 opacity-80">
              Warning: {tokenRefreshError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}