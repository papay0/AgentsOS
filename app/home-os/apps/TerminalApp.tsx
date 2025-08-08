import { createApp } from './BaseApp';
import { Terminal } from 'lucide-react';
import { TerminalDesktop } from './terminal/desktop';
import { TerminalMobile } from './terminal/mobile';

export const TerminalApp = createApp<'terminal'>({
  metadata: {
    id: 'terminal',
    name: 'Terminal',
    description: 'Command line interface for system operations, development tasks, and file management',
    version: '1.0.0',
    author: 'AgentsOS',
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
    desktop: TerminalDesktop,
    mobile: TerminalMobile
  },
  actions: {
    onOpen: () => console.log('Terminal opened'),
    onClose: () => console.log('Terminal closed')
  }
});