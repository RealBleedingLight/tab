# Guitar Teacher

A local CLI tool that analyzes Guitar Pro files and generates structured lesson plans with music theory context. Built for guitarists who learn solos through transcriptions.

## Features

- **Theory Reference** — Look up scales, chords, intervals, key signatures, and diatonic harmony from the command line
- **ASCII Fretboard** — Visualize any scale or chord on a fretboard diagram
- **Solo Analysis** — Analyze GP/JSON files: detect key, map techniques, score difficulty per section
- **Lesson Generation** — Auto-generate self-contained, numbered lesson plans with warm-ups, steps, checkpoints
- **LLM Enhancement** — Optionally polish generated lessons with Claude, OpenAI, or Ollama

## Installation

```bash
# From the tab repo root:
pip install -e ./gp2tab
pip install -e ./guitar-teacher

# With LLM support:
pip install -e "./guitar-teacher[llm]"
```

## Quick Start

### Theory Reference

```bash
guitar-teacher scale D dorian
guitar-teacher chord Am7
guitar-teacher key C major
guitar-teacher identify-key D E F G A Bb C
guitar-teacher suggest-scales Dm7 G7 Cmaj7
guitar-teacher interval C E
```

### Analyze a Solo

```bash
guitar-teacher analyze song.gp
guitar-teacher analyze song.json
guitar-teacher analyze multi-track.gp --track 2
```

### Generate Lessons

```bash
guitar-teacher lessons song.gp -o output/
guitar-teacher lessons song.json -o output/ --enhance --provider claude
```

This generates:
- `lessons/` — Numbered, self-contained lesson files (technique intros, section lessons, assembly, performance)
- `theory.md` — Scale and key analysis
- `breakdown.md` — Technique inventory and difficulty map
- `practice.md` — Phased practice plan with tempo milestones
- `.context.md` — Progress tracker (for use with Claude Code practice sessions)
- `practice-log.md` — Append-only session log

## Theory Data

The knowledge base lives in `theory/` as YAML files:
- `scales.yaml` — 21 scales (modes, pentatonics, exotic scales)
- `chords.yaml` — 23 chord types with voicings
- `intervals.yaml` — All 12 chromatic intervals
- `techniques.yaml` — 14 guitar techniques with teaching notes

Add new scales/chords/techniques by editing these files.

## LLM Enhancement

Set up a config file at `~/.guitar-teacher/config.yaml`:

```yaml
llm:
  provider: claude  # or openai, ollama
  model: claude-sonnet-4-6
  api_key_env: ANTHROPIC_API_KEY  # env var containing your API key
```

Or pass options directly: `--enhance --provider ollama --model llama3.1`

## Project Structure

```
guitar-teacher/
├── guitar_teacher/
│   ├── cli.py              # Click CLI
│   ├── config.py           # Config loading
│   ├── core/
│   │   ├── note_utils.py   # Pitch math
│   │   ├── models.py       # All dataclasses
│   │   ├── theory.py       # TheoryEngine
│   │   ├── fretboard.py    # ASCII renderer
│   │   └── analyzer.py     # Solo analysis pipeline
│   ├── lessons/
│   │   ├── generator.py    # Lesson plan builder
│   │   └── templates.py    # Jinja2 renderer
│   └── llm/
│       ├── providers.py    # LLM abstraction
│       └── enhancer.py     # Post-processor
├── theory/                 # YAML knowledge base
│   ├── scales.yaml
│   ├── chords.yaml
│   ├── intervals.yaml
│   ├── techniques.yaml
│   └── lesson_templates/   # Jinja2 templates
└── tests/                  # 78 tests
```
