import { analyzeRange, buildRegions, keyLabel, type RangeAnalysis, type Region } from "./analysis";
import { TECHNIQUES } from "./techniques";
import { analyzeHarmony, chordsInBars, progressionLabel, type ChordGuide, type HarmonyAnalysis } from "./harmony";
import type { SongModel, TechniqueId } from "./types";

export type LessonKind = "overview" | "technique" | "section" | "connect" | "performance";

export interface PracticeAction {
  /** Bars to loop (inclusive, 0-based). */
  bars: [number, number];
  speed: number;
  /** Enable the speed trainer from `speed` → `targetSpeed`. */
  trainer?: { targetSpeed: number; step: number; loopsPerStep: number };
  loop: boolean;
}

export interface LessonStep {
  text: string;
  action?: PracticeAction;
}

export interface Lesson {
  id: string;
  kind: LessonKind;
  title: string;
  summary: string;
  bars: [number, number];
  difficulty: number;
  techniques: TechniqueId[];
  startSpeed: number;
  targetSpeed: number;
  steps: LessonStep[];
  checklist: string[];
  technique?: TechniqueId;
  /** Chords under these bars with scale / target-note suggestions. */
  chords?: ChordGuide[];
  progression?: string;
}

export interface LessonPlan {
  lessons: Lesson[];
  regions: Region[];
  overall: RangeAnalysis;
  harmony: HarmonyAnalysis;
  /** Estimated total practice time in minutes (rough). */
  estimatedMinutes: number;
}

function barsLabel([s, e]: [number, number]) {
  return s === e ? `bar ${s + 1}` : `bars ${s + 1}–${e + 1}`;
}

const BASE_CHECKLIST = [
  "Every note is clean — no buzzing or accidental open strings",
  "I stay in time with the recording",
];

function techniqueChecks(techs: TechniqueId[]): string[] {
  const out: string[] = [];
  if (techs.some(t => t === "bend" || t === "prebend" || t === "release")) out.push("Bends reach the right pitch");
  if (techs.includes("vibrato")) out.push("Vibrato is even, not nervous");
  if (techs.some(t => t === "hammerOn" || t === "pullOff" || t === "trill")) out.push("Legato notes are as loud as picked notes");
  if (techs.includes("sweep")) out.push("Sweep notes are separated, not ringing together");
  if (techs.includes("slide")) out.push("Slides land on the right fret, in time");
  if (techs.includes("tapping")) out.push("Tapped notes are even and unwanted strings are muted");
  if (techs.includes("positionShift")) out.push("Position shifts land on time without looking");
  return out;
}

function chordsFor(h: HarmonyAnalysis, [s, e]: [number, number]) {
  const events = chordsInBars(h, s, e);
  const seen = new Set<string>();
  const guides: ChordGuide[] = [];
  for (const c of events) {
    if (seen.has(c.symbol)) continue;
    seen.add(c.symbol);
    const g = h.guides.find(x => x.symbol === c.symbol);
    if (g) guides.push(g);
  }
  return { guides, progression: progressionLabel(events) };
}

/** One algorithmically written "what's going on harmonically" step for a chunk. */
function harmonyStep(h: HarmonyAnalysis, guides: ChordGuide[], progression: string): LessonStep | null {
  if (!guides.length) return null;
  const keySet = new Set(h.key.pcs);
  const parts: string[] = [];
  const implied = h.source === "implied" ? " (implied by the melody — there's no backing track in the file)" : "";
  parts.push(`Harmony: ${progression}${implied}.`);
  const outside = guides.filter(g => g.scale.pcs.some(pc => !keySet.has(pc)));
  if (outside.length === 0) {
    parts.push(`Everything here sits in ${h.key.name} — ${h.key.root} ${h.key.isMinor ? "minor" : "major"} pentatonic is your safe base.`);
  } else {
    parts.push(`Mostly ${h.key.name}, but ${outside.map(g => `over ${g.symbol} switch to ${g.scale.root} ${g.scale.name}`).join("; ")}.`);
  }
  const targets = guides.slice(0, 4).map(g => `${g.targets.slice(0, 2).map(t => `${t.note} (${t.role})`).join(" / ")} over ${g.symbol}`);
  parts.push(`Aim for ${targets.join(", ")} on the strong beats.`);
  const fav = guides.find(g => g.usage?.favourite && g.usage.notes >= 4);
  if (fav?.usage?.favourite) {
    parts.push(`Notice the solo leans on ${fav.usage.favourite.note} — the ${fav.usage.favourite.role} of ${fav.symbol} (${Math.round(fav.usage.chordTone * 100)}% chord tones there).`);
  }
  return { text: parts.join(" ") };
}

function firstBarWith(song: SongModel, id: TechniqueId, regions: Region[]): number | null {
  for (const r of regions) for (const s of r.sections) {
    if (!s.analysis.techniques[id]) continue;
    for (let b = s.startBar; b <= s.endBar; b++) {
      const a = analyzeRange(song, b, b);
      if (a.techniques[id]) return b;
    }
  }
  return null;
}

/**
 * Builds a complete, ordered learning path for a track — modelled on how a
 * teacher would break down a solo:
 *   1. overview (listen + key + fretboard map)
 *   2. warm-ups for the hardest techniques the song uses
 *   3. each section in 1–4 bar chunks, slow → full speed
 *   4. "connect" lessons that chain neighbouring chunks
 *   5. a full performance run
 */
export function buildLessonPlan(song: SongModel): LessonPlan {
  const regions = buildRegions(song);
  const lastBar = Math.max(0, song.bars.length - 1);
  const overall = analyzeRange(song, 0, lastBar);
  const harmony = analyzeHarmony(song);
  const lessons: Lesson[] = [];
  const allBars: [number, number] = regions.length
    ? [regions[0].startBar, regions[regions.length - 1].endBar]
    : [0, lastBar];

  // 1. Overview
  // Key from the whole band (lead + accompaniment + chords) is more reliable than the lead alone.
  const key = harmony.guides.length ? harmony.key.name : keyLabel(overall);
  const whole = chordsFor(harmony, allBars);
  lessons.push({
    id: "overview",
    kind: "overview",
    title: "Get to know the piece",
    summary: `${song.bars.length} bars at ${song.tempo} BPM in ${song.tuningName.toLowerCase()} tuning. Key: ${key}.`,
    bars: allBars,
    difficulty: overall.difficulty,
    techniques: overall.topTechniques.slice(0, 6),
    startSpeed: 100,
    targetSpeed: 100,
    steps: [
      { text: "Listen to the whole track once while following the cursor in the tab. Don't play yet.", action: { bars: allBars, speed: 100, loop: false } },
      { text: `The music is centred on ${key}. The fretboard above the tab follows the playback: small dots are the scale that fits the current chord, blue rings are the chord's notes, and the big dots are what the solo plays.` },
      ...(whole.guides.length ? [{ text: `The chords under the solo${harmony.source === "implied" ? " (implied by the melody)" : ""}: ${whole.guides.map(g => `${g.symbol} (${g.numeral})`).join(", ")}. The solo hits chord tones on ${Math.round(harmony.chordToneRatio * 100)}% of its notes and ${Math.round(harmony.strongBeatChordToneRatio * 100)}% of its on-beat notes — that's why it sounds "inside" the changes.` }] : []),
      { text: "Play through the notes of the key slowly in the fret area the song uses, to get your hand into position." },
      { text: `Skim the lesson list: ${regions.length} part${regions.length === 1 ? "" : "s"}, ${regions.reduce((n, r) => n + r.sections.length, 0)} chunks. Hard chunks are marked — you can jump ahead to them anytime.` },
    ],
    checklist: ["I've listened through the whole piece", "I know which key/scale it uses"],
    chords: whole.guides,
    progression: whole.progression,
  });

  // 2. Technique warm-ups (only the ones that deserve dedicated practice)
  const warmups = overall.topTechniques
    .filter(t => TECHNIQUES[t].warmup && (overall.techniques[t] ?? 0) >= 2)
    .sort((a, b) => warmupScore(b, overall) - warmupScore(a, overall))
    .slice(0, 5);
  for (const t of warmups) {
    const g = TECHNIQUES[t];
    const bar = firstBarWith(song, t, regions);
    const steps: LessonStep[] = [
      ...g.howTo.map(text => ({ text })),
      { text: `Drill: ${g.drill}` },
    ];
    if (bar !== null) {
      steps.push({
        text: `Now try it in context: ${barsLabel([bar, bar])} uses ${g.name.toLowerCase()}. Loop it slowly.`,
        action: { bars: [bar, bar], speed: 50, loop: true },
      });
    }
    lessons.push({
      id: `tech-${t}`,
      kind: "technique",
      title: `Warm-up: ${g.name}`,
      summary: `Used ${overall.techniques[t]}× in this part. ${g.summary}`,
      bars: bar !== null ? [bar, bar] : allBars,
      difficulty: Math.min(5, Math.max(1, Math.round(g.weight * 1.6))),
      techniques: [t],
      startSpeed: 50,
      targetSpeed: 100,
      steps,
      checklist: [...techniqueChecks([t]), `I can do the drill without tension`],
      technique: t,
    });
  }

  // 3 + 4. Sections and connections
  for (const region of regions) {
    region.sections.forEach((s, i) => {
      const a = s.analysis;
      const techs = a.topTechniques.slice(0, 5);
      const steps: LessonStep[] = [
        { text: `Listen to ${barsLabel([s.startBar, s.endBar])} at full speed a couple of times. Hum or sing the melody.`, action: { bars: [s.startBar, s.endBar], speed: 100, loop: true } },
        { text: `Play along at ${a.startSpeed}%. Read the fingering in the tab; the fretboard above it lights up each note and shows the chord underneath.`, action: { bars: [s.startBar, s.endBar], speed: a.startSpeed, loop: true } },
      ];
      const ch = chordsFor(harmony, [s.startBar, s.endBar]);
      const hs = harmonyStep(harmony, ch.guides, ch.progression);
      if (hs) steps.push(hs);
      for (const t of techs.slice(0, 2)) {
        const g = TECHNIQUES[t];
        if (g.weight >= 0.75) steps.push({ text: `${g.name}: ${g.howTo[0]}` });
      }
      steps.push({
        text: `Speed trainer: start at ${a.startSpeed}% and climb 5% every 2 loops up to 100%. If it falls apart, drop back 10%.`,
        action: {
          bars: [s.startBar, s.endBar], speed: a.startSpeed, loop: true,
          trainer: { targetSpeed: 100, step: 5, loopsPerStep: 2 },
        },
      });
      lessons.push({
        id: s.id,
        kind: "section",
        title: s.name,
        summary: `${a.noteCount} notes${ch.progression ? ` · ${ch.progression}` : a.keyMatches[0] ? ` · ${keyLabel(a)}` : ""}${a.difficultyReasons.length ? ` · ${a.difficultyReasons[0]}` : ""}`,
        bars: [s.startBar, s.endBar],
        difficulty: a.difficulty,
        techniques: techs,
        startSpeed: a.startSpeed,
        targetSpeed: 100,
        steps,
        checklist: [...BASE_CHECKLIST, ...techniqueChecks(techs), ...(ch.guides.length ? ["I can name the chord under each phrase and hear the target notes land"] : [])],
        chords: ch.guides,
        progression: ch.progression,
      });

      // Connect every pair of neighbouring chunks.
      if (i > 0 && i % 2 === 1) {
        const prev = region.sections[i - 1];
        const bars: [number, number] = [prev.startBar, s.endBar];
        const ca = analyzeRange(song, bars[0], bars[1]);
        const speed = Math.max(40, Math.min(prev.analysis.startSpeed, a.startSpeed) + 10);
        lessons.push(connectLesson(harmony, `c${bars[0]}-${bars[1]}`, `Connect ${barsLabel(bars)}`, bars, ca, speed,
          "Focus on the transition between the two chunks — practice the last 2 notes of the first and the first 2 of the second until the join is seamless."));
      }
    });

    if (region.sections.length > 2) {
      const bars: [number, number] = [region.startBar, region.endBar];
      const ra = analyzeRange(song, bars[0], bars[1]);
      lessons.push(connectLesson(harmony, `r${bars[0]}-${bars[1]}`, `Put together: ${region.name}`, bars, ra,
        Math.max(50, ra.startSpeed + 10), `Play the whole "${region.name}" part in one go.`));
    }
  }

  // 5. Performance
  lessons.push({
    id: "performance",
    kind: "performance",
    title: "Full performance",
    summary: "Play the complete part along with the track.",
    bars: allBars,
    difficulty: overall.difficulty,
    techniques: overall.topTechniques.slice(0, 6),
    startSpeed: 90,
    targetSpeed: 100,
    steps: [
      { text: "Warm up with the hardest chunk once at 80%." },
      { text: "Play the whole part at 90%.", action: { bars: allBars, speed: 90, loop: false } },
      { text: "Now at full speed, no stopping — keep going through mistakes like on stage.", action: { bars: allBars, speed: 100, loop: false } },
      { text: "Record yourself (phone is fine) and listen back. Note which chunks to revisit." },
    ],
    checklist: ["I played start to finish without stopping", "Mistakes didn't throw me off the beat", ...techniqueChecks(overall.topTechniques.slice(0, 4))],
  });

  const estimatedMinutes = Math.round(lessons.reduce((m, l) => m + (l.kind === "section" ? 12 + l.difficulty * 4 : l.kind === "technique" ? 10 : 8), 0));
  return { lessons, regions, overall, harmony, estimatedMinutes };
}

function warmupScore(t: TechniqueId, a: RangeAnalysis) {
  return TECHNIQUES[t].weight * Math.log2(1 + (a.techniques[t] ?? 0));
}

function connectLesson(h: HarmonyAnalysis, id: string, title: string, bars: [number, number], a: RangeAnalysis, speed: number, tip: string): Lesson {
  const ch = chordsFor(h, bars);
  return {
    chords: ch.guides,
    progression: ch.progression,
    id, kind: "connect", title,
    summary: `${a.noteCount} notes · ${barsLabel(bars)}${ch.progression ? ` · ${ch.progression}` : ""}`,
    bars,
    difficulty: a.difficulty,
    techniques: a.topTechniques.slice(0, 4),
    startSpeed: speed,
    targetSpeed: 100,
    steps: [
      { text: tip },
      { text: `Loop ${barsLabel(bars)} at ${speed}%.`, action: { bars, speed, loop: true } },
      { text: `Speed trainer up to 100%.`, action: { bars, speed, loop: true, trainer: { targetSpeed: 100, step: 5, loopsPerStep: 2 } } },
    ],
    checklist: ["The transitions are seamless", ...BASE_CHECKLIST],
  };
}
