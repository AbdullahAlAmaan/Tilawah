import type { WordTimestamp } from "./analysis";
import FormData from 'form-data';

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

// STT: Pulse API expects multipart/form-data
export async function transcribeAudio(audioBuffer: Buffer, mimeType = "audio/wav"): Promise<STTResult> {
  const apiKey = getApiKey();
  console.log(`[Smallest] Transcribing: ${audioBuffer.length} bytes, type: ${mimeType}`);

  const formData = new FormData();
  formData.append("file", audioBuffer, { filename: "audio.wav", contentType: mimeType });
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "en");

  // transform stream to buffer to avoid chunked transfer issues
  const bodyBuffer = formData.getBuffer();
  const formHeaders = formData.getHeaders();

  const res = await fetch(`${API_BASE}/api/v1/pulse/get_text`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...formHeaders,
      "Content-Length": bodyBuffer.length.toString()
    } as any,
    body: bodyBuffer as any,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`STT error (${res.status}): ${err}`);
  }

  const data = await res.json() as any;
  const transcript: string = data.text ?? data.transcription ?? "";

  // Note: whisper-large-v3-turbo response format for timestamps might differ
  // For now, returning null to proceed with content.
  const wordTimestamps: WordTimestamp[] | null = null;

  return {
    transcript,
    wordTimestamps,
    language: "en",
    durationMs: undefined,
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
