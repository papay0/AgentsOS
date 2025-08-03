import { createApp } from './BaseApp';
import MobileAppTemplate from './MobileAppTemplate';
import { VSCodeEditor } from '@/components/workspace/vscode-editor';

const VSCodeDesktopContent = (props?: { repositoryUrl?: string }) => {
  const { repositoryUrl } = props || {};
  // If we have a repository URL, use the real VSCode editor
  if (repositoryUrl) {
    return <VSCodeEditor key={repositoryUrl} url={repositoryUrl} className="w-full h-full" />;
  }

  // Show error when no URL available
  return (
    <div className="w-full h-full bg-gray-900 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ VSCode Not Available</div>
        <div className="text-gray-400 text-xs">No VSCode URL configured for this workspace</div>
      </div>
    </div>
  );
};

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