import { SCALES } from "../engine/data/scales";
import { CHORDS, resolveChord } from "../engine/data/chords";
import { noteToPitchClass } from "../engine/notes";
import type { Scale } from "../engine/types";
import type { SongModel } from "./types";

/**
 * Harmony analysis: which chord is sounding under each part of the solo,
 * what key the song is in, which scale fits each chord, and how the lead
 * line relates to the chords (chord tones vs. tensions vs. outside notes).
 *
 * Chords come from, in order of trust:
 *   1. chord symbols written in the file,
 *   2. the accompaniment (rhythm guitar, bass, keys …),
 *   3. the melody itself ("implied" harmony — solo-only files).
 */

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_KEYS = new Set([5, 10, 3, 8, 1]); // F, Bb, Eb, Ab, Db (major tonic pcs)

export type ChordSource = "symbol" | "accompaniment" | "implied";

interface Template {
  quality: string; // key into CHORDS
  intervals: number[];
  prior: number;
}

const TEMPLATES: Template[] = [
  { quality: "major", intervals: [0, 4, 7], prior: 0.04 },
  { quality: "minor", intervals: [0, 3, 7], prior: 0.04 },
  { quality: "dominant7", intervals: [0, 4, 7, 10], prior: 0 },
  { quality: "major7", intervals: [0, 4, 7, 11], prior: 0 },
  { quality: "minor7", intervals: [0, 3, 7, 10], prior: 0 },
  { quality: "minor7b5", intervals: [0, 3, 6, 10], prior: -0.02 },
  { quality: "diminished", intervals: [0, 3, 6], prior: -0.02 },
  { quality: "sus4", intervals: [0, 5, 7], prior: -0.03 },
  { quality: "sus2", intervals: [0, 2, 7], prior: -0.03 },
  { quality: "power5", intervals: [0, 7], prior: -0.06 },
];
const IMPLIED_TEMPLATES = TEMPLATES.filter(t => ["major", "minor"].includes(t.quality));

export interface ChordEvent {
  bar: number;
  start: number;
  end: number;
  rootPc: number;
  quality: string;
  symbol: string;
  pcs: number[];
  source: ChordSource;
  confidence: number;
}

export interface SongKey {
  rootPc: number;
  root: string;
  scale: Scale;
  pcs: number[];
  name: string;
  isMinor: boolean;
}

export interface ChordGuide {
  symbol: string;
  rootPc: number;
  quality: string;
  numeral: string;
  chordTones: { note: string; role: string }[];
  /** Best-fit scale for improvising over this chord. */
  scale: { root: string; name: string; key: string; pcs: number[]; why: string };
  pentatonic: { root: string; name: string; pcs: number[] };
  /** Notes to aim for on strong beats (3rd, 7th …). */
  targets: { note: string; role: string }[];
  /** How the lead line actually uses this chord (null when no lead notes over it). */
  usage: { chordTone: number; scaleTone: number; outside: number; notes: number; favourite: { note: string; role: string } | null } | null;
  bars: number[];
}

export interface HarmonyAnalysis {
  source: ChordSource | null;
  key: SongKey;
  chords: ChordEvent[];
  guides: ChordGuide[];
  /** Share of attacked lead notes that are chord tones of the chord underneath. */
  chordToneRatio: number;
  strongBeatChordToneRatio: number;
}

const pcName = (pc: number, flats: boolean) => (flats ? NAMES : SHARP_NAMES)[((pc % 12) + 12) % 12];

function scalePcs(rootPc: number, steps: number[]): number[] {
  const out = [rootPc];
  let cur = rootPc;
  for (let i = 0; i < steps.length - 1; i++) { cur = (cur + steps[i]) % 12; out.push(cur); }
  return out;
}

const INTERVAL_ROLE = ["R", "b9", "9", "b3", "3", "11", "#11", "5", "b13", "13", "b7", "7"];
function role(chordRoot: number, pc: number, quality: string): string {
  const iv = ((pc - chordRoot) % 12 + 12) % 12;
  const chord = CHORDS[quality];
  if (chord?.intervals.map(x => x % 12).includes(iv)) {
    if (iv === 3) return "b3";
    if (iv === 6) return "b5";
    if (iv === 8 && quality.startsWith("aug")) return "#5";
    if (iv === 9 && quality.includes("dim")) return "bb7";
    if (iv === 2) return quality === "sus2" ? "2" : "9";
    if (iv === 5) return quality === "sus4" ? "4" : "11";
  }
  if (iv === 3 && chord?.intervals.includes(4)) return "#9";
  return INTERVAL_ROLE[iv];
}

function symbolFor(rootPc: number, quality: string, flats: boolean) {
  return `${pcName(rootPc, flats)}${CHORDS[quality]?.symbol ?? ""}`;
}

// ---- chord detection ------------------------------------------------------

interface Window { start: number; end: number; weights: number[]; bassPc: number | null; total: number }

function bestChord(w: Window, templates: Template[], keyPcs: Set<number> | null) {
  let best: { rootPc: number; t: Template; score: number } | null = null;
  for (let root = 0; root < 12; root++) {
    for (const t of templates) {
      const pcs = t.intervals.map(i => (root + i) % 12);
      const set = new Set(pcs);
      let inW = 0;
      for (const pc of pcs) inW += w.weights[pc];
      const outW = w.total - inW;
      const missing = pcs.filter(pc => w.weights[pc] < w.total * 0.03).length;
      let score = inW / w.total - 0.6 * (outW / w.total) - 0.12 * missing + t.prior;
      if (w.bassPc !== null) score += w.bassPc === root ? 0.25 : set.has(w.bassPc) ? 0.03 : -0.05;
      if (keyPcs) score += pcs.every(pc => keyPcs.has(pc)) ? 0.2 : 0;
      if (!best || score > best.score) best = { rootPc: root, t, score };
    }
  }
  return best;
}

function windowFrom(notes: { start: number; duration: number; midi: number; accent?: number; bass?: boolean }[], start: number, end: number): Window {
  const weights = new Array(12).fill(0);
  const bassW = new Map<number, number>();
  let lowest: { midi: number; start: number } | null = null;
  let firstBass: { pc: number; start: number } | null = null;
  for (const n of notes) {
    const s = Math.max(start, n.start);
    const e = Math.min(end, n.start + n.duration);
    if (e <= s) continue;
    const w = (e - s) * (n.accent ?? 1);
    weights[n.midi % 12] += w;
    // The note a bass player hits at the start of the window is almost always the root.
    if (n.bass && (!firstBass || n.start < firstBass.start)) firstBass = { pc: n.midi % 12, start: n.start };
    if (n.midi < 52) bassW.set(n.midi % 12, (bassW.get(n.midi % 12) ?? 0) + w * (n.start <= start + 120 ? 2 : 1));
    if (!lowest || n.midi < lowest.midi) lowest = { midi: n.midi, start: n.start };
  }
  let bassPc: number | null = null;
  if (firstBass) bassPc = firstBass.pc;
  else if (bassW.size) bassPc = [...bassW.entries()].sort((a, b) => b[1] - a[1])[0][0];
  else if (lowest) bassPc = lowest.midi % 12;
  return { start, end, weights, bassPc, total: weights.reduce((a, b) => a + b, 0) };
}

function parseSymbol(name: string): { rootPc: number; quality: string } | null {
  const m = /^([A-G][#b]?)([^/]*)/.exec(name.trim());
  if (!m) return null;
  let rootPc: number;
  try { rootPc = noteToPitchClass(m[1]); } catch { return null; }
  const q = m[2].trim();
  const chord = q === "" ? CHORDS.major : resolveChord(q) ?? (q.startsWith("m") && !q.startsWith("maj") ? CHORDS.minor : CHORDS.major);
  return chord ? { rootPc, quality: chord.key } : null;
}

function detectChords(song: SongModel, keyPcs: Set<number> | null): { chords: ChordEvent[]; source: ChordSource | null } {
  const hasSymbols = song.bars.some(b => b.chordSymbols.length);
  const hasAcc = song.bars.some(b => b.accompaniment.length);
  const source: ChordSource | null = hasSymbols ? "symbol" : hasAcc ? "accompaniment" : song.bars.some(b => b.beats.some(bt => bt.notes.length)) ? "implied" : null;
  const chords: ChordEvent[] = [];
  const flats = false; // re-spelled once the key is known

  for (const bar of song.bars) {
    const end = bar.start + bar.duration;
    if (source === "symbol") {
      const syms = [...bar.chordSymbols].sort((a, b) => a.start - b.start);
      syms.forEach((sym, i) => {
        const p = parseSymbol(sym.name);
        if (!p) return;
        chords.push({
          bar: bar.index, start: sym.start, end: syms[i + 1]?.start ?? end, rootPc: p.rootPc, quality: p.quality,
          symbol: sym.name, pcs: (CHORDS[p.quality]?.intervals ?? [0, 4, 7]).map(i => (p.rootPc + i) % 12),
          source, confidence: 1,
        });
      });
      continue;
    }

    const notes = source === "accompaniment"
      ? bar.accompaniment
      : bar.beats.flatMap(bt => bt.notes.filter(n => !n.isTie).map(n => ({
          start: bt.start, duration: bt.duration, midi: n.midi,
          // Notes on the beat say more about the implied chord than passing notes.
          accent: (bt.start - bar.start) % 960 === 0 ? 1.6 : 1,
        })));
    const templates = source === "accompaniment" ? TEMPLATES : IMPLIED_TEMPLATES;
    const whole = windowFrom(notes, bar.start, end);
    if (whole.total === 0) continue;

    const mid = bar.start + bar.duration / 2;
    const halves = [windowFrom(notes, bar.start, mid), windowFrom(notes, mid, end)];
    const wBest = bestChord(whole, templates, source === "implied" ? keyPcs : null)!;
    const hBest = halves.map(h => (h.total > 0 ? bestChord(h, templates, source === "implied" ? keyPcs : null) : null));
    // Split the bar only for a clear change of root (not e.g. Bm → Bm7), and never
    // for implied harmony — melodies outline chords too loosely for that.
    const split = source !== "implied" && hBest[0] && hBest[1]
      && hBest[0].rootPc !== hBest[1].rootPc
      && (hBest[0].score + hBest[1].score) / 2 > wBest.score + 0.15;

    const push = (w: Window, b: NonNullable<typeof wBest>) => chords.push({
      bar: bar.index, start: w.start, end: w.end, rootPc: b.rootPc, quality: b.t.quality,
      symbol: symbolFor(b.rootPc, b.t.quality, flats),
      pcs: b.t.intervals.map(i => (b.rootPc + i) % 12),
      source: source!, confidence: Math.max(0, Math.min(1, b.score)),
    });
    if (split) { push(halves[0], hBest[0]!); push(halves[1], hBest[1]!); }
    else push(whole, wBest);
  }

  // Merge consecutive identical chords into one event.
  const merged: ChordEvent[] = [];
  for (const c of chords) {
    const prev = merged[merged.length - 1];
    if (prev && prev.symbol === c.symbol && prev.end >= c.start - 1 && prev.bar === c.bar) prev.end = c.end;
    else merged.push({ ...c });
  }
  return { chords: merged, source };
}

// ---- key ------------------------------------------------------------------

const KEY_SCALES: [string, number][] = [
  ["natural_minor", 0.01], ["major", 0.01], ["dorian", -0.03], ["mixolydian", -0.03],
  ["harmonic_minor", -0.04], ["phrygian", -0.05], ["lydian", -0.05],
];
const MINOR_LIKE = new Set(["natural_minor", "dorian", "harmonic_minor", "phrygian", "pentatonic_minor", "blues", "melodic_minor"]);

function detectKey(song: SongModel, chords: ChordEvent[]): SongKey {
  // Pitch profile of the whole band: lead + accompaniment, each normalised.
  const lead = new Array(12).fill(0);
  const acc = new Array(12).fill(0);
  for (const bar of song.bars) {
    for (const bt of bar.beats) for (const n of bt.notes) if (!n.isTie) lead[n.midi % 12] += Math.min(bt.duration, 1920) + 120;
    for (const a of bar.accompaniment) acc[a.midi % 12] += Math.min(a.duration, 3840);
  }
  const norm = (v: number[]) => { const t = v.reduce((a, b) => a + b, 0) || 1; return v.map(x => x / t); };
  const nl = norm(lead);
  const na = norm(acc);
  const hasAcc = acc.some(x => x > 0);
  const w = nl.map((x, i) => (hasAcc ? 0.4 * x + 0.6 * na[i] : x));

  const chordDur = chords.reduce((s, c) => s + (c.end - c.start), 0) || 1;
  const first = chords[0];
  const last = chords[chords.length - 1];
  let best: { root: number; key: string; score: number } | null = null;
  for (let root = 0; root < 12; root++) {
    for (const [key, prior] of KEY_SCALES) {
      const scale = SCALES[key];
      if (!scale) continue;
      const pcs = scalePcs(root, scale.intervals);
      const set = new Set(pcs);
      const minor = MINOR_LIKE.has(key);
      let score = pcs.reduce((s, pc) => s + w[pc], 0) + 0.3 * w[root] + prior;
      // Harmony fit: how much of the song's chords are diatonic (V in minor allowed).
      let fit = 0;
      for (const c of chords) {
        const diatonic = c.pcs.every(pc => set.has(pc));
        const minorV = minor && c.rootPc === (root + 7) % 12 && c.pcs.includes((root + 11) % 12);
        if (diatonic || minorV) fit += c.end - c.start;
        if (c.rootPc === root) fit += 0.5 * (c.end - c.start);
      }
      score += chords.length ? 0.4 * (fit / chordDur) : 0;
      // Songs usually start and/or end on the tonic chord.
      for (const c of [first, last]) {
        if (!c || c.rootPc !== root) continue;
        const cMinor = c.pcs.includes((root + 3) % 12);
        score += cMinor === minor ? 0.08 : 0.02;
      }
      if (!best || score > best.score) best = { root, key, score };
    }
  }
  const b = best ?? { root: 0, key: "major", score: 0 };
  const scale = SCALES[b.key];
  const isMinor = MINOR_LIKE.has(b.key);
  const flats = FLAT_KEYS.has(isMinor ? (b.root + 3) % 12 : b.root);
  return {
    rootPc: b.root, root: pcName(b.root, flats), scale,
    pcs: scalePcs(b.root, scale.intervals), name: `${pcName(b.root, flats)} ${scale.name}`, isMinor,
  };
}

// ---- chord → scale --------------------------------------------------------

const SEVEN_NOTE = ["major", "dorian", "phrygian", "lydian", "mixolydian", "natural_minor", "locrian",
  "harmonic_minor", "phrygian_dominant", "melodic_minor", "lydian_dominant", "super_locrian"];

function nameScale(rootPc: number, pcs: number[]): string | null {
  const set = new Set(pcs.map(pc => ((pc - rootPc) % 12 + 12) % 12));
  for (const key of SEVEN_NOTE) {
    const s = SCALES[key];
    if (!s) continue;
    const ivs = scalePcs(0, s.intervals);
    if (ivs.length === set.size && ivs.every(i => set.has(i))) return key;
  }
  return null;
}

const FALLBACK_SCALE: Record<string, string> = {
  major: "mixolydian", minor: "dorian", dominant7: "mixolydian", major7: "lydian", minor7: "dorian",
  minor7b5: "locrian", diminished: "locrian", sus4: "mixolydian", sus2: "major", power5: "natural_minor",
};

function numeral(keyRoot: number, c: { rootPc: number; quality: string }) {
  const ROM = ["I", "bII", "II", "bIII", "III", "IV", "#IV", "V", "bVI", "VI", "bVII", "VII"];
  let n = ROM[((c.rootPc - keyRoot) % 12 + 12) % 12];
  const minorish = ["minor", "minor7", "minor7b5", "diminished", "diminished7", "minor6", "minor9", "minor_major7"].includes(c.quality);
  if (minorish) n = n.replace(/[IV]+/, m => m.toLowerCase());
  if (c.quality === "diminished" || c.quality === "diminished7") n += "°";
  if (c.quality === "minor7b5") n += "ø";
  const sym = CHORDS[c.quality]?.symbol ?? "";
  if (/7|9|11|13/.test(sym) && c.quality !== "minor7b5") n += sym.replace(/^m(?!aj)/, "");
  return n;
}

function chordScale(c: { rootPc: number; quality: string; pcs: number[] }, key: SongKey, flats: boolean) {
  const keySet = new Set(key.pcs);
  let pcs = key.pcs;
  let why: string;
  const outside = c.pcs.filter(pc => !keySet.has(pc));
  if (outside.length === 0) {
    why = `all its notes are in ${key.name}, so play ${key.name} — starting from ${pcName(c.rootPc, flats)} that's this mode`;
  } else {
    // Minimal alteration: swap each clashing key note for the chord tone a semitone away.
    const set = new Set(key.pcs);
    for (const pc of outside) {
      const neighbour = [pc - 1, pc + 1].map(x => (x + 12) % 12).find(x => set.has(x) && !c.pcs.includes(x));
      if (neighbour !== undefined) set.delete(neighbour);
      set.add(pc);
    }
    pcs = [...set];
    why = `the chord has ${outside.map(pc => pcName(pc, flats)).join(", ")}, which isn't in ${key.name} — so adjust the key scale to include ${outside.length > 1 ? "them" : "it"}`;
  }
  let scaleKey = pcs.length === 7 ? nameScale(c.rootPc, pcs) : null;
  if (!scaleKey) {
    scaleKey = FALLBACK_SCALE[c.quality] ?? "major";
    pcs = scalePcs(c.rootPc, SCALES[scaleKey].intervals);
    why = `a common choice over a ${CHORDS[c.quality]?.name.toLowerCase() ?? "chord"}`;
  }
  const s = SCALES[scaleKey];
  return { root: pcName(c.rootPc, flats), name: s.name, key: scaleKey, pcs: scalePcs(c.rootPc, s.intervals), why };
}

// ---- main -----------------------------------------------------------------

export function analyzeHarmony(song: SongModel): HarmonyAnalysis {
  // First pass without a key (for implied harmony a key prior helps, so iterate once).
  let { chords, source } = detectChords(song, null);
  let key = detectKey(song, chords);
  if (source === "implied") {
    ({ chords, source } = detectChords(song, new Set(key.pcs)));
    key = detectKey(song, chords);
  }
  const flats = FLAT_KEYS.has(key.isMinor ? (key.rootPc + 3) % 12 : key.rootPc);
  chords = chords.map(c => ({ ...c, symbol: source === "symbol" ? c.symbol : symbolFor(c.rootPc, c.quality, flats) }));

  // How the lead line uses each chord.
  const guidesBySymbol = new Map<string, ChordGuide>();
  const counts = new Map<string, { ct: number; st: number; out: number; n: number; fav: Map<number, number> }>();
  let ctTotal = 0, nTotal = 0, strongCt = 0, strongN = 0;
  for (const c of chords) {
    const bar = song.bars[c.bar];
    const scale = chordScale(c, key, flats);
    const cSet = new Set(c.pcs);
    const sSet = new Set(scale.pcs);
    const k = c.symbol;
    const cnt = counts.get(k) ?? { ct: 0, st: 0, out: 0, n: 0, fav: new Map() };
    for (const bt of bar.beats) {
      if (bt.start < c.start || bt.start >= c.end) continue;
      for (const n of bt.notes) {
        if (n.isTie) continue;
        const pc = n.midi % 12;
        const strong = (bt.start - bar.start) % 960 === 0;
        cnt.n++; nTotal++;
        if (strong) strongN++;
        if (cSet.has(pc)) {
          cnt.ct++; ctTotal++;
          if (strong) strongCt++;
          cnt.fav.set(pc, (cnt.fav.get(pc) ?? 0) + (strong ? 2 : 1));
        } else if (sSet.has(pc)) cnt.st++;
        else cnt.out++;
      }
    }
    counts.set(k, cnt);

    const g = guidesBySymbol.get(k);
    if (g) { if (!g.bars.includes(c.bar)) g.bars.push(c.bar); continue; }
    const chordTones = c.pcs.map(pc => ({ note: pcName(pc, flats), role: role(c.rootPc, pc, c.quality) }));
    const third = chordTones.filter(t => /3|4|2/.test(t.role));
    const seventh = chordTones.filter(t => /7/.test(t.role));
    const minor = c.pcs.includes((c.rootPc + 3) % 12);
    const pentaKey = minor || c.quality === "power5" ? "pentatonic_minor" : "pentatonic_major";
    guidesBySymbol.set(k, {
      symbol: k, rootPc: c.rootPc, quality: c.quality,
      numeral: numeral(key.rootPc, c),
      chordTones,
      scale,
      pentatonic: { root: pcName(c.rootPc, flats), name: SCALES[pentaKey].name, pcs: scalePcs(c.rootPc, SCALES[pentaKey].intervals) },
      targets: [...third, ...seventh, ...(third.length + seventh.length < 2 ? chordTones.filter(t => t.role === "R") : [])],
      usage: null,
      bars: [c.bar],
    });
  }
  for (const [k, g] of guidesBySymbol) {
    const cnt = counts.get(k);
    if (!cnt || cnt.n === 0) continue;
    const favPc = [...cnt.fav.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    g.usage = {
      chordTone: cnt.ct / cnt.n, scaleTone: cnt.st / cnt.n, outside: cnt.out / cnt.n, notes: cnt.n,
      favourite: favPc === undefined ? null : { note: pcName(favPc, flats), role: role(g.rootPc, favPc, g.quality) },
    };
  }

  return {
    source, key, chords,
    guides: [...guidesBySymbol.values()],
    chordToneRatio: nTotal ? ctTotal / nTotal : 0,
    strongBeatChordToneRatio: strongN ? strongCt / strongN : 0,
  };
}

/** Chords sounding within bars [s, e]. */
export function chordsInBars(h: HarmonyAnalysis, s: number, e: number): ChordEvent[] {
  return h.chords.filter(c => c.bar >= s && c.bar <= e);
}

export function chordAt(h: HarmonyAnalysis, bar: number, tick?: number): ChordEvent | null {
  const inBar = h.chords.filter(c => c.bar === bar);
  if (tick !== undefined) {
    const hit = inBar.find(c => tick >= c.start && tick < c.end);
    if (hit) return hit;
  }
  if (inBar.length) return inBar[0];
  // Nothing in this bar: the last chord before it keeps ringing.
  for (let i = h.chords.length - 1; i >= 0; i--) if (h.chords[i].bar < bar) return h.chords[i];
  return null;
}

export function guideFor(h: HarmonyAnalysis, c: ChordEvent | null): ChordGuide | null {
  return c ? h.guides.find(g => g.symbol === c.symbol) ?? null : null;
}

/** Collapse a chord list into a readable progression: "Bm → F#7 → A". */
export function progressionLabel(chords: ChordEvent[]): string {
  const out: string[] = [];
  for (const c of chords) if (out[out.length - 1] !== c.symbol) out.push(c.symbol);
  return out.join(" → ");
}
