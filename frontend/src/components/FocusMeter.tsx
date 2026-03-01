import React from "react";
import { motion } from "framer-motion";
import { Gauge, ShieldCheck } from "lucide-react";

interface FocusMeterProps {
  score: number;
  risk: string;
}

const FocusMeter: React.FC<FocusMeterProps> = ({ score, risk }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  const colors = {
    High: { primary: "#ef4444", secondary: "rgba(239, 68, 68, 0.1)", glow: "rgba(239, 68, 68, 0.4)" },
    Medium: { primary: "#f59e0b", secondary: "rgba(245, 158, 11, 0.1)", glow: "rgba(245, 158, 11, 0.4)" },
    Low: { primary: "#06b6d4", secondary: "rgba(6, 182, 212, 0.1)", glow: "rgba(6, 182, 212, 0.4)" },
  }[risk as 'High' | 'Medium' | 'Low'] || { primary: "#06b6d4", secondary: "rgba(6, 182, 212, 0.1)", glow: "rgba(6, 182, 212, 0.4)" };

  return (
    <div className="world-card group relative">
      <div
        className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000"
        style={{ backgroundColor: colors.secondary }}
      />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-1 leading-none">Cognitive Stability</h3>
          <p className="text-sm font-medium text-slate-300">Neural Sync Level</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <Gauge className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>

      <div className="relative flex items-center justify-center py-4">
        <svg className="h-72 w-72 -rotate-90" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Outer Ring */}
          <circle cx="110" cy="110" r="102" stroke="rgba(255,255,255,0.02)" strokeWidth="1" fill="none" />

          {/* Background Track */}
          <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="18" fill="none" />

          {/* Main Score Ring */}
          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth="18"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (normalizedScore / 100) * circumference }}
            transition={{ duration: 2, ease: "circOut" }}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 12px ${colors.glow})`,
            }}
          />
        </svg>

        <div className="absolute text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl font-black tracking-tighter text-white font-mono"
          >
            {Math.round(normalizedScore)}
          </motion.p>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">INDEX</p>
        </div>
      </div>

      <div className="mt-10 relative z-10 flex items-center justify-between p-5 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl grid place-items-center bg-white/5 border border-white/5">
            <ShieldCheck className="w-6 h-6" style={{ color: colors.primary }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Safety Status</p>
            <p className="text-lg font-bold tracking-tight text-white">
              {risk} Threshold
            </p>
          </div>
        </div>
        <div className="h-3 w-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)]" style={{ backgroundColor: colors.primary }} />
      </div>
    </div>
  );
};

export default FocusMeter;
