import React from "react";
import { Gauge } from "lucide-react";

interface FocusMeterProps {
  score: number;
  risk: string;
}

const FocusMeter: React.FC<FocusMeterProps> = ({ score, risk }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const colors = {
    High: { primary: "#ef4444", secondary: "rgba(239, 68, 68, 0.15)", glow: "rgba(239, 68, 68, 0.3)" },
    Medium: { primary: "#f59e0b", secondary: "rgba(245, 158, 11, 0.15)", glow: "rgba(245, 158, 11, 0.3)" },
    Low: { primary: "#06b6d4", secondary: "rgba(6, 182, 212, 0.15)", glow: "rgba(6, 182, 212, 0.3)" },
  }[risk as 'High' | 'Medium' | 'Low'] || { primary: "#06b6d4", secondary: "rgba(6, 182, 212, 0.15)", glow: "rgba(6, 182, 212, 0.3)" };

  return (
    <aside className="glass-card rounded-3xl p-8 border border-white/5 bg-white/5 backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[80px]" style={{ backgroundColor: colors.secondary }} />

      <div className="flex items-center justify-between mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Neural Focus Index</p>
        <Gauge className="w-4 h-4 text-slate-600" />
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="h-64 w-64 -rotate-90" viewBox="0 0 220 220">
          {/* Background Track */}
          <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="16" fill="none" />

          {/* Main Score Ring */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            stroke={colors.primary}
            strokeWidth="16"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${colors.glow})`,
            }}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>

        <div className="absolute text-center bg-transparent">
          <p className="text-6xl font-black tracking-tighter text-white font-mono">{Math.round(normalizedScore)}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-1">Percentile</p>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Risk Profile</p>
            <p className="text-xl font-bold tracking-tight" style={{ color: colors.primary }}>
              {risk} Sensitivity
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl grid place-items-center bg-white/5">
            <div className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }} />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FocusMeter;
