import TTYDTerminal, { TTYDTerminalRef } from '@/components/ttyd-terminal';
import MobileTerminalPalette from '@/components/mobile-terminal-palette';
import { GeminiAppProps } from '../BaseApp';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export const GeminiMobile = ({ geminiPort }: GeminiAppProps) => {
  const terminalRef = useRef<TTYDTerminalRef>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { getToken } = useAuth();
  const [wsUrl, setWsUrl] = useState('');
  const [authAttempt, setAuthAttempt] = useState(0);
  
  console.log('🚀 [GEMINI MOBILE] Component initialized with props:', { geminiPort });
  
  // Build WebSocket URL with authentication token
  useEffect(() => {
    console.log('🔄 [GEMINI MOBILE] useEffect triggered:', { geminiPort, authAttempt });
    
    if (!geminiPort) {
      console.warn('⚠️ [GEMINI MOBILE] No geminiPort provided, clearing wsUrl');
      setWsUrl('');
      return;
    }

    const buildWsUrl = async () => {
      const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
      console.log('🌐 [GEMINI MOBILE] Building WebSocket URL with:', { proxyUrl, geminiPort });
      
      try {
        console.log('🔑 [GEMINI MOBILE] Attempting to get auth token...');
        const token = await getToken();
        
        if (token) {
          const finalWsUrl = `${proxyUrl}?port=${geminiPort}&token=${token}`;
          console.log('✅ [GEMINI MOBILE] Auth token obtained, setting wsUrl:', finalWsUrl);
          setWsUrl(finalWsUrl);
        } else {
          console.error('❌ [GEMINI MOBILE] No auth token available for Gemini connection');
          setWsUrl(''); // Clear URL to show error state
        }
      } catch (error) {
        console.error('❌ [GEMINI MOBILE] Failed to get auth token for Gemini:', error);
        setWsUrl(''); // Clear URL to show error state
      }
    };

    buildWsUrl();
  }, [geminiPort, getToken, authAttempt]);
  
  // Handle connection failures and auth retries
  const handleConnectionFailure = () => {
    console.log('🔄 [GEMINI MOBILE] Connection failed, retrying with fallback auth. Current attempt:', authAttempt);
    setAuthAttempt(prev => prev + 1);
  };
  
  console.log('🎨 [GEMINI MOBILE] Rendering with state:', { geminiPort, wsUrl, authAttempt, isConnected });
  
  // If we have a gemini port, use the real Gemini terminal
  if (geminiPort && wsUrl) {
    console.log('✅ [GEMINI MOBILE] Rendering TTYDTerminal with wsUrl:', wsUrl);
    return (
      <div className="absolute inset-0 flex flex-col">
        <TTYDTerminal 
          ref={terminalRef}
          wsUrl={wsUrl} 
          className="flex-1 w-full" 
          onConnectionChange={(connected) => {
            console.log('🔌 [GEMINI MOBILE] Connection change:', connected);
            setIsConnected(connected);
          }}
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
  console.warn('⚠️ [GEMINI MOBILE] Showing error state - no port or wsUrl available');
  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Gemini Not Available</div>
        <div className="text-gray-400 text-xs">No Gemini port configured for this workspace</div>
        <div className="text-xs mt-2 text-gray-500">Debug: port={geminiPort}, wsUrl={wsUrl}</div>
      </div>
    </div>
  );
};