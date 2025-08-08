'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentsOSUser } from '@/hooks/use-agentsos-user';

import { StepGithubRepos } from './steps/StepGithubRepos';
import { StepGithubAuth } from './steps/StepGithubAuth';
import { StepGithubRepoSelection } from './steps/StepGithubRepoSelection';
import { StepWallpaper } from './steps/StepWallpaper';
import { StepTheme } from './steps/StepTheme';
import { StepComplete } from './steps/StepComplete';

interface SetupWizardProps {
  isMobile?: boolean;
}

export interface SetupData {
  githubRepos: {
    enabled: boolean | undefined;
    authenticated: boolean;
    repos: string[];
  };
  wallpaper: string;
  theme: 'light' | 'dark' | 'system';
}

interface BaseStepProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
  onComplete: () => void;
}

export const SetupWizard = ({ isMobile = false }: SetupWizardProps) => {
  console.log('🚀 SetupWizard rendering with props:', { isMobile });
  const [currentStepId, setCurrentStepId] = useState('github');
  const [setupData, setSetupData] = useState<SetupData>({
    githubRepos: {
      enabled: undefined, // No selection initially
      authenticated: false,
      repos: []
    },
    wallpaper: 'wallpaper-1',
    theme: 'system'
  });
  
  const { updateUserPreferences } = useAgentsOSUser();

  // Static steps - no dynamic generation to avoid index issues
  const allSteps: Array<{
    id: string;
    title: string;
    description: string;
    component: React.ComponentType<BaseStepProps>;
    shouldShow: () => boolean;
  }> = [
    {
      id: 'github',
      title: 'Connect GitHub',
      description: 'Do you want to connect your GitHub account?',
      component: StepGithubRepos,
      shouldShow: () => true
    },
    {
      id: 'github-auth',
      title: 'GitHub Authentication',
      description: 'Sign in to your GitHub account',
      component: StepGithubAuth,
      shouldShow: () => setupData.githubRepos.enabled === true
    },
    {
      id: 'github-repo-selection',
      title: 'Select Repositories',
      description: 'Choose repositories to work with',
      component: StepGithubRepoSelection,
      shouldShow: () => setupData.githubRepos.enabled === true && setupData.githubRepos.authenticated === true
    },
    {
      id: 'wallpaper',
      title: 'Choose Wallpaper',
      description: 'Pick a wallpaper that inspires your coding',
      component: StepWallpaper,
      shouldShow: () => true
    },
    {
      id: 'theme',
      title: 'Select Theme',
      description: 'Choose your preferred theme',
      component: StepTheme,
      shouldShow: () => true
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      description: 'Ready to start coding!',
      component: StepComplete,
      shouldShow: () => true
    }
  ];

  // Find current step data by ID
  const currentStepData = allSteps.find(step => step.id === currentStepId);
  const CurrentStepComponent = currentStepData?.component;

  
  const nextStep = () => {
    if (currentStepId === 'github-auth') {
      // From GitHub auth step → go to repo selection if authenticated
      if (setupData.githubRepos.authenticated) {
        setCurrentStepId('github-repo-selection');
      } else {
        setCurrentStepId('wallpaper');
      }
    } else if (currentStepId === 'github-repo-selection') {
      // From repo selection → go to wallpaper
      setCurrentStepId('wallpaper');
    } else if (currentStepId === 'wallpaper') {
      // From wallpaper → go to theme
      setCurrentStepId('theme');
    } else if (currentStepId === 'theme') {
      // From theme → go to complete
      setCurrentStepId('complete');
    }
    // GitHub step has its own navigation logic below
  };

  // Direct navigation functions for GitHub step
  const goToGithubAuth = () => setCurrentStepId('github-auth');
  const goToWallpaper = () => setCurrentStepId('wallpaper');

  const prevStep = () => {
    if (currentStepId === 'github-auth') {
      // From GitHub auth → go back to GitHub repos
      setCurrentStepId('github');
    } else if (currentStepId === 'github-repo-selection') {
      // From repo selection → go back to GitHub auth
      setCurrentStepId('github-auth');
    } else if (currentStepId === 'wallpaper') {
      // From wallpaper → go back based on GitHub choice
      if (setupData.githubRepos.enabled === true && setupData.githubRepos.authenticated === true) {
        // User authenticated → go back to repo selection
        setCurrentStepId('github-repo-selection');
      } else if (setupData.githubRepos.enabled === true) {
        // User chose GitHub but didn't authenticate → go back to GitHub auth
        setCurrentStepId('github-auth');
      } else {
        // User chose "No" → go back to GitHub repos
        setCurrentStepId('github');
      }
    } else if (currentStepId === 'theme') {
      // From theme → go back to wallpaper
      setCurrentStepId('wallpaper');
    } else if (currentStepId === 'complete') {
      // From complete → go back to theme
      setCurrentStepId('theme');
    }
  };

  // Get visible steps for progress calculation
  const visibleSteps = allSteps.filter(step => step.shouldShow());
  const currentVisibleIndex = visibleSteps.findIndex(step => step.id === currentStepId);
  const isLastStep = currentVisibleIndex === visibleSteps.length - 1;
  const isFirstStep = currentVisibleIndex === 0;

  const completeSetup = async () => {
    try {
      // Save setup preferences to Firestore
      await updateUserPreferences({
        setupDone: true,
        githubReposEnabled: setupData.githubRepos.enabled,
        githubRepos: setupData.githubRepos.repos,
        wallpaper: setupData.wallpaper,
        theme: setupData.theme
      });

      // Apply theme and wallpaper immediately
      if (typeof window !== 'undefined') {
        // Apply theme
        const root = window.document.documentElement;
        if (setupData.theme === 'dark') {
          root.classList.add('dark');
        } else if (setupData.theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (systemDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }

        // Apply wallpaper (reuse from SettingsApp)
        const wallpapers = [
          { id: 'wallpaper-1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2560&h=1440&fit=crop&crop=center&q=80' },
          { id: 'wallpaper-2', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&h=1440&fit=crop&crop=center&q=80' },
          { id: 'wallpaper-3', url: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=2560&h=1440&fit=crop&crop=center&q=80' },
          { id: 'wallpaper-4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2560&h=1440&fit=crop&crop=center&q=80' }
        ];
        
        const selectedWallpaper = wallpapers.find(w => w.id === setupData.wallpaper);
        if (selectedWallpaper) {
          root.style.setProperty('--desktop-background', `url("${selectedWallpaper.url}")`);
          localStorage.setItem('agentsos-wallpaper', setupData.wallpaper);
        }
      }

      // Close setup and refresh workspace
      console.log('Setup completed!', setupData);
      
      // Close the setup window
      if (typeof window !== 'undefined') {
        // Trigger a page refresh to reinitialize the workspace
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to complete setup:', error);
    }
  };

  const updateSetupData = (updates: Partial<SetupData>) => {
    setSetupData(prev => ({ ...prev, ...updates }));
  };

  // Check if current step is GitHub auth and user is not authenticated
  const isGithubAuthStep = currentStepId === 'github-auth';
  const isGithubAuthIncomplete = isGithubAuthStep && !setupData.githubRepos.authenticated;

  return (
    <div className={`w-full h-full bg-white dark:bg-gray-800 flex flex-col ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {currentStepData?.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentStepData?.description}
            </p>
          </div>
          <div className="text-sm text-gray-400">
            {currentVisibleIndex + 1} of {visibleSteps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentVisibleIndex + 1) / visibleSteps.length) * 100}%` }}
          />
        </div>

      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pt-2">
        {CurrentStepComponent && (
          <CurrentStepComponent 
            setupData={setupData}
            updateSetupData={updateSetupData}
            isMobile={isMobile}
            onNext={nextStep}
            onComplete={completeSetup}
            {...(currentStepId === 'github' ? {
              onGoToGithubAuth: goToGithubAuth,
              onGoToWallpaper: goToWallpaper
            } : {})}
          />
        )}
      </div>

      {/* Navigation */}
      {!isLastStep && currentStepId !== 'github' && currentStepId !== 'github-repo-selection' && (
        <div className="flex-shrink-0 flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={isFirstStep}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={() => {
              if (isGithubAuthIncomplete) {
                // Skip GitHub integration
                updateSetupData({
                  githubRepos: {
                    enabled: false,
                    authenticated: false,
                    repos: []
                  }
                });
              }
              nextStep();
            }}
            disabled={currentStepId === 'github' && setupData.githubRepos.enabled === undefined}
            className="flex items-center gap-2"
          >
            {isGithubAuthIncomplete ? 'Skip' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};