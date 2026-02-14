"use client";

interface ScoreCardsProps {
  completeness: number;
  fluency: number;
  pace: number;
  overall: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-success/10 border-success/20";
  if (score >= 60) return "bg-warning/10 border-warning/20";
  return "bg-danger/10 border-danger/20";
}

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-card-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={getScoreColor(score)}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export default function ScoreCards({ completeness, fluency, pace, overall }: ScoreCardsProps) {
  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className={`border rounded-xl p-5 text-center ${getScoreBg(overall)}`}>
        <p className="text-sm text-muted mb-1">Overall Score</p>
        <p className={`text-4xl font-bold ${getScoreColor(overall)}`}>{overall}</p>
        <p className="text-xs text-muted mt-1">out of 100</p>
      </div>

      {/* Individual scores */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Completeness", score: completeness },
          { label: "Fluency", score: fluency },
          { label: "Pace", score: pace },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-card-border rounded-xl p-4 text-center relative">
            <ScoreRing score={item.score} label={item.label} />
          </div>
        ))}
      </div>
    </div>
  );
}
