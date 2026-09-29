"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import UploadDropzone from "@/components/UploadDropzone";
import { deleteSong, listProgress, listSongs, type SongMeta, type SongProgress } from "@/lib/storage/library";
import { formatDuration } from "@/components/learn/bits";
import { DEMO_ID } from "@/lib/song/demo";

const FEATURES = [
  { title: "See & hear the tab", text: "Rendered tab (and notation) with synced playback and a cursor that follows along." },
  { title: "Slow it down, loop it", text: "25–150% speed without pitch change, loop any bars, metronome and count-in." },
  { title: "A lesson plan for every song", text: "Split into bite-sized chunks, ordered warm-ups for the techniques it uses, then speed-trainer drills." },
  { title: "Live fretboard", text: "Watch exactly where each note is played, with the key's notes mapped around it." },
];

export default function HomePage() {
  const [songs, setSongs] = useState<SongMeta[] | null>(null);
  const [progress, setProgress] = useState<SongProgress[]>([]);

  const refresh = useCallback(() => {
    Promise.all([listSongs(), listProgress()])
      .then(([s, p]) => { setSongs(s); setProgress(p); })
      .catch(() => setSongs([]));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function remove(id: string, title: string) {
    if (!confirm(`Remove "${title}" and its practice progress from this browser?`)) return;
    await deleteSong(id).catch(() => {});
    refresh();
  }

  function stats(id: string) {
    const ps = progress.filter(p => p.songId === id);
    const done = ps.reduce((n, p) => n + Object.values(p.lessons).filter(l => l.done).length, 0);
    const seconds = ps.reduce((n, p) => n + p.totalSeconds, 0);
    return { done, seconds };
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      <section className="space-y-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Learn any solo from its tab.</h1>
          <p className="text-zinc-400 mt-2 max-w-xl">
            Open a Guitar Pro file and get the tab with playback, a step-by-step lesson plan, a speed trainer
            and a live fretboard. Everything runs in your browser — files never leave your device.
          </p>
        </div>
        <UploadDropzone onAdded={refresh} />
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/song?id=${DEMO_ID}`} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
            ▶ Try the demo lesson
          </Link>
          <Link href="/tab" className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors">
            Paste ASCII tab instead
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your library</h2>
        {songs === null ? (
          <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
        ) : songs.length === 0 ? (
          <p className="text-sm text-zinc-500">Songs you open are saved here (in this browser) with your practice progress.</p>
        ) : (
          <ul className="space-y-2">
            {songs.map(s => {
              const st = stats(s.id);
              return (
                <li key={s.id} className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-colors">
                  <Link href={`/song?id=${encodeURIComponent(s.id)}`} className="flex-1 min-w-0 p-4">
                    <div className="font-medium truncate">{s.title}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {[s.artist, `${s.bars} bars`, `${s.trackCount} track${s.trackCount === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}
                      {st.done > 0 && ` · ${st.done} lesson${st.done === 1 ? "" : "s"} done`}
                      {st.seconds > 0 && ` · ${formatDuration(st.seconds)} practiced`}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(s.id, s.title)}
                    className="mr-3 px-2 py-1 text-xs text-zinc-500 hover:text-red-400 opacity-60 group-hover:opacity-100"
                    aria-label={`Remove ${s.title}`}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        {FEATURES.map(f => (
          <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="font-medium">{f.title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="text-xs text-zinc-600 space-y-1 pb-8">
        <p>Shortcuts in the player: <kbd>Space</kbd> play/pause · <kbd>[</kbd> <kbd>]</kbd> speed · <kbd>L</kbd> loop · <kbd>M</kbd> metronome.</p>
        <p>Tab rendering &amp; playback by alphaTab (MPL-2.0). No account, no server — your library lives in this browser.</p>
      </footer>
    </div>
  );
}
