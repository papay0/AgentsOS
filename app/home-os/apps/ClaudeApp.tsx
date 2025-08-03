import { createApp } from './BaseApp';
import MobileAppTemplate from './MobileAppTemplate';
import TTYDTerminal from '@/components/ttyd-terminal';

const ClaudeDesktopContent = (props?: { repositoryUrl?: string }) => {
  const { repositoryUrl } = props || {};
  // If we have a repository URL, use the real Claude terminal
  if (repositoryUrl) {
    // Convert HTTP URL to WebSocket URL for ttyd
    const wsUrl = repositoryUrl.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws';
    return <TTYDTerminal key={repositoryUrl} wsUrl={wsUrl} className="w-full h-full" />;
  }

  // Show error when no URL available
  return (
    <div className="w-full h-full bg-gray-800 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Claude Not Available</div>
        <div className="text-gray-400 text-xs">No Claude URL configured for this workspace</div>
      </div>
    </div>
  );
};

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