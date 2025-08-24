import TTYDTerminal from '@/components/ttyd-terminal';
import { TerminalAppProps } from '../BaseApp';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export const TerminalDesktop = ({ terminalPort, onFocus }: TerminalAppProps & { onFocus?: () => void }) => {
  const { getToken } = useAuth();
  const [wsUrl, setWsUrl] = useState('');
  const [authAttempt, setAuthAttempt] = useState(0);
  
  // Build WebSocket URL with authentication token
  useEffect(() => {
    if (!terminalPort) {
      setWsUrl('');
      return;
    }

    const buildWsUrl = async () => {
      const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
      
      try {
        const token = await getToken();
        if (token) {
          console.log('🔑 Using URL token authentication for terminal');
          setWsUrl(`${proxyUrl}?port=${terminalPort}&token=${token}`);
        } else {
          console.error('❌ No auth token available for terminal connection');
          setWsUrl(''); // Clear URL to show error state
        }
      } catch (error) {
        console.error('❌ Failed to get auth token for terminal:', error);
        setWsUrl(''); // Clear URL to show error state
      }
    };

    buildWsUrl();
  }, [terminalPort, getToken, authAttempt]);
  
  // Use terminalPort as key to ensure each terminal gets its own component instance
  // This prevents connection reuse between different ports
  return (
    <div className="w-full h-full">
      {terminalPort ? (
        <TTYDTerminal 
          key={`terminal-${terminalPort}`} 
          wsUrl={wsUrl} 
          className="w-full h-full"
          onFocus={onFocus}
        />
      ) : (
        <div className="w-full h-full bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
            <div className="text-gray-400 text-xs">No terminal URL configured for this workspace</div>
          </div>
        </div>
      )}
    </div>
  );
};