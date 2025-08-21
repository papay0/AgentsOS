import TTYDTerminal, { TTYDTerminalRef } from '@/components/ttyd-terminal';
import MobileTerminalPalette from '@/components/mobile-terminal-palette';
import { ClaudeAppProps } from '../BaseApp';
import { useRef, useState } from 'react';

export const ClaudeMobile = ({ claudePort }: ClaudeAppProps) => {
  const terminalRef = useRef<TTYDTerminalRef>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // If we have a claude port, use the real Claude terminal
  if (claudePort) {
    // Use WebSocket proxy server with the specific claude port
    const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
    const wsUrl = `${proxyUrl}?port=${claudePort}`;
    return (
      <div className="absolute inset-0 flex flex-col">
        <TTYDTerminal 
          ref={terminalRef}
          wsUrl={wsUrl} 
          className="flex-1 w-full" 
          onConnectionChange={setIsConnected}
        />
        <MobileTerminalPalette
          terminalRef={terminalRef}
          isConnected={isConnected}
          className="flex-none"
        />
      </div>
    );
  }

  // Show error when no port available  
  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Claude Not Available</div>
        <div className="text-gray-400 text-xs">No Claude port configured for this workspace</div>
      </div>
    </div>
  );
};