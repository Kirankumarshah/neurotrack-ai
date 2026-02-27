import React from "react";

interface FocusMeterProps {
  score: number;
  risk: string;
}

const FocusMeter: React.FC<FocusMeterProps> = ({ score, risk }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const tone =
    risk === "High" ? "var(--danger)" : risk === "Medium" ? "var(--warning)" : "var(--success)";

  return (
    <aside className="glass-card rounded-2xl p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Focus Score</p>
      <div className="relative mt-4 flex items-center justify-center">
        <svg className="h-56 w-56 -rotate-90" viewBox="0 0 220 220" aria-label="Focus score meter">
          <circle cx="110" cy="110" r={radius} stroke="rgba(148,163,184,0.22)" strokeWidth="12" fill="none" />
          <circle
            cx="110"
            cy="110"
            r={radius}
            stroke={tone}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute text-center">
          <p className="text-5xl font-semibold tracking-tight">{Math.round(normalizedScore)}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">out of 100</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/35 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Burnout Risk</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
          <p className="text-lg font-medium" style={{ color: tone }}>
            {risk}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default FocusMeter;
