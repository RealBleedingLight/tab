"use client";
import { useMemo, useState } from "react";
import type { LessonPlan } from "@/lib/song/lessons";
import type { SongModel, TechniqueId } from "@/lib/song/types";
import type { SongProgress } from "@/lib/storage/library";
import { keyLabel } from "@/lib/song/analysis";
import { getFretboardPositions, getScale } from "@/lib/engine";
import Fretboard from "@/components/Fretboard";
import { DIFFICULTY_LABEL, TechniqueChip, TechniqueGuideCard, difficultyBg, formatDuration } from "./bits";

interface Props {
  song: SongModel;
  plan: LessonPlan;
  progress: SongProgress;
  onSelectLesson: (id: string) => void;
}

export default function Insights({ song, plan, progress, onSelectLesson }: Props) {
  const [openTech, setOpenTech] = useState<TechniqueId | null>(null);
  const a = plan.overall;
  const key = a.keyMatches[0];

  const lo = Math.max(0, a.fretRange[0] - 1);
  const hi = Math.min(24, Math.max(a.fretRange[1] + 1, lo + 11));
  // The detected scale laid out over the part of the neck the song uses.
  const positions = useMemo(() => {
    if (!key) return [];
    const scale = getScale(key.root, key.scale.key);
    return scale ? getFretboardPositions(scale.notes, key.root, song.tuning, [lo, hi]) : [];
  }, [key, song.tuning, lo, hi]);

  const sections = plan.regions.flatMap(r => r.sections);
  const totalBars = sections.reduce((n, s) => n + (s.endBar - s.startBar + 1), 0) || 1;
  const done = plan.lessons.filter(l => progress.lessons[l.id]?.done).length;
  const techs = (Object.entries(a.techniques) as [TechniqueId, number][]).sort((x, y) => y[1] - x[1]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Lessons done" value={`${done}/${plan.lessons.length}`} />
          <Stat label="Practiced" value={formatDuration(progress.totalSeconds)} />
          <Stat label="Est. to learn" value={formatDuration(plan.estimatedMinutes * 60)} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <h3 className="font-semibold">Difficulty map</h3>
        <p className="text-xs text-zinc-500">Each block is a practice chunk. Tap one to jump to its lesson.</p>
        <div className="flex h-8 rounded overflow-hidden gap-px bg-zinc-950">
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectLesson(s.id)}
              title={`${s.name} — ${DIFFICULTY_LABEL[s.analysis.difficulty]}`}
              className={`${difficultyBg(s.analysis.difficulty)} relative hover:brightness-125 ${progress.lessons[s.id]?.done ? "opacity-40" : ""}`}
              style={{ width: `${((s.endBar - s.startBar + 1) / totalBars) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>Bar {sections[0] ? sections[0].startBar + 1 : 1}</span>
          <span>Faded = completed</span>
          <span>Bar {sections.length ? sections[sections.length - 1].endBar + 1 : song.bars.length}</span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <h3 className="font-semibold">Key &amp; scale</h3>
        <p className="text-xl font-bold">{keyLabel(a)}</p>
        {key?.scale.character && <p className="text-sm text-zinc-400">{key.scale.character}</p>}
        {key?.outsideNotes.length ? (
          <p className="text-xs text-zinc-500">Notes outside the scale (passing / chromatic): {key.outsideNotes.join(", ")}</p>
        ) : null}
        {a.keyMatches.length > 1 && (
          <p className="text-xs text-zinc-500">
            Also fits: {a.keyMatches.slice(1, 4).map(k => `${k.root} ${k.scale.name}`).join(" · ")}
          </p>
        )}
        {positions.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">{keyLabel(a)} across frets {lo}–{hi} (filled = root)</p>
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <Fretboard positions={positions} fretRange={[lo, hi]} stringCount={song.tuning.length} tuning={song.tuning} />
              </div>
            </div>
          </div>
        )}
        {key?.scale.improvisationTip && <p className="text-sm text-zinc-300 italic">{key.scale.improvisationTip}</p>}
      </div>

      {techs.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <h3 className="font-semibold">Techniques in this part</h3>
          <div className="flex flex-wrap gap-1.5">
            {techs.map(([t, c]) => (
              <TechniqueChip key={t} id={t} count={c} active={openTech === t} onClick={() => setOpenTech(openTech === t ? null : t)} />
            ))}
          </div>
          {openTech && <TechniqueGuideCard id={openTech} />}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
        <h3 className="font-semibold">Details</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-500">Tempo</dt><dd className="tabular-nums">{song.tempo} BPM</dd>
          <dt className="text-zinc-500">Tuning</dt><dd>{song.tuningName} ({song.tuning.join(" ")})</dd>
          <dt className="text-zinc-500">Bars</dt><dd className="tabular-nums">{song.bars.length}</dd>
          <dt className="text-zinc-500">Notes</dt><dd className="tabular-nums">{a.noteCount}</dd>
          <dt className="text-zinc-500">Fret range</dt><dd className="tabular-nums">{a.fretRange[0]}–{a.fretRange[1]}</dd>
          <dt className="text-zinc-500">Peak speed</dt><dd className="tabular-nums">{a.peakNotesPerSecond.toFixed(1)} notes/sec</dd>
        </dl>
      </div>

      {progress.log.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
          <h3 className="font-semibold">Practice log</h3>
          <ul className="text-sm divide-y divide-zinc-800">
            {[...progress.log].reverse().slice(0, 12).map((e, i) => (
              <li key={i} className="py-1.5 flex justify-between gap-2">
                <span className="truncate text-zinc-300">{e.lessonTitle}</span>
                <span className="flex-none text-zinc-500 tabular-nums text-xs">
                  {new Date(e.at).toLocaleDateString()} · {formatDuration(e.seconds)} · {e.speed}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-zinc-500">{label}</div>
    </div>
  );
}
