import { SCALES, resolveScale } from "../data/scales";
import { CHORDS, resolveChord } from "../data/chords";
import { INTERVALS } from "../data/intervals";

describe("scales data", () => {
  test("has 20+ scales", () => expect(Object.keys(SCALES).length).toBeGreaterThanOrEqual(20));
  test("major scale intervals sum to 12", () => {
    expect(SCALES.major.intervals.reduce((a, b) => a + b, 0)).toBe(12);
  });
  test("pentatonic_minor intervals sum to 12", () => {
    expect(SCALES.pentatonic_minor.intervals.reduce((a, b) => a + b, 0)).toBe(12);
  });
  test("resolves alias 'aeolian' to natural_minor", () => {
    expect(resolveScale("aeolian")?.key).toBe("natural_minor");
  });
  test("resolves 'harmonic-minor' (hyphenated) to harmonic_minor", () => {
    expect(resolveScale("harmonic-minor")?.key).toBe("harmonic_minor");
  });
});

describe("chords data", () => {
  test("has 20+ chords", () => expect(Object.keys(CHORDS).length).toBeGreaterThanOrEqual(20));
  test("major chord intervals = [0,4,7]", () => {
    expect(CHORDS.major.intervals).toEqual([0, 4, 7]);
  });
  test("resolves 'm7' alias to minor7", () => {
    expect(resolveChord("m7")?.key).toBe("minor7");
  });
  test("resolves 'min' alias to minor", () => {
    expect(resolveChord("min")?.key).toBe("minor");
  });
});

describe("intervals data", () => {
  test("has 12 intervals (0-11)", () => expect(INTERVALS.length).toBe(12));
  test("semitones are sequential 0-11", () => {
    INTERVALS.forEach((iv, i) => expect(iv.semitones).toBe(i));
  });
});
