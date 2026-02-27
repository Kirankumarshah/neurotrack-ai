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
    High: { primary: "#f43f5e", halo: "rgba(244, 63, 94, 0.2)", label: "Critical" },
    Medium: { primary: "#f59e0b", halo: "rgba(245, 158, 11, 0.2)", label: "Elevated" },
    Low: { primary: "#34d399", halo: "rgba(52, 211, 153, 0.2)", label: "Controlled" },
  }[risk as "High" | "Medium" | "Low"] || { primary: "#34d399", halo: "rgba(52, 211, 153, 0.2)", label: "Controlled" };

  return (
    <aside className="glass-card relative overflow-hidden rounded-3xl p-7 md:p-8">
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full blur-[80px]" style={{ backgroundColor: colors.halo }} />

      <div className="mb-6 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">Focus Index</p>
        <Gauge className="h-4 w-4 text-slate-500" />
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="h-64 w-64 -rotate-90" viewBox="0 0 220 220" aria-label="Focus score ring">
          <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.07)" strokeWidth="16" fill="none" />
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
            className="transition-all duration-1000 ease-in-out"
            style={{ filter: `drop-shadow(0 0 12px ${colors.halo})` }}
          />
        </svg>

        <div className="absolute text-center">
          <p className="font-mono text-6xl font-black tracking-tighter text-white">{Math.round(normalizedScore)}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-slate-400">focus score</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Burnout Risk</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-semibold" style={{ color: colors.primary }}>
            {risk} • {colors.label}
          </p>
          <span className="sparkline-dot h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.primary, color: colors.primary }} />
        </div>
      </div>
    </aside>
  );
};

export default FocusMeter;
