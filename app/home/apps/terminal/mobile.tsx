import TTYDTerminal, { TTYDTerminalRef } from '@/components/ttyd-terminal';
import MobileTerminalPalette from '@/components/mobile-terminal-palette';
import { TerminalAppProps } from '../BaseApp';
import { useRef, useState } from 'react';

export const TerminalMobile = ({ terminalPort }: TerminalAppProps) => {
  const terminalRef = useRef<TTYDTerminalRef>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // If we have a terminal port, use the real terminal
  if (terminalPort) {
    // Use WebSocket proxy server with the specific terminal port
    const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
    const wsUrl = `${proxyUrl}?port=${terminalPort}`;
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
    <div className="w-full h-full bg-white dark:bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
        <div className="text-gray-400 text-xs">No terminal port configured for this workspace</div>
      </div>
    </div>
  );
};