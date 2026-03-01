import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusPillProps {
    icon: LucideIcon;
    label: string;
    tone: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ icon: Icon, label, tone }) => {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 py-2.5 px-5 text-xs font-bold text-slate-300">
            <div className="h-2 w-2 rounded-full relative">
                <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: tone }} />
                <div className="relative h-2 w-2 rounded-full" style={{ backgroundColor: tone }} />
            </div>
            <Icon className="h-4 w-4 opacity-50" />
            <span className="tracking-widest">{label}</span>
        </div>
    );
};
