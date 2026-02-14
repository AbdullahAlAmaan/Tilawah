"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SessionRecord } from "@/lib/storage";
import { getSurahById } from "@/data/surahs";
import TrendChart from "@/components/TrendChart";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const trendData = [...sessions]
    .reverse()
    .map((s) => ({
      date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      overall: s.overall,
      completeness: s.completeness,
      fluency: s.fluency,
      pace: s.pace,
    }));

  const scoreColor = (s: number) =>
    s >= 80 ? "text-emerald-500" : s >= 60 ? "text-amber-500" : "text-red-500";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Session History</h1>

      <TrendChart data={trendData} />

      {sessions.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <p className="text-zinc-500">No sessions yet.</p>
          <Link href="/" className="text-emerald-600 dark:text-emerald-400 underline text-sm">
            Start your first recitation
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const surah = getSurahById(s.surahId);
            return (
              <Link
                key={s.id}
                href={`/results/${s.id}`}
                className="block card hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{surah?.name || s.surahId}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(s.createdAt).toLocaleString()} &middot;{" "}
                      {(s.durationMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${scoreColor(s.overall)}`}>{s.overall}</p>
                    <p className="text-[10px] text-zinc-500">overall</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                  <span>Completeness: <span className={scoreColor(s.completeness)}>{s.completeness}</span></span>
                  <span>Fluency: <span className={scoreColor(s.fluency)}>{s.fluency}</span></span>
                  <span>Pace: <span className={scoreColor(s.pace)}>{s.pace}</span></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
