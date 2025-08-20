import TTYDTerminal from '@/components/ttyd-terminal';
import { TerminalAppProps } from '../BaseApp';
import { useWorkspaceStore } from '@/app/home/stores/workspaceStore';

export const TerminalDesktop = ({ repositoryUrl }: TerminalAppProps) => {
  const { sandboxId } = useWorkspaceStore();

  if (sandboxId) {
    // Use our local proxy server - browser will send session cookies automatically
    const wsUrl = `ws://localhost:3000?workspaceId=${sandboxId}`;
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