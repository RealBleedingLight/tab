# Guitar Teacher — Full Documentation

> **Note:** A full web platform has been built on top of this CLI tool. It provides a browser-based UI for uploading Guitar Pro files, processing lessons, and practicing — deployed on Railway (backend) and Vercel (frontend). This document covers the underlying CLI tool and engine; for the web platform see the `web/` directory and the FastAPI backend in `api/`.

Guitar Teacher is a local CLI tool that analyzes Guitar Pro files and generates structured lesson plans. It also serves as a music theory reference you can query from the terminal.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Generating ASCII Tab (gp2tab)](#generating-ascii-tab-gp2tab)
4. [Commands Reference](#commands-reference)
   - [scale](#scale)
   - [chord](#chord)
   - [key](#key)
   - [identify-key](#identify-key)
   - [suggest-scales](#suggest-scales)
   - [interval](#interval)
   - [analyze](#analyze)
   - [lessons](#lessons)
5. [Lesson Generation — In Depth](#lesson-generation--in-depth)
6. [LLM Enhancement](#llm-enhancement)
7. [Theory Knowledge Base](#theory-knowledge-base)
8. [Extending the Knowledge Base](#extending-the-knowledge-base)
9. [Configuration File](#configuration-file)
10. [Integration with Claude Code Practice Sessions](#integration-with-claude-code-practice-sessions)

---

## Installation

Prerequisites: Python 3.9+, pip

```bash
# From the root of the tab repo:
pip install -e ./gp2tab            # parser for Guitar Pro files
pip install -e ./guitar-teacher    # the CLI tool itself

# With LLM enhancement support (Claude, OpenAI, Ollama):
pip install -e "./guitar-teacher[llm]"
```

After installation the `guitar-teacher` command is available globally.

**Virtual environment (recommended):**

```bash
python3 -m venv guitar-teacher/.venv
source guitar-teacher/.venv/bin/activate
pip install -e ./gp2tab
pip install -e "./guitar-teacher[llm]"
```

---

## Quick Start

```bash
# Generate ASCII tab from a Guitar Pro file (gp2tab — separate tool)
python -m gp2tab solo.gp

# Theory lookups
guitar-teacher scale E minor
guitar-teacher chord Am7
guitar-teacher key A minor
guitar-teacher identify-key A C E G
guitar-teacher suggest-scales Am7 D7 Gmaj7
guitar-teacher interval C E

# Analyze a solo
guitar-teacher analyze solo.gp

# Generate a full lesson plan
guitar-teacher lessons solo.gp -o ./my-lessons
```

---

## Generating ASCII Tab (gp2tab)

Tab generation is handled by the **gp2tab** tool, which is a separate package in this repo (installed as a dependency). `guitar-teacher` itself does not generate tabs — it reads GP files for analysis and lesson generation only.

```bash
# Generate tab, JSON, and LLM-formatted output from a GP file
python -m gp2tab solo.gp

# Specify output directory
python -m gp2tab solo.gp -o ./output/

# Select a specific track (default is track 1)
python -m gp2tab solo.gp --track 2

# Change ASCII tab line width (default 120)
python -m gp2tab solo.gp --width 80

# Choose output formats (tab, json, llm — default: all three)
python -m gp2tab solo.gp --format tab
python -m gp2tab solo.gp --format tab,json

# Parse only, no files written
python -m gp2tab solo.gp --dry-run
```

**Output files** (written next to the source GP file by default):
- `tab.txt` — Human-readable ASCII tab
- `tab.json` — Machine-readable note data (used as input to `guitar-teacher analyze` and `guitar-teacher lessons`)
- `tab.llm.txt` — Compact format for feeding to an LLM

**Multi-track files:** gp2tab lists all tracks on the first run. Use `--track N` to select the lead guitar part. Note that `gp2tab` uses 1-based track numbers (`--track 1` = first track), while `guitar-teacher` uses 0-based (`--track 0` = first track).

**Typical workflow:**

```bash
# Step 1: Convert GP file to tab and JSON
python -m gp2tab "My Solo.gp" -o ./songs/artist/song/

# Step 2: Analyze the JSON output
guitar-teacher analyze ./songs/artist/song/tab.json

# Step 3: Generate lessons
guitar-teacher lessons ./songs/artist/song/tab.json -o ./songs/artist/song/
```

---

## Commands Reference

### `scale`

Look up a scale. Prints notes, character, teaching notes, improvisation tips, and an ASCII fretboard diagram.

```
guitar-teacher scale <ROOT> <SCALE_TYPE>
```

**Arguments:**
- `ROOT` — Note name: `A`, `Bb`, `C#`, `D`, etc.
- `SCALE_TYPE` — Scale name (case-insensitive). See [available scales](#available-scales).

**Examples:**

```bash
guitar-teacher scale E minor
guitar-teacher scale A dorian
guitar-teacher scale B "harmonic minor"
guitar-teacher scale F# "phrygian dominant"
```

**Example output (`guitar-teacher scale E minor`):**

```
E Natural Minor
Category: mode
Notes: E F# G A B C D
Character: Sad, dark, melancholic — the standard minor sound
Common in: rock, metal, pop, classical, prog rock
Chord fit: min, min7, min9, min11

Teaching note: The relative minor of the major scale. ...
Improvisation tip: Emphasize the b3 and b7 for the classic minor sound. ...

E Natural Minor

       0   1   2   3   4   5   6   7   8   9  10  11  12  ...
E  ║[R] --- [*] [*] --- [*] --- [*] [*] --- [*] --- [R] ...
B  ║[*] [*] --- [*] --- [R] --- [*] [*] --- [*] --- [*] ...
G  ║[*] --- [*] --- [*] [*] --- [*] --- [R] --- [*] [*] ...
D  ║[*] --- [R] --- [*] [*] --- [*] --- [*] [*] --- [*] ...
A  ║[*] --- [*] [*] --- [*] --- [R] --- [*] [*] --- [*] ...
E  ║[R] --- [*] [*] --- [*] --- [*] [*] --- [*] --- [R] ...
```

`[R]` = root note, `[*]` = scale tone, `---` = not in scale.

---

### `chord`

Look up a chord. Prints notes, intervals, and character.

```
guitar-teacher chord <CHORD_NAME>
```

**Argument:**
- `CHORD_NAME` — Root + type, e.g. `Am7`, `C#maj7`, `Bdim`, `G7`. Omit the type for a plain major chord (`C` = C major).

**Examples:**

```bash
guitar-teacher chord Am7
guitar-teacher chord G7
guitar-teacher chord Bdim
guitar-teacher chord C#maj7
guitar-teacher chord F          # F major
```

**Example output (`guitar-teacher chord Am7`):**

```
Am7 — Minor 7th
Notes: A C E G
Intervals: [0, 3, 7, 10]
Character: Mellow, jazzy, relaxed minor
```

---

### `key`

Show all diatonic chords in a key.

```
guitar-teacher key <ROOT> <SCALE_TYPE>
```

**Examples:**

```bash
guitar-teacher key C major
guitar-teacher key A minor
guitar-teacher key D dorian
```

**Example output (`guitar-teacher key A minor`):**

```
Diatonic chords in A minor:

      I  Am....... A C E
     ii  Bdim..... B D F
    iii  C........ C E G
     IV  Dm....... D F A
      V  Em....... E G B
     vi  F........ F A C
    vii  G........ G B D
```

---

### `identify-key`

Given a set of notes, find the most likely key(s). Useful when you've figured out the notes in a solo and want to know what scale/key you're in.

```
guitar-teacher identify-key <NOTE> [<NOTE> ...]
```

**Examples:**

```bash
guitar-teacher identify-key A C E G
guitar-teacher identify-key D E F G A Bb C
guitar-teacher identify-key C# D# E F# G# A B
```

**Example output (`guitar-teacher identify-key A C E G`):**

```
Top key matches for: A C E G

  1. A Minor Pentatonic — score: 1.05 (4/4 notes)
  2. A Blues Scale — score: 0.95 (4/4 notes)
  3. C Major Pentatonic — score: 0.90 (4/4 notes)
  4. A Dorian — score: 0.85 (4/4 notes)
  5. A Phrygian — score: 0.85 (4/4 notes)
```

The score is a weighted match: more specific scales (pentatonic vs. 7-note) score higher when all notes fit. `outside:` notes are shown when a scale is a near-match.

---

### `suggest-scales`

Given a chord progression, suggest which scales work over all the chords. Useful for improvisation planning.

```
guitar-teacher suggest-scales <CHORD> [<CHORD> ...]
```

**Examples:**

```bash
guitar-teacher suggest-scales Dm7 G7 Cmaj7
guitar-teacher suggest-scales Am7 D7 Gmaj7
guitar-teacher suggest-scales E5 A5 D5
```

**Example output (`guitar-teacher suggest-scales Am7 D7 Gmaj7`):**

```
Scale suggestions for: Am7 D7 Gmaj7

  1. A Dorian — A B C D E F# G (score: 1.15)
  2. C Lydian — C D E F# G A B (score: 1.00)
  3. D Mixolydian — D E F# G A B C (score: 1.00)
  4. E Natural Minor — E F# G A B C D (score: 1.00)
  5. F# Locrian — F# G A B C D E (score: 1.00)
```

---

### `interval`

Show the interval name and semitone distance between two notes.

```
guitar-teacher interval <NOTE1> <NOTE2>
```

**Examples:**

```bash
guitar-teacher interval C E
guitar-teacher interval A C
guitar-teacher interval F# B
```

**Example output (`guitar-teacher interval C E`):**

```
C -> E: Major 3rd (M3)
Semitones: 4
```

---

### `analyze`

Analyze a Guitar Pro (`.gp`, `.gp5`, `.gpx`) or gp2tab JSON file. Detects the key, maps sections, scores difficulty, inventories techniques, and recommends a practice order.

```
guitar-teacher analyze <FILE_PATH> [--track N]
```

**Arguments:**
- `FILE_PATH` — Path to a `.gp*` or `.json` file.

**Options:**
- `--track N`, `-t N` — Track index (0-based) for multi-track GP files. Default: `0`.

**Examples:**

```bash
guitar-teacher analyze solo.gp
guitar-teacher analyze solo.json
guitar-teacher analyze band.gp --track 2   # use the 3rd track (lead guitar)
```

**Example output:**

```
Analyzing solo.json...

============================================================
  Man Of Steel — Guthrie Govan
============================================================
  Key: A Diminished (Whole-Half)
  Tempo: 128 bpm
  Tuning: E A D G B E
  Sections: 16

Section                       Bars   Diff Techniques
------------------------- -------- ------ ------------------------------
Section A                      4-7   6.1 bend_release, pre_bend, pull_off
Section B                     8-11   6.2 slide, bend, pre_bend
...
Section P                    64-65   2.0

Technique inventory:
  bend                 34 bars
  hammer_on            96 bars
  pull_off             96 bars
  slide                54 bars
  vibrato              34 bars
  ...

Practice order: Section P -> Section N -> Section O -> ...
```

**Difficulty scores** are 1.0–10.0 based on note density, technique complexity, tempo, string crossings, and position shifts.

**Practice order** sorts sections from easiest to hardest — this is the order lessons will be generated in.

---

### `lessons`

Analyze a GP or JSON file and generate a full, structured lesson plan — one self-contained Markdown file per lesson session.

```
guitar-teacher lessons <FILE_PATH> -o <OUTPUT_DIR> [OPTIONS]
```

**Arguments:**
- `FILE_PATH` — Path to a `.gp*` or `.json` file.

**Required option:**
- `-o`, `--output <DIR>` — Directory where all files will be written.

**Optional flags:**
- `--track N`, `-t N` — Track index for multi-track files. Default: `0`.
- `--order <mode>` — Section ordering strategy. Default: `difficulty`.
  - `difficulty` — Easiest sections first. Builds confidence early; recommended for most solos.
  - `bars` — Chronological bar order. Follows the song top to bottom; useful if you prefer to learn it as written.
- `--enhance` — Post-process lessons with an LLM after generation.
- `--provider <name>` — LLM provider: `claude`, `openai`, or `ollama`. Overrides config file.
- `--model <name>` — LLM model name. Overrides config file.

**Examples:**

```bash
# Default — easiest sections first
guitar-teacher lessons solo.gp -o ./my-lessons

# Chronological bar order (learn the song top to bottom)
guitar-teacher lessons solo.gp -o ./my-lessons --order bars

# Generate from a JSON file, second track
guitar-teacher lessons band.gp -o ./solo-lessons --track 1

# Generate and enhance with Claude
guitar-teacher lessons solo.gp -o ./my-lessons --enhance --provider claude

# Generate and enhance with a local Ollama model
guitar-teacher lessons solo.gp -o ./my-lessons --enhance --provider ollama --model llama3.1
```

See [Lesson Generation — In Depth](#lesson-generation--in-depth) for full details on what is generated.

---

## Lesson Generation — In Depth

### What gets generated

Running `lessons` creates the following structure inside your output directory:

```
<output-dir>/
├── lessons/
│   ├── README.md                    ← index with clickable links to all lessons
│   ├── 01-technique-foundations.md  ← prerequisite technique intro
│   ├── 02-section-X-bars-N-M.md    ← one lesson per section (easiest first)
│   ├── ...
│   ├── NN-assembly-A-B.md           ← lessons connecting adjacent sections
│   ├── ...
│   └── NN-full-performance.md       ← final performance lesson
├── theory.md                        ← key, scale, and theory analysis
├── breakdown.md                     ← technique inventory, difficulty per section
├── practice.md                      ← phased practice plan with tempo milestones
├── practice-log.md                  ← empty append-only session log
└── .context.md                      ← progress tracker for Claude Code sessions
```

### Lesson structure

Every lesson is self-contained — you should be able to open any single lesson file and know exactly what to do without reading anything else.

Each lesson contains:
- **Goal** — What you're aiming for by the end of the session (technique + tempo target)
- **Warm-Up** — Specific exercises to prime the relevant muscles
- **Concept** — The music theory or technique concept central to this section
- **Steps** — Numbered practice steps with exact instructions ("Do this", "Listen for", "Repeat")
- **Checkpoint** — Self-assessment checklist to know when you can move on
- **Session log prompt** — What to report back (duration, tempo reached, what clicked)

### Lesson types

| Type | When it appears | Purpose |
|------|----------------|---------|
| **Technique Intro** | Lesson 01 | Covers prerequisite techniques (bends, vibrato, tapping, etc.) before any notes |
| **Section Lesson** | One per section | Teaches the actual notes of each section, ordered easiest to hardest |
| **Assembly Lesson** | After all sections | Connects adjacent sections — focuses on transitions |
| **Performance Lesson** | Final lesson | Full run-throughs at target tempo — performance mindset, recording yourself |

### Tempo targets

- Section lessons start at **50% of the song's tempo**
- Assembly lessons use **40%** (extra headroom for transitions)
- Performance lesson targets **80%**

After completing the performance lesson, increase by **5 bpm per session** until you hit 100%.

### Practice order

Sections are ordered by difficulty (easiest first) so you build confidence early and tackle harder material once you have the feel of the solo. The `analyze` command shows you this order before you commit to generating.

---

## LLM Enhancement

The `--enhance` flag runs all generated lesson files through an LLM after generation. The LLM is asked to:
- Make teaching language more natural and specific
- Add relevant musical context
- Improve exercise descriptions

### Setup

Create `~/.guitar-teacher/config.yaml`:

```yaml
llm:
  provider: claude          # claude | openai | ollama
  model: claude-sonnet-4-6  # any model your provider supports
  api_key_env: ANTHROPIC_API_KEY  # name of the env var with your API key
```

For OpenAI:

```yaml
llm:
  provider: openai
  model: gpt-4o
  api_key_env: OPENAI_API_KEY
```

For Ollama (local, no API key needed):

```yaml
llm:
  provider: ollama
  model: llama3.1
  # no api_key_env needed
```

### Passing options directly

You can skip the config file and pass everything on the command line:

```bash
guitar-teacher lessons solo.gp -o ./lessons \
  --enhance \
  --provider claude \
  --model claude-sonnet-4-6
```

---

## Theory Knowledge Base

All music theory data lives in `guitar-teacher/theory/` as YAML files. The CLI reads these at runtime — no compilation step needed.

### Available scales

| Scale | Category |
|-------|----------|
| Major | mode |
| Dorian | mode |
| Phrygian | mode |
| Lydian | mode |
| Mixolydian | mode |
| Natural Minor | mode |
| Locrian | mode |
| Harmonic Minor | scale |
| Melodic Minor | scale |
| Major Pentatonic | pentatonic |
| Minor Pentatonic | pentatonic |
| Blues Scale | pentatonic |
| Chromatic | chromatic |
| Whole Tone | symmetric |
| Diminished (Whole-Half) | symmetric |
| Diminished (Half-Whole) | symmetric |
| Phrygian Dominant | mode |
| Lydian Dominant | mode |
| Super Locrian | mode |
| Hungarian Minor | exotic |
| Japanese | exotic |

### Available chord types

| Name | Symbol | Example |
|------|--------|---------|
| Major | (none) | `C` |
| Minor | `m` | `Am` |
| Diminished | `dim` | `Bdim` |
| Augmented | `aug` | `Caug` |
| Suspended 2nd | `sus2` | `Dsus2` |
| Suspended 4th | `sus4` | `Gsus4` |
| Major 7th | `maj7` | `Cmaj7` |
| Dominant 7th | `7` | `G7` |
| Minor 7th | `m7` | `Am7` |
| Minor 7th Flat 5 | `m7b5` | `Bm7b5` |
| Diminished 7th | `dim7` | `Bdim7` |
| Add 9 | `add9` | `Cadd9` |
| Major 9th | `maj9` | `Cmaj9` |
| Dominant 9th | `9` | `G9` |
| Minor 9th | `m9` | `Am9` |
| Dominant 7th Sharp 9 | `7#9` | `E7#9` |
| Major 6th | `6` | `A6` |
| Minor 6th | `m6` | `Am6` |
| Power Chord | `5` | `E5` |
| Augmented 7th | `aug7` | `Caug7` |
| Minor Major 7th | `mMaj7` | `AmMaj7` |
| Dominant 11th | `11` | `G11` |
| Dominant 13th | `13` | `G13` |

---

## Extending the Knowledge Base

### Adding a scale

Edit `theory/scales.yaml` and add an entry:

```yaml
- id: bebop_dominant
  name: "Bebop Dominant"
  aliases: ["bebop", "bebop scale"]
  intervals: [0, 2, 4, 5, 7, 9, 10, 11]
  category: "jazz"
  character: "Jazz swing feel, chromatic passing tone between b7 and root"
  common_in: ["jazz", "bebop"]
  chord_fit: ["7", "9", "13"]
  teaching_note: "The bebop dominant adds a chromatic passing tone between the b7 and root, creating an 8-note scale that aligns chord tones on strong beats when played in eighth notes."
  improvisation_tip: "Start on a chord tone on beat 1 — the 8-note scale will land chord tones on every downbeat."
```

- `intervals` — Semitone steps from root (0 = root, always start with 0)
- `aliases` — Alternative names the CLI will recognize
- `id` — Lowercase, underscores, used internally

### Adding a chord type

Edit `theory/chords.yaml`:

```yaml
- id: dominant_7_flat_9
  name: "Dominant 7th Flat 9"
  symbol: "7b9"
  aliases: ["dom7b9", "7 flat 9"]
  intervals: [0, 4, 7, 10, 13]
  character: "Tense, dissonant — common in jazz cadences and flamenco"
  voicings:
    - [0, 3, 5, 6]  # fret offsets from lowest string
```

### Adding a technique

Edit `theory/techniques.yaml`:

```yaml
- id: sweep_picking
  name: "Sweep Picking"
  gp2tab_name: "sweep"
  aliases: ["sweeping", "economy picking across strings"]
  description: "Drag the pick across multiple strings in one fluid motion in the same direction as string changes."
  teaching_template: |
    Sweeping feels like strumming but sounds like individual notes — the fretting hand does the work of muting each note after it sounds.
  common_mistakes:
    - "Pressing all the notes down simultaneously — it sounds like a chord"
    - "Rushing through the sweep — the notes should be even"
    - "Tensing up the picking hand — the motion should be relaxed and flowing"
  variants:
    - name: "3-string sweep"
      notation: "sw"
    - name: "5-string sweep"
      notation: "sw"
    - name: "6-string sweep"
      notation: "sw"
```

---

## Configuration File

Create `~/.guitar-teacher/config.yaml` to persist LLM settings:

```yaml
llm:
  provider: claude          # claude | openai | ollama
  model: claude-sonnet-4-6
  api_key_env: ANTHROPIC_API_KEY
```

The `api_key_env` field is the **name of an environment variable** that contains your API key — not the key itself. This keeps secrets out of the config file.

Set the env var in your shell profile:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

---

## Integration with Claude Code Practice Sessions

Generated lessons are designed to work with the Claude Code practice session workflow described in `CLAUDE.md`. The workflow is:

1. Run `guitar-teacher lessons solo.gp -o songs/artist/song/` to populate a song folder
2. The `.context.md` file tracks your current lesson and progress
3. Tell Claude "let's practice Man of Steel" — it reads `.context.md`, opens the current lesson, and walks you through it step by step
4. After each session, Claude updates `.context.md` and appends to `practice-log.md`
5. Auto-sync commits everything to GitHub so progress is never lost

### Integrating into an existing song folder

If you already have a song folder with a `.gp` or `.json` file, point the output directly at the song folder:

```bash
guitar-teacher lessons songs/guthrie-govan/man-of-steel/tab.json \
  -o songs/guthrie-govan/man-of-steel/
```

This will create a `lessons/` subfolder and the supporting `.md` files alongside any files already there. It will not overwrite `tab.txt` or any existing hand-written files.
