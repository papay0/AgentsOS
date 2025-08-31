import TTYDTerminal from '@/components/ttyd-terminal';
import { ClaudeAppProps } from '../BaseApp';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export const ClaudeDesktop = ({ claudePort, onFocus }: ClaudeAppProps & { onFocus?: () => void }) => {
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
          console.log('🔑 Using URL token authentication for Claude (desktop)');
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
    console.log('🔄 Connection failed, retrying with fallback auth (Claude desktop)');
    setAuthAttempt(prev => prev + 1);
  };

  // Component will handle connection changes via wsUrl updates
  return (
    <div className="w-full h-full">
      {claudePort ? (
        <TTYDTerminal 
          wsUrl={wsUrl} 
          className="w-full h-full"
          onFocus={onFocus}
          onConnectionFailure={handleConnectionFailure}
        />
      ) : (
        <div className="w-full h-full bg-gray-800 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 mb-2">⚠️ Claude Not Available</div>
            <div className="text-gray-400 text-xs">No Claude port configured for this workspace</div>
          </div>
        </div>
      )}
    </div>
  );
};