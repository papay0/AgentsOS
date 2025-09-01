import { createApp } from './BaseApp';
import { GeminiDesktop } from './gemini/desktop';
import { GeminiMobile } from './gemini/mobile';

export const GeminiApp = createApp<'gemini'>({
  metadata: {
    id: 'gemini',
    name: 'Gemini AI',
    description: 'Google\'s AI-powered coding assistant with advanced code analysis and development support',
    version: '1.0.0',
    author: 'Google',
    category: 'development',
    icon: {
      emoji: '✨',
      url: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
      fallback: '✨'
    },
    colors: {
      primary: 'bg-blue-500',
      background: 'bg-white dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200'
    },
    isOpenAtStartup: false,   // Don't auto-open on workspace load
    isFullyHidden: false      // Show in dock and UI
  },
  window: {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 500, height: 400 },
    resizable: true,
    position: 'cascade'
  },
  content: {
    desktop: GeminiDesktop,
    mobile: GeminiMobile
  },
  actions: {
    onOpen: () => {},
    onClose: () => {}
  }
});