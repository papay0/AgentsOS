'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Code, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from './AnimatedBackground';
import { trackButtonClick } from '@/lib/analytics';

interface HeroSectionProps {
  shouldShowWaitlist: boolean;
}

export function HeroSection({ shouldShowWaitlist }: HeroSectionProps) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    }),
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] mb-8 md:mb-12"
          >
            <span className="text-sm text-gray-600 dark:text-white/60 tracking-wide">
              Code Anywhere, Anytime
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                AgentsOS
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-16 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-4">
              Claude Code at your fingertips. Desktop or mobile. 
              No setup, just the tools you need to build with AI.
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {shouldShowWaitlist ? (
              <Button 
                size="lg" 
                className="px-10 py-6 text-lg bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 border-0 shadow-lg hover:shadow-xl transition-all text-white"
                onClick={() => document.getElementById('waitlist-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Join Waitlist
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Link href="/home-os" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full px-10 py-6 text-lg bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 border-0 shadow-lg hover:shadow-xl transition-all text-white"
                  onClick={() => trackButtonClick('launch_workspace', 'hero_section')}
                >
                  Launch AgentsOS
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              className="px-10 py-6 text-lg bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 backdrop-blur-sm" 
              asChild
            >
              <a 
                href="https://github.com/papay0/AgentsOS" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackButtonClick('view_source', 'hero_section')}
              >
                <Code className="mr-2 h-5 w-5" />
                View Source
              </a>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-[#030303] to-transparent pointer-events-none" />
    </section>
  );
}