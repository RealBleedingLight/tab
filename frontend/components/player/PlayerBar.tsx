"use client";
import { useEffect, useState } from "react";
import { usePlayer, type ScorePlayer } from "@/lib/alphatab/player";

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Toggle({ on, onClick, label, title }: { on: boolean; onClick: () => void; label: string; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={on}
      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
        on ? "bg-amber-500/15 border-amber-500/50 text-amber-300" : "border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}

export default function PlayerBar({ player, tempo }: { player: ScorePlayer; tempo: number }) {
  const soundReady = usePlayer(player, s => s.soundReady);
  const playing = usePlayer(player, s => s.playing);
  const currentTime = usePlayer(player, s => s.currentTime);
  const endTime = usePlayer(player, s => s.endTime);
  const speed = usePlayer(player, s => s.speed);
  const looping = usePlayer(player, s => s.looping);
  const metronome = usePlayer(player, s => s.metronome);
  const countIn = usePlayer(player, s => s.countIn);
  const range = usePlayer(player, s => s.range);
  const loops = usePlayer(player, s => s.loops);
  const trainer = usePlayer(player, s => s.trainer);
  const guitarMuted = usePlayer(player, s => s.guitarMuted);
  const guitarSolo = usePlayer(player, s => s.guitarSolo);
  const notation = usePlayer(player, s => s.notation);
  const [more, setMore] = useState(false);

  // Keyboard shortcuts: space = play/pause, [ ] = speed, L = loop, M = metronome.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = player.getSnapshot();
      if (e.code === "Space") { e.preventDefault(); player.playPause(); }
      else if (e.key === "[") player.setSpeed(s.speed - 5);
      else if (e.key === "]") player.setSpeed(s.speed + 5);
      else if (e.key === "l" || e.key === "L") player.setLooping(!s.looping);
      else if (e.key === "m" || e.key === "M") player.setMetronome(!s.metronome);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  const bpm = Math.round((tempo * speed) / 100);

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Transport */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => player.playPause()}
            disabled={!soundReady}
            className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-zinc-950 flex items-center justify-center transition-colors"
            aria-label={playing ? "Pause" : "Play"}
            title={soundReady ? "Play / pause (space)" : "Loading sounds…"}
          >
            {!soundReady ? (
              <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : playing ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1" /><rect x="9" y="2" width="4" height="12" rx="1" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11a.5.5 0 0 0 .77.42l8.5-5.5a.5.5 0 0 0 0-.84l-8.5-5.5A.5.5 0 0 0 4 2.5Z" /></svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => player.stop()}
            className="w-9 h-9 rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 flex items-center justify-center"
            aria-label="Stop"
            title="Stop (back to start)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect width="12" height="12" rx="2" /></svg>
          </button>
          <span className="font-mono text-xs text-zinc-400 tabular-nums w-20">
            {fmt(currentTime)} / {fmt(endTime)}
          </span>
          <button
            type="button"
            onClick={() => setMore(!more)}
            aria-expanded={more}
            className="sm:hidden ml-auto px-2.5 py-1.5 rounded-md border border-zinc-700 text-xs text-zinc-300"
          >
            {more ? "Less" : "Options"}
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <button type="button" onClick={() => player.setSpeed(speed - 5)} className="w-7 h-7 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500" aria-label="Slower" title="Slower ( [ )">−</button>
          <input
            type="range" min={25} max={150} step={5} value={speed}
            onChange={e => player.setSpeed(Number(e.target.value))}
            className="flex-1 accent-amber-500"
            aria-label="Playback speed"
          />
          <button type="button" onClick={() => player.setSpeed(speed + 5)} className="w-7 h-7 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500" aria-label="Faster" title="Faster ( ] )">+</button>
          <div className="text-right w-20 leading-tight">
            <div className="text-sm font-semibold tabular-nums">{speed}%</div>
            <div className="text-[10px] text-zinc-500 tabular-nums">{bpm} BPM</div>
          </div>
        </div>

        {/* Loop status */}
        <div className="flex items-center gap-2 text-xs">
          <Toggle on={looping} onClick={() => player.setLooping(!looping)} label="Loop" title="Loop the selection (L)" />
          {range ? (
            <span className="text-zinc-400">
              {range[0] === range[1] ? `Bar ${range[0] + 1}` : `Bars ${range[0] + 1}–${range[1] + 1}`}
              {looping && loops > 0 && <span className="text-zinc-500"> · {loops} loop{loops === 1 ? "" : "s"}</span>}
              <button type="button" onClick={() => player.clearRange()} className="ml-1 text-zinc-500 hover:text-zinc-200" aria-label="Clear selection">×</button>
            </span>
          ) : (
            <span className="text-zinc-600 hidden sm:inline">Drag across the tab to select bars</span>
          )}
          {trainer && (
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" title="Speed trainer">
              Trainer → {trainer.targetSpeed}%
              <button type="button" onClick={() => player.setTrainer(null)} className="ml-1 text-emerald-400/70 hover:text-emerald-200" aria-label="Stop trainer">×</button>
            </span>
          )}
        </div>

        {/* Options */}
        <div className={`${more ? "flex" : "hidden"} sm:flex items-center gap-1.5 flex-wrap`}>
          <Toggle on={metronome} onClick={() => player.setMetronome(!metronome)} label="Click" title="Metronome (M)" />
          <Toggle on={countIn} onClick={() => player.setCountIn(!countIn)} label="Count-in" title="One-bar count-in before playing" />
          <Toggle on={guitarSolo} onClick={() => player.setGuitarSolo(!guitarSolo)} label="Solo part" title="Hear only this guitar part" />
          <Toggle on={guitarMuted} onClick={() => player.setGuitarMuted(!guitarMuted)} label="Mute part" title="Mute this part and play it yourself over the backing" />
          <Toggle on={notation} onClick={() => player.setNotation(!notation)} label="Notation" title="Show standard notation above the tab" />
        </div>
      </div>
    </div>
  );
}
