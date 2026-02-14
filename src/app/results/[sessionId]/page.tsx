'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, AlertCircle, Sparkles, Volume2, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function ResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const unwrappedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [playingHotspot, setPlayingHotspot] = useState<number | null>(null);
  const [scoreHelpOpen, setScoreHelpOpen] = useState(false);

  const recordingRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch(`/api/sessions/${unwrappedParams.sessionId}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [unwrappedParams.sessionId]);

  // Load recording for playback (single request, blob URL)
  useEffect(() => {
    if (!unwrappedParams.sessionId) return;
    let objectUrl: string | null = null;
    fetch(`/api/sessions/${unwrappedParams.sessionId}/recording`)
      .then(res => {
        if (!res.ok) return;
        return res.blob();
      })
      .then(blob => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setRecordingUrl(objectUrl);
        }
      })
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [unwrappedParams.sessionId]);

  const playCoach = useCallback(async () => {
    setCoachError(null);
    setCoachLoading(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: unwrappedParams.sessionId, tts: true }),
      });
      if (!res.ok) throw new Error('Failed to load coach');
      const json = await res.json();
      if (!json.audio) {
        setCoachError('Voice not available for this session.');
        setCoachLoading(false);
        return;
      }
      const binary = Uint8Array.from(atob(json.audio), c => c.charCodeAt(0));
      const blob = new Blob([binary], { type: json.audioContentType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => {
        setCoachError('Playback failed.');
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e: any) {
      setCoachError(e.message || 'Could not load coach voice.');
    } finally {
      setCoachLoading(false);
    }
  }, [unwrappedParams.sessionId]);

  const playHotspot = useCallback((h: { startMs?: number; endMs?: number }, index: number) => {
    const audio = recordingRef.current;
    if (!audio || !recordingUrl) return;
    const startMs = h.startMs ?? 0;
    const endMs = h.endMs ?? startMs + 3000;
    audio.currentTime = startMs / 1000;
    setPlayingHotspot(index);
    const stopAt = endMs / 1000;
    const onTimeUpdate = () => {
      if (audio.currentTime >= stopAt) {
        audio.pause();
        audio.removeEventListener('timeupdate', onTimeUpdate);
        setPlayingHotspot(null);
      }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.play().catch(() => setPlayingHotspot(null));
  }, [recordingUrl]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Session not found</div>;

  const scoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const hotspots = data.hotspots ?? [];

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto space-y-8 pb-24">
      <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Session Results</h1>
        <p className="text-zinc-500">Detailed analysis of your recitation</p>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center p-4">
          <div className={`text-4xl font-bold mb-1 ${scoreColor(data.completeness)}`}>{data.completeness}%</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Completeness</div>
        </div>
        <div className="card text-center p-4">
          <div className={`text-4xl font-bold mb-1 ${scoreColor(data.fluency)}`}>{data.fluency}%</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Fluency</div>
        </div>
        <div className="card text-center p-4">
          <div className={`text-4xl font-bold mb-1 ${scoreColor(data.pace)}`}>{data.pace}%</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Pace</div>
        </div>
      </div>

      {/* How we score */}
      <div className="card border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setScoreHelpOpen(!scoreHelpOpen)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-2 font-medium">
            <Info className="w-5 h-5 text-zinc-500" />
            How we calculate scores
          </span>
          {scoreHelpOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {scoreHelpOpen && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">Completeness (40%):</strong> Word-by-word comparison between the expected text and your transcript (normalized Arabic). Based on edit distance: the closer your words match the full surah, the higher the score.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">Fluency (35%):</strong> Based on pauses between words. Long pauses (&gt;0.8s) count as hesitation; fewer long pauses mean a higher fluency score.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">Pace (25%):</strong> How close your recitation duration was to the suggested duration for this surah. Closer = higher score.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">Overall:</strong> Weighted average: 40% completeness + 35% fluency + 25% pace.
            </p>
          </div>
        )}
      </div>

      {/* Coach Feedback + Listen */}
      <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-emerald-900 rounded-full shadow-sm">
            <Sparkles className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-100">Coach Feedback</h3>
            <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed italic">
              {data.feedback ? `"${data.feedback}"` : "No feedback available for this session."}
            </p>
            <button
              type="button"
              onClick={playCoach}
              disabled={coachLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {coachLoading ? (
                <>Generating…</>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Listen to coach
                </>
              )}
            </button>
            {coachError && <p className="text-sm text-red-600 dark:text-red-400">{coachError}</p>}
          </div>
        </div>
      </div>

      {/* Your recording (if available) */}
      {recordingUrl && (
        <div className="card">
          <h3 className="font-bold text-lg mb-2">Your recording</h3>
          <audio ref={recordingRef} src={recordingUrl} controls className="w-full" />
        </div>
      )}

      {/* Hotspots */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Areas for Improvement
        </h3>
        {hotspots.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
            No major issues detected. Great job!
          </div>
        ) : (
          hotspots.map((h: any, i: number) => (
            <div key={i} className="card flex items-start justify-between gap-4 group hover:border-emerald-500/30 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${h.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : h.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    {h.type.replace(/_/g, ' ')}
                  </span>
                  {h.verseNumber != null && <span className="text-xs text-zinc-400">Verse {h.verseNumber}</span>}
                </div>
                <p className="font-medium text-zinc-700 dark:text-zinc-200">{h.description}</p>
                {h.expectedSnippet && (
                  <p className="text-sm mt-2 text-zinc-500">
                    Expected: <span className="font-arabic text-emerald-600 dark:text-emerald-400">{h.expectedSnippet}</span>
                  </p>
                )}
              </div>
              {recordingUrl && (h.startMs != null || h.endMs != null) ? (
                <button
                  type="button"
                  onClick={() => playHotspot(h, i)}
                  className="flex-shrink-0 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-emerald-600 transition-colors"
                  title="Play this part"
                >
                  <PlayCircle className={`w-6 h-6 ${playingHotspot === i ? 'text-emerald-600' : ''}`} />
                </button>
              ) : (
                <span className="flex-shrink-0 p-2 text-zinc-300 dark:text-zinc-600" title="No timestamp for this issue">
                  <PlayCircle className="w-6 h-6" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
