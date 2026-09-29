"use client";
import { useState } from "react";
import type { Lesson, LessonPlan, PracticeAction } from "@/lib/song/lessons";
import type { LessonProgress, SongProgress } from "@/lib/storage/library";
import type { TechniqueId } from "@/lib/song/types";
import { usePlayer, type ScorePlayer } from "@/lib/alphatab/player";
import { DifficultyDots, TechniqueChip, TechniqueGuideCard, formatDuration } from "./bits";
import { ChordGuideList, sourceNote } from "./ChordGuides";

const KIND_LABEL: Record<Lesson["kind"], string> = {
  overview: "Start here",
  technique: "Technique warm-up",
  section: "Learn a chunk",
  connect: "Connect",
  performance: "Finale",
};

function actionLabel(a: PracticeAction) {
  const bars = a.bars[0] === a.bars[1] ? `bar ${a.bars[0] + 1}` : `bars ${a.bars[0] + 1}–${a.bars[1] + 1}`;
  if (a.trainer) return `Start trainer ${a.speed}% → ${a.trainer.targetSpeed}%`;
  return `${a.loop ? "Loop" : "Play"} ${bars} at ${a.speed}%`;
}

/** Render with `key={lesson.id}` so per-lesson UI state resets on navigation. */
interface Props {
  plan: LessonPlan;
  lesson: Lesson;
  progress: SongProgress;
  player: ScorePlayer;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<LessonProgress>) => void;
}

export default function LessonPanel({ plan, lesson, progress, player, onSelect, onUpdate }: Props) {
  const [openTech, setOpenTech] = useState<TechniqueId | null>(null);
  const playing = usePlayer(player, s => s.playing);
  const range = usePlayer(player, s => s.range);

  const lp = progress.lessons[lesson.id];
  const checks = new Set(lp?.checks ?? []);
  const index = plan.lessons.findIndex(l => l.id === lesson.id);
  const prev = plan.lessons[index - 1];
  const next = plan.lessons[index + 1];
  const best = lp?.bestSpeed ?? 0;
  const activeRange = range && range[0] === lesson.bars[0] && range[1] === lesson.bars[1];

  function toggleCheck(i: number) {
    const set = new Set(checks);
    if (set.has(i)) set.delete(i); else set.add(i);
    onUpdate(lesson.id, { checks: [...set].sort() });
  }

  function complete() {
    onUpdate(lesson.id, { done: true });
    if (next) onSelect(next.id);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
            {KIND_LABEL[lesson.kind]} · {index + 1}/{plan.lessons.length}
          </span>
          <DifficultyDots value={lesson.difficulty} showLabel />
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-snug">{lesson.title}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{lesson.summary}</p>
        </div>

        {lesson.techniques.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {lesson.techniques.map(t => (
                <TechniqueChip key={t} id={t} active={openTech === t} onClick={() => setOpenTech(openTech === t ? null : t)} />
              ))}
            </div>
            {openTech && <TechniqueGuideCard id={openTech} />}
          </div>
        )}

        {lesson.chords && lesson.chords.length > 0 && (
          <details className="group rounded-lg border border-sky-900/60 bg-sky-950/20 p-3" open={lesson.kind === "section"}>
            <summary className="cursor-pointer list-none flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-sky-200">Harmony &amp; what to play</span>
              <span className="text-xs text-zinc-500 truncate">{lesson.progression}</span>
            </summary>
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-zinc-500">{sourceNote(plan.harmony)} Key: {plan.harmony.key.name}.</p>
              <ChordGuideList guides={lesson.chords} harmony={plan.harmony} initiallyOpen={lesson.kind === "section" ? 4 : 2} />
            </div>
          </details>
        )}

        <ol className="space-y-2.5">
          {lesson.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex-none w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
              <div className="space-y-1.5 min-w-0">
                <p className="text-zinc-200">{step.text}</p>
                {step.action && (
                  <button
                    type="button"
                    onClick={() => {
                      const a = step.action!;
                      player.practice(a.bars, a.speed, a.loop, a.trainer ?? null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-200 hover:bg-amber-500/25 text-xs font-medium"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11a.5.5 0 0 0 .77.42l8.5-5.5a.5.5 0 0 0 0-.84l-8.5-5.5A.5.5 0 0 0 4 2.5Z" /></svg>
                    {actionLabel(step.action)}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>

        {lesson.kind !== "overview" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Best clean speed</span>
              <span className="tabular-nums">{best ? `${best}%` : "—"} / {lesson.targetSpeed}%</span>
            </div>
            <div className="h-1.5 rounded bg-zinc-800 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (best / lesson.targetSpeed) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-zinc-500">
              Each completed loop of this lesson&apos;s bars records its speed{activeRange && playing ? " — recording now" : ""}.
              {lp?.practicedSeconds ? ` Practiced ${formatDuration(lp.practicedSeconds)}.` : ""}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Checkpoint — be honest</p>
          {lesson.checklist.map((c, i) => (
            <label key={i} className="flex items-start gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={checks.has(i)} onChange={() => toggleCheck(i)} className="mt-0.5 accent-emerald-500" />
              <span>{c}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button type="button" disabled={!prev} onClick={() => prev && onSelect(prev.id)} className="px-3 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 disabled:opacity-40 hover:border-zinc-500">
            ← Prev
          </button>
          {lp?.done ? (
            <button type="button" onClick={() => onUpdate(lesson.id, { done: false })} className="flex-1 py-2 rounded-lg border border-emerald-600/60 text-emerald-300 text-sm">
              ✓ Completed — undo
            </button>
          ) : (
            <button
              type="button"
              onClick={complete}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                checks.size >= lesson.checklist.length ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              }`}
            >
              Mark complete{next ? " & next →" : ""}
            </button>
          )}
          <button type="button" disabled={!next} onClick={() => next && onSelect(next.id)} className="px-3 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 disabled:opacity-40 hover:border-zinc-500">
            Next →
          </button>
        </div>
      </div>

      <LessonList plan={plan} progress={progress} currentId={lesson.id} onSelect={onSelect} />
    </div>
  );
}

function LessonRow({ l, progress, current, onSelect }: { l: Lesson; progress: SongProgress; current: boolean; onSelect: (id: string) => void }) {
  const lp = progress.lessons[l.id];
  return (
    <button
      type="button"
      onClick={() => onSelect(l.id)}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
        current ? "bg-zinc-800 text-white" : "hover:bg-zinc-800/60 text-zinc-300"
      }`}
    >
      <span className={`flex-none w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
        lp?.done ? "bg-emerald-500 border-emerald-500 text-zinc-950" : current ? "border-amber-400" : "border-zinc-600"
      }`}>
        {lp?.done ? "✓" : ""}
      </span>
      <span className="flex-1 truncate">{l.title}</span>
      {lp?.bestSpeed ? <span className="text-[10px] text-zinc-500 tabular-nums">{lp.bestSpeed}%</span> : null}
      <DifficultyDots value={l.difficulty} />
    </button>
  );
}

function LessonList({ plan, progress, currentId, onSelect }: { plan: LessonPlan; progress: SongProgress; currentId: string; onSelect: (id: string) => void }) {
  const groups: { title: string; lessons: Lesson[] }[] = [];
  const intro = plan.lessons.filter(l => l.kind === "overview" || l.kind === "technique");
  if (intro.length) groups.push({ title: "Getting started", lessons: intro });
  for (const r of plan.regions) {
    const ls = plan.lessons.filter(l => (l.kind === "section" || l.kind === "connect") && l.bars[0] >= r.startBar && l.bars[1] <= r.endBar);
    if (ls.length) groups.push({ title: r.name, lessons: ls });
  }
  groups.push({ title: "Finale", lessons: plan.lessons.filter(l => l.kind === "performance") });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2">
      {groups.map(g => {
        const done = g.lessons.filter(l => progress.lessons[l.id]?.done).length;
        return (
          <div key={g.title} className="py-1">
            <div className="flex justify-between px-2.5 py-1 text-[11px] uppercase tracking-wide text-zinc-500">
              <span className="truncate">{g.title}</span>
              <span className="tabular-nums">{done}/{g.lessons.length}</span>
            </div>
            {g.lessons.map(l => <LessonRow key={l.id} l={l} progress={progress} current={l.id === currentId} onSelect={onSelect} />)}
          </div>
        );
      })}
    </div>
  );
}
