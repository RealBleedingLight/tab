import type { Chord } from "../types";

export const CHORDS: Record<string, Chord> = {
  major: {
    key: "major",
    name: "Major",
    symbol: "",
    aliases: ["maj", "M"],
    intervals: [0, 4, 7],
    character: "Stable, bright, resolved",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, 1, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 2, 2, 0], rootString: 5 },
    },
  },
  minor: {
    key: "minor",
    name: "Minor",
    symbol: "m",
    aliases: ["min", "-"],
    intervals: [0, 3, 7],
    character: "Sad, dark, introspective",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, 0, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 2, 1, 0], rootString: 5 },
    },
  },
  diminished: {
    key: "diminished",
    name: "Diminished",
    symbol: "dim",
    aliases: ["o", "mb5"],
    intervals: [0, 3, 6],
    character: "Tense, unstable, wants to resolve",
    commonVoicings: {
      aShape: { frets: [null, 0, 1, 2, 1, null], rootString: 5 },
    },
  },
  augmented: {
    key: "augmented",
    name: "Augmented",
    symbol: "aug",
    aliases: ["+", "#5"],
    intervals: [0, 4, 8],
    character: "Bright but unsettled, suspenseful, dreamlike",
    commonVoicings: {
      eShape: { frets: [0, 3, 2, 1, 1, 0], rootString: 6 },
    },
  },
  sus2: {
    key: "sus2",
    name: "Suspended 2nd",
    symbol: "sus2",
    aliases: [],
    intervals: [0, 2, 7],
    character: "Open, ambiguous, modern — neither major nor minor",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, 2, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 2, 0, 0], rootString: 5 },
    },
  },
  sus4: {
    key: "sus4",
    name: "Suspended 4th",
    symbol: "sus4",
    aliases: ["sus"],
    intervals: [0, 5, 7],
    character: "Tense, yearning to resolve down to the 3rd",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, 2, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 2, 3, 0], rootString: 5 },
    },
  },
  major7: {
    key: "major7",
    name: "Major 7th",
    symbol: "maj7",
    aliases: ["M7", "delta"],
    intervals: [0, 4, 7, 11],
    character: "Warm, lush, jazzy, sophisticated",
    commonVoicings: {
      eShape: { frets: [0, 2, 1, 1, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 1, 2, 0], rootString: 5 },
    },
  },
  dominant7: {
    key: "dominant7",
    name: "Dominant 7th",
    symbol: "7",
    aliases: ["dom7"],
    intervals: [0, 4, 7, 10],
    character: "Bluesy, strong pull to resolve — the engine of tonal music",
    commonVoicings: {
      eShape: { frets: [0, 2, 0, 1, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 0, 2, 0], rootString: 5 },
    },
  },
  minor7: {
    key: "minor7",
    name: "Minor 7th",
    symbol: "m7",
    aliases: ["min7", "-7"],
    intervals: [0, 3, 7, 10],
    character: "Mellow, jazzy, relaxed minor",
    commonVoicings: {
      eShape: { frets: [0, 2, 0, 0, 0, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 0, 1, 0], rootString: 5 },
    },
  },
  minor7b5: {
    key: "minor7b5",
    name: "Minor 7th Flat 5",
    symbol: "m7b5",
    aliases: ["min7b5", "half-diminished", "ø"],
    intervals: [0, 3, 6, 10],
    character: "Dark, tense, yearning — the ii chord in minor keys",
    commonVoicings: {
      aShape: { frets: [null, 0, 1, 0, 1, null], rootString: 5 },
    },
  },
  diminished7: {
    key: "diminished7",
    name: "Diminished 7th",
    symbol: "dim7",
    aliases: ["o7"],
    intervals: [0, 3, 6, 9],
    character: "Extremely tense, symmetrical — can resolve in multiple directions",
    commonVoicings: {
      aShape: { frets: [null, 0, 1, 2, 1, 2], rootString: 5 },
    },
  },
  add9: {
    key: "add9",
    name: "Add 9",
    symbol: "add9",
    aliases: ["add2"],
    intervals: [0, 4, 7, 14],
    character: "Bright and shimmering, like a major chord with extra sparkle",
    commonVoicings: {
      openC: { frets: [null, 3, 2, 0, 3, 0], rootString: 5 },
    },
  },
  major9: {
    key: "major9",
    name: "Major 9th",
    symbol: "maj9",
    aliases: ["M9"],
    intervals: [0, 4, 7, 11, 14],
    character: "Lush, expansive, sophisticated jazz voicing",
    commonVoicings: {
      aShape: { frets: [null, 0, 2, 1, 2, 0], rootString: 5 },
    },
  },
  dominant9: {
    key: "dominant9",
    name: "Dominant 9th",
    symbol: "9",
    aliases: ["dom9"],
    intervals: [0, 4, 7, 10, 14],
    character: "Funky, smooth, soulful — dominant 7th with extra color",
    commonVoicings: {
      eShape: { frets: [0, 2, 0, 1, 0, 2], rootString: 6 },
    },
  },
  minor9: {
    key: "minor9",
    name: "Minor 9th",
    symbol: "m9",
    aliases: ["min9", "-9"],
    intervals: [0, 3, 7, 10, 14],
    character: "Smooth, mellow, sophisticated minor — very common in neo-soul and jazz",
    commonVoicings: {
      aShape: { frets: [null, 0, 2, 0, 1, 0], rootString: 5 },
    },
  },
  dominant7sharp9: {
    key: "dominant7sharp9",
    name: "Dominant 7th Sharp 9",
    symbol: "7#9",
    aliases: ["hendrix chord", "7+9"],
    intervals: [0, 4, 7, 10, 15],
    character: "Aggressive, bluesy, gritty — the 'Hendrix chord' with clashing major and minor 3rds",
    commonVoicings: {
      eShape: { frets: [0, 2, 0, 1, 3, null], rootString: 6 },
    },
  },
  major6: {
    key: "major6",
    name: "Major 6th",
    symbol: "6",
    aliases: ["maj6", "add6"],
    intervals: [0, 4, 7, 9],
    character: "Warm, sweet, vintage — classic jazz and swing voicing",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, 1, 2, 0], rootString: 6 },
      aShape: { frets: [null, 0, 2, 2, 2, 2], rootString: 5 },
    },
  },
  minor6: {
    key: "minor6",
    name: "Minor 6th",
    symbol: "m6",
    aliases: ["min6", "-6"],
    intervals: [0, 3, 7, 9],
    character: "Bittersweet, noir — minor with an unexpected brightness from the major 6th",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, 0, 2, 0], rootString: 6 },
    },
  },
  power5: {
    key: "power5",
    name: "Power Chord",
    symbol: "5",
    aliases: ["power chord", "no3"],
    intervals: [0, 7],
    character: "Neutral, powerful, aggressive — no 3rd means neither major nor minor",
    commonVoicings: {
      eShape: { frets: [0, 2, 2, null, null, null], rootString: 6 },
      aShape: { frets: [null, 0, 2, 2, null, null], rootString: 5 },
    },
  },
  augmented7: {
    key: "augmented7",
    name: "Augmented 7th",
    symbol: "7#5",
    aliases: ["aug7", "+7", "7+5"],
    intervals: [0, 4, 8, 10],
    character: "Tense, unresolved, altered — dominant with a raised 5th pulling upward",
    commonVoicings: {
      eShape: { frets: [0, 3, 0, 1, 1, 0], rootString: 6 },
    },
  },
  minor_major7: {
    key: "minor_major7",
    name: "Minor Major 7th",
    symbol: "mMaj7",
    aliases: ["minMaj7", "m(maj7)", "-M7"],
    intervals: [0, 3, 7, 11],
    character: "Dark and mysterious — the tension between the minor 3rd and major 7th creates a James Bond-like sophistication",
    commonVoicings: {
      eShape: { frets: [0, 2, 1, 0, 0, 0], rootString: 6 },
    },
  },
  dominant11: {
    key: "dominant11",
    name: "Dominant 11th",
    symbol: "11",
    aliases: ["dom11"],
    intervals: [0, 4, 7, 10, 14, 17],
    character: "Open, modal, suspended feel — the 11th softens the dominant tension",
    commonVoicings: {
      aShape: { frets: [null, 0, 0, 0, 0, 0], rootString: 5 },
    },
  },
  dominant13: {
    key: "dominant13",
    name: "Dominant 13th",
    symbol: "13",
    aliases: ["dom13"],
    intervals: [0, 4, 7, 10, 14, 17, 21],
    character: "Rich, full, jazzy — the ultimate extension of the dominant chord",
    commonVoicings: {
      eShape: { frets: [0, 2, 0, 1, 2, 0], rootString: 6 },
    },
  },
};

const CHORD_ALIASES: Record<string, string> = {};
for (const [key, chord] of Object.entries(CHORDS)) {
  if (chord.symbol) CHORD_ALIASES[chord.symbol.toLowerCase()] = key;
  for (const alias of chord.aliases) {
    CHORD_ALIASES[alias.toLowerCase()] = key;
  }
}

export function resolveChord(chordType: string): Chord | undefined {
  const low = chordType.toLowerCase();
  return CHORDS[low] ?? CHORDS[CHORD_ALIASES[low]];
}
