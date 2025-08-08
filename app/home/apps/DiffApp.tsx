import { createApp } from './BaseApp';

const DiffDesktopContent = () => (
  <div className="w-full h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="text-8xl mb-6">📊</div>
      <div className="text-3xl font-bold mb-4">Code Diff</div>
      <div className="text-xl text-gray-500 dark:text-gray-400 mb-6">Coming Soon!</div>
      
      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-left">
        <div className="text-lg font-semibold mb-3">Features in Development:</div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Side-by-side file comparison
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Syntax highlighting
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Git integration
          </li>
          <li className="flex items-center">
            <span className="text-yellow-500 mr-2">⏳</span>
            Inline editing
          </li>
          <li className="flex items-center">
            <span className="text-yellow-500 mr-2">⏳</span>
            Merge conflict resolution
          </li>
        </ul>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        Visual diff tool for comparing code changes across files and commits
      </div>
    </div>
  </div>
);

const DiffMobileContent = () => (
  <div className="w-full h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="text-6xl mb-4">📊</div>
      <div className="text-2xl font-bold mb-3">Code Diff</div>
      <div className="text-lg text-gray-500 dark:text-gray-400 mb-4">Coming Soon!</div>
      
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-sm text-left space-y-2">
          <div className="font-medium mb-2">Features:</div>
          <div className="flex items-center text-xs">
            <span className="text-green-500 mr-2">✓</span>
            File comparison
          </div>
          <div className="flex items-center text-xs">
            <span className="text-green-500 mr-2">✓</span>
            Git integration
          </div>
          <div className="flex items-center text-xs">
            <span className="text-yellow-500 mr-2">⏳</span>
            Mobile editing
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Professional diff tool for developers
      </div>
    </div>
  </div>
);

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
    comingSoon: true
  },
  window: {
    defaultSize: { width: 1000, height: 700 },
    minSize: { width: 600, height: 400 },
    resizable: true,
    position: 'center'
  },
  content: {
    desktop: DiffDesktopContent,
    mobile: DiffMobileContent
  },
  actions: {
    onOpen: () => {}
  }
});