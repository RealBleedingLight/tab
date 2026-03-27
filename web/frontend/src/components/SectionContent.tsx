"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { FretboardDiagram } from "@/components/FretboardDiagram"
import { TabViewer } from "@/components/TabViewer"
import { api } from "@/lib/api"
import type { SectionSummary, ScaleResponse } from "@/lib/types"

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

/** Parse "E minor pentatonic" → { root: "E", scaleType: "minor_pentatonic" } */
function parseOverallScale(s: string): { root: string; scaleType: string } | null {
  if (!s) return null
  const parts = s.trim().split(/\s+/)
  if (parts.length < 2) return null
  const root = parts[0]
  const scaleType = parts.slice(1).join("_").toLowerCase()
  return { root, scaleType }
}

interface Props {
  section: SectionSummary
  fullTab?: string
}

export function SectionContent({ section, fullTab }: Props) {
  const diff = diffLabel(section.difficulty)
  const [scaleInfo, setScaleInfo] = useState<ScaleResponse | null>(null)
  const [scaleError, setScaleError] = useState(false)

  useEffect(() => {
    setScaleInfo(null)
    setScaleError(false)
    const parsed = parseOverallScale(section.overall_scale)
    if (!parsed) return
    api.theory.scale(parsed.root, parsed.scaleType)
      .then(setScaleInfo)
      .catch(() => setScaleError(true))
  }, [section.id, section.overall_scale])

  return (
    <div className="space-y-5">
      {/* Header */}
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
        {/* Key / Scale */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Key / Scale</p>
          <p className="text-zinc-200 font-medium">{section.overall_scale || "—"}</p>
        </div>

        {/* Techniques */}
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

        {/* Theory breakdown */}
        {scaleInfo && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Theory Breakdown</p>

            {/* Scale character */}
            <div>
              <p className="text-xs text-zinc-500 mb-1">Character</p>
              <p className="text-zinc-300 text-sm">{scaleInfo.character}</p>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Scale Notes</p>
              <div className="flex flex-wrap gap-1.5">
                {scaleInfo.notes.map(n => (
                  <span key={n} className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Improvisation tip */}
            {scaleInfo.improvisation_tip && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Improvisation Tip</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{scaleInfo.improvisation_tip}</p>
              </div>
            )}

            {/* Teaching note */}
            {scaleInfo.teaching_note && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Theory Note</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{scaleInfo.teaching_note}</p>
              </div>
            )}

            {/* Fretboard */}
            {scaleInfo.fretboard.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-3">Fretboard Map</p>
                <div className="overflow-x-auto">
                  <FretboardDiagram positions={scaleInfo.fretboard} frets={12} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab for this section */}
        {fullTab && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">
              Tab — focus on bars {section.bar_start}–{section.bar_end}
            </p>
            <TabViewer tab={fullTab} />
          </div>
        )}
      </div>
    </div>
  )
}
