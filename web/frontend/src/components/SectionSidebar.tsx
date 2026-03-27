import type { SectionSummary } from "@/lib/types"

interface Props {
  sections: SectionSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleComplete: (id: string) => void
}

function diffColor(d: number) {
  if (d < 4) return "text-green-400"
  if (d < 7) return "text-yellow-400"
  return "text-red-400"
}

export function SectionSidebar({ sections, selectedId, onSelect, onToggleComplete }: Props) {
  return (
    <div className="space-y-0.5">
      {sections.map(s => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
            ${selectedId === s.id
              ? "bg-zinc-800 text-zinc-100"
              : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"}`}
        >
          <button
            onClick={e => { e.stopPropagation(); onToggleComplete(s.id) }}
            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors
              ${s.completed ? "bg-green-600 border-green-600 text-white" : "border-zinc-600 hover:border-zinc-400"}`}
          >
            {s.completed && "✓"}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{s.name}</p>
            <p className="text-xs text-zinc-600">bars {s.bar_start}–{s.bar_end}</p>
          </div>

          <span className={`text-xs font-mono shrink-0 ${diffColor(s.difficulty)}`}>
            {s.difficulty.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}
