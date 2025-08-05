'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingElementProps {
  className?: string;
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}

function FloatingElement({ className, delay = 0, duration = 20, children }: FloatingElementProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -30, 0],
        x: [0, 20, 0],
      }}
      transition={{
        opacity: { duration: 1, delay },
        scale: { duration: 1, delay },
        y: { duration, repeat: Infinity, ease: "easeInOut", delay: delay + 1 },
        x: { duration: duration * 0.8, repeat: Infinity, ease: "easeInOut", delay: delay + 1 },
      }}
      className={cn("absolute", className)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5" />
      
      {/* Floating grid pattern */}
      <FloatingElement
        delay={0}
        duration={25}
        className="left-[10%] top-[20%]"
      >
        <div className="w-32 h-32 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-500/30">
            <defs>
              <pattern id="grid1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid1)" />
          </svg>
        </div>
      </FloatingElement>

      {/* Floating terminal window */}
      <FloatingElement
        delay={0.5}
        duration={22}
        className="right-[5%] top-[10%]"
      >
        <div className="w-48 h-32 bg-black/5 dark:bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
          <div className="flex gap-1.5 p-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
          <div className="px-3 pb-3 space-y-1">
            <div className="h-1 w-16 bg-blue-500/20 rounded" />
            <div className="h-1 w-20 bg-purple-500/20 rounded" />
            <div className="h-1 w-12 bg-green-500/20 rounded" />
          </div>
        </div>
      </FloatingElement>

      {/* Floating code block */}
      <FloatingElement
        delay={1}
        duration={28}
        className="left-[5%] bottom-[15%]"
      >
        <div className="font-mono text-xs text-gray-400 dark:text-white/20">
          <div>{'const os = new AgentsOS();'}</div>
          <div>{'await os.launch();'}</div>
          <div className="text-green-600 dark:text-green-500/30">{'// Ready to code'}</div>
        </div>
      </FloatingElement>

      {/* Floating dots pattern */}
      <FloatingElement
        delay={1.5}
        duration={30}
        className="right-[15%] bottom-[40%]"
      >
        <div className="grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </FloatingElement>

      {/* Floating hexagon */}
      <FloatingElement
        delay={2}
        duration={26}
        className="left-[20%] top-[25%]"
      >
        <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-20">
          <path
            d="M30 5 L50 17.5 L50 42.5 L30 55 L10 42.5 L10 17.5 Z"
            stroke="url(#hexGradient)"
            strokeWidth="1"
            fill="none"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      </FloatingElement>

      {/* Floating AI chip */}
      <FloatingElement
        delay={2.5}
        duration={24}
        className="right-[30%] bottom-[20%]"
      >
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg transform rotate-45" />
          <div className="absolute inset-2 bg-black/5 dark:bg-white/5 rounded transform rotate-45" />
          <div className="absolute inset-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-sm transform rotate-45" />
        </div>
      </FloatingElement>

      {/* Subtle mesh gradient overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,182,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(236,72,153,0.05)_0%,transparent_50%)]" />
      </div>
    </div>
  );
}