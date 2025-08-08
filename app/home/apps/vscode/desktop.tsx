import { VSCodeEditor } from '@/app/home/components/ui/vscode-editor';
import { VSCodeAppProps } from '../BaseApp';

export const VSCodeDesktop = ({ repositoryUrl }: VSCodeAppProps) => {
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