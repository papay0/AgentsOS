import { User, Moon, Sun, Download, Monitor } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useTheme } from '@/components/theme-provider';
import { createApp } from './BaseApp';
import Image from 'next/image';

const SettingsDesktopContent = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

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
              <div><strong>AgentsPod:</strong> v1.0.0</div>
              <div><strong>Platform:</strong> Web</div>
              <div className="flex items-center">
                <span className="w-4 h-4 mr-2">🐙</span>
                <a href="#" className="text-blue-600 hover:underline">View on GitHub</a>
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
            <div>AgentsPod v1.0.0</div>
            <div className="text-gray-500">Web Platform</div>
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
    author: 'AgentsPod',
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
    onOpen: () => console.log('Settings opened'),
    onClose: () => console.log('Settings closed')
  }
});