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
  const cur = raw.match(/current_lesson:\s*(\d+)/)?.[1];
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
              <Link
                href={`/practice/${song.artist}/${song.song}`}
                className="text-sm px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors shrink-0 ml-4"
              >
                Lesson {song.currentLesson}
              </Link>
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
