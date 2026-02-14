import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "reciteflow-audio";
const STORE = "recordings";

async function getAudioDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "sessionId" });
      }
    },
  });
}

export async function storeRecording(sessionId: string, blob: Blob): Promise<void> {
  const db = await getAudioDb();
  await db.put(STORE, { sessionId, blob, createdAt: new Date().toISOString() });
}

export async function getRecording(sessionId: string): Promise<Blob | null> {
  const db = await getAudioDb();
  const rec = await db.get(STORE, sessionId);
  return rec?.blob ?? null;
}

export async function deleteRecording(sessionId: string): Promise<void> {
  const db = await getAudioDb();
  await db.delete(STORE, sessionId);
}

export function playSegment(blob: Blob, startMs: number, endMs: number) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.currentTime = startMs / 1000;

  const onTime = () => {
    if (audio.currentTime >= endMs / 1000) {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
    }
  };
  audio.addEventListener("timeupdate", onTime);
  audio.play();

  return {
    audio,
    stop: () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      URL.revokeObjectURL(url);
    },
  };
}

export function getClipBounds(startMs: number, endMs: number, totalMs: number, pad = 2000) {
  return { startMs: Math.max(0, startMs - pad), endMs: Math.min(totalMs, endMs + pad) };
}
