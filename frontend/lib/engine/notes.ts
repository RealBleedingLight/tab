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
