# Guitar Teacher Web Platform — Design Spec

## Overview

Transform the guitar-teacher CLI tool into a web-accessible platform that lets Leo practice guitar lessons, look up theory, upload new songs, and track progress from any device. The existing Python codebase (analysis, theory engine, lesson generation) is preserved and wrapped in a FastAPI backend. A Next.js frontend on Vercel provides the UI. AI models (Claude, Gemini, GPT, etc.) can be used for lesson enrichment via a structured pipeline with quality validation.

## Architecture

```
+-------------------------------------+
|      Next.js Frontend (Vercel)      |
|  - Practice session UI              |
|  - Theory lookup / fretboard        |
|  - Dashboard / progress             |
|  - GP file upload queue             |
|  - Pin auth middleware              |
+-----------------+-------------------+
                  | REST API
+-----------------v-------------------+
|      Python Backend (FastAPI)       |
|  - guitar-teacher core (as-is)     |
|  - Analysis endpoint               |
|  - Lesson generation endpoint       |
|  - AI model routing + quality gate  |
|  - Theory query endpoints           |
+-----------------+-------------------+
                  | GitHub API
+-----------------v-------------------+
|    GitHub Repo (source of truth)    |
|  - songs/ lessons/ .context.md      |
|  - practice-log.md                  |
|  - queue/ (pending GP files)        |
+-------------------------------------+
```

### Key architectural decisions

- **GitHub repo is the single source of truth.** No database. All state (lessons, progress, practice logs) lives in the git repo as markdown files.
- **GitHub API calls happen from the Python backend only.** The frontend never touches GitHub directly. GitHub token stays server-side.
- **The existing CLI still works.** FastAPI wraps the same functions — no code duplication.
- **GP files in the queue live in the repo** under `queue/` so they're visible and backed up from any device.

## Python Backend (FastAPI)

Hosted on Railway (persistent process, no timeout limits). Wraps existing guitar-teacher code.

### Theory endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/theory/scale/{root}/{type}` | Scale lookup + fretboard data |
| GET | `/theory/chord/{name}` | Chord lookup |
| GET | `/theory/key/{root}/{type}` | Diatonic chords in a key |
| GET | `/theory/identify-key` | Detect key from notes (query param) |
| GET | `/theory/suggest-scales` | Scales for a chord progression (query param) |
| GET | `/theory/interval/{note1}/{note2}` | Interval between two notes |

### Analysis endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze` | Accepts GP file upload directly (for CLI/API use), returns SoloAnalysis JSON |
| POST | `/lessons/generate` | Takes SoloAnalysis + options, generates lessons, commits to repo |

Note: `/analyze` accepts a direct file upload for CLI and API usage. The web UI workflow uses `/queue/upload` + `/queue/process/{filename}` instead, which reads the file from the repo. Both paths use the same underlying `analyze_file()` function.

### AI routing endpoint

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/enhance` | Structured lesson data + model choice, runs enrichment with quality validation |

### Auth endpoint

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Accepts `{ pin: string }`, returns JWT token (24h expiry) |
| GET | `/auth/verify` | Validates current JWT, returns 200 or 401 |

### Health endpoint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns 200 with version info. Used by Railway health checks. |

### Repo endpoints (GitHub API wrapper)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/songs` | List all songs with progress summary |
| GET | `/songs/{artist}/{song}/context` | Read .context.md |
| GET | `/songs/{artist}/{song}/lessons/{number}` | Read a lesson file |
| POST | `/songs/{artist}/{song}/save-progress` | Update .context.md + append practice-log.md, commit |
| GET | `/queue` | List GP files waiting to be processed |
| POST | `/queue/upload` | Upload GP file to queue/ in repo |
| POST | `/queue/process/{filename}` | Analyze + generate lessons for a queued file (long-running, returns job ID) |
| GET | `/queue/status/{job_id}` | Poll lesson generation progress (e.g., "Generating lesson 7 of 22") |

### Environment variables (backend)

- `GITHUB_TOKEN` — personal access token scoped to the tab repo
- `AUTH_PIN` — the login pin (validated server-side only)
- `AUTH_SECRET` — secret key for signing JWT tokens
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`

### CORS configuration

FastAPI CORS middleware must allow the Vercel frontend origin (e.g., `https://guitar-teacher.vercel.app`). Configured via an `ALLOWED_ORIGINS` env var on the backend.

## Next.js Frontend (Vercel)

Mobile-first, dark theme, bottom tab bar navigation (Dashboard, Practice, Theory, Queue).

### Pages

**`/` — Dashboard**
- All songs with progress bars (lessons completed / total)
- Current lesson for each song
- "What to practice today" suggestion based on last session dates
- Quick links to resume any song

**`/practice/{artist}/{song}` — Practice session**
- Current lesson content rendered from markdown
- Step-by-step walkthrough with checkboxes
- Tempo input, notes field
- Manual save button + auto-save indicator ("saved 2 min ago")
- "Complete lesson" button advances .context.md to next lesson

**`/theory` — Theory reference**
- Scale/chord/key lookups with forms
- Interactive SVG fretboard diagram (tap root + scale type, see it highlighted)
- Interval calculator

**`/songs/{artist}/{song}` — Song overview**
- Breakdown, theory, lesson index, practice log history
- Entry point to start or resume practicing

**`/queue` — File shelf**
- Drag-and-drop GP file upload (sent to backend, committed to `queue/` in repo)
- List of queued files with "Process now" button (AI model dropdown)
- Progress indicator during lesson generation ("Generating lesson 7 of 22...") via polling `/queue/status/{job_id}`
- Or leave files for later

**`/settings` — Settings**
- Pin management
- Default AI model preference
- Connected repo info

### Environment variables (frontend)

- `BACKEND_URL` — URL of the FastAPI backend

Note: The pin is validated server-side only. The frontend sends the pin to `POST /auth/login` and stores the returned JWT in a cookie. The pin is never stored on the frontend.

## Tab and Diagram Rendering

### ASCII tab display
- Monospace grid, horizontal scroll on small screens (no wrapping mid-bar)
- Bar numbers and section labels pinned on left during scroll
- Font size adjustable (pinch-to-zoom or +/- control)
- Current lesson's bar range highlighted, rest dimmed

### Fretboard diagrams
- SVG-based with viewBox scaling — adapts to any screen size automatically
- Horizontal orientation on desktop, vertical option on mobile
- Root notes: filled circles. Scale tones: open circles. Note names inside.
- Backend returns note positions as structured data (root, notes, fret ranges). Frontend renders the SVG. This replaces the ASCII fretboard from `core/fretboard.py` in the web context.

### Chord diagrams
- Standard chord box format (vertical grid, dots for fingers, X/O for muted/open)
- SVG with viewBox scaling
- Shows finger positions and note names

### Scaling principle
Everything renders as SVG with viewBox-based scaling. No pixel-based sizing. Tab uses monospace + horizontal scroll as the exception — reflowing tab would break readability.

## AI Lesson Generation Pipeline

### Flow (triggered when processing a queued GP file)

1. **Backend reads GP file from repo** via GitHub API
2. **guitar-teacher analyzer runs** — produces SoloAnalysis (sections, techniques, key, difficulty, practice order). Deterministic, no AI.
3. **Template-based lesson skeletons generated** — existing generator produces structural bones (lesson order, bar ranges, warmups, checkpoints). Available immediately as "free tier" output.
4. **AI enrichment (per-lesson, one API call per lesson):**
   - Prompt includes: tab excerpt for those bars, detected techniques, scale analysis, target tempo, 2-3 gold standard example lessons as few-shot examples
   - System prompt: "All teaching must reference the provided musical material. No generic filler. Exercises must use notes/patterns from these bars."
   - Model chosen from user's dropdown selection
5. **Quality gate checks each lesson output:**
   - Bar numbers referenced match the section's actual bar range
   - Techniques mentioned exist in the analysis for those bars
   - Scale/key references match detected key
   - Has all required sections (warmup, steps, checkpoints)
   - Checkpoint criteria are specific and measurable (rejects vague language)
   - Teaching connects theory to actual notes in the excerpt
6. **Retry on failure** — validation errors appended to prompt, max 2 retries. If still failing, fall back to template-based version and flag for manual review.
7. **Commit to repo** — new song folder with full structure, .context.md initialized, INDEX.md updated.

### Few-shot examples
- Stored in a configurable folder (e.g., `templates/examples/`) in the repo
- Gold standard lessons to be provided later by Leo from a future GP file
- Every AI enrichment call includes these examples to enforce tone, depth, and teaching style
- Until gold standard examples are provided, AI enrichment gracefully skips few-shot prompting and relies on the system prompt + structured data alone

### Supported AI providers
- **Claude** (Anthropic) — via `anthropic` SDK (already in codebase)
- **OpenAI / GPT** — via `openai` SDK (already in codebase)
- **Gemini** (Google) — via `google-genai` SDK (new provider to add)
- **Ollama** — via HTTP API (already in codebase)

A new Gemini provider must be added to `llm/providers.py` alongside the existing claude/openai/ollama providers.

### Cost guardrails
Processing a song generates ~20-25 AI API calls. Before starting AI enrichment, the queue page shows an estimate: "This will make ~N API calls using [model]. Proceed?" User must confirm before AI calls begin.

### Prompt design principle
The song is the lesson. Theory serves the song. If a section uses A dorian, the theory explains dorian in the context of those specific bars — not a generic scale lecture. All exercises reference the actual musical material.

## Auto-save and Progress Tracking

### During a practice session
- Frontend tracks: checkpoints checked off, tempo input, notes typed, current step
- **Auto-save every 10 minutes:** frontend sends state to backend, backend commits to git
  - Commit message: `"Auto-save: {song} lesson {n} in progress"`
- **Manual save button:** same operation, triggered immediately
- **localStorage failsafe:** session state also stored locally. If connection drops, syncs when reconnected.

### What gets written on save
- `.context.md` updated: current lesson, tempo achieved, stuck points, last session date
- `practice-log.md` appended: date, lesson number, duration, tempo, checkpoints passed, notes

Note: Appending to `practice-log.md` via the GitHub Contents API requires a read-modify-write cycle (fetch current content + SHA, append new entry, write back with SHA for optimistic concurrency). This is not an atomic append — if two writes race, one will fail and retry.

### Concurrent session handling
If both the web UI and a Claude Code terminal session write to the same song's files simultaneously, a git conflict is possible. This is accepted as a known limitation — Leo is a single user and unlikely to practice the same song from two interfaces at once. If it happens, the second write will fail and can be retried after pulling.

### "Complete lesson" action
- Advances current lesson number in `.context.md`
- Marks all checkpoints as passed in log entry
- Commit message: `"Complete: {song} lesson {n}"`

### Offline handling
- If GitHub API unreachable, saves queue locally, retries when connection returns
- UI shows: "saving..." / "saved" / "offline — will sync later"

## Hosting and Deployment

### Frontend — Vercel
- Next.js app
- Environment variables: `BACKEND_URL`

### Backend — Railway
- FastAPI in Docker container
- guitar-teacher + gp2tab packages installed
- Persistent process (no serverless timeout issues — GP analysis + AI enrichment can take minutes)
- Free/hobby tier sufficient for single user
- Environment variables: `GITHUB_TOKEN`, `AUTH_PIN`, `AUTH_SECRET`, `ALLOWED_ORIGINS`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`

### Authentication
- Pin entered on web UI, sent to `POST /auth/login` on backend
- Backend validates pin against `AUTH_PIN` env var, returns signed JWT (24h expiry)
- JWT stored in httpOnly cookie, sent with every request
- Backend middleware validates JWT on all protected endpoints
- Frontend middleware checks `/auth/verify` and redirects to login if expired

### Why Railway over Vercel for backend
Vercel's Python runtime is serverless with a 10-second timeout on hobby plan. GP analysis + AI enrichment for 20+ lessons could take minutes. Railway provides a persistent process with no timeout constraint.

## What stays the same

- The CLI tool (`guitar-teacher` command) continues to work as-is
- Claude Code practice sessions via terminal still work — same repo, same files
- The auto-sync hook in `.claude/settings.json` still works for terminal sessions
- All existing song folders, lessons, and progress files are unchanged

## Out of scope (for now)

- Audio playback or metronome in the web UI
- Social features or multi-user support
- Real-time collaboration
- Backing track integration
