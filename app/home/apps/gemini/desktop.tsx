import TTYDTerminal from '@/components/ttyd-terminal';
import { GeminiAppProps } from '../BaseApp';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export const GeminiDesktop = ({ geminiPort, onFocus }: GeminiAppProps & { onFocus?: () => void }) => {
  const { getToken } = useAuth();
  const [wsUrl, setWsUrl] = useState('');
  const [authAttempt, setAuthAttempt] = useState(0);
  
  console.log('🚀 [GEMINI DESKTOP] Component initialized with props:', { geminiPort, onFocus: !!onFocus });
  
  // Build WebSocket URL with authentication token
  useEffect(() => {
    console.log('🔄 [GEMINI DESKTOP] useEffect triggered:', { geminiPort, authAttempt });
    
    if (!geminiPort) {
      console.warn('⚠️ [GEMINI DESKTOP] No geminiPort provided, clearing wsUrl');
      setWsUrl('');
      return;
    }

    const buildWsUrl = async () => {
      const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
      console.log('🌐 [GEMINI DESKTOP] Building WebSocket URL with:', { proxyUrl, geminiPort });
      
      try {
        console.log('🔑 [GEMINI DESKTOP] Attempting to get auth token...');
        const token = await getToken();
        
        if (token) {
          const finalWsUrl = `${proxyUrl}?port=${geminiPort}&token=${token}`;
          console.log('✅ [GEMINI DESKTOP] Auth token obtained, setting wsUrl:', finalWsUrl);
          setWsUrl(finalWsUrl);
        } else {
          console.error('❌ [GEMINI DESKTOP] No auth token available for Gemini connection');
          setWsUrl(''); // Clear URL to show error state
        }
      } catch (error) {
        console.error('❌ [GEMINI DESKTOP] Failed to get auth token for Gemini:', error);
        setWsUrl(''); // Clear URL to show error state
      }
    };

    buildWsUrl();
  }, [geminiPort, getToken, authAttempt]);
  
  // Handle connection failures and auth retries
  const handleConnectionFailure = () => {
    console.log('🔄 [GEMINI DESKTOP] Connection failed, retrying with fallback auth. Current attempt:', authAttempt);
    setAuthAttempt(prev => prev + 1);
  };

  console.log('🎨 [GEMINI DESKTOP] Rendering with state:', { geminiPort, wsUrl, authAttempt });

  // Component will handle connection changes via wsUrl updates
  return (
    <div className="w-full h-full">
      {geminiPort ? (
        <>
          <div className="hidden">
            {/* Debug info - will not be visible but shows in DOM for inspection */}
            Debug: port={geminiPort}, wsUrl={wsUrl}, attempt={authAttempt}
          </div>
          <TTYDTerminal 
            wsUrl={wsUrl} 
            className="w-full h-full"
            onFocus={onFocus}
            onConnectionFailure={handleConnectionFailure}
          />
        </>
      ) : (
        <div className="w-full h-full bg-gray-800 text-red-400 font-mono text-sm p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 mb-2">⚠️ Gemini Not Available</div>
            <div className="text-gray-400 text-xs">No Gemini port configured for this workspace</div>
          </div>
        </div>
      )}
    </div>
  );
};