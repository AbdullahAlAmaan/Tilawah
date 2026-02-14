import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { AnalysisResult, Hotspot } from "./analysis";

const DB_PATH = path.join(process.cwd(), "data", "reciteflow.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        surah_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        duration_ms INTEGER NOT NULL,
        completeness INTEGER NOT NULL,
        fluency INTEGER NOT NULL,
        pace INTEGER NOT NULL,
        overall INTEGER NOT NULL,
        transcript TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        hotspots_json TEXT NOT NULL,
        playback_enabled INTEGER NOT NULL DEFAULT 0,
        feedback TEXT
      )
    `);
    try {
      db.exec("ALTER TABLE sessions ADD COLUMN feedback TEXT");
    } catch {
      // Column already exists (new schema or already migrated)
    }
  }
  return db;
}

export interface SessionRecord {
  id: string;
  surahId: string;
  createdAt: string;
  durationMs: number;
  completeness: number;
  fluency: number;
  pace: number;
  overall: number;
  transcript: string;
  wordCount: number;
  hotspots: Hotspot[];
  playbackEnabled: boolean;
  feedback?: string | null;
}

function mapRow(row: Record<string, unknown>): SessionRecord {
  return {
    id: row.id as string,
    surahId: row.surah_id as string,
    createdAt: row.created_at as string,
    durationMs: row.duration_ms as number,
    completeness: row.completeness as number,
    fluency: row.fluency as number,
    pace: row.pace as number,
    overall: row.overall as number,
    transcript: row.transcript as string,
    wordCount: row.word_count as number,
    hotspots: JSON.parse(row.hotspots_json as string),
    playbackEnabled: (row.playback_enabled as number) === 1,
    feedback: (row.feedback as string | null) ?? undefined,
  };
}

export function saveSession(result: AnalysisResult, playbackEnabled = false, feedback?: string | null): void {
  const d = getDb();
  d.prepare(
    `INSERT INTO sessions (id, surah_id, duration_ms, completeness, fluency, pace, overall, transcript, word_count, hotspots_json, playback_enabled, feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(result.sessionId, result.surahId, result.durationMs, result.completeness, result.fluency, result.pace, result.overall, result.transcript, result.wordCount, JSON.stringify(result.hotspots), playbackEnabled ? 1 : 0, feedback ?? null);
}

export function getSession(id: string): SessionRecord | null {
  const row = getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapRow(row) : null;
}

export function listSessions(limit = 50): SessionRecord[] {
  const rows = getDb().prepare("SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?").all(limit) as Record<string, unknown>[];
  return rows.map(mapRow);
}

export function getSessionsBySurah(surahId: string, limit = 20): SessionRecord[] {
  const rows = getDb().prepare("SELECT * FROM sessions WHERE surah_id = ? ORDER BY created_at DESC LIMIT ?").all(surahId, limit) as Record<string, unknown>[];
  return rows.map(mapRow);
}
