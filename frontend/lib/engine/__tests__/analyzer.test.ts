import { analyzeTab } from "../analyzer";

describe("analyzeTab", () => {
  test("analyzes A minor pentatonic lick", () => {
    const tab = `
e|--5--8--5--|
B|-----------|
G|-----------|
D|-----------|
A|-----------|
E|-----------|`;
    const result = analyzeTab(tab);
    expect(result.noteCount).toBe(3);
    expect(result.uniqueNotes.length).toBeGreaterThan(0);
    expect(result.key).toBeTruthy();
    expect(result.keyMatches.length).toBeGreaterThan(0);
    expect(result.fretboardPositions.length).toBeGreaterThan(0);
    expect(result.fretRange).toEqual([5, 8]);
  });

  test("detects string usage", () => {
    const tab = `
e|--5--|
B|--5--|
G|-----|
D|-----|
A|-----|
E|-----|`;
    const result = analyzeTab(tab);
    expect(result.stringUsage[1]).toBe(1);
    expect(result.stringUsage[2]).toBe(1);
  });

  test("returns empty analysis for invalid input", () => {
    const result = analyzeTab("not a tab");
    expect(result.noteCount).toBe(0);
    expect(result.key).toBe("Unknown");
  });
});
