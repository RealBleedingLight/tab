# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

## Session: 2026-03-26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| — | Batch commit: replaced per-file GitHub writes with Git Trees API (commit_files_batch) | github_client.py, queue.py | single commit for all lesson files | ~300 |
| — | Delete song: added delete_directory + DELETE /songs/{artist}/{song} endpoint + UI delete button | github_client.py, songs.py, page.tsx, api.ts | songs can now be deleted from dashboard | ~200 |
| — | Fix blank practice page: handle old context format, graceful no-lesson state | practice/page.tsx, page.tsx | shows helpful message instead of blank/error | ~150 |
| — | Removed all dummy songs from GitHub (dream-theater, gary-moore, marty-friedman, megadeth, guthrie duplicate) | songs/ | only guthrie-govan/man-of-steel remains | ~50 |
| — | Fix MarkdownLesson: removed prose/prose-invert (tailwind v4 no typography plugin), added explicit styling | MarkdownLesson.tsx | lesson content now renders visibly | ~100 |
| — | Add queue delete: DELETE /queue/{filename} + Remove button on queue page | queue.py, queue/page.tsx, api.ts | queue files can be removed | ~100 |
| — | Practice page 4-tab layout: Lesson / Tab / Theory / Breakdown, lazy-load non-lesson tabs | practice/page.tsx, songs.py, api.ts | all song content accessible in practice page | ~200 |
| 21:09 | Session end (20:59 session) | generator.py, MarkdownLesson.tsx, queue.py, .context.md, page.tsx | 9 writes, 18 reads | ~8572 |
| 21:52 | Session end (21:55 session) | github_client.py, queue.py, songs.py, api.ts, page.tsx | 13 writes, 6 reads | ~9653 |
| 22:26 | Session end (22:30 session) | github_client.py, queue.py, songs.py, api.ts, page.tsx | 16 writes, 10 reads | ~13970 |

## Session: 2026-03-27

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 02:58 | Created guitar-teacher-web implementation plan | docs/superpowers/plans/2026-03-27-guitar-teacher-web.md | — | ~16871 |
| 12:12 | Implemented web platform (worktree): storage, songs, theory, upload routers + tests; frontend scaffolded | web/backend/, web/frontend/ | all backend tests passing, frontend components created | ~30663 |
| 12:47 | Fixed python → sys.executable in processor.py | web/backend/services/processor.py | gp upload works | ~25 |
| 13:23 | Created SectionContent.tsx for web frontend | web/frontend/src/components/SectionContent.tsx | section analysis UI | ~2665 |
| 16:25 | Fixed Dockerfile PORT hardcode | Dockerfile | Railway healthcheck passes | ~55 |
| 16:55 | Fixed bug-017/018: NoteEffect.deadNote + MeasureHeader.tempo missing | gp2tab/gp2tab/parser_gp5.py | gp upload works for more files | ~1427 |
| 16:30 | Deployed backend to Railway | — | Live: string-theory-production.up.railway.app | ~150 |
| 16:40 | Deployed frontend via Vercel GitHub integration | web/frontend/ | Live: tab-fg52.vercel.app | ~100 |

## Session: 2026-03-27 (context optimisation)

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| — | Rebuilt anatomy.md: removed .venv, node_modules, pytest_cache, worktrees, completed plans | .wolf/anatomy.md | 1001 lines → 230 lines, 745 → 98 tracked files | ~500 |
| — | Archived completed plan + spec files | docs/archive/plans/, docs/archive/specs/ | 5 plans + 3 specs moved | ~200 |
| — | Updated UPGRADE_ROADMAP.md (Phase 2 done) + added web platform note to DOCS.md | UPGRADE_ROADMAP.md, guitar-teacher/DOCS.md | current state reflected | ~300 |
| — | Consolidated duplicate session-end entries in memory.md | .wolf/memory.md | cleaner log | ~100 |
| 18:12 | Session end: 2 writes across 2 files (UPGRADE_ROADMAP.md, DOCS.md) | 3 reads | ~6886 tok |
| 18:14 | Session end: 2 writes across 2 files (UPGRADE_ROADMAP.md, DOCS.md) | 3 reads | ~6886 tok |
| 21:20 | Session end: 2 writes across 2 files (UPGRADE_ROADMAP.md, DOCS.md) | 18 reads | ~6886 tok |

## Session: 2026-09-16 22:13

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-09-16 23:07

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-09-18 15:46

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 15:52 | Created docs/superpowers/plans/2026-09-18-algorithmic-tab-engine.md | — | ~14416 |
| 15:52 | Session end: 1 writes across 1 files (2026-09-18-algorithmic-tab-engine.md) | 9 reads | ~15446 tok |
| 15:54 | Session end: 1 writes across 1 files (2026-09-18-algorithmic-tab-engine.md) | 9 reads | ~15446 tok |

## Session: 2026-09-18 15:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 15:58 | Created frontend/lib/engine/types.ts | — | ~470 |
| 15:58 | Created frontend/lib/engine/__tests__/notes.test.ts | — | ~456 |
| 15:58 | Created frontend/lib/engine/notes.ts | — | ~407 |
| 15:59 | Session end: 3 writes across 3 files (types.ts, notes.test.ts, notes.ts) | 13 reads | ~14848 tok |
| 16:00 | Created frontend/lib/engine/data/scales.ts | — | ~4701 |
| 16:00 | Created frontend/lib/engine/data/chords.ts | — | ~2325 |
| 16:01 | Created frontend/lib/engine/data/intervals.ts | — | ~284 |
| 16:01 | Created frontend/lib/engine/__tests__/data.test.ts | — | ~438 |
| 16:01 | Session end: 7 writes across 7 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 13 reads | ~22596 tok |
| 16:01 | Created frontend/lib/engine/__tests__/tab-parser.test.ts | — | ~778 |
| 16:01 | Created frontend/lib/engine/tab-parser.ts | — | ~733 |
| 16:02 | Session end: 9 writes across 9 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 13 reads | ~24107 tok |
| 16:02 | Created frontend/lib/engine/__tests__/theory.test.ts | — | ~782 |
| 16:02 | Created frontend/lib/engine/theory.ts | — | ~1916 |
| 16:02 | Session end: 11 writes across 11 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 13 reads | ~26805 tok |
| 16:02 | Created frontend/lib/engine/__tests__/analyzer.test.ts | — | ~290 |
| 16:02 | Created frontend/lib/engine/analyzer.ts | — | ~799 |
| 16:03 | Created frontend/lib/engine/index.ts | — | ~83 |
| 16:03 | Session end: 14 writes across 14 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 13 reads | ~27977 tok |
| 16:03 | Created frontend/lib/types.ts | — | ~52 |
| 16:03 | Edited frontend/components/Fretboard.tsx | "@/lib/types" → "@/lib/engine" | ~16 |
| 16:03 | Edited frontend/components/Fretboard.tsx | inline fix | ~3 |
| 16:04 | Created frontend/app/tab/page.tsx | — | ~1521 |
| 16:04 | Edited frontend/components/BottomNav.tsx | 5→5 lines | ~48 |
| 16:04 | Session end: 19 writes across 17 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 15 reads | ~30170 tok |
| 16:04 | Created frontend/app/theory/page.tsx | — | ~2662 |
| 16:05 | Session end: 20 writes across 17 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 15 reads | ~32832 tok |
| 16:05 | Created frontend/app/page.tsx | — | ~326 |
| 16:05 | Created frontend/app/settings/page.tsx | — | ~152 |
| 16:07 | Session end: 22 writes across 17 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 15 reads | ~33310 tok |
| 16:07 | Edited frontend/app/layout.tsx | 2→2 lines | ~42 |
| 16:08 | Edited frontend/__tests__/components/Fretboard.test.tsx | CSS: isRoot, isRoot, isRoot | ~44 |
| 16:08 | Session end: 24 writes across 19 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 18 reads | ~33396 tok |
| 16:09 | Edited frontend/lib/engine/__tests__/notes.test.ts | 4→4 lines | ~35 |
| 16:09 | Edited frontend/lib/engine/__tests__/theory.test.ts | 4→4 lines | ~32 |
| 16:09 | Edited frontend/lib/engine/analyzer.ts | inline fix | ~16 |
| 16:11 | Edited docs/superpowers/plans/2026-09-18-algorithmic-tab-engine.md | 4→4 lines | ~27 |
| 16:11 | Edited docs/superpowers/plans/2026-09-18-algorithmic-tab-engine.md | inline fix | ~2 |
| 16:12 | Session end: 29 writes across 20 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 22 reads | ~35547 tok |
| 01:43 | Session end: 29 writes across 20 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 22 reads | ~35547 tok |
| 01:45 | Session end: 29 writes across 20 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 22 reads | ~35547 tok |
| 01:50 | Session end: 29 writes across 20 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 22 reads | ~35547 tok |
| 01:51 | Session end: 29 writes across 20 files (types.ts, notes.test.ts, notes.ts, scales.ts, chords.ts) | 22 reads | ~35547 tok |

## Session: 2026-09-29 21:06

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:13 | Created ../../../tmp/claude-0/-home-user-tab/ccdd3ebf-9c18-5d5b-ae5a-ba8c28ce0411/scratchpad/tex.js | — | ~229 |
| 21:14 | Created frontend/lib/alphatab/loader.ts | — | ~654 |
| 21:15 | Created frontend/lib/song/types.ts | — | ~547 |
| 21:15 | Created frontend/lib/song/extract.ts | — | ~2005 |
| 21:16 | Created frontend/lib/song/techniques.ts | — | ~3880 |
| 21:17 | Created frontend/lib/song/analysis.ts | — | ~2936 |
| 21:18 | Created frontend/lib/song/lessons.ts | — | ~2876 |
| 21:20 | Created frontend/lib/storage/library.ts | — | ~1451 |
| 21:22 | Created frontend/components/Fretboard.tsx | — | ~1402 |
| 21:23 | Created frontend/lib/alphatab/player.ts | — | ~3116 |
| 21:23 | Created frontend/components/player/PlayerBar.tsx | — | ~2178 |
| 21:24 | Created frontend/components/learn/bits.tsx | — | ~788 |
| 21:24 | Created frontend/components/learn/LessonPanel.tsx | — | ~2823 |
| 21:25 | Created frontend/components/learn/Insights.tsx | — | ~1929 |
| 21:25 | Created frontend/components/player/LiveFretboard.tsx | — | ~511 |
| 21:26 | Created frontend/components/SongWorkspace.tsx | — | ~3897 |
| 21:27 | Created frontend/components/UploadDropzone.tsx | — | ~1125 |
| 21:27 | Created frontend/app/page.tsx | — | ~1518 |
| 21:28 | Created frontend/app/tab/page.tsx | — | ~1558 |
| 21:29 | Created ../../../tmp/claude-0/-home-user-tab/ccdd3ebf-9c18-5d5b-ae5a-ba8c28ce0411/scratchpad/e2e.mjs | — | ~680 |
| 21:38 | Created ../../../tmp/claude-0/-home-user-tab/ccdd3ebf-9c18-5d5b-ae5a-ba8c28ce0411/scratchpad/e2e2.mjs | — | ~652 |
| 21:43 | Created frontend/README.md | — | ~879 |
| 21:45 | Session end: 22 writes across 21 files (tex.js, loader.ts, types.ts, extract.ts, techniques.ts) | 8 reads | ~37791 tok |
| 21:48 | Session end: 22 writes across 21 files (tex.js, loader.ts, types.ts, extract.ts, techniques.ts) | 8 reads | ~37791 tok |
| 21:48 | Session end: 22 writes across 21 files (tex.js, loader.ts, types.ts, extract.ts, techniques.ts) | 8 reads | ~37791 tok |
| 21:53 | Created ../../../tmp/claude-0/-home-user-tab/ccdd3ebf-9c18-5d5b-ae5a-ba8c28ce0411/scratchpad/harm.js | — | ~403 |
| 21:56 | Created frontend/lib/song/harmony.ts | — | ~5790 |
| 21:58 | Created frontend/components/learn/ChordGuides.tsx | — | ~937 |
| 21:59 | Created ../../../tmp/claude-0/-home-user-tab/ccdd3ebf-9c18-5d5b-ae5a-ba8c28ce0411/scratchpad/e2e3.mjs | — | ~464 |
| 22:04 | Session end: 26 writes across 25 files (tex.js, loader.ts, types.ts, extract.ts, techniques.ts) | 10 reads | ~45419 tok |
| 22:04 | Session end: 26 writes across 25 files (tex.js, loader.ts, types.ts, extract.ts, techniques.ts) | 10 reads | ~45419 tok |
| 22:05 | Session end: 26 writes across 25 files (tex.js, loader.ts, types.ts, extract.ts, techniques.ts) | 10 reads | ~45419 tok |
| 22:05 | Session end: 26 writes across 25 files (tex.js, loader.ts, types.ts, extract.ts, techniques.ts) | 10 reads | ~45419 tok |
