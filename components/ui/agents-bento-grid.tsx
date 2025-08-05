"use client";

import { cn } from "@/lib/utils";
import { AgentsOSArchitecture } from "@/app/components/landing/AgentsOSArchitecture";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
    showArchitecture?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

function AgentsBentoGrid({ items }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        "group relative p-6 rounded-2xl overflow-hidden transition-all duration-300",
                        "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 backdrop-blur-sm",
                        "hover:shadow-xl dark:hover:shadow-2xl",
                        "hover:-translate-y-1 will-change-transform",
                        item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
                        {
                            "shadow-xl -translate-y-1":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    <div
                        className={`absolute inset-0 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
                    </div>

                    {/* AgentsOS Architecture for featured card */}
                    {item.showArchitecture && (
                        <div className="absolute top-6 right-6 w-32 h-16 opacity-40 dark:opacity-30">
                            <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                <svg width="32" height="16" viewBox="0 0 32 16" className="text-blue-600 dark:text-blue-400">
                                    <rect x="10" y="6" width="12" height="4" rx="1" fill="currentColor" opacity="0.8" />
                                    <text x="16" y="9" fontSize="3" fill="white" textAnchor="middle" fontWeight="bold">OS</text>
                                    <circle cx="4" cy="4" r="1" fill="currentColor" opacity="0.6">
                                        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="28" cy="4" r="1" fill="currentColor" opacity="0.6">
                                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="4" cy="12" r="1" fill="currentColor" opacity="0.6">
                                        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="28" cy="12" r="1" fill="currentColor" opacity="0.6">
                                        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                    <path d="M6 4 L10 6" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                                    <path d="M22 6 L26 4" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                                    <path d="M6 12 L10 10" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                                    <path d="M22 10 L26 12" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <div className="relative flex flex-col space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:from-indigo-100 group-hover:to-purple-100 dark:group-hover:from-indigo-900/50 dark:group-hover:to-purple-900/50 transition-all duration-300">
                                {item.icon}
                            </div>
                            {item.status && (
                                <span
                                    className={cn(
                                        "text-xs font-medium px-3 py-1.5 rounded-full",
                                        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                                        "transition-colors duration-300"
                                    )}
                                >
                                    {item.status}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xl mb-1">
                                    {item.title}
                                </h3>
                                {item.meta && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {item.meta}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {item.description}
                            </p>
                        </div>

                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {item.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div
                        className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-transparent via-gray-100/20 to-transparent dark:via-white/5 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    />
                </div>
            ))}
        </div>
    );
}

export { AgentsBentoGrid };