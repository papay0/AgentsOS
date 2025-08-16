import { Plus, Save, Loader2, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EnvVarRow, type EnvironmentVariable } from './EnvVarRow';

export interface EnvVarsListProps {
  projectName: string;
  onLoad?: (loading: boolean) => void;
  onSave?: (saving: boolean) => void;
  onVariablesChange?: (hasVariables: boolean) => void;
}

export function EnvVarsList({ projectName, onLoad, onSave, onVariablesChange }: EnvVarsListProps) {
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState('');

  // Load environment variables when project changes
  useEffect(() => {
    if (projectName) {
      loadEnvVars();
    } else {
      setEnvVars([]);
      setHasUnsavedChanges(false);
    }
  }, [projectName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of loading state
  useEffect(() => {
    onLoad?.(isLoading);
  }, [isLoading, onLoad]);

  // Notify parent of saving state
  useEffect(() => {
    onSave?.(isSaving);
  }, [isSaving, onSave]);

  // Notify parent when variables change
  useEffect(() => {
    const hasVars = envVars.length > 0 && envVars.some(v => v.key.trim() !== '');
    onVariablesChange?.(hasVars);
  }, [envVars, onVariablesChange]);

  const loadEnvVars = async () => {
    if (!projectName) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/env-vars/${encodeURIComponent(projectName)}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load environment variables');
      }
      
      // Convert object to array format
      const envVarsArray: EnvironmentVariable[] = Object.entries(data.envVars || {}).map(([key, value]) => ({
        id: key,
        key,
        value: value as string,
        isNew: false,
        isModified: false
      }));
      
      setEnvVars(envVarsArray);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading environment variables:', error);
      setError(error instanceof Error ? error.message : 'Failed to load environment variables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    const newId = `new-${Date.now()}`;
    const newEnvVar: EnvironmentVariable = {
      id: newId,
      key: '',
      value: '',
      isNew: true,
      isModified: false
    };
    
    setEnvVars(prev => [...prev, newEnvVar]);
    setEditingId(newId);
    setHasUnsavedChanges(true);
  };

  const handleUpdate = (id: string, key: string, value: string) => {
    setEnvVars(prev => prev.map(envVar => {
      if (envVar.id === id) {
        const isKeyChanged = envVar.key !== key;
        const isValueChanged = envVar.value !== value;
        const wasNew = envVar.isNew;
        
        return {
          ...envVar,
          key,
          value,
          isModified: !wasNew && (isKeyChanged || isValueChanged)
        };
      }
      return envVar;
    }));
    
    setHasUnsavedChanges(true);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const envVar = envVars.find(ev => ev.id === id);
    if (!envVar) return;

    if (envVar.isNew) {
      // Remove immediately if it's a new unsaved variable
      setEnvVars(prev => prev.filter(ev => ev.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    } else {
      // For existing variables, remove from list and mark for deletion
      setEnvVars(prev => prev.filter(ev => ev.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  const handleSave = async () => {
    if (!projectName || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      // Prepare environment variables for saving
      const envVarsToSave = envVars
        .filter(envVar => envVar.key.trim()) // Only include variables with keys
        .map(envVar => ({
          key: envVar.key.trim(),
          value: envVar.value
        }));

      // Delete removed variables first
      const originalKeys = new Set(envVars.filter(ev => !ev.isNew).map(ev => ev.key));
      const currentKeys = new Set(envVarsToSave.map(ev => ev.key));
      const deletedKeys = Array.from(originalKeys).filter(key => !currentKeys.has(key));

      for (const key of deletedKeys) {
        await fetch(`/api/env-vars/${encodeURIComponent(projectName)}/${encodeURIComponent(key)}`, {
          method: 'DELETE'
        });
      }

      // Save current variables
      const response = await fetch(`/api/env-vars/${encodeURIComponent(projectName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ envVars: envVarsToSave })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save environment variables');
      }

      // Reload to get the latest state
      await loadEnvVars();
      
    } catch (error) {
      console.error('Error saving environment variables:', error);
      setError(error instanceof Error ? error.message : 'Failed to save environment variables');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    
    // Remove any unsaved new variables
    setEnvVars(prev => prev.filter(envVar => !(envVar.isNew && envVar.key === '' && envVar.value === '')));
  };

  if (!projectName) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Select a project to manage environment variables</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          <span className="ml-2 text-sm text-gray-500">Loading environment variables...</span>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {envVars.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No environment variables yet</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Variable
                </button>
              </div>
            ) : (
              <>
                {envVars.map(envVar => (
                  <EnvVarRow
                    key={envVar.id}
                    envVar={envVar}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    isEditing={editingId === envVar.id}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                  />
                ))}
              </>
            )}
          </div>

          {envVars.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleAddNew}
                disabled={editingId !== null}
                className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another
              </button>
              
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || editingId !== null}
                  className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}