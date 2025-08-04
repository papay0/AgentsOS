import TTYDTerminal from '@/components/ttyd-terminal';
import { TerminalAppProps } from '../BaseApp';

export const TerminalDesktop = ({ repositoryUrl }: TerminalAppProps) => {
  
  // If we have a repository URL, use the real terminal
  if (repositoryUrl) {
    // Convert HTTP URL to WebSocket URL for ttyd
    const wsUrl = repositoryUrl.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '') + '/ws';
    return <TTYDTerminal key={repositoryUrl} wsUrl={wsUrl} className="w-full h-full" />;
  }

  // Show error when no URL available
  return (
    <div className="w-full h-full bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
        <div className="text-gray-400 text-xs">No terminal URL configured for this workspace</div>
      </div>
    </div>
  );
};