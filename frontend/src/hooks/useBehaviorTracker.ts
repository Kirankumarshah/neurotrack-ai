import { useState, useEffect, useRef } from 'react';

export interface BehavioralMetrics {
    typing_speed: number;
    typing_variance: number;
    error_rate: number;
    idle_time: number;
    reaction_delay: number;
}

export const useBehaviorTracker = (intervalMs: number = 10000) => {
    const [metrics, setMetrics] = useState<BehavioralMetrics>({
        typing_speed: 0,
        typing_variance: 0,
        error_rate: 0,
        idle_time: 0,
        reaction_delay: 0,
    });

    const stats = useRef({
        keyPresses: 0,
        backspaces: 0,
        intervals: [] as number[],
        lastKeyPressTime: 0,
        idleStartTime: 0,
        totalIdleTime: 0,
        reactionDelays: [] as number[],
    });

    useEffect(() => {
        const now = Date.now();
        stats.current.lastKeyPressTime = now;
        stats.current.idleStartTime = now;

        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();

            if (stats.current.lastKeyPressTime > 0) {
                const diff = currentTime - stats.current.lastKeyPressTime;
                if (diff < 2000) {
                    stats.current.intervals.push(diff);
                }
            }

            const idleDiff = currentTime - stats.current.idleStartTime;
            if (idleDiff > 3000) {
                stats.current.reactionDelays.push(idleDiff / 1000);
            }

            stats.current.keyPresses += 1;
            if (e.key === 'Backspace') {
                stats.current.backspaces += 1;
            }

            stats.current.lastKeyPressTime = currentTime;
            stats.current.idleStartTime = currentTime;
        };

        const handleMouseMove = () => {
            stats.current.idleStartTime = Date.now();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);

        const interval = setInterval(() => {
            const currentTime = Date.now();
            const currentIdle = currentTime - stats.current.idleStartTime;
            const effectiveIdle = stats.current.totalIdleTime + (currentIdle > 1000 ? currentIdle : 0);

            const charCount = stats.current.keyPresses;
            const wpm = (charCount / 5) / (intervalMs / 60000);

            const variance = stats.current.intervals.length > 1
                ? Math.sqrt(stats.current.intervals.reduce((a, b) => a + Math.pow(b - (stats.current.intervals.reduce((s, x) => s + x, 0) / stats.current.intervals.length), 2), 0) / stats.current.intervals.length)
                : 0;

            const errorRate = stats.current.keyPresses > 0
                ? stats.current.backspaces / stats.current.keyPresses
                : 0;

            const avgReaction = stats.current.reactionDelays.length > 0
                ? stats.current.reactionDelays.reduce((a, b) => a + b, 0) / stats.current.reactionDelays.length
                : 0.5;

            setMetrics({
                typing_speed: Math.round(wpm),
                typing_variance: Math.round(variance),
                error_rate: parseFloat(errorRate.toFixed(4)),
                idle_time: Math.round((effectiveIdle / intervalMs) * 100),
                reaction_delay: parseFloat(avgReaction.toFixed(2)),
            });

            stats.current.keyPresses = 0;
            stats.current.backspaces = 0;
            stats.current.intervals = [];
            stats.current.totalIdleTime = 0;
            stats.current.reactionDelays = [];

        }, intervalMs);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(interval);
        };
    }, [intervalMs]);

    return metrics;
};
