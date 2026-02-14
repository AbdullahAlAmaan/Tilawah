'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Correct import for App Router
import { getSurahById, Surah } from '@/data/surahs';
import { Mic, CheckCircle, ArrowLeft, Loader2, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { useConversation } from '@/hooks/useConversation';

function SessionContent() {
  const searchParams = useSearchParams();
  const surahId = searchParams.get('surah');
  const [surah, setSurah] = useState<Surah | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (surahId) {
      const s = getSurahById(surahId);
      setSurah(s);
    }
  }, [surahId]);

  const { state, feedback, startSession } = useConversation({
    onAudioSubmit: async (audioBlob) => {
      if (!surah) throw new Error("No Surah selected");

      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('surahId', surah.id);
      // Estimate duration if not provided by recorder (hook could provide it, but for now simple)
      formData.append('duration', '5000');

      const res = await fetch('/api/process-session', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("API Failed");

      const data = await res.json();
      return {
        feedback: data.feedback,
        audioUrl: data.audioBase64 ? `data:audio/wav;base64,${data.audioBase64}` : ''
      };
    }
  });

  // Auto-start session when mounted and surah found
  useEffect(() => {
    if (surah) {
      startSession();
    }
  }, [surah]);

  if (!surah) {
    return <div className="p-8 text-center">Loading Surah...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background Ambience */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${state === 'LISTENING' ? 'opacity-20' : 'opacity-5'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse-ring"></div>
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center gap-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{surah.name}</h1>
          <p className="text-xl text-zinc-500 font-arabic">{surah.arabicName}</p>
        </div>

        {/* Dynamic Status Visualizer */}
        <div className="relative w-64 h-64 flex items-center justify-center">

          {/* Listening State */}
          {state === 'LISTENING' && (
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              <div className="w-48 h-48 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center border-4 border-emerald-500 transition-all duration-500">
                <Mic className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-emerald-600 font-medium animate-pulse">Listening...</p>
            </div>
          )}

          {/* Thinking State */}
          {state === 'THINKING' && (
            <div className="relative">
              <div className="w-48 h-48 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center border-4 border-amber-500 animate-pulse">
                <Loader2 className="w-16 h-16 text-amber-600 dark:text-amber-400 animate-spin" />
              </div>
              <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-amber-600 font-medium">Analyzing...</p>
            </div>
          )}

          {/* Speaking State */}
          {state === 'SPEAKING' && (
            <div className="relative">
              <div className="w-48 h-48 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-blue-500">
                <Volume2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-bounce" />
              </div>
              <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-blue-600 font-medium">Coach Speaking...</p>
            </div>
          )}

          {/* Idle State */}
          {state === 'IDLE' && (
            <button onClick={startSession} className="w-48 h-48 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-300 hover:border-emerald-500 hover:scale-105 transition-all cursor-pointer">
              <span className="text-lg font-medium text-zinc-500">Tap to Start</span>
            </button>
          )}
        </div>

        {/* Feedback Display */}
        <div className="min-h-[100px] w-full text-center px-4">
          {feedback && (
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-lg text-zinc-700 dark:text-zinc-300 font-medium">"{feedback}"</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <Link href="/" className="text-zinc-400 hover:text-zinc-600 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Surahs
        </Link>

      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <SessionContent />
    </Suspense>
  );
}
