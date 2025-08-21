import TTYDTerminal from '@/components/ttyd-terminal';
import { TerminalAppProps } from '../BaseApp';

export const TerminalDesktop = ({ terminalPort }: TerminalAppProps) => {
  if (terminalPort) {
    // Use WebSocket proxy server with the specific terminal port
    const proxyUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROXY_URL || 'ws://localhost:3000';
    const wsUrl = `${proxyUrl}?port=${terminalPort}`;
    return <TTYDTerminal wsUrl={wsUrl} className="w-full h-full" />;
  }

  // Show error when no URL available
  return (
    <div className="w-full h-full bg-black text-red-400 font-mono text-sm p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 mb-2">⚠️ Terminal Not Available</div>
        <div className="text-gray-400 text-xs">No terminal URL configured for this workspace</div>
      </div>
    </div>
  );
};