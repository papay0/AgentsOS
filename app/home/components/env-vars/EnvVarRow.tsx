import { Eye, EyeOff, Trash2, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isNew?: boolean;
  isModified?: boolean;
}

export interface EnvVarRowProps {
  envVar: EnvironmentVariable;
  onUpdate: (id: string, key: string, value: string) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
  onStartEdit?: (id: string) => void;
  onCancelEdit?: () => void;
}

export function EnvVarRow({
  envVar,
  onUpdate,
  onDelete,
  isEditing = false,
  onStartEdit,
  onCancelEdit
}: EnvVarRowProps) {
  const [showValue, setShowValue] = useState(false);
  const [localKey, setLocalKey] = useState(envVar.key);
  const [localValue, setLocalValue] = useState(envVar.value);
  const [keyError, setKeyError] = useState('');

  // Reset local state when envVar changes
  useEffect(() => {
    setLocalKey(envVar.key);
    setLocalValue(envVar.value);
  }, [envVar.key, envVar.value]);

  const validateKey = (key: string): string => {
    if (!key.trim()) return 'Key is required';
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      return 'Key must start with a letter or underscore and contain only letters, numbers, and underscores';
    }
    if (key.length > 100) return 'Key too long (max 100 characters)';
    return '';
  };

  const handleKeyChange = (newKey: string) => {
    setLocalKey(newKey);
    setKeyError(validateKey(newKey));
  };

  const handleSave = () => {
    const error = validateKey(localKey);
    if (error) {
      setKeyError(error);
      return;
    }
    
    onUpdate(envVar.id, localKey.trim(), localValue);
    onCancelEdit?.();
  };

  const handleCancel = () => {
    setLocalKey(envVar.key);
    setLocalValue(envVar.value);
    setKeyError('');
    onCancelEdit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !keyError) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const isValueEmpty = !envVar.value.trim();
  const displayValue = showValue 
    ? envVar.value || '(empty)' 
    : '•'.repeat(Math.min(envVar.value.length, 12)) || '(empty)';

  if (isEditing) {
    return (
      <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key
            </label>
            <input
              type="text"
              value={localKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. API_KEY"
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                keyError 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}
              autoFocus
            />
            {keyError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{keyError}</p>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value
            </label>
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter value..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!!keyError || !localKey.trim()}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
      envVar.isNew || envVar.isModified 
        ? 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <code className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 truncate">
                {envVar.key}
              </code>
              {(envVar.isNew || envVar.isModified) && (
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                  {envVar.isNew ? 'New' : 'Modified'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <code className={`text-xs font-mono truncate ${
                isValueEmpty 
                  ? 'text-gray-400 dark:text-gray-500 italic' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {displayValue}
              </code>
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={showValue ? 'Hide value' : 'Show value'}
              >
                {showValue ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onStartEdit?.(envVar.id)}
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Edit"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(envVar.id)}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}