import type { TechniqueId } from "@/lib/song/types";
import { TECHNIQUES } from "@/lib/song/techniques";

export const DIFFICULTY_LABEL = ["", "Easy", "Moderate", "Challenging", "Hard", "Very hard"];
const DIFFICULTY_COLOR = ["", "bg-emerald-400", "bg-lime-400", "bg-amber-400", "bg-orange-500", "bg-red-500"];

export function DifficultyDots({ value, showLabel = false }: { value: number; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`Difficulty: ${DIFFICULTY_LABEL[value]}`}>
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`w-1.5 h-3 rounded-sm ${i <= value ? DIFFICULTY_COLOR[value] : "bg-zinc-700"}`} />
        ))}
      </span>
      {showLabel && <span className="text-xs text-zinc-400">{DIFFICULTY_LABEL[value]}</span>}
      <span className="sr-only">Difficulty {value} of 5</span>
    </span>
  );
}

export function difficultyBg(value: number) {
  return DIFFICULTY_COLOR[value] ?? "bg-zinc-700";
}

export function TechniqueChip({ id, count, active, onClick }: { id: TechniqueId; count?: number; active?: boolean; onClick?: () => void }) {
  const g = TECHNIQUES[id];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
        active ? "bg-zinc-100 text-zinc-900 border-zinc-100" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
      }`}
      title={g.summary}
    >
      {g.name}
      {count !== undefined && <span className={active ? "text-zinc-500" : "text-zinc-500"}> ×{count}</span>}
    </button>
  );
}

export function TechniqueGuideCard({ id }: { id: TechniqueId }) {
  const g = TECHNIQUES[id];
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 space-y-2 text-sm">
      <p className="text-zinc-300">{g.summary}</p>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">How to</p>
        <ul className="list-disc pl-4 space-y-1 text-zinc-300">
          {g.howTo.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Watch out for</p>
        <ul className="list-disc pl-4 space-y-1 text-zinc-400">
          {g.mistakes.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>
      <p className="text-zinc-300"><span className="text-zinc-500">Drill:</span> {g.drill}</p>
    </div>
  );
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
