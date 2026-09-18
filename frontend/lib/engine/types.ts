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
  string: number;
  fret: number;
  position: number;
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
