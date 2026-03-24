# Guitar Teacher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local CLI tool that analyzes Guitar Pro files and generates lesson plans, with an interactive music theory reference and optional LLM enhancement.

**Architecture:** Engine + data files. Python engine reads music theory from YAML knowledge base. gp2tab parser (existing) provides note-level data from GP files. Jinja2 templates generate lesson markdown. Optional LLM post-processor enriches prose.

**Tech Stack:** Python 3.11+, Click (CLI), Jinja2 (templates), PyYAML, gp2tab (local dependency), anthropic/openai/ollama (optional)

**Spec:** `docs/superpowers/specs/2026-03-24-guitar-teacher-design.md`

**Existing reference:** `songs/guthrie-govan/man-of-steel/` has AI-generated lessons showing the target output format.

---

## File Map

```
guitar-teacher/                         # NEW — top-level project directory
├── pyproject.toml                      # Package config, dependencies, entry point
├── guitar_teacher/
│   ├── __init__.py
│   ├── cli.py                          # Click CLI with subcommands
│   ├── config.py                       # Config loading from ~/.guitar-teacher/config.yaml
│   ├── core/
│   │   ├── __init__.py
│   │   ├── note_utils.py              # Pitch math: fret→note, pitch classes, intervals
│   │   ├── models.py                  # All dataclasses (Scale, Chord, BarAnalysis, etc.)
│   │   ├── theory.py                  # TheoryEngine: loads YAML, scale/chord/key operations
│   │   ├── fretboard.py              # ASCII fretboard renderer
│   │   └── analyzer.py               # Solo analysis pipeline (gp2tab Song → SoloAnalysis)
│   ├── lessons/
│   │   ├── __init__.py
│   │   ├── generator.py              # SoloAnalysis → lesson markdown files
│   │   └── templates.py              # Jinja2 template loader and renderer
│   └── llm/
│       ├── __init__.py
│       ├── enhancer.py               # Post-process lessons via LLM
│       └── providers.py              # Provider abstraction (Claude, OpenAI, Ollama)
├── theory/                            # Knowledge base (YAML data files)
│   ├── scales.yaml
│   ├── chords.yaml
│   ├── intervals.yaml
│   ├── techniques.yaml
│   └── lesson_templates/
│       ├── section_lesson.md.j2
│       ├── technique_intro.md.j2
│       ├── assembly_lesson.md.j2
│       ├── theory_overview.md.j2
│       ├── breakdown.md.j2
│       ├── practice_plan.md.j2
│       └── performance_lesson.md.j2
└── tests/
    ├── __init__.py
    ├── conftest.py                # Shared fixtures: REPO_ROOT, STANDARD_TUNING, engine, MOS paths
    ├── test_note_utils.py
    ├── test_theory.py
    ├── test_fretboard.py
    ├── test_analyzer.py
    ├── test_generator.py
    ├── test_providers.py          # Mocked LLM provider tests
    └── test_cli.py
```

Also modifying:
- `gp2tab/pyproject.toml` — NEW, to make gp2tab pip-installable

---

## Task 1: Project Scaffolding & gp2tab Packaging

**Files:**
- Create: `guitar-teacher/pyproject.toml`
- Create: `guitar-teacher/guitar_teacher/__init__.py`
- Create: `guitar-teacher/guitar_teacher/core/__init__.py`
- Create: `guitar-teacher/guitar_teacher/lessons/__init__.py`
- Create: `guitar-teacher/guitar_teacher/llm/__init__.py`
- Create: `guitar-teacher/tests/__init__.py`
- Create: `gp2tab/pyproject.toml`

- [ ] **Step 1: Create gp2tab pyproject.toml**

gp2tab currently has no packaging config. Add one so it can be pip-installed:

```toml
[project]
name = "gp2tab"
version = "0.1.0"
description = "Convert Guitar Pro files to ASCII tab, JSON, and LLM-optimized formats"
requires-python = ">=3.11"
dependencies = ["pyguitarpro>=0.9"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.backends._legacy:_Backend"

[tool.setuptools]
packages = ["gp2tab"]
py-modules = ["cli"]
```

Note: `cli.py` lives at the gp2tab project root alongside the `gp2tab/` package. We include it as a `py-module` so it's importable. The existing `gp2tab` CLI entry point (`python -m gp2tab`) still works via `__main__.py`.

File: `gp2tab/pyproject.toml`

- [ ] **Step 2: Create guitar-teacher pyproject.toml**

```toml
[project]
name = "guitar-teacher"
version = "0.1.0"
description = "Local guitar learning tool — theory analysis, lesson generation, fretboard reference"
requires-python = ">=3.11"
dependencies = [
    "click>=8.0",
    "jinja2>=3.0",
    "pyyaml>=6.0",
]

[project.optional-dependencies]
llm = ["anthropic>=0.40", "openai>=1.0", "httpx>=0.27"]

[project.scripts]
guitar-teacher = "guitar_teacher.cli:main"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.backends._legacy:_Backend"

[tool.setuptools.packages.find]
where = ["."]
include = ["guitar_teacher*"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

File: `guitar-teacher/pyproject.toml`

- [ ] **Step 3: Create all __init__.py files**

All empty files:
- `guitar-teacher/guitar_teacher/__init__.py`
- `guitar-teacher/guitar_teacher/core/__init__.py`
- `guitar-teacher/guitar_teacher/lessons/__init__.py`
- `guitar-teacher/guitar_teacher/llm/__init__.py`
- `guitar-teacher/tests/__init__.py`

- [ ] **Step 4: Install both packages in editable mode**

Run:
```bash
cd /Users/leo/hobby/tab
pip install -e ./gp2tab
pip install -e ./guitar-teacher
```

Expected: Both install successfully. Verify with:
```bash
python -c "from gp2tab.parser import parse; print('gp2tab OK')"
python -c "import guitar_teacher; print('guitar-teacher OK')"
```

- [ ] **Step 5: Commit**

```bash
git add gp2tab/pyproject.toml guitar-teacher/
git commit -m "feat: scaffold guitar-teacher project with gp2tab packaging"
```

---

## Task 2: Note Utilities (`note_utils.py`)

**Files:**
- Create: `guitar-teacher/guitar_teacher/core/note_utils.py`
- Create: `guitar-teacher/tests/test_note_utils.py`

- [ ] **Step 1: Create shared test fixtures**

File: `guitar-teacher/tests/conftest.py`

```python
import os
import pytest

REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"]

MOS_JSON = os.path.join(REPO_ROOT, "songs", "guthrie-govan", "man-of-steel", "tab.json")
MOS_GP = os.path.join(REPO_ROOT, "songs", "guthrie-govan", "man-of-steel", "Guthrie Hans.gp")
THEORY_DIR = os.path.join(os.path.dirname(__file__), "..", "theory")


@pytest.fixture
def engine():
    from guitar_teacher.core.theory import TheoryEngine
    return TheoryEngine(THEORY_DIR)
```

- [ ] **Step 2: Write failing tests for pitch class conversions**

File: `guitar-teacher/tests/test_note_utils.py`

```python
from guitar_teacher.core.note_utils import (
    note_to_pitch_class,
    pitch_class_to_name,
    fret_to_pitch_class,
    fret_to_note,
    interval_semitones,
)

from tests.conftest import STANDARD_TUNING


class TestNoteToPitchClass:
    def test_naturals(self):
        assert note_to_pitch_class("C") == 0
        assert note_to_pitch_class("D") == 2
        assert note_to_pitch_class("E") == 4
        assert note_to_pitch_class("F") == 5
        assert note_to_pitch_class("G") == 7
        assert note_to_pitch_class("A") == 9
        assert note_to_pitch_class("B") == 11

    def test_sharps(self):
        assert note_to_pitch_class("C#") == 1
        assert note_to_pitch_class("F#") == 6

    def test_flats(self):
        assert note_to_pitch_class("Db") == 1
        assert note_to_pitch_class("Bb") == 10

    def test_enharmonic_equivalence(self):
        assert note_to_pitch_class("C#") == note_to_pitch_class("Db")
        assert note_to_pitch_class("G#") == note_to_pitch_class("Ab")

    def test_case_insensitive(self):
        assert note_to_pitch_class("c") == 0
        assert note_to_pitch_class("bb") == 10
        assert note_to_pitch_class("f#") == 6


class TestPitchClassToName:
    def test_sharps_default(self):
        assert pitch_class_to_name(0) == "C"
        assert pitch_class_to_name(1) == "C#"
        assert pitch_class_to_name(6) == "F#"

    def test_flats(self):
        assert pitch_class_to_name(1, prefer_flats=True) == "Db"
        assert pitch_class_to_name(10, prefer_flats=True) == "Bb"

    def test_naturals_same_either_way(self):
        assert pitch_class_to_name(0) == pitch_class_to_name(0, prefer_flats=True)
        assert pitch_class_to_name(4) == pitch_class_to_name(4, prefer_flats=True)


class TestFretToPitchClass:
    def test_open_strings_standard(self):
        # String 6 (low E) open = E = 4
        assert fret_to_pitch_class(6, 0, STANDARD_TUNING) == 4
        # String 1 (high E) open = E = 4
        assert fret_to_pitch_class(1, 0, STANDARD_TUNING) == 4
        # String 5 (A) open = A = 9
        assert fret_to_pitch_class(5, 0, STANDARD_TUNING) == 9

    def test_fretted_notes(self):
        # String 2 (B) fret 15 = Db/C# = 1 (B=11, +15=26, %12=2... wait)
        # B=11, 11+15=26, 26%12=2 = D
        assert fret_to_pitch_class(2, 15, STANDARD_TUNING) == 2  # D
        # String 3 (G) fret 14 = A = 9  (G=7, 7+14=21, 21%12=9)
        assert fret_to_pitch_class(3, 14, STANDARD_TUNING) == 9  # A


class TestFretToNote:
    def test_basic(self):
        # String 6, fret 0 = E
        assert fret_to_note(6, 0, STANDARD_TUNING) == "E"
        # String 2, fret 15 = D
        assert fret_to_note(2, 15, STANDARD_TUNING) == "D"

    def test_prefer_flats(self):
        # String 6, fret 1 = F (natural, same either way)
        assert fret_to_note(6, 1, STANDARD_TUNING) == "F"
        # String 6, fret 2 = F#/Gb
        assert fret_to_note(6, 2, STANDARD_TUNING) == "F#"
        assert fret_to_note(6, 2, STANDARD_TUNING, prefer_flats=True) == "Gb"


class TestIntervalSemitones:
    def test_unison(self):
        assert interval_semitones("C", "C") == 0

    def test_major_third(self):
        assert interval_semitones("C", "E") == 4

    def test_perfect_fifth(self):
        assert interval_semitones("C", "G") == 7

    def test_wraps_around(self):
        assert interval_semitones("A", "C") == 3

    def test_enharmonic(self):
        assert interval_semitones("C", "C#") == interval_semitones("C", "Db")
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_note_utils.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'guitar_teacher.core.note_utils'`

- [ ] **Step 4: Implement note_utils.py**

File: `guitar-teacher/guitar_teacher/core/note_utils.py`

```python
"""Pitch math utilities: note names, pitch classes, fret-to-note conversion."""

_SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
_FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

_NAME_TO_PC: dict[str, int] = {}
for i, name in enumerate(_SHARP_NAMES):
    _NAME_TO_PC[name] = i
    _NAME_TO_PC[name.lower()] = i
for i, name in enumerate(_FLAT_NAMES):
    _NAME_TO_PC[name] = i
    _NAME_TO_PC[name.lower()] = i


def note_to_pitch_class(name: str) -> int:
    """Parse note name to pitch class (0-11, C=0). Case-insensitive."""
    name = name.strip()
    if name not in _NAME_TO_PC:
        raise ValueError(f"Unknown note name: {name!r}")
    return _NAME_TO_PC[name]


def pitch_class_to_name(pc: int, prefer_flats: bool = False) -> str:
    """Convert pitch class (0-11) to note name."""
    pc = pc % 12
    return _FLAT_NAMES[pc] if prefer_flats else _SHARP_NAMES[pc]


def fret_to_pitch_class(string_num: int, fret: int, tuning: list[str]) -> int:
    """Convert (string number, fret) to pitch class using tuning.

    string_num: 1=highest pitch string, 6=lowest (standard guitar convention).
    tuning: list of note names low-to-high, e.g. ["E","A","D","G","B","E"].
    """
    open_note = tuning[len(tuning) - string_num]
    open_pc = note_to_pitch_class(open_note)
    return (open_pc + fret) % 12


def fret_to_note(
    string_num: int, fret: int, tuning: list[str], prefer_flats: bool = False
) -> str:
    """Convert (string, fret) to note name."""
    pc = fret_to_pitch_class(string_num, fret, tuning)
    return pitch_class_to_name(pc, prefer_flats)


def interval_semitones(note1: str, note2: str) -> int:
    """Semitone distance from note1 up to note2 (0-11)."""
    pc1 = note_to_pitch_class(note1)
    pc2 = note_to_pitch_class(note2)
    return (pc2 - pc1) % 12
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_note_utils.py -v`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add guitar-teacher/guitar_teacher/core/note_utils.py guitar-teacher/tests/test_note_utils.py guitar-teacher/tests/conftest.py
git commit -m "feat: add note_utils with pitch class math and fret-to-note conversion"
```

---

## Task 3: Models (`models.py`)

**Files:**
- Create: `guitar-teacher/guitar_teacher/core/models.py`

No tests needed — these are pure dataclasses with no logic.

- [ ] **Step 1: Create models.py with all dataclasses**

File: `guitar-teacher/guitar_teacher/core/models.py`

```python
"""Data models for guitar-teacher."""
from dataclasses import dataclass, field


# === Theory Models ===

@dataclass
class Scale:
    """A scale type loaded from scales.yaml."""
    key: str                          # e.g. "dorian"
    name: str                         # e.g. "Dorian"
    aliases: list[str]
    category: str                     # "mode", "pentatonic", "other"
    intervals: list[int]              # step pattern, e.g. [2,1,2,2,2,1,2]
    character: str
    common_in: list[str]
    chord_fit: list[str]
    teaching_note: str
    improvisation_tip: str
    parent_scale: str | None = None
    parent_degree: int | None = None


@dataclass
class Chord:
    """A chord type loaded from chords.yaml."""
    key: str                          # e.g. "m7"
    name: str                         # e.g. "Minor 7th"
    symbol: str                       # e.g. "m7"
    aliases: list[str]
    intervals: list[int]              # semitones from root, e.g. [0,3,7,10]
    character: str
    common_voicings: dict | None = None


@dataclass
class Interval:
    """An interval loaded from intervals.yaml."""
    semitones: int
    name: str                         # e.g. "Major 3rd"
    short_name: str                   # e.g. "M3"
    quality: str                      # "perfect", "major", "minor", "augmented", "diminished"


@dataclass
class TechniqueVariant:
    name: str
    semitones: int | None = None
    notation: str | None = None


@dataclass
class Technique:
    """A technique loaded from techniques.yaml."""
    key: str                          # e.g. "bend"
    name: str                         # e.g. "Bending"
    difficulty: int                   # 1-10
    description: str
    variants: list[TechniqueVariant]
    teaching_template: str
    common_mistakes: list[str]


# === Key Detection Models ===

@dataclass
class KeyMatch:
    """Result of key detection."""
    root: str                         # e.g. "D"
    scale: Scale
    score: float                      # match score (higher = better)
    notes_matched: int
    total_notes: int
    outside_notes: list[str]


# === Analysis Models ===

@dataclass
class NoteAnalysis:
    """Analysis of a single note."""
    string: int
    fret: int
    beat: float
    duration: str
    pitch: str                        # note name, e.g. "D"
    pitch_class: int
    scale_degree: str | None          # e.g. "1", "b3", "5"
    techniques: list[str]             # technique type strings from gp2tab


@dataclass
class BarAnalysis:
    """Analysis of a single bar."""
    bar_number: int
    notes: list[NoteAnalysis]
    detected_scale: str               # e.g. "D Aeolian"
    techniques: list[str]             # unique techniques in this bar
    note_density: int                 # total note count
    difficulty_score: float           # 1.0-10.0
    melodic_patterns: list[str]       # e.g. ["ascending_run", "chromatic"]
    outside_notes: list[str]          # non-diatonic pitch names


@dataclass
class SectionAnalysis:
    """Analysis of a grouped section of bars."""
    name: str                         # e.g. "Section A — Opening Theme"
    bars: list[BarAnalysis]
    bar_range: tuple[int, int]        # (start, end) inclusive
    overall_scale: str
    primary_techniques: list[str]
    difficulty: float                 # average of bar difficulties
    practice_priority: int            # 1 = learn first


@dataclass
class SoloAnalysis:
    """Complete analysis of a solo."""
    title: str
    artist: str
    key: str                          # derived by key detection
    tempo: int
    tuning: list[str]
    sections: list[SectionAnalysis]
    practice_order: list[str]         # section names in recommended learning order
    technique_summary: dict[str, list[int]]  # technique → list of bar numbers
    scale_summary: dict[str, list[int]]      # scale → list of bar numbers


# === Lesson Template Context Models ===

@dataclass
class LessonStep:
    title: str
    body: str
    instruction: str
    listen_for: str
    repeat_instruction: str
    tab_excerpt: str | None = None


@dataclass
class WarmupExercise:
    description: str
    source_lesson: str | None = None


@dataclass
class ConceptContext:
    name: str
    teaching_note: str
    improvisation_tip: str | None = None
    root: str | None = None
    notes: list[str] | None = None


@dataclass
class LessonContext:
    lesson_number: int
    section_name: str
    bar_start: int
    bar_end: int
    phase: str
    prerequisites: str
    estimated_time: int
    target_tempo_pct: int
    target_tempo_bpm: int
    goal_techniques: str
    warmup_exercises: list[WarmupExercise]
    primary_concept: ConceptContext
    primary_scale: ConceptContext | None
    steps: list[LessonStep]
    improvisation_suggestions: str | None
    checkpoints: list[str]
    next_lesson: int | None
```

- [ ] **Step 2: Verify import works**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -c "from guitar_teacher.core.models import Scale, SoloAnalysis, LessonContext; print('Models OK')"`
Expected: `Models OK`

- [ ] **Step 3: Commit**

```bash
git add guitar-teacher/guitar_teacher/core/models.py
git commit -m "feat: add all data models for theory, analysis, and lesson context"
```

---

## Task 4: Theory YAML Knowledge Base

**Files:**
- Create: `guitar-teacher/theory/scales.yaml`
- Create: `guitar-teacher/theory/chords.yaml`
- Create: `guitar-teacher/theory/intervals.yaml`
- Create: `guitar-teacher/theory/techniques.yaml`

These are data files, not code. No tests for the data itself — the TheoryEngine tests (Task 5) will validate loading.

- [ ] **Step 1: Create scales.yaml**

File: `guitar-teacher/theory/scales.yaml`

Must include all 7 modes of the major scale, harmonic minor + its modes, melodic minor, pentatonic minor/major, blues scale, chromatic, whole tone, diminished (whole-half and half-whole). Each entry follows the format from the spec (name, aliases, category, parent_scale, parent_degree, intervals, character, common_in, chord_fit, teaching_note, improvisation_tip).

Minimum required entries (21 scales):
- `major` (Ionian)
- `dorian`
- `phrygian`
- `lydian`
- `mixolydian`
- `natural_minor` (Aeolian)
- `locrian`
- `harmonic_minor`
- `melodic_minor`
- `pentatonic_major`
- `pentatonic_minor`
- `blues`
- `chromatic`
- `whole_tone`
- `diminished_whole_half`
- `diminished_half_whole`
- `phrygian_dominant`
- `lydian_dominant`
- `super_locrian` (altered scale)
- `hungarian_minor`
- `japanese` (hirajoshi)

- [ ] **Step 2: Create chords.yaml**

File: `guitar-teacher/theory/chords.yaml`

Must include common chord types with formulas and CAGED voicings. Each entry: name, symbol, aliases, intervals (semitones from root), character, common_voicings (with frets and root_string).

Minimum required entries (~25 chords):
- `major`, `minor`, `diminished`, `augmented`
- `sus2`, `sus4`
- `major7`, `dominant7`, `minor7`, `minor7b5` (half-dim), `diminished7`
- `add9`, `major9`, `dominant9`, `minor9`
- `dominant7sharp9` (Hendrix chord)
- `6`, `minor6`
- `power5` (power chord)
- `augmented7`, `minor_major7`
- `dominant11`, `dominant13`

Voicings: provide E-shape and A-shape barre forms at minimum (relative frets from root). Open chord voicings for the most common chords (C, A, G, E, D shapes).

- [ ] **Step 3: Create intervals.yaml**

File: `guitar-teacher/theory/intervals.yaml`

```yaml
# Intervals — semitone count, name, short name, quality
intervals:
  - {semitones: 0, name: "Unison", short_name: "P1", quality: "perfect"}
  - {semitones: 1, name: "Minor 2nd", short_name: "m2", quality: "minor"}
  - {semitones: 2, name: "Major 2nd", short_name: "M2", quality: "major"}
  - {semitones: 3, name: "Minor 3rd", short_name: "m3", quality: "minor"}
  - {semitones: 4, name: "Major 3rd", short_name: "M3", quality: "major"}
  - {semitones: 5, name: "Perfect 4th", short_name: "P4", quality: "perfect"}
  - {semitones: 6, name: "Tritone", short_name: "TT", quality: "augmented"}
  - {semitones: 7, name: "Perfect 5th", short_name: "P5", quality: "perfect"}
  - {semitones: 8, name: "Minor 6th", short_name: "m6", quality: "minor"}
  - {semitones: 9, name: "Major 6th", short_name: "M6", quality: "major"}
  - {semitones: 10, name: "Minor 7th", short_name: "m7", quality: "minor"}
  - {semitones: 11, name: "Major 7th", short_name: "M7", quality: "major"}
```

- [ ] **Step 4: Create techniques.yaml**

File: `guitar-teacher/theory/techniques.yaml`

Must include all techniques from the gp2tab mapping table in the spec. Each entry: name, difficulty (1-10), description, variants, teaching_template (Jinja2 syntax), common_mistakes.

Required entries: `bend`, `bend_release`, `pre_bend`, `pre_bend_release`, `vibrato`, `hammer_on`, `pull_off`, `slide`, `tapping`, `harmonic`, `palm_mute`, `let_ring`, `staccato`, `dead_note`.

Also include a `gp2tab_mapping` top-level key that maps gp2tab type strings to technique keys:

```yaml
gp2tab_mapping:
  bend: bend
  bend_release: bend_release
  pre_bend: pre_bend
  pre_bend_release: pre_bend_release
  vibrato: vibrato
  hammer: hammer_on
  pull: pull_off
  slide_up: slide
  slide_down: slide
  tap: tapping
  harmonic: harmonic
  palm_mute: palm_mute
  let_ring: let_ring
  staccato: staccato
  dead_note: dead_note
```

- [ ] **Step 5: Commit**

```bash
git add guitar-teacher/theory/
git commit -m "feat: add theory knowledge base — scales, chords, intervals, techniques YAML"
```

---

## Task 5: Theory Engine (`theory.py`)

**Files:**
- Create: `guitar-teacher/guitar_teacher/core/theory.py`
- Create: `guitar-teacher/tests/test_theory.py`

- [ ] **Step 1: Write failing tests for YAML loading and scale operations**

File: `guitar-teacher/tests/test_theory.py`

```python
import pytest
from guitar_teacher.core.theory import TheoryEngine


# Uses `engine` fixture from conftest.py

class TestYAMLLoading:
    def test_loads_scales(self, engine):
        assert len(engine.scales) > 0
        assert "major" in engine.scales
        assert "dorian" in engine.scales

    def test_loads_chords(self, engine):
        assert len(engine.chords) > 0
        assert "major" in engine.chords
        assert "m7" in engine.chords

    def test_loads_intervals(self, engine):
        assert len(engine.intervals) == 12

    def test_loads_techniques(self, engine):
        assert len(engine.techniques) > 0
        assert "bend" in engine.techniques

    def test_scale_aliases(self, engine):
        # "minor" is an alias for "natural_minor"
        scale = engine.get_scale("C", "minor")
        assert scale is not None
        assert "Aeolian" in scale.name or "Minor" in scale.name


class TestGetScale:
    def test_c_major(self, engine):
        result = engine.get_scale("C", "major")
        assert result is not None
        assert result.notes == ["C", "D", "E", "F", "G", "A", "B"]

    def test_d_dorian(self, engine):
        result = engine.get_scale("D", "dorian")
        assert result is not None
        assert result.notes == ["D", "E", "F", "G", "A", "B", "C"]

    def test_a_natural_minor(self, engine):
        result = engine.get_scale("A", "natural_minor")
        assert result is not None
        assert result.notes == ["A", "B", "C", "D", "E", "F", "G"]

    def test_f_sharp_key_uses_sharps(self, engine):
        result = engine.get_scale("F#", "major")
        assert result is not None
        # F# major: F# G# A# B C# D# E#... but E# = F in practice
        # All accidentals should be sharps
        for note in result.notes:
            assert "b" not in note  # no flats

    def test_bb_key_uses_flats(self, engine):
        result = engine.get_scale("Bb", "major")
        assert result is not None
        # Bb major: Bb C D Eb F G A
        assert "Eb" in result.notes
        assert "D#" not in result.notes

    def test_unknown_scale_returns_none(self, engine):
        result = engine.get_scale("C", "nonexistent_scale")
        assert result is None


class TestGetChord:
    def test_c_major(self, engine):
        result = engine.get_chord("C", "major")
        assert result is not None
        assert result.notes == ["C", "E", "G"]

    def test_am7(self, engine):
        result = engine.get_chord("A", "m7")
        assert result is not None
        assert result.notes == ["A", "C", "E", "G"]

    def test_unknown_chord_returns_none(self, engine):
        result = engine.get_chord("C", "nonexistent")
        assert result is None


class TestDetectKey:
    def test_c_major_notes(self, engine):
        notes = ["C", "D", "E", "F", "G", "A", "B"]
        matches = engine.detect_key(notes)
        assert len(matches) > 0
        # Top match should be C major or A minor (relative)
        top = matches[0]
        assert top.root in ("C", "A")

    def test_d_minor_notes(self, engine):
        notes = ["D", "E", "F", "G", "A", "Bb", "C"]
        matches = engine.detect_key(notes)
        top = matches[0]
        assert top.root == "D"

    def test_handles_chromatic_notes(self, engine):
        # Mostly D minor with a chromatic C#
        notes = ["D", "E", "F", "G", "A", "Bb", "C", "C#"]
        matches = engine.detect_key(notes)
        top = matches[0]
        assert top.root == "D"
        assert "C#" in top.outside_notes


class TestChordsInKey:
    def test_c_major_diatonic(self, engine):
        chords = engine.chords_in_key("C", "major")
        assert len(chords) == 7
        # I ii iii IV V vi vii°
        symbols = [c.symbol for c in chords]
        assert symbols[0] == ""      # C major
        assert "m" in symbols[1]     # Dm
        assert "m" in symbols[2]     # Em

    def test_returns_empty_for_unknown(self, engine):
        chords = engine.chords_in_key("C", "nonexistent")
        assert chords == []


class TestSuggestScales:
    def test_dm7_g7_cmaj7(self, engine):
        suggestions = engine.suggest_scales(["Dm7", "G7", "Cmaj7"])
        assert len(suggestions) > 0
        # Should suggest C major / D Dorian / G Mixolydian
        scale_names = [s.name for s in suggestions]
        assert any("Major" in n or "Ionian" in n for n in scale_names)

    def test_single_minor_chord(self, engine):
        suggestions = engine.suggest_scales(["Am"])
        assert len(suggestions) > 0


class TestIntervalBetween:
    def test_major_third(self, engine):
        result = engine.interval_between("C", "E")
        assert result.semitones == 4
        assert "Major 3rd" in result.name

    def test_perfect_fifth(self, engine):
        result = engine.interval_between("C", "G")
        assert result.semitones == 7
        assert "5th" in result.name


class TestScaleDegree:
    def test_root(self, engine):
        c_major = engine.get_scale("C", "major")
        assert engine.note_to_scale_degree("C", root="C", scale=c_major) == "1"

    def test_flat_third(self, engine):
        d_minor = engine.get_scale("D", "natural_minor")
        assert engine.note_to_scale_degree("F", root="D", scale=d_minor) == "b3"

    def test_fifth(self, engine):
        c_major = engine.get_scale("C", "major")
        assert engine.note_to_scale_degree("G", root="C", scale=c_major) == "5"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_theory.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement TheoryEngine**

File: `guitar-teacher/guitar_teacher/core/theory.py`

The `TheoryEngine` class:
- `__init__(self, theory_dir: str)`: loads all YAML files, builds lookup dicts (including alias resolution for scales and chords)
- `get_scale(self, root: str, scale_type: str) -> ScaleResult | None`: looks up scale by name or alias, computes notes from root + interval pattern. Returns a `ScaleResult` (a dataclass with the `Scale` metadata plus computed `notes` and `root`). Uses `note_utils` to determine sharp/flat preference based on root.
- `detect_key(self, notes: list[str]) -> list[KeyMatch]`: iterates all 12 roots x all scales, scores each, returns top matches sorted by score. Scoring: `matched_notes / total_notes - 0.1 * missing_scale_notes`. Heuristics: +0.1 bonus if root is first note, +0.05 if root is most frequent.
- `get_chord(self, root: str, chord_type: str) -> ChordResult | None`: like get_scale but for chords. Computes `notes` from root + semitone intervals.
- `chords_in_key(self, root: str, scale_type: str) -> list[ChordResult]`: builds triads on each degree of the scale, matches against chord types in `chords.yaml`.
- `suggest_scales(self, chords: list[str]) -> list[ScaleSuggestion]`: parses chord names (e.g. "Dm7" → root=D, type=m7), collects all notes from all chords, runs `detect_key`.
- `interval_between(self, note1: str, note2: str) -> Interval`: computes semitone distance, looks up in `intervals.yaml`.
- `note_to_scale_degree(self, note: str, root: str, scale: Scale) -> str`: computes the degree label (1, b2, 2, b3, 3, 4, b5, 5, b6, 6, b7, 7) based on semitone distance from root, compared against major scale reference.

Helper dataclasses (add to the same file or models.py):

```python
@dataclass
class ScaleResult:
    """A scale instantiated at a specific root."""
    scale: Scale        # the scale definition
    root: str
    notes: list[str]    # computed note names

@dataclass
class ChordResult:
    """A chord instantiated at a specific root."""
    chord: Chord
    root: str
    symbol: str         # e.g. "Dm7"
    notes: list[str]

@dataclass
class ScaleSuggestion:
    """A scale suggested for a chord progression."""
    root: str
    name: str
    notes: list[str]
    score: float
```

Key implementation detail for sharp/flat logic: use a lookup dict:
```python
_SHARP_KEYS = {"C", "G", "D", "A", "E", "B", "F#", "C#"}
_FLAT_KEYS = {"F", "Bb", "Eb", "Ab", "Db", "Gb"}

def _prefer_flats(root: str) -> bool:
    pc = note_to_pitch_class(root)
    root_sharp = pitch_class_to_name(pc, prefer_flats=False)
    root_flat = pitch_class_to_name(pc, prefer_flats=True)
    return root_flat in _FLAT_KEYS
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_theory.py -v`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add guitar-teacher/guitar_teacher/core/theory.py guitar-teacher/tests/test_theory.py
git commit -m "feat: add TheoryEngine with scale/chord/key detection from YAML knowledge base"
```

---

## Task 6: Fretboard Visualizer (`fretboard.py`)

**Files:**
- Create: `guitar-teacher/guitar_teacher/core/fretboard.py`
- Create: `guitar-teacher/tests/test_fretboard.py`

- [ ] **Step 1: Write failing tests**

File: `guitar-teacher/tests/test_fretboard.py`

```python
from guitar_teacher.core.fretboard import render_fretboard

STANDARD_TUNING = ["E", "A", "D", "G", "B", "E"]


class TestRenderFretboard:
    def test_returns_string(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
        )
        assert isinstance(result, str)
        assert len(result) > 0

    def test_contains_string_labels(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
        )
        assert "E" in result  # at least the string name E appears

    def test_contains_fret_numbers(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
            fret_range=(0, 12),
        )
        # Should have fret numbers in the header
        assert "0" in result
        assert "12" in result

    def test_highlights_root(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
            root="C",
        )
        # Root should be marked differently (R vs dot)
        assert "R" in result

    def test_custom_fret_range(self):
        result = render_fretboard(
            notes=["D", "E", "F", "G", "A", "B", "C"],
            tuning=STANDARD_TUNING,
            fret_range=(5, 12),
        )
        assert "5" in result
        assert "12" in result

    def test_title_shown(self):
        result = render_fretboard(
            notes=["C", "E", "G"],
            tuning=STANDARD_TUNING,
            title="C Major Triad",
        )
        assert "C Major Triad" in result

    def test_chord_diagram(self):
        # Chord diagram: specific fret per string, not a scale spread
        from guitar_teacher.core.fretboard import render_chord_diagram
        result = render_chord_diagram(
            frets=[None, None, 0, 2, 3, 2],  # D major open
            tuning=STANDARD_TUNING,
            title="D Major",
        )
        assert isinstance(result, str)
        assert "D Major" in result
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_fretboard.py -v`
Expected: FAIL

- [ ] **Step 3: Implement fretboard.py**

File: `guitar-teacher/guitar_teacher/core/fretboard.py`

Two main functions:

`render_fretboard(notes, tuning, root=None, fret_range=(0, 15), title=None) -> str`:
- For each string and each fret in range, compute the note at that position using `note_utils.fret_to_pitch_class`
- If the note's pitch class matches any note in the input list, mark it
- Use `R` for root, `*` for other scale/chord tones, `-` for empty frets
- Format as ASCII grid with fret numbers on top and string names on left
- Show note names to the right of each string line

`render_chord_diagram(frets, tuning, title=None) -> str`:
- Takes a list of 6 fret numbers (None = muted, 0 = open, N = fretted)
- Renders a vertical chord box diagram (standard chord chart style)
- Shows X for muted strings, O for open, dot for fretted

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_fretboard.py -v`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add guitar-teacher/guitar_teacher/core/fretboard.py guitar-teacher/tests/test_fretboard.py
git commit -m "feat: add ASCII fretboard renderer for scales, notes, and chord diagrams"
```

---

## Task 7: CLI — Theory Reference Commands

**Files:**
- Create: `guitar-teacher/guitar_teacher/cli.py`
- Create: `guitar-teacher/guitar_teacher/config.py`
- Create: `guitar-teacher/tests/test_cli.py`

- [ ] **Step 1: Write failing tests for CLI commands**

File: `guitar-teacher/tests/test_cli.py`

```python
import os
import pytest
from click.testing import CliRunner
from guitar_teacher.cli import cli
from tests.conftest import MOS_JSON


@pytest.fixture
def runner():
    return CliRunner()


class TestScaleCommand:
    def test_d_dorian(self, runner):
        result = runner.invoke(cli, ["scale", "D", "dorian"])
        assert result.exit_code == 0
        assert "Dorian" in result.output
        assert "D" in result.output

    def test_unknown_scale(self, runner):
        result = runner.invoke(cli, ["scale", "C", "nonexistent"])
        assert result.exit_code != 0 or "not found" in result.output.lower()


class TestChordCommand:
    def test_am7(self, runner):
        result = runner.invoke(cli, ["chord", "Am7"])
        assert result.exit_code == 0
        assert "Minor 7th" in result.output or "m7" in result.output

    def test_c_major(self, runner):
        result = runner.invoke(cli, ["chord", "C"])
        assert result.exit_code == 0


class TestKeyCommand:
    def test_c_major(self, runner):
        result = runner.invoke(cli, ["key", "C", "major"])
        assert result.exit_code == 0
        # Should list 7 chords
        assert "Dm" in result.output or "ii" in result.output


class TestIdentifyKeyCommand:
    def test_basic(self, runner):
        result = runner.invoke(cli, ["identify-key", "D", "E", "F", "G", "A", "Bb", "C"])
        assert result.exit_code == 0
        assert "D" in result.output


class TestSuggestScalesCommand:
    def test_basic(self, runner):
        result = runner.invoke(cli, ["suggest-scales", "Dm7", "G7", "Cmaj7"])
        assert result.exit_code == 0


class TestIntervalCommand:
    def test_major_third(self, runner):
        result = runner.invoke(cli, ["interval", "C", "E"])
        assert result.exit_code == 0
        assert "Major 3rd" in result.output
        assert "4" in result.output  # 4 semitones
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_cli.py -v`
Expected: FAIL

- [ ] **Step 3: Create config.py**

File: `guitar-teacher/guitar_teacher/config.py`

```python
"""Configuration loading for guitar-teacher."""
import os
import yaml

DEFAULT_CONFIG_DIR = os.path.expanduser("~/.guitar-teacher")
DEFAULT_CONFIG_PATH = os.path.join(DEFAULT_CONFIG_DIR, "config.yaml")


def get_theory_dir() -> str:
    """Return path to the theory/ directory.

    Uses GUITAR_TEACHER_THEORY_DIR env var if set, otherwise navigates
    relative to this file (works for editable installs).
    """
    env_dir = os.environ.get("GUITAR_TEACHER_THEORY_DIR")
    if env_dir and os.path.isdir(env_dir):
        return env_dir
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "theory")


def load_config() -> dict:
    """Load config from ~/.guitar-teacher/config.yaml. Returns empty dict if missing."""
    if not os.path.exists(DEFAULT_CONFIG_PATH):
        return {}
    with open(DEFAULT_CONFIG_PATH) as f:
        return yaml.safe_load(f) or {}
```

Note: `get_theory_dir()` navigates from `guitar_teacher/config.py` up to `guitar-teacher/` then into `theory/`. This works for editable installs.

- [ ] **Step 4: Implement cli.py with all theory reference commands**

File: `guitar-teacher/guitar_teacher/cli.py`

Click CLI with a `@click.group()` named `cli` and subcommands:
- `scale <root> <type>` — calls `engine.get_scale()`, prints info + fretboard
- `chord <name>` — parses chord name (regex: `^([A-G][#b]?)(.*)$`), calls `engine.get_chord()`, prints info + chord diagrams
- `key <root> <type>` — calls `engine.chords_in_key()`, prints table
- `identify-key <notes...>` — calls `engine.detect_key()`, prints top 3 matches
- `suggest-scales <chords...>` — calls `engine.suggest_scales()`, prints results
- `interval <note1> <note2>` — calls `engine.interval_between()`, prints result
- `config` — prints current config or "no config file found"

Each command creates a `TheoryEngine` instance (lazy, shared via Click context if needed).

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_cli.py -v`
Expected: All pass

- [ ] **Step 6: Manual smoke test**

Run these commands and verify output looks reasonable:
```bash
guitar-teacher scale D dorian
guitar-teacher chord Am7
guitar-teacher key C major
guitar-teacher identify-key D E F G A Bb C
guitar-teacher suggest-scales Dm7 G7 Cmaj7
guitar-teacher interval C E
```

- [ ] **Step 7: Commit**

```bash
git add guitar-teacher/guitar_teacher/cli.py guitar-teacher/guitar_teacher/config.py guitar-teacher/tests/test_cli.py
git commit -m "feat: add CLI with scale, chord, key, interval, suggest-scales commands"
```

---

## Task 8: Analyzer (`analyzer.py`)

**Files:**
- Create: `guitar-teacher/guitar_teacher/core/analyzer.py`
- Create: `guitar-teacher/tests/test_analyzer.py`

- [ ] **Step 1: Write failing tests**

File: `guitar-teacher/tests/test_analyzer.py`

```python
import os
import pytest
from guitar_teacher.core.analyzer import analyze_song, analyze_file
from guitar_teacher.core.models import SoloAnalysis
from tests.conftest import MOS_JSON


class TestAnalyzeFile:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_returns_solo_analysis(self):
        result = analyze_file(MOS_JSON)
        assert isinstance(result, SoloAnalysis)

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_detects_key(self):
        result = analyze_file(MOS_JSON)
        # Man of Steel is in D minor
        assert "D" in result.key

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_has_sections(self):
        result = analyze_file(MOS_JSON)
        assert len(result.sections) > 0

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_has_technique_summary(self):
        result = analyze_file(MOS_JSON)
        assert len(result.technique_summary) > 0
        assert "bend" in result.technique_summary or "vibrato" in result.technique_summary

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_sections_have_difficulty(self):
        result = analyze_file(MOS_JSON)
        for section in result.sections:
            assert 1.0 <= section.difficulty <= 10.0

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="test fixture not found")
    def test_practice_order(self):
        result = analyze_file(MOS_JSON)
        assert len(result.practice_order) == len(result.sections)


class TestSectionGrouping:
    """Test section grouping with synthetic data."""

    def test_rest_bars_create_boundaries(self):
        from gp2tab.models import Song, Bar, Note
        song = Song(
            title="Test", artist="Test", tuning=["E","A","D","G","B","E"],
            tempo=120, bars=[
                Bar(number=1, time_signature="4/4", notes=[
                    Note(string=1, fret=5, beat=1.0, duration="quarter"),
                ]),
                Bar(number=2, time_signature="4/4", notes=[]),  # rest
                Bar(number=3, time_signature="4/4", notes=[
                    Note(string=1, fret=7, beat=1.0, duration="quarter"),
                ]),
            ]
        )
        result = analyze_song(song)
        assert len(result.sections) >= 2

    def test_fallback_chunks_of_4(self):
        from gp2tab.models import Song, Bar, Note
        bars = []
        for i in range(12):
            bars.append(Bar(
                number=i+1, time_signature="4/4",
                notes=[Note(string=1, fret=5, beat=1.0, duration="quarter")],
            ))
        song = Song(
            title="Test", artist="Test", tuning=["E","A","D","G","B","E"],
            tempo=120, bars=bars,
        )
        result = analyze_song(song)
        # 12 bars with no boundaries → chunks of 4 → 3 sections
        assert len(result.sections) == 3
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_analyzer.py -v`
Expected: FAIL

- [ ] **Step 3: Implement analyzer.py**

File: `guitar-teacher/guitar_teacher/core/analyzer.py`

Key functions:

`analyze_file(path: str) -> SoloAnalysis`:
- If path ends with `.json`: load JSON, reconstruct gp2tab `Song` model from it
- If path ends with `.gp*`: call `gp2tab.parser.parse(path)`
- Call `analyze_song(song)`

`analyze_song(song: Song) -> SoloAnalysis`:
1. Convert all notes to pitch names using `note_utils`
2. Build technique summary (technique → list of bar numbers)
3. Detect overall key using `TheoryEngine.detect_key()`
4. Per-bar analysis:
   - For each bar, compute `BarAnalysis` with note density, techniques, melodic patterns
   - Difficulty scoring using the formula from the spec
5. Section grouping:
   - Use GP section markers if available (from `song.sections`)
   - Otherwise, find boundaries at rest bars and long-note pauses
   - Fall back to 4-bar chunks
   - Merge adjacent similar sections if combined <= 8 bars
6. Per-section analysis: average difficulty, primary techniques, detected scale
7. Practice order: sort sections by difficulty (easiest first)
8. Build and return `SoloAnalysis`

`_score_difficulty(bar, techniques_data, tempo) -> float`:
- Note density: `min(len(bar.notes) / 4.0, 1.0) * 10` (4+ notes per beat = max)
- Technique score: sum of `techniques[t].difficulty` for each technique / max possible
- Tempo factor: `min(tempo / 200.0, 1.0) * 10`
- String crossings: count string changes between consecutive notes
- Position shifts: max fret distance between consecutive notes

`_detect_melodic_patterns(notes) -> list[str]`:
- Check if pitch sequence is monotonically ascending → "ascending_run"
- Monotonically descending → "descending_run"
- All chromatic (consecutive semitone steps) → "chromatic"
- Same note repeated → "repeated_note"
- Otherwise → empty list

`_reconstruct_song_from_json(data: dict) -> Song`:
- Parse the JSON format from gp2tab's `format_json` output back into a `Song` model
- Reference `gp2tab/gp2tab/formatter_json.py` for the JSON schema. Key structure: `{title, artist, tuning[], tempo, total_bars, sections[], bars[{number, time_signature, is_rest, notes[{beat, string, fret, duration, dotted, techniques[{type, value}], tie, tuplet, grace}]}]}`

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_analyzer.py -v`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add guitar-teacher/guitar_teacher/core/analyzer.py guitar-teacher/tests/test_analyzer.py
git commit -m "feat: add solo analyzer with key detection, difficulty scoring, section grouping"
```

---

## Task 9: CLI — Analyze Command

**Files:**
- Modify: `guitar-teacher/guitar_teacher/cli.py`
- Modify: `guitar-teacher/tests/test_cli.py`

- [ ] **Step 1: Add test for analyze command**

Add to `tests/test_cli.py`:

```python
class TestAnalyzeCommand:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_analyze_json(self, runner):
        result = runner.invoke(cli, ["analyze", MOS_JSON])
        assert result.exit_code == 0
        assert "Key:" in result.output or "key:" in result.output.lower()
        assert "Section" in result.output or "section" in result.output.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_cli.py::TestAnalyzeCommand -v`
Expected: FAIL

- [ ] **Step 3: Add analyze command to cli.py**

Add a `@cli.command()` for `analyze`:
- Takes a file path argument
- Calls `analyze_file(path)`
- Prints a formatted report: title, artist, key, tempo, tuning, then a table of sections with bar range, scale, difficulty, techniques

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_cli.py::TestAnalyzeCommand -v`
Expected: PASS

- [ ] **Step 5: Manual smoke test**

```bash
guitar-teacher analyze songs/guthrie-govan/man-of-steel/tab.json
```

Verify the output shows detected key (should be D minor), sections with difficulty scores, technique inventory.

- [ ] **Step 6: Commit**

```bash
git add guitar-teacher/guitar_teacher/cli.py guitar-teacher/tests/test_cli.py
git commit -m "feat: add analyze CLI command for solo analysis reports"
```

---

## Task 10: Lesson Templates (Jinja2)

**Files:**
- Create: `guitar-teacher/theory/lesson_templates/section_lesson.md.j2`
- Create: `guitar-teacher/theory/lesson_templates/technique_intro.md.j2`
- Create: `guitar-teacher/theory/lesson_templates/assembly_lesson.md.j2`
- Create: `guitar-teacher/theory/lesson_templates/theory_overview.md.j2`
- Create: `guitar-teacher/theory/lesson_templates/breakdown.md.j2`
- Create: `guitar-teacher/theory/lesson_templates/practice_plan.md.j2`
- Create: `guitar-teacher/theory/lesson_templates/performance_lesson.md.j2`

No tests for templates themselves — the generator tests (Task 11) will validate rendering.

- [ ] **Step 1: Create section_lesson.md.j2**

This is the main lesson template. Use the template from the spec as a starting point. The template receives a `LessonContext` object. Reference fields as `{{ ctx.lesson_number }}`, `{{ ctx.primary_concept.name }}`, etc.

Must include: lesson header, goal, warm-up, concept explanation, scale info (if applicable), steps loop, improvisation corner (if applicable), checkpoint, session log section.

Reference the existing lesson at `songs/guthrie-govan/man-of-steel/lessons/03-opening-theme-bars-1-4.md` for tone and structure.

- [ ] **Step 2: Create technique_intro.md.j2**

Template for the first 1-2 lessons that teach prerequisite techniques before tackling the solo. Receives a list of techniques with their teaching notes from `techniques.yaml`.

- [ ] **Step 3: Create assembly_lesson.md.j2**

Template for lessons that connect previously-learned sections. Receives a list of section names to connect, bar ranges, and target tempo.

- [ ] **Step 4: Create theory_overview.md.j2**

Template for the `theory.md` file. Receives the `SoloAnalysis` with key, scales used per section, modal interchange notes, and scale explanations from `scales.yaml`.

Reference `songs/guthrie-govan/man-of-steel/theory.md` for expected format.

- [ ] **Step 5: Create breakdown.md.j2**

Template for the `breakdown.md` file. Receives technique summary and section difficulty table.

Reference `songs/guthrie-govan/man-of-steel/breakdown.md` for expected format.

- [ ] **Step 6: Create practice_plan.md.j2**

Template for `practice.md`. Receives practice order, phases, and tempo milestones.

- [ ] **Step 7: Create performance_lesson.md.j2**

Template for the final lesson — full solo assembly and performance. Receives all sections in original order with target tempo = 100%.

- [ ] **Step 8: Commit**

```bash
git add guitar-teacher/theory/lesson_templates/
git commit -m "feat: add Jinja2 lesson templates for all lesson types"
```

---

## Task 11: Lesson Generator (`generator.py` + `templates.py`)

**Files:**
- Create: `guitar-teacher/guitar_teacher/lessons/templates.py`
- Create: `guitar-teacher/guitar_teacher/lessons/generator.py`
- Create: `guitar-teacher/tests/test_generator.py`

- [ ] **Step 1: Write failing tests**

File: `guitar-teacher/tests/test_generator.py`

```python
import os
import tempfile
import pytest
from guitar_teacher.core.analyzer import analyze_file
from guitar_teacher.lessons.generator import generate_lessons

MOS_JSON = os.path.join(
    os.path.dirname(__file__), "..", "..", "songs", "guthrie-govan", "man-of-steel", "tab.json"
)


class TestGenerateLessons:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_creates_lesson_files(self):
        analysis = analyze_file(MOS_JSON)
        with tempfile.TemporaryDirectory() as tmpdir:
            generate_lessons(analysis, output_dir=tmpdir)

            # Should create theory.md, breakdown.md, practice.md
            assert os.path.exists(os.path.join(tmpdir, "theory.md"))
            assert os.path.exists(os.path.join(tmpdir, "breakdown.md"))
            assert os.path.exists(os.path.join(tmpdir, "practice.md"))
            assert os.path.exists(os.path.join(tmpdir, "practice-log.md"))
            assert os.path.exists(os.path.join(tmpdir, ".context.md"))

            # Should create lessons directory with numbered files
            lessons_dir = os.path.join(tmpdir, "lessons")
            assert os.path.isdir(lessons_dir)
            lesson_files = sorted(os.listdir(lessons_dir))
            assert len(lesson_files) >= 3  # at least a few lessons
            assert lesson_files[0].startswith("01-")
            assert os.path.exists(os.path.join(lessons_dir, "README.md"))

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_lessons_are_self_contained(self):
        analysis = analyze_file(MOS_JSON)
        with tempfile.TemporaryDirectory() as tmpdir:
            generate_lessons(analysis, output_dir=tmpdir)

            lessons_dir = os.path.join(tmpdir, "lessons")
            lesson_files = [f for f in os.listdir(lessons_dir) if f.endswith(".md") and f != "README.md"]
            for lf in lesson_files[:3]:  # check first 3
                content = open(os.path.join(lessons_dir, lf)).read()
                assert "## Goal" in content
                assert "## Checkpoint" in content
                assert "## Steps" in content or "## Step" in content

    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_context_md_initialized(self):
        analysis = analyze_file(MOS_JSON)
        with tempfile.TemporaryDirectory() as tmpdir:
            generate_lessons(analysis, output_dir=tmpdir)
            content = open(os.path.join(tmpdir, ".context.md")).read()
            assert "01" in content  # starts at lesson 01
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_generator.py -v`
Expected: FAIL

- [ ] **Step 3: Implement templates.py**

File: `guitar-teacher/guitar_teacher/lessons/templates.py`

```python
"""Jinja2 template loader and renderer for lesson generation."""
import os
from jinja2 import Environment, FileSystemLoader

from guitar_teacher.config import get_theory_dir


def get_template_env() -> Environment:
    """Create Jinja2 environment loading from theory/lesson_templates/."""
    template_dir = os.path.join(get_theory_dir(), "lesson_templates")
    return Environment(
        loader=FileSystemLoader(template_dir),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render_template(template_name: str, context: dict) -> str:
    """Render a named template with the given context."""
    env = get_template_env()
    template = env.get_template(template_name)
    return template.render(**context)
```

- [ ] **Step 4: Implement generator.py**

File: `guitar-teacher/guitar_teacher/lessons/generator.py`

`generate_lessons(analysis: SoloAnalysis, output_dir: str) -> None`:

1. Create `output_dir` and `output_dir/lessons/`
2. Determine lesson plan:
   - First 1-2 lessons: technique prerequisites (pick the top 2-3 techniques by frequency)
   - Then: one lesson per section, in practice order (2-4 bars each)
   - Then: assembly lessons connecting adjacent sections (group by pairs/triples)
   - Final lesson: full performance
3. For each lesson, build a `LessonContext`:
   - `phase`: "Foundation" for technique intros and easy sections, "Building" for medium, "Peak" for hard, "Assembly" for connection lessons
   - `target_tempo_pct`: 50% for difficulty <= 5, 40% for 5-7, 30% for 7+
   - `warmup_exercises`: based on techniques in the section
   - `primary_concept`: the main technique or scale concept for this section
   - `steps`: 4-6 steps per lesson (learn notes, add techniques, add expression, tempo, consistency)
   - `checkpoints`: 3-5 items derived from the goal and techniques
   - `improvisation_suggestions`: if scale is detected, pull improvisation_tip from `scales.yaml`
4. Render each lesson using `render_template("section_lesson.md.j2", ctx)`
5. Generate `theory.md` using `theory_overview.md.j2`
6. Generate `breakdown.md` using `breakdown.md.j2`
7. Generate `practice.md` using `practice_plan.md.j2`
8. Generate `lessons/README.md` with links to all lesson files
9. Generate `.context.md` with lesson 01 as current
10. Generate `practice-log.md` with empty table

The step-building logic for each section lesson:
- Step 1: "Learn the Notes" — play through bars slowly, no metronome
- Step 2: "Add Techniques" — if bends/vibrato/etc in section, isolate and practice each
- Step 3: "Phrasing and Expression" — add dynamics, think vocally
- Step 4: "Tempo" — bring in metronome at target tempo
- Step 5: "Consistency Pass" — 3 clean consecutive passes

For technique intro lessons, pull `teaching_template` from `techniques.yaml` and fill in with generic fret examples.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_generator.py -v`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add guitar-teacher/guitar_teacher/lessons/ guitar-teacher/tests/test_generator.py
git commit -m "feat: add lesson generator with Jinja2 template rendering"
```

---

## Task 12: CLI — Lessons Command

**Files:**
- Modify: `guitar-teacher/guitar_teacher/cli.py`
- Modify: `guitar-teacher/tests/test_cli.py`

- [ ] **Step 1: Add test for lessons command**

Add to `tests/test_cli.py`:

```python
class TestLessonsCommand:
    @pytest.mark.skipif(not os.path.exists(MOS_JSON), reason="fixture not found")
    def test_lessons_generates_files(self, runner, tmp_path):
        result = runner.invoke(cli, ["lessons", MOS_JSON, "-o", str(tmp_path)])
        assert result.exit_code == 0
        assert os.path.exists(tmp_path / "theory.md")
        assert os.path.isdir(tmp_path / "lessons")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_cli.py::TestLessonsCommand -v`
Expected: FAIL

- [ ] **Step 3: Add lessons command to cli.py**

Add `@cli.command()` for `lessons`:
- Takes a file path argument and optional `-o` / `--output` directory
- Calls `analyze_file(path)` then `generate_lessons(analysis, output_dir)`
- Prints progress messages and summary when done

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_cli.py::TestLessonsCommand -v`
Expected: PASS

- [ ] **Step 5: Manual end-to-end test**

```bash
guitar-teacher lessons songs/guthrie-govan/man-of-steel/tab.json -o /tmp/mos-lessons
ls /tmp/mos-lessons/
cat /tmp/mos-lessons/theory.md
cat /tmp/mos-lessons/lessons/01-*.md
```

Verify output looks reasonable and lessons are self-contained.

- [ ] **Step 6: Commit**

```bash
git add guitar-teacher/guitar_teacher/cli.py guitar-teacher/tests/test_cli.py
git commit -m "feat: add lessons CLI command for full lesson plan generation"
```

---

## Task 13: LLM Enhancement Module

**Files:**
- Create: `guitar-teacher/guitar_teacher/llm/providers.py`
- Create: `guitar-teacher/guitar_teacher/llm/enhancer.py`

- [ ] **Step 1: Implement providers.py**

File: `guitar-teacher/guitar_teacher/llm/providers.py`

```python
"""LLM provider abstraction."""
import os
from dataclasses import dataclass


@dataclass
class LLMConfig:
    provider: str       # "claude", "openai", "ollama"
    model: str
    api_key: str | None
    base_url: str | None


def get_llm_config(config: dict, provider_override: str | None = None, model_override: str | None = None) -> LLMConfig:
    """Build LLMConfig from config dict and CLI overrides."""
    llm = config.get("llm", {})
    provider = provider_override or llm.get("provider", "claude")
    model = model_override or llm.get("model", "claude-sonnet-4-6")
    api_key_env = llm.get("api_key_env", "ANTHROPIC_API_KEY")
    api_key = os.environ.get(api_key_env) if provider != "ollama" else None
    base_url = llm.get("base_url")
    if provider == "ollama" and not base_url:
        base_url = "http://localhost:11434"
    return LLMConfig(provider=provider, model=model, api_key=api_key, base_url=base_url)


def call_llm(config: LLMConfig, system_prompt: str, user_prompt: str) -> str:
    """Send a prompt to the configured LLM and return the response text."""
    if config.provider == "claude":
        import anthropic
        client = anthropic.Anthropic(api_key=config.api_key)
        response = client.messages.create(
            model=config.model,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.content[0].text

    elif config.provider == "openai":
        import openai
        client = openai.OpenAI(api_key=config.api_key)
        response = client.chat.completions.create(
            model=config.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content

    elif config.provider == "ollama":
        import httpx
        resp = httpx.post(
            f"{config.base_url}/api/generate",
            json={"model": config.model, "prompt": user_prompt, "system": system_prompt, "stream": False},
            timeout=120.0,
        )
        resp.raise_for_status()
        return resp.json()["response"]

    else:
        raise ValueError(f"Unknown LLM provider: {config.provider}")
```

- [ ] **Step 2: Implement enhancer.py**

File: `guitar-teacher/guitar_teacher/llm/enhancer.py`

```python
"""Post-process generated lessons via LLM."""
import os
from guitar_teacher.llm.providers import LLMConfig, call_llm

SYSTEM_PROMPT = """You are an expert guitar teacher enriching a lesson plan.

RULES:
1. All notes, frets, strings, scales, techniques, and musical data are CORRECT. Do NOT change any of them.
2. Improve the prose: make it natural, engaging, conversational. Add analogies where helpful.
3. Add improvisation suggestions tied to the detected scale/mode.
4. Add context about the song or artist if you know it.
5. Keep the exact same structure (headings, checkpoints, steps). Only improve the text within each section.
6. Keep it concise — don't bloat the lesson.

Return the improved lesson as complete markdown."""


def enhance_lessons(lesson_dir: str, config: LLMConfig) -> int:
    """Enhance all lesson files in a directory. Returns count of enhanced files."""
    enhanced = 0
    for filename in sorted(os.listdir(lesson_dir)):
        if not filename.endswith(".md") or filename == "README.md":
            continue
        filepath = os.path.join(lesson_dir, filename)
        content = open(filepath).read()
        try:
            improved = call_llm(config, SYSTEM_PROMPT, content)
            with open(filepath, "w") as f:
                f.write(improved)
            enhanced += 1
        except Exception as e:
            print(f"  Warning: could not enhance {filename}: {e}")
    return enhanced


def enhance_file(filepath: str, config: LLMConfig) -> bool:
    """Enhance a single file. Returns True on success."""
    content = open(filepath).read()
    try:
        improved = call_llm(config, SYSTEM_PROMPT, content)
        with open(filepath, "w") as f:
            f.write(improved)
        return True
    except Exception as e:
        print(f"  Warning: could not enhance {filepath}: {e}")
        return False
```

- [ ] **Step 3: Write provider tests with mocks**

File: `guitar-teacher/tests/test_providers.py`

```python
import pytest
from unittest.mock import patch, MagicMock
from guitar_teacher.llm.providers import LLMConfig, call_llm, get_llm_config


class TestGetLLMConfig:
    def test_defaults(self):
        config = get_llm_config({})
        assert config.provider == "claude"
        assert config.model == "claude-sonnet-4-6"

    def test_overrides(self):
        config = get_llm_config({}, provider_override="ollama", model_override="llama3.1")
        assert config.provider == "ollama"
        assert config.model == "llama3.1"
        assert config.base_url == "http://localhost:11434"

    def test_reads_from_config_dict(self):
        config = get_llm_config({"llm": {"provider": "openai", "model": "gpt-4o"}})
        assert config.provider == "openai"
        assert config.model == "gpt-4o"


class TestCallLLM:
    @patch("guitar_teacher.llm.providers.anthropic")
    def test_claude_provider(self, mock_anthropic):
        mock_client = MagicMock()
        mock_anthropic.Anthropic.return_value = mock_client
        mock_client.messages.create.return_value.content = [MagicMock(text="improved lesson")]

        config = LLMConfig(provider="claude", model="test", api_key="key", base_url=None)
        result = call_llm(config, "system", "user prompt")
        assert result == "improved lesson"

    def test_unknown_provider_raises(self):
        config = LLMConfig(provider="unknown", model="test", api_key=None, base_url=None)
        with pytest.raises(ValueError, match="Unknown LLM provider"):
            call_llm(config, "system", "prompt")
```

- [ ] **Step 4: Run provider tests**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_providers.py -v`
Expected: All pass

- [ ] **Step 5: Wire --enhance flag into lessons CLI command**

Modify `cli.py` lessons command:
- Add `--enhance` flag (boolean)
- Add `--provider` and `--model` options (strings, optional)
- If `--enhance` is set: load config, build LLMConfig with overrides, call `enhance_lessons()` after generation
- Print progress: "Enhancing lesson X of Y..."

- [ ] **Step 6: Manual test (if API key available)**

```bash
export ANTHROPIC_API_KEY=...
guitar-teacher lessons songs/guthrie-govan/man-of-steel/tab.json -o /tmp/mos-enhanced --enhance
```

If no API key, test with Ollama (if installed):
```bash
guitar-teacher lessons songs/guthrie-govan/man-of-steel/tab.json -o /tmp/mos-enhanced --enhance --provider ollama --model llama3.1
```

- [ ] **Step 7: Commit**

```bash
git add guitar-teacher/guitar_teacher/llm/ guitar-teacher/tests/test_providers.py
git commit -m "feat: add LLM enhancement module with Claude, OpenAI, and Ollama support"
```

---

## Task 14: GP File Direct Input

**Files:**
- Modify: `guitar-teacher/guitar_teacher/core/analyzer.py`
- Modify: `guitar-teacher/tests/test_analyzer.py`

- [ ] **Step 1: Add test for .gp file input**

Add to `tests/test_analyzer.py`:

```python
from tests.conftest import MOS_GP


class TestAnalyzeGPFile:
    @pytest.mark.skipif(not os.path.exists(MOS_GP), reason="GP file not found")
    def test_accepts_gp_file(self):
        result = analyze_file(MOS_GP)
        assert isinstance(result, SoloAnalysis)
        assert result.title != ""
```

- [ ] **Step 2: Run test to verify behavior**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest tests/test_analyzer.py::TestAnalyzeGPFile -v`

If `analyze_file` already handles GP files (from Task 8 implementation), this should pass. If not:

- [ ] **Step 3: Ensure analyze_file handles .gp files**

In `analyzer.py`, the `analyze_file` function should:
- Check file extension
- If `.json`: load JSON, reconstruct Song
- If any GP extension (`.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`): call `gp2tab.parser.parse(path)`
- Pass the Song model to `analyze_song()`

Also add `--track` option to CLI commands (`analyze` and `lessons`) to select which track to analyze from multi-track GP files.

- [ ] **Step 4: Run full test suite**

Run: `cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest -v`
Expected: All pass

- [ ] **Step 5: Manual test with GP file**

```bash
guitar-teacher analyze "songs/guthrie-govan/man-of-steel/Guthrie Hans.gp" --track 1
guitar-teacher lessons "songs/guthrie-govan/man-of-steel/Guthrie Hans.gp" -o /tmp/mos-gp --track 1
```

- [ ] **Step 6: Commit**

```bash
git add guitar-teacher/guitar_teacher/core/analyzer.py guitar-teacher/guitar_teacher/cli.py guitar-teacher/tests/test_analyzer.py
git commit -m "feat: support direct GP file input with track selection"
```

---

## Task 15: Final Integration Test & Documentation

**Files:**
- Create: `guitar-teacher/README.md`
- Modify: `guitar-teacher/tests/test_cli.py`

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/leo/hobby/tab/guitar-teacher && python -m pytest -v --tb=short
```

Expected: All tests pass.

- [ ] **Step 2: Full end-to-end manual test**

```bash
# Theory reference
guitar-teacher scale D dorian
guitar-teacher chord Am7
guitar-teacher key C major
guitar-teacher identify-key D E F G A Bb C
guitar-teacher suggest-scales Dm7 G7 Cmaj7
guitar-teacher interval C G

# Analysis
guitar-teacher analyze "songs/guthrie-govan/man-of-steel/Guthrie Hans.gp"

# Lesson generation
guitar-teacher lessons "songs/guthrie-govan/man-of-steel/Guthrie Hans.gp" -o /tmp/final-test
cat /tmp/final-test/theory.md
cat /tmp/final-test/breakdown.md
cat /tmp/final-test/lessons/01-*.md
```

Verify all output is correct, readable, and matches expected format.

- [ ] **Step 3: Write README.md**

File: `guitar-teacher/README.md`

Cover: what it is, installation, quick start (scale/chord/lessons commands), theory data expansion, LLM enhancement setup, project structure overview.

- [ ] **Step 4: Commit**

```bash
git add guitar-teacher/
git commit -m "feat: guitar-teacher v0.1.0 — local guitar learning tool with theory engine and lesson generator"
```
