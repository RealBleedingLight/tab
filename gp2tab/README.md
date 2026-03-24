# gp2tab

Convert Guitar Pro files (GP3-8) into ASCII tab, structured JSON, and LLM-optimized text.

## Usage

```bash
# Basic — outputs tab.txt, tab.json, tab.llm.txt next to input file
python3 cli.py "Guthrie Hans.gp"

# Specify output directory
python3 cli.py "Guthrie Hans.gp" -o songs/guthrie-govan/man-of-steel/

# Custom line width for ASCII tab
python3 cli.py "Guthrie Hans.gp" --width 140

# Select specific track (for multi-track files)
python3 cli.py "Guthrie Hans.gp" --track 1

# Parse and validate only, don't write files
python3 cli.py "Guthrie Hans.gp" --dry-run

# Output only specific formats
python3 cli.py "Guthrie Hans.gp" --format tab,json
```

Or run as a module:

```bash
python3 -m gp2tab "Guthrie Hans.gp"
```

## Output Formats

- **tab.txt** — Human-readable ASCII tab with beat markers and technique annotations
- **tab.json** — Structured JSON for software consumption (lesson generators, web APIs)
- **tab.llm.txt** — Condensed text optimized for feeding to Claude/Sonnet

## Requirements

- Python 3.8+
- `pyguitarpro` (for GP3/4/5 files only)

```bash
pip3 install -r requirements.txt
```

## Supported Formats

| Format | Parser |
|--------|--------|
| GP3, GP4, GP5 | pyguitarpro |
| GP6, GP7, GP8 | Built-in ZIP+XML parser |

## Running Tests

```bash
cd gp2tab
python3 -m pytest tests/ -v
```
