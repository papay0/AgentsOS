import TTYDTerminal from '@/components/ttyd-terminal';
import { TerminalAppProps } from '../BaseApp';

export const TerminalDesktop = ({ terminalPort, onFocus }: TerminalAppProps & { onFocus?: () => void }) => {
  // Always render a container to prevent component unmounting
  // The TTYDTerminal component will handle invalid/missing ports internally
  const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
  const wsUrl = terminalPort ? `${proxyUrl}?port=${terminalPort}` : '';
  
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