"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function parseContext(raw: string): {
  currentLesson: number;
  totalLessons: number;
  tempo: string;
  stuckPoints: string;
} {
  return {
    currentLesson: parseInt(raw.match(/current_lesson:\s*(\d+)/)?.[1] ?? "1"),
    totalLessons: parseInt(raw.match(/total_lessons:\s*(\d+)/)?.[1] ?? "0"),
    tempo: raw.match(/tempo:\s*(.+)/)?.[1]?.trim() ?? "",
    stuckPoints: raw.match(/stuck_points?:\s*(.+)/)?.[1]?.trim() ?? "",
  };
}

export default function SongOverviewPage() {
  const { artist, song } = useParams<{ artist: string; song: string }>();
  const [context, setContext] = useState<ReturnType<typeof parseContext> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getContext(artist, song)
      .then(ctx => setContext(parseContext(ctx.content)))
      .catch(() => setError("Song not found or backend unavailable."))
      .finally(() => setLoading(false));
  }, [artist, song]);

  if (loading) return <div className="text-zinc-500 text-sm animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;

  const songName = song.replace(/-/g, " ");
  const artistName = artist.replace(/-/g, " ");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold capitalize">{songName}</h1>
        <p className="text-zinc-500 capitalize">{artistName}</p>
      </div>

      {context && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Current lesson</span>
            <span className="font-mono">{context.currentLesson} / {context.totalLessons}</span>
          </div>
          {context.tempo && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Tempo</span>
              <span className="font-mono">{context.tempo}</span>
            </div>
          )}
          {context.stuckPoints && (
            <div className="text-sm">
              <span className="text-zinc-400">Stuck on: </span>
              <span className="text-zinc-300">{context.stuckPoints}</span>
            </div>
          )}
        </div>
      )}

      <Link
        href={`/practice/${artist}/${song}`}
        className="block w-full py-4 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-center font-medium transition-colors"
      >
        Practice — Lesson {context?.currentLesson ?? 1}
      </Link>
    </div>
  );
}
