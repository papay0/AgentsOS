'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Iphone15Pro } from '@/components/ui/iphone-15-pro';
import { AgentsOSArchitecture } from './AgentsOSArchitecture';
import './AgentsOSArchitecture.css';

export function ShowcaseSection() {
  return (
    <section className="relative py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="text-gray-900 dark:text-white">
                A True Operating System
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Not just another cloud IDE. A complete development OS with native window management.
            </p>
          </motion.div>

          {/* Desktop View */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20"
          >
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10" />
              <Image
                src="/screenshots/desktop-workspace.png"
                alt="AgentsOS Desktop Interface"
                width={1400}
                height={788}
                className="w-full h-auto relative z-10"
                priority
              />
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
              Native desktop experience with draggable windows, dock, and integrated AI tools
            </p>
          </motion.div>

          {/* Mobile Views */}
          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="relative inline-block drop-shadow-2xl max-w-[300px]">
                <Iphone15Pro
                  className="size-full"
                  src="/screenshots/mobile-claude.png"
                />
              </div>
              <h4 className="text-xl font-semibold mt-8 mb-3 text-gray-900 dark:text-white">
                AI Terminal on Mobile
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Full Claude integration with native mobile experience
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="relative inline-block drop-shadow-2xl max-w-[300px]">
                <Iphone15Pro
                  className="size-full"
                  src="/screenshots/mobile-homescreen.png"
                />
              </div>
              <h4 className="text-xl font-semibold mt-8 mb-3 text-gray-900 dark:text-white">
                Multiple AI apps on mobile
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Claude Code, Terminal, and more
              </p>
            </motion.div>
            </div>

            {/* AgentsOS Architecture Centerpiece */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-center"
            >
              <div className="max-w-2xl mx-auto mb-8">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  Powered by AgentsOS
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  The central operating system connecting all your development tools
                </p>
              </div>
              
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-4xl h-48 md:h-64">
                  <AgentsOSArchitecture 
                    width="100%"
                    height="100%"
                    animateText={true}
                    animateLines={true}
                    animateMarkers={true}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
              
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}