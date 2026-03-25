"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ScaleResult, ChordResult, KeyResult, IntervalResult } from "@/lib/types";
import Fretboard from "@/components/Fretboard";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES = ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian",
  "harmonic-minor", "melodic-minor", "pentatonic-major", "pentatonic-minor",
  "blues", "japanese-pentatonic", "whole-tone", "diminished"];

type Tab = "scale" | "chord" | "key" | "interval";

export default function TheoryPage() {
  const [tab, setTab] = useState<Tab>("scale");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Theory</h1>

      <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
        {(["scale", "chord", "key", "interval"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm rounded capitalize transition-colors ${
              tab === t ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "scale" && <ScaleLookup />}
      {tab === "chord" && <ChordLookup />}
      {tab === "key" && <KeyLookup />}
      {tab === "interval" && <IntervalLookup />}
    </div>
  );
}

function ScaleLookup() {
  const [root, setRoot] = useState("A");
  const [scaleType, setScaleType] = useState("pentatonic-minor");
  const [result, setResult] = useState<ScaleResult | null>(null);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    try {
      setResult(await api.getScale(root, scaleType));
    } catch {
      setError("Scale not found.");
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={root} onChange={e => setRoot(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <select value={scaleType} onChange={e => setScaleType(e.target.value)}
          className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Look up
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{result.root} {result.name}</h2>
            <p className="text-sm text-zinc-400">{result.character}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.notes.map(n => (
              <span key={n} className="px-2 py-1 bg-zinc-800 rounded text-sm font-mono">{n}</span>
            ))}
          </div>
          <Fretboard positions={result.fretboard} />
          {result.improvisation_tip && (
            <p className="text-sm text-zinc-400 italic">{result.improvisation_tip}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChordLookup() {
  const [name, setName] = useState("Am7");
  const [result, setResult] = useState<ChordResult | null>(null);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    try {
      setResult(await api.getChord(name));
    } catch {
      setError("Chord not found.");
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Am7, G, Cmaj7..."
          className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700"
          onKeyDown={e => e.key === "Enter" && lookup()}
        />
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Look up
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
          <h2 className="text-lg font-semibold">{result.symbol} — {result.name}</h2>
          <p className="text-sm text-zinc-400">{result.character}</p>
          <div className="flex flex-wrap gap-2">
            {result.notes.map(n => (
              <span key={n} className="px-2 py-1 bg-zinc-800 rounded text-sm font-mono">{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KeyLookup() {
  const [root, setRoot] = useState("C");
  const [scaleType, setScaleType] = useState("major");
  const [result, setResult] = useState<KeyResult | null>(null);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    try {
      setResult(await api.getKey(root, scaleType));
    } catch {
      setError("Key not found.");
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={root} onChange={e => setRoot(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <select value={scaleType} onChange={e => setScaleType(e.target.value)}
          className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          <option value="major">major</option>
          <option value="minor">minor</option>
          <option value="harmonic-minor">harmonic minor</option>
          <option value="dorian">dorian</option>
        </select>
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Look up
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <h2 className="text-lg font-semibold mb-3">{result.key}</h2>
          <div className="grid grid-cols-7 gap-1 text-center">
            {result.chords.map(chord => (
              <div key={chord.numeral} className="bg-zinc-800 rounded p-2">
                <div className="text-xs text-zinc-500">{chord.numeral}</div>
                <div className="text-sm font-mono font-medium">{chord.symbol}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IntervalLookup() {
  const [note1, setNote1] = useState("C");
  const [note2, setNote2] = useState("E");
  const [result, setResult] = useState<IntervalResult | null>(null);

  async function lookup() {
    try {
      setResult(await api.getInterval(note1, note2));
    } catch {
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <select value={note1} onChange={e => setNote1(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <span className="text-zinc-500">to</span>
        <select value={note2} onChange={e => setNote2(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Calculate
        </button>
      </div>

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-xl font-bold">{result.name}</p>
          <p className="text-zinc-400 text-sm">{result.short_name} — {result.semitones} semitones — {result.quality}</p>
        </div>
      )}
    </div>
  );
}
