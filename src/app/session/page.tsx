'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSurahById } from '@/data/surahs';
import { Mic, Square, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const surahId = searchParams?.get('surah');
  const surah = surahId ? getSurahById(surahId) : undefined;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = processRecording;

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);

      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(p => p + 1);
      }, 1000);

    } catch (err: any) {
      setError("Could not access microphone: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

    // Convert blob to base64 or send as FormData to API
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    formData.append('surahId', surah?.id || '');
    formData.append('duration', (duration * 1000).toString()); // ms

    try {
      const res = await fetch('/api/process-session', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      router.push(`/results/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  if (!surah) {
    return (
      <div className="p-8 text-center text-red-500">
        Surah not found. <Link href="/" className="underline">Go Home</Link>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 max-w-md mx-auto relative">
      <Link href="/" className="absolute top-8 left-8 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <ArrowLeft className="w-6 h-6" />
      </Link>

      <div className="text-center space-y-2 mb-12">
        <h1 className="text-3xl font-bold">{surah.name}</h1>
        <p className="text-zinc-500">{surah.englishName}</p>
      </div>

      {/* Recitation Card */}
      <div className="w-full card mb-12 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="text-center space-y-6">
          <div className="font-arabic text-3xl leading-loose text-zinc-800 dark:text-zinc-200" dir="rtl">
            {surah.fullText}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        <div className="text-4xl font-mono tabular-nums text-zinc-400">
          {formatTime(duration)}
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-sm font-medium animate-pulse text-zinc-500">Processing with smallest.ai...</p>
          </div>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg
              ${isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse-ring'
                : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105'
              }
            `}
          >
            {isRecording ? <Square className="w-8 h-8 text-white fill-current" /> : <Mic className="w-8 h-8 text-white" />}
          </button>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm max-w-sm">
            {error}
          </div>
        )}

        <p className="text-sm text-zinc-500 max-w-xs text-center">
          {isRecording
            ? "Recite clearly at a moderate pace. Tap stop when finished."
            : "Tap the microphone to begin your session."
          }
        </p>
      </div>
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SessionContent />
    </Suspense>
  );
}
