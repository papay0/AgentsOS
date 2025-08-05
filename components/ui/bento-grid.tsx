"use client";

import { cn } from "@/lib/utils";

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
}

interface BentoGridProps {
    items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
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

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-wrap gap-2">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                {item.cta || "Learn more →"}
                            </span>
                        </div>
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

export { BentoGrid };