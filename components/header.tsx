'use client';

import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Terminal, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SignedIn,
  UserButton,
} from '@clerk/nextjs';

interface HeaderProps {
  sandboxId?: string;
}

export function Header({ sandboxId }: HeaderProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  
  // Extract sandboxId from URL if not provided as prop
  const currentSandboxId = sandboxId || (pathname?.match(/\/home\/workspace\/([^\/]+)/)?.[1]);
  
  // Hide header on mobile workspace pages
  const isWorkspacePage = pathname?.includes('/home/workspace/');
  if (isMobile && isWorkspacePage) {
    return null;
  }
  
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left side - Logo */}
        <Link href="/home" className="flex items-center space-x-2">
          <Terminal className="h-6 w-6" />
          <span className="font-bold">AgentsPod</span>
        </Link>
        
        {/* Right side - Navigation */}
        <div className="flex items-center space-x-2">
          {/* Show Open App button only on sandbox pages */}
          {currentSandboxId && pathname?.includes('/home/') && (
            <Button
              onClick={() => {
                const appUrl = `https://3000-${currentSandboxId}.proxy.daytona.work/`;
                window.open(appUrl, '_blank', 'width=1200,height=800');
              }}
              size="sm"
              variant="outline"
              className="text-sm"
            >
              <Globe className="h-4 w-4 mr-2" />
              Open App
            </Button>
          )}
          
          {/* Auth buttons */}
          <SignedIn>
            <UserButton />
          </SignedIn>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}