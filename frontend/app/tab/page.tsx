"use client";
import { useState } from "react";
import { analyzeTab } from "@/lib/engine";
import type { TabAnalysis } from "@/lib/engine";
import Fretboard from "@/components/Fretboard";

const EXAMPLE_TAB = `e|--5--8--5--8--5-----------|
B|------------------5--8----|
G|--------------------------|
D|--------------------------|
A|--------------------------|
E|--------------------------|`;

export default function TabPage() {
  const [input, setInput] = useState(EXAMPLE_TAB);
  const [analysis, setAnalysis] = useState<TabAnalysis | null>(null);

  function handleAnalyze() {
    const result = analyzeTab(input);
    setAnalysis(result);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tab Analysis</h1>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-xl p-4 font-mono text-sm text-zinc-100 resize-y"
        placeholder="Paste your guitar tab here..."
        spellCheck={false}
      />

      <button
        onClick={handleAnalyze}
        className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-medium transition-colors"
      >
        Analyze Tab
      </button>

      {analysis && analysis.noteCount > 0 && (
        <div className="space-y-4">
          {/* Key Detection */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-2">
            <h2 className="text-lg font-semibold">Detected Key</h2>
            <p className="text-xl font-bold text-white">{analysis.key}</p>
            {analysis.keyMatches.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Other possibilities</p>
                {analysis.keyMatches.slice(1).map((m, i) => (
                  <p key={i} className="text-sm text-zinc-400">
                    {m.root} {m.scale.name}
                    <span className="text-zinc-600 ml-2">({Math.round(m.score * 100)}%)</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Notes Found */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-2">
            <h2 className="text-lg font-semibold">Notes ({analysis.noteCount} total)</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.uniqueNotes.map(n => (
                <span key={n} className="px-2 py-1 bg-zinc-800 rounded text-sm font-mono">{n}</span>
              ))}
            </div>
          </div>

          {/* Fretboard */}
          {analysis.fretboardPositions.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-2">
              <h2 className="text-lg font-semibold">Fretboard</h2>
              <Fretboard
                positions={analysis.fretboardPositions}
                fretRange={[
                  Math.max(0, analysis.fretRange[0] - 2),
                  Math.min(24, analysis.fretRange[1] + 2),
                ]}
              />
            </div>
          )}

          {/* Scale Suggestions */}
          {analysis.keyMatches.length > 0 && analysis.keyMatches[0].scale.improvisationTip && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-2">
              <h2 className="text-lg font-semibold">Improvisation Tips</h2>
              <p className="text-sm text-zinc-300 italic">
                {analysis.keyMatches[0].scale.improvisationTip}
              </p>
            </div>
          )}

          {/* Patterns */}
          {analysis.patterns.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-2">
              <h2 className="text-lg font-semibold">Patterns Detected</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.patterns.map(p => (
                  <span key={p} className="px-2 py-1 bg-zinc-800 rounded text-sm capitalize">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h2 className="text-lg font-semibold mb-2">Stats</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-zinc-500">Fret range:</span>{" "}
                <span className="font-mono">{analysis.fretRange[0]}–{analysis.fretRange[1]}</span>
              </div>
              <div>
                <span className="text-zinc-500">Unique notes:</span>{" "}
                <span className="font-mono">{analysis.uniqueNotes.length}</span>
              </div>
              {Object.entries(analysis.stringUsage).map(([s, count]) => (
                <div key={s}>
                  <span className="text-zinc-500">String {s}:</span>{" "}
                  <span className="font-mono">{count} note{count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {analysis && analysis.noteCount === 0 && (
        <p className="text-red-400 text-sm">Could not parse any notes from the tab. Check format.</p>
      )}
    </div>
  );
}
