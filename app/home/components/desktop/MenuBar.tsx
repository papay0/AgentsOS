'use client';

import { Clock, Sun, Moon, Monitor } from 'lucide-react';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkspaceSwitcher } from '../ui/workspace-switcher';
import { WorkspaceHealth } from '../ui/workspace-health';

// Custom theme toggle for the menubar with proper colors
function MenuBarThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-white/10 transition-colors text-white">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-white/20">
        <DropdownMenuItem onClick={() => setTheme('light')} className="text-white hover:bg-white/10">
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="text-white hover:bg-white/10">
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="text-white hover:bg-white/10">
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MenuBar() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTimeAndDate = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      setCurrentDate(now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }));
    };

    updateTimeAndDate();
    const interval = setInterval(updateTimeAndDate, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-8 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 text-white text-sm z-50">
      {/* Left side - User avatar + AgentsOS */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {/* User avatar */}
          <SignedIn>
            <div className="flex items-center scale-75">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonPopoverCard: "bg-black/90 backdrop-blur-xl border-white/20",
                    userButtonPopoverActionButton: "text-white hover:bg-white/10",
                    userButtonPopoverActionButtonText: "text-white",
                    userButtonPopoverActionButtonIcon: "text-white",
                    userButtonPopoverFooter: "hidden"
                  }
                }}
              />
            </div>
          </SignedIn>
          <span className="font-semibold">AgentsOS</span>
        </div>
      </div>

      {/* Center - Workspace switcher and health */}
      <div className="flex-1 flex justify-center items-center gap-2">
        <div className="bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
          <WorkspaceSwitcher />
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
          <WorkspaceHealth />
        </div>
      </div>

      {/* Right side - System status */}
      <div className="flex items-center space-x-3">
        {/* Theme switcher */}
        <MenuBarThemeToggle />

        {/* Date and time */}
        <div className="flex items-center space-x-2">
          <span className="text-xs">{currentDate}</span>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">{currentTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}