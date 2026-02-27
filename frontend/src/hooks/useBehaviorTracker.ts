import { useState, useEffect, useRef } from 'react';

export interface RawEvent {
    type: 'keydown' | 'mousemove';
    timestamp: number;
    key?: string;
}

export interface BehavioralBatch {
    events: RawEvent[];
    durationMs: number;
    startTime: number;
}

export const useBehaviorTracker = (intervalMs: number = 10000) => {
    const [batch, setBatch] = useState<BehavioralBatch | null>(null);
    const eventsRef = useRef<RawEvent[]>([]);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        startTimeRef.current = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            eventsRef.current.push({
                type: 'keydown',
                timestamp: Date.now(),
                key: e.key,
            });
        };

        let lastMouseMove = 0;
        const handleMouseMove = () => {
            const now = Date.now();
            if (now - lastMouseMove > 100) {
                eventsRef.current.push({
                    type: 'mousemove',
                    timestamp: now,
                });
                lastMouseMove = now;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);

        const interval = setInterval(() => {
            const now = Date.now();
            const currentEvents = [...eventsRef.current];
            eventsRef.current = [];

            const duration = now - startTimeRef.current;
            const startTime = startTimeRef.current;
            startTimeRef.current = now;

            if (currentEvents.length > 0) {
                setBatch({
                    events: currentEvents,
                    durationMs: duration,
                    startTime,
                });
            }
        }, intervalMs);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(interval);
        };
    }, [intervalMs]);

    return batch;
};
