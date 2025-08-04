import { createApp } from './BaseApp';
import { Terminal } from 'lucide-react';
import TTYDTerminal from '@/components/ttyd-terminal';

const TerminalDesktopContent = (props?: { repositoryUrl?: string }) => {
  const { repositoryUrl } = props || {};
  // If we have a repository URL, use the real terminal
  if (repositoryUrl) {
    // Convert HTTP URL to WebSocket URL for ttyd
    const wsUrl = repositoryUrl.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws';
    return <TTYDTerminal key={repositoryUrl} wsUrl={wsUrl} className="w-full h-full" />;
  }

  // Show error when no URL available
  return (
    <div className="w-full h-full bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
        <div className="text-gray-400 text-xs">No terminal URL configured for this workspace</div>
      </div>
    </div>
  );
};

const TerminalMobileContent = (props?: { repositoryUrl?: string }) => {
  const { repositoryUrl } = props || {};
  
  // If we have a repository URL, use the real terminal
  if (repositoryUrl) {
    // Convert HTTP URL to WebSocket URL for ttyd
    const wsUrl = repositoryUrl.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws';
    return (
      <div className="absolute inset-0 bg-black flex flex-col">
        <TTYDTerminal wsUrl={wsUrl} className="flex-1 w-full" />
      </div>
    );
  }

  // Show error when no URL available
  return (
    <div className="w-full h-full bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
        <div className="text-gray-400 text-xs">No terminal URL configured for this workspace</div>
      </div>
    </div>
  );
};

export const TerminalApp = createApp({
  metadata: {
    id: 'terminal',
    name: 'Terminal',
    description: 'Command line interface for system operations, development tasks, and file management',
    version: '1.0.0',
    author: 'AgentsPod',
    category: 'development',
    icon: {
      icon: <Terminal className="w-full h-full" />,
      fallback: '⚡'
    },
    colors: {
      primary: 'bg-green-500',
      background: 'bg-black',
      text: 'text-green-400'
    }
  },
  window: {
    defaultSize: { width: 800, height: 500 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    position: 'cascade'
  },
  content: {
    desktop: TerminalDesktopContent,
    mobile: TerminalMobileContent
  },
  actions: {
    onOpen: () => console.log('Terminal opened'),
    onClose: () => console.log('Terminal closed')
  }
});