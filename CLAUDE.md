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
