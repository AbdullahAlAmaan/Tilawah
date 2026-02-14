"use client";

import type { Hotspot } from "@/lib/analysis";

interface HotspotListProps {
  hotspots: Hotspot[];
  onSelect?: (hotspot: Hotspot) => void;
}

const typeLabels: Record<string, string> = {
  hesitation: "Hesitation",
  low_confidence: "Unclear",
  missing_words: "Missing",
  extra_words: "Extra",
  repetition: "Repeated",
};

const typeIcons: Record<string, string> = {
  hesitation: "⏸",
  low_confidence: "?",
  missing_words: "−",
  extra_words: "+",
  repetition: "↻",
};

const severityColors: Record<string, string> = {
  high: "border-danger/40 bg-danger/5",
  medium: "border-warning/40 bg-warning/5",
  low: "border-card-border bg-card",
};

const severityBadge: Record<string, string> = {
  high: "bg-danger/20 text-danger",
  medium: "bg-warning/20 text-warning",
  low: "bg-muted/20 text-muted",
};

export default function HotspotList({ hotspots, onSelect }: HotspotListProps) {
  if (hotspots.length === 0) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
        <p className="text-success text-sm font-medium">No significant hotspots detected</p>
        <p className="text-xs text-muted mt-1">Great job on this recitation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted">Hotspots ({hotspots.length})</h3>
      {hotspots.map((h) => (
        <button
          key={h.id}
          onClick={() => onSelect?.(h)}
          className={`w-full text-left border rounded-lg p-3 transition-all hover:shadow-md ${severityColors[h.severity]} cursor-pointer`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">{typeIcons[h.type] || "!"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{typeLabels[h.type] || h.type}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${severityBadge[h.severity]}`}>
                  {h.severity}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">{h.description}</p>
              {h.expectedSnippet && (
                <p className="text-xs mt-1" dir="rtl">
                  <span className="text-muted">Expected: </span>
                  <span className="text-foreground">{h.expectedSnippet}</span>
                </p>
              )}
              {h.actualSnippet && (
                <p className="text-xs mt-0.5" dir="rtl">
                  <span className="text-muted">Heard: </span>
                  <span className="text-foreground">{h.actualSnippet}</span>
                </p>
              )}
            </div>
            <span className="text-muted text-xs flex-shrink-0">&rsaquo;</span>
          </div>
        </button>
      ))}
    </div>
  );
}
