import TTYDTerminal, { TTYDTerminalRef } from '@/components/ttyd-terminal';
import MobileTerminalPalette from '@/components/mobile-terminal-palette';
import { ClaudeAppProps } from '../BaseApp';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export const ClaudeMobile = ({ claudePort }: ClaudeAppProps) => {
  const terminalRef = useRef<TTYDTerminalRef>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { getToken } = useAuth();
  const [wsUrl, setWsUrl] = useState('');
  const [authAttempt, setAuthAttempt] = useState(0);
  
  // Build WebSocket URL with authentication token
  useEffect(() => {
    if (!claudePort) {
      setWsUrl('');
      return;
    }

    const buildWsUrl = async () => {
      const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
      
      try {
        const token = await getToken();
        if (token) {
          console.log('🔑 Using URL token authentication for Claude');
          setWsUrl(`${proxyUrl}?port=${claudePort}&token=${token}`);
        } else {
          console.error('❌ No auth token available for Claude connection');
          setWsUrl(''); // Clear URL to show error state
        }
      } catch (error) {
        console.error('❌ Failed to get auth token for Claude:', error);
        setWsUrl(''); // Clear URL to show error state
      }
    };

    buildWsUrl();
  }, [claudePort, getToken, authAttempt]);
  
  // Handle connection failures and auth retries
  const handleConnectionFailure = () => {
    console.log('🔄 Connection failed, retrying with fallback auth (Claude mobile)');
    setAuthAttempt(prev => prev + 1);
  };
  
  // If we have a claude port, use the real Claude terminal
  if (claudePort && wsUrl) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <TTYDTerminal 
          ref={terminalRef}
          wsUrl={wsUrl} 
          className="flex-1 w-full" 
          onConnectionChange={setIsConnected}
          onConnectionFailure={handleConnectionFailure}
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