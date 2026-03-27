"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionSidebar } from "@/components/SectionSidebar"
import { SectionContent } from "@/components/SectionContent"
import { TabViewer } from "@/components/TabViewer"
import { api } from "@/lib/api"
import type { SongDetail } from "@/lib/types"

export default function SongPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [song, setSong] = useState<SongDetail | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFullTab, setShowFullTab] = useState(false)

  useEffect(() => {
    api.songs.get(id).then(s => {
      setSong(s)
      if (s.sections.length > 0) setSelectedId(s.sections[0].id)
    }).catch(() => router.push("/"))
  }, [id, router])

  async function toggleComplete(sectionId: string) {
    const updated = await api.songs.toggleComplete(id, sectionId)
    setSong(updated)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${song?.title}"?`)) return
    await api.songs.delete(id)
    router.push("/")
  }

  if (!song) {
    return <div className="text-zinc-500 animate-pulse">Loading…</div>
  }

  const selectedSection = song.sections.find(s => s.id === selectedId)
  const pct = song.section_count > 0
    ? Math.round((song.completed_count / song.section_count) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{song.title}</h1>
          <p className="text-zinc-400 mt-1">{song.artist}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline">{song.key}</Badge>
            <Badge variant="outline">{song.tempo} bpm</Badge>
            <Badge variant="outline">{song.tuning.join(" ")}</Badge>
            <Badge variant="outline">
              {song.completed_count}/{song.section_count} done
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowFullTab(t => !t)}>
            {showFullTab ? "Section view" : "Full tab"}
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-950"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Content */}
      {showFullTab ? (
        <TabViewer tab={song.full_tab} />
      ) : (
        <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
          <div className="border-r border-zinc-800 pr-4 sticky top-8">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3 px-3">
              Sections
            </p>
            <SectionSidebar
              sections={song.sections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleComplete={toggleComplete}
            />
          </div>

          <div>
            {selectedSection
              ? <SectionContent section={selectedSection} />
              : <p className="text-zinc-500">Select a section to begin.</p>
            }
          </div>
        </div>
      )}
    </div>
  )
}
