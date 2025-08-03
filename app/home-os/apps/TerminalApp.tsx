import { createApp } from './BaseApp';

const TerminalDesktopContent = () => (
  <div className="w-full h-full bg-black text-green-400 font-mono text-sm p-4">
    <div className="text-green-400">$ npm run dev</div>
    <div className="text-blue-400">✓ Local: http://localhost:3000</div>
    <div className="text-green-400">✓ Ready in 2.1s</div>
    <br />
    <div className="text-green-400">$ git status</div>
    <div className="text-white">On branch main</div>
    <div className="text-white">Your branch is up to date with &apos;origin/main&apos;.</div>
    <br />
    <div className="text-green-400">$ _</div>
    <div className="animate-pulse bg-green-400 w-2 h-4 inline-block ml-1"></div>
  </div>
);

const TerminalMobileContent = () => (
  <div className="w-full h-full bg-black text-green-400 font-mono text-xs p-3">
    <div className="text-center mb-4">
      <div className="text-green-400 text-lg">Terminal</div>
      <div className="text-gray-500 text-sm">Command Line Interface</div>
    </div>
    <div className="space-y-1">
      <div className="text-green-400">$ npm run dev</div>
      <div className="text-blue-400">✓ Local: http://localhost:3000</div>
      <div className="text-green-400">✓ Ready in 2.1s</div>
      <div className="text-green-400">$ _</div>
    </div>
    <div className="mt-4 text-center">
      <div className="animate-pulse bg-green-400 w-2 h-3 inline-block"></div>
    </div>
  </div>
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
      emoji: '⚡',
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