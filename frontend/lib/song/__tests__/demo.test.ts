/** @jest-environment node */
import { DEMO_TEX } from "../demo";
import { extractSong } from "../extract";
import { buildLessonPlan } from "../lessons";
import { buildRegions } from "../analysis";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const at = require("@coderline/alphatab");

function loadTex(tex: string) {
  const settings = new at.Settings();
  settings.core.logLevel = at.LogLevel.None;
  const importer = new at.importer.AlphaTexImporter();
  importer.initFromString(tex, settings);
  return importer.readScore();
}

describe("demo song", () => {
  const song = extractSong(loadTex(DEMO_TEX), 0);

  it("parses 8 bars with markers", () => {
    expect(song.bars).toHaveLength(8);
    expect(song.bars.map(b => b.section).filter(Boolean)).toEqual(["Riff", "Bends", "Run"]);
    expect(song.tempo).toBe(90);
    expect(song.tuningName).toBe("Standard");
  });

  it("uses engine string numbering (1 = high e) and correct pitches", () => {
    const first = song.bars[0].beats[0].notes[0];
    expect(first).toMatchObject({ string: 6, fret: 5, midi: 45 }); // A on low E
    const b = song.bars[1].beats[0].notes[0];
    expect(b).toMatchObject({ string: 2, fret: 5, midi: 64 }); // E on B string
  });

  it("detects techniques", () => {
    const techs = new Set(song.bars.flatMap(b => b.beats.flatMap(bt => bt.notes.flatMap(n => n.techniques))));
    for (const t of ["hammerOn", "pullOff", "vibrato", "bend", "release"]) expect(techs.has(t as never)).toBe(true);
  });

  it("splits into regions per marker", () => {
    const regions = buildRegions(song);
    expect(regions.map(r => r.name)).toEqual(["Riff", "Bends", "Run"]);
    expect(regions[0].sections[0]).toMatchObject({ startBar: 0, endBar: 3 });
  });

  it("builds a lesson plan: overview → warm-ups → sections → performance", () => {
    const plan = buildLessonPlan(song);
    const kinds = plan.lessons.map(l => l.kind);
    expect(kinds[0]).toBe("overview");
    expect(kinds[kinds.length - 1]).toBe("performance");
    expect(kinds).toContain("technique");
    expect(kinds.filter(k => k === "section").length).toBeGreaterThanOrEqual(3);
    expect(plan.overall.keyMatches[0].root).toBe("A");
    for (const l of plan.lessons) {
      expect(l.startSpeed).toBeGreaterThanOrEqual(40);
      expect(l.startSpeed).toBeLessThanOrEqual(100);
      expect(l.bars[0]).toBeLessThanOrEqual(l.bars[1]);
    }
  });

  it("rates the 16th-note run harder than the bends", () => {
    const regions = buildRegions(song);
    const bends = regions[1].sections[0].analysis;
    const run = regions[2].sections[0].analysis;
    expect(run.peakNotesPerSecond).toBeGreaterThan(bends.peakNotesPerSecond);
    expect(run.startSpeed).toBeLessThan(bends.startSpeed);
  });
});
