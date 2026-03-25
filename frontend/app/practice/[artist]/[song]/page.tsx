"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import MarkdownLesson from "@/components/MarkdownLesson";
import SaveIndicator from "@/components/SaveIndicator";

type SaveState = "idle" | "saving" | "saved" | "offline";

function parseCurrentLesson(context: string): number {
  const m = context.match(/current_lesson:\s*(\d+)/);
  return m ? parseInt(m[1]) : 1;
}

function updateContextLesson(context: string, lesson: number): string {
  return context.replace(/current_lesson:\s*\d+/, `current_lesson: ${lesson}`);
}

export default function PracticePage() {
  const { artist, song } = useParams<{ artist: string; song: string }>();
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [contextContent, setContextContent] = useState("");
  const [currentLesson, setCurrentLesson] = useState(1);
  const [tempo, setTempo] = useState("");
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load context + lesson on mount
  useEffect(() => {
    async function load() {
      try {
        const ctx = await api.getContext(artist, song);
        setContextContent(ctx.content);
        const lessonNum = parseCurrentLesson(ctx.content);
        setCurrentLesson(lessonNum);
        const lesson = await api.getLesson(artist, song, lessonNum);
        setLessonContent(lesson.content);
      } catch {
        setError("Could not load lesson. Check backend connection.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [artist, song]);

  const save = useCallback(async (newContextContent?: string) => {
    const content = newContextContent ?? contextContent;
    setSaveState("saving");
    try {
      const today = new Date().toISOString().split("T")[0];
      const logEntry = `\n## ${today}\n- Lesson ${currentLesson}${tempo ? ` — ${tempo} BPM` : ""}${notes ? `\n- Notes: ${notes}` : ""}`;
      await api.saveProgress(artist, song, {
        context_content: content,
        log_entry: logEntry,
        commit_message: `Practice: ${song} lesson ${currentLesson}`,
      });
      setSaveState("saved");
      setSavedAt(new Date());
    } catch {
      setSaveState("offline");
    }
  }, [artist, song, contextContent, currentLesson, tempo, notes]);

  // Auto-save every 10 minutes
  useEffect(() => {
    autoSaveRef.current = setInterval(() => save(), 10 * 60 * 1000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [save]);

  async function completeLesson() {
    const nextLesson = currentLesson + 1;
    const newContext = updateContextLesson(contextContent, nextLesson);
    setCurrentLesson(nextLesson);
    setContextContent(newContext);
    await save(newContext);
    try {
      const lesson = await api.getLesson(artist, song, nextLesson);
      setLessonContent(lesson.content);
    } catch {
      setLessonContent("No more lessons! You have completed this song.");
    }
  }

  if (loading) return <div className="text-zinc-500 animate-pulse text-sm">Loading lesson...</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold capitalize">{song.replace(/-/g, " ")}</h1>
          <p className="text-sm text-zinc-500 capitalize">{artist.replace(/-/g, " ")}</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} savedAt={savedAt} />
          <button
            onClick={() => save()}
            className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-1">
        <div className="flex gap-3 p-3 border-b border-zinc-800">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">Tempo (BPM)</label>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              placeholder="120"
              className="w-full bg-zinc-800 rounded px-2 py-1 text-sm text-zinc-100 border-none outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What is sticking..."
              className="w-full bg-zinc-800 rounded px-2 py-1 text-sm text-zinc-100 border-none outline-none"
            />
          </div>
        </div>

        <div className="p-3">
          <p className="text-xs text-zinc-600 mb-3 font-medium uppercase tracking-wider">
            Lesson {currentLesson}
          </p>
          {lessonContent && <MarkdownLesson content={lessonContent} />}
        </div>
      </div>

      <button
        onClick={completeLesson}
        className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-medium transition-colors"
      >
        Complete Lesson {currentLesson}
      </button>
    </div>
  );
}
