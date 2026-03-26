"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import MarkdownLesson from "@/components/MarkdownLesson";
import SaveIndicator from "@/components/SaveIndicator";

type SaveState = "idle" | "saving" | "saved" | "offline";
type Tab = "lesson" | "tab" | "theory" | "breakdown";

function parseCurrentLesson(context: string): number {
  const m = context.match(/current_lesson:\s*(\d+)/) ?? context.match(/\*\*Current lesson:\*\*\s*(\d+)/);
  return m ? parseInt(m[1]) : 1;
}

function updateContextLesson(context: string, lesson: number): string {
  return context.replace(/current_lesson:\s*\d+/, `current_lesson: ${lesson}`);
}

export default function PracticePage() {
  const { artist, song } = useParams<{ artist: string; song: string }>();

  const [activeTab, setActiveTab] = useState<Tab>("lesson");
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [tabContent, setTabContent] = useState<string | null>(null);
  const [theoryContent, setTheoryContent] = useState<string | null>(null);
  const [breakdownContent, setBreakdownContent] = useState<string | null>(null);
  const loadedTabs = useRef<Set<Tab>>(new Set());

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
        try {
          const lesson = await api.getLesson(artist, song, lessonNum);
          setLessonContent(lesson.content);
          loadedTabs.current.add("lesson");
        } catch {
          setLessonContent(null);
        }
      } catch {
        setError("Could not load lesson. Check backend connection.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [artist, song]);

  // Lazy-load tab/theory/breakdown when those tabs are first opened
  useEffect(() => {
    if (activeTab === "tab" && !loadedTabs.current.has("tab")) {
      loadedTabs.current.add("tab");
      api.getTab(artist, song)
        .then(r => setTabContent(r.content))
        .catch(() => setTabContent("Tab file not found for this song."));
    }
    if (activeTab === "theory" && !loadedTabs.current.has("theory")) {
      loadedTabs.current.add("theory");
      api.getTheory(artist, song)
        .then(r => setTheoryContent(r.content))
        .catch(() => setTheoryContent("Theory file not found for this song."));
    }
    if (activeTab === "breakdown" && !loadedTabs.current.has("breakdown")) {
      loadedTabs.current.add("breakdown");
      api.getBreakdown(artist, song)
        .then(r => setBreakdownContent(r.content))
        .catch(() => setBreakdownContent("Breakdown file not found for this song."));
    }
  }, [activeTab, artist, song]);

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
    setLessonContent(null);
    loadedTabs.current.delete("lesson");
    await save(newContext);
    try {
      const lesson = await api.getLesson(artist, song, nextLesson);
      setLessonContent(lesson.content);
      loadedTabs.current.add("lesson");
    } catch {
      setLessonContent("No more lessons! You have completed this song.");
    }
    setActiveTab("lesson");
  }

  if (loading) return <div className="text-zinc-500 animate-pulse text-sm">Loading lesson...</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: "lesson", label: "Lesson" },
    { id: "tab", label: "Tab" },
    { id: "theory", label: "Theory" },
    { id: "breakdown", label: "Breakdown" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold capitalize">{song.replace(/-/g, " ")}</h1>
          <p className="text-sm text-zinc-500 capitalize">{artist.replace(/-/g, " ")} · Lesson {currentLesson}</p>
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

      {/* Tempo + Notes */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">Tempo (BPM)</label>
          <input
            type="number"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            placeholder="120"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What is sticking..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === t.id
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-h-48">
        {activeTab === "lesson" && (
          lessonContent
            ? <MarkdownLesson content={lessonContent} />
            : <p className="text-zinc-500 text-sm">No lesson found. Process a GP file in the Queue to generate lessons.</p>
        )}

        {activeTab === "tab" && (
          tabContent === null
            ? <p className="text-zinc-500 text-sm animate-pulse">Loading tab...</p>
            : <pre className="text-xs font-mono text-zinc-300 whitespace-pre overflow-x-auto leading-relaxed">{tabContent}</pre>
        )}

        {activeTab === "theory" && (
          theoryContent === null
            ? <p className="text-zinc-500 text-sm animate-pulse">Loading theory...</p>
            : <MarkdownLesson content={theoryContent} />
        )}

        {activeTab === "breakdown" && (
          breakdownContent === null
            ? <p className="text-zinc-500 text-sm animate-pulse">Loading breakdown...</p>
            : <MarkdownLesson content={breakdownContent} />
        )}
      </div>

      {/* Complete button */}
      <button
        onClick={completeLesson}
        className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-medium transition-colors text-sm"
      >
        Complete Lesson {currentLesson} →
      </button>
    </div>
  );
}
