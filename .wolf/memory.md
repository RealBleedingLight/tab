# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

| 2026-03-26 | batch commit: replaced per-file GitHub writes with Git Trees API (commit_files_batch) | github_client.py, queue.py | single commit for all lesson files | ~300 tok |
| 2026-03-26 | delete song: added delete_directory + DELETE /songs/{artist}/{song} endpoint + UI delete button | github_client.py, songs.py, page.tsx, api.ts | songs can now be deleted from dashboard | ~200 tok |
| 2026-03-26 | fix blank practice page: handle old context format, graceful no-lesson state | practice/page.tsx, page.tsx | shows helpful message instead of blank/error | ~150 tok |

## Session: 2026-03-26 20:59

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:07 | Edited guitar-teacher/guitar_teacher/lessons/generator.py | 10→10 lines | ~106 |
| 21:07 | Edited frontend/components/MarkdownLesson.tsx | 8→8 lines | ~140 |
| 21:07 | Edited guitar-teacher/guitar_teacher/api/routers/queue.py | expanded (+16 lines) | ~396 |
| 21:07 | Edited songs/guthrie-govan/man-of-steel/.context.md | inline fix | ~5 |
| 21:07 | Edited guitar-teacher/guitar_teacher/api/routers/queue.py | 2→1 lines | ~19 |
| 21:08 | Edited frontend/app/queue/page.tsx | CSS: named | ~80 |
| 21:08 | Edited frontend/app/queue/page.tsx | added 1 condition(s) | ~311 |
| 21:08 | Edited frontend/app/queue/page.tsx | modified if() | ~235 |
| 21:08 | Edited frontend/app/queue/page.tsx | modified processFile() | ~101 |
| 21:09 | Session end: 9 writes across 5 files (generator.py, MarkdownLesson.tsx, queue.py, .context.md, page.tsx) | 18 reads | ~8572 tok |
| 21:20 | Edited Dockerfile | 2→3 lines | ~21 |
| 21:21 | Edited guitar-teacher/guitar_teacher/api/github_client.py | modified read_file() | ~155 |
| 21:21 | Edited guitar-teacher/guitar_teacher/api/github_client.py | modified read_binary() | ~153 |
| 21:21 | Edited guitar-teacher/guitar_teacher/api/github_client.py | modified list_directory() | ~123 |
| 21:25 | Edited guitar-teacher/guitar_teacher/api/github_client.py | modified write_file() | ~272 |
| 21:28 | Session end: 14 writes across 7 files (generator.py, MarkdownLesson.tsx, queue.py, .context.md, page.tsx) | 26 reads | ~10146 tok |
| 21:32 | Session end: 14 writes across 7 files (generator.py, MarkdownLesson.tsx, queue.py, .context.md, page.tsx) | 26 reads | ~10146 tok |
| 21:39 | Session end: 14 writes across 7 files (generator.py, MarkdownLesson.tsx, queue.py, .context.md, page.tsx) | 26 reads | ~10146 tok |

## Session: 2026-03-26 21:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:57 | Edited guitar-teacher/guitar_teacher/api/github_client.py | added 1 import(s) | ~52 |
| 21:57 | Edited guitar-teacher/guitar_teacher/api/github_client.py | expanded (+6 lines) | ~138 |
| 21:57 | Edited guitar-teacher/guitar_teacher/api/github_client.py | modified delete_file() | ~816 |
| 21:58 | Edited guitar-teacher/guitar_teacher/api/routers/queue.py | modified walk() | ~192 |
| 21:58 | Edited guitar-teacher/guitar_teacher/api/routers/songs.py | modified delete_song() | ~95 |
| 21:58 | Edited frontend/lib/api.ts | added 1 condition(s) | ~83 |
| 21:58 | Edited frontend/lib/api.ts | 2→4 lines | ~74 |
| 21:58 | Edited frontend/app/page.tsx | CSS: formats, lesson, lesson | ~354 |
| 21:58 | Edited frontend/app/page.tsx | CSS: artist, song | ~214 |
| 21:58 | Edited frontend/app/page.tsx | CSS: disabled | ~359 |
| 21:58 | Edited frontend/app/practice/[artist]/[song]/page.tsx | added nullish coalescing | ~56 |
| 21:59 | Edited frontend/app/practice/[artist]/[song]/page.tsx | 4→9 lines | ~100 |
| 21:59 | Edited frontend/app/practice/[artist]/[song]/page.tsx | 1→4 lines | ~71 |
| 21:59 | Session end: 13 writes across 5 files (github_client.py, queue.py, songs.py, api.ts, page.tsx) | 6 reads | ~9653 tok |
| 22:20 | Session end: 13 writes across 5 files (github_client.py, queue.py, songs.py, api.ts, page.tsx) | 6 reads | ~9653 tok |
| 22:22 | Session end: 13 writes across 5 files (github_client.py, queue.py, songs.py, api.ts, page.tsx) | 10 reads | ~9653 tok |
| 22:24 | Edited guitar-teacher/guitar_teacher/api/routers/songs.py | modified get_tab() | ~354 |
| 22:25 | Edited frontend/lib/api.ts | expanded (+6 lines) | ~130 |
| 22:25 | Created frontend/app/practice/[artist]/[song]/page.tsx | — | ~2562 |
| 22:26 | Session end: 16 writes across 5 files (github_client.py, queue.py, songs.py, api.ts, page.tsx) | 10 reads | ~13970 tok |
| 22:27 | Created ../../../kazam/.claude/projects/-Users-leo-hobby-tab/memory/project_web_platform.md | — | ~1042 |
| 22:27 | Created ../../../kazam/.claude/projects/-Users-leo-hobby-tab/memory/MEMORY.md | — | ~194 |
| 2026-03-26 | removed all dummy songs from GitHub (dream-theater, gary-moore, marty-friedman, megadeth, guthrie duplicate, lessons_old) | songs/ | only guthrie-govan/man-of-steel remains | ~50 tok |
| 2026-03-26 | fix MarkdownLesson: removed prose/prose-invert (tailwind v4 no typography plugin), added explicit ul/ol/strong/em/blockquote/hr styling | MarkdownLesson.tsx | lesson content now renders visibly | ~100 tok |
| 2026-03-26 | add queue delete: DELETE /queue/{filename} + Remove button on queue page | queue.py, queue/page.tsx, api.ts | queue files can be removed | ~100 tok |
| 2026-03-26 | practice page 4-tab layout: Lesson / Tab / Theory / Breakdown, lazy-load non-lesson tabs | practice/page.tsx, songs.py, api.ts | all song content accessible in practice page | ~200 tok |

## Session: 2026-03-26 22:30

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 02:31

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-26 02:33

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 02:58 | Created docs/superpowers/plans/2026-03-27-guitar-teacher-web.md | — | ~16871 |
