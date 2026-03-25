import type {
  Song, ScaleResult, ChordResult, KeyResult,
  KeyMatch, ScaleSuggestion, IntervalResult,
  QueueFile, JobStatus, SaveProgressRequest,
  LessonFile, ContextFile,
} from "@/lib/types";

const backend = () =>
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${backend()}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${backend()}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${backend()}${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
    // No Content-Type header — browser sets it with boundary automatically
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const api = {
  // Auth
  login: (pin: string) => post<{ token: string }>("/auth/login", { pin }),
  verify: () => get<{ status: string }>("/auth/verify"),

  // Songs
  listSongs: () => get<{ songs: Song[] }>("/songs"),
  getContext: (artist: string, song: string) =>
    get<ContextFile>(`/songs/${artist}/${song}/context`),
  getLesson: (artist: string, song: string, number: number) =>
    get<LessonFile>(`/songs/${artist}/${song}/lessons/${number}`),
  saveProgress: (artist: string, song: string, req: SaveProgressRequest) =>
    post<{ status: string }>(`/songs/${artist}/${song}/save-progress`, req),

  // Theory
  getScale: (root: string, scaleType: string) =>
    get<ScaleResult>(`/theory/scale/${root}/${scaleType}`),
  getChord: (name: string) =>
    get<ChordResult>(`/theory/chord/${name}`),
  getKey: (root: string, scaleType: string) =>
    get<KeyResult>(`/theory/key/${root}/${scaleType}`),
  identifyKey: (notes: string[]) =>
    get<{ matches: KeyMatch[] }>(`/theory/identify-key?${notes.map(n => `notes=${n}`).join("&")}`),
  suggestScales: (chords: string[]) =>
    get<{ suggestions: ScaleSuggestion[] }>(`/theory/suggest-scales?${chords.map(c => `chords=${c}`).join("&")}`),
  getInterval: (note1: string, note2: string) =>
    get<IntervalResult>(`/theory/interval/${note1}/${note2}`),

  // Queue
  listQueue: () => get<{ files: QueueFile[] }>("/queue"),
  uploadToQueue: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return postForm<{ status: string; filename: string }>("/queue/upload", form);
  },
  processFile: (filename: string, model?: string, order = "difficulty") =>
    post<{ job_id: string; status: string }>(`/queue/process/${encodeURIComponent(filename)}`, { model, order }),
  getJobStatus: (jobId: string) =>
    get<JobStatus>(`/queue/status/${jobId}`),
};
