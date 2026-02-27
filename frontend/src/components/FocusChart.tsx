"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
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
    <section className="glass-card h-[340px] w-full rounded-3xl p-5 md:p-6">
      <h3 className="panel-title text-sm font-semibold uppercase tracking-[0.22em]">Session Trend</h3>
      <p className="mt-1 text-xs text-slate-400">Live focus trajectory from backend history</p>

      <div className="mt-4 h-[250px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 6 }}>
              <defs>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.28)" />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0.02)" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                cursor={{ stroke: "rgba(34,211,238,0.35)", strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: "#dbeafe" }}
                itemStyle={{ color: "#99f6e4" }}
              />

              <Area type="monotone" dataKey="score" stroke="none" fill="url(#areaFill)" />
              <Line type="monotone" dataKey="score" stroke="url(#lineGlow)" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-white/25 bg-slate-900/35 text-sm text-slate-400">
            Start interacting to populate your session trend.
          </div>
        )}
      </div>
    </section>
  );
};

export default FocusChart;
