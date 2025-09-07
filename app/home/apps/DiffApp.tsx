import { createApp } from './BaseApp';
import { DiffDesktop } from './diff/desktop';
import { DiffMobile } from './diff/mobile';

export const DiffApp = createApp<'diff'>({
  metadata: {
    id: 'diff',
    name: 'Code Diff',
    description: 'Professional visual diff tool for comparing code changes, files, and commits with syntax highlighting',
    version: '0.1.0',
    author: 'AgentsOS',
    category: 'development',
    icon: {
      emoji: '📊',
      fallback: '📊'
    },
    colors: {
      primary: 'bg-orange-500',
      background: 'bg-white dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200'
    },
    isOpenAtStartup: false,  // Don't auto-open window on workspace load
    isFullyHidden: false      // Show in dock and UI
  },
  window: {
    defaultSize: { width: 1200, height: 800 },
    minSize: { width: 800, height: 500 },
    resizable: true,
    position: 'center'
  },
  content: {
    desktop: DiffDesktop,
    mobile: DiffMobile
  },
  actions: {
    onOpen: () => {}
  }
});