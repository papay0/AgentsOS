import { createApp } from './BaseApp';
import MobileAppTemplate from './MobileAppTemplate';

const ClaudeDesktopContent = () => (
  <div className="w-full h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 space-y-4">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
        C
      </div>
      <div>
        <div className="font-semibold text-lg">Claude Code</div>
        <div className="text-sm text-gray-500">AI Assistant for Development</div>
      </div>
    </div>
    
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Claude Code CLI</div>
      <div className="font-mono text-sm">
        👋 Hello! I&apos;m Claude, your AI coding assistant. I can help you with:
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
        <div className="font-medium text-blue-800 dark:text-blue-200">Code Review</div>
        <div className="text-sm text-blue-600 dark:text-blue-300">Analyze and improve your code</div>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
        <div className="font-medium text-green-800 dark:text-green-200">Debugging</div>
        <div className="text-sm text-green-600 dark:text-green-300">Find and fix issues</div>
      </div>
      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
        <div className="font-medium text-purple-800 dark:text-purple-200">Documentation</div>
        <div className="text-sm text-purple-600 dark:text-purple-300">Generate docs and comments</div>
      </div>
      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
        <div className="font-medium text-orange-800 dark:text-orange-200">Refactoring</div>
        <div className="text-sm text-orange-600 dark:text-orange-300">Improve code structure</div>
      </div>
    </div>
    
    <div className="flex items-center space-x-2 text-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-gray-500">Ready to help with your development tasks</span>
    </div>
  </div>
);

const ClaudeMobileContent = () => (
  <MobileAppTemplate
    title="Claude Code"
    subtitle="AI Development Assistant"
    bottomContent={
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Online</span>
      </div>
    }
  >
    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
      C
    </div>
    
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-sm">
          💬 Hi! I&apos;m Claude, ready to help you with coding, debugging, and development questions.
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <button className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded text-center">
          <div className="text-lg">🔍</div>
          <div className="text-xs">Code Review</div>
        </button>
        <button className="bg-green-100 dark:bg-green-900/30 p-3 rounded text-center">
          <div className="text-lg">🐛</div>
          <div className="text-xs">Debug</div>
        </button>
        <button className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded text-center">
          <div className="text-lg">📝</div>
          <div className="text-xs">Document</div>
        </button>
        <button className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded text-center">
          <div className="text-lg">⚡</div>
          <div className="text-xs">Refactor</div>
        </button>
      </div>
    </div>
  </MobileAppTemplate>
);

export const ClaudeApp = createApp({
  metadata: {
    id: 'claude',
    name: 'Claude Code',
    description: 'AI-powered coding assistant with advanced code analysis, debugging, and development support',
    version: '1.0.67',
    author: 'Anthropic',
    category: 'development',
    icon: {
      emoji: '🤖',
      url: 'https://anthropic.gallerycdn.vsassets.io/extensions/anthropic/claude-code/1.0.67/1754087738567/Microsoft.VisualStudio.Services.Icons.Default',
      fallback: '🤖'
    },
    colors: {
      primary: 'bg-purple-500',
      background: 'bg-white dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200'
    }
  },
  window: {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 500, height: 400 },
    resizable: true,
    position: 'cascade'
  },
  content: {
    desktop: ClaudeDesktopContent,
    mobile: ClaudeMobileContent
  },
  actions: {
    onOpen: () => console.log('Claude Code opened'),
    onClose: () => console.log('Claude Code closed')
  }
});