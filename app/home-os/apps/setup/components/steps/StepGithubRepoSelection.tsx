'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, GitBranch, Lock, Globe, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/app/home-os/stores/workspaceStore';

interface GitHubRepository {
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  language: string | null;
  updatedAt: string;
}

interface SetupData {
  githubRepos: {
    enabled: boolean | undefined;
    authenticated: boolean;
    repos: string[];
  };
}

interface StepProps {
  setupData: SetupData;
  updateSetupData: (data: Partial<SetupData>) => void;
  isMobile: boolean;
  onNext: () => void;
}

export function StepGithubRepoSelection({ setupData, updateSetupData, isMobile, onNext }: StepProps) {
  const { sandboxId } = useWorkspaceStore();
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(async () => {
    if (!sandboxId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/github/repositories/${sandboxId}`);
      const data = await response.json();
      
      if (data.success) {
        setRepositories(data.repositories);
        setFilteredRepos(data.repositories);
      } else {
        setError(data.error || 'Failed to fetch repositories');
      }
    } catch {
      setError('Failed to connect to GitHub');
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId]);

  useEffect(() => {
    if (sandboxId) {
      fetchRepositories();
    }
  }, [sandboxId, fetchRepositories]);

  useEffect(() => {
    const filtered = repositories.filter(repo => 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.language?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRepos(filtered);
  }, [searchQuery, repositories]);

  const toggleRepo = (repoName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoName) 
        ? prev.filter(r => r !== repoName)
        : [...prev, repoName]
    );
  };

  const handleContinue = () => {
    updateSetupData({
      githubRepos: {
        ...setupData.githubRepos,
        repos: selectedRepos
      }
    });
    onNext();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Repository List */}
      <div className={`space-y-2 ${isMobile ? 'max-h-96' : 'max-h-[400px]'} overflow-y-auto`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchRepositories}>
              Try Again
            </Button>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No repositories match your search' : 'No repositories found'}
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <div
              key={repo.fullName}
              className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedRepos.includes(repo.fullName) 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => toggleRepo(repo.fullName)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedRepos.includes(repo.fullName)}
                  onCheckedChange={() => {}}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="h-4 w-4 text-gray-500" />
                    <span className="font-medium truncate">{repo.name}</span>
                    {repo.isPrivate ? (
                      <Lock className="h-3 w-3 text-gray-400" />
                    ) : (
                      <Globe className="h-3 w-3 text-gray-400" />
                    )}
                    {repo.language && (
                      <Badge variant="secondary" className="text-xs">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Updated {formatDate(repo.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedRepos.length} {selectedRepos.length === 1 ? 'repository' : 'repositories'} selected
        </p>
        <Button 
          onClick={handleContinue}
          disabled={selectedRepos.length === 0}
        >
          Continue {selectedRepos.length > 0 && `(${selectedRepos.length})`}
        </Button>
      </div>
    </div>
  );
}