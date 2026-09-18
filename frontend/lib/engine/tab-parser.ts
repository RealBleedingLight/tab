import type { ParsedNote, TabParseResult } from "./types";

const STRING_LABELS: Record<string, number> = {
  "e": 1, "B": 2, "G": 3, "D": 4, "A": 5, "E": 6,
};

const TAB_LINE_RE = /^([eEBbGgDdAa])\s*\|(.+)/;

export function parseTab(input: string): TabParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { notes: [], tuning: ["E", "A", "D", "G", "B", "E"], errors: ["No tab content provided"] };
  }

  const lines = trimmed.split("\n");
  const groups = extractTabGroups(lines);

  if (groups.length === 0) {
    return { notes: [], tuning: ["E", "A", "D", "G", "B", "E"], errors: ["No valid tab lines found"] };
  }

  const allNotes: ParsedNote[] = [];
  let globalOffset = 0;

  for (const group of groups) {
    const parsed = parseGroup(group, globalOffset);
    allNotes.push(...parsed);
    const maxPos = group.reduce((max, g) => Math.max(max, g.content.length), 0);
    globalOffset += maxPos;
  }

  return { notes: allNotes, tuning: ["E", "A", "D", "G", "B", "E"], errors: [] };
}

interface TabLine {
  stringNum: number;
  content: string;
}

function extractTabGroups(lines: string[]): TabLine[][] {
  const groups: TabLine[][] = [];
  let current: TabLine[] = [];

  for (const line of lines) {
    const match = TAB_LINE_RE.exec(line.trim());
    if (match) {
      const label = match[1];
      const content = match[2];
      let stringNum: number;
      if (label === "e") stringNum = 1;
      else if (label === "E") {
        stringNum = current.some(l => l.stringNum === 1) ? 6 : 6;
      } else {
        stringNum = STRING_LABELS[label] ?? STRING_LABELS[label.toUpperCase()];
      }
      if (stringNum !== undefined) {
        current.push({ stringNum, content });
      }
    } else {
      if (current.length >= 4) {
        groups.push(current);
      }
      current = [];
    }
  }
  if (current.length >= 4) {
    groups.push(current);
  }
  return groups;
}

function parseGroup(group: TabLine[], positionOffset: number): ParsedNote[] {
  const notes: ParsedNote[] = [];

  for (const { stringNum, content } of group) {
    let i = 0;
    while (i < content.length) {
      const ch = content[i];
      if (ch >= "0" && ch <= "9") {
        let numStr = ch;
        if (i + 1 < content.length && content[i + 1] >= "0" && content[i + 1] <= "9") {
          numStr += content[i + 1];
          i++;
        }
        notes.push({ string: stringNum, fret: parseInt(numStr, 10), position: positionOffset + i });
      }
      i++;
    }
  }

  notes.sort((a, b) => a.position - b.position);
  return notes;
}
