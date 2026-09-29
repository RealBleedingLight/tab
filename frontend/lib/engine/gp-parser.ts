import type { ParsedNote } from "./types";

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNoteName(midi: number): string {
  return SHARP_NAMES[((midi % 12) + 12) % 12];
}

export interface GpParseResult {
  notes: ParsedNote[];
  tuning: string[];
  trackName: string;
  trackNames: string[];
  errors: string[];
}

export async function parseGpFile(
  data: Uint8Array,
  trackIndex = 0,
): Promise<GpParseResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alphaTab = await import("@coderline/alphatab") as any;
  const ScoreLoader = alphaTab.importer.ScoreLoader;
  const Settings = alphaTab.Settings;

  const settings = new Settings();
  let score;
  try {
    score = ScoreLoader.loadScoreFromBytes(data, settings);
  } catch (e) {
    return {
      notes: [], tuning: ["E", "A", "D", "G", "B", "E"],
      trackName: "", trackNames: [],
      errors: [`Failed to parse GP file: ${e instanceof Error ? e.message : String(e)}`],
    };
  }

  const trackNames = score.tracks.map((t: any) => t.name as string);

  if (trackIndex >= score.tracks.length) {
    return {
      notes: [], tuning: ["E", "A", "D", "G", "B", "E"],
      trackName: "", trackNames,
      errors: [`Track ${trackIndex} not found (file has ${score.tracks.length} tracks)`],
    };
  }

  const track = score.tracks[trackIndex];
  const staff = track.staves[0];

  const rawTuning: number[] = staff.tuning;
  const tuning = [...rawTuning].reverse().map(midiToNoteName);

  const notes: ParsedNote[] = [];
  let position = 0;

  for (const bar of staff.bars) {
    for (const voice of bar.voices) {
      for (const beat of voice.beats) {
        for (const note of beat.notes) {
          if (note.fret >= 0) {
            notes.push({
              string: note.string,
              fret: note.fret,
              position,
            });
          }
        }
        position++;
      }
    }
  }

  return { notes, tuning, trackName: track.name, trackNames, errors: [] };
}
