'use client';

import { useState } from 'react';
import { Rocket, Loader2, CheckCircle, AlertCircle, GitBranch, Settings, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SetupData } from '../SetupWizard';
import { useWorkspaceStore } from '@/app/home-os/stores/workspaceStore';

interface StepCompleteProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
  onComplete: () => void;
}

interface ProvisioningStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

export const StepComplete = ({ 
  setupData,
  onComplete 
}: StepCompleteProps) => {
  const { sandboxId } = useWorkspaceStore();
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningSteps, setProvisioningSteps] = useState<ProvisioningStep[]>([]);
  const [error, setError] = useState<string | null>(null);


  const startProvisioning = async () => {
    if (!sandboxId) {
      setError('No workspace sandbox found');
      return;
    }

    setIsProvisioning(true);
    setError(null);

    // Initialize provisioning steps
    const steps: ProvisioningStep[] = [];
    
    if (setupData.githubRepos.repos.length > 0) {
      steps.push({
        id: 'repositories',
        label: `Cloning ${setupData.githubRepos.repos.length} repositories`,
        icon: <GitBranch className="w-5 h-5" />,
        status: 'pending'
      });
    }
    
    steps.push({
      id: 'workspace',
      label: 'Configuring workspace settings',
      icon: <Settings className="w-5 h-5" />,
      status: 'pending'
    });
    
    if (setupData.theme || setupData.wallpaper) {
      steps.push({
        id: 'theme',
        label: 'Applying theme and wallpaper',
        icon: <Palette className="w-5 h-5" />,
        status: 'pending'
      });
    }
    
    setProvisioningSteps(steps);

    try {
      // Update repository step to running
      updateStepStatus('repositories', 'running');

      // Call provisioning API
      const response = await fetch('/api/workspace/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          repositories: setupData.githubRepos.repos,
          theme: setupData.theme,
          wallpaper: setupData.wallpaper
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Provisioning failed');
      }

      // Update step statuses based on result
      if (result.steps.repositories) {
        const repoStep = result.steps.repositories;
        updateStepStatus('repositories', repoStep.success ? 'success' : 'error', 
          `Cloned: ${repoStep.cloned}, Skipped: ${repoStep.skipped}, Failed: ${repoStep.failed}`);
      }

      if (result.steps.workspace) {
        updateStepStatus('workspace', 'success', 'Workspace configured');
      }

      if (result.steps.theme) {
        updateStepStatus('theme', 'success', 'Theme applied');
      }

      // Note: Provisioning results are automatically saved to Firebase by the backend

      // Wait a moment to show success state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Complete setup
      onComplete();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provisioning failed');
      setIsProvisioning(false);
      
      // Mark remaining steps as error
      setProvisioningSteps(prev => prev.map(step => 
        step.status === 'pending' || step.status === 'running' 
          ? { ...step, status: 'error' }
          : step
      ));
    }
  };

  const updateStepStatus = (stepId: string, status: ProvisioningStep['status'], message?: string) => {
    setProvisioningSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ));
  };

  const getStepIcon = (step: ProvisioningStep) => {
    switch (step.status) {
      case 'pending':
        return <div className="text-gray-400">{step.icon}</div>;
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  // Show provisioning progress
  if (isProvisioning || provisioningSteps.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {isProvisioning ? 'Setting up your workspace...' : 'Ready to code!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isProvisioning ? 'This will just take a moment' : 'Your workspace is configured'}
          </p>
        </div>

        {/* Provisioning Steps */}
        <div className="space-y-3 max-w-md mx-auto">
          {provisioningSteps.map(step => (
            <div 
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                step.status === 'running' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : step.status === 'success'
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : step.status === 'error'
                  ? 'border-red-500 bg-red-50 dark:bg-red-950'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {getStepIcon(step)}
              <div className="flex-1">
                <p className="font-medium">{step.label}</p>
                {step.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button 
              onClick={startProvisioning}
              className="mt-3"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Initial complete screen
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 text-center max-w-lg mx-auto">
      {/* Success Animation */}
      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <Rocket className="w-12 h-12 text-green-600 animate-bounce" />
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          You&apos;re All Set! 🎉
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Your workspace is ready for you to create amazing things.
        </p>
      </div>

      {/* Summary */}
      {setupData.githubRepos.repos.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {setupData.githubRepos.repos.length} repositories will be cloned
        </div>
      )}

      {/* Start Button */}
      <Button
        onClick={startProvisioning}
        size="lg"
        className="h-16 px-12 text-xl font-bold bg-green-600 hover:bg-green-700"
      >
        <Rocket className="w-6 h-6 mr-3" />
        Start Coding!
      </Button>
    </div>
  );
};