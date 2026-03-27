"use client"
import { useRef, useState } from "react"
import { api } from "@/lib/api"
import type { SongSummary } from "@/lib/types"

interface Props {
  onUploaded: (song: SongSummary) => void
}

export function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<"idle" | "processing" | "error">("idle")
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setState("processing")
    setError("")
    try {
      const song = await api.songs.upload(file)
      if (inputRef.current) inputRef.current.value = ""
      setState("idle")
      onUploaded(song)
    } catch (e: unknown) {
      setState("error")
      setError(e instanceof Error ? e.message : "Upload failed")
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
      }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
        ${dragging ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 hover:border-zinc-500"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".gp,.gp3,.gp4,.gp5,.gpx,.json"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      {state === "processing" ? (
        <div className="space-y-2">
          <div className="animate-pulse text-blue-400 font-medium">Processing file…</div>
          <p className="text-zinc-500 text-sm">Analyzing sections and generating theory</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-zinc-300 font-medium">Drop a Guitar Pro file here</p>
          <p className="text-zinc-500 text-sm">.gp .gp5 .gpx .json — or click to browse</p>
          {state === "error" && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
