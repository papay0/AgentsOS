import { createApp } from '../BaseApp';
import { SetupDesktop } from './desktop';
import { SetupMobile } from './mobile';

export const SetupApp = createApp<'setup'>({
  metadata: {
    id: 'setup',
    name: 'Setup',
    description: 'Multi-step workspace setup and configuration wizard',
    version: '1.0.0',
    author: 'AgentsOS',
    category: 'system',
    icon: {
      emoji: '🚀',
      fallback: '🚀'
    },
    colors: {
      primary: 'bg-blue-500',
      background: 'bg-white dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200'
    }
  },
  window: {
    defaultSize: { width: 1200, height: 800 },
    minSize: { width: 800, height: 600 },
    resizable: true,
    position: 'center'
  },
  content: {
    desktop: SetupDesktop,
    mobile: SetupMobile
  },
  actions: {
    onOpen: () => console.log('Setup wizard opened'),
    onClose: () => console.log('Setup wizard closed')
  }
});