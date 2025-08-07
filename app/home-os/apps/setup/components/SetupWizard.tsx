'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentsOSUser } from '@/hooks/use-agentsos-user';

import { StepGithubRepos } from './steps/StepGithubRepos';
import { StepGithubAuth } from './steps/StepGithubAuth';
import { StepWallpaper } from './steps/StepWallpaper';
import { StepTheme } from './steps/StepTheme';
import { StepComplete } from './steps/StepComplete';

interface SetupWizardProps {
  isMobile?: boolean;
}

export interface SetupData {
  githubRepos: {
    enabled: boolean | undefined;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    githubRepos: {
      enabled: undefined, // No selection initially
      repos: []
    },
    wallpaper: 'wallpaper-1',
    theme: 'system'
  });
  
  const { updateUserPreferences } = useAgentsOSUser();

  // Dynamic steps based on GitHub selection
  const getSteps = () => {
    const baseSteps: Array<{
      id: string;
      title: string;
      description: string;
      component: React.ComponentType<BaseStepProps>;
    }> = [
      {
        id: 'github',
        title: 'Connect GitHub',
        description: 'Do you want to connect your GitHub account?',
        component: StepGithubRepos
      }
    ];

    // Add GitHub authentication step if user selected "Yes"
    if (setupData.githubRepos.enabled === true) {
      baseSteps.push({
        id: 'github-auth',
        title: 'GitHub Authentication',
        description: 'Sign in to your GitHub account',
        component: StepGithubAuth
      });
    }

    // Add remaining steps
    baseSteps.push(
      {
        id: 'wallpaper',
        title: 'Choose Wallpaper',
        description: 'Pick a wallpaper that inspires your coding',
        component: StepWallpaper
      },
      {
        id: 'theme',
        title: 'Select Theme',
        description: 'Choose your preferred theme',
        component: StepTheme
      },
      {
        id: 'complete',
        title: 'Setup Complete',
        description: 'Ready to start coding!',
        component: StepComplete
      }
    );

    return baseSteps;
  };

  const steps = getSteps();

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData.component;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

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
    setSetupData(prev => {
      const newData = { ...prev, ...updates };
      
      // If GitHub preference changed, reset to step 0 if we're beyond the first step
      if (updates.githubRepos && updates.githubRepos.enabled !== prev.githubRepos.enabled && currentStep > 0) {
        setCurrentStep(0);
      }
      
      return newData;
    });
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className={`w-full h-full bg-white dark:bg-gray-800 flex flex-col ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {currentStepData.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentStepData.description}
            </p>
          </div>
          <div className="text-sm text-gray-400">
            {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        <CurrentStepComponent 
          setupData={setupData}
          updateSetupData={updateSetupData}
          isMobile={isMobile}
          onNext={nextStep}
          onComplete={completeSetup}
        />
      </div>

      {/* Navigation */}
      {!isLastStep && (
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
            onClick={nextStep}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};