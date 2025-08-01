'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Terminal, Code, Smartphone, Star, Heart, Mail, Monitor, Phone } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Iphone15Pro } from '@/components/ui/iphone-15-pro';
import { trackButtonClick, trackPageView } from '@/lib/analytics';
import { addToWaitlist } from '@/lib/waitlist';
import { isDevelopment } from '@/lib/env';

export default function HomePage() {
  const [isDevMode] = useState(isDevelopment());
  const [showProdMode, setShowProdMode] = useState(false);
  const [email, setEmail] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Track landing page view on client side
  useEffect(() => {
    trackPageView('landing_page');
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addToWaitlist(email, 'landing_page', useCase);
      setIsSubmitted(true);
      trackButtonClick('waitlist_signup', 'landing_page');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Waitlist signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowWaitlist = !isDevMode || showProdMode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800">
      {/* Debug toggle - only show in dev mode */}
      {isDevMode && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setShowProdMode(!showProdMode)}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm border-2 shadow-lg"
          >
            {showProdMode ? 'Dev Mode' : 'Prod Mode'}
          </Button>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
              <Terminal className="relative h-20 w-20 mx-auto text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <Badge variant="secondary" className="mb-6 px-3 py-1">
            <Heart className="w-4 h-4 mr-2 text-red-500" />
            Open Source
          </Badge>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Vibe Code from Anywhere
          </h1>
          
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Claude Code + VSCode in your browser. 
            <br />
            <span className="text-blue-600 dark:text-blue-400 font-medium">Zero setup. Even works on your phone.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {shouldShowWaitlist ? (
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-10 py-4 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                onClick={() => document.getElementById('waitlist-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Join Waitlist
              </Button>
            ) : (
              <Link href="/home" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-10 py-4 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => trackButtonClick('launch_workspace', 'hero_section')}
                >
                  Launch Workspace
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto px-10 py-4 text-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800" 
              asChild
            >
              <a 
                href="https://github.com/papay0/agentspod" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackButtonClick('star_github', 'hero_section')}
              >
                <Star className="mr-2 h-5 w-5" />
                Star on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
              <Code className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Full VSCode</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete code editor with extensions. Just open your browser - no downloads.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
              <Terminal className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">AI Coding Assistant</h3>
            <p className="text-gray-600 dark:text-gray-400">
            Claude Code helps you code directly in the terminal. Ask questions, get suggestions.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
              <Smartphone className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Code on Your Phone</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Coffee shop? Beach? Commuting? Code from anywhere with just your phone or tablet.
            </p>
          </div>
        </div>

        {/* Screenshots Showcase */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 mb-16">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">No setup, just code</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            Your complete dev environment launches in seconds - on any device with a browser
          </p>
          
          {/* Desktop View */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Desktop Experience</h3>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
              <Image
                src="/screenshots/desktop-workspace.png"
                alt="AgentsPod Desktop - VSCode and Terminal side by side"
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
              />
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
              VSCode and AI terminal side-by-side - everything you need to build
            </p>
          </div>

          {/* Mobile Views */}
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Mobile Experience</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="relative inline-block drop-shadow-2xl max-w-[300px]">
                  <Iphone15Pro
                    className="size-full"
                    src="/screenshots/mobile-terminal.png"
                  />
                </div>
                <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-900 dark:text-white">Code from your couch</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Full terminal with AI assistant - actually works great on mobile
                </p>
              </div>
              
              <div className="text-center">
                <div className="relative inline-block drop-shadow-2xl max-w-[300px]">
                  <Iphone15Pro
                    className="size-full"
                    src="/screenshots/mobile-vscode.png"
                  />
                </div>
                <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-900 dark:text-white">Edit anywhere (if needed)</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Full VSCode editor on your phone - surprisingly usable
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 shadow-xl">
          <h2 className="text-3xl font-bold mb-4 text-white">Start your vibe coding journey</h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Free, open source, and works on your phone. No setup, no SSH keys, no downloads.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/home" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-10 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
                Get Started Now
              </Button>
            </Link>
            <Button size="lg" className="w-full sm:w-auto px-10 py-4 text-lg bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all" asChild>
              <a href="https://github.com/papay0/agentspod" target="_blank" rel="noopener noreferrer">
                <Terminal className="mr-2 h-5 w-5" />
                View Source Code
              </a>
            </Button>
          </div>
        </div>

        {/* Waitlist Section - only show in production mode */}
        {shouldShowWaitlist && (
          <div id="waitlist-section" className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 mb-16 mt-16">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Join the Waitlist</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Get notified when the hosted version of AgentsPod is ready for prime time!
              </p>

              {isSubmitted ? (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 border border-green-200 dark:border-green-800">
                  <Mail className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
                  <h3 className="text-2xl font-semibold text-green-900 dark:text-green-100 mb-3">
                    You&apos;re on the list! 🎉
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    Thanks for joining! I&apos;ll notify you as soon as AgentsPod is ready.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full h-14 text-lg"
                      required
                    />
                    <Input
                      type="text"
                      placeholder="How do you plan to use AgentsPod? (optional)"
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full h-14 text-lg"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full sm:w-auto px-12 py-4 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                  
                  {error && (
                    <p className="text-red-600 text-center">{error}</p>
                  )}
                  
                  <p className="text-gray-500 dark:text-gray-400">
                    Or <a href="https://github.com/papay0/agentspod" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700 dark:hover:text-blue-300">host it yourself</a> - it&apos;s completely open source!
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}