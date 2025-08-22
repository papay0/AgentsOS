import TTYDTerminal from '@/components/ttyd-terminal';
import { ClaudeAppProps } from '../BaseApp';

export const ClaudeDesktop = ({ claudePort }: ClaudeAppProps) => {
  // Always render a container to prevent component unmounting
  // The TTYDTerminal component will handle invalid/missing ports internally
  const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
  const wsUrl = claudePort ? `${proxyUrl}?port=${claudePort}` : '';
  
  // Use claudePort as key to ensure each Claude terminal gets its own component instance
  // This prevents connection reuse between different ports
  return (
    <div className="w-full h-full">
      {claudePort ? (
        <TTYDTerminal 
          key={`claude-${claudePort}`} 
          wsUrl={wsUrl} 
          className="w-full h-full" 
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