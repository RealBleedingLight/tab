"use client"
import { useState, useEffect } from "react"
import { UploadZone } from "@/components/UploadZone"
import { SongCard } from "@/components/SongCard"
import { api } from "@/lib/api"
import type { SongSummary } from "@/lib/types"

export default function HomePage() {
  const [songs, setSongs] = useState<SongSummary[]>([])

  useEffect(() => {
    api.songs.list().then(setSongs).catch(() => {})
  }, [])

  function onUploaded(song: SongSummary) {
    setSongs(prev => {
      const exists = prev.some(s => s.id === song.id)
      return exists
        ? prev.map(s => s.id === song.id ? song : s)
        : [song, ...prev]
    })
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Guitar Teacher</h1>
        <p className="text-zinc-400">Upload a Guitar Pro file to generate section-by-section practice content.</p>
      </div>

      <UploadZone onUploaded={onUploaded} />

      {songs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Your Songs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {songs.map(song => <SongCard key={song.id} song={song} />)}
          </div>
        </section>
      )}
    </div>
  )
}
