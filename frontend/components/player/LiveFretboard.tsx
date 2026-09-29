"use client";
import { useMemo } from "react";
import Fretboard from "@/components/Fretboard";
import { noteToPitchClass, pitchClassToName, type FretboardPosition } from "@/lib/engine";
import { analyzeRange, keyLabel } from "@/lib/song/analysis";
import type { SongModel } from "@/lib/song/types";
import { usePlayer, type ScorePlayer } from "@/lib/alphatab/player";

/**
 * Shows the notes of the bars being practiced on a fretboard, and lights up
 * whatever is sounding during playback so you can see where to put your fingers.
 */
export default function LiveFretboard({ song, player, bars }: { song: SongModel; player: ScorePlayer; bars: [number, number] }) {
  const active = usePlayer(player, s => s.activeNotes);
  const range = usePlayer(player, s => s.range);
  const [s, e] = range ?? bars;

  const { positions, fretRange, label } = useMemo(() => {
    const a = analyzeRange(song, s, e);
    const root = a.keyMatches[0]?.root;
    const rootPc = root ? noteToPitchClass(root) : -1;
    const n = song.tuning.length;
    // Exactly the frets played in these bars — where your fingers actually go.
    const seen = new Map<string, FretboardPosition>();
    for (const bar of song.bars.slice(s, e + 1)) for (const beat of bar.beats) for (const note of beat.notes) {
      const string = n - note.string; // engine (1 = high) → fretboard (0 = low)
      const k = `${string}:${note.fret}`;
      if (!seen.has(k)) seen.set(k, { string, fret: note.fret, note: pitchClassToName(note.midi), isRoot: note.midi % 12 === rootPc });
    }
    const hasOpen = [...seen.values()].some(p => p.fret === 0);
    const lo = hasOpen ? 0 : Math.max(0, a.fretRange[0] - 1);
    const hi = Math.min(24, Math.max(a.fretRange[1] + 1, lo + 11));
    return {
      positions: [...seen.values()],
      fretRange: [lo, hi] as [number, number],
      label: `${s === e ? `Bar ${s + 1}` : `Bars ${s + 1}–${e + 1}`} · ${keyLabel(a)}`,
    };
  }, [song, s, e]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur px-3 pt-2 pb-1">
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>{label}</span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-zinc-100 mr-1" />root
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2 mr-1" />playing now
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <Fretboard positions={positions} fretRange={fretRange} active={active} stringCount={song.tuning.length} tuning={song.tuning} compact className="w-full max-h-40" />
        </div>
      </div>
    </div>
  );
}
