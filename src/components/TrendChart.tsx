"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface TrendDataPoint {
  date: string;
  overall: number;
  completeness: number;
  fluency: number;
  pace: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  if (data.length < 2) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center text-zinc-500 text-sm">
        Complete at least 2 sessions to see trends.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-medium mb-4">Score Trends</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#151929",
              border: "1px solid #1e2640",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="overall" stroke="#6c63ff" strokeWidth={2} dot={{ r: 3 }} name="Overall" />
          <Line type="monotone" dataKey="fluency" stroke="#34d399" strokeWidth={1.5} dot={false} name="Fluency" />
          <Line type="monotone" dataKey="completeness" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="Completeness" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
