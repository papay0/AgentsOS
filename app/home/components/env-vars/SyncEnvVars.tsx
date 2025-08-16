import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Zap } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';

interface SyncEnvVarsProps {
  projectName: string;
  hasVariables: boolean;
}

export function SyncEnvVars({ projectName, hasVariables }: SyncEnvVarsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    added?: string[];
    updated?: string[];
    preserved?: string[];
    conflicts?: Array<{
      key: string;
      localValue?: string;
      cloudValue?: string;
      resolution?: string;
    }>;
    fileExisted?: boolean;
    backupCreated?: boolean;
  } | null>(null);

  const activeWorkspace = useWorkspaceStore(state => state.getActiveWorkspace());
  const sandboxId = useWorkspaceStore(state => state.sandboxId);

  const handleSync = async () => {
    if (!sandboxId || !projectName || !hasVariables) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/env-vars/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: sandboxId,
          projectName,
          mode: 'smart',
          conflictResolution: 'prefer-local'
        })
      });

      const data = await response.json();

      if (data.success) {
        const summary = data.summary;
        
        // Smart sync succeeded
        let message = 'Successfully synced environment variables!';
        if (summary.fileExisted) {
          message = `Smart sync complete! Added: ${summary.added.length}, Updated: ${summary.updated.length}, Preserved: ${summary.preserved.length}`;
          if (summary.backupCreated) {
            message += ' (backup created)';
          }
        } else {
          message = `Created .env.local with ${summary.added.length} variables`;
        }
        
        setSyncResult({
          success: true,
          message,
          added: summary.added,
          updated: summary.updated,
          preserved: summary.preserved,
          conflicts: summary.conflicts,
          fileExisted: summary.fileExisted,
          backupCreated: summary.backupCreated
        });
      } else {
        const errorMessage = data.error || 'Failed to sync environment variables';
        setSyncResult({
          success: false,
          message: errorMessage
        });
        
        // Note: If smart sync fails, user will see the error message
      }
    } catch (error) {
      console.error('Error syncing environment variables:', error);
      setSyncResult({
        success: false,
        message: 'An error occurred while syncing'
      });
    } finally {
      setIsSyncing(false);
    }
  };


  // Don't show sync button if no workspace is active
  if (!sandboxId || !activeWorkspace) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p>Open a workspace to sync environment variables</p>
      </div>
    );
  }

  // Don't show sync button if no variables exist
  if (!hasVariables) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        🪄 Smart sync automatically creates .env.local in your workspace and preserves existing variables
      </p>

      {/* Sync Button */}
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Writing to Workspace...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Smart Sync to Workspace
          </>
        )}
      </button>

      {/* Sync Result */}
      {syncResult && (
        <div className={`p-3 rounded-lg ${
          syncResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start space-x-2">
            {syncResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                syncResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {syncResult.message}
              </p>
              
              {/* Show detailed results */}
              {syncResult.success && (
                <div className="mt-2 space-y-2 text-xs">
                  {syncResult.added && syncResult.added.length > 0 && (
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">✅ Added ({syncResult.added.length}):</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {syncResult.added.map(key => (
                          <span key={key} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300 font-mono">
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {syncResult.updated && syncResult.updated.length > 0 && (
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-300">🔄 Updated ({syncResult.updated.length}):</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {syncResult.updated.map(key => (
                          <span key={key} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300 font-mono">
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {syncResult.preserved && syncResult.preserved.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">💾 Preserved local ({syncResult.preserved.length}):</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {syncResult.preserved.map(key => (
                          <span key={key} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-mono">
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {syncResult.conflicts && syncResult.conflicts.length > 0 && (
                    <div>
                      <p className="font-medium text-orange-700 dark:text-orange-300">⚠️ Conflicts resolved ({syncResult.conflicts.length}):</p>
                      <div className="mt-1 space-y-1">
                        {syncResult.conflicts.map(conflict => (
                          <div key={conflict.key} className="text-xs bg-orange-50 dark:bg-orange-900/20 p-1 rounded">
                            <span className="font-mono">{conflict.key}</span>: Using {conflict.resolution} value
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* File location info */}
              {syncResult.success && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
                  📁 Check your project directory for <code className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">.env.local</code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}