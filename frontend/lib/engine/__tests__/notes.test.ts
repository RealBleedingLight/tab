import {
  noteToPitchClass, pitchClassToName, fretToPitchClass,
  intervalSemitones, STANDARD_TUNING,
} from "../notes";

describe("noteToPitchClass", () => {
  test("C is 0", () => expect(noteToPitchClass("C")).toBe(0));
  test("E is 4", () => expect(noteToPitchClass("E")).toBe(4));
  test("Bb is 10", () => expect(noteToPitchClass("Bb")).toBe(10));
  test("A# is 10", () => expect(noteToPitchClass("A#")).toBe(10));
  test("case insensitive", () => expect(noteToPitchClass("c#")).toBe(1));
  test("unknown note throws", () => expect(() => noteToPitchClass("X")).toThrow());
});

describe("pitchClassToName", () => {
  test("0 sharp = C", () => expect(pitchClassToName(0)).toBe("C"));
  test("1 sharp = C#", () => expect(pitchClassToName(1)).toBe("C#"));
  test("1 flat = Db", () => expect(pitchClassToName(1, true)).toBe("Db"));
  test("wraps at 12", () => expect(pitchClassToName(12)).toBe("C"));
});

describe("fretToPitchClass", () => {
  test("open low E (string 6) = E = 4", () => {
    expect(fretToPitchClass(6, 0, STANDARD_TUNING)).toBe(4);
  });
  test("5th fret low E = A = 9", () => {
    expect(fretToPitchClass(6, 5, STANDARD_TUNING)).toBe(9);
  });
  test("open high e (string 1) = E = 4", () => {
    expect(fretToPitchClass(1, 0, STANDARD_TUNING)).toBe(4);
  });
});

describe("intervalSemitones", () => {
  test("C to E = 4 (major 3rd)", () => expect(intervalSemitones("C", "E")).toBe(4));
  test("E to C = 8 (minor 6th)", () => expect(intervalSemitones("E", "C")).toBe(8));
  test("A to A = 0 (unison)", () => expect(intervalSemitones("A", "A")).toBe(0));
});
