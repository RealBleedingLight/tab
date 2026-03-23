# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A guitar learning workspace for Leo — an intermediate guitarist learning solos through transcriptions, technique breakdowns, theory explanations, and structured practice plans.

## Leo's Profile

- Intermediate level: comfortable with barre chords, pentatonic scales, playing along to songs
- Genres: prog metal, classic rock, neoclassical shred, blues
- Wants: tabs + technique breakdowns + practice roadmaps + theory context

## Workspace Structure

- `INDEX.md` — master table of contents with clickable links to everything
- `songs/<artist>/<song>/` — one folder per song containing:
  - `tab.txt` — ASCII tab (fixed-width, must preserve formatting)
  - `breakdown.md` — technique-by-technique analysis of the solo
  - `practice.md` — practice plan with tempo milestones and section order
  - `theory.md` — scales, modes, and theory behind the solo
  - `.context.md` — Leo's current progress on this song (for Claude context)
  - `lessons/` — numbered step-by-step lesson files (self-contained, one per session)
  - `practice-log.md` — append-only log of practice sessions
- `concepts/techniques/` — reusable technique guides (alternate picking, sweep picking, legato, etc.)
- `concepts/scales/` — scale/mode references (Japanese pentatonic, harmonic minor, modes, etc.)
- `concepts/theory/` — music theory lessons
- `concepts/.context.md` — progress on theory/concept learning
- `inbox/tabs/` — drop tab files here for processing (format: `Artist - Song.ext`)

## Practice Session Protocol (for any model)

When Leo says "let's practice [song]" or "continue practicing":

1. **Read `.context.md`** for that song — find current lesson number
2. **Read the current lesson file** from `lessons/XX-name.md`
3. **Walk Leo through the steps** one at a time — read each step, wait for his response
4. **At checkpoints**, ask Leo to self-assess each item
5. **After the session**, do these three things:
   - Append an entry to `practice-log.md` with date, lesson, duration, tempo, what worked, what's stuck
   - Update `.context.md` with new current lesson, tempo, stuck points, completed lessons
   - Commit and push to GitHub

**IMPORTANT for context efficiency:**
- Only read the ONE lesson file needed for this session
- Do NOT read all lessons, breakdown.md, theory.md, or practice.md during a session
- The lesson file contains everything needed — it is self-contained
- If Leo asks about theory or techniques mid-session, THEN read the relevant concept file

**If Leo finishes a lesson mid-session**, read the next lesson and continue if Leo wants.

**If Leo is stuck on a lesson for 3+ sessions**, suggest breaking it into smaller pieces or dropping tempo further. Note this in .context.md.

## Inbox Processing Protocol — "Process my inbox"

When Leo says "process my inbox" or "I dropped a new tab":

### Step 1: Scan inbox
```
ls inbox/tabs/
```
For each file found, extract artist and song from the filename (format: `Artist - Song.ext`).

### Step 2: Identify or create folder
- Normalize names: lowercase, hyphens for spaces (e.g., "Marty Friedman" → `marty-friedman`)
- Check if `songs/<artist>/<song>/` already exists
- If not, create it with the full folder structure

### Step 3: Move the file
- Move the tab file from `inbox/tabs/` into the song folder
- Keep the original filename

### Step 4: Read and analyze the tab
- If PDF: render pages to images and read them visually
- If Guitar Pro (.gp, .gp5, .gpx): note that it exists as the authoritative source
- Identify: key/tonality, total bars, sections, techniques used, difficulty

### Step 5: Generate all files (use Opus for this — dispatch parallel agents)
Generate these files by dispatching background agents in parallel:
1. **`tab.txt`** — ASCII tab from the PDF reading (with accuracy disclaimer)
2. **`breakdown.md`** — technique breakdown with difficulty per section, practice order
3. **`practice.md`** — high-level phased practice plan
4. **`theory.md`** — scale/theory analysis
5. **`lessons/`** — full numbered lesson sequence (self-contained per lesson, following the template from existing lessons). Use ~20-25 lessons depending on solo length/difficulty. Cover:
   - Technique prerequisites (vibrato, bending, legato, picking as needed)
   - Every section of the solo in small chunks (2-4 bars per lesson)
   - Assembly lessons connecting sections
   - Final performance lesson
6. **`lessons/README.md`** — lesson index with clickable links
7. **`.context.md`** — initialized with lesson 01, all tempos blank
8. **`practice-log.md`** — empty log template

### Step 6: Update INDEX.md
Add the new song to the Songs table and link any new concepts.

### Step 7: Create concept files
If the song uses techniques or scales not yet in `concepts/`, create them and cross-reference.

### Step 8: Commit and push
```
git add -A && git commit && git push
```

### Step 9: Clean up
Remove processed files from `inbox/tabs/` (they've been moved to the song folder).

### Step 10: Report
Tell Leo what was processed, the difficulty assessment, and suggest which lesson to start with.

---

## Video Learning Protocol — "Learn this video: [URL]"

When Leo says "learn this video" with a YouTube URL:

### Step 1: Fetch the transcript
Use web tools to get the video transcript/captions. Also fetch the video title and description for context.

### Step 2: Analyze the content
Determine what type of content it is:
- **Theory concept** (modes, scales, harmony, etc.) → goes in `concepts/theory/` or `concepts/scales/`
- **Technique lesson** (picking, legato, sweep, etc.) → goes in `concepts/techniques/`
- **Song-specific** (breakdown of a particular solo) → goes in the relevant `songs/` folder

### Step 3: Create a learning guide
Write a structured guide file with:
- **Summary** — what the video teaches in 2-3 sentences
- **Key concepts** — bullet list of main ideas
- **Detailed breakdown** — section by section, what was explained, with examples
- **Practice exercises** — specific things to try on the guitar based on what was taught
- **How this connects** — links to songs in the workspace that use these concepts
- Source attribution: link back to the original video

### Step 4: Create lesson files if substantial
If the content is rich enough (>10 min video, multiple concepts), create numbered lesson files following the same self-contained template used for song lessons.

### Step 5: Update INDEX.md and cross-references
Add the new concept to INDEX.md and link it from relevant song files.

### Step 6: Commit and push

---

## Model Selection Guide

| Task | Recommended Model | Why |
|------|------------------|-----|
| Process inbox (generate lessons) | **Opus** | Deep analysis, lesson quality matters |
| Practice sessions | **Sonnet or Haiku** | Just reading and walking through pre-written steps |
| Video learning (generate guide) | **Opus** | Understanding and structuring complex content |
| Quick questions mid-practice | **Haiku** | Fast, cheap, context is in the lesson file |
| Adding songs to the list | **Any model** | Just updating INDEX.md |

## How to Work in This Repo

### Adding a new song
1. Create `songs/<artist>/<song>/` with tab.txt, breakdown.md, practice.md, theory.md, .context.md
2. Link technique/scale references to files in `concepts/` — create concept files if they don't exist
3. Update `INDEX.md` with the new song entry

### ASCII Tab Formatting
- Use fixed-width format with standard 6-line tab notation (eBGDAE tuning unless noted)
- Include bar numbers and section labels
- Keep lines under 80 characters where possible — break long phrases across multiple systems
- Add timing notation above the tab where rhythm is important

### Context Files (.context.md)
- Per-song context tracks: current progress, problem sections, tempo milestones, what's been covered
- Only load the relevant .context.md for the song/topic being discussed — not all of them
- Update .context.md at the end of each working session

### Cross-referencing
- Song breakdowns should link to concept files: `[alternate picking](../../concepts/techniques/alternate-picking.md)`
- Concept files should list related songs that use them

## Current Song List
- Tornado of Souls — Megadeth (relearning)
- Octavarium (solo) — Dream Theater
- Tearful Confession — Marty Friedman
- Illumination — Marty Friedman
- The Loner — Gary Moore
- Man of Steel (Guthrie Govan solo) — Hans Zimmer
