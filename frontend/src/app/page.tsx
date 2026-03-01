"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion, Variants } from "framer-motion";
import {
  Brain,
  Sparkles,
  Wifi,
  WifiOff,
  TrendingUp,
  Minus,
  Zap,
  History,
  Activity
} from "lucide-react";
import { useBehaviorTracker } from "@/hooks/useBehaviorTracker";
import FocusMeter from "@/components/FocusMeter";
import FocusChart from "@/components/FocusChart";
import NeuralFeed from "@/components/NeuralFeed";

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
  history: Array<{ time: string; score: number }>;
  forecast: {
    next_scores: number[];
    risk_direction: "up" | "down" | "stable";
    message: string;
  };
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0
  }
};

export default function Dashboard() {
  const batch = useBehaviorTracker(10000);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<Array<{ time: string; score: number }>>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get<Array<{ time: string; score: number }>>(`${BACKEND_URL}/history`);
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    void fetchHistory();
  }, []);

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
                <div className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-500 tracking-widest uppercase">PRO v2</div>
              </div>
              <p className="mt-1 text-slate-400 font-medium tracking-tight">Real-time biological cognitive workload monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusPill
              icon={isOnline ? Wifi : WifiOff}
              label={isOnline ? "LIVE FEED" : "API OFFLINE"}
              tone={isOnline ? "var(--success)" : "var(--danger)"}
            />
            <div className="h-10 w-px bg-white/5 hidden md:block" />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Latency</p>
              <p className="text-sm font-mono text-cyan-400">14ms</p>
            </div>
          </div>
        </motion.header>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-12 lg:grid-rows-6 lg:h-[900px]">
          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-4 lg:row-span-6">
            <FocusMeter score={analysis?.focus_score ?? 100} risk={analysis?.burnout_risk_level ?? "Low"} />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-8 lg:row-span-2 world-card bg-gradient-to-br from-slate-900/40 to-black/40">
            <div className="flex items-center gap-2 mb-6 text-cyan-400">
              <Sparkles className="w-5 h-5 fill-current" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Neural Recommendation</h2>
            </div>
            <p className="text-2xl font-bold text-slate-100 leading-snug">
              {analysis?.recommendation ?? "Synchronizing with your neural patterns... Expect a calibrated focus index in the next session window."}
            </p>

            <div className="mt-8 flex gap-3">
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">#FOCUS_PRIORITY</div>
              <div className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-500">SESSION_ACTIVE</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-5 lg:row-span-2 grid grid-cols-2 gap-4">
            <MetricCell label="TYPING VELOCITY" value={analysis?.metrics.typing_speed ?? 0} unit="WPM" icon={TrendingUp} />
            <MetricCell label="ERROR DENSITY" value={((analysis?.metrics.error_rate ?? 0) * 100).toFixed(1)} unit="%" icon={Zap} />
            <MetricCell label="IDLE WINDOW" value={analysis?.metrics.idle_time ?? 0} unit="%" icon={Minus} />
            <MetricCell label="LATENCY" value={analysis?.metrics.reaction_delay ?? 0} unit="SEC" icon={Activity} />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-3 lg:row-span-4">
            <NeuralFeed batch={batch} />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-5 lg:row-span-2 world-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <History className="w-3 h-3" /> Focus Timeline
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                RECORDING_LIVE
              </div>
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

function MetricCell({ label, value, unit, icon: Icon }: any) {
  return (
    <div className="world-card p-6 flex flex-col justify-between group">
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
}

function StatusPill({ icon: Icon, label, tone }: any) {
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
}
