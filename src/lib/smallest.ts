import type { WordTimestamp } from "./analysis";

export interface STTResult {
  transcript: string;
  wordTimestamps: WordTimestamp[] | null;
  language?: string;
  durationMs?: number;
}

export interface TTSResult {
  audioData: ArrayBuffer;
  contentType: string;
}

const API_BASE = "https://waves-api.smallest.ai";

function getApiKey(): string {
  const key = process.env.SMALLEST_API_KEY;
  if (!key) throw new Error("SMALLEST_API_KEY environment variable is not set");
  return key;
}

// STT: Pulse API expects raw audio bytes in body + Content-Type + query params (not FormData)
export async function transcribeAudio(audioBuffer: Buffer, mimeType = "audio/webm"): Promise<STTResult> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    model: "pulse",
    language: "multi", // auto-detect (Arabic not in their enum; multi covers ar + others)
    word_timestamps: "true",
  });

  const res = await fetch(`${API_BASE}/api/v1/pulse/get_text?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": mimeType,
    },
    body: audioBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`STT error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const transcript: string = data.transcription ?? data.text ?? data.transcript ?? "";
  const wordTimestamps: WordTimestamp[] | null = data.words
    ? data.words.map((w: { word: string; start: number; end: number; confidence?: number }) => ({
      word: w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      confidence: w.confidence,
    }))
    : null;

  return {
    transcript,
    wordTimestamps,
    language: data.language,
    durationMs: data.audio_length != null ? Math.round(data.audio_length * 1000) : data.duration != null ? Math.round(data.duration * 1000) : undefined,
  };
}

export async function synthesizeSpeech(text: string): Promise<TTSResult> {
  const apiKey = getApiKey();

  // Use Lightning for fast TTS
  const res = await fetch(`${API_BASE}/api/v1/lightning/get_speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice_id: "emily",
      sample_rate: 24000,
      speed: 1.0,
      model: "lightning",
      output_format: "wav"
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS error (${res.status}): ${err}`);
  }

  return {
    audioData: await res.arrayBuffer(),
    contentType: res.headers.get("content-type") || "audio/wav",
  };
}
