"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type * as AT from "@coderline/alphatab";
import { ScorePlayer, usePlayer } from "@/lib/alphatab/player";
import { loadAlphaTab, parseScoreBytes } from "@/lib/alphatab/loader";
import { extractSong, listTracks, pickDefaultTrack } from "@/lib/song/extract";
import { buildLessonPlan } from "@/lib/song/lessons";
import { getCachedScore } from "@/lib/song/cache";
import { DEMO_ID, DEMO_TEX } from "@/lib/song/demo";
import {
  getProgress, getSong, saveProgress, touchSong, emptyProgress,
  type LessonProgress, type SongProgress,
} from "@/lib/storage/library";
import PlayerBar from "./player/PlayerBar";
import LiveFretboard from "./player/LiveFretboard";
import LessonPanel from "./learn/LessonPanel";
import Insights from "./learn/Insights";
import { DifficultyDots } from "./learn/bits";

type Panel = "lesson" | "insights";

async function loadScore(id: string): Promise<{ score: AT.model.Score; fileName: string }> {
  if (id === DEMO_ID) {
    const at = await loadAlphaTab();
    const settings = new at.Settings();
    const importer = new at.importer.AlphaTexImporter();
    importer.initFromString(DEMO_TEX, settings);
    return { score: importer.readScore(), fileName: "demo" };
  }
  const cached = getCachedScore(id);
  const record = await getSong(id).catch(() => null);
  if (record) void touchSong(id).catch(() => {});
  if (cached) return { score: cached, fileName: record?.fileName ?? "" };
  if (!record) throw new Error("This song isn't in your library anymore. Upload the file again.");
  return { score: await parseScoreBytes(record.data), fileName: record.fileName };
}

const EMPTY_LESSON: LessonProgress = { done: false, bestSpeed: 0, checks: [], practicedSeconds: 0 };

function addPracticeTime(p: SongProgress, lessonId: string, seconds: number): SongProgress {
  const lp = { ...EMPTY_LESSON, ...p.lessons[lessonId] };
  return {
    ...p,
    totalSeconds: p.totalSeconds + seconds,
    lessons: { ...p.lessons, [lessonId]: { ...lp, practicedSeconds: lp.practicedSeconds + seconds, lastPracticedAt: Date.now() } },
  };
}

function appendLog(p: SongProgress, lessonId: string, lessonTitle: string, seconds: number, speed: number): SongProgress {
  const log = [...p.log];
  const last = log[log.length - 1];
  // Merge back-to-back sessions on the same lesson (within 10 minutes).
  if (last && last.lessonId === lessonId && Date.now() - last.at < 10 * 60_000) {
    log[log.length - 1] = { ...last, at: Date.now(), seconds: last.seconds + seconds, speed: Math.max(last.speed, speed) };
  } else if (seconds >= 5) {
    log.push({ at: Date.now(), lessonId, lessonTitle, seconds, speed });
  } else {
    return p;
  }
  return { ...p, log: log.slice(-200) };
}

export default function SongWorkspace({ id }: { id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const player = useMemo(() => new ScorePlayer(), []);
  const [score, setScore] = useState<AT.model.Score | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trackIndex, setTrackIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<SongProgress | null>(null);
  const [panel, setPanel] = useState<Panel>("lesson");
  const [mobileTab, setMobileTab] = useState(false);
  const status = usePlayer(player, s => s.status);
  const renderError = usePlayer(player, s => s.error);
  const playing = usePlayer(player, s => s.playing);

  // Mount alphaTab once.
  useEffect(() => {
    const el = containerRef.current;
    if (el) void player.mount(el);
    return () => player.destroy();
  }, [player]);

  // Load the score.
  useEffect(() => {
    let cancelled = false;
    loadScore(id)
      .then(({ score }) => {
        if (cancelled) return;
        setScore(score);
        setTrackIndex(pickDefaultTrack(listTracks(score)));
      })
      .catch(e => !cancelled && setLoadError(e instanceof Error ? e.message : String(e)));
    return () => { cancelled = true; };
  }, [id]);

  // Render when score/track changes (the player queues it if alphaTab is still loading).
  useEffect(() => {
    if (score && trackIndex !== null) player.render(score, trackIndex);
  }, [player, score, trackIndex]);

  const song = useMemo(() => (score && trackIndex !== null ? extractSong(score, trackIndex) : null), [score, trackIndex]);
  const plan = useMemo(() => (song ? buildLessonPlan(song) : null), [song]);

  // Load progress for this song + track.
  useEffect(() => {
    if (trackIndex === null) return;
    let cancelled = false;
    const fallback = emptyProgress(id, trackIndex);
    getProgress(id, trackIndex)
      .then(p => !cancelled && setProgress(p))
      .catch(() => !cancelled && setProgress(fallback));
    return () => { cancelled = true; };
  }, [id, trackIndex]);

  const lesson = useMemo(() => {
    if (!plan) return null;
    const cur = progress?.currentLessonId && plan.lessons.find(l => l.id === progress.currentLessonId);
    return cur || plan.lessons.find(l => !progress?.lessons[l.id]?.done) || plan.lessons[0];
  }, [plan, progress]);

  // Persist progress (debounced).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<SongProgress | null>(null);
  const updateProgress = useCallback((fn: (p: SongProgress) => SongProgress) => {
    setProgress(prev => {
      if (!prev) return prev;
      const next = fn(prev);
      latest.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { void saveProgress(next).catch(() => {}); }, 400);
      return next;
    });
  }, []);

  // Flush pending saves when leaving the page.
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
      if (latest.current) void saveProgress(latest.current).catch(() => {});
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); flush(); };
  }, []);

  const updateLesson = useCallback((lessonId: string, patch: Partial<LessonProgress>) => {
    updateProgress(p => ({
      ...p,
      lessons: { ...p.lessons, [lessonId]: { ...EMPTY_LESSON, ...p.lessons[lessonId], ...patch } },
    }));
  }, [updateProgress]);

  const selectLesson = useCallback((lessonId: string) => {
    updateProgress(p => ({ ...p, currentLessonId: lessonId }));
    const l = plan?.lessons.find(x => x.id === lessonId);
    if (l) {
      player.stop();
      player.practice(l.bars, l.kind === "overview" ? 100 : l.startSpeed, l.kind !== "overview" && l.kind !== "performance", null, false);
    }
    setPanel("lesson");
  }, [plan, player, updateProgress]);

  // When a lesson is (re)opened, select its bars without auto-playing.
  const lessonId = lesson?.id;
  useEffect(() => {
    if (!lesson || status !== "ready") return;
    const r = player.getSnapshot().range;
    if (!r) player.practice(lesson.bars, lesson.kind === "overview" ? 100 : lesson.startSpeed, false, null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, status, player]);

  // Record best speed whenever a loop of the current lesson's bars completes.
  useEffect(() => {
    player.onLoop = speed => {
      const r = player.getSnapshot().range;
      if (!lesson || !r || r[0] !== lesson.bars[0] || r[1] !== lesson.bars[1]) return;
      updateProgress(p => {
        const lp = { ...EMPTY_LESSON, ...p.lessons[lesson.id] };
        if (speed <= lp.bestSpeed) return p;
        return { ...p, lessons: { ...p.lessons, [lesson.id]: { ...lp, bestSpeed: speed } } };
      });
    };
    return () => { player.onLoop = null; };
  }, [player, lesson, updateProgress]);

  // Practice timer: accumulate time while playing and attribute it to the current lesson.
  useEffect(() => {
    if (!playing || !lesson) return;
    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      const seconds = (now - last) / 1000;
      last = now;
      updateProgress(p => addPracticeTime(p, lesson.id, seconds));
    };
    const started = Date.now();
    const tick = setInterval(flush, 15000);
    return () => {
      clearInterval(tick);
      flush();
      const total = Math.round((Date.now() - started) / 1000);
      const speed = player.getSnapshot().speed;
      updateProgress(p => appendLog(p, lesson.id, lesson.title, total, speed));
    };
  }, [playing, lesson, player, updateProgress]);

  const error = loadError ?? (status === "error" ? renderError : null);
  const doneCount = plan && progress ? plan.lessons.filter(l => progress.lessons[l.id]?.done).length : 0;

  return (
    <div className="pb-40">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Library</Link>
          <h1 className="text-2xl font-bold truncate">{song?.title ?? (error ? "Couldn't open song" : "Loading…")}</h1>
          <p className="text-sm text-zinc-400 truncate">
            {song ? [song.artist, `${song.tempo} BPM`, song.tuningName + " tuning"].filter(Boolean).join(" · ") : " "}
          </p>
        </div>
        {song && song.tracks.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Part</span>
            <select
              value={trackIndex ?? 0}
              onChange={e => { player.stop(); setTrackIndex(Number(e.target.value)); }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm max-w-[16rem]"
            >
              {song.tracks.map(t => (
                <option key={t.index} value={t.index} disabled={t.isPercussion}>
                  {t.name}{t.isPercussion ? " (drums)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        {plan && (
          <div className="flex items-center gap-3 text-sm">
            <DifficultyDots value={plan.overall.difficulty} showLabel />
            <div className="w-28">
              <div className="flex justify-between text-[11px] text-zinc-500"><span>Progress</span><span>{doneCount}/{plan.lessons.length}</span></div>
              <div className="h-1.5 rounded bg-zinc-800 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(doneCount / plan.lessons.length) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {error} <Link href="/" className="underline ml-1">Back to library</Link>
          </div>
        </div>
      )}

      {/* Mobile view switch */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 mb-3">
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
          {([["lesson", "Lesson"], ["tab", "Tab"], ["insights", "Insights"]] as const).map(([v, label]) => {
            const active = v === "tab" ? mobileTab : !mobileTab && panel === v;
            return (
              <button key={v} type="button"
                onClick={() => { if (v === "tab") setMobileTab(true); else { setMobileTab(false); setPanel(v); } }}
                className={`flex-1 py-1.5 text-sm rounded ${active ? "bg-zinc-700 text-white" : "text-zinc-500"}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        {/* Score */}
        {/* Kept in layout (zero height) when hidden on mobile so alphaTab always knows its width. */}
        <div className={`${mobileTab ? "" : "h-0 overflow-hidden lg:h-auto lg:overflow-visible"} min-w-0 space-y-3`}>
          {song && lesson && (
            <div className="sticky top-14 z-20">
              <LiveFretboard song={song} harmony={plan!.harmony} player={player} bars={lesson.bars} />
            </div>
          )}
          <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/40 min-h-[300px] overflow-hidden">
            {(status === "loading" || status === "rendering" || (!score && !error)) && (
              <div className="absolute inset-x-0 top-0 p-8 text-center text-sm text-zinc-500 animate-pulse z-10">
                {status === "rendering" ? "Drawing tab…" : "Loading tab engine…"}
              </div>
            )}
            <div ref={containerRef} className="at-surface" />
          </div>
        </div>

        {/* Learning sidebar */}
        <aside className={`${mobileTab ? "hidden" : "block"} lg:block space-y-3 lg:sticky lg:top-14 lg:max-h-[calc(100vh-4rem-5rem)] lg:overflow-y-auto lg:pr-1`}>
          <div className="hidden lg:flex gap-1 bg-zinc-900 rounded-lg p-1">
            {(["lesson", "insights"] as Panel[]).map(p => (
              <button key={p} type="button" onClick={() => setPanel(p)}
                className={`flex-1 py-1.5 text-sm rounded ${panel === p ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {p === "lesson" ? "Lessons" : "Insights"}
              </button>
            ))}
          </div>
          {plan && lesson && progress ? (
            panel === "lesson" ? (
              <LessonPanel key={lesson.id} plan={plan} lesson={lesson} progress={progress} player={player} onSelect={selectLesson} onUpdate={updateLesson} />
            ) : (
              <Insights song={song!} plan={plan} progress={progress} onSelectLesson={selectLesson} />
            )
          ) : !error ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-500 animate-pulse">Building your lesson plan…</div>
          ) : null}
        </aside>
      </div>

      {song && <PlayerBar player={player} tempo={song.tempo} />}
    </div>
  );
}
