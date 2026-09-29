import type * as AlphaTab from "@coderline/alphatab";
import { pitchClassToName } from "../engine/notes";
import type { AccompanimentNote, SongBar, SongBeat, SongModel, SongNote, TechniqueId, TrackInfo } from "./types";

type Score = AlphaTab.model.Score;
type Track = AlphaTab.model.Track;
type Beat = AlphaTab.model.Beat;
type Note = AlphaTab.model.Note;

/** MIDI ticks per quarter note used by alphaTab. */
export const TICKS_PER_QUARTER = 960;

// alphaTab enum values (kept numeric so this module never imports alphaTab at runtime).
const HARMONIC_NATURAL = 1;
const BEND_RELEASE = 3;
const BEND_BEND_RELEASE = 4;
const BEND_PREBEND = 6;
const BEND_PREBEND_BEND = 7;
const BEND_PREBEND_RELEASE = 8;

const TUNING_NAMES: [string, number[]][] = [
  ["Standard", [40, 45, 50, 55, 59, 64]],
  ["Drop D", [38, 45, 50, 55, 59, 64]],
  ["E♭ Standard", [39, 44, 49, 54, 58, 63]],
  ["Drop D♭", [37, 44, 49, 54, 58, 63]],
  ["D Standard", [38, 43, 48, 53, 57, 62]],
  ["Drop C", [36, 43, 48, 53, 57, 62]],
  ["C Standard", [36, 41, 46, 51, 55, 60]],
  ["Drop B", [35, 42, 47, 52, 56, 61]],
  ["Open G", [38, 43, 50, 55, 59, 62]],
  ["Open D", [38, 45, 50, 54, 57, 62]],
  ["DADGAD", [38, 45, 50, 55, 57, 62]],
  ["7-string Standard", [35, 40, 45, 50, 55, 59, 64]],
  ["7-string Drop A", [33, 40, 45, 50, 55, 59, 64]],
  ["Bass Standard", [28, 33, 38, 43]],
  ["5-string Bass", [23, 28, 33, 38, 43]],
];

export function tuningName(midiLowToHigh: number[]): string {
  const hit = TUNING_NAMES.find(([, t]) =>
    t.length === midiLowToHigh.length && t.every((v, i) => v === midiLowToHigh[i]));
  return hit ? hit[0] : "Custom";
}

function trackInfo(track: Track): TrackInfo {
  const staff = track.staves[0];
  const tuningMidi = [...(staff?.tuning ?? [])].reverse();
  let noteCount = 0;
  let beatCount = 0;
  if (staff && !staff.isPercussion) {
    for (const bar of staff.bars)
      for (const voice of bar.voices)
        for (const beat of voice.beats) {
          noteCount += beat.notes.length;
          if (beat.notes.length) beatCount++;
        }
  }
  return {
    index: track.index,
    name: track.name || `Track ${track.index + 1}`,
    isPercussion: !!staff?.isPercussion,
    stringCount: tuningMidi.length,
    tuning: tuningMidi.map(m => pitchClassToName(m)),
    noteCount,
    beatCount,
  };
}

export function listTracks(score: Score): TrackInfo[] {
  return score.tracks.map(trackInfo);
}

/**
 * Picks the track most likely to be the one a guitarist wants to learn:
 * a stringed, non-percussion, 6/7-string track with the most notes
 * (lead/solo named tracks get a boost).
 */
export function pickDefaultTrack(tracks: TrackInfo[]): number {
  let best = 0;
  let bestScore = -Infinity;
  for (const t of tracks) {
    if (t.isPercussion || t.stringCount === 0) continue;
    // Beats (not notes) so strummed chord tracks don't outrank the lead line.
    let score = t.beatCount;
    if (t.stringCount === 6 || t.stringCount === 7) score *= 1.5;
    if (/lead|solo/i.test(t.name)) score *= 2;
    if (/bass/i.test(t.name) || t.stringCount <= 5) score *= 0.3;
    if (score > bestScore) { bestScore = score; best = t.index; }
  }
  return best;
}

function noteTechniques(note: Note): TechniqueId[] {
  const out: TechniqueId[] = [];
  if (note.hasBend) {
    const bt = note.bendType;
    if (bt === BEND_PREBEND || bt === BEND_PREBEND_BEND || bt === BEND_PREBEND_RELEASE) out.push("prebend");
    else if (bt === BEND_RELEASE) out.push("release");
    else out.push("bend");
    if (bt === BEND_BEND_RELEASE) out.push("release");
  }
  if (note.vibrato) out.push("vibrato");
  if (note.isHammerPullOrigin && note.hammerPullDestination) {
    out.push(note.hammerPullDestination.fret > note.fret ? "hammerOn" : "pullOff");
  }
  if (note.slideOutType || note.slideInType) out.push("slide");
  if (note.isLeftHandTapped) out.push("tapping");
  if (note.harmonicType) out.push(note.harmonicType === HARMONIC_NATURAL ? "naturalHarmonic" : "artificialHarmonic");
  if (note.isPalmMute) out.push("palmMute");
  if (note.isDead) out.push("deadNote");
  if (note.isGhost) out.push("ghostNote");
  if (note.isLetRing) out.push("letRing");
  if (note.isTrill) out.push("trill");
  return out;
}

function beatTechniques(beat: Beat): TechniqueId[] {
  const out: TechniqueId[] = [];
  if (beat.tap) out.push("tapping");
  if (beat.isTremolo) out.push("tremoloPicking");
  if (beat.hasWhammyBar) out.push("whammy");
  if (beat.graceType) out.push("graceNote");
  // Count each tuplet group once (on its first beat), and ignore plain triplets' duplicates.
  if (beat.hasTuplet && beat.tupletNumerator !== 2 && beat.tupletGroup?.beats[0] === beat) out.push("tuplet");
  if (beat.vibrato) out.push("vibrato");
  const attacks = beat.notes.filter(n => !n.isTieDestination && !n.isDead).length;
  if (attacks === 2) out.push("doubleStop");
  else if (attacks >= 3) out.push("chord");
  return out;
}

/** Converts one track of an alphaTab score into the app's SongModel. */
export function extractSong(score: Score, trackIndex: number): SongModel {
  const tracks = listTracks(score);
  const index = Math.min(Math.max(0, trackIndex), score.tracks.length - 1);
  const track = score.tracks[index];
  const staff = track.staves[0];
  const stringCount = staff.tuning.length;
  const tuningMidi = [...staff.tuning].reverse();

  const bars: SongBar[] = [];
  let tempo = score.tempo || 120;
  // Bass-register tracks: named bass, ≤5 strings, or lowest open string at/below E1.
  const bassTracks = new Set(score.tracks.filter(t => {
    const st = t.staves[0];
    if (!st || st.isPercussion || t.index === index) return false;
    return /bass/i.test(t.name) || (st.tuning.length > 0 && st.tuning.length <= 5) || Math.min(...st.tuning) <= 28;
  }).map(t => t.index));

  for (const bar of staff.bars) {
    const mb = score.masterBars[bar.index];
    const auto = mb.tempoAutomations?.[0];
    if (auto && auto.value > 0) tempo = auto.value;
    const [num, den] = [mb.timeSignatureNumerator, mb.timeSignatureDenominator];
    const quarters = (num * 4) / den;

    const beats: SongBeat[] = [];
    for (const voice of bar.voices) {
      for (const beat of voice.beats) {
        if (beat.isEmpty) continue;
        const notes: SongNote[] = [];
        if (!staff.isPercussion) {
          for (const n of beat.notes) {
            if (n.fret < 0) continue;
            notes.push({
              string: stringCount - n.string + 1,
              fret: n.fret,
              midi: n.realValueWithoutHarmonic,
              isTie: n.isTieDestination,
              techniques: noteTechniques(n),
            });
          }
        }
        beats.push({
          barIndex: bar.index,
          start: beat.absolutePlaybackStart,
          duration: beat.playbackDuration,
          notes,
          isRest: notes.length === 0,
          isGrace: !!beat.graceType,
          techniques: notes.length ? beatTechniques(beat) : [],
        });
      }
    }
    beats.sort((a, b) => a.start - b.start);

    // Harmony context from the other pitched tracks, plus any chord symbols.
    const accompaniment: AccompanimentNote[] = [];
    const chordSymbols: { start: number; name: string }[] = [];
    for (const other of score.tracks) {
      const os = other.staves[0];
      const ob = os?.bars[bar.index];
      if (!os || !ob) continue;
      for (const voice of ob.voices) for (const beat of voice.beats) {
        if (beat.hasChord && beat.chord?.name) chordSymbols.push({ start: beat.absolutePlaybackStart, name: beat.chord.name });
        if (other.index === index || os.isPercussion) continue;
        for (const n of beat.notes) {
          if (n.fret < 0 || n.isTieDestination || n.isDead) continue;
          accompaniment.push({
            start: beat.absolutePlaybackStart, duration: beat.playbackDuration, midi: n.realValueWithoutHarmonic,
            bass: bassTracks.has(other.index) || undefined,
          });
        }
      }
    }

    bars.push({
      index: bar.index,
      start: mb.start,
      duration: mb.calculateDuration(),
      timeSignature: [num, den],
      tempo,
      seconds: (quarters * 60) / tempo,
      section: mb.section ? (mb.section.text || mb.section.marker || "Section") : null,
      beats,
      accompaniment,
      chordSymbols,
    });
  }

  return {
    title: score.title || "Untitled",
    // Some files stash a URL in the artist field — don't show that as a name.
    artist: /^(https?:|www\.)/i.test(score.artist ?? "") ? "" : score.artist || "",
    album: score.album || "",
    tempo: score.tempo || bars[0]?.tempo || 120,
    tracks,
    trackIndex: index,
    tuning: tuningMidi.map(m => pitchClassToName(m)),
    tuningName: tuningName(tuningMidi),
    bars,
  };
}
