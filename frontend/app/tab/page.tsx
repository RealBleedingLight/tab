"use client";
import { useState, useRef, useCallback } from "react";
import { analyzeTab, analyzeNotes } from "@/lib/engine";
import type { TabAnalysis } from "@/lib/engine";
import Fretboard from "@/components/Fretboard";

const EXAMPLE_TAB = `e|--5--8--5--8--5-----------|
B|------------------5--8----|
G|--------------------------|
D|--------------------------|
A|--------------------------|
E|--------------------------|`;

const GP_EXTENSIONS = [".gp", ".gp3", ".gp4", ".gp5", ".gpx", ".gp7"];

type InputMode = "tab" | "gp";

export default function TabPage() {
  const [mode, setMode] = useState<InputMode>("tab");
  const [input, setInput] = useState(EXAMPLE_TAB);
  const [analysis, setAnalysis] = useState<TabAnalysis | null>(null);
  const [gpLoading, setGpLoading] = useState(false);
  const [gpFileName, setGpFileName] = useState("");
  const [gpTrackNames, setGpTrackNames] = useState<string[]>([]);
  const [gpTrackIndex, setGpTrackIndex] = useState(0);
  const [gpData, setGpData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAnalyzeTab() {
    setError("");
    const result = analyzeTab(input);
    setAnalysis(result);
  }

  const handleGpFile = useCallback(async (file: File) => {
    setError("");
    setGpLoading(true);
    setGpFileName(file.name);
    setGpTrackIndex(0);

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      setGpData(data);

      const { parseGpFile } = await import("@/lib/engine/gp-parser");
      const result = await parseGpFile(data, 0);

      if (result.errors.length > 0) {
        setError(result.errors.join("; "));
        setAnalysis(null);
        setGpTrackNames([]);
        return;
      }

      setGpTrackNames(result.trackNames);
      const tabAnalysis = analyzeNotes(result.notes, result.tuning);
      setAnalysis(tabAnalysis);
    } catch (e) {
      setError(`Failed to parse file: ${e instanceof Error ? e.message : String(e)}`);
      setAnalysis(null);
    } finally {
      setGpLoading(false);
    }
  }, []);

  async function handleTrackChange(index: number) {
    if (!gpData) return;
    setGpTrackIndex(index);
    setGpLoading(true);
    setError("");

    try {
      const { parseGpFile } = await import("@/lib/engine/gp-parser");
      const result = await parseGpFile(gpData, index);

      if (result.errors.length > 0) {
        setError(result.errors.join("; "));
        setAnalysis(null);
        return;
      }

      setAnalysis(analyzeNotes(result.notes, result.tuning));
    } catch (e) {
      setError(`Failed to parse track: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGpLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setMode("gp");
      handleGpFile(file);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleGpFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
      <h1 className="text-2xl font-bold">Tab Analysis</h1>

      {/* Mode Toggle */}
      <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
        <button
          onClick={() => { setMode("tab"); setAnalysis(null); setError(""); }}
          className={`flex-1 py-1.5 text-sm rounded transition-colors ${
            mode === "tab" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Paste Tab
        </button>
        <button
          onClick={() => { setMode("gp"); setAnalysis(null); setError(""); }}
          className={`flex-1 py-1.5 text-sm rounded transition-colors ${
            mode === "gp" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Upload GP File
        </button>
      </div>

      {/* ASCII Tab Input */}
      {mode === "tab" && (
        <>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-xl p-4 font-mono text-sm text-zinc-100 resize-y"
            placeholder="Paste your guitar tab here..."
            spellCheck={false}
          />
          <button
            onClick={handleAnalyzeTab}
            className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-medium transition-colors"
          >
            Analyze Tab
          </button>
        </>
      )}

      {/* GP File Upload */}
      {mode === "gp" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={GP_EXTENSIONS.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={gpLoading}
            className="w-full py-8 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl text-sm text-zinc-400 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            {gpLoading ? (
              <span className="animate-pulse">Parsing GP file...</span>
            ) : gpFileName ? (
              <span>
                <span className="font-medium text-zinc-200">{gpFileName}</span>
                <br />
                <span className="text-xs">Click or drop another file to replace</span>
              </span>
            ) : (
              <span>
                Drop a Guitar Pro file here, or click to browse
                <br />
                <span className="text-xs text-zinc-600">.gp, .gp3, .gp4, .gp5, .gpx, .gp7</span>
              </span>
            )}
          </button>

          {/* Track Selector */}
          {gpTrackNames.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Track:</span>
              <select
                value={gpTrackIndex}
                onChange={e => handleTrackChange(Number(e.target.value))}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
              >
                {gpTrackNames.map((name, i) => (
                  <option key={i} value={i}>{name || `Track ${i + 1}`}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Analysis Results */}
      {analysis && analysis.noteCount > 0 && (
        <div className="space-y-4">
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

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-2">
            <h2 className="text-lg font-semibold">Notes ({analysis.noteCount} total)</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.uniqueNotes.map(n => (
                <span key={n} className="px-2 py-1 bg-zinc-800 rounded text-sm font-mono">{n}</span>
              ))}
            </div>
          </div>

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

          {analysis.keyMatches.length > 0 && analysis.keyMatches[0].scale.improvisationTip && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-2">
              <h2 className="text-lg font-semibold">Improvisation Tips</h2>
              <p className="text-sm text-zinc-300 italic">
                {analysis.keyMatches[0].scale.improvisationTip}
              </p>
            </div>
          )}

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
        <p className="text-red-400 text-sm">Could not parse any notes. Check the input format.</p>
      )}
    </div>
  );
}
