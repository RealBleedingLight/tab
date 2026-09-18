import { parseTab } from "../tab-parser";

describe("parseTab", () => {
  test("parses simple single-note tab", () => {
    const input = `
e|--5--|
B|-----|
G|-----|
D|-----|
A|-----|
E|-----|`;
    const result = parseTab(input);
    expect(result.errors).toHaveLength(0);
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]).toEqual(
      expect.objectContaining({ string: 1, fret: 5 })
    );
  });

  test("parses multi-digit frets", () => {
    const input = `
e|--12--15--|
B|----------|
G|----------|
D|----------|
A|----------|
E|----------|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(2);
    expect(result.notes[0].fret).toBe(12);
    expect(result.notes[1].fret).toBe(15);
  });

  test("parses notes on multiple strings", () => {
    const input = `
e|-----|
B|--5--|
G|-----|
D|--7--|
A|-----|
E|-----|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(2);
    const strings = result.notes.map(n => n.string).sort();
    expect(strings).toEqual([2, 4]);
  });

  test("handles standard tuning labels (eBGDAE)", () => {
    const input = `
e|--0--|
B|--1--|
G|--0--|
D|--2--|
A|--3--|
E|-----|`;
    const result = parseTab(input);
    expect(result.tuning).toEqual(["E", "A", "D", "G", "B", "E"]);
    expect(result.notes).toHaveLength(5);
  });

  test("handles multiple groups (systems)", () => {
    const input = `
e|--5--3--|
B|--------|
G|--------|
D|--------|
A|--------|
E|--------|

e|--7--8--|
B|--------|
G|--------|
D|--------|
A|--------|
E|--------|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(4);
    expect(result.notes[2].fret).toBe(7);
  });

  test("handles open strings (fret 0)", () => {
    const input = `
e|--0--|
B|-----|
G|-----|
D|-----|
A|-----|
E|--0--|`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(2);
    expect(result.notes.every(n => n.fret === 0)).toBe(true);
  });

  test("ignores non-tab lines", () => {
    const input = `
Intro riff:
e|--5--|
B|-----|
G|-----|
D|-----|
A|-----|
E|-----|
(repeat 4x)`;
    const result = parseTab(input);
    expect(result.notes).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  test("returns error for empty input", () => {
    const result = parseTab("");
    expect(result.notes).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("handles h/p/b/r technique markers between frets", () => {
    const input = `
e|--5h7p5--|
B|---------|
G|---------|
D|---------|
A|---------|
E|---------|`;
    const result = parseTab(input);
    expect(result.notes.length).toBe(3);
    expect(result.notes.map(n => n.fret)).toEqual([5, 7, 5]);
  });
});
