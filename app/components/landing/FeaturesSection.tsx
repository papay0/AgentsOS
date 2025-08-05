'use client';

import { motion } from 'framer-motion';
import { Monitor, Brain, Layers, Smartphone, Terminal, GitBranch } from 'lucide-react';
import { AgentsBentoGrid, type BentoItem } from '@/components/ui/agents-bento-grid';
import './AgentsOSArchitecture.css';

const agentsOSFeatures: BentoItem[] = [
  {
    title: "Native Desktop",
    meta: "",
    description: "Windows, dock, apps. Like your local machine.",
    icon: <Monitor className="w-6 h-6 text-blue-600" />,
    status: "Live",
    tags: [],
    colSpan: 2,
    hasPersistentHover: true,
    showArchitecture: false,
  },
  {
    title: "Claude Code",
    meta: "",
    description: "AI terminal built-in.",
    icon: <Brain className="w-6 h-6 text-purple-600" />,
    status: "Ready",
    tags: [],
  },
  {
    title: "GitHub Setup",
    meta: "",
    description: "Connect repos, start coding. No config needed.",
    icon: <GitBranch className="w-6 h-6 text-green-600" />,
    tags: [],
    colSpan: 2,
  },
  {
    title: "Mobile Native",
    meta: "",
    description: "Full dev power on your phone.",
    icon: <Smartphone className="w-6 h-6 text-orange-600" />,
    status: "Beta",
    tags: [],
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-32">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">
              Development Reimagined
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience a native operating system designed for AI-powered development
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <AgentsBentoGrid items={agentsOSFeatures} />
        </motion.div>
      </div>
    </section>
  );
}