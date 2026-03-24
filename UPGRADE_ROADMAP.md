# Guitar Teacher — Upgrade Roadmap

This file tracks planned future upgrades beyond the current CLI + data-file architecture.

## Phase 2: Web UI

- Build a local web frontend (likely Flask or FastAPI + vanilla JS or Svelte)
- Interactive clickable fretboard — click notes to hear them, highlight scales/chords
- Visual lesson viewer with progress tracking
- Chord/scale diagrams rendered as SVG instead of ASCII
- Side-by-side tab view with analysis annotations
- Practice session timer with built-in metronome

## Phase 3: Plugin Architecture

- Evolve from Approach B (engine + data files) to Approach C (plugin system)
- Each module (scales, chords, rhythm, ear training) becomes a self-registering plugin
- New modules can be dropped in as folders without modifying core code
- Plugin API for community contributions
- Potential modules:
  - Ear training exercises
  - Rhythm pattern generator
  - Backing track suggestions
  - Sight-reading exercises
  - Progress analytics dashboard

## Phase 4: Fretboard Enhancements

- CAGED position-based scale views (show scale in individual positions, not just full fretboard)
- 3-note-per-string scale patterns with fingering suggestions
- Position boundary logic and fingering choice algorithm

## Phase 5: Advanced Analysis

- Audio analysis / ear training integration
- Rhythm / strumming pattern generation
- Multi-instrument support (bass tabs, etc.)
- Chord progression detection from GP files (rhythm guitar track analysis)

## Phase 6: LLM Expansion

- `config set` CLI subcommand for easier config editing without opening YAML
- LLM-powered theory expansion: ask an LLM to generate new scales.yaml / chords.yaml entries for exotic scales or rare chord voicings
- LLM-powered interactive Q&A mode: ask questions about a solo mid-practice and get answers grounded in the analysis data
- Fine-tuned local model specifically trained on guitar pedagogy
