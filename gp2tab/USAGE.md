# gp2tab Usage Guide

## What It Does

Converts Guitar Pro files (GP3 through GP8) into three output formats:

- **tab.txt** — Human-readable ASCII tab with beat markers and technique annotations
- **tab.json** — Structured JSON for software consumption (lesson generators, web APIs)
- **tab.llm.txt** — Condensed text optimized for feeding to Claude for lesson generation

## Requirements

- Python 3.8+
- `pyguitarpro` (only needed for GP3/4/5 files)

```bash
pip3 install -r requirements.txt
```

## CLI Usage

Run from the `gp2tab/` directory:

```bash
# Basic — writes all 3 files next to the input file
python3 cli.py "path/to/file.gp"

# Output to a specific directory
python3 cli.py "file.gp" -o output/folder/

# Preview parse results without writing files
python3 cli.py "file.gp" --dry-run

# Only generate specific formats (any combo of: tab, json, llm)
python3 cli.py "file.gp" --format tab,llm

# Wider ASCII tab lines (default: 120 chars)
python3 cli.py "file.gp" --width 140

# Select a different track in multi-track files
python3 cli.py "file.gp" --track 2
```

Also works as a Python module:

```bash
python3 -m gp2tab "file.gp" --dry-run
```

## Library Usage

```python
from gp2tab.parser import parse
from gp2tab.formatter_tab import format_tab
from gp2tab.formatter_json import format_json
from gp2tab.formatter_llm import format_llm

song = parse("path/to/file.gp")

ascii_tab = format_tab(song, width=120)
json_data = format_json(song)
llm_text  = format_llm(song)
```

The `Song` model returned by `parse()` contains:
- `title`, `artist`, `tuning`, `tempo`
- `bars` — list of `Bar` objects, each with `notes`, `time_signature`, `warnings`
- `sections` — list of `Section` objects (from GP rehearsal marks)

Each `Note` has: `string` (1=highest), `fret`, `beat`, `duration`, `techniques`, `tie`, `tuplet`, `grace`

## Supported Techniques

All rendered in ASCII tab and LLM text:

| Technique | ASCII | LLM |
|-----------|-------|-----|
| Bend (half step) | `17b(1/2)` | `bend(1/2)` |
| Bend (full step) | `17b(1)` | `bend(1)` |
| Bend & release | `17br(1)` | `bend_release(1)` |
| Pre-bend | `17pb(1)` | `pre_bend(1)` |
| Hammer-on | `14h` | `hammer` |
| Pull-off | `16p` | `pull` |
| Slide up/down | `14/` or `14\` | `slide_up` / `slide_down` |
| Vibrato | `13~~` | `vibrato` |
| Tied note | `(17)` | `<tie` / `tie>` / `<tie>` |
| Tap | `t12` | `tap` |
| Muted note | `x` | `mute` |
| Palm mute | `PM` | `palm_mute` |
| Natural harmonic | `<12>` | `harmonic_natural` |
| Pinch harmonic | `PH` | `harmonic_pinch` |
| Tremolo picking | `tp` | `tremolo_pick` |
| Trill | `tr` | `trill` |
| Let ring | `LR` | `let_ring` |

## Supported GP Formats

| Format | How It's Parsed |
|--------|----------------|
| GP3, GP4, GP5 | Via `pyguitarpro` library |
| GP6, GP7, GP8 | Built-in ZIP+XML parser (reads `Content/score.gpif`) |

## Running Tests

```bash
cd gp2tab
python3 -m pytest tests/ -v
```

53 tests covering models, utils, XML parser, GP5 parser, and all three formatters.

## Architecture

```
GP file → parser (format detection) → Song model → formatter → output file
```

- `parser.py` detects format (ZIP = GP6-8, binary = GP3-5) and dispatches
- `parser_gp_xml.py` handles GP6/7/8 by parsing `Content/score.gpif` XML
- `parser_gp5.py` handles GP3/4/5 via pyguitarpro
- Both normalize into the same `Song` model (defined in `models.py`)
- Three independent formatters produce output — changing one never affects another
