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
