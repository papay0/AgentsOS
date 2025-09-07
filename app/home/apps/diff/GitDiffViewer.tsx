'use client';

import React, { useState, useEffect } from 'react';
import { DiffFile } from '@git-diff-view/core';
import { DiffView, DiffModeEnum } from '@git-diff-view/react';
import '@git-diff-view/react/styles/diff-view.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Folder } from 'lucide-react';
import { useTheme } from 'next-themes';

interface GitDiffViewerProps {
  workspaceId?: string | null;
}

interface Repository {
  path: string;
  name: string;
}

export const GitDiffViewer: React.FC<GitDiffViewerProps> = ({ workspaceId }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');

  // Discover git repositories
  const fetchRepositories = async () => {
    if (!workspaceId) return;

    try {
      const response = await fetch(`/api/git/repositories?workspaceId=${workspaceId}`);
      const result = await response.json();

      if (result.success) {
        setRepositories(result.data.repositories);
        if (result.data.defaultPath && !selectedPath) {
          setSelectedPath(result.data.defaultPath);
        }
      }
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
    }
  };

  const fetchGitDiff = async () => {
    if (!workspaceId) {
      setError('No workspace selected');
      return;
    }

    if (!selectedPath) {
      setError('No repository path selected');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        workspaceId,
        mode: 'git',
        command: 'git diff HEAD',
        workingDir: selectedPath
      });
      
      const response = await fetch(`/api/git/diff?${params}`);
      const result = await response.json();

      if (result.success) {
        const diff = result.data.diff || '';
        
        // Parse the git diff into individual file diffs
        if (diff) {
          const files = parseGitDiff(diff);
          setDiffFiles(files);
        } else {
          setDiffFiles([]);
        }
      } else {
        setError(result.error || 'Failed to fetch diff');
      }
    } catch (err) {
      setError('Failed to fetch diff');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Parse git diff output into DiffFile instances
  const parseGitDiff = (diff: string): DiffFile[] => {
    const files: DiffFile[] = [];
    const fileSections = diff.split(/^diff --git/m).filter(Boolean);
    
    for (const section of fileSections) {
      const lines = section.split('\n');
      const fileMatch = lines[0]?.match(/a\/(.+?)\s+b\/(.+)/);
      
      if (fileMatch) {
        const fileName = fileMatch[2];
        const hunks: string[] = [];
        
        // Extract hunks from this file's diff
        let currentHunk = '';
        let inHunk = false;
        
        for (const line of lines) {
          if (line.startsWith('@@')) {
            if (currentHunk) {
              hunks.push(currentHunk);
            }
            currentHunk = line + '\n';
            inHunk = true;
          } else if (inHunk) {
            currentHunk += line + '\n';
          }
        }
        
        if (currentHunk) {
          hunks.push(currentHunk);
        }
        
        if (hunks.length > 0) {
          const file = new DiffFile(
            fileName,
            '',
            fileName,
            '',
            hunks,
            getFileLanguage(fileName),
            getFileLanguage(fileName)
          );
          
          file.initTheme(theme === 'dark' ? 'dark' : 'light');
          file.init();
          file.buildSplitDiffLines();
          file.buildUnifiedDiffLines();
          
          files.push(file);
        }
      }
    }
    
    return files;
  };

  const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop() || '';
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown'
    };
    return langMap[ext] || 'text';
  };

  useEffect(() => {
    if (workspaceId) {
      fetchRepositories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId && selectedPath) {
      fetchGitDiff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, selectedPath]);

  if (!workspaceId) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No workspace selected</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading diff...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchGitDiff}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with path selector and refresh button */}
      <div className="border-b px-4 py-2 flex items-center gap-3">
        <Folder className="h-4 w-4 text-muted-foreground" />
        
        <Select value={selectedPath} onValueChange={setSelectedPath}>
          <SelectTrigger className="flex-1 h-8 max-w-md">
            <SelectValue placeholder="Select repository path" />
          </SelectTrigger>
          <SelectContent>
            {repositories.map((repo) => (
              <SelectItem key={repo.path} value={repo.path}>
                {repo.name} ({repo.path})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchGitDiff}
          disabled={loading || !selectedPath}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        {diffFiles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No changes found
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {diffFiles.map((file, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b">
                  <span className="font-mono text-sm">{file.newFileName || file.oldFileName}</span>
                </div>
                <DiffView
                  diffFile={file}
                  diffViewMode={DiffModeEnum.Split}
                  diffViewWrap={false}
                  diffViewTheme={theme === 'dark' ? 'dark' : 'light'}
                  diffViewHighlight={true}
                  diffViewFontSize={12}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};