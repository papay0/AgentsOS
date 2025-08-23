'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  workspaceId?: string;
  className?: string;
  theme?: 'light' | 'vs-dark';
  onFileChange?: (filePath: string, content: string) => void;
  onError?: (error: string) => void;
}

interface FileModel {
  path: string;
  model: monaco.editor.ITextModel;
  viewState?: monaco.editor.ICodeEditorViewState | null;
}

interface FileContent {
  path: string;
  content: string;
  lastModified: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  workspaceId,
  className = 'w-full h-full',
  theme = 'light',
  onFileChange,
  onError
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  // File management state
  const [models, setModels] = useState<Map<string, FileModel>>(new Map());
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get language from file extension
  const getLanguageFromPath = useCallback((filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'less': return 'less';
      case 'html': return 'html';
      case 'xml': return 'xml';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'cs': return 'csharp';
      case 'php': return 'php';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'sql': return 'sql';
      case 'sh': return 'shell';
      case 'yml': case 'yaml': return 'yaml';
      default: return 'plaintext';
    }
  }, []);

  // Load file content from API
  const loadFileContent = useCallback(async (filePath: string): Promise<FileContent | null> => {
    try {
      const params = new URLSearchParams({
        path: filePath,
        ...(workspaceId && { workspaceId })
      });
      
      const response = await fetch(`/api/files/content?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        onError?.(result.error || 'Failed to load file');
        return null;
      }
      
      return result.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to load file: ${message}`);
      return null;
    }
  }, [workspaceId, onError]);

  // Save file content to API
  const saveFileContent = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content,
          ...(workspaceId && { workspaceId })
        })
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onError?.(`Failed to save file: ${message}`);
      return false;
    }
  }, [workspaceId, onError]);

  // Create or get model for file
  const getOrCreateModel = useCallback(async (filePath: string): Promise<FileModel | null> => {
    const monaco = monacoRef.current;
    if (!monaco) return null;

    // Return existing model if available
    const existingModel = models.get(filePath);
    if (existingModel) {
      return existingModel;
    }

    // Load file content
    const fileContent = await loadFileContent(filePath);
    if (!fileContent) return null;

    // Create new model
    const uri = monaco.Uri.parse(`file://${filePath}`);
    const language = getLanguageFromPath(filePath);
    
    const model = monaco.editor.createModel(fileContent.content, language, uri);
    
    // Listen for content changes
    model.onDidChangeContent(() => {
      const content = model.getValue();
      onFileChange?.(filePath, content);
      
      // Auto-save after 2 seconds of inactivity
      const saveTimeout = setTimeout(() => {
        saveFileContent(filePath, content);
      }, 2000);

      // Clear previous timeout
      const modelWithTimeout = model as typeof model & { _saveTimeout?: NodeJS.Timeout };
      const prevTimeout = modelWithTimeout._saveTimeout;
      if (prevTimeout) clearTimeout(prevTimeout);
      modelWithTimeout._saveTimeout = saveTimeout;
    });

    const fileModel: FileModel = { path: filePath, model };
    
    setModels(prev => new Map(prev).set(filePath, fileModel));
    return fileModel;
  }, [models, loadFileContent, getLanguageFromPath, onFileChange, saveFileContent]);

  // Switch to different file
  const openFile = useCallback(async (filePath: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Save current editor state
    if (activeFilePath) {
      const currentModel = models.get(activeFilePath);
      if (currentModel) {
        currentModel.viewState = editor.saveViewState();
      }
    }

    // Get or create model for new file
    const fileModel = await getOrCreateModel(filePath);
    if (!fileModel) return;

    // Set new model
    editor.setModel(fileModel.model);
    
    // Restore view state
    if (fileModel.viewState) {
      editor.restoreViewState(fileModel.viewState);
    }

    setActiveFilePath(filePath);
  }, [activeFilePath, models, getOrCreateModel]);

  // Handle Cmd+Click to open file
  const setupDefinitionProvider = useCallback(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    // Custom definition provider for file navigation
    monaco.languages.registerDefinitionProvider('typescript', {
      provideDefinition: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return [];

        // Simple heuristic: if it looks like a file import
        const line = model.getLineContent(position.lineNumber);
        const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        
        if (importMatch) {
          const importPath = importMatch[1];
          let fullPath = importPath;
          
          // Handle relative imports
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const currentDir = activeFilePath.split('/').slice(0, -1).join('/');
            const segments = [...currentDir.split('/'), ...importPath.split('/')];
            const resolved: string[] = [];
            
            for (const segment of segments) {
              if (segment === '..') {
                resolved.pop();
              } else if (segment !== '.' && segment !== '') {
                resolved.push(segment);
              }
            }
            
            fullPath = '/' + resolved.join('/');
          }

          // Add common extensions if not present
          if (!fullPath.includes('.')) {
            const possiblePaths = [
              `${fullPath}.ts`,
              `${fullPath}.tsx`,
              `${fullPath}.js`,
              `${fullPath}.jsx`,
              `${fullPath}/index.ts`,
              `${fullPath}/index.tsx`
            ];
            
            // For demo, just pick the first one
            fullPath = possiblePaths[0];
          }

          return [{
            uri: monaco.Uri.parse(`file://${fullPath}`),
            range: new monaco.Range(1, 1, 1, 1)
          }];
        }

        return [];
      }
    });

    // Handle Ctrl/Cmd+Click
    monaco.editor.registerEditorOpener({
      openCodeEditor: (source, resource) => {
        const path = resource.path;
        openFile(path);
        return true;
      }
    });
  }, [activeFilePath, openFile]);

  // Monaco editor mount handler
  const handleEditorMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure TypeScript defaults
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      typeRoots: ['node_modules/@types']
    });

    // Enable all files for IntelliSense
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    // Setup definition provider for file navigation
    setupDefinitionProvider();

    // Load default file
    openFile('/src/App.tsx').then(() => {
      setIsLoading(false);
    });
  }, [openFile, setupDefinitionProvider]);

  // Load available models on mount for IntelliSense
  useEffect(() => {
    const loadAllModels = async () => {
      const paths = [
        '/src/App.tsx',
        '/src/components/Button.tsx',
        '/src/components/Input.tsx',
        '/src/utils/helpers.ts',
        '/src/index.ts',
        '/package.json'
      ];

      // Pre-load models for IntelliSense
      for (const path of paths) {
        await getOrCreateModel(path);
      }
    };

    if (monacoRef.current) {
      loadAllModels();
    }
  }, [getOrCreateModel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      models.forEach(({ model }) => {
        model.dispose();
      });
    };
  }, [models]);

  // Public API for external file opening
  useEffect(() => {
    // Expose openFile method to parent components
    const windowWithMonaco = window as typeof window & { monacoOpenFile?: typeof openFile };
    windowWithMonaco.monacoOpenFile = openFile;
    
    return () => {
      delete windowWithMonaco.monacoOpenFile;
    };
  }, [openFile]);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-background`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Monaco Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Editor
        height="100%"
        theme={theme === 'light' ? 'light' : 'vs-dark'}
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          folding: true,
          lineNumbers: 'on',
          renderWhitespace: 'boundary',
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: 'active',
            indentation: true
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          // Enable Cmd+Click for go to definition
          links: true,
          multiCursorModifier: 'ctrlCmd',
          definitionLinkOpensInPeek: false
        }}
      />
    </div>
  );
};

export default MonacoEditor;