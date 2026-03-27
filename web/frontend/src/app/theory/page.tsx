"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FretboardDiagram } from "@/components/FretboardDiagram"
import { api } from "@/lib/api"
import type { ScaleListItem, ChordTypeItem, ScaleResponse, ChordResponse, KeyResponse } from "@/lib/types"

const NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

const sel = "bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"

export default function TheoryPage() {
  const [scales, setScales] = useState<ScaleListItem[]>([])
  const [chords, setChords] = useState<ChordTypeItem[]>([])

  // Scale state
  const [scaleRoot, setScaleRoot] = useState("E")
  const [scaleType, setScaleType] = useState("natural_minor")
  const [scaleResult, setScaleResult] = useState<ScaleResponse | null>(null)

  // Chord state
  const [chordRoot, setChordRoot] = useState("A")
  const [chordTypeKey, setChordTypeKey] = useState("minor7")
  const [chordResult, setChordResult] = useState<ChordResponse | null>(null)

  // Key state
  const [keyRoot, setKeyRoot] = useState("A")
  const [keyType, setKeyType] = useState("natural_minor")
  const [keyResult, setKeyResult] = useState<KeyResponse | null>(null)

  useEffect(() => {
    api.theory.scales().then(setScales)
    api.theory.chords().then(setChords)
  }, [])

  useEffect(() => {
    api.theory.scale(scaleRoot, scaleType).then(setScaleResult).catch(() => setScaleResult(null))
  }, [scaleRoot, scaleType])

  useEffect(() => {
    const chord = chords.find(c => c.key === chordTypeKey)
    if (!chord) return
    const name = chordRoot + chord.symbol
    api.theory.chord(name).then(setChordResult).catch(() => setChordResult(null))
  }, [chordRoot, chordTypeKey, chords])

  useEffect(() => {
    api.theory.key(keyRoot, keyType).then(setKeyResult).catch(() => setKeyResult(null))
  }, [keyRoot, keyType])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Theory Reference</h1>

      <Tabs defaultValue="scale">
        <TabsList className="mb-6">
          <TabsTrigger value="scale">Scales</TabsTrigger>
          <TabsTrigger value="chord">Chords</TabsTrigger>
          <TabsTrigger value="key">Keys</TabsTrigger>
        </TabsList>

        {/* SCALES */}
        <TabsContent value="scale" className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            <select className={sel} value={scaleRoot} onChange={e => setScaleRoot(e.target.value)}>
              {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className={sel} value={scaleType} onChange={e => setScaleType(e.target.value)}>
              {scales.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
            </select>
          </div>
          {scaleResult && (
            <>
              <div>
                <h2 className="text-xl font-semibold">{scaleResult.root} {scaleResult.name}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {scaleResult.notes.map(n => <Badge key={n} variant="outline">{n}</Badge>)}
                </div>
                <p className="text-zinc-400 text-sm mt-2">{scaleResult.character}</p>
              </div>
              <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <FretboardDiagram positions={scaleResult.fretboard} />
              </div>
              {scaleResult.improvisation_tip && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Improv tip</p>
                  <p className="text-zinc-300">{scaleResult.improvisation_tip}</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* CHORDS */}
        <TabsContent value="chord" className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            <select className={sel} value={chordRoot} onChange={e => setChordRoot(e.target.value)}>
              {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className={sel} value={chordTypeKey} onChange={e => setChordTypeKey(e.target.value)}>
              {chords.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
          </div>
          {chordResult && (
            <>
              <div>
                <h2 className="text-xl font-semibold">
                  {chordResult.root}{chordResult.symbol}
                  <span className="text-zinc-400 font-normal ml-2 text-base">— {chordResult.name}</span>
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {chordResult.notes.map(n => <Badge key={n} variant="outline">{n}</Badge>)}
                </div>
                <p className="text-zinc-400 text-sm mt-2">{chordResult.character}</p>
              </div>
              <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <FretboardDiagram positions={chordResult.fretboard} />
              </div>
            </>
          )}
        </TabsContent>

        {/* KEYS */}
        <TabsContent value="key" className="space-y-6">
          <div className="flex gap-3 flex-wrap">
            <select className={sel} value={keyRoot} onChange={e => setKeyRoot(e.target.value)}>
              {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className={sel} value={keyType} onChange={e => setKeyType(e.target.value)}>
              {scales.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
            </select>
          </div>
          {keyResult && (
            <>
              <h2 className="text-xl font-semibold">
                {keyResult.root} {keyType.replace(/_/g, " ")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {keyResult.degrees.map(d => (
                  <div key={d.numeral}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs font-mono mb-1">{d.numeral}</p>
                    <p className="font-semibold text-lg">{d.chord_name}</p>
                    <p className="text-zinc-400 text-sm">{d.notes.join("  ")}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
