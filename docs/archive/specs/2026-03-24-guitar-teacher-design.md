# Guitar Teacher — Design Spec

**Date:** 2026-03-24
**Status:** Approved
**Author:** Leo + Claude

## Overview

A local, offline-first guitar learning tool that analyzes Guitar Pro files and generates detailed lesson plans, theory breakdowns, and practice roadmaps. Built on top of the existing `gp2tab` parser. Music theory lives in external YAML data files, making the system modular and extensible without code changes. An optional LLM enhancement layer can enrich template-generated output when a model is available.

## Goals

1. Accept a `.gp` file (or pre-parsed `.json`) and produce a complete lesson plan: theory analysis, technique breakdown, section-by-section lessons, practice ordering, improvisation suggestions
2. Serve as an interactive music theory reference: look up chords, scales, modes, intervals — with ASCII fretboard diagrams
3. Work fully offline with deterministic, template-based output
4. Optionally enhance output with any LLM (Claude API, Ollama, OpenAI) when available
5. Keep music theory knowledge in data files (YAML) so it can be expanded without touching code
6. CLI-first interface, architected for a future web UI

## Non-Goals (for now)

- Web UI (see UPGRADE_ROADMAP.md)
- Plugin architecture (see UPGRADE_ROADMAP.md)
- Audio analysis / ear training
- Rhythm / strumming pattern generation
- Multi-instrument support

---

## Architecture

### Project Structure

```
guitar-teacher/
├── guitar_teacher/
│   ├── __init__.py
│   ├── cli.py                     # Click-based CLI with subcommands
│   ├── config.py                  # Config loading (~/.guitar-teacher/config.yaml)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── models.py              # Dataclasses: Key, Scale, Chord, BarAnalysis, etc.
│   │   ├── theory.py              # Scale/chord/interval math engine
│   │   ├── fretboard.py           # Fretboard mapping & ASCII visualization
│   │   ├── analyzer.py            # gp2tab JSON → structured analysis report
│   │   └── note_utils.py          # Pitch math: fret→note, transposition, intervals
│   ├── lessons/
│   │   ├── __init__.py
│   │   ├── generator.py           # Analysis + templates → lesson markdown files
│   │   └── templates.py           # Jinja2-based template rendering
│   └── llm/
│       ├── __init__.py
│       ├── enhancer.py            # Post-processes generated lessons via LLM
│       └── providers.py           # Provider abstraction: Claude, Ollama, OpenAI
├── gp2tab/                        # Existing parser (integrated as local package)
│   └── ...
├── theory/                        # KNOWLEDGE BASE (YAML data files)
│   ├── scales.yaml                # All scale/mode formulas + metadata
│   ├── chords.yaml                # All chord formulas + voicings
│   ├── intervals.yaml             # Interval names, semitone counts
│   ├── techniques.yaml            # Technique definitions + teaching templates
│   └── lesson_templates/          # Jinja2 markdown templates for lessons
│       ├── section_lesson.md.j2
│       ├── technique_intro.md.j2
│       ├── assembly_lesson.md.j2
│       ├── theory_overview.md.j2
│       └── performance_lesson.md.j2
├── tests/
├── UPGRADE_ROADMAP.md
├── pyproject.toml
└── README.md
```

### Key Separation

- **`guitar_teacher/`** — Python engine. Reads theory data, does math, generates output. Never hardcodes music theory.
- **`theory/`** — The knowledge base. YAML files containing every scale, chord, interval, technique, and lesson template. Expanding the tool's knowledge means adding YAML entries, not writing code.
- **`gp2tab/`** — Existing GP parser. Imported directly by the analyzer.

### gp2tab Integration

`gp2tab` lives at the repo root (`/Users/leo/hobby/tab/gp2tab/`). `guitar-teacher` references it as a **local path dependency** in `pyproject.toml`:

```toml
[project]
dependencies = [
    "click",
    "jinja2",
    "pyyaml",
]

[tool.setuptools]
packages = ["guitar_teacher", "guitar_teacher.core", "guitar_teacher.lessons", "guitar_teacher.llm"]

[project.optional-dependencies]
llm = ["anthropic", "openai", "ollama"]

[project.scripts]
guitar-teacher = "guitar_teacher.cli:main"
```

Both packages live in the same repo. The analyzer imports `gp2tab.parser.parse` and `gp2tab.models.Song` directly. Both are installed in editable mode during development:

```bash
cd /Users/leo/hobby/tab
pip install -e ./gp2tab
pip install -e ./guitar-teacher
```

### Note & Pitch Representation

**Canonical note names:** All notes are represented as uppercase single-letter names with optional sharp/flat: `C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B`.

**Enharmonic convention:** Internally, the engine uses **sharps for sharp keys and flats for flat keys**, following standard music theory:
- Sharp keys (G, D, A, E, B, F#): use sharps (F#, C#, G#, etc.)
- Flat keys (F, Bb, Eb, Ab, Db, Gb): use flats (Bb, Eb, Ab, etc.)
- C major / A minor: naturals only
- For comparison/matching, all notes are normalized to a **pitch class integer** (0-11, where C=0) so C# and Db are equivalent.

**`note_utils.py` interface:**

```python
def fret_to_pitch_class(string_num: int, fret: int, tuning: list[str]) -> int:
    """Convert (string, fret) to pitch class 0-11."""

def pitch_class_to_name(pc: int, prefer_flats: bool = False) -> str:
    """Convert pitch class to note name. C#/Db controlled by prefer_flats."""

def fret_to_note(string_num: int, fret: int, tuning: list[str], prefer_flats: bool = False) -> str:
    """Convert (string, fret) to note name using tuning."""

def note_to_pitch_class(name: str) -> int:
    """Parse note name to pitch class. Handles sharps, flats, aliases."""

def interval_semitones(note1: str, note2: str) -> int:
    """Semitone distance between two notes (0-11)."""
```

### Interval Representation Convention

**Scales** use **step patterns** (whole/half steps): `[2, 1, 2, 2, 2, 1, 2]` — this is the standard way scales are taught and makes it easy to derive modes by rotation.

**Chords** use **semitones from root**: `[0, 4, 7]` — this is the standard way chord formulas are written and maps directly to fret distances.

The theory engine handles both: scales are stored as step patterns and converted to absolute semitones when needed for note computation. Chords are stored as absolute semitones directly.

### gp2tab Technique Types

The gp2tab parser emits these technique type strings (from `Technique.type`):

| gp2tab type | techniques.yaml key | Description |
|---|---|---|
| `bend` | `bend` | Bend up to target pitch |
| `bend_release` | `bend_release` | Bend up then release back |
| `pre_bend` | `pre_bend` | Bend before picking |
| `pre_bend_release` | `pre_bend_release` | Pre-bend then release |
| `vibrato` | `vibrato` | Vibrato on sustained note |
| `hammer` | `hammer_on` | Hammer-on |
| `pull` | `pull_off` | Pull-off |
| `slide_up` | `slide` | Slide up to note |
| `slide_down` | `slide` | Slide down to note |
| `tap` | `tapping` | Right-hand tap |
| `harmonic` | `harmonic` | Natural harmonic |
| `palm_mute` | `palm_mute` | Palm-muted note |
| `let_ring` | `let_ring` | Let note ring |
| `staccato` | `staccato` | Short, detached note |
| `dead_note` | `dead_note` | Muted/ghost note |

The analyzer maps these strings to their corresponding `techniques.yaml` entries for difficulty scoring and lesson template selection.

---

## Component Design

### 1. Core Theory Engine (`core/theory.py`)

Responsibilities:
- Load scales/chords/intervals from YAML at startup
- Given a root note + scale name → return all notes in that scale
- Given a set of notes → detect the best-matching scale(s) (key detection)
- Given a root + chord name → return chord tones
- Given a set of chords → suggest compatible scales for improvisation
- Compute intervals between any two notes
- Determine scale degree of any note within a given key

Key functions:
```python
class TheoryEngine:
    def __init__(self, theory_dir: str): ...

    def get_scale(self, root: str, scale_type: str) -> Scale: ...
    def detect_key(self, notes: list[str]) -> list[KeyMatch]: ...
    def get_chord(self, root: str, chord_type: str) -> Chord: ...
    def suggest_scales(self, chords: list[str]) -> list[ScaleSuggestion]: ...
    def note_to_scale_degree(self, note: str, key: Key) -> str: ...
    def interval_between(self, note1: str, note2: str) -> Interval: ...
    def chords_in_key(self, root: str, scale_type: str) -> list[Chord]: ...
```

### 2. Fretboard Visualizer (`core/fretboard.py`)

Responsibilities:
- Map any note/scale/chord onto a 6-string fretboard (standard or custom tuning)
- Render ASCII fretboard diagrams to terminal
- Support highlighting specific notes, scale degrees, root notes
- Show chord shapes (multiple voicings across positions)
- V1 scope: show all scale notes across the full fretboard (frets 0-24). Position-based views (CAGED, 3-note-per-string) are a future enhancement

Output example:
```
D Dorian — Position 1 (frets 5-8)

     5     6     7     8
e ───●─────┼─────●─────●───  (A  .  B  C)
B ───┼─────●─────●─────┼───  (.  E  F  .)
G ───●─────┼─────●─────●───  (B  .  C# D)
D ───●─────●─────┼─────●───  (G  A  .  B)
A ───┼─────●─────●─────┼───  (.  E  F  .)
E ───●─────┼─────●─────●───  (A  .  B  C)

● = scale tone   R = root (highlighted)
```

### 3. Analyzer (`core/analyzer.py`)

Responsibilities:
- Accept a `.gp` file path or pre-parsed gp2tab JSON
- If `.gp` → call `gp2tab.parser.parse()` to get the Song model
- Convert each note's `(string, fret)` to a pitch name using tuning
- Perform per-bar analysis:
  - Detected scale/mode
  - Scale degree of each note
  - Techniques present (from gp2tab technique data)
  - Note density (notes per bar)
  - Difficulty score (composite of density, technique complexity, tempo, string crossings)
  - Melodic pattern detection (ascending run, descending run, sequence, arpeggio, chromatic, repeated note)
  - Outside notes (chromatic approach tones, non-diatonic notes)
- Group bars into sections using (in priority order):
  1. GP section markers (if present in the Song.sections list)
  2. Natural phrase boundaries: a rest bar, or a note held >= 2 beats followed by a rest or new phrase
  3. Fixed-size fallback: if no markers or boundaries found, chunk into groups of 4 bars
  4. Adjacent chunks with the same detected scale and similar technique profile are merged if combined length <= 8 bars
- The `key` field in `SoloAnalysis` is **derived by the analyzer** via key detection, not read from GP metadata (the gp2tab `Song` model has no key field)
- Produce a full `SoloAnalysis` report

Output dataclass:
```python
@dataclass
class BarAnalysis:
    bar_number: int
    notes: list[NoteAnalysis]        # each note with pitch, scale degree, techniques
    detected_scale: str              # e.g. "D Aeolian"
    techniques: list[str]            # unique techniques in this bar
    note_density: int                # total notes
    difficulty_score: float          # 1.0-10.0
    melodic_patterns: list[str]     # detected patterns
    outside_notes: list[str]         # non-diatonic notes

@dataclass
class SectionAnalysis:
    name: str                        # e.g. "Section A — Opening Theme"
    bars: list[BarAnalysis]
    bar_range: tuple[int, int]       # (start, end)
    overall_scale: str
    primary_techniques: list[str]
    difficulty: float                # average of bar difficulties
    practice_priority: int           # 1 = learn first

@dataclass
class SoloAnalysis:
    title: str
    artist: str
    key: str
    tempo: int
    tuning: list[str]
    sections: list[SectionAnalysis]
    practice_order: list[str]        # section names in recommended order
    technique_summary: dict          # technique → count/bars where it appears
    scale_summary: dict              # scale → bars where it's used
```

### 4. Lesson Generator (`lessons/generator.py`)

Responsibilities:
- Take a `SoloAnalysis` and produce a full set of lesson markdown files
- Use Jinja2 templates from `theory/lesson_templates/`
- Template selection logic:
  - Sections with bends → include bend teaching template with actual frets from analysis
  - Sections in a specific mode → include that mode's explanation from `scales.yaml`
  - High difficulty sections → lower starting tempo percentage
  - Outside notes detected → include chromatic approach note explanation
- Generate these files:
  - `theory.md` — full theory overview (key, scales used, modal interchange)
  - `breakdown.md` — technique inventory with difficulty per section
  - `practice.md` — high-level phased practice plan
  - `lessons/01-XX.md` through `lessons/NN-XX.md` — self-contained per-session lessons
  - `lessons/README.md` — lesson index
  - `.context.md` — initialized for practice tracking

Lesson structure follows the existing Man of Steel lesson format:
- Goal, warm-up, concept explanation, numbered steps, checkpoint, session log prompt

Also generates:
- **`practice-log.md`** — empty log with header: `# Practice Log\n\n| Date | Lesson | Duration | Tempo | Notes |\n|------|--------|----------|-------|-------|`
- **`.context.md`** — initialized: current lesson = 01, all tempos blank, no stuck points, no completed lessons

#### Template Context Dataclasses

The generator builds these objects and passes them to Jinja2 templates:

```python
@dataclass
class LessonStep:
    title: str                    # e.g. "Learn the Notes — Bars 5-6"
    body: str                     # Explanatory paragraph
    instruction: str              # "Do this:" content
    listen_for: str               # "Listen for:" content
    repeat_instruction: str       # "Repeat:" content
    tab_excerpt: str | None       # Relevant ASCII tab lines (from gp2tab)

@dataclass
class WarmupExercise:
    description: str              # What to do
    source_lesson: str | None     # Which technique lesson this references

@dataclass
class ConceptContext:
    name: str                     # e.g. "Bending", "D Dorian"
    teaching_note: str            # From scales.yaml or techniques.yaml
    improvisation_tip: str | None # From scales.yaml
    root: str | None = None       # Root note (for scales/chords), e.g. "D"
    notes: list[str] | None = None  # Computed notes in scale/chord, e.g. ["D","E","F","G","A","B","C"]

@dataclass
class LessonContext:
    lesson_number: int
    section_name: str
    bar_start: int
    bar_end: int
    phase: str                    # "Foundation", "Building", "Peak", "Assembly"
    prerequisites: str            # Comma-separated lesson numbers
    estimated_time: int           # minutes
    target_tempo_pct: int         # percentage of original tempo
    target_tempo_bpm: int         # computed from pct * song tempo
    goal_techniques: str          # e.g. "accurate bends and controlled vibrato"
    warmup_exercises: list[WarmupExercise]
    primary_concept: ConceptContext
    primary_scale: ConceptContext | None
    steps: list[LessonStep]
    improvisation_suggestions: str | None
    checkpoints: list[str]
    next_lesson: int | None
```

### 5. LLM Enhancer (`llm/enhancer.py`)

Responsibilities:
- Post-process template-generated lesson files
- Send each lesson to the configured LLM with a strict system prompt:
  - All notes, frets, strings, techniques, scale names are CORRECT — do not change them
  - Improve prose: make it natural, engaging, add analogies
  - Add improvisation suggestions tied to the detected scale
  - Add context about the song/artist if known
- Provider abstraction supports:
  - `claude` — Anthropic API (uses ANTHROPIC_API_KEY env var)
  - `openai` — OpenAI API (uses OPENAI_API_KEY env var)
  - `ollama` — local Ollama instance (no API key needed)

Config file (`~/.guitar-teacher/config.yaml`):
```yaml
llm:
  provider: claude        # claude | openai | ollama
  model: claude-sonnet-4-6  # model identifier
  api_key_env: ANTHROPIC_API_KEY
  base_url: null          # override for ollama (http://localhost:11434)
```

CLI usage:
```bash
# Without LLM (default)
guitar-teacher lessons solo.gp

# With LLM enhancement
guitar-teacher lessons solo.gp --enhance

# With specific provider/model override
guitar-teacher lessons solo.gp --enhance --provider ollama --model llama3.1
```

The enhancer is completely optional. If `--enhance` is not passed, or no config exists, the tool produces fully functional lessons from templates alone.

---

## CLI Design

Built with Click. Subcommands:

```bash
# === Solo Analysis & Lessons ===
guitar-teacher analyze <file.gp|file.json>          # Print analysis report
guitar-teacher lessons <file.gp|file.json> [-o dir]  # Generate full lesson plan
guitar-teacher lessons <file.gp> --enhance           # Generate + LLM enhance

# === Theory Reference ===
guitar-teacher scale <root> <type>                   # Show scale on fretboard
guitar-teacher scale D dorian                        # D Dorian with fretboard diagram
guitar-teacher scale "A harmonic-minor"              # Quotes for multi-word names

guitar-teacher chord <name>                          # Show chord shapes
guitar-teacher chord Am7                             # Am7 across the fretboard
guitar-teacher chord "D#dim7"                        # Chord voicings

guitar-teacher key <root> <type>                     # Show all chords in a key
guitar-teacher key D minor                           # Dm, Edim, F, Gm, Am, Bb, C

guitar-teacher identify-key <notes...>               # Detect key from notes
guitar-teacher identify-key D E F G A Bb C           # → "D Natural Minor / D Aeolian"

guitar-teacher suggest-scales <chords...>            # Suggest scales for chord progression
guitar-teacher suggest-scales Dm7 G7 Cmaj7           # → "C major / D Dorian / G Mixolydian"

guitar-teacher interval <note1> <note2>              # Show interval between two notes
guitar-teacher interval C E                          # → "Major 3rd (4 semitones)"

# === Config ===
guitar-teacher config                                # Show current config (edit ~/.guitar-teacher/config.yaml directly to change)
```

---

## Theory Data Format

### scales.yaml (example entries)

```yaml
natural_minor:
  name: Natural Minor (Aeolian)
  aliases: [aeolian, minor]
  category: mode
  parent_scale: major
  parent_degree: 6
  intervals: [2, 1, 2, 2, 1, 2, 2]
  character: Dark, sad, serious
  common_in: [rock, metal, classical, pop]
  chord_fit: [m, m7, m9]
  teaching_note: >
    The natural minor scale is the foundation of most rock and metal soloing.
    Compare it to the major scale — it has a flat 3rd, flat 6th, and flat 7th.
  improvisation_tip: >
    Emphasize the root and flat 3rd for a strong minor sound.
    The flat 7th resolves naturally down to the 6th or up to the root.

dorian:
  name: Dorian
  aliases: [dor]
  category: mode
  parent_scale: major
  parent_degree: 2
  intervals: [2, 1, 2, 2, 2, 1, 2]
  character: Minor but with a brighter, jazzy quality
  common_in: [jazz, fusion, funk, blues]
  chord_fit: [m7, m9, m11, m13]
  teaching_note: >
    Dorian is a minor scale with a natural 6th instead of a flat 6th.
    That one note difference gives it a jazzier, more sophisticated sound.
    Think Carlos Santana, Daft Punk "Get Lucky", or Miles Davis "So What".
  improvisation_tip: >
    Highlight the natural 6th — it's the note that makes Dorian sound different
    from plain minor. Works great over m7 and m9 chords.
```

### chords.yaml (example entries)

```yaml
major:
  name: Major
  symbol: ""
  aliases: [maj, M]
  intervals: [0, 4, 7]
  character: Bright, happy, stable
  common_voicings:
    E_shape: {frets: [0, 2, 2, 1, 0, 0], root_string: 6}
    A_shape: {frets: [null, 0, 2, 2, 2, 0], root_string: 5}
    C_shape: {frets: [null, 3, 2, 0, 1, 0], root_string: 5}
    D_shape: {frets: [null, null, 0, 2, 3, 2], root_string: 4}

m7:
  name: Minor 7th
  symbol: m7
  aliases: [min7, -7]
  intervals: [0, 3, 7, 10]
  character: Smooth, mellow minor
  common_voicings:
    E_shape: {frets: [0, 2, 0, 0, 0, 0], root_string: 6}
    A_shape: {frets: [null, 0, 2, 0, 1, 0], root_string: 5}
```

### techniques.yaml (example entry)

```yaml
bend:
  name: Bending
  difficulty: 5
  description: Pushing or pulling a string to raise its pitch
  variants:
    - name: Half-step bend
      semitones: 1
      notation: "b(1/2)"
    - name: Full bend
      semitones: 2
      notation: "b(1)"
    - name: Bend and release
      notation: "b-r"
  teaching_template: >
    This section uses bends on {{ string }} string at fret {{ fret }}.
    Target pitch: {{ target_note }} ({{ interval }} above {{ start_note }}).
    Practice: play fret {{ target_fret }} first to hear the target pitch,
    then bend from fret {{ fret }} to match. Support the bending finger
    with fingers behind it. Do 5 reps checking accuracy each time.
  common_mistakes:
    - Bending flat (not reaching target pitch)
    - Losing vibrato control at the top of a bend
    - Inconsistent bend speed
```

---

## Analysis Pipeline Detail

### Key Detection Algorithm

1. Extract all pitch classes from the solo (or per section)
2. For each of the 12 possible root notes:
   - For each scale in `scales.yaml`:
     - Count how many solo notes fit the scale
     - Count how many scale notes are missing from the solo
     - Compute a match score: `(notes_in_scale / total_notes) - (missing_scale_notes * penalty)`
3. Rank by score. Return top 3 matches.
4. Use heuristics to break ties:
   - Does the solo start/end on the root? (bonus)
   - Is the root the most frequent note? (bonus)
   - Do bend targets land on chord tones? (bonus)

### Difficulty Scoring

Per-bar difficulty is a weighted composite:

```
difficulty = (
    note_density_score * 0.3 +       # notes per beat, normalized
    technique_score * 0.3 +           # sum of technique difficulties from techniques.yaml
    tempo_factor * 0.2 +              # relative to comfortable playing speed
    string_crossing_score * 0.1 +     # number of string changes
    position_shift_score * 0.1        # fret distance between consecutive notes
)
```

Normalized to 1.0-10.0 scale.

### Practice Order Algorithm

1. Score each section by difficulty
2. Identify "anchor" sections — melodic/thematic sections that are easier (these come first)
3. Identify "bridge" sections — moderate difficulty connecting sections
4. Identify "peak" sections — hardest parts (these come last)
5. Order: anchors → bridges → peaks → assembly lessons → full performance

---

## Lesson Template System

Uses Jinja2 templates stored in `theory/lesson_templates/`. The generator passes the analysis data as template context.

Example template (`section_lesson.md.j2`):
```
# Lesson {{ lesson_number }}: {{ section_name }} -- Bars {{ bar_start }}-{{ bar_end }}
**Phase:** {{ phase }}
**Prerequisites:** {{ prerequisites }}
**Estimated time:** {{ estimated_time }} minutes
**You'll need:** Guitar, metronome, tuner

## Goal
Play bars {{ bar_start }}-{{ bar_end }} cleanly at {{ target_tempo_pct }}% tempo
({{ target_tempo_bpm }} BPM) with {{ goal_techniques }}.

## Warm-Up (5 min)
{% for warmup in warmup_exercises %}
- {{ warmup }}
{% endfor %}

## Concept: {{ primary_concept.name }}
{{ primary_concept.teaching_note }}

{% if primary_scale %}
**Scale in use:** {{ primary_scale.name }} ({{ primary_scale.root }})
Notes: {{ primary_scale.notes | join(', ') }}
{{ primary_scale.teaching_note }}
{% endif %}

## Steps
{% for step in steps %}
### Step {{ loop.index }}: {{ step.title }}
{{ step.body }}
- **Do this:** {{ step.instruction }}
- **Listen for:** {{ step.listen_for }}
- **Repeat:** {{ step.repeat_instruction }}
{% endfor %}

{% if improvisation_suggestions %}
## Improvisation Corner
{{ improvisation_suggestions }}
{% endif %}

## Checkpoint
{% for check in checkpoints %}
- [ ] {{ check }}
{% endfor %}

**All checked?** -> Move to Lesson {{ next_lesson }}
**Not yet?** -> Repeat this lesson next session.

## Session Log
At the end of your session, tell Claude:
- How long you practiced
- Which checkpoints you passed
- What tempo you reached
- What felt difficult
```

---

## Error Handling

- Missing theory data: if a detected scale/chord isn't in YAML, the analyzer flags it as "unrecognized" and continues. The lesson notes it as an area for manual review.
- GP parse failures: surface gp2tab warnings in the analysis report. Bars with warnings get a note in lessons.
- LLM failures: if enhancement fails (network error, API key missing), fall back to template output with a warning. Never block lesson generation on LLM availability.

## Testing Strategy

- **Unit tests** for theory engine: scale construction, key detection, chord building, interval math — these are pure functions with known outputs
- **Unit tests** for fretboard: verify note positions for known scales/chords in standard and alternate tunings
- **Integration tests** for analyzer: feed known GP files, verify analysis output matches expected scales/techniques
- **Snapshot tests** for lesson generator: generate lessons for a reference GP file, compare against approved snapshots
- **No tests needed** for LLM enhancer (output is non-deterministic) — but test the provider abstraction with mocks

## Dependencies

- `click` — CLI framework
- `jinja2` — template rendering
- `pyyaml` — YAML loading
- `gp2tab` — GP file parsing (local dependency)
- `anthropic` / `openai` / `ollama` — optional, for LLM enhancement
