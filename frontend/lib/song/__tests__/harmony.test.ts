/** @jest-environment node */
import fs from "fs";
import path from "path";
import { extractSong, listTracks, pickDefaultTrack } from "../extract";
import { analyzeHarmony, chordAt, progressionLabel } from "../harmony";
import { DEMO_TEX } from "../demo";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const at = require("@coderline/alphatab");

function loadFile(rel: string) {
  const file = path.resolve(__dirname, "../../../..", rel);
  if (!fs.existsSync(file)) return null;
  const settings = new at.Settings();
  settings.core.logLevel = at.LogLevel.None;
  const warn = console.warn;
  console.warn = () => {};
  try {
    return at.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(fs.readFileSync(file)), settings);
  } finally { console.warn = warn; }
}

const hotel = loadFile("songs/hotelcalifornia/the-eagles-hotel_california_solo_original.gp5");

(hotel ? describe : describe.skip)("Hotel California (harmony from backing tracks)", () => {
  const song = extractSong(hotel, pickDefaultTrack(listTracks(hotel)));
  const h = analyzeHarmony(song);

  it("reads chords from the rhythm guitar + bass", () => {
    expect(h.source).toBe("accompaniment");
  });

  it("finds the key: B minor", () => {
    expect(h.key.name).toBe("B Natural Minor");
  });

  it("detects the classic progression roots Bm F# A E G D Em F#", () => {
    const roots = h.chords.slice(0, 8).map(c => c.symbol.replace(/(m|7|sus\d|maj).*$/, ""));
    expect(roots).toEqual(["B", "F#", "A", "E", "G", "D", "E", "F#"]);
    expect(h.chords[0].symbol).toBe("Bm");
  });

  it("suggests Phrygian Dominant over the F#7 (the A# from harmonic minor)", () => {
    const g = h.guides.find(x => x.symbol.startsWith("F#7"))!;
    expect(g.numeral).toBe("V7");
    expect(g.scale.name).toBe("Phrygian Dominant");
    expect(g.targets.map(t => t.note)).toContain("A#");
  });

  it("measures how the solo uses the chords", () => {
    expect(h.chordToneRatio).toBeGreaterThan(0.5);
    expect(h.guides.every(g => g.usage === null || g.usage.notes > 0)).toBe(true);
  });

  it("chordAt returns the chord for a bar and carries over empty bars", () => {
    expect(chordAt(h, 1)?.symbol).toBe("Bm");
    expect(chordAt(h, 0)).toBeNull(); // bar 1 is a pickup with no harmony
  });

  it("drops URLs from the artist field", () => {
    expect(song.artist).not.toMatch(/http|www/);
  });
});

describe("implied harmony (solo-only demo)", () => {
  const settings = new at.Settings();
  settings.core.logLevel = at.LogLevel.None;
  const importer = new at.importer.AlphaTexImporter();
  importer.initFromString(DEMO_TEX, settings);
  const song = extractSong(importer.readScore(), 0);
  const h = analyzeHarmony(song);

  it("marks chords as implied and stays diatonic to A minor", () => {
    expect(h.source).toBe("implied");
    expect(h.key.root).toBe("A");
    expect(h.key.isMinor).toBe(true);
    expect(progressionLabel(h.chords)).toMatch(/^Am/);
    const keySet = new Set(h.key.pcs);
    for (const c of h.chords) expect(c.pcs.every(pc => keySet.has(pc))).toBe(true);
  });
});
