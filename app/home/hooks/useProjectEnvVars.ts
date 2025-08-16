import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAgentsOSUser } from '../../../hooks/use-agentsos-user';
import type { UserWorkspace } from '@/types/workspace';

export function useProjectEnvVars() {
  const { user } = useUser();
  const { userProfile, workspace } = useAgentsOSUser();
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Extract available projects from user's workspace
  useEffect(() => {
    if (workspace?.repositories) {
      const projects = workspace.repositories
        .filter((repo: UserWorkspace['repositories'][0]) => repo.name && repo.name !== 'Default') // Filter out default repository
        .map((repo: UserWorkspace['repositories'][0]) => repo.name);
      
      setAvailableProjects(projects);
      
      // Auto-select first project if none selected
      if (projects.length > 0 && !selectedProject) {
        setSelectedProject(projects[0]);
      }
      
      // Clear selection if current project no longer exists
      if (selectedProject && !projects.includes(selectedProject)) {
        setSelectedProject(projects[0] || '');
      }
    } else {
      setAvailableProjects([]);
      setSelectedProject('');
    }
  }, [workspace, selectedProject]);

  return {
    availableProjects,
    selectedProject,
    setSelectedProject,
    hasProjects: availableProjects.length > 0,
    isReady: !!user && userProfile !== null // Ready when user is loaded and profile check is complete
  };
}