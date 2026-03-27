# Guitar Teacher — Upgrade Roadmap

This file tracks planned future upgrades to the Guitar Teacher platform.

## Current State

The following has been built and deployed as of March 2026:

- **gp2tab** — Guitar Pro file parser, generates ASCII tab and structured analysis data
- **guitar-teacher CLI** — Local command-line tool for scale/chord/key queries and lesson generation
- **FastAPI backend** — REST API deployed on Railway, handles GP file processing via gp2tab
- **Next.js web frontend** — Deployed on Vercel, provides a full web UI with:
  - Upload queue: upload GP files, process, delete
  - Dashboard: browse processed songs
  - Practice page: 4-tab layout (Lesson, Tab, Theory, Breakdown)
  - GitHub-backed storage for all song data

---

## Phase 2: Web UI — DONE

- FastAPI backend + Next.js frontend web platform
- Deployed on Railway (backend) and Vercel (frontend)
- GP file upload, processing pipeline, and GitHub storage
- Practice page with Lesson, Tab, Theory, and Breakdown tabs

---

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
