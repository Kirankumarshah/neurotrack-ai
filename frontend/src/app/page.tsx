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
} from "lucide-react";
import { useBehaviorTracker } from "@/hooks/useBehaviorTracker";
import FocusMeter from "@/components/FocusMeter";
import FocusChart from "@/components/FocusChart";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AnalysisResponse = {
  fatigue_probability: number;
  focus_score: number;
  burnout_risk_level: "Low" | "Medium" | "High";
  recommendation: string;
};

export default function Dashboard() {
  const metrics = useBehaviorTracker(8000);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; score: number }>>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--");

  useEffect(() => {
    const hasSignal = metrics.typing_speed > 0 || metrics.idle_time < 90;
    if (!hasSignal) return;

    const sendData = async () => {
      try {
        const response = await axios.post<AnalysisResponse>(`${BACKEND_URL}/analyze`, metrics, {
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
  }, [metrics]);

  const riskTone = useMemo(() => {
    const risk = analysis?.burnout_risk_level ?? "Low";
    if (risk === "High") return "var(--danger)";
    if (risk === "Medium") return "var(--warning)";
    return "var(--success)";
  }, [analysis]);

  return (
    <main className="dashboard-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="brand-orb grid h-12 w-12 place-items-center rounded-xl">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">NeuroTrack AI</h1>
                <p className="mt-1 text-sm text-slate-300">Real-time cognitive workload dashboard</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
              <StatusPill
                icon={isOnline ? Wifi : WifiOff}
                label={isOnline ? "API Connected" : "API Disconnected"}
                tone={isOnline ? "var(--success)" : "var(--danger)"}
              />
              <StatusPill
                icon={Gauge}
                label={`Risk ${analysis?.burnout_risk_level ?? "Low"}`}
                tone={riskTone}
              />
              <StatusPill icon={Activity} label={`Updated ${lastUpdated}`} tone="var(--accent-cyan)" />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <FocusMeter score={analysis?.focus_score ?? 100} risk={analysis?.burnout_risk_level ?? "Low"} />

          <div className="glass-card rounded-2xl p-5 md:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              AI Recommendation
            </h2>
            <p className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-slate-200">
              {analysis?.recommendation ??
                "Start typing or moving your mouse. Insights will appear here after the first analysis cycle."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="Typing Speed" value={`${metrics.typing_speed} WPM`} />
              <MetricCard label="Error Rate" value={`${(metrics.error_rate * 100).toFixed(1)}%`} />
              <MetricCard label="Idle Window" value={`${metrics.idle_time}%`} />
              <MetricCard label="Reaction Delay" value={`${metrics.reaction_delay}s`} />
            </div>

            {!isOnline && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Backend is unreachable at <span className="font-mono">{BACKEND_URL}</span>. Start the API server
                  and keep CORS enabled.
                </p>
              </div>
            )}
          </div>
        </section>

        <FocusChart data={history} />
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-xl p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-lg text-cyan-200">{value}</p>
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
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/55 px-3 py-1.5 text-slate-200">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  );
}
