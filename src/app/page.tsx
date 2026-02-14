import Link from 'next/link';
import { surahs } from '@/data/surahs';
import { BookOpen, Mic, PlayCircle } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto flex flex-col items-center justify-center gap-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-700 bg-clip-text text-transparent">
          ReciteFlow
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
          Your personal Quran recitation coach. Select a Surah to verify your pronunciation and fluency.
        </p>
      </div>

      <div className="grid gap-4 w-full">
        {surahs.map((surah) => (
          <Link
            key={surah.id}
            href={`/session?surah=${surah.id}`}
            className="group relative flex items-center justify-between p-6 card hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {surah.number}
              </div>
              <div>
                <h2 className="font-bold text-xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {surah.name}
                </h2>
                <p className="text-sm text-zinc-500">{surah.englishName} • {surah.verseCount} Verses</p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-arabic text-2xl text-zinc-800 dark:text-zinc-100">{surah.arabicName}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-8 text-zinc-400 text-sm">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" />
          <span>Real-time Scoring</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>Instant Feedback</span>
        </div>
        <div className="flex items-center gap-2">
          <PlayCircle className="w-4 h-4" />
          <span>Drill Mode</span>
        </div>
      </div>
    </main>
  );
}
