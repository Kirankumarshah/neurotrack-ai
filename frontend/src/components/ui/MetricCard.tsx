import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    unit: string;
    icon: LucideIcon;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, icon: Icon }) => {
    return (
        <div className="world-card p-6 flex flex-col justify-between group h-full">
            <div className="flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
                <Icon className="w-4 h-4" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">{value}</span>
                <span className="text-xs font-bold text-slate-600">{unit}</span>
            </div>
        </div>
    );
};
