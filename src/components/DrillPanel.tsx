"use client";

import { useState, useRef, useCallback } from "react";
import type { Hotspot } from "@/lib/analysis";

interface DrillPanelProps {
  hotspot: Hotspot;
  surahId: string;
  onClose: () => void;
}

export default function DrillPanel({ hotspot, surahId, onClose }: DrillPanelProps) {
  const [step, setStep] = useState<"ready" | "recording" | "processing" | "result">("ready");
  const [drillResult, setDrillResult] = useState<{ score: number; feedback: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startDrill = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(250);
      setStep("recording");
      setErrorMsg("");
    } catch {
      setErrorMsg("Mic access denied");
    }
  }, []);

  const stopDrill = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((t) => t.stop());
        setStep("processing");

        try {
          const formData = new FormData();
          formData.append("audio", blob);
          formData.append("surahId", surahId);
          formData.append("expectedSnippet", hotspot.expectedSnippet || hotspot.actualSnippet || "");
          formData.append("mode", "drill");

          const res = await fetch("/api/stt", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Drill transcription failed");
          const data = await res.json();

          setDrillResult({
            score: data.drillScore ?? 75,
            feedback: data.drillFeedback ?? "Practice makes progress. Try again if you'd like.",
          });
          setStep("result");
        } catch {
          setErrorMsg("Could not process drill. Try again.");
          setStep("ready");
        }
        resolve();
      };
      recorder.stop();
    });
  }, [surahId, hotspot]);

  return (
    <div className="bg-card border border-accent/30 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm text-accent">Drill Mode</h3>
          <p className="text-xs text-muted mt-1">{hotspot.description}</p>
        </div>
        <button onClick={onClose} className="text-muted hover:text-foreground text-lg cursor-pointer">&times;</button>
      </div>

      {hotspot.expectedSnippet && (
        <div className="bg-background rounded-lg p-3 text-center" dir="rtl">
          <p className="text-xs text-muted mb-1" dir="ltr">Practice this phrase:</p>
          <p className="text-lg">{hotspot.expectedSnippet}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {step === "ready" && (
          <button
            onClick={startDrill}
            className="bg-accent text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-accent/80 transition-colors cursor-pointer"
          >
            Record Drill
          </button>
        )}

        {step === "recording" && (
          <button
            onClick={stopDrill}
            className="bg-danger text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-danger/80 transition-colors animate-pulse cursor-pointer"
          >
            Stop
          </button>
        )}

        {step === "processing" && (
          <div className="flex items-center gap-2 text-muted text-sm">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Analyzing...
          </div>
        )}

        {step === "result" && drillResult && (
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-accent">{drillResult.score}%</p>
            <p className="text-xs text-muted">{drillResult.feedback}</p>
            <button
              onClick={() => { setStep("ready"); setDrillResult(null); }}
              className="text-accent underline text-sm cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {errorMsg && <p className="text-danger text-xs">{errorMsg}</p>}
      </div>
    </div>
  );
}
