'use client';

import React from 'react';
import { type MobileApp } from './MobileWorkspace';
import { ArrowLeft } from 'lucide-react';
import MobileSettings from './MobileSettings';

interface MobileAppProps {
  app: MobileApp;
  onClose: () => void;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

export default function MobileApp({ app, onClose, theme, onThemeChange }: MobileAppProps) {

  const getAppContent = () => {
    switch (app.type) {
      case 'vscode':
        return (
          <div className="h-full bg-gray-900 text-green-400 font-mono p-4 overflow-hidden">
            <div className="text-blue-400 mb-2">{`// ${app.name} Mobile`}</div>
            <div className="text-purple-400">import</div>
            <div className="ml-4 text-yellow-400">React</div>
            <div className="text-purple-400">from</div>
            <div className="ml-4 text-green-300">&apos;react&apos;;</div>
            <br />
            <div className="text-blue-400">const</div>
            <div className="ml-4 text-yellow-400">AgentsOS</div>
            <div className="text-purple-400">=</div>
            <div className="ml-4">() =&gt; &#123;</div>
            <div className="ml-8 text-blue-400">return</div>
            <div className="ml-12 text-green-300">&lt;div&gt;Mobile Development!&lt;/div&gt;</div>
            <div className="ml-4">&#125;</div>
          </div>
        );
      
      case 'claude':
        return (
          <div className="h-full bg-white dark:bg-gray-800 p-4 overflow-hidden">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                C
              </div>
              <div>
                <div className="font-semibold text-lg">Claude</div>
                <div className="text-sm text-gray-500">AI Assistant</div>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
              👋 Hello! I&apos;m Claude on mobile. I can help you with coding, writing, analysis, and more. 
              How can I assist you today?
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Ready to help</span>
            </div>
          </div>
        );
      
      case 'terminal':
        return (
          <div className="h-full bg-black text-green-400 font-mono p-4 overflow-hidden">
            <div className="text-green-400">$ npm run dev</div>
            <div className="text-blue-400">✓ Local: http://localhost:3000</div>
            <div className="text-green-400">✓ Ready in 2.1s</div>
            <br />
            <div className="text-green-400">$ mobile --version</div>
            <div className="text-white">AgentsOS Mobile v1.0.0</div>
            <br />
            <div className="text-green-400">$ _</div>
            <div className="animate-pulse bg-green-400 w-2 h-4 inline-block ml-1"></div>
          </div>
        );
      
      case 'safari':
        return (
          <div className="h-full bg-gray-100 dark:bg-gray-800">
            <div className="bg-white dark:bg-gray-700 p-4 border-b">
              <div className="bg-gray-200 dark:bg-gray-600 rounded-full px-4 py-2 text-center text-sm">
                🔍 Search or enter website name
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">🌐</div>
              <div className="text-lg font-semibold mb-2">Welcome to Safari</div>
              <div className="text-gray-500">Your mobile web browser</div>
            </div>
          </div>
        );
      
      case 'settings':
        return <MobileSettings theme={theme} onThemeChange={onThemeChange} />;
      
      default:
        return (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">{app.icon}</div>
              <div className="text-2xl font-bold mb-2">{app.name}</div>
              <div className="text-white/80">Mobile App Experience</div>
            </div>
          </div>
        );
    }
  };


  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* App header with close button */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="font-semibold">{app.name}</div>
        <div className="w-8 h-8"></div> {/* Spacer for centering */}
      </div>
      
      {/* App content */}
      <div className="flex-1 overflow-hidden">
        {getAppContent()}
      </div>
    </div>
  );
}