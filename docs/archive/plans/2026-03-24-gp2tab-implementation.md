# gp2tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python CLI tool that converts Guitar Pro files (GP3-8) into ASCII tab, structured JSON, and LLM-optimized text.

**Architecture:** Parser → Song model (dataclasses) → Formatters pipeline. GP7/8 uses ZIP+XML (`Content/score.gpif`); GP3-5 uses pyguitarpro. All formats normalize into the same Song model. Three independent formatters produce output files. Thin CLI wrapper ties it together.

**Tech Stack:** Python 3.8+, pyguitarpro (GP3-5), stdlib zipfile + xml.etree.ElementTree (GP6-8), dataclasses, argparse

**Spec:** `docs/superpowers/specs/2026-03-24-gp2tab-design.md`

**Test GP file:** `songs/guthrie-govan/man-of-steel/Guthrie Hans.gp` (GP7/8 ZIP+XML format, 68 bars, 345 notes, single track)

---

## File Structure

```
gp2tab/
├── gp2tab/
│   ├── __init__.py          — package init, exports parse() and format functions
│   ├── __main__.py          — allows `python -m gp2tab`
│   ├── models.py            — dataclasses: Song, Bar, Note, Technique, Section
│   ├── parser.py            — dispatch: detects format, delegates to parser_gp5 or parser_gp_xml
│   ├── parser_gp5.py        — GP3/4/5 binary via pyguitarpro → Song model
│   ├── parser_gp_xml.py     — GP6/7/8 ZIP+XML → Song model
│   ├── formatter_tab.py     — Song → ASCII tab (.txt)
│   ├── formatter_json.py    — Song → JSON (.json)
│   ├── formatter_llm.py     — Song → LLM text (.llm.txt)
│   └── utils.py             — MIDI pitch → note name, beat math, duration values
├── tests/
│   ├── __init__.py
│   ├── test_models.py       — model construction and validation
│   ├── test_utils.py        — utility function tests
│   ├── test_parser_gp_xml.py — XML parser tests (uses real GP file + crafted XML snippets)
│   ├── test_formatter_json.py
│   ├── test_formatter_llm.py
│   ├── test_formatter_tab.py
│   └── conftest.py          — shared fixtures (sample Song, sample bars)
├── cli.py                   — CLI entry point
├── requirements.txt         — pyguitarpro
└── README.md
```

---

## Task 1: Project scaffolding and data models

**Files:**
- Create: `gp2tab/gp2tab/__init__.py`, `gp2tab/gp2tab/models.py`, `gp2tab/gp2tab/utils.py`
- Create: `gp2tab/tests/__init__.py`, `gp2tab/tests/conftest.py`, `gp2tab/tests/test_models.py`, `gp2tab/tests/test_utils.py`
- Create: `gp2tab/requirements.txt`

### models.py

- [ ] **Step 1: Write test for Technique dataclass**

```python
# tests/test_models.py
from gp2tab.models import Technique

def test_technique_bend():
    t = Technique(type="bend", value=1.0)
    assert t.type == "bend"
    assert t.value == 1.0

def test_technique_no_value():
    t = Technique(type="hammer")
    assert t.value is None
```

- [ ] **Step 2: Write test for Note dataclass**

```python
from gp2tab.models import Note, Technique

def test_note_basic():
    n = Note(string=2, fret=15, beat=1.0, duration="eighth")
    assert n.string == 2
    assert n.fret == 15
    assert n.dotted is False
    assert n.techniques == []
    assert n.tie is None
    assert n.tuplet is None
    assert n.grace is False

def test_note_with_techniques():
    n = Note(
        string=2, fret=17, beat=2.0, duration="quarter",
        techniques=[Technique(type="bend", value=0.5)],
        tie="start"
    )
    assert len(n.techniques) == 1
    assert n.tie == "start"
```

- [ ] **Step 3: Write test for Bar dataclass**

```python
from gp2tab.models import Bar, Note

def test_bar_rest():
    b = Bar(number=1, time_signature="4/4")
    assert b.is_rest is True
    assert b.notes == []
    assert b.warnings == []
    assert b.tempo is None
    assert b.section is None

def test_bar_with_notes():
    notes = [Note(string=2, fret=15, beat=1.0, duration="eighth")]
    b = Bar(number=4, time_signature="4/4", notes=notes)
    assert b.is_rest is False
```

- [ ] **Step 4: Write test for Song and Section dataclasses**

```python
from gp2tab.models import Song, Section, Bar

def test_song():
    bars = [Bar(number=1, time_signature="4/4")]
    sections = [Section(name="Intro", start_bar=1, end_bar=4)]
    s = Song(
        title="Test Song", artist="Test Artist",
        tuning=["E", "A", "D", "G", "B", "e"],
        tempo=120, bars=bars, sections=sections
    )
    assert s.title == "Test Song"
    assert len(s.bars) == 1
    assert len(s.sections) == 1
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_models.py -v`
Expected: ImportError — module doesn't exist yet

- [ ] **Step 6: Implement models.py**

```python
# gp2tab/models.py
from dataclasses import dataclass, field
from typing import List, Optional, Dict

@dataclass
class Technique:
    type: str  # "bend", "bend_release", "pre_bend", "pre_bend_release", "hammer", "pull", etc.
    value: Optional[float] = None  # bend amount in steps (0.5, 1.0, 1.5, 2.0). None for non-bends.

@dataclass
class Note:
    string: int        # 1=highest pitch string, 6=lowest
    fret: int
    beat: float        # 1.0, 1.5, 2.0, etc.
    duration: str      # "whole", "half", "quarter", "eighth", "16th", "32nd"
    dotted: bool = False
    techniques: List[Technique] = field(default_factory=list)
    tie: Optional[str] = None       # "start", "continue", "end", or None
    tuplet: Optional[Dict] = None   # {"actual": 3, "normal": 2} or None
    grace: bool = False

@dataclass
class Section:
    name: str
    start_bar: int
    end_bar: int

@dataclass
class Bar:
    number: int
    time_signature: str     # e.g. "4/4"
    notes: List[Note] = field(default_factory=list)
    tempo: Optional[int] = None
    section: Optional[str] = None
    is_partial: bool = False
    warnings: List[str] = field(default_factory=list)

    @property
    def is_rest(self) -> bool:
        return len(self.notes) == 0

@dataclass
class Song:
    title: str
    artist: str
    tuning: List[str]   # e.g. ["E", "A", "D", "G", "B", "e"]
    tempo: int           # initial BPM
    bars: List[Bar] = field(default_factory=list)
    sections: List[Section] = field(default_factory=list)
```

- [ ] **Step 7: Create __init__.py and package boilerplate**

```python
# gp2tab/__init__.py
from gp2tab.models import Song, Bar, Note, Technique, Section
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_models.py -v`
Expected: All pass

### utils.py

- [ ] **Step 9: Write tests for utility functions**

```python
# tests/test_utils.py
from gp2tab.utils import midi_to_note_name, duration_beats, string_name

def test_midi_to_note_name():
    assert midi_to_note_name(40) == "E"   # low E (E2)
    assert midi_to_note_name(45) == "A"   # A2
    assert midi_to_note_name(50) == "D"   # D3
    assert midi_to_note_name(55) == "G"   # G3
    assert midi_to_note_name(59) == "B"   # B3
    assert midi_to_note_name(64) == "e"   # high e (E4)
    # Flats
    assert midi_to_note_name(39) == "Eb"  # Eb2
    assert midi_to_note_name(63) == "eb"  # Eb4 (high octave = lowercase)

def test_midi_to_note_name_standard_tuning():
    """Standard tuning pitches [40, 45, 50, 55, 59, 64] should produce E A D G B e"""
    pitches = [40, 45, 50, 55, 59, 64]
    names = [midi_to_note_name(p) for p in pitches]
    assert names == ["E", "A", "D", "G", "B", "e"]

def test_duration_beats():
    assert duration_beats("whole") == 4.0
    assert duration_beats("half") == 2.0
    assert duration_beats("quarter") == 1.0
    assert duration_beats("eighth") == 0.5
    assert duration_beats("16th") == 0.25
    assert duration_beats("32nd") == 0.125

def test_duration_beats_dotted():
    assert duration_beats("quarter", dotted=True) == 1.5
    assert duration_beats("eighth", dotted=True) == 0.75

def test_string_name():
    tuning = ["E", "A", "D", "G", "B", "e"]
    assert string_name(1, tuning) == "e"    # string 1 = highest = last in tuning
    assert string_name(2, tuning) == "B"
    assert string_name(6, tuning) == "E"
```

- [ ] **Step 10: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_utils.py -v`
Expected: ImportError

- [ ] **Step 11: Implement utils.py**

```python
# gp2tab/utils.py

# MIDI note number to note name.
# Convention: notes at octave < 4 are uppercase, octave >= 4 are lowercase.
# This matches guitar string naming: low E (E2) = "E", high e (E4) = "e".
_NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

def midi_to_note_name(midi: int) -> str:
    """Convert MIDI pitch to string name. Octave < 4 = uppercase, >= 4 = lowercase."""
    note_index = midi % 12
    octave = (midi // 12) - 1  # MIDI octave convention
    name = _NOTE_NAMES[note_index]
    if octave >= 4:
        name = name.lower()
    return name

_DURATION_MAP = {
    "whole": 4.0, "half": 2.0, "quarter": 1.0,
    "eighth": 0.5, "16th": 0.25, "32nd": 0.125,
}

def duration_beats(duration: str, dotted: bool = False) -> float:
    """Return the beat count for a duration. Dotted adds 50%."""
    beats = _DURATION_MAP[duration]
    if dotted:
        beats *= 1.5
    return beats

def string_name(string_num: int, tuning: list) -> str:
    """Convert string number (1=highest) to name from tuning list (low-to-high)."""
    return tuning[len(tuning) - string_num]
```

- [ ] **Step 12: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_utils.py -v`
Expected: All pass

### conftest.py and requirements.txt

- [ ] **Step 13: Create conftest.py with shared fixtures**

```python
# tests/conftest.py
import os
import pytest
from gp2tab.models import Song, Bar, Note, Technique, Section

GP_FILE = os.path.join(
    os.path.dirname(__file__), "..", "..",
    "songs", "guthrie-govan", "man-of-steel", "Guthrie Hans.gp"
)

@pytest.fixture
def sample_song():
    """A small song fixture for formatter tests."""
    return Song(
        title="Test Solo",
        artist="Test Artist",
        tuning=["E", "A", "D", "G", "B", "e"],
        tempo=128,
        sections=[Section(name="Intro", start_bar=1, end_bar=2)],
        bars=[
            Bar(number=1, time_signature="4/4", section="Intro", notes=[
                Note(string=2, fret=15, beat=1.0, duration="eighth"),
                Note(string=2, fret=17, beat=1.5, duration="eighth"),
                Note(string=2, fret=17, beat=2.0, duration="quarter",
                     techniques=[Technique(type="bend", value=0.5)],
                     tie="start"),
                Note(string=3, fret=14, beat=3.0, duration="eighth",
                     techniques=[Technique(type="hammer")]),
                Note(string=3, fret=16, beat=3.5, duration="eighth",
                     techniques=[Technique(type="pull")]),
                Note(string=3, fret=14, beat=4.0, duration="eighth"),
            ]),
            Bar(number=2, time_signature="4/4", notes=[
                Note(string=3, fret=13, beat=1.0, duration="half",
                     techniques=[Technique(type="vibrato")]),
                Note(string=4, fret=14, beat=3.0, duration="quarter",
                     techniques=[Technique(type="slide_up")]),
                Note(string=4, fret=17, beat=4.0, duration="quarter"),
            ]),
        ],
    )

@pytest.fixture
def rest_bars_song():
    """Song with consecutive rest bars for LLM collapse testing."""
    return Song(
        title="Rest Test",
        artist="Nobody",
        tuning=["E", "A", "D", "G", "B", "e"],
        tempo=100,
        bars=[
            Bar(number=1, time_signature="4/4"),
            Bar(number=2, time_signature="4/4"),
            Bar(number=3, time_signature="4/4"),
            Bar(number=4, time_signature="4/4", notes=[
                Note(string=1, fret=12, beat=1.0, duration="whole"),
            ]),
        ],
    )
```

- [ ] **Step 14: Create requirements.txt**

```
pyguitarpro>=0.9
```

- [ ] **Step 15: Run full test suite**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/ -v`
Expected: All pass

- [ ] **Step 16: Commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/
git commit -m "feat(gp2tab): add data models, utils, and test fixtures"
```

---

## Task 2: GP7/8 XML parser

**Files:**
- Create: `gp2tab/gp2tab/parser_gp_xml.py`, `gp2tab/gp2tab/parser.py`
- Create: `gp2tab/tests/test_parser_gp_xml.py`

This is the most complex task. The GP7/8 XML format stores data across cross-referenced ID tables: MasterBars → Bars → Voices → Beats → Notes, with Rhythms as a lookup table.

### XML structure reference (from the actual Man of Steel GP file):

- `MasterBars/MasterBar` — ordered list. Contains `<Time>4/4</Time>`, `<Bars>0</Bars>` (space-separated bar IDs, one per track), optionally `<Section>` for rehearsal marks
- `Bars/Bar[@id]` — `<Voices>0 -1 -1 -1</Voices>` (space-separated voice IDs, -1 = empty)
- `Voices/Voice[@id]` — `<Beats>0 1 2 3 4</Beats>` (space-separated beat IDs)
- `Beats/Beat[@id]` — `<Rhythm ref="0" />`, `<Notes>5</Notes>` (space-sep note IDs), optionally `<GraceNotes />` for grace notes
- `Notes/Note[@id]` — Properties contain: `Fret`, `String` (0-indexed), `HopoOrigin`/`HopoDestination`, `Slide`, `Bended` + bend curve, `Muted`, `Tapped`. Tags: `<Tie>`, `<Vibrato>`, `<Trill>`
- `Rhythms/Rhythm[@id]` — `<NoteValue>Eighth</NoteValue>`, optionally `<PrimaryTuplet num="3" den="2" />`, `<AugmentationDot count="1" />`
- Tuning: `Tracks/Track/Properties/Property[@name='Tuning']/Pitches` = space-sep MIDI pitches (low to high)
- Tempo: `Automations/Automation` where `<Type>Tempo</Type>`, `<Bar>0</Bar>`, `<Value>128 2</Value>` (BPM + beat type)
- Bends: `BendOriginValue`, `BendMiddleValue`, `BendDestinationValue` — units are steps * 100 (so 50.0 = half step = 0.5)
- Slides: `<Flags>` bitmask — 1=shift slide, 2=legato slide, 4=slide out down, 8=slide out up, 16=slide in below, 32=slide in above
- Ties: `<Tie origin="true" destination="false" />` — origin=true means tie starts here, destination=true means tied from previous

- [ ] **Step 1: Write test for parsing song metadata**

```python
# tests/test_parser_gp_xml.py
import os
import pytest
from tests.conftest import GP_FILE

pytestmark = pytest.mark.skipif(
    not os.path.exists(GP_FILE),
    reason="GP test file not found"
)

def test_parse_metadata():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    assert song.title == "Man Of Steel"
    assert song.artist == "Guthrie Govan"
    assert song.tuning == ["E", "A", "D", "G", "B", "e"]
    assert song.tempo == 128

def test_parse_bar_count():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    assert len(song.bars) == 68

def test_parse_time_signature():
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    assert song.bars[0].time_signature == "4/4"
```

- [ ] **Step 2: Write test for note parsing**

```python
def test_parse_first_notes():
    """Bar 4 (index 3) should have notes starting with B:15 eighth."""
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    # First 3 bars are rests
    for i in range(3):
        assert song.bars[i].is_rest, f"Bar {i+1} should be rest"
    # Bar 4 has notes
    bar4 = song.bars[3]
    assert not bar4.is_rest
    assert len(bar4.notes) > 0
    first_note = bar4.notes[0]
    assert first_note.fret == 15
    assert first_note.string == 2  # B string
    assert first_note.duration == "eighth"
    assert first_note.beat == 1.0

def test_parse_bend():
    """Bar 4 should contain a bend note."""
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    bar4 = song.bars[3]
    bend_notes = [n for n in bar4.notes if any(t.type == "bend" for t in n.techniques)]
    assert len(bend_notes) > 0
    bend = bend_notes[0].techniques[0]
    assert bend.type == "bend"
    assert bend.value == 0.5  # half-step bend

def test_parse_ties():
    """Should find tied notes in bar 4."""
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    bar4 = song.bars[3]
    tie_notes = [n for n in bar4.notes if n.tie is not None]
    assert len(tie_notes) > 0

def test_parse_hammer_pull():
    """Should find hammer-on and pull-off techniques."""
    from gp2tab.parser_gp_xml import parse_gp_xml
    song = parse_gp_xml(GP_FILE)
    all_notes = [n for b in song.bars for n in b.notes]
    hammers = [n for n in all_notes if any(t.type == "hammer" for t in n.techniques)]
    pulls = [n for n in all_notes if any(t.type == "pull" for t in n.techniques)]
    assert len(hammers) > 0
    assert len(pulls) > 0
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_parser_gp_xml.py -v`
Expected: ImportError

- [ ] **Step 4: Implement parser_gp_xml.py — XML loading and metadata extraction**

```python
# gp2tab/parser_gp_xml.py
"""Parser for GP6/7/8 files (ZIP containing Content/score.gpif XML)."""
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple
from gp2tab.models import Song, Bar, Note, Technique, Section
from gp2tab.utils import midi_to_note_name, duration_beats

# GP XML NoteValue → our duration name
_NOTE_VALUE_MAP = {
    "Whole": "whole", "Half": "half", "Quarter": "quarter",
    "Eighth": "eighth", "16th": "16th", "32nd": "32nd",
}

def parse_gp_xml(filepath: str, track_index: int = 0) -> Song:
    """Parse a GP6/7/8 file and return a Song model."""
    with zipfile.ZipFile(filepath, 'r') as zf:
        xml_data = zf.read('Content/score.gpif')
    root = ET.fromstring(xml_data)

    title, artist = _parse_score(root)
    tuning = _parse_tuning(root, track_index)
    tempo = _parse_tempo(root)

    # Build lookup tables
    rhythms = _parse_rhythms(root)
    notes_table = _parse_notes(root)
    beats_table = _parse_beats(root)
    voices_table = _parse_voices(root)
    bars_table = _parse_bars_table(root)

    # Assemble bars from MasterBars
    bars = _assemble_bars(root, track_index, bars_table, voices_table,
                          beats_table, notes_table, rhythms, tuning)

    sections = _parse_sections(root)

    return Song(
        title=title, artist=artist, tuning=tuning,
        tempo=tempo, bars=bars, sections=sections,
    )
```

This function is the skeleton. The step continues with implementing all the helper functions. Since the full implementation is substantial, the implementor should follow this structure:

**`_parse_score(root)`** — Extract `Score/Title` and `Score/Artist` text.

**`_parse_tuning(root, track_index)`** — Find `Tracks/Track[track_index]`, read `Property[@name='Tuning']/Pitches`, split into ints, convert each via `midi_to_note_name()`.

**`_parse_tempo(root)`** — Find `Automations/Automation` where `Type` is "Tempo", parse first part of `Value` text as int. Return both the initial tempo AND a `dict[int, int]` mapping bar index → tempo for mid-song changes. Apply these in `_assemble_bars` by setting `bar.tempo` when a change occurs.

**`_parse_rhythms(root)`** — Build `dict[str, dict]` keyed by rhythm ID. Each entry has `duration` (mapped via `_NOTE_VALUE_MAP`), `dotted` (bool from `AugmentationDot`), `tuplet` (dict from `PrimaryTuplet` num/den or None).

**`_parse_notes(root)`** — Build `dict[str, dict]` keyed by note ID. For each `Note`:
  - `fret` from `Property[@name='Fret']/Fret`
  - `string` from `Property[@name='String']/String` (0-indexed in XML, convert to 1-indexed: `num_strings - gp_string_num` where num_strings is typically 6)
  - Techniques: check for `Bended` property → extract bend type from origin/mid/dest values. Check `HopoOrigin` → "hammer", `HopoDestination` → "pull". Check `Slide` → parse flags. Check `Vibrato` tag → "vibrato". Check `Muted` → "mute". Check `Tapped` → "tap". Check `Trill` tag → "trill".
  - Tie: read `<Tie origin="true/false" destination="true/false" />` → if origin only: "start", if both: "continue", if destination only: "end"

**Bend parsing logic:**
  - Read `BendOriginValue`, `BendMiddleValue`, `BendDestinationValue` (floats, in units where 100 = whole step, 50 = half step)
  - If origin=0, dest>0: "bend" (value = dest/100)
  - If origin>0, dest=0: "bend_release" (value = origin/100) — actually check mid value
  - If origin>0, dest=origin: "pre_bend" (value = origin/100)
  - Simplified approach: use dest value as bend target. If origin=0 → "bend". If origin>0 and dest<origin → "bend_release". If origin>0 and dest>=origin → "pre_bend".
  - Convert value: divide by 100 to get steps, round to nearest 0.5

**Slide parsing logic:**
  - Flags is a bitmask. Check bits for direction:
  - Flag & 0x01 or & 0x02 = legato/shift slide. Determine direction by comparing this note's fret with the next note on the same string (if available). Otherwise default to slide_up.
  - Flag & 0x04 = slide out down → "slide_down"
  - Flag & 0x08 = slide out up → "slide_up"
  - Flag & 0x10 = slide in from below → "slide_up"
  - Flag & 0x20 = slide in from above → "slide_down"
  - Simplification for v1: just check if any "up" bit or "down" bit is set. Default to "slide_up" if ambiguous.

**`_parse_beats(root)`** — Build `dict[str, dict]` keyed by beat ID. Each entry has `rhythm_ref` (string), `note_ids` (list of strings from space-split `Notes` text), `is_rest` (True if no `Notes` child), `grace` (True if `GraceNotes` tag exists).

**`_parse_voices(root)`** — Build `dict[str, list]` keyed by voice ID. Value is list of beat ID strings from space-split `Beats` text.

**`_parse_bars_table(root)`** — Build `dict[str, dict]` keyed by bar ID. Each entry has `voice_ids` (list of strings from space-split `Voices`, filtering out "-1").

**`_assemble_bars(...)`** — Iterate `MasterBars/MasterBar` in order (these ARE ordered, index = bar number - 1). For each:
  1. Get time signature from `Time` text
  2. Get the bar ID for our track from `Bars` text (space-split, index by track_index)
  3. Look up bar → voices → beats → notes, computing beat positions
  4. Beat position calculation: walk beats in order, accumulate position. For each beat, the duration in beats comes from the rhythm (factoring in tuplet ratio). Starting position = running total. Tuplet adjustment: actual_duration = base_duration * (normal / actual), e.g. triplet quarter = 1.0 * (2/3) = 0.667 beats.
  5. Merge notes from all voices, sort by beat position
  6. Return `Bar` with 1-indexed number

**`_parse_sections(root)`** — Check `MasterBar` elements for `<Section>` child. Extract `Letter` and `Text` to build section name. Track start/end bar ranges.

**`list_tracks_xml(filepath)`** — Open ZIP, parse XML, find all `Tracks/Track` elements, return `[(index, name)]` tuples from each track's `Name` child element.

**`_validate_bar(bar, time_sig)`** — After assembling each bar, sum note durations (accounting for tuplets and dots). Compare to expected beats from time signature. If mismatch and bar is not first/last (which may be `is_partial`), add a warning string to `bar.warnings`. Mark first/last bars with fewer beats as `is_partial=True`.

- [ ] **Step 5: Implement the full parser_gp_xml.py**

Implement all helper functions listed above. Key implementation details:

Beat position tracking pseudocode:
```python
def _assemble_bars(root, track_index, bars_table, voices_table,
                   beats_table, notes_table, rhythms, tuning):
    master_bars = root.findall('.//MasterBars/MasterBar')
    result = []
    num_strings = len(tuning)

    for bar_num, mb in enumerate(master_bars, start=1):
        time_sig = mb.findtext('Time', '4/4')
        bar_ids = mb.findtext('Bars', '').split()
        if track_index >= len(bar_ids):
            result.append(Bar(number=bar_num, time_signature=time_sig))
            continue

        bar_id = bar_ids[track_index]
        bar_data = bars_table.get(bar_id, {})
        voice_ids = bar_data.get('voice_ids', [])

        all_notes = []
        for voice_id in voice_ids:
            beat_ids = voices_table.get(voice_id, [])
            current_beat = 1.0  # beats are 1-indexed

            for beat_id in beat_ids:
                beat_data = beats_table.get(beat_id, {})
                rhythm = rhythms.get(beat_data.get('rhythm_ref', ''), {})

                dur_name = rhythm.get('duration', 'quarter')
                dotted = rhythm.get('dotted', False)
                tuplet = rhythm.get('tuplet')

                beat_length = duration_beats(dur_name, dotted)
                if tuplet:
                    beat_length = beat_length * tuplet['normal'] / tuplet['actual']

                for note_id in beat_data.get('note_ids', []):
                    note_data = notes_table.get(note_id, {})
                    gp_string = note_data.get('string', 0)
                    string_num = num_strings - gp_string  # convert 0-indexed to our 1-indexed

                    note = Note(
                        string=string_num,
                        fret=note_data.get('fret', 0),
                        beat=round(current_beat, 4),
                        duration=dur_name,
                        dotted=dotted,
                        techniques=note_data.get('techniques', []),
                        tie=note_data.get('tie'),
                        tuplet=tuplet,
                        grace=beat_data.get('grace', False),
                    )
                    all_notes.append(note)

                if not beat_data.get('grace', False):
                    current_beat += beat_length

        all_notes.sort(key=lambda n: (n.beat, n.string))

        section_el = mb.find('Section')
        section_name = None
        if section_el is not None:
            text = section_el.findtext('Text', '')
            letter = section_el.findtext('Letter', '')
            section_name = text or letter or None

        result.append(Bar(
            number=bar_num,
            time_signature=time_sig,
            notes=all_notes,
            section=section_name,
        ))

    return result
```

- [ ] **Step 6: Implement parser.py dispatcher**

```python
# gp2tab/parser.py
"""Format-detecting parser dispatcher."""
import zipfile
from gp2tab.models import Song

def parse(filepath: str, track_index: int = 0) -> Song:
    """Parse a Guitar Pro file (any supported format) into a Song model."""
    if _is_zip(filepath):
        from gp2tab.parser_gp_xml import parse_gp_xml
        return parse_gp_xml(filepath, track_index)
    else:
        from gp2tab.parser_gp5 import parse_gp5
        return parse_gp5(filepath, track_index)

def _is_zip(filepath: str) -> bool:
    return zipfile.is_zipfile(filepath)

def list_tracks(filepath: str) -> list:
    """Return list of (index, name) tuples for tracks in the file."""
    if _is_zip(filepath):
        from gp2tab.parser_gp_xml import list_tracks_xml
        return list_tracks_xml(filepath)
    else:
        from gp2tab.parser_gp5 import list_tracks_gp5
        return list_tracks_gp5(filepath)
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_parser_gp_xml.py -v`
Expected: All pass

- [ ] **Step 8: Write additional edge-case tests and fix issues**

Add tests for:
- Slides, vibrato, muted notes, tapped notes, trills
- Tuplet beat positioning
- Notes sorted correctly within a bar
- Bar warnings for duration mismatches

Run tests after each addition, fix parser issues as they arise.

- [ ] **Step 9: Commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/
git commit -m "feat(gp2tab): add GP7/8 XML parser with technique extraction"
```

---

## Task 3: GP3/4/5 parser (pyguitarpro)

**Files:**
- Create: `gp2tab/gp2tab/parser_gp5.py`

This is a thin adapter from pyguitarpro's data model to our Song model. Since we only have a GP7/8 test file, we test the mapping/extraction functions with mocked pyguitarpro objects.

- [ ] **Step 1: Write tests for GP5 technique extraction and tie logic**

```python
# tests/test_parser_gp5.py
from unittest.mock import MagicMock
from gp2tab.parser_gp5 import _extract_techniques, _extract_tie
from gp2tab.models import Technique
import guitarpro

def _make_note_effect(**kwargs):
    """Create a mock NoteEffect with sane defaults."""
    eff = MagicMock()
    eff.bend = kwargs.get("bend", None)
    eff.hammer = kwargs.get("hammer", False)
    eff.slide = kwargs.get("slide", None)
    eff.vibrato = kwargs.get("vibrato", False)
    eff.harmonic = kwargs.get("harmonic", None)
    eff.palmMute = kwargs.get("palmMute", False)
    eff.ghostNote = kwargs.get("ghostNote", False)
    eff.deadNote = kwargs.get("deadNote", False)
    return eff

def _make_gp_note(effect=None, note_type=None):
    note = MagicMock()
    note.effect = effect or _make_note_effect()
    note.type = note_type or guitarpro.NoteType.normal
    return note

def test_extract_hammer():
    note = _make_gp_note(_make_note_effect(hammer=True))
    techs = _extract_techniques(note)
    assert any(t.type == "hammer" for t in techs)

def test_extract_vibrato():
    note = _make_gp_note(_make_note_effect(vibrato=True))
    techs = _extract_techniques(note)
    assert any(t.type == "vibrato" for t in techs)

def test_extract_palm_mute():
    note = _make_gp_note(_make_note_effect(palmMute=True))
    techs = _extract_techniques(note)
    assert any(t.type == "palm_mute" for t in techs)

def test_extract_dead_note():
    note = _make_gp_note(_make_note_effect(deadNote=True))
    techs = _extract_techniques(note)
    assert any(t.type == "mute" for t in techs)

def test_extract_bend():
    bend = MagicMock()
    point = MagicMock()
    point.value = 100  # pyguitarpro: 100 = full step
    bend.points = [point]
    note = _make_gp_note(_make_note_effect(bend=bend))
    techs = _extract_techniques(note)
    bend_tech = [t for t in techs if t.type == "bend"][0]
    assert bend_tech.value == 1.0  # 100/100 = 1 full step

def test_extract_tie():
    note = _make_gp_note(note_type=guitarpro.NoteType.tie)
    assert _extract_tie(note) == "end"

def test_extract_no_tie():
    note = _make_gp_note(note_type=guitarpro.NoteType.normal)
    assert _extract_tie(note) is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_parser_gp5.py -v`
Expected: ImportError

- [ ] **Step 3: Implement parser_gp5.py**

```python
# gp2tab/parser_gp5.py
"""Parser for GP3/4/5 files using pyguitarpro library."""
import guitarpro
from typing import List, Tuple
from gp2tab.models import Song, Bar, Note, Technique, Section
from gp2tab.utils import midi_to_note_name, duration_beats

_DURATION_MAP = {
    guitarpro.Duration.whole: "whole",
    guitarpro.Duration.half: "half",
    guitarpro.Duration.quarter: "quarter",
    guitarpro.Duration.eighth: "eighth",
    guitarpro.Duration.sixteenth: "16th",
    guitarpro.Duration.thirtySecond: "32nd",
}
# pyguitarpro uses integer values for duration: -2=whole, -1=half, 0=quarter, 1=eighth, etc.
# Map via the value attribute
_DUR_VALUE_MAP = {
    -2: "whole", -1: "half", 0: "quarter",
    1: "eighth", 2: "16th", 3: "32nd",
}

def parse_gp5(filepath: str, track_index: int = 0) -> Song:
    """Parse a GP3/4/5 file via pyguitarpro."""
    gp_song = guitarpro.parse(filepath)
    track = gp_song.tracks[track_index]

    # Tuning
    tuning = [midi_to_note_name(s.value) for s in track.strings]
    # pyguitarpro strings are ordered high to low; we need low to high
    tuning.reverse()

    tempo = gp_song.tempo.value if hasattr(gp_song.tempo, 'value') else int(gp_song.tempo)
    title = gp_song.title or ""
    artist = gp_song.artist or ""

    bars = []
    for i, measure_header in enumerate(gp_song.measureHeaders):
        bar_num = i + 1
        time_sig = f"{measure_header.timeSignature.numerator}/{measure_header.timeSignature.denominator.value}"
        measure = track.measures[i]

        all_notes = []
        for voice in measure.voices:
            current_beat = 1.0
            for beat in voice.beats:
                dur_value = beat.duration.value
                dur_name = _DUR_VALUE_MAP.get(dur_value, "quarter")
                dotted = beat.duration.isDotted
                tuplet_data = None
                if beat.duration.tuplet and beat.duration.tuplet.enters != beat.duration.tuplet.times:
                    tuplet_data = {
                        "actual": beat.duration.tuplet.enters,
                        "normal": beat.duration.tuplet.times,
                    }

                beat_length = duration_beats(dur_name, dotted)
                if tuplet_data:
                    beat_length = beat_length * tuplet_data["normal"] / tuplet_data["actual"]

                for gp_note in beat.notes:
                    techniques = _extract_techniques(gp_note)
                    tie = _extract_tie(gp_note)
                    string_num = gp_note.string  # pyguitarpro already 1-indexed high-to-low

                    note = Note(
                        string=string_num,
                        fret=gp_note.value,
                        beat=round(current_beat, 4),
                        duration=dur_name,
                        dotted=dotted,
                        techniques=techniques,
                        tie=tie,
                        tuplet=tuplet_data,
                        grace=beat.effect.isGrace if hasattr(beat.effect, 'isGrace') else False,
                    )
                    all_notes.append(note)

                current_beat += beat_length

        all_notes.sort(key=lambda n: (n.beat, n.string))
        tempo_change = None
        if measure_header.tempo and measure_header.tempo.value != tempo:
            tempo_change = measure_header.tempo.value

        bars.append(Bar(
            number=bar_num,
            time_signature=time_sig,
            notes=all_notes,
            tempo=tempo_change,
        ))

    return Song(
        title=title, artist=artist, tuning=tuning,
        tempo=tempo, bars=bars,
    )

def _extract_techniques(gp_note) -> list:
    techniques = []
    eff = gp_note.effect
    if eff.bend:
        # pyguitarpro bend points: list of (position, value, vibrato)
        # value is in units where 100 = 1 whole step (same convention as GP XML / 100)
        peak = max(p.value for p in eff.bend.points) if eff.bend.points else 0
        value = round(peak / 100.0, 1)  # convert to steps
        if value <= 0:
            value = 1.0  # default to full step per spec error handling
        techniques.append(Technique(type="bend", value=value))
    if eff.hammer:
        techniques.append(Technique(type="hammer"))
    if hasattr(eff, 'slide') and eff.slide:
        techniques.append(Technique(type="slide_up"))  # direction hard to determine from GP5
    if eff.vibrato:
        techniques.append(Technique(type="vibrato"))
    if eff.harmonic:
        if eff.harmonic.type == guitarpro.NaturalHarmonic:
            techniques.append(Technique(type="harmonic_natural"))
        else:
            techniques.append(Technique(type="harmonic_pinch"))
    if eff.palmMute:
        techniques.append(Technique(type="palm_mute"))
    if eff.ghostNote or eff.deadNote:
        techniques.append(Technique(type="mute"))
    return techniques

def _extract_tie(gp_note) -> str:
    if gp_note.type == guitarpro.NoteType.tie:
        return "end"  # simplified: pyguitarpro marks tied-to notes
    return None

def list_tracks_gp5(filepath: str) -> list:
    gp_song = guitarpro.parse(filepath)
    return [(i, t.name) for i, t in enumerate(gp_song.tracks)]
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/gp2tab/parser_gp5.py
git commit -m "feat(gp2tab): add GP3/4/5 parser via pyguitarpro"
```

---

## Task 4: JSON formatter

**Files:**
- Create: `gp2tab/gp2tab/formatter_json.py`
- Create: `gp2tab/tests/test_formatter_json.py`

- [ ] **Step 1: Write tests for JSON formatter**

```python
# tests/test_formatter_json.py
import json
from gp2tab.formatter_json import format_json

def test_json_structure(sample_song):
    result = json.loads(format_json(sample_song))
    assert result["title"] == "Test Solo"
    assert result["artist"] == "Test Artist"
    assert result["tuning"] == ["E", "A", "D", "G", "B", "e"]
    assert result["tempo"] == 128
    assert result["total_bars"] == 2
    assert len(result["bars"]) == 2

def test_json_note_fields(sample_song):
    result = json.loads(format_json(sample_song))
    note = result["bars"][0]["notes"][0]
    assert note["string"] == 2
    assert note["fret"] == 15
    assert note["beat"] == 1.0
    assert note["duration"] == "eighth"
    assert note["dotted"] is False
    assert note["tie"] is None
    assert note["tuplet"] is None
    assert note["grace"] is False

def test_json_techniques(sample_song):
    result = json.loads(format_json(sample_song))
    bend_note = result["bars"][0]["notes"][2]
    assert len(bend_note["techniques"]) == 1
    assert bend_note["techniques"][0]["type"] == "bend"
    assert bend_note["techniques"][0]["value"] == 0.5

def test_json_rest_bar(rest_bars_song):
    result = json.loads(format_json(rest_bars_song))
    assert result["bars"][0]["is_rest"] is True
    assert result["bars"][0]["notes"] == []

def test_json_sections(sample_song):
    result = json.loads(format_json(sample_song))
    assert len(result["sections"]) == 1
    assert result["sections"][0]["name"] == "Intro"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_formatter_json.py -v`

- [ ] **Step 3: Implement formatter_json.py**

```python
# gp2tab/formatter_json.py
"""Format Song model as structured JSON."""
import json
from gp2tab.models import Song

def format_json(song: Song) -> str:
    """Convert Song to JSON string."""
    data = {
        "title": song.title,
        "artist": song.artist,
        "tuning": song.tuning,
        "tempo": song.tempo,
        "total_bars": len(song.bars),
        "sections": [
            {"name": s.name, "start_bar": s.start_bar, "end_bar": s.end_bar}
            for s in song.sections
        ],
        "bars": [_bar_to_dict(bar) for bar in song.bars],
    }
    return json.dumps(data, indent=2)

def _bar_to_dict(bar):
    d = {
        "number": bar.number,
        "time_signature": bar.time_signature,
        "is_rest": bar.is_rest,
        "is_partial": bar.is_partial,
        "notes": [_note_to_dict(n) for n in bar.notes],
        "warnings": bar.warnings,
    }
    if bar.tempo is not None:
        d["tempo"] = bar.tempo
    if bar.section is not None:
        d["section"] = bar.section
    return d

def _note_to_dict(note):
    return {
        "beat": note.beat,
        "string": note.string,
        "fret": note.fret,
        "duration": note.duration,
        "dotted": note.dotted,
        "techniques": [
            {"type": t.type, "value": t.value}
            for t in note.techniques
        ],
        "tie": note.tie,
        "tuplet": note.tuplet,
        "grace": note.grace,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_formatter_json.py -v`

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/
git commit -m "feat(gp2tab): add JSON formatter"
```

---

## Task 5: LLM text formatter

**Files:**
- Create: `gp2tab/gp2tab/formatter_llm.py`
- Create: `gp2tab/tests/test_formatter_llm.py`

- [ ] **Step 1: Write tests for LLM formatter**

```python
# tests/test_formatter_llm.py
from gp2tab.formatter_llm import format_llm

def test_llm_header(sample_song):
    result = format_llm(sample_song)
    assert "SONG: Test Solo" in result
    assert "ARTIST: Test Artist" in result
    assert "TUNING: E A D G B e" in result
    assert "TEMPO: 128 BPM" in result
    assert "BARS: 2" in result

def test_llm_note_format(sample_song):
    result = format_llm(sample_song)
    # Should contain string:fret format with string names
    assert "B:15" in result
    assert "B:17" in result
    assert "G:14" in result

def test_llm_techniques(sample_song):
    result = format_llm(sample_song)
    assert "bend(1/2)" in result
    assert "hammer" in result
    assert "vibrato" in result

def test_llm_section_header(sample_song):
    result = format_llm(sample_song)
    assert "[Intro]" in result

def test_llm_rest_collapse(rest_bars_song):
    result = format_llm(rest_bars_song)
    assert "BAR 1-3" in result
    assert "REST" in result

def test_llm_tie_notation(sample_song):
    result = format_llm(sample_song)
    assert "tie>" in result  # tie start
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_formatter_llm.py -v`

- [ ] **Step 3: Implement formatter_llm.py**

```python
# gp2tab/formatter_llm.py
"""Format Song model as LLM-optimized condensed text."""
from gp2tab.models import Song, Bar, Note
from gp2tab.utils import string_name

def format_llm(song: Song) -> str:
    lines = []
    lines.append(f"SONG: {song.title}")
    lines.append(f"ARTIST: {song.artist}")
    lines.append(f"TUNING: {' '.join(song.tuning)}")
    lines.append(f"TEMPO: {song.tempo} BPM")
    ts = song.bars[0].time_signature if song.bars else "4/4"
    lines.append(f"TIME: {ts}")
    lines.append(f"BARS: {len(song.bars)}")
    lines.append("")

    i = 0
    while i < len(song.bars):
        bar = song.bars[i]
        if bar.is_rest:
            # Collapse consecutive rests
            j = i
            while j < len(song.bars) and song.bars[j].is_rest:
                j += 1
            if j - i > 1:
                lines.append(f"=== BAR {bar.number}-{song.bars[j-1].number} === REST")
            else:
                lines.append(f"=== BAR {bar.number} === REST")
            lines.append("")
            i = j
            continue

        header = f"=== BAR {bar.number} ==="
        if bar.section:
            header += f" [{bar.section}]"
        if bar.warnings:
            header += f" WARNING: {bar.warnings[0]}"
        lines.append(header)

        for note in bar.notes:
            parts = []
            parts.append(f"{note.beat:<6}")
            sname = string_name(note.string, song.tuning)
            parts.append(f"{sname}:{note.fret}")
            parts.append(note.duration)
            if note.dotted:
                parts.append("dotted")
            for tech in note.techniques:
                if tech.type in ("bend", "bend_release", "pre_bend", "pre_bend_release") and tech.value is not None:
                    parts.append(f"{tech.type}({_format_bend_value(tech.value)})")
                else:
                    parts.append(tech.type)
            if note.tie == "start":
                parts.append("tie>")
            elif note.tie == "continue":
                parts.append("<tie>")
            elif note.tie == "end":
                parts.append("<tie")
            if note.tuplet:
                parts.append("triplet" if note.tuplet.get("actual") == 3 else
                           f"tuplet({note.tuplet['actual']}:{note.tuplet['normal']})")
            if note.grace:
                parts.append("grace")
            lines.append("  ".join(parts))

        lines.append("")
        i += 1

    return "\n".join(lines)

def _format_bend_value(value: float) -> str:
    if value == 0.5:
        return "1/2"
    elif value == 1.0:
        return "1"
    elif value == 1.5:
        return "1 1/2"
    elif value == 2.0:
        return "2"
    else:
        return str(value)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_formatter_llm.py -v`

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/
git commit -m "feat(gp2tab): add LLM text formatter"
```

---

## Task 6: ASCII tab formatter

**Files:**
- Create: `gp2tab/gp2tab/formatter_tab.py`
- Create: `gp2tab/tests/test_formatter_tab.py`

This is the most complex formatter. It must:
1. Render a header with title, tuning, tempo, legend
2. Lay out notes on 6 string lines with beat markers above
3. Handle technique annotations inline
4. Fit bars within the line width (default 120), wrapping to new systems
5. Never wrap a string line mid-bar

- [ ] **Step 1: Write tests for ASCII tab header**

```python
# tests/test_formatter_tab.py
from gp2tab.formatter_tab import format_tab

def test_tab_header(sample_song):
    result = format_tab(sample_song)
    assert "Test Solo" in result
    assert "Test Artist" in result
    assert "Tuning: E A D G B e" in result
    assert "Tempo: 128 BPM" in result
    assert "LEGEND:" in result

def test_tab_string_names(sample_song):
    result = format_tab(sample_song)
    lines = result.split("\n")
    # Find string lines (contain |)
    string_lines = [l for l in lines if l.startswith("e|") or l.startswith("B|")
                    or l.startswith("G|") or l.startswith("D|")
                    or l.startswith("A|") or l.startswith("E|")]
    assert len(string_lines) >= 6  # at least one system of 6 strings
```

- [ ] **Step 2: Write tests for note rendering**

```python
def test_tab_fret_numbers(sample_song):
    result = format_tab(sample_song)
    assert "15" in result
    assert "17" in result
    assert "14" in result

def test_tab_techniques(sample_song):
    result = format_tab(sample_song)
    assert "b(1/2)" in result or "b(" in result  # bend notation
    assert "h" in result   # hammer
    assert "~" in result   # vibrato

def test_tab_bar_labels(sample_song):
    result = format_tab(sample_song)
    assert "Bar 1" in result
    assert "Bar 2" in result
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_formatter_tab.py -v`

- [ ] **Step 4: Implement formatter_tab.py**

The formatter works in phases:
1. **Render header** — title block and legend
2. **Render each bar** into a "bar buffer" — a dict with keys: beat_markers (str), strings 1-6 (str each), width (int)
3. **Pack bars into systems** — greedily fit bars into lines of max `width` characters
4. **Output systems** — beat markers line, then 6 string lines (e, B, G, D, A, E top to bottom)

Bar buffer rendering algorithm:
- Calculate column positions for each unique beat position in the bar
- Minimum spacing: 3 chars between notes (more for multi-char items like "15b(1/2)")
- For each note, write fret number + technique suffix at the correct column on the correct string
- Fill gaps with dashes
- Prepend bar separator `|`

Technique rendering per the spec:
- bend: `b(1/2)`, `b(1)`, `b(1 1/2)`, `b(2)`
- bend_release: `br(1)`
- pre_bend: `pb(1)`
- pre_bend_release: `pbr(1)`
- hammer: append `h` after fret
- pull: append `p` after fret
- slide_up: append `/`
- slide_down: append `\`
- vibrato: append `~` (repeat to fill)
- tie: render as `(fret)` instead of plain fret
- tap: prepend `t`
- mute: `x` instead of fret
- palm_mute: `PM` annotation
- natural harmonic: `NH`
- pinch harmonic: `PH`
- tremolo_pick: `tp`
- trill: `tr`
- let_ring: `LR`

```python
# gp2tab/formatter_tab.py
"""Format Song model as ASCII tab."""
from gp2tab.models import Song, Bar, Note
from gp2tab.utils import string_name

def format_tab(song: Song, width: int = 120) -> str:
    lines = []
    lines.append(_render_header(song))
    lines.append("")

    bar_buffers = [_render_bar(bar, song.tuning) for bar in song.bars]

    # Pack into systems
    system = []
    system_width = 2  # leading string name + |
    for buf in bar_buffers:
        needed = buf["width"] + 1  # +1 for closing |
        if system and system_width + needed > width:
            lines.append(_render_system(system, song.tuning))
            lines.append("")
            system = []
            system_width = 2
        system.append(buf)
        system_width += buf["width"]
    if system:
        lines.append(_render_system(system, song.tuning))
        lines.append("")

    return "\n".join(lines)
```

The full implementation should be ~150-200 lines covering the rendering logic. The implementor should build it iteratively: get the header + basic note layout working first, then add technique rendering, then handle spacing edge cases.

Key implementation details for `_render_bar`:
- Collect all unique beat positions, sort them
- Assign column offsets: each beat position gets a column. Minimum column width = max content width at that position + 1 (padding dash).
- Build string content arrays (one per string, filled with dashes)
- Place fret numbers + technique annotations at correct positions
- For tied notes, render as `(fret)` — the parentheses count toward width

Key implementation details for `_render_system`:
- Concatenate bar buffers horizontally
- Add closing `|` at the end of each system
- Beat markers line above: `Bar N` label at start of each bar's columns, beat numbers (1, 2, 3, 4) at appropriate columns

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/test_formatter_tab.py -v`

- [ ] **Step 6: Visual verification with real data**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -c "
from gp2tab.parser import parse
from gp2tab.formatter_tab import format_tab
song = parse('../songs/guthrie-govan/man-of-steel/Guthrie Hans.gp')
print(format_tab(song)[:2000])
"`

Visually inspect the output. Fix alignment issues, spacing, technique rendering.

- [ ] **Step 7: Commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/
git commit -m "feat(gp2tab): add ASCII tab formatter"
```

---

## Task 7: CLI entry point and __main__.py

**Files:**
- Create: `gp2tab/cli.py`, `gp2tab/gp2tab/__main__.py`

- [ ] **Step 1: Implement cli.py**

```python
# gp2tab/cli.py
"""CLI entry point for gp2tab."""
import argparse
import os
import sys
from gp2tab.parser import parse, list_tracks
from gp2tab.formatter_tab import format_tab
from gp2tab.formatter_json import format_json
from gp2tab.formatter_llm import format_llm

def main():
    parser = argparse.ArgumentParser(description="Convert Guitar Pro files to tab formats")
    parser.add_argument("file", help="Guitar Pro file (.gp, .gp3, .gp4, .gp5, .gpx)")
    parser.add_argument("-o", "--output", help="Output directory (default: same as input file)")
    parser.add_argument("--width", type=int, default=120, help="ASCII tab line width (default: 120)")
    parser.add_argument("--track", type=int, default=1, help="Track number (default: 1)")
    parser.add_argument("--format", default="tab,json,llm",
                        help="Output formats, comma-separated (default: tab,json,llm)")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, don't write files")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    # List tracks
    tracks = list_tracks(args.file)
    if len(tracks) > 1:
        print(f"Found {len(tracks)} tracks:")
        for i, name in tracks:
            marker = " <--" if i == args.track - 1 else ""
            print(f"  {i+1}. {name}{marker}")
        print(f"Using track {args.track}. Use --track N to select a different track.")
        print()

    track_index = args.track - 1
    song = parse(args.file, track_index)

    # Summary
    fmt_name = "GP7/8 (ZIP+XML)" if args.file.endswith(('.gp', '.gpx')) else "GP3/4/5"
    track_name = tracks[track_index][1] if track_index < len(tracks) else "Unknown"
    total_notes = sum(len(b.notes) for b in song.bars)
    total_warnings = sum(len(b.warnings) for b in song.bars)
    tuning_label = " ".join(song.tuning)

    print(f"Parsed: {song.title} — {song.artist}")
    print(f"Format: {fmt_name}")
    print(f"Track:  {track_name} (Track {args.track})")
    print(f"Bars:   {len(song.bars)}  |  Tempo: {song.tempo} BPM  |  Tuning: {tuning_label}")
    print(f"Notes:  ~{total_notes}  |  Warnings: {total_warnings}")
    print()

    if args.dry_run:
        print("Dry run — no files written.")
        return

    out_dir = args.output or os.path.dirname(os.path.abspath(args.file))
    os.makedirs(out_dir, exist_ok=True)

    formats = [f.strip() for f in args.format.split(",")]
    print("Written:")

    if "tab" in formats:
        tab_text = format_tab(song, width=args.width)
        path = os.path.join(out_dir, "tab.txt")
        with open(path, "w") as f:
            f.write(tab_text)
        lines = tab_text.count("\n")
        print(f"  -> tab.txt      (ASCII tab, {args.width} char width)")

    if "json" in formats:
        json_text = format_json(song)
        path = os.path.join(out_dir, "tab.json")
        with open(path, "w") as f:
            f.write(json_text)
        print(f"  -> tab.json     (structured data, {len(song.bars)} bars)")

    if "llm" in formats:
        llm_text = format_llm(song)
        path = os.path.join(out_dir, "tab.llm.txt")
        with open(path, "w") as f:
            f.write(llm_text)
        llm_lines = llm_text.count("\n")
        print(f"  -> tab.llm.txt  (LLM-optimized, {llm_lines} lines)")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Create __main__.py**

```python
# gp2tab/gp2tab/__main__.py
"""Allow running as `python -m gp2tab` from the gp2tab/ project directory."""
import runpy
import sys
import os

# Ensure the project root (parent of gp2tab package) is on sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from cli import main
main()
```

Note: The primary entry point is `python cli.py`. The `__main__.py` only exists for `python -m gp2tab` convenience.

- [ ] **Step 3: Integration test with real GP file**

Run: `cd /Users/leo/hobby/tab/gp2tab && python cli.py "../songs/guthrie-govan/man-of-steel/Guthrie Hans.gp" --dry-run`

Expected: Summary output with 68 bars, 128 BPM, standard tuning.

Run: `cd /Users/leo/hobby/tab/gp2tab && python cli.py "../songs/guthrie-govan/man-of-steel/Guthrie Hans.gp" -o /tmp/gp2tab-test/`

Expected: Three files written to /tmp/gp2tab-test/. Visually inspect each.

- [ ] **Step 4: Commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/
git commit -m "feat(gp2tab): add CLI entry point and __main__.py"
```

---

## Task 8: Integration testing and polish

**Files:**
- Modify: various files for bug fixes found during integration testing

- [ ] **Step 1: Run full test suite**

Run: `cd /Users/leo/hobby/tab/gp2tab && python -m pytest tests/ -v`

Fix any failures.

- [ ] **Step 2: Run against real GP file and inspect all 3 outputs**

```bash
cd /Users/leo/hobby/tab/gp2tab
python cli.py "../songs/guthrie-govan/man-of-steel/Guthrie Hans.gp" -o /tmp/gp2tab-test/
cat /tmp/gp2tab-test/tab.txt | head -60
cat /tmp/gp2tab-test/tab.llm.txt | head -40
python -c "import json; d=json.load(open('/tmp/gp2tab-test/tab.json')); print(f'Bars: {d[\"total_bars\"]}, Notes in bar 4: {len(d[\"bars\"][3][\"notes\"])}')"
```

Look for:
- Beat alignment in ASCII tab
- Correct string names (never numbers)
- Bend notation accuracy
- Tied notes showing as `(fret)`
- Technique annotations
- Rest bars collapsed in LLM output

Fix issues as found.

- [ ] **Step 3: Create README.md**

Brief README with usage examples matching the spec's CLI interface section.

- [ ] **Step 4: Final commit**

```bash
cd /Users/leo/hobby/tab && git add gp2tab/
git commit -m "feat(gp2tab): integration testing, polish, and README"
```
