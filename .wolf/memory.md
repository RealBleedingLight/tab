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
