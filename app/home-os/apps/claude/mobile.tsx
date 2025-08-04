import TTYDTerminal from '@/components/ttyd-terminal';
import { ClaudeAppProps } from '../BaseApp';

export const ClaudeMobile = ({ repositoryUrl }: ClaudeAppProps) => {
  
  // If we have a repository URL, use the real Claude terminal
  if (repositoryUrl) {
    // Convert HTTP URL to WebSocket URL for ttyd
    const wsUrl = repositoryUrl.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws';
    return (
      <div className="absolute inset-0 bg-gray-800 flex flex-col">
        <TTYDTerminal wsUrl={wsUrl} className="flex-1 w-full" />
      </div>
    );
  }

  // Show error when no URL available  
  return (
    <div className="w-full h-full bg-gray-800 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Claude Not Available</div>
        <div className="text-gray-400 text-xs">No Claude URL configured for this workspace</div>
      </div>
    </div>
  );
};