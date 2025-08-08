'use client';

import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Terminal } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export function Header() {  
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left side - Logo */}
        <SignedIn>
          <Link href="/home" className="flex items-center space-x-2">
            <Terminal className="h-6 w-6" />
            <span className="font-bold">AgentsOS</span>
          </Link>
        </SignedIn>
        <SignedOut>
          <div className="flex items-center space-x-2 cursor-default">
            <Terminal className="h-6 w-6" />
            <span className="font-bold">AgentsOS</span>
          </div>
        </SignedOut>
        
        {/* Right side - Navigation */}
        <div className="flex items-center space-x-2">
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