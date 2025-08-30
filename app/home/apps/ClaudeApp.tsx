import { createApp } from './BaseApp';
import { ClaudeDesktop } from './claude/desktop';
import { ClaudeMobile } from './claude/mobile';

export const ClaudeApp = createApp<'claude'>({
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
    },
    isOpenAtStartup: true,   // Auto-open window on workspace load
    isFullyHidden: false      // Show in dock and UI
  },
  window: {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 500, height: 400 },
    resizable: true,
    position: 'cascade'
  },
  content: {
    desktop: ClaudeDesktop,
    mobile: ClaudeMobile
  },
  actions: {
    onOpen: () => {},
    onClose: () => {}
  }
});