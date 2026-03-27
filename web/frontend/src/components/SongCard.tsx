import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { SongSummary } from "@/lib/types"

export function SongCard({ song }: { song: SongSummary }) {
  const pct = song.section_count > 0
    ? Math.round((song.completed_count / song.section_count) * 100)
    : 0

  return (
    <Link href={`/songs/${song.id}`} className="block h-full">
      <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-colors h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 leading-tight truncate">{song.title}</h3>
            <p className="text-zinc-500 text-sm mt-0.5 truncate">{song.artist}</p>
          </div>
          {pct === 100 && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-medium shrink-0">
              Done
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <Badge variant="outline" className="text-xs">{song.key}</Badge>
          <Badge variant="outline" className="text-xs">{song.tempo} bpm</Badge>
          <Badge variant="outline" className="text-xs">{song.section_count} sections</Badge>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Progress</span>
            <span>{song.completed_count}/{song.section_count}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
