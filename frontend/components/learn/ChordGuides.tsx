"use client";
import { useState } from "react";
import type { ChordGuide, HarmonyAnalysis } from "@/lib/song/harmony";

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

export function ChordGuideCard({ g, keyPcs }: { g: ChordGuide; keyPcs: number[] }) {
  const keySet = new Set(keyPcs);
  const altered = g.scale.pcs.filter(pc => !keySet.has(pc));
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 space-y-2 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold text-sky-300">
          {g.symbol} <span className="text-xs font-normal text-zinc-500">{g.numeral}</span>
        </span>
        {g.usage && (
          <span className="text-[11px] text-zinc-500" title="How the solo uses this chord">
            solo: {pct(g.usage.chordTone)} chord tones · {pct(g.usage.outside)} outside
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {g.chordTones.map(t => (
          <span key={t.note} className="px-1.5 py-0.5 rounded border border-sky-500/40 text-sky-200 text-xs font-mono">
            {t.note} <span className="text-sky-400/60">{t.role}</span>
          </span>
        ))}
      </div>
      <p className="text-zinc-300">
        <span className="text-zinc-500">Play:</span> <b className="font-medium">{g.scale.root} {g.scale.name}</b>
        {altered.length > 0 && <span className="text-amber-300/90"> (note the {altered.map(pc => SHARPS[pc]).join(", ")})</span>}
        <span className="block text-xs text-zinc-500 mt-0.5">Why: {g.scale.why}.</span>
      </p>
      <p className="text-zinc-400 text-xs">
        Simpler option: {g.pentatonic.root} {g.pentatonic.name} · Target on strong beats: {g.targets.map(t => `${t.note} (${t.role})`).join(", ")}
      </p>
      {g.usage?.favourite && g.usage.notes >= 3 && (
        <p className="text-xs text-zinc-400">
          The solo&apos;s favourite landing note here is <b className="text-zinc-200">{g.usage.favourite.note}</b> — the {g.usage.favourite.role}.
        </p>
      )}
    </div>
  );
}

export function ChordGuideList({ guides, harmony, initiallyOpen = 3 }: { guides: ChordGuide[]; harmony: HarmonyAnalysis; initiallyOpen?: number }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? guides : guides.slice(0, initiallyOpen);
  return (
    <div className="space-y-2">
      {shown.map(g => <ChordGuideCard key={g.symbol} g={g} keyPcs={harmony.key.pcs} />)}
      {guides.length > initiallyOpen && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="text-xs text-zinc-400 hover:text-zinc-200 underline">
          {showAll ? "Show fewer" : `Show all ${guides.length} chords`}
        </button>
      )}
    </div>
  );
}

export function sourceNote(h: HarmonyAnalysis) {
  if (h.source === "symbol") return "From the chord symbols in the file.";
  if (h.source === "accompaniment") return "Detected from the backing tracks (rhythm guitar, bass…).";
  if (h.source === "implied") return "This file has only the solo, so chords are implied from the melody — treat them as a guide.";
  return "";
}
