"use client";

import { cn } from "../../lib/utils";
import {
    CheckCircle,
    Clock,
    Star,
    TrendingUp,
    Video,
    Globe,
} from "lucide-react";

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
    onClick?: () => void;
    className?: string;
}

interface BentoGridProps {
    items: BentoItem[];
    className?: string;
}

function BentoGrid({ items, className }: BentoGridProps) {
    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 w-full", className)}>
            {items.map((item, index) => (
                <div
                    key={index}
                    onClick={item.onClick}
                    className={cn(
                        "group relative p-5 rounded-2xl overflow-hidden transition-all duration-300",
                        item.onClick ? "cursor-pointer" : "",
                        "border border-[#424754]/50 bg-[#1b1b1d]",
                        "hover:shadow-[0_4px_20px_rgba(255,109,41,0.08)]",
                        "hover:-translate-y-1 will-change-transform",
                        item.colSpan || "col-span-1",
                        item.colSpan === 2 ? "sm:col-span-2" : "",
                        {
                            "shadow-[0_4px_20px_rgba(255,109,41,0.05)] -translate-y-0.5 border-[#FF6D29]/50":
                                item.hasPersistentHover,
                        },
                        item.className
                    )}
                >
                    <div
                        className={`absolute inset-0 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-300`}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:4px_4px]" />
                    </div>

                    <div className="relative flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/20 group-hover:bg-gradient-to-br group-hover:from-black/30 group-hover:to-black/10 border border-[#424754]/30 transition-all duration-300">
                                {item.icon}
                            </div>
                            {item.status && (
                                <span
                                    className={cn(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm uppercase tracking-wider",
                                        "bg-black/20 text-gray-400 border border-[#424754]/30",
                                        "transition-colors duration-300 group-hover:bg-black/30 group-hover:text-gray-300"
                                    )}
                                >
                                    {item.status}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-white tracking-tight text-base font-heading">
                                {item.title}
                                {item.meta && (
                                    <span className="ml-2 text-xs text-gray-500 font-normal">
                                        {item.meta}
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed font-sans">
                                {item.description}
                            </p>
                        </div>

                        {item.tags && item.tags.length > 0 && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#424754]/30">
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    {item.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 rounded-md bg-black/20 backdrop-blur-sm transition-all duration-200 hover:bg-black/30"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        className={`absolute inset-0 -z-10 rounded-2xl p-px bg-gradient-to-br from-transparent via-white/5 to-transparent ${
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

export { BentoGrid }
