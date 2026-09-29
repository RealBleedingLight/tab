"use client";
import { useMemo } from "react";
import Fretboard from "@/components/Fretboard";
import { getFretboardPositions, pitchClassToName, type FretboardPosition } from "@/lib/engine";
import { chordAt, chordsInBars, guideFor, progressionLabel, type HarmonyAnalysis } from "@/lib/song/harmony";
import type { SongModel } from "@/lib/song/types";
import { usePlayer, type ScorePlayer } from "@/lib/alphatab/player";

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * The fretboard follows the music. While playing it shows the bar being
 * played: the frets the solo uses there, the chord underneath (blue rings)
 * and the scale that fits that chord (small dots). When stopped it shows the
 * selected bars.
 */
export default function LiveFretboard({ song, harmony, player, bars }: {
  song: SongModel; harmony: HarmonyAnalysis; player: ScorePlayer; bars: [number, number];
}) {
  const active = usePlayer(player, s => s.activeNotes);
  const range = usePlayer(player, s => s.range);
  const playing = usePlayer(player, s => s.playing);
  const currentBar = usePlayer(player, s => s.currentBar);
  const currentTick = usePlayer(player, s => s.currentTick);
  const [rs, re] = range ?? bars;
  // Follow playback one bar at a time; otherwise show the selection.
  const [s, e] = playing ? [currentBar, currentBar] : [rs, re];

  const chord = playing
    ? chordAt(harmony, currentBar, currentTick)
    : (() => { const cs = chordsInBars(harmony, s, e); return new Set(cs.map(c => c.symbol)).size === 1 ? cs[0] : null; })();
  const guide = guideFor(harmony, chord);
  const chordKey = chord ? `${chord.symbol}@${chord.start}` : "none";

  // Frets played in the window (+ the whole selection's fret span for a stable view while playing).
  const { positions, fretRange } = useMemo(() => {
    const n = song.tuning.length;
    const seen = new Map<string, FretboardPosition>();
    const rootPc = guide ? guide.rootPc : harmony.key.rootPc;
    for (const bar of song.bars.slice(s, e + 1)) for (const beat of bar.beats) for (const note of beat.notes) {
      const string = n - note.string; // engine (1 = high) → fretboard (0 = low)
      const k = `${string}:${note.fret}`;
      if (!seen.has(k)) seen.set(k, { string, fret: note.fret, note: pitchClassToName(note.midi), isRoot: note.midi % 12 === rootPc });
    }
    const spanFrets: number[] = [];
    for (const bar of song.bars.slice(Math.min(s, rs), Math.max(e, re) + 1)) for (const beat of bar.beats) for (const note of beat.notes) spanFrets.push(note.fret);
    const fretted = spanFrets.filter(f => f > 0);
    const minF = fretted.length ? Math.min(...fretted) : 0;
    const maxF = fretted.length ? Math.max(...fretted) : 12;
    const lo = spanFrets.includes(0) ? 0 : Math.max(0, minF - 2);
    const hi = Math.min(24, Math.max(maxF + 2, lo + 12));
    return { positions: [...seen.values()], fretRange: [lo, hi] as [number, number] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, s, e, rs, re, chordKey, harmony]);

  const scalePcs = guide ? guide.scale.pcs : harmony.key.pcs;
  const scaleRoot = guide ? guide.rootPc : harmony.key.rootPc;
  const scale = useMemo(
    () => getFretboardPositions(scalePcs.map(pc => SHARPS[pc]), SHARPS[scaleRoot], song.tuning, fretRange),
    [scalePcs, scaleRoot, song.tuning, fretRange],
  );

  const barsText = s === e ? `Bar ${s + 1}` : `Bars ${s + 1}–${e + 1}`;
  const progression = !playing && !guide ? progressionLabel(chordsInBars(harmony, s, e)) : "";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur px-3 pt-2 pb-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
          <span className="text-zinc-500">{barsText}</span>
          {guide ? (
            <>
              <span className="text-base font-semibold text-sky-300">{guide.symbol}
                <span className="ml-1 text-xs font-normal text-zinc-500">{guide.numeral}{harmony.source === "implied" ? " · implied" : ""}</span>
              </span>
              <span className="text-zinc-300">Scale: <b className="font-medium">{guide.scale.root} {guide.scale.name}</b></span>
              <span className="text-zinc-400">Target: {guide.targets.slice(0, 3).map(t => `${t.note} (${t.role})`).join(" · ")}</span>
            </>
          ) : (
            <>
              {progression && <span className="text-sky-300 font-medium">{progression}</span>}
              <span className="text-zinc-300">Scale: <b className="font-medium">{harmony.key.name}</b></span>
            </>
          )}
        </div>
        <span className="text-zinc-500 whitespace-nowrap">
          <span className="inline-block w-2 h-2 rounded-full bg-zinc-100 mr-1" />root
          <span className="inline-block w-2 h-2 rounded-full border border-sky-400 ml-2 mr-1" />chord
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2 mr-1" />now
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <Fretboard
            positions={positions} scale={scale} chordPcs={chord?.pcs}
            fretRange={fretRange} active={active} stringCount={song.tuning.length} tuning={song.tuning}
            compact className="w-full max-h-44"
          />
        </div>
      </div>
    </div>
  );
}
