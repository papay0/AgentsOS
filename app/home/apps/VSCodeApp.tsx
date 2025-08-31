import { createApp } from './BaseApp';
import { VSCodeDesktop } from './vscode/desktop';
import { VSCodeMobile } from './vscode/mobile';

export const VSCodeApp = createApp<'vscode'>({
  metadata: {
    id: 'vscode',
    name: 'VSCode',
    description: 'Visual Studio Code - Professional code editor with IntelliSense, debugging, and Git integration',
    version: '1.85.0',
    author: 'Microsoft',
    category: 'development',
    icon: {
      emoji: '💻',
      url: 'https://code.visualstudio.com/assets/images/code-stable-white.png',
      fallback: '💻'
    },
    colors: {
      primary: 'bg-blue-500',
      background: 'bg-gray-900',
      text: 'text-green-400'
    },
    isOpenAtStartup: false,  // Don't auto-open window on workspace load
    isFullyHidden: true       // Hidden while VSCode integration is broken in development
  },
  window: {
    defaultSize: { width: 1000, height: 700 },
    minSize: { width: 600, height: 400 },
    resizable: true,
    position: 'cascade'
  },
  content: {
    desktop: VSCodeDesktop,
    mobile: VSCodeMobile
  },
  actions: {
    onOpen: () => {},
    onClose: () => {}
  }
});