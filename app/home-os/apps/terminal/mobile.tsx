import TTYDTerminal from '@/components/ttyd-terminal';
import { TerminalAppProps } from '../BaseApp';

export const TerminalMobile = ({ repositoryUrl }: TerminalAppProps) => {
  
  // If we have a repository URL, use the real terminal
  if (repositoryUrl) {
    // Convert HTTP URL to WebSocket URL for ttyd
    const wsUrl = repositoryUrl.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws';
    return (
      <div className="absolute inset-0 flex flex-col">
        <TTYDTerminal wsUrl={wsUrl} className="flex-1 w-full" />
      </div>
    );
  }

  // Show error when no URL available
  return (
    <div className="w-full h-full bg-white dark:bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
        <div className="text-gray-400 text-xs">No terminal URL configured for this workspace</div>
      </div>
    </div>
  );
};