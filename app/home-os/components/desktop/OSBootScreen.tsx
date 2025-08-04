'use client';

import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

interface OSBootScreenProps {
  onComplete?: () => void;
}

export function OSBootScreen({ onComplete }: OSBootScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  const bootMessages = [
    "Initializing AI Core Systems",
    "Loading Workspace Database", 
    "Establishing Cloud Connections",
    "Securing Agent Environment",
    "Starting Development Services",
    "Finalizing OS Components"
  ];

  const MINIMUM_BOOT_TIME = 4000; // 4 seconds minimum

  useEffect(() => {
    const startTime = Date.now();

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

    // Complete after minimum time
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        onComplete?.();
      }, 300); // Small delay after reaching 100%
    }, MINIMUM_BOOT_TIME);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [bootMessages.length, onComplete]);

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
        </div>
      </div>
    </div>
  );
}