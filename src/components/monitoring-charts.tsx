"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ResponsePoint, ThroughputPoint } from "@/lib/monitoring/types";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #d9ded5",
  borderRadius: "8px",
  boxShadow: "0 14px 40px rgba(23, 33, 29, 0.14)",
  color: "#17211d"
};

export function LatencyChart({ data }: { data: ResponsePoint[] }) {
  return (
    <section className="panel chart-panel" aria-labelledby="latency-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h2 id="latency-title">API Response Times</h2>
        </div>
      </div>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 2, bottom: 14 }}>
            <defs>
              <linearGradient id="apiLatency" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#0e7490" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#0e7490" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="workerLatency" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#c2410c" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#c2410c" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e9df" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} minTickGap={26} />
            <YAxis tickLine={false} axisLine={false} width={58} unit="ms" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" height={34} />
            <Area
              type="monotone"
              dataKey="apiMs"
              name="Public API"
              stroke="#0e7490"
              fill="url(#apiLatency)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="workerMs"
              name="Queue Workers"
              stroke="#c2410c"
              fill="url(#workerLatency)"
              strokeWidth={2}
            />
            <Line type="monotone" dataKey="webMs" name="Frontend Edge" stroke="#15803d" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function ThroughputChart({ data }: { data: ThroughputPoint[] }) {
  return (
    <section className="panel chart-panel" aria-labelledby="throughput-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Volume / errors</p>
          <h2 id="throughput-title">Traffic and Deploys</h2>
        </div>
      </div>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 12, left: 2, bottom: 14 }}>
            <CartesianGrid stroke="#e5e9df" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} minTickGap={26} />
            <YAxis tickLine={false} axisLine={false} width={58} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" height={34} />
            <Bar dataKey="requests" name="Requests" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="errors" name="Errors" stroke="#c2410c" strokeWidth={2} />
            <Line type="step" dataKey="deploys" name="Deploys" stroke="#b7791f" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
