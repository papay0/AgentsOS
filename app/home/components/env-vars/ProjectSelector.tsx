import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface ProjectSelectorProps {
  projects: string[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
  className?: string;
}

export function ProjectSelector({
  projects,
  selectedProject,
  onProjectChange,
  className = ''
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectSelect = (project: string) => {
    onProjectChange(project);
    setIsOpen(false);
  };

  if (projects.length === 0) {
    return (
      <div className={`p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>No projects found.</strong> Create a workspace with repositories to manage environment variables.
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label htmlFor="project-selector" className="block text-sm font-medium mb-2">
        Project
      </label>
      <button
        id="project-selector"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <span className="truncate">
          {selectedProject || 'Select a project...'}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project}
              type="button"
              onClick={() => handleProjectSelect(project)}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                selectedProject === project
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="truncate">{project}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}