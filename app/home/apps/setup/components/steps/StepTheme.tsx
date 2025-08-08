'use client';

import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { SetupData } from '../SetupWizard';

interface StepThemeProps {
  setupData: SetupData;
  updateSetupData: (updates: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
  onComplete?: () => void;
}

const themes = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright interface',
    icon: Sun,
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes',
    icon: Moon,
  },
  {
    id: 'system',
    name: 'System',
    description: 'Follows your device setting',
    icon: Monitor,
  }
];

export const StepTheme = ({ 
  setupData, 
  updateSetupData
}: Omit<StepThemeProps, 'isMobile' | 'onNext'>) => {
  const { setTheme } = useTheme();
  
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSetupData({ theme });
    setTheme(theme); // Apply theme immediately
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Theme Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const isSelected = setupData.theme === theme.id;
          const IconComponent = theme.icon;
          
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id as 'light' | 'dark' | 'system')}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              
              {/* Theme content */}
              <div className="text-center space-y-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto ${
                  theme.id === 'light' ? 'bg-yellow-100 text-yellow-600' :
                  theme.id === 'dark' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">
                    {theme.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {theme.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};