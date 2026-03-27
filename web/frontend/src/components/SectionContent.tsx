import { Badge } from "@/components/ui/badge"
import type { SectionSummary } from "@/lib/types"

const TECHNIQUE_LABELS: Record<string, string> = {
  bend: "Bend", bend_release: "Bend & Release", pre_bend: "Pre-Bend",
  hammer_on: "Hammer-on", pull_off: "Pull-off", slide: "Slide",
  vibrato: "Vibrato", tapping: "Tapping", sweep: "Sweep Picking",
  harmonic: "Harmonic", palm_mute: "Palm Mute",
  tremolo: "Tremolo Picking", whammy: "Whammy Bar",
}

function techLabel(t: string) {
  return TECHNIQUE_LABELS[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function diffLabel(d: number): { text: string; cls: string } {
  if (d < 3) return { text: "Beginner", cls: "bg-green-950 text-green-300 border border-green-800" }
  if (d < 5) return { text: "Intermediate", cls: "bg-yellow-950 text-yellow-300 border border-yellow-800" }
  if (d < 7) return { text: "Advanced", cls: "bg-orange-950 text-orange-300 border border-orange-800" }
  return { text: "Expert", cls: "bg-red-950 text-red-300 border border-red-800" }
}

export function SectionContent({ section }: { section: SectionSummary }) {
  const diff = diffLabel(section.difficulty)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{section.name}</h2>
          <p className="text-zinc-500 text-sm mt-1">Bars {section.bar_start}–{section.bar_end}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-md font-medium shrink-0 ${diff.cls}`}>
          {diff.text} · {section.difficulty.toFixed(1)}
        </span>
      </div>

      <div className="grid gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Key / Scale</p>
          <p className="text-zinc-200 font-medium">{section.overall_scale || "—"}</p>
        </div>

        {section.techniques.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Techniques</p>
            <div className="flex flex-wrap gap-2">
              {section.techniques.map(t => (
                <Badge key={t} variant="secondary">{techLabel(t)}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
