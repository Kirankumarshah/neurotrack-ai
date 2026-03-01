"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu } from 'lucide-react';
import { RawEvent } from '@/hooks/useBehaviorTracker';

interface NeuralFeedProps {
    batch: { events: RawEvent[] } | null;
}

const NeuralFeed: React.FC<NeuralFeedProps> = ({ batch }) => {
    const [displayEvents, setDisplayEvents] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (batch?.events) {
            const newLines = batch.events.map(e => {
                const time = new Date(e.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const type = e.type === 'keydown' ? 'KEY' : 'MOV';
                const detail = e.key ? `[${e.key}]` : '';
                return `> ${time} [${type}] SYNCED ${detail}`;
            });

            setDisplayEvents(prev => [...prev, ...newLines].slice(-20));
        }
    }, [batch]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayEvents]);

    return (
        <div className="world-card h-full min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Neural Activity Feed
                </h3>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-400 p-4 bg-black/40 rounded-2xl border border-white/5 scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {displayEvents.map((line, i) => (
                        <motion.div
                            key={`${line}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="whitespace-nowrap"
                        >
                            <span className="text-cyan-800 mr-2">HEX_{Math.floor(Math.random() * 999)}</span>
                            {line}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {displayEvents.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <Cpu className="w-8 h-8 mb-2" />
                        <p>WAITING FOR NEURAL INPUT...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NeuralFeed;
