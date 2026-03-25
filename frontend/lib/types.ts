export interface Song {
  artist: string;
  song: string;
  path: string;
  context: string | null;
}

export interface FretboardPosition {
  string: number;  // 0 = low E, 5 = high e
  fret: number;
  note: string;
  is_root: boolean;
}

export interface ScaleResult {
  root: string;
  name: string;
  notes: string[];
  intervals: number[];
  category: string;
  character: string;
  common_in: string[];
  chord_fit: string[];
  teaching_note: string;
  improvisation_tip: string;
  fretboard: FretboardPosition[];
}

export interface ChordResult {
  root: string;
  symbol: string;
  name: string;
  notes: string[];
  intervals: number[];
  character: string;
  voicings: Record<string, number[]> | null;
}

export interface KeyChord {
  numeral: string;
  root: string;
  symbol: string;
  notes: string[];
}

export interface KeyResult {
  key: string;
  chords: KeyChord[];
}

export interface KeyMatch {
  root: string;
  scale_name: string;
  score: number;
  notes_matched: number;
  total_notes: number;
  outside_notes: string[];
}

export interface ScaleSuggestion {
  root: string;
  name: string;
  notes: string[];
  score: number;
}

export interface IntervalResult {
  note1: string;
  note2: string;
  name: string;
  short_name: string;
  semitones: number;
  quality: string;
}

export interface QueueFile {
  name: string;
  type: string;
  path: string;
}

export interface JobStatus {
  id: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface SaveProgressRequest {
  context_content: string;
  log_entry: string;
  commit_message: string;
}

export interface LessonFile {
  content: string;
  sha: string;
  filename: string;
}

export interface ContextFile {
  content: string;
  sha: string;
}
