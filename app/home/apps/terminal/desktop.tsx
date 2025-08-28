import TTYDTerminal from '@/components/ttyd-terminal';
import { TerminalAppProps } from '../BaseApp';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export const TerminalDesktop = ({ terminalPort, onFocus }: TerminalAppProps & { onFocus?: () => void }) => {
  const { getToken } = useAuth();
  const [wsUrl, setWsUrl] = useState('');
  const [authAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Comprehensive terminalPort validation
  const validateTerminalPort = (port: unknown): { isValid: boolean; error?: string } => {
    if (!port) {
      return { isValid: false, error: 'terminalPort is undefined or null' };
    }
    
    if (typeof port === 'string' && port.trim() === '') {
      return { isValid: false, error: 'terminalPort is an empty string' };
    }
    
    const portNumber = Number(port);
    if (isNaN(portNumber)) {
      return { isValid: false, error: `terminalPort "${port}" is not a valid number` };
    }
    
    if (portNumber < 1 || portNumber > 65535) {
      return { isValid: false, error: `terminalPort ${portNumber} is outside valid range (1-65535)` };
    }
    
    return { isValid: true };
  };
  
  // Build WebSocket URL with authentication token
  useEffect(() => {
    console.log('🔍 Terminal desktop building URL:', { 
      terminalPort, 
      terminalPortType: typeof terminalPort,
      isValidPort: terminalPort && !isNaN(Number(terminalPort))
    });
    
    // Clear any previous errors
    setError(null);
    
    // Comprehensive port validation
    const portValidation = validateTerminalPort(terminalPort);
    if (!portValidation.isValid) {
      const errorMsg = `Terminal port validation failed: ${portValidation.error}`;
      console.error('❌', errorMsg);
      setError(errorMsg);
      setWsUrl('');
      return;
    }

    const buildWsUrl = async () => {
      const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
      
      // Validate proxy URL
      if (!proxyUrl || proxyUrl.trim() === '') {
        const errorMsg = 'WebSocket proxy URL is not configured (NEXT_PUBLIC_WEBSOCKET_PROXY_URL)';
        console.error('❌', errorMsg);
        setError(errorMsg);
        setWsUrl('');
        return;
      }
      
      try {
        const token = await getToken();
        if (!token || token.trim() === '') {
          const errorMsg = 'No authentication token available for terminal connection';
          console.error('❌', errorMsg);
          setError(errorMsg);
          setWsUrl('');
          return;
        }
        
        const finalUrl = `${proxyUrl}?port=${terminalPort}&token=${token}`;
        console.log('🔑 Terminal desktop built WebSocket URL:', finalUrl.substring(0, 100) + '...');
        
        // Validate the final URL
        try {
          new URL(finalUrl);
        } catch (urlError) {
          const errorMsg = `Invalid WebSocket URL constructed: ${finalUrl}`;
          console.error('❌', errorMsg, urlError);
          setError(errorMsg);
          setWsUrl('');
          return;
        }
        
        setWsUrl(finalUrl);
        console.log('✅ Terminal desktop: Valid WebSocket URL set successfully');
      } catch (tokenError) {
        const errorMsg = `Failed to get authentication token: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`;
        console.error('❌', errorMsg, tokenError);
        setError(errorMsg);
        setWsUrl('');
      }
    };

    buildWsUrl();
  }, [terminalPort, getToken, authAttempt]);
  
  // Component will handle connection changes via wsUrl updates
  return (
    <div className="w-full h-full">
      {error ? (
        <div className="w-full h-full bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-400 mb-3">❌ Terminal Connection Error</div>
            <div className="text-yellow-400 text-xs mb-4 bg-red-950 p-3 rounded border-l-4 border-red-400">
              {error}
            </div>
            <div className="text-gray-400 text-xs">
              Check the console for additional debugging information
            </div>
          </div>
        </div>
      ) : !terminalPort ? (
        <div className="w-full h-full bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
            <div className="text-gray-400 text-xs">No terminal port provided to this component</div>
          </div>
        </div>
      ) : !wsUrl ? (
        <div className="w-full h-full bg-black text-yellow-400 font-mono text-sm p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-yellow-400 mb-2">🔄 Connecting...</div>
            <div className="text-gray-400 text-xs">Building WebSocket connection to terminal</div>
          </div>
        </div>
      ) : (
        <TTYDTerminal 
          wsUrl={wsUrl} 
          className="w-full h-full"
          onFocus={onFocus}
        />
      )}
    </div>
  );
};