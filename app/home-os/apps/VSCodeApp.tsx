import { createApp } from './BaseApp';
import MobileAppTemplate from './MobileAppTemplate';

const VSCodeDesktopContent = () => (
  <div className="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4">
    <div className="text-blue-400 mb-2">{`// Welcome to VSCode`}</div>
    <div className="text-purple-400">import</div>
    <div className="ml-4 text-yellow-400">React</div>
    <div className="text-purple-400">from</div>
    <div className="ml-4 text-green-300">&apos;react&apos;;</div>
    <br />
    <div className="text-blue-400">const</div>
    <div className="ml-4 text-yellow-400">AgentsOS</div>
    <div className="text-purple-400">=</div>
    <div className="ml-4">() =&gt; &#123;</div>
    <div className="ml-8 text-blue-400">return</div>
    <div className="ml-12 text-green-300">&lt;div&gt;Welcome to AgentsOS!&lt;/div&gt;</div>
    <div className="ml-4">&#125;</div>
    <br />
    <div className="text-gray-500">{`// Start coding...`}</div>
    <div className="animate-pulse bg-green-400 w-2 h-4 inline-block"></div>
  </div>
);

const VSCodeMobileContent = () => (
  <MobileAppTemplate
    title="VSCode Mobile"
    subtitle="Code Editor"
    backgroundColor="bg-gray-900"
    bottomContent={
      <div className="animate-pulse bg-green-400 w-2 h-3 inline-block"></div>
    }
  >
    <div className="space-y-2 font-mono text-xs">
      <div className="text-yellow-400">{`// Mobile code editor`}</div>
      <div className="text-purple-400">const app = () =&gt; &#123;</div>
      <div className="ml-4 text-green-300">return &lt;div&gt;Hello World&lt;/div&gt;</div>
      <div className="text-purple-400">&#125;</div>
    </div>
  </MobileAppTemplate>
);

export const VSCodeApp = createApp({
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
    }
  },
  window: {
    defaultSize: { width: 1000, height: 700 },
    minSize: { width: 600, height: 400 },
    resizable: true,
    position: 'cascade'
  },
  content: {
    desktop: VSCodeDesktopContent,
    mobile: VSCodeMobileContent
  },
  actions: {
    onOpen: () => console.log('VSCode opened'),
    onClose: () => console.log('VSCode closed')
  }
});