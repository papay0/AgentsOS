'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SetupData } from '../SetupWizard';

interface StepGithubReposProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
  onComplete?: () => void;
  onGoToGithubAuth?: () => void;
  onGoToWallpaper?: () => void;
}

export const StepGithubRepos = ({ 
  setupData,
  updateSetupData,
  onNext,
  onGoToGithubAuth,
  onGoToWallpaper
}: StepGithubReposProps) => {

  const handleYesClick = () => {
    updateSetupData({
      githubRepos: {
        enabled: true,
        authenticated: false, // Not authenticated yet
        repos: []
      }
    });
    // Auto-advance to GitHub authentication
    setTimeout(() => {
      if (onGoToGithubAuth) {
        onGoToGithubAuth();
      } else {
        onNext(); // Fallback
      }
    }, 300);
  };

  const handleNoClick = () => {
    updateSetupData({
      githubRepos: {
        enabled: false,
        authenticated: false,
        repos: []
      }
    });
    // Auto-advance to wallpaper (skip GitHub auth)
    setTimeout(() => {
      if (onGoToWallpaper) {
        onGoToWallpaper();
      } else {
        onNext(); // Fallback
      }
    }, 300);
  };

  const isYesSelected = setupData.githubRepos.enabled === true;
  const isNoSelected = setupData.githubRepos.enabled === false;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Explanatory Text */}
      <div className="text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Connect your GitHub account to easily access and clone your repositories directly in your workspace. You can always add repositories manually later.
        </p>
      </div>

      {/* Simple Yes/No Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={handleYesClick}
          size="lg"
          variant={isYesSelected ? "default" : "outline"}
          className={`h-16 px-8 text-lg font-semibold min-w-[180px] ${
            isYesSelected ? 'bg-blue-500 hover:bg-blue-600' : ''
          }`}
        >
          <Check className="w-6 h-6 mr-3" />
          Yes, Configure
        </Button>
        
        <Button
          onClick={handleNoClick}
          size="lg"
          variant="outline"
          className="h-16 px-8 text-lg font-semibold min-w-[180px] hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <X className="w-6 h-6 mr-3" />
          No, Skip
        </Button>
      </div>

    </div>
  );
};