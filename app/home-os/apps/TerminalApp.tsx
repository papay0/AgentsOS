import { createApp } from './BaseApp';
import MobileAppTemplate from './MobileAppTemplate';
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

const TerminalMobileContent = () => (
  <MobileAppTemplate
    title="Terminal"
    subtitle="Command Line Interface"
    backgroundColor="bg-black"
    bottomContent={
      <div className="animate-pulse bg-green-400 w-2 h-3 inline-block"></div>
    }
  >
    <div className="space-y-1 font-mono text-xs text-green-400">
      <div className="text-green-400">$ npm run dev</div>
      <div className="text-blue-400">✓ Local: http://localhost:3000</div>
      <div className="text-green-400">✓ Ready in 2.1s</div>
      <div className="text-green-400">$ _</div>
    </div>
  </MobileAppTemplate>
);

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