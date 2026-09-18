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
