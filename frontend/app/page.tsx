"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Song } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";

interface SongWithProgress extends Song {
  currentLesson: number;
  totalLessons: number;
  lastSession: string | null;
}

function parseContext(raw: string | null): { currentLesson: number; totalLessons: number; lastSession: string | null } {
  if (!raw) return { currentLesson: 1, totalLessons: 0, lastSession: null };
  // Support both formats: "current_lesson: 01" and "- **Current lesson:** 01"
  const cur = (raw.match(/current_lesson:\s*(\d+)/) ?? raw.match(/\*\*Current lesson:\*\*\s*(\d+)/))?.[1];
  const tot = raw.match(/total_lessons:\s*(\d+)/)?.[1];
  const date = raw.match(/last_session:\s*(.+)/)?.[1]?.trim();
  return {
    currentLesson: cur ? parseInt(cur) : 1,
    totalLessons: tot ? parseInt(tot) : 0,
    lastSession: date ?? null,
  };
}

export default function DashboardPage() {
  const [songs, setSongs] = useState<SongWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.listSongs()
      .then(({ songs }) => {
        setSongs(songs.map(s => ({
          ...s,
          ...parseContext(s.context),
        })));
      })
      .catch(() => setError("Could not load songs. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(artist: string, song: string) {
    if (!confirm(`Delete ${artist}/${song}? This cannot be undone.`)) return;
    setDeleting(`${artist}/${song}`);
    try {
      await api.deleteSong(artist, song);
      setSongs(prev => prev.filter(s => !(s.artist === artist && s.song === song)));
    } catch {
      alert("Delete failed. Check backend connection.");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return <div className="text-zinc-500 text-sm animate-pulse">Loading songs...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>

      {songs.length === 0 && (
        <p className="text-zinc-500 text-sm">No songs yet. Drop a GP file in the Queue to get started.</p>
      )}

      <div className="space-y-3">
        {songs.map(song => (
          <div
            key={song.path}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-zinc-100 capitalize">
                  {song.song.replace(/-/g, " ")}
                </p>
                <p className="text-sm text-zinc-500 capitalize">
                  {song.artist.replace(/-/g, " ")}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Link
                  href={`/practice/${song.artist}/${song.song}`}
                  className="text-sm px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  Lesson {song.currentLesson}
                </Link>
                <button
                  onClick={() => handleDelete(song.artist, song.song)}
                  disabled={deleting === `${song.artist}/${song.song}`}
                  className="text-xs px-2 py-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40"
                  title="Delete song"
                >
                  {deleting === `${song.artist}/${song.song}` ? "..." : "Delete"}
                </button>
              </div>
            </div>

            {song.totalLessons > 0 && (
              <ProgressBar
                completed={song.currentLesson - 1}
                total={song.totalLessons}
              />
            )}

            {song.lastSession && (
              <p className="text-xs text-zinc-600">Last session: {song.lastSession}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
