# Algorithmic Guitar Tab Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Port the Python TheoryEngine to TypeScript, add an ASCII tab parser, remove all Python backend dependency so the app runs as a standalone Next.js site on Vercel with zero LLM keys.

**Architecture:** All music theory logic runs client-side in TypeScript. YAML data (scales, chords, intervals) becomes static TS objects. The frontend is a self-contained Next.js app — no API server, no auth, no queue system. Tab input is parsed in the browser and fed through the theory engine for analysis.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4. No external runtime dependencies beyond what's already in package.json (react-markdown, swr removed since no API).

**Spec:** Design approved in chat — port Python TheoryEngine to TS, add ASCII tab parser, simplify frontend to Theory + Tab Analysis + Fretboard.

## Global Constraints

- Next.js 16 with React 19 — read `node_modules/next/dist/docs/` before writing any code (per AGENTS.md)
- No LLM keys, no API keys, no environment variables required
- No Python backend — everything client-side or in Next.js
- Tailwind CSS 4 with `@tailwindcss/postcss`
- Must deploy to Vercel with `vercel.json` in `frontend/`
- All work happens inside `frontend/` directory
- Preserve existing dark theme (zinc-950 bg, zinc-100 text)

---

### Task 1: Note Utilities Module

Port `guitar-teacher/guitar_teacher/core/note_utils.py` to TypeScript.

**Files:**
- Create: `frontend/lib/engine/notes.ts`
- Create: `frontend/lib/engine/__tests__/notes.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module)
- Produces:
  - `noteToPitchClass(name: string): number`
  - `pitchClassToName(pc: number, preferFlats?: boolean): string`
  - `fretToPitchClass(stringNum: number, fret: number, tuning: string[]): number`
  - `fretToNote(stringNum: number, fret: number, tuning: string[], preferFlats?: boolean): string`
  - `intervalSemitones(note1: string, note2: string): number`
  - `STANDARD_TUNING: string[]` (constant `["E", "A", "D", "G", "B", "E"]`)

- [x] **Step 1: Write failing tests**

```typescript
// frontend/lib/engine/__tests__/notes.test.ts
import {
  noteToPitchClass, pitchClassToName, fretToPitchClass,
  fretToNote, intervalSemitones, STANDARD_TUNING,
} from "../notes";

describe("noteToPitchClass", () => {
  test("C is 0", () => expect(noteToPitchClass("C")).toBe(0));
  test("E is 4", () => expect(noteToPitchClass("E")).toBe(4));
  test("Bb is 10", () => expect(noteToPitchClass("Bb")).toBe(10));
  test("A# is 10", () => expect(noteToPitchClass("A#")).toBe(10));
  test("case insensitive", () => expect(noteToPitchClass("c#")).toBe(1));
  test("unknown note throws", () => expect(() => noteToPitchClass("X")).toThrow());
});

describe("pitchClassToName", () => {
  test("0 sharp = C", () => expect(pitchClassToName(0)).toBe("C"));
  test("1 sharp = C#", () => expect(pitchClassToName(1)).toBe("C#"));
  test("1 flat = Db", () => expect(pitchClassToName(1, true)).toBe("Db"));
  test("wraps at 12", () => expect(pitchClassToName(12)).toBe("C"));
});

describe("fretToPitchClass", () => {
  test("open low E (string 6) = E = 4", () => {
    expect(fretToPitchClass(6, 0, STANDARD_TUNING)).toBe(4);
  });
  test("5th fret low E = A = 9", () => {
    expect(fretToPitchClass(6, 5, STANDARD_TUNING)).toBe(9);
  });
  test("open high e (string 1) = E = 4", () => {
    expect(fretToPitchClass(1, 0, STANDARD_TUNING)).toBe(4);
  });
});

describe("intervalSemitones", () => {
  test("C to E = 4 (major 3rd)", () => expect(intervalSemitones("C", "E")).toBe(4));
  test("E to C = 8 (minor 6th)", () => expect(intervalSemitones("E", "C")).toBe(8));
  test("A to A = 0 (unison)", () => expect(intervalSemitones("A", "A")).toBe(0));
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx jest lib/engine/__tests__/notes.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Implement notes.ts**

```typescript
// frontend/lib/engine/notes.ts
const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const NAME_TO_PC: Record<string, number> = {};
SHARP_NAMES.forEach((n, i) => { NAME_TO_PC[n] = i; NAME_TO_PC[n.toLowerCase()] = i; });
FLAT_NAMES.forEach((n, i) => { NAME_TO_PC[n] = i; NAME_TO_PC[n.toLowerCase()] = i; });

export const STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"];

export function noteToPitchClass(name: string): number {
  const n = name.trim();
  const pc = NAME_TO_PC[n];
  if (pc === undefined) throw new Error(`Unknown note: ${n}`);
  return pc;
}

export function pitchClassToName(pc: number, preferFlats = false): string {
  const normalized = ((pc % 12) + 12) % 12;
  return preferFlats ? FLAT_NAMES[normalized] : SHARP_NAMES[normalized];
}

export function fretToPitchClass(stringNum: number, fret: number, tuning: string[]): number {
  const openNote = tuning[tuning.length - stringNum];
  const openPc = noteToPitchClass(openNote);
  return (openPc + fret) % 12;
}

export function fretToNote(stringNum: number, fret: number, tuning: string[], preferFlats = false): string {
  return pitchClassToName(fretToPitchClass(stringNum, fret, tuning), preferFlats);
}

export function intervalSemitones(note1: string, note2: string): number {
  return ((noteToPitchClass(note2) - noteToPitchClass(note1)) % 12 + 12) % 12;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx jest lib/engine/__tests__/notes.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
cd frontend && git add lib/engine/notes.ts lib/engine/__tests__/notes.test.ts
git commit -m "feat: add note utilities module (pitch class math)"
```

---

### Task 2: Scale, Chord, and Interval Data

Port the YAML knowledge base to static TypeScript. Create types and data objects.

**Files:**
- Create: `frontend/lib/engine/types.ts`
- Create: `frontend/lib/engine/data/scales.ts`
- Create: `frontend/lib/engine/data/chords.ts`
- Create: `frontend/lib/engine/data/intervals.ts`
- Create: `frontend/lib/engine/__tests__/data.test.ts`

**Interfaces:**
- Consumes: nothing (static data)
- Produces:
  - `Scale` type: `{ key, name, aliases, category, intervals, character, commonIn, chordFit, teachingNote, improvisationTip, parentScale?, parentDegree? }`
  - `Chord` type: `{ key, name, symbol, aliases, intervals, character, commonVoicings? }`
  - `IntervalInfo` type: `{ semitones, name, shortName, quality }`
  - `SCALES: Record<string, Scale>`
  - `CHORDS: Record<string, Chord>`
  - `INTERVALS: IntervalInfo[]`

- [x] **Step 1: Create types.ts**

```typescript
// frontend/lib/engine/types.ts
export interface Scale {
  key: string;
  name: string;
  aliases: string[];
  category: string;
  intervals: number[];
  character: string;
  commonIn: string[];
  chordFit: string[];
  teachingNote: string;
  improvisationTip: string;
  parentScale?: string;
  parentDegree?: number;
}

export interface Chord {
  key: string;
  name: string;
  symbol: string;
  aliases: string[];
  intervals: number[];
  character: string;
  commonVoicings?: Record<string, { frets: (number | null)[]; rootString: number }>;
}

export interface IntervalInfo {
  semitones: number;
  name: string;
  shortName: string;
  quality: string;
}

export interface FretboardPosition {
  string: number;
  fret: number;
  note: string;
  isRoot: boolean;
}

export interface ScaleResult {
  scale: Scale;
  root: string;
  notes: string[];
}

export interface ChordResult {
  chord: Chord;
  root: string;
  symbol: string;
  notes: string[];
}

export interface KeyMatch {
  root: string;
  scale: Scale;
  score: number;
  notesMatched: number;
  totalNotes: number;
  outsideNotes: string[];
}

export interface ScaleSuggestion {
  root: string;
  name: string;
  notes: string[];
  score: number;
}

export interface ParsedNote {
  string: number;    // 1=high e, 6=low E
  fret: number;
  position: number;  // horizontal position in the tab line
}

export interface TabParseResult {
  notes: ParsedNote[];
  tuning: string[];
  errors: string[];
}

export interface TabAnalysis {
  key: string;
  notes: string[];
  uniqueNotes: string[];
  keyMatches: KeyMatch[];
  fretboardPositions: FretboardPosition[];
  noteCount: number;
  fretRange: [number, number];
  stringUsage: Record<number, number>;
  patterns: string[];
}
```

- [x] **Step 2: Create scales data**

Port all entries from `guitar-teacher/theory/scales.yaml` to `frontend/lib/engine/data/scales.ts`. Each scale entry maps directly — convert snake_case YAML keys to camelCase TS properties. There are 20 scales total. Write them all out as a `Record<string, Scale>`.

```typescript
// frontend/lib/engine/data/scales.ts
import type { Scale } from "../types";

export const SCALES: Record<string, Scale> = {
  major: {
    key: "major",
    name: "Major",
    aliases: ["ionian"],
    category: "mode",
    intervals: [2, 2, 1, 2, 2, 2, 1],
    character: "Bright, happy, resolved — the most stable and consonant of all scales",
    commonIn: ["pop", "rock", "country", "classical", "jazz"],
    chordFit: ["maj", "maj7", "6", "add9"],
    teachingNote: "The foundation scale — all other modes are derived from it. Learn this shape cold before moving to modes.",
    improvisationTip: "Emphasize the major 3rd and major 7th for the characteristic bright sound. Resolve phrases to the root for a strong sense of home.",
  },
  // ... all 20 scales from scales.yaml, converted to camelCase
};
```

The file must contain ALL scales from the YAML: major, dorian, phrygian, lydian, mixolydian, natural_minor, locrian, harmonic_minor, melodic_minor, pentatonic_major, pentatonic_minor, blues, chromatic, whole_tone, diminished_whole_half, diminished_half_whole, phrygian_dominant, lydian_dominant, super_locrian, hungarian_minor, japanese.

Also add alias lookup:

```typescript
const SCALE_ALIASES: Record<string, string> = {};
for (const [key, scale] of Object.entries(SCALES)) {
  for (const alias of scale.aliases) {
    SCALE_ALIASES[alias.toLowerCase()] = key;
  }
}

export function resolveScale(scaleType: string): Scale | undefined {
  const low = scaleType.toLowerCase().replace(/-/g, "_");
  return SCALES[low] ?? SCALES[SCALE_ALIASES[low]];
}
```

- [x] **Step 3: Create chords data**

Port all entries from `guitar-teacher/theory/chords.yaml` to `frontend/lib/engine/data/chords.ts`. There are 22 chords. Convert `common_voicings` keys from `E_shape`/`A_shape` to `eShape`/`aShape`, and `root_string` to `rootString`.

```typescript
// frontend/lib/engine/data/chords.ts
import type { Chord } from "../types";

export const CHORDS: Record<string, Chord> = {
  major: {
    key: "major",
    name: "Major",
    symbol: "",
    aliases: ["maj", "M"],
    intervals: [0, 4, 7],
    character: "Stable, bright, resolved",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, 1, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 2, 2, 0], rootString: 5 },
    },
  },
  // ... all 22 chords from chords.yaml
};
```

Also add alias/symbol lookup:

```typescript
const CHORD_ALIASES: Record<string, string> = {};
for (const [key, chord] of Object.entries(CHORDS)) {
  if (chord.symbol) CHORD_ALIASES[chord.symbol.toLowerCase()] = key;
  for (const alias of chord.aliases) {
    CHORD_ALIASES[alias.toLowerCase()] = key;
  }
}

export function resolveChord(chordType: string): Chord | undefined {
  const low = chordType.toLowerCase();
  return CHORDS[low] ?? CHORDS[CHORD_ALIASES[low]];
}
```

- [x] **Step 4: Create intervals data**

```typescript
// frontend/lib/engine/data/intervals.ts
import type { IntervalInfo } from "../types";

export const INTERVALS: IntervalInfo[] = [
  { semitones: 0, name: "Unison", shortName: "P1", quality: "perfect" },
  { semitones: 1, name: "Minor 2nd", shortName: "m2", quality: "minor" },
  { semitones: 2, name: "Major 2nd", shortName: "M2", quality: "major" },
  { semitones: 3, name: "Minor 3rd", shortName: "m3", quality: "minor" },
  { semitones: 4, name: "Major 3rd", shortName: "M3", quality: "major" },
  { semitones: 5, name: "Perfect 4th", shortName: "P4", quality: "perfect" },
  { semitones: 6, name: "Tritone", shortName: "TT", quality: "augmented" },
  { semitones: 7, name: "Perfect 5th", shortName: "P5", quality: "perfect" },
  { semitones: 8, name: "Minor 6th", shortName: "m6", quality: "minor" },
  { semitones: 9, name: "Major 6th", shortName: "M6", quality: "major" },
  { semitones: 10, name: "Minor 7th", shortName: "m7", quality: "minor" },
  { semitones: 11, name: "Major 7th", shortName: "M7", quality: "major" },
];
```

- [x] **Step 5: Write data validation tests**

```typescript
// frontend/lib/engine/__tests__/data.test.ts
import { SCALES, resolveScale } from "../data/scales";
import { CHORDS, resolveChord } from "../data/chords";
import { INTERVALS } from "../data/intervals";

describe("scales data", () => {
  test("has 20+ scales", () => expect(Object.keys(SCALES).length).toBeGreaterThanOrEqual(20));
  test("major scale intervals sum to 12", () => {
    expect(SCALES.major.intervals.reduce((a, b) => a + b, 0)).toBe(12);
  });
  test("pentatonic_minor intervals sum to 12", () => {
    expect(SCALES.pentatonic_minor.intervals.reduce((a, b) => a + b, 0)).toBe(12);
  });
  test("resolves alias 'aeolian' to natural_minor", () => {
    expect(resolveScale("aeolian")?.key).toBe("natural_minor");
  });
  test("resolves 'harmonic-minor' (hyphenated) to harmonic_minor", () => {
    expect(resolveScale("harmonic-minor")?.key).toBe("harmonic_minor");
  });
});

describe("chords data", () => {
  test("has 20+ chords", () => expect(Object.keys(CHORDS).length).toBeGreaterThanOrEqual(20));
  test("major chord intervals = [0,4,7]", () => {
    expect(CHORDS.major.intervals).toEqual([0, 4, 7]);
  });
  test("resolves 'm7' alias to minor7", () => {
    expect(resolveChord("m7")?.key).toBe("minor7");
  });
  test("resolves 'min' alias to minor", () => {
    expect(resolveChord("min")?.key).toBe("minor");
  });
});

describe("intervals data", () => {
  test("has 12 intervals (0-11)", () => expect(INTERVALS.length).toBe(12));
  test("semitones are sequential 0-11", () => {
    INTERVALS.forEach((iv, i) => expect(iv.semitones).toBe(i));
  });
});
```

- [x] **Step 6: Run tests**

Run: `cd frontend && npx jest lib/engine/__tests__/data.test.ts`
Expected: PASS

- [x] **Step 7: Commit**

```bash
cd frontend && git add lib/engine/types.ts lib/engine/data/ lib/engine/__tests__/data.test.ts
git commit -m "feat: add music theory data (scales, chords, intervals as static TS)"
```

---

### Task 3: Theory Engine Core

Port `TheoryEngine` class methods to standalone TypeScript functions.

**Files:**
- Create: `frontend/lib/engine/theory.ts`
- Create: `frontend/lib/engine/__tests__/theory.test.ts`

**Interfaces:**
- Consumes: `noteToPitchClass`, `pitchClassToName`, `intervalSemitones` from `notes.ts`; `resolveScale` from `data/scales.ts`; `resolveChord` from `data/chords.ts`; `INTERVALS` from `data/intervals.ts`
- Produces:
  - `getScale(root: string, scaleType: string): ScaleResult | null`
  - `getChord(root: string, chordType: string): ChordResult | null`
  - `detectKey(notes: string[]): KeyMatch[]`
  - `chordsInKey(root: string, scaleType: string): ChordResult[]`
  - `suggestScales(chords: string[]): ScaleSuggestion[]`
  - `getInterval(note1: string, note2: string): IntervalInfo`
  - `getFretboardPositions(notes: string[], root?: string, tuning?: string[], fretRange?: [number, number]): FretboardPosition[]`

- [x] **Step 1: Write failing tests**

```typescript
// frontend/lib/engine/__tests__/theory.test.ts
import {
  getScale, getChord, detectKey, chordsInKey,
  suggestScales, getInterval, getFretboardPositions,
} from "../theory";

describe("getScale", () => {
  test("A minor pentatonic", () => {
    const result = getScale("A", "pentatonic_minor");
    expect(result).not.toBeNull();
    expect(result!.root).toBe("A");
    expect(result!.notes).toEqual(["A", "C", "D", "E", "G"]);
  });

  test("C major", () => {
    const result = getScale("C", "major");
    expect(result).not.toBeNull();
    expect(result!.notes).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });

  test("returns null for unknown scale", () => {
    expect(getScale("C", "nonexistent")).toBeNull();
  });

  test("Bb uses flats", () => {
    const result = getScale("Bb", "major");
    expect(result).not.toBeNull();
    expect(result!.notes).toContain("Bb");
    expect(result!.notes).not.toContain("A#");
  });
});

describe("getChord", () => {
  test("C major = C E G", () => {
    const result = getChord("C", "major");
    expect(result).not.toBeNull();
    expect(result!.notes).toEqual(["C", "E", "G"]);
  });

  test("Am7 = A C E G", () => {
    const result = getChord("A", "m7");
    expect(result).not.toBeNull();
    expect(result!.notes).toEqual(["A", "C", "E", "G"]);
  });
});

describe("detectKey", () => {
  test("C D E F G A B detects C major", () => {
    const matches = detectKey(["C", "D", "E", "F", "G", "A", "B"]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].root).toBe("C");
    expect(matches[0].scale.key).toBe("major");
  });

  test("A C D E G detects A minor pentatonic", () => {
    const matches = detectKey(["A", "C", "D", "E", "G"]);
    expect(matches.length).toBeGreaterThan(0);
    // A minor pentatonic should be among top matches
    const hasPent = matches.some(m => m.root === "A" && m.scale.key === "pentatonic_minor");
    expect(hasPent).toBe(true);
  });
});

describe("chordsInKey", () => {
  test("C major has 7 chords", () => {
    const chords = chordsInKey("C", "major");
    expect(chords.length).toBe(7);
  });

  test("first chord in C major is C major", () => {
    const chords = chordsInKey("C", "major");
    expect(chords[0].root).toBe("C");
    expect(chords[0].chord.key).toBe("major");
  });
});

describe("getInterval", () => {
  test("C to G = Perfect 5th", () => {
    const iv = getInterval("C", "G");
    expect(iv.name).toBe("Perfect 5th");
    expect(iv.semitones).toBe(7);
  });
});

describe("getFretboardPositions", () => {
  test("returns positions within default range", () => {
    const positions = getFretboardPositions(["C", "E", "G"], "C");
    expect(positions.length).toBeGreaterThan(0);
    const rootPositions = positions.filter(p => p.isRoot);
    expect(rootPositions.length).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx jest lib/engine/__tests__/theory.test.ts`
Expected: FAIL

- [x] **Step 3: Implement theory.ts**

Port the Python `TheoryEngine` methods. Key logic:

```typescript
// frontend/lib/engine/theory.ts
import { noteToPitchClass, pitchClassToName, intervalSemitones } from "./notes";
import { resolveScale, SCALES } from "./data/scales";
import { resolveChord, CHORDS } from "./data/chords";
import { INTERVALS } from "./data/intervals";
import type {
  ScaleResult, ChordResult, KeyMatch, ScaleSuggestion,
  IntervalInfo, FretboardPosition,
} from "./types";

const SHARP_KEYS = new Set(["C", "G", "D", "A", "E", "B", "F#", "C#"]);
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb"]);

function preferFlats(root: string): boolean {
  if (FLAT_KEYS.has(root)) return true;
  if (SHARP_KEYS.has(root)) return false;
  return root.includes("b");
}

function computeNotes(root: string, intervals: number[], useFlats: boolean): string[] {
  const rootPc = noteToPitchClass(root);
  const notes = [pitchClassToName(rootPc, useFlats)];
  let current = rootPc;
  for (let i = 0; i < intervals.length - 1; i++) {
    current = (current + intervals[i]) % 12;
    notes.push(pitchClassToName(current, useFlats));
  }
  return notes;
}

export function getScale(root: string, scaleType: string): ScaleResult | null {
  const scale = resolveScale(scaleType);
  if (!scale) return null;
  const useFlats = preferFlats(root);
  const notes = computeNotes(root, scale.intervals, useFlats);
  return { scale, root, notes };
}

export function getChord(root: string, chordType: string): ChordResult | null {
  const chord = resolveChord(chordType);
  if (!chord) return null;
  const useFlats = preferFlats(root);
  const rootPc = noteToPitchClass(root);
  const notes = chord.intervals.map(semi => pitchClassToName((rootPc + semi) % 12, useFlats));
  return { chord, root, symbol: chord.symbol, notes };
}

export function detectKey(notes: string[]): KeyMatch[] {
  // Port of TheoryEngine.detect_key — same scoring algorithm
  const inputPcs = notes.map(noteToPitchClass);
  const inputSet = new Set(inputPcs);
  const totalInput = inputSet.size;
  if (totalInput === 0) return [];

  const freq = new Map<number, number>();
  for (const pc of inputPcs) freq.set(pc, (freq.get(pc) ?? 0) + 1);
  const firstPc = inputPcs[0];
  let mostCommonPc = inputPcs[0];
  let maxFreq = 0;
  for (const [pc, count] of freq) {
    if (count > maxFreq) { mostCommonPc = pc; maxFreq = count; }
  }

  const results: KeyMatch[] = [];
  const seen = new Set<string>();

  for (let rootPc = 0; rootPc < 12; rootPc++) {
    for (const useFlats of [false, true]) {
      const rootName = pitchClassToName(rootPc, useFlats);
      for (const [scaleKey, scale] of Object.entries(SCALES)) {
        if (scale.intervals.length > 8) continue;
        const sig = `${rootPc}-${scaleKey}`;
        if (seen.has(sig)) continue;
        seen.add(sig);

        const scaleNotes = computeNotes(rootName, scale.intervals, useFlats);
        const scalePcs = new Set(scaleNotes.map(noteToPitchClass));

        let matched = 0;
        for (const pc of inputSet) if (scalePcs.has(pc)) matched++;
        let matchedScale = 0;
        for (const pc of scalePcs) if (inputSet.has(pc)) matchedScale++;

        if (matched === 0) continue;

        let score = matched / totalInput - 0.1 * (scalePcs.size - matchedScale);
        if (rootPc === firstPc) score += 0.1;
        if (rootPc === mostCommonPc) score += 0.05;

        const outside: string[] = [];
        for (const pc of inputSet) {
          if (!scalePcs.has(pc)) outside.push(pitchClassToName(pc, useFlats));
        }

        results.push({
          root: rootName, scale, score: Math.round(score * 10000) / 10000,
          notesMatched: matched, totalNotes: totalInput, outsideNotes: outside,
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}

export function chordsInKey(root: string, scaleType: string): ChordResult[] {
  // Port of TheoryEngine.chords_in_key — builds diatonic triads
  const sr = getScale(root, scaleType);
  if (!sr) return [];
  const useFlats = preferFlats(root);
  const scalePcs = sr.notes.map(noteToPitchClass);
  const numDegrees = sr.notes.length;

  const TRIAD_QUALITY: Record<string, string> = {
    "4,7": "major", "3,7": "minor", "3,6": "diminished", "4,8": "augmented",
  };

  const results: ChordResult[] = [];
  for (let i = 0; i < numDegrees; i++) {
    const triadRootPc = scalePcs[i];
    const thirdPc = scalePcs[(i + 2) % numDegrees];
    const fifthPc = scalePcs[(i + 4) % numDegrees];
    const int3 = ((thirdPc - triadRootPc) % 12 + 12) % 12;
    const int5 = ((fifthPc - triadRootPc) % 12 + 12) % 12;
    const qualityKey = TRIAD_QUALITY[`${int3},${int5}`] ?? "major";
    const chord = CHORDS[qualityKey];
    if (!chord) continue;
    const triadRootName = pitchClassToName(triadRootPc, useFlats);
    results.push({
      chord, root: triadRootName, symbol: chord.symbol,
      notes: [triadRootName, pitchClassToName(thirdPc, useFlats), pitchClassToName(fifthPc, useFlats)],
    });
  }
  return results;
}

export function suggestScales(chords: string[]): ScaleSuggestion[] {
  // Port of TheoryEngine.suggest_scales
  const chordRe = /^([A-G][#b]?)(.*)$/;
  const allNotes: string[] = [];
  for (const chordStr of chords) {
    const m = chordRe.exec(chordStr);
    if (!m) continue;
    const [, root, quality] = m;
    const cr = getChord(root, quality || "major");
    if (cr) allNotes.push(...cr.notes);
  }
  if (allNotes.length === 0) return [];

  const seen = new Set<number>();
  const unique: string[] = [];
  for (const n of allNotes) {
    const pc = noteToPitchClass(n);
    if (!seen.has(pc)) { seen.add(pc); unique.push(n); }
  }

  return detectKey(unique).map(km => {
    const useFlats = preferFlats(km.root);
    return {
      root: km.root, name: km.scale.name,
      notes: computeNotes(km.root, km.scale.intervals, useFlats),
      score: km.score,
    };
  });
}

export function getInterval(note1: string, note2: string): IntervalInfo {
  const semis = intervalSemitones(note1, note2);
  const iv = INTERVALS.find(i => i.semitones === semis);
  if (!iv) throw new Error(`No interval for ${semis} semitones`);
  return iv;
}

export function getFretboardPositions(
  notes: string[], root?: string, tuning = ["E", "A", "D", "G", "B", "E"],
  fretRange: [number, number] = [0, 15],
): FretboardPosition[] {
  const notePcs = new Set(notes.map(noteToPitchClass));
  const rootPc = root ? noteToPitchClass(root) : null;
  const positions: FretboardPosition[] = [];
  for (let stringIdx = 0; stringIdx < tuning.length; stringIdx++) {
    const openPc = noteToPitchClass(tuning[stringIdx]);
    for (let fret = fretRange[0]; fret <= fretRange[1]; fret++) {
      const pc = (openPc + fret) % 12;
      if (notePcs.has(pc)) {
        positions.push({
          string: stringIdx, fret, note: pitchClassToName(pc),
          isRoot: rootPc !== null && pc === rootPc,
        });
      }
    }
  }
  return positions;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx jest lib/engine/__tests__/theory.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
cd frontend && git add lib/engine/theory.ts lib/engine/__tests__/theory.test.ts
git commit -m "feat: add theory engine (scale/chord/key detection, all algorithmic)"
```

---

### Task 4: ASCII Tab Parser

New module — parses standard ASCII guitar tablature into structured note data.

**Files:**
- Create: `frontend/lib/engine/tab-parser.ts`
- Create: `frontend/lib/engine/__tests__/tab-parser.test.ts`

**Interfaces:**
- Consumes: `ParsedNote`, `TabParseResult` from `types.ts`
- Produces:
  - `parseTab(input: string): TabParseResult`

**How the parser works:**

Standard ASCII tab is 6 lines, one per string, reading left to right. Each line starts with a string label (e, B, G, D, A, E) followed by `|` and then fret numbers separated by `-`. Multi-digit fret numbers (10, 12, 15, etc.) occupy two character positions.

```
e|--0--3--5--|
B|-----------|
G|-----------|
D|-----------|
A|-----------|
E|-----------|
```

The parser:
1. Detects groups of 6 consecutive lines that look like tab (start with note letter + `|`)
2. For each group, identifies which string each line represents
3. Scans left-to-right, extracting fret numbers at each column position
4. Returns `ParsedNote[]` ordered by position (left-to-right sequence)

- [x] **Step 1: Write failing tests**

```typescript
// frontend/lib/engine/__tests__/tab-parser.test.ts
import { parseTab } from "../tab-parser";

describe("parseTab", () => {
  test("parses simple single-note tab", () => {
    const input = `
e|--5--|
B|-----|
G|-----|
D|-----|
A|-----|
E|-----|`;
    const result = parseTab(input);
    expect(result.errors).toHaveLength(0);
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toEqual(
      expect.objectContaining({ string: 1, fret: 5 })
    );
  });

  test("parses multi-digit frets", () => {
    const input = `
e|--12--15--|
B|----------|
G|----------|
D|----------|
A|----------|
E|----------|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(2);
    expect(result.notes[0].fret).toBe(12);
    expect(result.notes[1].fret).toBe(15);
  });

  test("parses notes on multiple strings", () => {
    const input = `
e|-----|
B|--5--|
G|-----|
D|--7--|
A|-----|
E|-----|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(2);
    const strings = result.notes.map(n => n.string).sort();
    expect(strings).toEqual([2, 4]);
  });

  test("handles standard tuning labels (eBGDAE)", () => {
    const input = `
e|--0--|
B|--1--|
G|--0--|
D|--2--|
A|--3--|
E|-----|`;
    const result = parseTab(input);
    expect(result.tuning).toEqual(["E", "A", "D", "G", "B", "E"]);
    expect(result.notes).toHaveLength(5);
  });

  test("handles multiple groups (systems)", () => {
    const input = `
e|--5--3--|
B|--------|
G|--------|
D|--------|
A|--------|
E|--------|

e|--7--8--|
B|--------|
G|--------|
D|--------|
A|--------|
E|--------|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(4);
    expect(result.notes[2].fret).toBe(7);
  });

  test("handles open strings (fret 0)", () => {
    const input = `
e|--0--|
B|-----|
G|-----|
D|-----|
A|-----|
E|--0--|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(2);
    expect(result.notes.every(n => n.fret === 0)).toBe(true);
  });

  test("ignores non-tab lines", () => {
    const input = `
Intro riff:
e|--5--|
B|-----|
G|-----|
D|-----|
A|-----|
E|-----|
(repeat 4x)`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  test("returns error for empty input", () => {
    const result = parseTab("");
    expect(result.notes).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("handles h/p/b/r technique markers between frets", () => {
    const input = `
e|--5h7p5--|
B|---------|
G|---------|
D|---------|
A|---------|
E|---------|`;
    const result = parseTab(input);
    expect(result.notes.length).toBe(3);
    expect(result.notes.map(n => n.fret)).toEqual([5, 7, 5]);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx jest lib/engine/__tests__/tab-parser.test.ts`
Expected: FAIL

- [x] **Step 3: Implement tab-parser.ts**

```typescript
// frontend/lib/engine/tab-parser.ts
import type { ParsedNote, TabParseResult } from "./types";

const STRING_LABELS: Record<string, number> = {
  "e": 1, "B": 2, "G": 3, "D": 4, "A": 5, "E": 6,
};

const TAB_LINE_RE = /^([eEBbGgDdAa])\s*\|(.+)/;

export function parseTab(input: string): TabParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { notes: [], tuning: ["E", "A", "D", "G", "B", "E"], errors: ["No tab content provided"] };
  }

  const lines = trimmed.split("\n");
  const groups = extractTabGroups(lines);

  if (groups.length === 0) {
    return { notes: [], tuning: ["E", "A", "D", "G", "B", "E"], errors: ["No valid tab lines found"] };
  }

  const allNotes: ParsedNote[] = [];
  let globalOffset = 0;

  for (const group of groups) {
    const parsed = parseGroup(group, globalOffset);
    allNotes.push(...parsed);
    const maxPos = group.reduce((max, g) => Math.max(max, g.content.length), 0);
    globalOffset += maxPos;
  }

  return { notes: allNotes, tuning: ["E", "A", "D", "G", "B", "E"], errors: [] };
}

interface TabLine {
  stringNum: number;
  content: string;
}

function extractTabGroups(lines: string[]): TabLine[][] {
  const groups: TabLine[][] = [];
  let current: TabLine[] = [];

  for (const line of lines) {
    const match = TAB_LINE_RE.exec(line.trim());
    if (match) {
      const label = match[1];
      const content = match[2];
      let stringNum: number;
      if (label === "e") stringNum = 1;
      else if (label === "E") {
        stringNum = current.some(l => l.stringNum === 1) ? 6 : 6;
      } else {
        stringNum = STRING_LABELS[label] ?? STRING_LABELS[label.toUpperCase()];
      }
      if (stringNum !== undefined) {
        current.push({ stringNum, content });
      }
    } else {
      if (current.length >= 4) {
        groups.push(current);
      }
      current = [];
    }
  }
  if (current.length >= 4) {
    groups.push(current);
  }
  return groups;
}

function parseGroup(group: TabLine[], positionOffset: number): ParsedNote[] {
  const notes: ParsedNote[] = [];

  for (const { stringNum, content } of group) {
    let i = 0;
    while (i < content.length) {
      const ch = content[i];
      if (ch >= "0" && ch <= "9") {
        let numStr = ch;
        if (i + 1 < content.length && content[i + 1] >= "0" && content[i + 1] <= "9") {
          numStr += content[i + 1];
          i++;
        }
        notes.push({ string: stringNum, fret: parseInt(numStr, 10), position: positionOffset + i });
      }
      i++;
    }
  }

  notes.sort((a, b) => a.position - b.position);
  return notes;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx jest lib/engine/__tests__/tab-parser.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
cd frontend && git add lib/engine/tab-parser.ts lib/engine/__tests__/tab-parser.test.ts
git commit -m "feat: add ASCII tab parser"
```

---

### Task 5: Tab Analyzer

Combines tab parser output with theory engine to produce analysis.

**Files:**
- Create: `frontend/lib/engine/analyzer.ts`
- Create: `frontend/lib/engine/index.ts`
- Create: `frontend/lib/engine/__tests__/analyzer.test.ts`

**Interfaces:**
- Consumes: `parseTab` from `tab-parser.ts`; `detectKey`, `getFretboardPositions` from `theory.ts`; `fretToNote` from `notes.ts`
- Produces:
  - `analyzeTab(input: string): TabAnalysis`
  - Barrel export from `index.ts` re-exports everything

- [x] **Step 1: Write failing tests**

```typescript
// frontend/lib/engine/__tests__/analyzer.test.ts
import { analyzeTab } from "../analyzer";

describe("analyzeTab", () => {
  test("analyzes A minor pentatonic lick", () => {
    const tab = `
e|--5--8--5--|
B|-----------|
G|-----------|
D|-----------|
A|-----------|
E|-----------|`;
    const result = analyzeTab(tab);
    expect(result.noteCount).toBe(3);
    expect(result.uniqueNotes.length).toBeGreaterThan(0);
    expect(result.key).toBeTruthy();
    expect(result.keyMatches.length).toBeGreaterThan(0);
    expect(result.fretboardPositions.length).toBeGreaterThan(0);
    expect(result.fretRange).toEqual([5, 8]);
  });

  test("detects string usage", () => {
    const tab = `
e|--5--|
B|--5--|
G|-----|
D|-----|
A|-----|
E|-----|`;
    const result = analyzeTab(tab);
    expect(result.stringUsage[1]).toBe(1);
    expect(result.stringUsage[2]).toBe(1);
  });

  test("returns empty analysis for invalid input", () => {
    const result = analyzeTab("not a tab");
    expect(result.noteCount).toBe(0);
    expect(result.key).toBe("Unknown");
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx jest lib/engine/__tests__/analyzer.test.ts`
Expected: FAIL

- [x] **Step 3: Implement analyzer.ts**

```typescript
// frontend/lib/engine/analyzer.ts
import { parseTab } from "./tab-parser";
import { detectKey, getFretboardPositions } from "./theory";
import { fretToNote, STANDARD_TUNING, noteToPitchClass, pitchClassToName } from "./notes";
import type { TabAnalysis } from "./types";

export function analyzeTab(input: string): TabAnalysis {
  const parsed = parseTab(input);

  if (parsed.notes.length === 0) {
    return {
      key: "Unknown", notes: [], uniqueNotes: [],
      keyMatches: [], fretboardPositions: [],
      noteCount: 0, fretRange: [0, 0],
      stringUsage: {}, patterns: [],
    };
  }

  const tuning = parsed.tuning;
  const noteNames = parsed.notes.map(n => fretToNote(n.string, n.fret, tuning));
  const uniquePcs = new Set<number>();
  const uniqueNotes: string[] = [];
  for (const name of noteNames) {
    const pc = noteToPitchClass(name);
    if (!uniquePcs.has(pc)) {
      uniquePcs.add(pc);
      uniqueNotes.push(name);
    }
  }

  const keyMatches = uniqueNotes.length >= 2 ? detectKey(uniqueNotes) : [];
  const key = keyMatches.length > 0
    ? `${keyMatches[0].root} ${keyMatches[0].scale.name}`
    : "Unknown";

  const frets = parsed.notes.map(n => n.fret);
  const fretRange: [number, number] = [Math.min(...frets), Math.max(...frets)];

  const fretboardPositions = uniqueNotes.length > 0
    ? getFretboardPositions(
        uniqueNotes,
        keyMatches[0]?.root,
        tuning,
        [Math.max(0, fretRange[0] - 2), Math.min(24, fretRange[1] + 2)],
      )
    : [];

  const stringUsage: Record<number, number> = {};
  for (const n of parsed.notes) {
    stringUsage[n.string] = (stringUsage[n.string] ?? 0) + 1;
  }

  const patterns = detectPatterns(parsed.notes.map(n =>
    noteToPitchClass(fretToNote(n.string, n.fret, tuning))
  ));

  return {
    key, notes: noteNames, uniqueNotes, keyMatches,
    fretboardPositions, noteCount: parsed.notes.length,
    fretRange, stringUsage, patterns,
  };
}

function detectPatterns(pitchClasses: number[]): string[] {
  if (pitchClasses.length < 3) return [];
  const patterns: string[] = [];

  const ascending = pitchClasses.every((pc, i) =>
    i === 0 || (pc !== pitchClasses[i - 1] && ((pc - pitchClasses[i - 1]) % 12 + 12) % 12 <= 6)
  );
  if (ascending) patterns.push("ascending run");

  const descending = pitchClasses.every((pc, i) =>
    i === 0 || (pc !== pitchClasses[i - 1] && ((pitchClasses[i - 1] - pc) % 12 + 12) % 12 <= 6)
  );
  if (descending) patterns.push("descending run");

  const chromatic = pitchClasses.length >= 4 && pitchClasses.every((pc, i) =>
    i === 0 || ((Math.abs(pc - pitchClasses[i - 1]) % 12) === 1 ||
                (12 - Math.abs(pc - pitchClasses[i - 1]) % 12) === 1)
  );
  if (chromatic) patterns.push("chromatic");

  if (new Set(pitchClasses).size === 1) patterns.push("repeated note");

  return patterns;
}
```

- [x] **Step 4: Create barrel export**

```typescript
// frontend/lib/engine/index.ts
export * from "./types";
export * from "./notes";
export * from "./theory";
export * from "./tab-parser";
export * from "./analyzer";
export { SCALES, resolveScale } from "./data/scales";
export { CHORDS, resolveChord } from "./data/chords";
export { INTERVALS } from "./data/intervals";
```

- [x] **Step 5: Run all engine tests**

Run: `cd frontend && npx jest lib/engine/`
Expected: ALL PASS

- [x] **Step 6: Commit**

```bash
cd frontend && git add lib/engine/analyzer.ts lib/engine/index.ts lib/engine/__tests__/analyzer.test.ts
git commit -m "feat: add tab analyzer and barrel export"
```

---

### Task 6: Rewire Theory Page to Use Local Engine

Remove API dependency from the Theory page. Use the TypeScript engine directly.

**Files:**
- Modify: `frontend/app/theory/page.tsx`
- Modify: `frontend/lib/types.ts` (update to re-export engine types)

**Interfaces:**
- Consumes: `getScale`, `getChord`, `chordsInKey`, `getInterval`, `getFretboardPositions`, `suggestScales`, `detectKey` from `lib/engine`
- Produces: updated Theory page, no API calls

- [x] **Step 1: Update lib/types.ts**

Add re-exports from the engine so existing components work. The Fretboard component uses `FretboardPosition` with `is_root` (snake_case). The new engine uses `isRoot` (camelCase). Update the Fretboard component to accept the new shape. Modify `frontend/lib/types.ts` to re-export engine types:

```typescript
// frontend/lib/types.ts — replace contents
export type {
  Scale, Chord, IntervalInfo, ScaleResult, ChordResult,
  KeyMatch, ScaleSuggestion, FretboardPosition,
  ParsedNote, TabParseResult, TabAnalysis,
} from "./engine";
```

- [x] **Step 2: Update Fretboard component for camelCase**

In `frontend/components/Fretboard.tsx`, change the Props interface to use the engine's `FretboardPosition` type (which uses `isRoot` not `is_root`). Update references from `pos.is_root` to `pos.isRoot`:

In `frontend/components/Fretboard.tsx`:
- Change import to: `import type { FretboardPosition } from "@/lib/engine";`
- Replace all `pos.is_root` with `pos.isRoot` (4 occurrences)

- [x] **Step 3: Rewrite theory page to use local engine**

Replace the Theory page to call engine functions directly instead of `api.*`. Key changes:
- Remove `import { api }` 
- Add `import { getScale, getChord, chordsInKey, getInterval, detectKey, suggestScales, getFretboardPositions } from "@/lib/engine";`
- In `ScaleLookup`: replace `api.getScale(root, scaleType)` with direct call to `getScale(root, scaleType)`, which returns synchronously. Adapt the result shape (engine returns `ScaleResult` with nested `.scale` object, so access `result.scale.character` instead of `result.character`, etc.). Compute fretboard positions inline via `getFretboardPositions(result.notes, result.root)`.
- In `ChordLookup`: replace `api.getChord(name)` with parsing the name to extract root + quality, then calling `getChord(root, quality)`.
- In `KeyLookup`: replace `api.getKey(root, scaleType)` with `chordsInKey(root, scaleType)`. Build roman numerals inline.
- In `IntervalLookup`: replace `api.getInterval(note1, note2)` with `getInterval(note1, note2)`.
- All calls become synchronous (no async/await, no try/catch for fetch errors). Set result directly.

- [x] **Step 4: Verify theory page renders**

Start dev server and check:
- Scale lookup works (select A, pentatonic-minor, click Look up)
- Chord lookup works (type Am7, press enter)
- Key lookup works (select C, major)
- Interval lookup works (C to G)
- Fretboard renders for scale results

Run: `cd frontend && npm run dev`
Open: `http://localhost:3000/theory`

- [x] **Step 5: Commit**

```bash
cd frontend && git add lib/types.ts components/Fretboard.tsx app/theory/page.tsx
git commit -m "feat: rewire theory page to local engine (no API)"
```

---

### Task 7: Tab Input Page

New page where users paste ASCII tab and see analysis.

**Files:**
- Create: `frontend/app/tab/page.tsx`
- Modify: `frontend/components/BottomNav.tsx` (add Tab nav item)

**Interfaces:**
- Consumes: `analyzeTab` from `lib/engine`; `Fretboard` component
- Produces: `/tab` route with textarea input and analysis output

- [x] **Step 1: Create tab page**

```tsx
// frontend/app/tab/page.tsx
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
```

- [x] **Step 2: Update BottomNav**

In `frontend/components/BottomNav.tsx`, add the Tab route between Theory and remove Queue:

```typescript
const tabs = [
  { href: "/", label: "Home", icon: "Home" },
  { href: "/tab", label: "Tab", icon: "Tab" },
  { href: "/theory", label: "Theory", icon: "Music" },
];
```

- [x] **Step 3: Verify tab page works**

Run: `cd frontend && npm run dev`
Open: `http://localhost:3000/tab`
- Paste example tab, click Analyze
- Should see: detected key, notes, fretboard, patterns, stats

- [x] **Step 4: Commit**

```bash
cd frontend && git add app/tab/page.tsx components/BottomNav.tsx
git commit -m "feat: add tab analysis page with ASCII tab parser"
```

---

### Task 8: Remove Backend Dependencies and Auth

Strip out Python backend coupling: remove auth middleware, remove API client, simplify Dashboard, remove Queue page.

**Files:**
- Delete: `frontend/middleware.ts`
- Delete: `frontend/app/login/page.tsx`
- Delete: `frontend/app/queue/page.tsx`
- Delete: `frontend/lib/api.ts`
- Modify: `frontend/app/page.tsx` (simplify to static landing)
- Modify: `frontend/app/settings/page.tsx` (remove or simplify)
- Delete: `frontend/app/practice/[artist]/[song]/page.tsx` (requires backend)
- Delete: `frontend/app/songs/[artist]/[song]/page.tsx` (requires backend)

**Interfaces:**
- Consumes: nothing from backend
- Produces: standalone app with only Tab and Theory pages

- [x] **Step 1: Delete auth middleware**

Delete `frontend/middleware.ts` — this redirects to `/login` without a token cookie, which blocks the entire app.

- [x] **Step 2: Delete backend-dependent pages and API client**

Delete these files:
- `frontend/app/login/page.tsx`
- `frontend/app/queue/page.tsx`
- `frontend/app/practice/[artist]/[song]/page.tsx`
- `frontend/app/songs/[artist]/[song]/page.tsx`
- `frontend/lib/api.ts`

- [x] **Step 3: Simplify home page**

Replace `frontend/app/page.tsx` with a simple landing that links to Tab and Theory:

```tsx
// frontend/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">Guitar Tab Engine</h1>
        <p className="text-zinc-400 mt-2">Algorithmic music theory analysis for guitar</p>
      </div>

      <div className="space-y-3">
        <Link
          href="/tab"
          className="block bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-600 transition-colors"
        >
          <h2 className="text-lg font-semibold">Tab Analysis</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Paste ASCII tab to detect key, scales, and get improvisation suggestions
          </p>
        </Link>

        <Link
          href="/theory"
          className="block bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-600 transition-colors"
        >
          <h2 className="text-lg font-semibold">Theory Reference</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Look up scales, chords, keys, and intervals
          </p>
        </Link>
      </div>
    </div>
  );
}
```

- [x] **Step 4: Simplify or remove settings page**

Replace `frontend/app/settings/page.tsx` with a minimal about page or delete it. If keeping, remove any backend references.

- [x] **Step 5: Remove SWR dependency**

SWR was used for API data fetching, no longer needed:

Run: `cd frontend && npm uninstall swr`

- [x] **Step 6: Clean up unused components**

Check if `ProgressBar.tsx`, `SaveIndicator.tsx`, `MarkdownLesson.tsx` are still used. If they reference backend APIs or are only used by deleted pages, delete them.

- [x] **Step 7: Verify app builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

- [x] **Step 8: Commit**

```bash
cd frontend && git add -A
git commit -m "feat: remove backend dependency, auth, and queue (standalone app)"
```

---

### Task 9: Update Vercel Config and Deploy

Ensure the app deploys to Vercel as a standalone Next.js app.

**Files:**
- Modify: `frontend/vercel.json` (verify config)
- Modify: `frontend/next.config.ts` (add output: standalone if needed)

**Interfaces:**
- Consumes: working Next.js app from previous tasks
- Produces: deployable app on Vercel

- [x] **Step 1: Verify vercel.json**

The existing `frontend/vercel.json` should work as-is:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

No changes needed unless build fails.

- [x] **Step 2: Verify build succeeds locally**

Run: `cd frontend && npm run build`
Expected: Build completes. No errors about missing modules, API calls, or auth.

- [x] **Step 3: Run all tests**

Run: `cd frontend && npm test`
Expected: All engine tests pass. Any tests referencing deleted files (api.ts, backend routes) should have been removed.

- [x] **Step 4: Verify dev server works end-to-end**

Run: `cd frontend && npm run dev`
Check these routes:
- `/` — landing page with links
- `/tab` — paste tab, analyze, see results
- `/theory` — scale/chord/key/interval lookups

- [x] **Step 5: Commit final state**

```bash
cd frontend && git add -A
git commit -m "chore: verify build and deploy readiness"
```

- [x] **Step 6: Push to GitHub and deploy**

```bash
git push origin main
```

Vercel picks up the push and deploys automatically (if connected). If not connected, the user can connect the repo to Vercel via the Vercel dashboard.

---

### Task 10: Cleanup and Polish

Remove any leftover dead code, fix lint warnings, update metadata.

**Files:**
- Modify: `frontend/app/layout.tsx` (update title/description)
- Check: all remaining components for dead imports
- Remove: any test files referencing deleted modules

- [x] **Step 1: Update app metadata**

In `frontend/app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: "Guitar Tab Engine",
  description: "Algorithmic music theory analysis for guitar — parse tabs, detect keys, explore scales and chords",
};
```

- [x] **Step 2: Run lint**

Run: `cd frontend && npm run lint`
Fix any warnings about unused imports or dead references.

- [x] **Step 3: Remove dead test files**

Delete any test files under `frontend/` that reference `api.ts` or backend endpoints (check `frontend/__tests__/` or co-located test files).

- [x] **Step 4: Final build verification**

Run: `cd frontend && npm run build && npm test`
Expected: Both pass clean.

- [x] **Step 5: Commit**

```bash
cd frontend && git add -A
git commit -m "chore: cleanup dead code and update metadata"
```
