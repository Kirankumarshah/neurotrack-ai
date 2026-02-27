"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Gauge,
  Sparkles,
  TrendingUp,
  Wifi,
  WifiOff,
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
    typing_variance: number;
    error_rate: number;
    idle_time: number;
    reaction_delay: number;
    speed_drop_rate: number;
    error_acceleration: number;
    idle_spike_score: number;
    focus_stability_index: number;
  };
  history: Array<{ time: string; score: number }>;
  forecast: {
    next_scores: number[];
    risk_direction: "up" | "down" | "stable";
    message: string;
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

        setAnalysis(response.data);
        setHistory(response.data.history ?? []);
        setIsOnline(true);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch {
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
    <main className="dashboard-shell min-h-screen bg-[#0a0c10] px-4 py-8 text-slate-200 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="glass-card rounded-3xl p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="brand-orb grid h-14 w-14 place-items-center rounded-2xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">NeuroTrack AI</h1>
                <p className="mt-1 text-sm font-medium text-slate-300">Cognitive telemetry and fatigue prediction</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusPill
                icon={isOnline ? Wifi : WifiOff}
                label={isOnline ? "API Connected" : "API Offline"}
                tone={isOnline ? "#34d399" : "#f43f5e"}
              />
              <StatusPill icon={Gauge} label={`Risk: ${analysis?.burnout_risk_level ?? "Low"}`} tone={riskTone} />
              <div className="rounded-full border border-white/15 bg-slate-900/60 px-3 py-1.5 font-mono text-xs text-slate-400">
                {lastUpdated}
              </div>
            </div>
          </div>

          <div className="kpi-strip mt-5 grid gap-2 rounded-2xl p-2 md:grid-cols-4">
            <KpiCard label="Focus" value={`${Math.round(analysis?.focus_score ?? 100)}%`} />
            <KpiCard label="Typing" value={`${analysis?.metrics.typing_speed ?? 0} WPM`} />
            <KpiCard label="Errors" value={`${((analysis?.metrics.error_rate ?? 0) * 100).toFixed(1)}%`} />
            <KpiCard label="Stability" value={`${Math.round((analysis?.metrics.focus_stability_index ?? 0) * 100)}%`} />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <div className="space-y-6">
            <FocusMeter score={analysis?.focus_score ?? 100} risk={analysis?.burnout_risk_level ?? "Low"} />

            <div className="glass-card rounded-3xl p-6">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <Clock className="h-3 w-3" /> Forecast Window
              </h3>
              <p className="rounded-xl border border-cyan-300/20 bg-cyan-950/20 p-3 text-sm text-cyan-100">
                {analysis?.forecast.message ?? "Gathering session context for prediction..."}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(analysis?.forecast.next_scores ?? [100, 100, 100]).map((score, index) => (
                  <div key={index} className="metric-card rounded-xl p-2 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">+{(index + 1) * 10}s</p>
                    <p className="font-mono text-lg font-semibold text-white">{Math.round(score)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card relative overflow-hidden rounded-3xl p-6">
              <div className="absolute right-0 top-0 p-8 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>

              <h2 className="panel-title flex items-center gap-2 text-xl font-bold">
                <Zap className="h-5 w-5 fill-amber-300 text-amber-300" /> Live AI Guidance
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">
                {analysis?.recommendation ?? "Analyzing behavior stream. Insights refresh every 10 seconds."}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard label="Typing Speed" value={`${analysis?.metrics.typing_speed ?? 0}`} unit="WPM" icon={TrendingUp} />
                <MetricCard label="Error Rate" value={`${((analysis?.metrics.error_rate ?? 0) * 100).toFixed(1)}`} unit="%" icon={AlertTriangle} />
                <MetricCard label="Idle Time" value={`${analysis?.metrics.idle_time ?? 0}`} unit="%" icon={Activity} />
                <MetricCard label="Reaction" value={`${analysis?.metrics.reaction_delay ?? 0}`} unit="s" icon={Clock} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Chip label="Speed Drop" value={`${Math.round((analysis?.metrics.speed_drop_rate ?? 0) * 100)}%`} />
                <Chip label="Error Accel" value={`${Math.round((analysis?.metrics.error_acceleration ?? 0) * 100)}%`} />
                <Chip label="Idle Spikes" value={`${Math.round((analysis?.metrics.idle_spike_score ?? 0) * 100)}%`} />
                <Chip label="Stability" value={`${Math.round((analysis?.metrics.focus_stability_index ?? 0) * 100)}%`} />
              </div>

              {!isOnline && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/40 bg-rose-950/30 p-3 text-sm text-rose-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Backend unreachable at <span className="font-mono">{BACKEND_URL}</span>. Start API first.
                  </p>
                </div>
              )}
            </div>

            <FocusChart data={history} />
          </div>
        </section>
      </div>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="metric-card rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="flex items-baseline gap-1">
        <p className="font-mono text-2xl font-bold text-white">{value}</p>
        <p className="text-[10px] text-slate-400">{unit}</p>
      </div>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/55 px-3 py-1.5 text-xs font-medium text-slate-100">
      <span className="sparkline-dot h-2 w-2 rounded-full" style={{ backgroundColor: tone, color: tone }} />
      <Icon className="h-3.5 w-3.5 opacity-80" />
      <span>{label}</span>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/12 bg-slate-900/35 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
