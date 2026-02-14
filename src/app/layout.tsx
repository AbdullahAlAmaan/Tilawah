import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReciteFlow — Voice Recitation Coach",
  description: "Voice-first Quran recitation practice with AI feedback. Ramadan Edition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              ReciteFlow
            </Link>
            <div className="flex gap-4 text-sm text-zinc-500">
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Home
              </Link>
              <Link href="/history" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                History
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="text-center text-xs text-zinc-500 py-6 border-t border-zinc-200 dark:border-zinc-800">
          ReciteFlow — Powered by smallest.ai STT & TTS
        </footer>
      </body>
    </html>
  );
}
