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
