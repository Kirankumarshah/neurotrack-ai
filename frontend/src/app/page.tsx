"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  Brain,
  Gauge,
  Sparkles,
  Wifi,
  WifiOff,
  TrendingDown,
  TrendingUp,
  Minus,
  Clock,
  Zap,
} from "lucide-react";
import { useBehaviorTracker } from "@/hooks/useBehaviorTracker";
import FocusMeter from "@/components/FocusMeter";
import FocusChart from "@/components/FocusChart";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AnalysisResponse = {
  fatigue_probability: number;
  focus_score: number;
  burnout_risk_level: "Low" | "Medium" | "High";
  burnout_trend: "Improving" | "Declining" | "Stable";
  recommendation: string;
  metrics: {
    typing_speed: number;
    error_rate: number;
    idle_time: number;
    reaction_delay: number;
  };
};

export default function Dashboard() {
  const batch = useBehaviorTracker(10000);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; score: number }>>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--");

  useEffect(() => {
    if (!batch) return;

    const sendData = async () => {
      try {
        const response = await axios.post<AnalysisResponse>(`${BACKEND_URL}/analyze`, batch, {
          timeout: 5000,
        });

        setIsOnline(true);
        setAnalysis(response.data);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastUpdated(timeStr);

        setHistory((prev) => [...prev, { time: timeStr, score: response.data.focus_score }].slice(-15));
      } catch (error) {
        setIsOnline(false);
      }
    };

    void sendData();
  }, [batch]);

  const riskTone = useMemo(() => {
    const risk = analysis?.burnout_risk_level ?? "Low";
    if (risk === "High") return "var(--danger)";
    if (risk === "Medium") return "var(--warning)";
    return "var(--success)";
  }, [analysis]);

  return (
    <main className="dashboard-shell min-h-screen px-4 py-8 md:px-8 bg-[#0a0c10] text-slate-200">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="glass-card rounded-2xl p-6 border border-white/5 bg-white/5 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="brand-orb grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">NeuroTrack AI</h1>
                <p className="mt-1 text-sm text-slate-400 font-medium">Experimental Cognitive Load Analysis</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <StatusPill
                icon={isOnline ? Wifi : WifiOff}
                label={isOnline ? "Live Stream" : "Disconnected"}
                tone={isOnline ? "#10b981" : "#ef4444"}
              />
              <StatusPill
                icon={Activity}
                label={`Trend: ${analysis?.burnout_trend ?? "Analyzing"}`}
                tone={analysis?.burnout_trend === "Declining" ? "#ef4444" : "#06b6d4"}
              />
              <div className="text-xs font-mono text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/5">
                Last Sync: {lastUpdated}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <div className="space-y-6">
            <FocusMeter score={analysis?.focus_score ?? 100} risk={analysis?.burnout_risk_level ?? "Low"} />

            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-white/5 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Predictive Timeline
              </h3>
              <div className="space-y-4">
                <TimelineStep
                  time="Current"
                  label="Baseline established"
                  status="complete"
                />
                <TimelineStep
                  time="+30m"
                  label={analysis?.burnout_trend === "Declining" ? "High fatigue risk" : "Maintain current pace"}
                  status={analysis?.burnout_trend === "Declining" ? "warning" : "pending"}
                />
                <TimelineStep
                  time="+1h"
                  label="Recommended rest window"
                  status="pending"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-white/5 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-32 h-32" />
              </div>

              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                Live Cognitive Insights
              </h2>
              <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-2xl">
                {analysis?.recommendation ??
                  "Analyzing behavioral patterns. Focus score will calibrate after the next 10-second data window."}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard
                  label="Typing Velocity"
                  value={`${analysis?.metrics.typing_speed ?? 0}`}
                  unit="WPM"
                  icon={TrendingUp}
                />
                <MetricCard
                  label="Error Density"
                  value={`${((analysis?.metrics.error_rate ?? 0) * 100).toFixed(1)}`}
                  unit="%"
                  icon={AlertTriangle}
                />
                <MetricCard
                  label="Idle Gap"
                  value={`${analysis?.metrics.idle_time ?? 0}`}
                  unit="%"
                  icon={Minus}
                />
                <MetricCard
                  label="Neural Delay"
                  value={`${analysis?.metrics.reaction_delay ?? 0}`}
                  unit="s"
                  icon={Activity}
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-white/5 backdrop-blur-xl">
              <FocusChart data={history} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, unit, icon: Icon }: { label: string; value: string; unit: string; icon: any }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/[0.08] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <Icon className="w-3 h-3 text-slate-600" />
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
        <p className="text-[10px] text-slate-500 font-medium">{unit}</p>
      </div>
    </div>
  );
}

function StatusPill({ icon: Icon, label, tone }: { icon: any; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300">
      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: tone }} />
      <Icon className="h-4 w-4 opacity-70" />
      <span>{label}</span>
    </div>
  );
}

function TimelineStep({ time, label, status }: { time: string; label: string; status: 'complete' | 'warning' | 'pending' }) {
  const dotColor = {
    complete: 'bg-cyan-500',
    warning: 'bg-rose-500',
    pending: 'bg-slate-700'
  }[status];

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center gap-1 mt-1">
        <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <div className="h-8 w-px bg-slate-800" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{time}</p>
        <p className={`text-xs font-medium ${status === 'warning' ? 'text-rose-400' : 'text-slate-300'}`}>{label}</p>
      </div>
    </div>
  );
}
