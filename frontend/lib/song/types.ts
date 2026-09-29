/**
 * Instrument-agnostic song model extracted from an alphaTab Score.
 *
 * String numbering follows the engine convention used everywhere else in
 * this app: string 1 = highest-pitched string (high e), string N = lowest.
 * Tuning arrays are ordered low → high (e.g. ["E","A","D","G","B","E"]).
 */

export type TechniqueId =
  | "bend"
  | "prebend"
  | "release"
  | "vibrato"
  | "hammerOn"
  | "pullOff"
  | "slide"
  | "tapping"
  | "naturalHarmonic"
  | "artificialHarmonic"
  | "palmMute"
  | "deadNote"
  | "ghostNote"
  | "letRing"
  | "tremoloPicking"
  | "trill"
  | "whammy"
  | "graceNote"
  | "doubleStop"
  | "chord"
  | "sweep"
  | "stringSkip"
  | "wideStretch"
  | "positionShift"
  | "tuplet";

export interface SongNote {
  /** 1 = highest string. */
  string: number;
  fret: number;
  /** MIDI pitch (without bends). */
  midi: number;
  /** Tied from a previous note — not a new attack. */
  isTie: boolean;
  techniques: TechniqueId[];
}

export interface SongBeat {
  barIndex: number;
  /** Absolute playback start in MIDI ticks (960 per quarter note). */
  start: number;
  /** Playback duration in ticks. */
  duration: number;
  notes: SongNote[];
  isRest: boolean;
  isGrace: boolean;
  techniques: TechniqueId[];
}

export interface AccompanimentNote {
  /** Absolute tick. */
  start: number;
  duration: number;
  midi: number;
  /** From a bass-register track — its notes define the chord root. */
  bass?: boolean;
}

export interface SongBar {
  index: number;
  /** Absolute start tick and length in ticks. */
  start: number;
  duration: number;
  timeSignature: [number, number];
  tempo: number;
  /** Length of the bar in seconds at 100% speed. */
  seconds: number;
  section: string | null;
  beats: SongBeat[];
  /** Notes of every other pitched track (rhythm guitar, bass, keys…) — the harmony. */
  accompaniment: AccompanimentNote[];
  /** Chord symbols written in the file (any track). */
  chordSymbols: { start: number; name: string }[];
}

export interface TrackInfo {
  index: number;
  name: string;
  isPercussion: boolean;
  stringCount: number;
  /** Low → high note names. */
  tuning: string[];
  noteCount: number;
  /** Beats containing at least one note. */
  beatCount: number;
}

export interface SongModel {
  title: string;
  artist: string;
  album: string;
  tempo: number;
  tracks: TrackInfo[];
  trackIndex: number;
  /** Tuning of the selected track, low → high. */
  tuning: string[];
  tuningName: string;
  bars: SongBar[];
}
