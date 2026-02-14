export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface Hotspot {
  id: string;
  type: "hesitation" | "low_confidence" | "missing_words" | "extra_words" | "repetition";
  description: string;
  verseNumber?: number;
  startMs?: number;
  endMs?: number;
  severity: "low" | "medium" | "high";
  expectedSnippet?: string;
  actualSnippet?: string;
}

export interface AnalysisResult {
  sessionId: string;
  surahId: string;
  completeness: number;
  fluency: number;
  pace: number;
  overall: number;
  hotspots: Hotspot[];
  durationMs: number;
  transcript: string;
  wordCount: number;
}

function removeDiacritics(text: string): string {
  return text.replace(
    /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g,
    ""
  );
}

export function normalizeArabic(text: string): string {
  let n = removeDiacritics(text);
  n = n.replace(/[ٱإأآا]/g, "ا");
  n = n.replace(/ة/g, "ه");
  n = n.replace(/ـ/g, "");
  n = n.replace(/\s+/g, " ").trim();
  return n;
}

function tokenize(text: string): string[] {
  return normalizeArabic(text).split(" ").filter(Boolean);
}

function levenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function scoreCompleteness(expected: string[], transcript: string[]): number {
  if (expected.length === 0) return 100;
  const dist = levenshtein(expected, transcript);
  const maxLen = Math.max(expected.length, transcript.length);
  return Math.round(Math.max(0, Math.min(100, (1 - dist / maxLen) * 100)));
}

function scoreFluency(
  timestamps: WordTimestamp[] | null,
  durationMs: number,
  tokens: string[]
): { score: number; hotspots: Hotspot[] } {
  const hotspots: Hotspot[] = [];

  if (timestamps && timestamps.length > 1) {
    let longPauses = 0;
    for (let i = 1; i < timestamps.length; i++) {
      const gap = timestamps[i].startMs - timestamps[i - 1].endMs;
      if (gap > 800) {
        longPauses++;
        hotspots.push({
          id: `pause-${i}`,
          type: "hesitation",
          description: `Hesitation (${(gap / 1000).toFixed(1)}s pause)`,
          startMs: timestamps[i - 1].endMs,
          endMs: timestamps[i].startMs,
          severity: gap > 2000 ? "high" : gap > 1200 ? "medium" : "low",
          actualSnippet: `...${timestamps[i - 1].word} [pause] ${timestamps[i].word}...`,
        });
      }
    }
    const ratio = longPauses / timestamps.length;
    return { score: Math.round(Math.max(0, (1 - ratio * 3) * 100)), hotspots };
  }

  if (tokens.length === 0) return { score: 50, hotspots: [] };
  const wps = (tokens.length / durationMs) * 1000;
  const deviation = Math.abs(wps - 2.0) / 2.0;
  return { score: Math.round(Math.max(0, (1 - deviation) * 100)), hotspots: [] };
}

function scorePace(durationMs: number, expectedSec: number): number {
  const deviation = Math.abs(1 - durationMs / 1000 / expectedSec);
  return Math.round(Math.max(0, (1 - deviation) * 100));
}

function findRepetitions(tokens: string[]): Hotspot[] {
  const out: Hotspot[] = [];
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] === tokens[i - 1]) {
      out.push({
        id: `rep-${i}`,
        type: "repetition",
        description: "Word repeated",
        severity: "low",
        actualSnippet: `${tokens[i - 1]} ${tokens[i]}`,
      });
    }
  }
  return out;
}

function findLowConfidence(timestamps: WordTimestamp[] | null): Hotspot[] {
  if (!timestamps) return [];
  return timestamps
    .filter((w) => w.confidence !== undefined && w.confidence < 0.6)
    .map((w, i) => ({
      id: `lowconf-${i}`,
      type: "low_confidence" as const,
      description: `Unclear pronunciation (${Math.round((w.confidence ?? 0) * 100)}% confidence)`,
      startMs: w.startMs,
      endMs: w.endMs,
      severity: (w.confidence ?? 0) < 0.3 ? ("high" as const) : ("medium" as const),
      actualSnippet: w.word,
    }));
}

function findMissing(expected: string[], transcript: string[]): Hotspot[] {
  const have = new Set(transcript);
  const missing = expected.filter((t) => !have.has(t));
  if (missing.length === 0) return [];
  if (missing.length > expected.length * 0.5) {
    return [
      {
        id: "missing-bulk",
        type: "missing_words",
        description: `Possible missing words (${missing.length} of ${expected.length})`,
        severity: "high",
        expectedSnippet: missing.slice(0, 5).join(" ") + (missing.length > 5 ? "..." : ""),
      },
    ];
  }
  return missing.map((w, i) => ({
    id: `missing-${i}`,
    type: "missing_words" as const,
    description: "Possible missing word",
    severity: "medium" as const,
    expectedSnippet: w,
  }));
}

export function analyzeRecitation(params: {
  sessionId: string;
  surahId: string;
  expectedText: string;
  transcript: string;
  durationMs: number;
  expectedDurationSec: number;
  wordTimestamps?: WordTimestamp[] | null;
}): AnalysisResult {
  const { sessionId, surahId, expectedText, transcript, durationMs, expectedDurationSec, wordTimestamps = null } = params;
  const expectedTokens = tokenize(expectedText);
  const transcriptTokens = tokenize(transcript);

  const completeness = scoreCompleteness(expectedTokens, transcriptTokens);
  const { score: fluency, hotspots: pauseHotspots } = scoreFluency(wordTimestamps, durationMs, transcriptTokens);
  const pace = scorePace(durationMs, expectedDurationSec);

  const hotspots: Hotspot[] = [
    ...pauseHotspots,
    ...findRepetitions(transcriptTokens),
    ...findLowConfidence(wordTimestamps),
    ...findMissing(expectedTokens, transcriptTokens),
  ];

  const order = { high: 0, medium: 1, low: 2 };
  hotspots.sort((a, b) => order[a.severity] - order[b.severity]);

  const overall = Math.round(completeness * 0.4 + fluency * 0.35 + pace * 0.25);

  return { sessionId, surahId, completeness, fluency, pace, overall, hotspots, durationMs, transcript, wordCount: transcriptTokens.length };
}
