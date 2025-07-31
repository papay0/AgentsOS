'use client';

import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Terminal, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  sandboxId?: string;
}

export function Header({ sandboxId }: HeaderProps) {
  const pathname = usePathname();
  
  // Extract sandboxId from URL if not provided as prop
  const currentSandboxId = sandboxId || (pathname?.match(/\/home\/([^\/]+)/)?.[1]);
  
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/home" className="flex items-center space-x-2">
            <Terminal className="h-6 w-6" />
            <span className="font-bold">AgentsPod</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
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
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}