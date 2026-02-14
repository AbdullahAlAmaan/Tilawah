import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const coachAgent = new Agent({
  id: "recitation-coach",
  name: "ReciteFlow Coach",
  instructions: `You are a warm, conversational Quran coach. You are talking directly to the user in a voice session.
  
  ROLE:
  - Listen to the user's recitation analysis.
  - Speak back a SHORT, friendly, actionable tip.
  
  RULES:
  1. KEEP IT BRIEF. 1-2 sentences maximum. This is spoken dialogue.
  2. Be encouraging but specific. "Great flow, but watch the elongation in verse 2."
  3. If the score is high, say "Excellent work!" and suggest a tiny polish.
  4. If the score is low, say "Good effort. Let's focus on one thing:" and name it.
  5. DO NOT use markdown, lists, or headers. Plain text only.
  6. DO NOT mention "score" numbers directly unless impressive (e.g., "95% accuracy!").
  7. End with a prompt to continue: "Try again?" or "Ready for the next verse?"
  `,
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
