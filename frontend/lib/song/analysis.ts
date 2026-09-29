import { pitchClassToName } from "../engine/notes";
import { SCALES } from "../engine/data/scales";
import type { KeyMatch } from "../engine/types";
import { TECHNIQUES } from "./techniques";
import type { SongBeat, SongModel, TechniqueId } from "./types";

const SIXTEENTH = 240; // ticks

export interface RangeAnalysis {
  startBar: number;
  endBar: number;
  /** Attacked (non-tied) notes. */
  noteCount: number;
  seconds: number;
  /** Average attacks per second at 100% speed. */
  notesPerSecond: number;
  /** Busiest bar's attacks per second. */
  peakNotesPerSecond: number;
  techniques: Partial<Record<TechniqueId, number>>;
  /** Techniques sorted by how much they matter (weight × frequency). */
  topTechniques: TechniqueId[];
  fretRange: [number, number];
  stringsUsed: number[];
  noteNames: string[];
  uniqueNotes: string[];
  keyMatches: KeyMatch[];
  /** 1 (easy) – 5 (very hard). */
  difficulty: number;
  difficultyReasons: string[];
  /** Recommended practice speeds in percent. */
  startSpeed: number;
  targetSpeed: number;
  isEmpty: boolean;
}

/** Common guitarist spellings for key roots. */
const ROOT_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/** Candidate keys with a small prior so common tonalities win ties. */
const KEY_CANDIDATES: [string, number][] = [
  ["pentatonic_minor", 0.012], ["natural_minor", 0.01], ["major", 0.01],
  ["blues", 0.004], ["pentatonic_major", 0.004], ["dorian", -0.012], ["mixolydian", -0.012],
  ["harmonic_minor", -0.015], ["phrygian", -0.025], ["lydian", -0.025],
  ["phrygian_dominant", -0.03], ["melodic_minor", -0.03],
];

function scalePcs(root: number, intervals: number[]): number[] {
  const out = [root];
  let cur = root;
  for (let i = 0; i < intervals.length - 1; i++) { cur = (cur + intervals[i]) % 12; out.push(cur); }
  return out;
}

/**
 * Key detection weighted by note duration, with emphasis on the notes a
 * phrase leans on (root, fifth, final note). Far more stable for solos than
 * a plain "which scale contains these notes" match, which rewards exotic
 * 8-note scales whenever a few chromatic passing tones appear.
 */
export function detectWeightedKey(weights: number[], firstPc: number | null, lastPc: number | null): KeyMatch[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  const used = weights.filter(w => w > 0).length;
  const results: KeyMatch[] = [];
  for (let root = 0; root < 12; root++) {
    for (const [key, prior] of KEY_CANDIDATES) {
      const scale = SCALES[key];
      if (!scale) continue;
      const pcs = scalePcs(root, scale.intervals);
      const set = new Set(pcs);
      let inW = 0;
      let matched = 0;
      for (let pc = 0; pc < 12; pc++) if (set.has(pc) && weights[pc] > 0) { inW += weights[pc]; matched++; }
      const missing = pcs.filter(pc => weights[pc] === 0).length;
      let score = inW / total
        + 0.35 * (weights[root] / total)
        + (set.has((root + 7) % 12) ? 0.1 * (weights[(root + 7) % 12] / total) : 0)
        - 0.03 * missing
        + prior;
      if (lastPc === root) score += 0.04;
      if (firstPc === root) score += 0.02;
      const outside: string[] = [];
      for (let pc = 0; pc < 12; pc++) if (weights[pc] > 0 && !set.has(pc)) outside.push(ROOT_NAMES[pc]);
      results.push({
        root: ROOT_NAMES[root], scale, score: Math.round(score * 10000) / 10000,
        notesMatched: matched, totalNotes: used, outsideNotes: outside,
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}

function round5(n: number) {
  return Math.round(n / 5) * 5;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function inc(map: Partial<Record<TechniqueId, number>>, id: TechniqueId, by = 1) {
  map[id] = (map[id] ?? 0) + by;
}

interface Attack {
  beat: SongBeat;
  string: number;
  fret: number;
  slide: boolean;
  legato: boolean;
}

/** Single-note attacks in playing order — the input for phrase-shape detectors. */
function singleAttacks(beats: SongBeat[]): Attack[] {
  const out: Attack[] = [];
  for (const b of beats) {
    const attacks = b.notes.filter(n => !n.isTie);
    if (attacks.length !== 1) continue;
    const n = attacks[0];
    out.push({
      beat: b, string: n.string, fret: n.fret,
      slide: n.techniques.includes("slide"),
      legato: n.techniques.includes("hammerOn") || n.techniques.includes("pullOff"),
    });
  }
  return out;
}

function detectShapes(attacks: Attack[], techniques: Partial<Record<TechniqueId, number>>) {
  // Sweeps: ≥3 fast consecutive notes, one per adjacent string, same direction.
  let run = 1;
  let dir = 0;
  for (let i = 1; i < attacks.length; i++) {
    const a = attacks[i - 1];
    const b = attacks[i];
    const d = b.string - a.string;
    const fast = a.beat.duration <= SIXTEENTH * 1.34 && !a.legato;
    if (Math.abs(d) === 1 && fast && (dir === 0 || Math.sign(d) === dir)) {
      dir = Math.sign(d);
      run++;
    } else {
      if (run >= 4) inc(techniques, "sweep");
      run = Math.abs(d) === 1 && fast ? 2 : 1;
      dir = run === 2 ? Math.sign(d) : 0;
    }
  }
  if (run >= 4) inc(techniques, "sweep");

  for (let i = 1; i < attacks.length; i++) {
    const a = attacks[i - 1];
    const b = attacks[i];
    // String skipping: consecutive attacks jumping over ≥1 string, in quick succession.
    if (Math.abs(b.string - a.string) >= 2 && a.beat.duration <= SIXTEENTH * 2) inc(techniques, "stringSkip");
    // Position shifts: big fret jumps not covered by a slide or open string.
    if (a.fret > 0 && b.fret > 0 && !a.slide && Math.abs(b.fret - a.fret) >= 7) inc(techniques, "positionShift");
  }

  // Wide stretches: 3 consecutive fretted notes over ≥2 strings spanning 5–7 frets, no jump ≥ 5.
  for (let i = 2; i < attacks.length; i++) {
    const w = attacks.slice(i - 2, i + 1);
    if (w.some(x => x.fret === 0 || x.slide)) continue;
    if (new Set(w.map(x => x.string)).size < 2) continue;
    const frets = w.map(x => x.fret);
    const span = Math.max(...frets) - Math.min(...frets);
    const bigJump = Math.abs(frets[1] - frets[0]) >= 5 || Math.abs(frets[2] - frets[1]) >= 5;
    if (span >= 5 && span <= 7 && !bigJump) inc(techniques, "wideStretch");
  }
}

export function analyzeRange(song: SongModel, startBar: number, endBar: number): RangeAnalysis {
  const bars = song.bars.slice(startBar, endBar + 1);
  const beats = bars.flatMap(b => b.beats);
  const techniques: Partial<Record<TechniqueId, number>> = {};
  const noteNames: string[] = [];
  const frets: number[] = [];
  const pcWeights = new Array(12).fill(0);
  let firstPc: number | null = null;
  let lastPc: number | null = null;
  const strings = new Set<number>();
  let noteCount = 0;
  let peak = 0;
  let seconds = 0;

  for (const bar of bars) {
    seconds += bar.seconds;
    let barAttacks = 0;
    for (const beat of bar.beats) {
      if (beat.isRest) continue;
      if (beat.notes.some(n => !n.isTie)) barAttacks++;
      for (const t of beat.techniques) inc(techniques, t);
      for (const n of beat.notes) {
        for (const t of n.techniques) inc(techniques, t);
        if (n.isTie) continue;
        noteCount++;
        const pc = n.midi % 12;
        noteNames.push(pitchClassToName(pc));
        pcWeights[pc] += Math.min(beat.duration, 1920) + 120;
        if (firstPc === null) firstPc = pc;
        lastPc = pc;
        strings.add(n.string);
        if (n.fret > 0) frets.push(n.fret);
      }
    }
    if (bar.seconds > 0) peak = Math.max(peak, barAttacks / bar.seconds);
  }
  detectShapes(singleAttacks(beats), techniques);

  const unique = [...new Set(noteNames)];
  const keyMatches = unique.length >= 3 ? detectWeightedKey(pcWeights, firstPc, lastPc) : [];
  const nps = seconds > 0 ? beats.filter(b => b.notes.some(n => !n.isTie)).length / seconds : 0;

  // Difficulty: speed dominates, techniques add on top.
  const reasons: string[] = [];
  const speedScore = clamp((peak - 2) / 2.5, 0, 4);
  if (peak >= 8) reasons.push(`Fast: up to ${peak.toFixed(1)} notes/sec`);
  else if (peak >= 5) reasons.push(`Moderately fast: up to ${peak.toFixed(1)} notes/sec`);

  const weighted = (Object.entries(techniques) as [TechniqueId, number][])
    .map(([id, count]) => ({ id, count, score: TECHNIQUES[id].weight * Math.min(1, count / 3) }))
    .sort((a, b) => b.score - a.score || b.count - a.count);
  const techScore = Math.min(2, weighted.reduce((s, w) => s + w.score, 0) * 0.4);
  for (const w of weighted.slice(0, 3)) {
    if (TECHNIQUES[w.id].weight >= 1.25) reasons.push(`${TECHNIQUES[w.id].name} (${w.count}×)`);
  }

  const span = frets.length ? Math.max(...frets) - Math.min(...frets) : 0;
  const spanScore = span >= 12 ? 0.5 : 0;
  if (spanScore) reasons.push(`Covers ${span} frets of the neck`);

  const difficulty = noteCount === 0
    ? 1
    : clamp(Math.round(1 + speedScore * 0.75 + techScore * 0.6 + spanScore), 1, 5);


  // Start slow enough that the busiest bar is ~4 notes/sec; always leave room to climb.
  const startSpeed = peak > 0 ? clamp(round5((100 * 4) / peak), 40, 80) : 80;

  return {
    startBar, endBar, noteCount, seconds,
    notesPerSecond: nps,
    peakNotesPerSecond: peak,
    techniques,
    topTechniques: weighted.map(w => w.id),
    fretRange: frets.length ? [Math.min(...frets), Math.max(...frets)] : [0, 0],
    stringsUsed: [...strings].sort((a, b) => a - b),
    noteNames,
    uniqueNotes: unique,
    keyMatches,
    difficulty,
    difficultyReasons: reasons,
    startSpeed,
    targetSpeed: 100,
    isEmpty: noteCount === 0,
  };
}

export interface Section {
  id: string;
  /** Marker / region name, e.g. "Solo" or "Part 1". */
  region: string;
  name: string;
  startBar: number;
  endBar: number;
  analysis: RangeAnalysis;
}

export interface Region {
  name: string;
  startBar: number;
  endBar: number;
  sections: Section[];
}

function barHasNotes(song: SongModel, i: number) {
  return song.bars[i].beats.some(b => b.notes.some(n => !n.isTie));
}

function barAttacks(song: SongModel, i: number) {
  return song.bars[i].beats.filter(b => b.notes.some(n => !n.isTie)).length;
}

/**
 * Splits the song into regions (from Guitar Pro markers, or evenly sized
 * parts when there are none) and each region into bite-sized practice
 * sections of 1–4 bars — busier passages get shorter sections.
 */
export function buildRegions(song: SongModel): Region[] {
  const n = song.bars.length;
  if (n === 0) return [];

  const bounds: { name: string; start: number }[] = [];
  song.bars.forEach((b, i) => { if (b.section) bounds.push({ name: b.section, start: i }); });
  if (bounds.length === 0 || bounds[0].start !== 0) {
    if (bounds.length === 0) {
      const partSize = 16;
      const parts = Math.max(1, Math.round(n / partSize));
      const size = Math.ceil(n / parts);
      for (let p = 0; p < parts; p++) bounds.push({ name: parts > 1 ? `Part ${p + 1}` : "Full song", start: p * size });
    } else {
      bounds.unshift({ name: "Intro", start: 0 });
    }
  }

  const regions: Region[] = [];
  bounds.forEach((b, bi) => {
    const end = (bounds[bi + 1]?.start ?? n) - 1;
    // Trim silent bars at the edges of the region.
    let s = b.start;
    let e = end;
    while (s <= e && !barHasNotes(song, s)) s++;
    while (e >= s && !barHasNotes(song, e)) e--;
    if (s > e) return;

    const region: Region = { name: b.name, startBar: s, endBar: e, sections: [] };
    // Split into phrases at silent bars, then each phrase into even chunks
    // of ≤4 bars (fewer bars per chunk when the playing is dense).
    let i = s;
    while (i <= e) {
      while (i <= e && !barHasNotes(song, i)) i++;
      if (i > e) break;
      let j = i;
      let attacks = 0;
      while (j <= e && barHasNotes(song, j)) attacks += barAttacks(song, j++);
      const len = j - i;
      const chunks = Math.min(len, Math.max(Math.ceil(len / 4), Math.ceil(attacks / 36)));
      let start = i;
      for (let c = 0; c < chunks; c++) {
        const size = Math.floor(len / chunks) + (c < len % chunks ? 1 : 0);
        pushSection(song, region, start, start + size - 1);
        start += size;
      }
      i = j;
    }
    mergeTinySections(song, region);
    if (region.sections.length) regions.push(region);
  });

  // De-duplicate region names ("Verse", "Verse" → "Verse", "Verse 2").
  const seen = new Map<string, number>();
  for (const r of regions) {
    const c = (seen.get(r.name) ?? 0) + 1;
    seen.set(r.name, c);
    if (c > 1) {
      r.name = `${r.name} ${c}`;
      r.sections.forEach(s => { s.region = r.name; s.name = sectionName(r.name, s.startBar, s.endBar); });
    }
  }
  return regions;
}

/** Folds chunks with only a handful of notes into their neighbour. */
function mergeTinySections(song: SongModel, region: Region) {
  const out: Section[] = [];
  for (const sec of region.sections) {
    const prev = out[out.length - 1];
    const tiny = sec.analysis.noteCount < 6;
    if (prev && (tiny || prev.analysis.noteCount < 6) && sec.endBar - prev.startBar < 6) {
      out[out.length - 1] = makeSection(song, region.name, prev.startBar, sec.endBar);
    } else {
      out.push(sec);
    }
  }
  region.sections = out;
}

function sectionName(region: string, s: number, e: number) {
  return `${region} · ${s === e ? `bar ${s + 1}` : `bars ${s + 1}–${e + 1}`}`;
}

function makeSection(song: SongModel, region: string, s: number, e: number): Section {
  return {
    id: `s${s}-${e}`,
    region,
    name: sectionName(region, s, e),
    startBar: s,
    endBar: e,
    analysis: analyzeRange(song, s, e),
  };
}

function pushSection(song: SongModel, region: Region, s: number, e: number) {
  region.sections.push(makeSection(song, region.name, s, e));
}

export function keyLabel(a: RangeAnalysis): string {
  const k = a.keyMatches[0];
  return k ? `${k.root} ${k.scale.name}` : "—";
}
