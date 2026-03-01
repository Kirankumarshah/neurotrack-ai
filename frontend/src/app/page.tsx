"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Wifi,
  WifiOff,
  History,
  Activity,
  AlertCircle
} from "lucide-react";

import { useBehaviorTracker } from "@/hooks/useBehaviorTracker";
import FocusMeter from "@/components/FocusMeter";
import FocusChart from "@/components/FocusChart";
import NeuralFeed from "@/components/NeuralFeed";

// Production-ready modular components
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import api from "@/lib/api";

type XAIContributor = {
  feature: string;
  impact: string;
  reason: string;
};

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
  history: Array<{ time: string; score: number }>;
  forecast: {
    next_scores: number[];
    risk_direction: "up" | "down" | "stable";
    message: string;
  };
  contributors: XAIContributor[];
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const batch = useBehaviorTracker(10000);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; score: number }>>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--");

  // Initial History Fetch
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get<Array<{ time: string; score: number; risk: string }>>("/history");
        setHistory(res.data.map(h => ({ time: h.time, score: h.score })));
      } catch (err) {
        console.error("History fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchHistory();
  }, []);

  // Real-time Data Sync
  useEffect(() => {
    if (!batch) return;

    const streamData = async () => {
      try {
        const res = await api.post<AnalysisResponse>("/analyze", batch);
        setIsOnline(true);
        setAnalysis(res.data);

        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastUpdated(now);
        setHistory(prev => [...prev, { time: now, score: res.data.focus_score }].slice(-15));
      } catch (err) {
        setIsOnline(false);
      }
    };
    void streamData();
  }, [batch]);

  if (isLoading && !analysis) {
    return (
      <main className="min-h-screen p-4 md:p-12 lg:p-16">
        <DashboardSkeleton />
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-12 lg:p-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-[1400px] space-y-10"
      >
        <motion.header variants={itemVariants} className="flex flex-wrap items-end justify-between gap-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" />
              <div className="relative grid h-full w-full place-items-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl">
                <Brain className="h-9 w-9 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-white">NEUROTRACK.AI</h1>
                <div className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-500 tracking-widest uppercase font-mono">CORE v3.0</div>
              </div>
              <p className="mt-1 text-slate-400 font-medium tracking-tight">Explainable Cognitive Analytics Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusPill
              icon={isOnline ? Wifi : WifiOff}
              label={isOnline ? "LIVE FEED" : "API OFFLINE"}
              tone={isOnline ? "#06b6d4" : "#ef4444"}
            />
            <div className="h-10 w-px bg-white/5 hidden md:block" />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Update</p>
              <p className="text-sm font-mono text-cyan-400">{lastUpdated}</p>
            </div>
          </div>
        </motion.header>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-12 lg:grid-rows-6 lg:h-[900px]">
          {/* Main Focus Gauge */}
          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-4 lg:row-span-6">
            <FocusMeter score={analysis?.focus_score ?? 100} risk={analysis?.burnout_risk_level ?? "Low"} />
          </motion.div>

          {/* XAI Insights Card */}
          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-8 lg:row-span-2 world-card bg-gradient-to-br from-slate-900/60 to-black/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-cyan-400" />
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 text-cyan-400">
                  <Activity className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Neural Recommendation</h2>
                </div>
                <p className="text-2xl font-bold text-slate-100 leading-tight mb-6">
                  {analysis?.recommendation ?? "Calibrating neural sensors... Data stream is initializing."}
                </p>
              </div>

              <div className="w-full md:w-64 border-l border-white/5 pl-0 md:pl-8">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Focus Contributors</h3>
                <div className="space-y-3">
                  {analysis?.contributors.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full ${c.impact === 'High' ? 'bg-red-500' : 'bg-cyan-500'}`} />
                      <div>
                        <p className="text-[11px] font-bold text-slate-200">{c.feature}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">{c.reason}</p>
                      </div>
                    </div>
                  )) || (
                      <div className="text-[10px] italic text-slate-600">Gathering cognitive telemetry...</div>
                    )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Metric Grid */}
          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-5 lg:row-span-2 grid grid-cols-2 gap-4">
            <MetricCard label="Velocity" value={analysis?.metrics.typing_speed ?? 0} unit="WPM" icon={Activity} />
            <MetricCard label="Accuracy" value={((analysis?.metrics.error_rate ?? 0) * 100).toFixed(1)} unit="%" icon={AlertCircle} />
            <MetricCard label="Downtime" value={analysis?.metrics.idle_time ?? 0} unit="%" icon={History} />
            <MetricCard label="Latency" value={analysis?.metrics.reaction_delay ?? 0} unit="SEC" icon={Brain} />
          </motion.div>

          {/* Feed Component */}
          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-3 lg:row-span-4">
            <NeuralFeed batch={batch} />
          </motion.div>

          {/* Timeline Component */}
          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-5 lg:row-span-2 world-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <History className="w-3 h-3" /> Cognitive Timeline
              </h3>
            </div>
            <div className="h-[140px]">
              <FocusChart data={history} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
