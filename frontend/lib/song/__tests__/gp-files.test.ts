/** @jest-environment node */
import fs from "fs";
import path from "path";
import { extractSong, listTracks, pickDefaultTrack } from "../extract";
import { buildLessonPlan } from "../lessons";
import { noteToPitchClass } from "../../engine/notes";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const at = require("@coderline/alphatab");

// Real Guitar Pro files that live in the workspace (outside the app).
const FILES = [
  "../songs/guthrie-govan/man-of-steel/Guthrie - Man of Steel.gp",
  "../songs/hotelcalifornia/the-eagles-hotel_california_solo_original.gp5",
].map(f => path.resolve(__dirname, "../../..", f)).filter(f => fs.existsSync(f));

function load(file: string) {
  const settings = new at.Settings();
  settings.core.logLevel = at.LogLevel.None;
  const warn = console.warn;
  console.warn = () => {};
  try {
    return at.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(fs.readFileSync(file)), settings);
  } finally {
    console.warn = warn;
  }
}

(FILES.length ? describe : describe.skip).each(FILES)("%s", file => {
  const score = load(file);
  const track = pickDefaultTrack(listTracks(score));
  const song = extractSong(score, track);

  it("maps every note to the correct pitch for its string", () => {
    let checked = 0;
    for (const bar of song.bars) for (const beat of bar.beats) for (const n of beat.notes) {
      const open = song.tuning[song.tuning.length - n.string];
      expect((noteToPitchClass(open) + n.fret) % 12).toBe(n.midi % 12);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
  });

  it("picks a guitar track, not drums/bass", () => {
    const t = song.tracks[track];
    expect(t.isPercussion).toBe(false);
    expect(t.stringCount).toBeGreaterThanOrEqual(6);
  });

  it("produces a sensible lesson plan", () => {
    const plan = buildLessonPlan(song);
    expect(plan.lessons.length).toBeGreaterThan(5);
    const sections = plan.lessons.filter(l => l.kind === "section");
    for (const s of sections) expect(s.bars[1] - s.bars[0]).toBeLessThan(6);
    // every bar with notes is covered by some section
    const covered = new Set<number>();
    for (const s of sections) for (let b = s.bars[0]; b <= s.bars[1]; b++) covered.add(b);
    song.bars.forEach((bar, i) => {
      if (bar.beats.some(b => b.notes.some(n => !n.isTie))) expect(covered.has(i)).toBe(true);
    });
  });
});
