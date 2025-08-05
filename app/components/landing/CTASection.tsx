'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CTASectionProps {
  shouldShowWaitlist: boolean;
}

export function CTASection({ shouldShowWaitlist }: CTASectionProps) {
  return (
    <section className="relative py-32">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-rose-500/20 to-violet-500/20 blur-3xl" />
            <div className="relative bg-gray-50 dark:bg-white/[0.02] backdrop-blur-sm rounded-3xl p-12 md:p-16 border border-gray-200 dark:border-white/[0.08]">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                  Start Building
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
                Your development OS is ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {shouldShowWaitlist ? (
                  <Button 
                    size="lg" 
                    className="px-10 py-6 text-lg bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 border-0 shadow-lg hover:shadow-xl transition-all text-white"
                    onClick={() => document.getElementById('waitlist-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Join the Waitlist
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Link href="/home-os" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full px-10 py-6 text-lg bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 border-0 shadow-lg hover:shadow-xl transition-all text-white"
                    >
                      Launch AgentsOS
                      <Zap className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Button 
                  size="lg" 
                  className="px-10 py-6 text-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 backdrop-blur-sm" 
                  asChild
                >
                  <a href="https://github.com/papay0/AgentsOS" target="_blank" rel="noopener noreferrer">
                    <Code className="mr-2 h-5 w-5" />
                    View Source
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}