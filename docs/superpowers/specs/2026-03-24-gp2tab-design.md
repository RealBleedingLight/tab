# gp2tab — Guitar Pro to Tab Converter

**Date:** 2026-03-24
**Status:** Reviewed

## Problem

Parsing Guitar Pro files for tab transcription is slow, token-heavy, and error-prone when done manually by an LLM. Every new song requires re-parsing raw XML/binary data. We need a standalone tool that reliably converts any GP file into human-readable and machine-readable formats in a single command.

## Goals

1. Convert GP3-8 files into accurate ASCII tab, structured JSON, and LLM-optimized text
2. Run locally with minimal dependencies (Python 3)
3. Be structured as a library so it can later become a web API or be consumed by a lesson generator
4. Produce output that renders identically on any machine (no formatting drift)

## Architecture

```
gp2tab/
├── gp2tab/
│   ├── __init__.py
│   ├── __main__.py        — allows `python -m gp2tab`
│   ├── models.py          — dataclasses: Song, Bar, Note, Technique, Section
│   ├── parser.py           — reads GP3-8 files, returns Song model
│   ├── parser_gp5.py       — GP3/4/5 binary parsing via pyguitarpro
│   ├── parser_gp_xml.py    — GP6/7/8 ZIP+XML parsing
│   ├── formatter_tab.py    — Song model -> ASCII tab (.txt)
│   ├── formatter_llm.py    — Song model -> condensed text (.llm.txt)
│   ├── formatter_json.py   — Song model -> structured JSON (.json)
│   └── utils.py            — shared helpers (beat math, string mapping)
├── cli.py                  — CLI entry point (thin wrapper)
├── requirements.txt        — pyguitarpro
└── README.md
```

**Data flow:** GP file -> parser -> Song model -> formatters -> output files

The parser normalizes all GP formats into the same data model. Formatters are independent — changing one never affects another. Adding a new GP format means adding a parser module. Adding a new output format means adding a formatter module.

## Data Model

### Song
- title, artist
- tuning (list of string names low-to-high, e.g. ["E", "A", "D", "G", "B", "e"])
  - Uppercase = lower octave, lowercase = higher octave (e.g. "E" = low E, "e" = high e)
  - For non-standard tunings with sharps/flats: ["Eb", "Ab", "Db", "Gb", "Bb", "eb"]
- tempo (BPM, initial tempo at bar 1)
- sections (list of Section, optional — from GP rehearsal marks)
- bars (list of Bar)

### Section
- name (e.g. "Intro", "Verse", "Solo Section A")
- start_bar (1-indexed)
- end_bar (1-indexed, inclusive)

### Bar
- number (1-indexed)
- time_signature (e.g. "4/4" — always present on every bar, not just on changes)
- tempo (if changed from previous bar, else null)
- section (name string if this bar starts a section, else null)
- notes (list of Note, ordered by beat position)
- is_rest (true if bar has no notes)
- is_partial (true for pickup bars / anacrusis that intentionally have fewer beats)
- warnings (list of string, e.g. duration mismatch messages)

### Note
- string (integer 1-6, where 1 = highest pitch string, 6 = lowest. Formatters resolve to names using Song.tuning)
- fret (integer)
- beat (float: 1.0, 1.5, 2.0, 2.75, etc. Rounded to 4 decimal places. For tuplets that produce repeating decimals, the formatter uses tolerance-based comparison)
- duration ("whole", "half", "quarter", "eighth", "16th", "32nd")
- dotted (boolean — a dotted quarter = 1.5 beats, dotted eighth = 0.75 beats, etc.)
- techniques (list of Technique)
- tie ("start", "continue", "end", or null)
  - "start" = first note in a tie chain (struck)
  - "continue" = middle note (not struck, sustain continues)
  - "end" = last note in chain (not struck, sustain ends)
  - Ties work across bar boundaries: last note of bar N can be "start", first note of bar N+1 can be "continue" or "end"
- tuplet (null, or {"actual": 3, "normal": 2} for triplets, etc.)
- grace (boolean)

### Technique
- type: one of:
  - "bend" — bend up and hold (value = bend amount in steps)
  - "bend_release" — bend up then release back (value = bend amount)
  - "pre_bend" — note is fretted already bent (value = bend amount)
  - "pre_bend_release" — fretted bent, then released (value = bend amount)
  - "hammer" — hammer-on
  - "pull" — pull-off
  - "slide_up", "slide_down" — slides
  - "vibrato"
  - "tap"
  - "mute" — fully muted / dead note
  - "palm_mute" — palm-muted (distinct from full mute)
  - "harmonic_natural" — natural harmonic
  - "harmonic_pinch" — artificial / pinch harmonic
  - "tremolo_pick" — tremolo picking
  - "trill" — trill
  - "let_ring" — let ring
- value (for bends): 0.5, 1.0, 1.5, 2.0 (in steps). Null for non-bend techniques.

### Scope notes
- 6-string guitars only (7/8-string out of scope for v1)
- Standard and alternate tunings supported
- Dynamics/velocity data from GP files is not captured (future extension)

## Output Formats

### 1. ASCII Tab (`tab.txt`)

Human-readable tab with beat markers and all 6 strings.

**Rules:**
- Pure ASCII only — no unicode, no special characters
- Default line width: 120 characters (configurable via `--width`)
- Two bars per line when they fit; one bar per line when dense
- Strings never wrap to a second line — this is a hard rule
- Beat markers (1, 2, 3, 4) above each bar, aligned to note positions
- All 6 strings always shown

**Technique notation:**
- `b(1/2)` `b(1)` `b(1 1/2)` — bend up and hold
- `br(1)` — bend up and release
- `pb(1)` — pre-bend (already bent when struck)
- `pbr(1)` — pre-bend and release
- `h` — hammer-on
- `p` — pull-off
- `/` `\` — slide up/down
- `~` — vibrato/sustain
- `(17)` — tied note (not re-struck)
- `t` — tap
- `x` — muted note
- `PM` — palm mute
- `NH` — natural harmonic
- `PH` — pinch harmonic
- `tp` — tremolo picking
- `tr` — trill
- `LR` — let ring

**Example:**
```
  Bar 4                                    Bar 5
     1     2        3     4  e &              1           3  & 4
e|----------------------------------------|----------------------------------------|
B|--15----17----17b(1/2)~~(17)(17)---------|----------------------------------------|
G|-------------------------------------14h16p14|--13~~~~~~~~~~~13h14h16-------------|
D|----------------------------------------|-------------------------14--------------|
A|----------------------------------------|----------------------------------------|
E|----------------------------------------|----------------------------------------|
```

**Header:**
```
==============================================================================
  Title — Artist
  Tuning: E A D G B e  |  Tempo: 128 BPM  |  Time: 4/4
  Source: Converted from Guitar Pro file by gp2tab
==============================================================================

LEGEND:
  b(1/2) = half-step bend    b(1) = full bend    b(1 1/2) = 1.5-step bend
  br = bend & release    pb = pre-bend    pbr = pre-bend & release
  h = hammer-on    p = pull-off    / = slide up    \ = slide down
  ~ = vibrato    (n) = tied note    t = tap    x = mute    PM = palm mute
  NH = natural harmonic    PH = pinch harmonic    LR = let ring
```

### 2. Structured JSON (`tab.json`)

Canonical machine-readable format. Directly consumable by software (lesson generator, web API, etc.).

**Structure:**
```json
{
  "title": "Man Of Steel",
  "artist": "Guthrie Govan",
  "tuning": ["E", "A", "D", "G", "B", "e"],
  "tempo": 128,
  "total_bars": 56,
  "sections": [
    {"name": "Opening Theme", "start_bar": 4, "end_bar": 8},
    {"name": "Building Intensity", "start_bar": 9, "end_bar": 16}
  ],
  "bars": [
    {
      "number": 1,
      "time_signature": "4/4",
      "is_rest": true,
      "is_partial": false,
      "notes": [],
      "warnings": []
    },
    {
      "number": 4,
      "time_signature": "4/4",
      "section": "Opening Theme",
      "is_rest": false,
      "is_partial": false,
      "notes": [
        {
          "beat": 1.0,
          "string": 2,
          "fret": 15,
          "duration": "eighth",
          "dotted": false,
          "techniques": [],
          "tie": null,
          "tuplet": null,
          "grace": false
        },
        {
          "beat": 2.0,
          "string": 2,
          "fret": 17,
          "duration": "quarter",
          "dotted": false,
          "techniques": [{"type": "bend", "value": 0.5}],
          "tie": "start",
          "tuplet": null,
          "grace": false
        }
      ],
      "warnings": []
    }
  ]
}
```

Notes:
- `string` is an integer (1 = highest string, 6 = lowest) in JSON only. The ASCII tab and LLM text always display string names (e, B, G, D, A, E) resolved from the `tuning` array. Users never see numbers.
- `time_signature` is present on every bar (not just on changes) so any bar can be read independently.
- Rest-only bars are included with `"is_rest": true` and empty notes array.
- `sections` at top level are derived from GP rehearsal marks. Also denoted per-bar via `section` field on the first bar of each section.

### 3. LLM-Optimized Text (`tab.llm.txt`)

Condensed, low-token format for feeding to Claude/Sonnet for lesson generation.

**Structure:**
```
SONG: Man Of Steel
ARTIST: Guthrie Govan
TUNING: E A D G B e
TEMPO: 128 BPM
TIME: 4/4
BARS: 56

=== BAR 1-3 === REST

=== BAR 4 ===
1.0   B:15   8th
1.5   B:17   8th
2.0   B:17   quarter  bend(1/2)  tie>
3.0   B:17   8th  bend(1/2)  <tie>
3.5   B:17   8th  bend(1/2)  <tie
4.0   G:14   8th  hammer
4.5   G:16   16th  pull
4.75  G:14   16th

=== BAR 5 ===
1.0   G:13   half
3.0   G:13   8th  hammer
3.5   G:14   8th  hammer
4.0   G:16   8th
4.5   D:14   8th
```

**Rules:**
- Consecutive rest bars collapsed (e.g. `BAR 1-3 === REST`)
- Beat position as first column
- `String:Fret` as second column (string resolved to name, e.g. B:15, not 2:15)
- Duration as third column
- Techniques and ties as trailing keywords
- Tuplets marked with `triplet` keyword
- Section headers included when present: `=== BAR 4 === [Opening Theme]`

**Token budget target:** A 56-bar solo should produce under 500 lines / ~3000 tokens, keeping it cheap to feed to Sonnet for lesson generation.

## Parser Details

### GP3/GP4/GP5 (binary format)
- Use `pyguitarpro` library
- Map pyguitarpro's data structures to our Song model
- Handle: notes, bends (with amounts), hammer/pull, slides, vibrato, ties, tuplets, grace notes

### GP6/GP7/GP8 (ZIP+XML format)
- Extract `Content/score.gpif` from ZIP
- Parse XML using `xml.etree.ElementTree` (stdlib)
- Resolve ID-based cross-references:
  - `<MasterBars>` — bar order, time signatures, key signatures
  - `<Bars>` — voice assignments per bar
  - `<Beats>` — rhythm and note IDs per beat
  - `<Notes>` — fret, string, technique data
  - `<Rhythms>` — duration definitions
- Map internal string IDs to string names using tuning data from `<Tracks>`

### Tricky areas (where parsing bugs hide)
- **Bend amounts:** GP7/8 stores bends as curves with control points. Extract peak value, convert from GP's internal unit (100 = half step) to intervals (0.5, 1.0, 1.5, 2.0)
- **Ties:** Track `tie_origin` and `tie_destination` flags per note to build tie chains
- **Tuplets:** Read `PrimaryTuplet` and `AugmentationDot` to calculate actual beat positions
- **Grace notes:** Have duration but don't count toward bar beat total
- **Multi-voice bars:** Merge voices into a single note timeline, ordered by beat position
- **String numbering:** GP uses 0-indexed internal IDs. Map using the track's tuning definition.

### Validation
After parsing each bar, verify that note durations sum to the time signature. Exceptions: the first and last bars may be partial (pickup bars / anacrusis) — mark these as `is_partial: true` rather than generating a warning. For all other bars, if durations don't sum correctly, include the bar in output but add a warning:
- In `tab.txt`: `[!] WARNING: Bar 14 — durations sum to 4.5 beats (expected 4.0)`
- In `tab.json`: `"warnings": ["durations sum to 4.5 beats (expected 4.0)"]`
- In `tab.llm.txt`: `=== BAR 14 === WARNING: duration mismatch (4.5 vs 4.0)`

## CLI Interface

```bash
# Basic usage — outputs tab.txt, tab.json, tab.llm.txt next to input file
python cli.py "Guthrie Hans.gp"

# Specify output directory
python cli.py "Guthrie Hans.gp" -o songs/guthrie-govan/man-of-steel/

# Custom line width for ASCII tab
python cli.py "Guthrie Hans.gp" --width 140

# Select specific track (for multi-track files)
python cli.py "Guthrie Hans.gp" --track 1

# Parse and validate only, don't write files
python cli.py "Guthrie Hans.gp" --dry-run

# Output only specific formats
python cli.py "Guthrie Hans.gp" --format tab,json
```

**Multi-track handling:** If a GP file has multiple tracks, list them and default to track 1:
```
Found 3 tracks:
  1. od.guit. (electric guitar)
  2. rhythm gtr (electric guitar)
  3. bass (bass guitar)
Using track 1. Use --track N to select a different track.
```

**Output summary:**
```
Parsed: Man Of Steel — Guthrie Govan
Format: GP8 (ZIP+XML)
Track:  od.guit. (Track 1)
Bars:   56  |  Tempo: 128 BPM  |  Tuning: Standard
Notes:  ~430  |  Warnings: 0

Written:
  -> tab.txt      (ASCII tab, 120 char width)
  -> tab.json     (structured data, 56 bars)
  -> tab.llm.txt  (LLM-optimized, 287 lines)
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unsupported format (e.g. .mid, .musicxml) | Error message listing supported formats |
| File not found / corrupted ZIP | Clear error, exit |
| Bar duration mismatch | Output with warning annotation in all 3 files |
| Bend with no amount data | Default to full step (1.0), add warning |
| Unknown technique in GP XML | Skip it, add warning noting what was skipped |
| Multi-track file, no --track flag | List tracks, default to track 1 |

## Dependencies

- Python 3.8+
- `pyguitarpro` — for GP3/4/5 binary format parsing
- Standard library only for GP6/7/8 (`zipfile`, `xml.etree.ElementTree`, `json`, `argparse`)

## Future Extensions (not in scope now)

- Web API wrapper (Flask/FastAPI) for Vercel deployment
- Lesson plan generator that consumes `tab.json`
- PDF tab rendering
- Diff tool to compare two transcriptions
