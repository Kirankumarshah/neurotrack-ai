"use client";

import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FocusChartProps {
  data: { time: string; score: number }[];
}

const FocusChart: React.FC<FocusChartProps> = ({ data }) => {
  const hasData = data.length > 0;

  return (
    <section className="glass-card h-[320px] w-full rounded-2xl p-5 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Focus Trend</h3>
      <p className="mt-1 text-xs text-slate-400">Last 15 analysis checkpoints</p>

      <div className="mt-4 h-[235px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(148,163,184,0.28)",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: "#cbd5e1" }}
                itemStyle={{ color: "#67e8f9" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#focusGradient)"
                strokeWidth={3}
                dot={{ r: 2, fill: "#67e8f9" }}
                activeDot={{ r: 4 }}
                isAnimationActive
              />
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/20 bg-slate-900/35 text-sm text-slate-400">
            Waiting for enough activity to render the trend chart.
          </div>
        )}
      </div>
    </section>
  );
};

export default FocusChart;
