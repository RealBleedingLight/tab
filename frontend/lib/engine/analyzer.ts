import { parseTab } from "./tab-parser";
import { detectKey, getFretboardPositions } from "./theory";
import { fretToNote, noteToPitchClass } from "./notes";
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
