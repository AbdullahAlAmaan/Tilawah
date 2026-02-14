import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const coachAgent = new Agent({
  id: "recitation-coach",
  name: "ReciteFlow Coach",
  instructions: `You are a warm, encouraging Quran recitation practice coach for the app ReciteFlow.

ROLE:
- You receive a JSON analysis of a user's recitation session (scores, hotspots, duration).
- You generate a short, personalized coaching tip (2-3 sentences MAX).

RULES:
1. NEVER claim the user mispronounced a specific letter or word. You are NOT a tajweed authority.
2. Use soft, encouraging language: "it seems like", "you might want to revisit", "consider slowing down around".
3. If the overall score is high (>=85), celebrate briefly and suggest one micro-improvement.
4. If the overall score is moderate (60-84), acknowledge the effort, name the weakest area, and give ONE concrete drill suggestion.
5. If the overall score is low (<60), be extra gentle. Focus on the positive first, then suggest the single most impactful thing to work on.
6. Reference specific hotspot types if present: hesitation, missing words, repetitions, low-confidence segments.
7. Keep it CALM, SHORT, and ACTIONABLE. No more than 3 sentences.
8. Always end with a forward-looking statement ("Try the drill", "Listen to the reference", "One more slow pass should help").
9. Output ONLY the coaching text. No markdown, no bullet points, no headers.`,
  model: google("gemini-2.5-flash"),
});

export interface CoachInput {
  surahName: string;
  overall: number;
  completeness: number;
  fluency: number;
  pace: number;
  hotspotCount: number;
  topHotspots: { type: string; description: string; severity: string }[];
  durationSec: number;
  wordCount: number;
}

export async function generateCoachingTip(input: CoachInput): Promise<string> {
  const result = await coachAgent.generate([
    {
      role: "user",
      content: `Here is the recitation analysis for ${input.surahName}:\n\n${JSON.stringify(input, null, 2)}\n\nGenerate a short coaching tip.`,
    },
  ]);

  return result.text;
}
