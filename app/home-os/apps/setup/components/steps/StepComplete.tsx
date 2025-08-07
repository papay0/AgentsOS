'use client';

import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SetupData } from '../SetupWizard';

interface StepCompleteProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
  onComplete: () => void;
}

export const StepComplete = ({ 
  onComplete 
}: StepCompleteProps) => {
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

      {/* Start Button */}
      <Button
        onClick={onComplete}
        size="lg"
        className="h-16 px-12 text-xl font-bold bg-green-600 hover:bg-green-700"
      >
        <Rocket className="w-6 h-6 mr-3" />
        Start Coding!
      </Button>
    </div>
  );
};