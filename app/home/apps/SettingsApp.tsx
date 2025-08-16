import { User, Moon, Sun, Download, Monitor, ExternalLink, Image as ImageIcon, Key } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useTheme } from '@/components/theme-provider';
import { createApp } from './BaseApp';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ProjectSelector, EnvVarsList } from '../components/env-vars';
import { useProjectEnvVars } from '../hooks/useProjectEnvVars';

// Wallpapers
const wallpapers = [
  {
    id: 'wallpaper-1',
    name: 'Wallpaper 1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=120&fit=crop&crop=center&q=80'
  },
  {
    id: 'wallpaper-2',
    name: 'Wallpaper 2',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=120&fit=crop&crop=center&q=80'
  },
  {
    id: 'wallpaper-3',
    name: 'Wallpaper 3',
    url: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=200&h=120&fit=crop&crop=center&q=80'
  },
  {
    id: 'wallpaper-4',
    name: 'Wallpaper 4',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2560&h=1440&fit=crop&crop=center&q=80',
    thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=120&fit=crop&crop=center&q=80'
  }
];

const SettingsDesktopContent = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [selectedWallpaper, setSelectedWallpaper] = useState('wallpaper-1');
  const {
    availableProjects,
    selectedProject,
    setSelectedProject,
    isReady
  } = useProjectEnvVars();

  // Load wallpaper preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agentsos-wallpaper');
    if (saved) {
      setSelectedWallpaper(saved);
    } else {
      // Set default wallpaper on first load
      const defaultWallpaper = wallpapers.find(w => w.id === 'wallpaper-1');
      if (defaultWallpaper && typeof document !== 'undefined') {
        document.documentElement.style.setProperty(
          '--desktop-background', 
          `url("${defaultWallpaper.url}")`
        );
        localStorage.setItem('agentsos-wallpaper', 'wallpaper-1');
      }
    }
  }, []);

  // Apply wallpaper to desktop background
  useEffect(() => {
    const wallpaper = wallpapers.find(w => w.id === selectedWallpaper);
    if (wallpaper && typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--desktop-background', 
        `url("${wallpaper.url}")`
      );
      localStorage.setItem('agentsos-wallpaper', selectedWallpaper);
    }
  }, [selectedWallpaper]);

  const handleWallpaperChange = (wallpaperId: string) => {
    setSelectedWallpaper(wallpaperId);
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile
            </h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16">
                {user?.imageUrl ? (
                  <Image 
                    src={user.imageUrl} 
                    alt={user.fullName || 'User'} 
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full"
                    priority
                    unoptimized
                    draggable={false}
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium text-lg">
                  {user?.fullName || user?.firstName || 'User'}
                </div>
                <div className="text-gray-500 text-sm">
                  {user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'}
                </div>
                <div className="text-green-600 text-sm flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {user ? 'Logged in' : 'Guest'}
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Sun className="w-5 h-5 mr-2" />
                  <span>Light</span>
                </div>
                <button
                  onClick={() => setTheme('light')}
                  className={`w-4 h-4 rounded-full border-2 ${
                    theme === 'light' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Moon className="w-5 h-5 mr-2" />
                  <span>Dark</span>
                </div>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-4 h-4 rounded-full border-2 ${
                    theme === 'dark' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  <span>System</span>
                </div>
                <button
                  onClick={() => setTheme('system')}
                  className={`w-4 h-4 rounded-full border-2 ${
                    theme === 'system' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Desktop Wallpaper */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Desktop Wallpaper
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {wallpapers.map((wallpaper) => (
                <div key={wallpaper.id} className="relative">
                  <button
                    onClick={() => handleWallpaperChange(wallpaper.id)}
                    className={`relative w-full h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedWallpaper === wallpaper.id 
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <Image
                      src={wallpaper.thumb}
                      alt={wallpaper.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 200px"
                    />
                    {selectedWallpaper === wallpaper.id && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {wallpaper.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Environment Variables
            </h2>
            <div className="space-y-4">
              <ProjectSelector
                projects={availableProjects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />
              
              {isReady && (
                <EnvVarsList projectName={selectedProject} />
              )}
            </div>
          </div>

          {/* Installed Apps */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Installed Apps
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">VS</span>
                  </div>
                  <div>
                    <div className="font-medium">VSCode</div>
                    <div className="text-sm text-gray-500">v1.85.0</div>
                  </div>
                </div>
                <div className="text-green-600 text-sm">Active</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">C</span>
                  </div>
                  <div>
                    <div className="font-medium">Claude Code</div>
                    <div className="text-sm text-gray-500">v1.0.67</div>
                  </div>
                </div>
                <div className="text-green-600 text-sm">Active</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">T</span>
                  </div>
                  <div>
                    <div className="font-medium">Terminal</div>
                    <div className="text-sm text-gray-500">Built-in</div>
                  </div>
                </div>
                <div className="text-green-600 text-sm">Active</div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <div className="space-y-2 text-sm">
              <div><strong>AgentsOS:</strong> v1.0.0</div>
              <div><strong>Platform:</strong> Web</div>
              <div className="flex items-center">
                <span className="w-4 h-4 mr-2">🐙</span>
                <a href="#" className="text-blue-600 hover:underline">View on GitHub</a>
              </div>
            </div>
          </div>

          {/* OpenSource Credits */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              OpenSource Credits
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🔮</span>
                  </div>
                  <div>
                    <div className="font-medium">Liquid Glass Dock</div>
                    <div className="text-sm text-gray-500">Glass effect dock design</div>
                  </div>
                </div>
                <a 
                  href="https://21st.dev/suraj-xd/liquid-glass/default" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🖥️</span>
                  </div>
                  <div>
                    <div className="font-medium">CPU Architecture</div>
                    <div className="text-sm text-gray-500">Animated CPU design component</div>
                  </div>
                </div>
                <a 
                  href="https://21st.dev/svg-ui/cpu-architecture/default" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🎨</span>
                  </div>
                  <div>
                    <div className="font-medium">Bento Grid</div>
                    <div className="text-sm text-gray-500">Features grid layout component</div>
                  </div>
                </div>
                <a 
                  href="https://21st.dev/kokonutd/bento-grid/default" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Thank you!</strong> These amazing open source tools helped make AgentsOS beautiful and functional.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsMobileContent = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [selectedWallpaper, setSelectedWallpaper] = useState('wallpaper-1');
  const {
    availableProjects,
    selectedProject,
    setSelectedProject,
    isReady
  } = useProjectEnvVars();

  // Load wallpaper preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agentsos-wallpaper');
    if (saved) {
      setSelectedWallpaper(saved);
    } else {
      // Set default wallpaper on first load
      const defaultWallpaper = wallpapers.find(w => w.id === 'wallpaper-1');
      if (defaultWallpaper && typeof document !== 'undefined') {
        document.documentElement.style.setProperty(
          '--desktop-background', 
          `url("${defaultWallpaper.url}")`
        );
        localStorage.setItem('agentsos-wallpaper', 'wallpaper-1');
      }
    }
  }, []);

  // Apply wallpaper to desktop background
  useEffect(() => {
    const wallpaper = wallpapers.find(w => w.id === selectedWallpaper);
    if (wallpaper && typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--desktop-background', 
        `url("${wallpaper.url}")`
      );
      localStorage.setItem('agentsos-wallpaper', selectedWallpaper);
    }
  }, [selectedWallpaper]);

  const handleWallpaperChange = (wallpaperId: string) => {
    setSelectedWallpaper(wallpaperId);
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Profile Section */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12">
              {user?.imageUrl ? (
                <Image 
                  src={user.imageUrl} 
                  alt={user.fullName || 'User'} 
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                  priority
                  unoptimized
                  draggable={false}
                />
              ) : (
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{user?.fullName || user?.firstName || 'User'}</div>
              <div className="text-sm text-gray-500">{user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'}</div>
            </div>
          </div>
          <div className="text-green-600 text-sm flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {user ? 'Logged in' : 'Guest'}
          </div>
        </div>

        {/* Quick Settings */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3">Appearance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Sun className="w-4 h-4 mr-2" />
                <span className="text-sm">Light</span>
              </div>
              <button
                onClick={() => setTheme('light')}
                className={`w-4 h-4 rounded-full border-2 ${
                  theme === 'light' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Moon className="w-4 h-4 mr-2" />
                <span className="text-sm">Dark</span>
              </div>
              <button
                onClick={() => setTheme('dark')}
                className={`w-4 h-4 rounded-full border-2 ${
                  theme === 'dark' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Monitor className="w-4 h-4 mr-2" />
                <span className="text-sm">System</span>
              </div>
              <button
                onClick={() => setTheme('system')}
                className={`w-4 h-4 rounded-full border-2 ${
                  theme === 'system' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Desktop Wallpaper */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" />
            Desktop Wallpaper
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {wallpapers.map((wallpaper) => (
              <div key={wallpaper.id} className="relative">
                <button
                  onClick={() => handleWallpaperChange(wallpaper.id)}
                  className={`relative w-full h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedWallpaper === wallpaper.id 
                      ? 'border-blue-500 ring-1 ring-blue-200 dark:ring-blue-800' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <Image
                    src={wallpaper.thumb}
                    alt={wallpaper.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 150px, 200px"
                  />
                  {selectedWallpaper === wallpaper.id && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
                <div className="mt-1">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {wallpaper.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center">
            <Key className="w-4 h-4 mr-2" />
            Environment Variables
          </h3>
          <div className="space-y-3">
            <ProjectSelector
              projects={availableProjects}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
            />
            
            {isReady && (
              <EnvVarsList projectName={selectedProject} />
            )}
          </div>
        </div>

        {/* Apps */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Apps
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs">VS</span>
                </div>
                <span className="text-sm">VSCode</span>
              </div>
              <span className="text-xs text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-purple-500 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs">C</span>
                </div>
                <span className="text-sm">Claude</span>
              </div>
              <span className="text-xs text-green-600">Active</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3">About</h3>
          <div className="space-y-1 text-sm">
            <div>AgentsOS v1.0.0</div>
            <div className="text-gray-500">Web Platform</div>
          </div>
        </div>

        {/* OpenSource Credits */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center">
            <ExternalLink className="w-4 h-4 mr-2" />
            OpenSource Credits
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs">🔮</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Liquid Glass Dock</div>
                  <div className="text-xs text-gray-500">Glass effect design</div>
                </div>
              </div>
              <a 
                href="https://21st.dev/suraj-xd/liquid-glass/default" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs">🖥️</span>
                </div>
                <div>
                  <div className="text-sm font-medium">CPU Architecture</div>
                  <div className="text-xs text-gray-500">Animated component</div>
                </div>
              </div>
              <a 
                href="https://21st.dev/svg-ui/cpu-architecture/default" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs">🎨</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Bento Grid</div>
                  <div className="text-xs text-gray-500">Features layout</div>
                </div>
              </div>
              <a 
                href="https://21st.dev/kokonutd/bento-grid/default" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Thank you!</strong> These tools helped make AgentsOS beautiful.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsApp = createApp<'settings'>({
  metadata: {
    id: 'settings',
    name: 'Settings',
    description: 'Application settings, user profile management, and system configuration options',
    version: '1.0.0',
    author: 'AgentsOS',
    category: 'system',
    icon: {
      emoji: '⚙️',
      fallback: '⚙️'
    },
    colors: {
      primary: 'bg-gray-500',
      background: 'bg-white dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200'
    }
  },
  window: {
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    position: 'center'
  },
  content: {
    desktop: SettingsDesktopContent,
    mobile: SettingsMobileContent
  },
  actions: {
    onOpen: () => {},
    onClose: () => {}
  }
});