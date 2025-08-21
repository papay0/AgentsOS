import TTYDTerminal from '@/components/ttyd-terminal';
import { ClaudeAppProps } from '../BaseApp';

export const ClaudeDesktop = ({ claudePort }: ClaudeAppProps) => {
  
  // If we have a claude port, use the real Claude terminal
  if (claudePort) {
    // Use WebSocket proxy server with the specific claude port
    const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
    const wsUrl = `${proxyUrl}?port=${claudePort}`;
    return <TTYDTerminal wsUrl={wsUrl} className="w-full h-full" />;
  }

  // Show error when no port available
  return (
    <div className="w-full h-full bg-gray-800 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Claude Not Available</div>
        <div className="text-gray-400 text-xs">No Claude port configured for this workspace</div>
      </div>
    </div>
  );
};