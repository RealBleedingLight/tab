/**
 * Local song library. Everything stays in the browser:
 *   - IndexedDB "songs" store: the original file bytes + metadata
 *   - IndexedDB "progress" store: per-song learning progress
 * No backend, no account.
 */

export interface SongRecord {
  id: string;
  fileName: string;
  title: string;
  artist: string;
  trackCount: number;
  bars: number;
  addedAt: number;
  lastOpenedAt: number;
  size: number;
  data: Uint8Array;
}

export type SongMeta = Omit<SongRecord, "data">;

export interface LessonProgress {
  done: boolean;
  bestSpeed: number;
  checks: number[];
  practicedSeconds: number;
  lastPracticedAt?: number;
}

export interface PracticeLogEntry {
  at: number;
  lessonId: string;
  lessonTitle: string;
  seconds: number;
  speed: number;
}

export interface SongProgress {
  /** `${songId}:${trackIndex}` */
  key: string;
  songId: string;
  trackIndex: number;
  currentLessonId: string | null;
  lessons: Record<string, LessonProgress>;
  totalSeconds: number;
  log: PracticeLogEntry[];
  updatedAt: number;
}

const DB_NAME = "tab-engine";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("songs")) db.createObjectStore("songs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "id" });
      if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  return openDb().then(db => new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req ? req.result : (undefined as T));
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

/** FNV-1a hash of the file bytes → stable id so re-uploading the same file reuses progress. */
export function hashBytes(data: Uint8Array): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ data.length;
  for (let i = 0; i < data.length; i++) {
    h1 = Math.imul(h1 ^ data[i], 16777619);
    h2 = Math.imul(h2 ^ data[data.length - 1 - i], 2246822519);
  }
  return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)).padEnd(12, "0");
}

export async function saveSong(record: SongRecord): Promise<void> {
  const { data, ...meta } = record;
  // Metadata is stored separately so listing the library never loads file bytes.
  await tx("songs", "readwrite", s => s.put({ id: record.id, data }));
  await tx("meta", "readwrite", s => s.put(meta));
}

export async function listSongs(): Promise<SongMeta[]> {
  const all = await tx<SongMeta[]>("meta", "readonly", s => s.getAll());
  return all.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export async function getSong(id: string): Promise<SongRecord | null> {
  const [meta, blob] = await Promise.all([
    tx<SongMeta | undefined>("meta", "readonly", s => s.get(id)),
    tx<{ id: string; data: Uint8Array } | undefined>("songs", "readonly", s => s.get(id)),
  ]);
  if (!meta || !blob) return null;
  return { ...meta, data: blob.data };
}

export async function touchSong(id: string): Promise<void> {
  const meta = await tx<SongMeta | undefined>("meta", "readonly", s => s.get(id));
  if (meta) await tx("meta", "readwrite", s => s.put({ ...meta, lastOpenedAt: Date.now() }));
}

export async function deleteSong(id: string): Promise<void> {
  await tx("songs", "readwrite", s => s.delete(id));
  await tx("meta", "readwrite", s => s.delete(id));
  const all = await tx<SongProgress[]>("progress", "readonly", s => s.getAll());
  for (const p of all.filter(p => p.songId === id)) await tx("progress", "readwrite", s => s.delete(p.key));
}

export function emptyProgress(songId: string, trackIndex: number): SongProgress {
  return {
    key: `${songId}:${trackIndex}`, songId, trackIndex,
    currentLessonId: null, lessons: {}, totalSeconds: 0, log: [], updatedAt: Date.now(),
  };
}

export async function getProgress(songId: string, trackIndex: number): Promise<SongProgress> {
  const p = await tx<SongProgress | undefined>("progress", "readonly", s => s.get(`${songId}:${trackIndex}`));
  return p ?? emptyProgress(songId, trackIndex);
}

export async function listProgress(): Promise<SongProgress[]> {
  return tx<SongProgress[]>("progress", "readonly", s => s.getAll());
}

export async function saveProgress(p: SongProgress): Promise<void> {
  await tx("progress", "readwrite", s => s.put({ ...p, updatedAt: Date.now() }));
}
