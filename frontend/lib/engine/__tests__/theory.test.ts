import {
  getScale, getChord, detectKey, chordsInKey,
  getInterval, getFretboardPositions,
} from "../theory";

describe("getScale", () => {
  test("A minor pentatonic", () => {
    const result = getScale("A", "pentatonic_minor");
    expect(result).not.toBeNull();
    expect(result!.root).toBe("A");
    expect(result!.notes).toEqual(["A", "C", "D", "E", "G"]);
  });

  test("C major", () => {
    const result = getScale("C", "major");
    expect(result).not.toBeNull();
    expect(result!.notes).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });

  test("returns null for unknown scale", () => {
    expect(getScale("C", "nonexistent")).toBeNull();
  });

  test("Bb uses flats", () => {
    const result = getScale("Bb", "major");
    expect(result).not.toBeNull();
    expect(result!.notes).toContain("Bb");
    expect(result!.notes).not.toContain("A#");
  });
});

describe("getChord", () => {
  test("C major = C E G", () => {
    const result = getChord("C", "major");
    expect(result).not.toBeNull();
    expect(result!.notes).toEqual(["C", "E", "G"]);
  });

  test("Am7 = A C E G", () => {
    const result = getChord("A", "m7");
    expect(result).not.toBeNull();
    expect(result!.notes).toEqual(["A", "C", "E", "G"]);
  });
});

describe("detectKey", () => {
  test("C D E F G A B detects C major", () => {
    const matches = detectKey(["C", "D", "E", "F", "G", "A", "B"]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].root).toBe("C");
    expect(matches[0].scale.key).toBe("major");
  });

  test("A C D E G detects A minor pentatonic", () => {
    const matches = detectKey(["A", "C", "D", "E", "G"]);
    expect(matches.length).toBeGreaterThan(0);
    const hasPent = matches.some(m => m.root === "A" && m.scale.key === "pentatonic_minor");
    expect(hasPent).toBe(true);
  });
});

describe("chordsInKey", () => {
  test("C major has 7 chords", () => {
    const chords = chordsInKey("C", "major");
    expect(chords.length).toBe(7);
  });

  test("first chord in C major is C major", () => {
    const chords = chordsInKey("C", "major");
    expect(chords[0].root).toBe("C");
    expect(chords[0].chord.key).toBe("major");
  });
});

describe("getInterval", () => {
  test("C to G = Perfect 5th", () => {
    const iv = getInterval("C", "G");
    expect(iv.name).toBe("Perfect 5th");
    expect(iv.semitones).toBe(7);
  });
});

describe("getFretboardPositions", () => {
  test("returns positions within default range", () => {
    const positions = getFretboardPositions(["C", "E", "G"], "C");
    expect(positions.length).toBeGreaterThan(0);
    const rootPositions = positions.filter(p => p.isRoot);
    expect(rootPositions.length).toBeGreaterThan(0);
  });
});
