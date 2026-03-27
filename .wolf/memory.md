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
| 02:58 | Session end: 1 writes across 1 files (2026-03-27-guitar-teacher-web.md) | 7 reads | ~23998 tok |
| 02:59 | Session end: 1 writes across 1 files (2026-03-27-guitar-teacher-web.md) | 7 reads | ~23998 tok |
| 03:04 | Created .worktrees/guitar-teacher-web/web/backend/requirements.txt | — | ~30 |
| 03:04 | Created .worktrees/guitar-teacher-web/web/backend/config.py | — | ~113 |
| 03:04 | Created .worktrees/guitar-teacher-web/web/backend/main.py | — | ~207 |
| 03:04 | Created .worktrees/guitar-teacher-web/web/backend/routers/theory.py | — | ~15 |
| 03:04 | Created .worktrees/guitar-teacher-web/web/backend/routers/songs.py | — | ~15 |
| 03:04 | Created .worktrees/guitar-teacher-web/web/backend/routers/upload.py | — | ~15 |
| 03:09 | Created .worktrees/guitar-teacher-web/web/backend/requirements.txt | — | ~30 |
| 03:12 | Edited .worktrees/guitar-teacher-web/.wolf/memory.md | 1→3 lines | ~56 |
| 03:12 | Edited .worktrees/guitar-teacher-web/.wolf/anatomy.md | expanded (+21 lines) | ~245 |
| 03:12 | Edited .worktrees/guitar-teacher-web/.wolf/cerebrum.md | 1→5 lines | ~148 |
| 03:16 | Edited .worktrees/guitar-teacher-web/web/frontend/src/app/layout.tsx | 4→4 lines | ~33 |
| 03:16 | Created .worktrees/guitar-teacher-web/web/frontend/src/app/page.tsx | — | ~64 |
| 03:17 | Created .worktrees/guitar-teacher-web/web/backend/models.py | — | ~400 |
| 03:18 | Created .worktrees/guitar-teacher-web/web/backend/tests/test_storage.py | — | ~608 |
| 05:06 | Created .worktrees/guitar-teacher-web/web/backend/services/storage.py | — | ~423 |
| 05:09 | Edited .worktrees/guitar-teacher-web/web/backend/services/storage.py | modified list_songs() | ~92 |
| 05:10 | Created .worktrees/guitar-teacher-web/web/backend/tests/test_theory_router.py | — | ~423 |
| 05:16 | Created .worktrees/guitar-teacher-web/web/backend/routers/theory.py | — | ~1396 |
| 05:16 | Edited .worktrees/guitar-teacher-web/web/backend/routers/theory.py | modified enumerate() | ~41 |
| 05:22 | Edited .worktrees/guitar-teacher-web/web/backend/routers/theory.py | 1→3 lines | ~31 |
| 05:22 | Edited .worktrees/guitar-teacher-web/web/backend/routers/theory.py | modified get_chord() | ~38 |
| 05:22 | Edited .worktrees/guitar-teacher-web/web/backend/routers/theory.py | modified get_key() | ~76 |
| 05:24 | Created .worktrees/guitar-teacher-web/web/backend/tests/test_processor.py | — | ~306 |
| 05:32 | Created .worktrees/guitar-teacher-web/web/backend/services/processor.py | — | ~972 |
| 05:32 | Created .worktrees/guitar-teacher-web/web/backend/routers/upload.py | — | ~302 |
| 06:08 | Edited .worktrees/guitar-teacher-web/web/backend/tests/test_processor.py | 2→5 lines | ~110 |
| 06:28 | Edited .worktrees/guitar-teacher-web/web/backend/services/processor.py | removed 15 lines | ~16 |
| 06:28 | Edited .worktrees/guitar-teacher-web/web/backend/services/processor.py | removed 3 lines | ~1 |
| 10:18 | Created .worktrees/guitar-teacher-web/web/backend/tests/test_songs_router.py | — | ~690 |
| 10:32 | Created .worktrees/guitar-teacher-web/web/backend/routers/songs.py | — | ~384 |
| 10:34 | Created .worktrees/guitar-teacher-web/web/frontend/src/lib/types.ts | — | ~387 |
| 10:35 | Created .worktrees/guitar-teacher-web/web/frontend/src/lib/api.ts | — | ~456 |
| 10:35 | Created .worktrees/guitar-teacher-web/web/frontend/src/app/layout.tsx | — | ~347 |
| 11:29 | Created .worktrees/guitar-teacher-web/web/frontend/src/lib/api.ts | — | ~451 |
| 11:36 | Created .worktrees/guitar-teacher-web/web/frontend/src/components/FretboardDiagram.tsx | — | ~785 |
| 11:36 | Created .worktrees/guitar-teacher-web/web/frontend/src/app/theory/page.tsx | — | ~1920 |
| 11:40 | Created .worktrees/guitar-teacher-web/web/frontend/src/components/UploadZone.tsx | — | ~626 |
| 11:40 | Created .worktrees/guitar-teacher-web/web/frontend/src/components/SongCard.tsx | — | ~528 |
| 11:40 | Created .worktrees/guitar-teacher-web/web/frontend/src/app/page.tsx | — | ~365 |
| 11:43 | Created .worktrees/guitar-teacher-web/web/frontend/src/components/TabViewer.tsx | — | ~101 |
| 11:43 | Created .worktrees/guitar-teacher-web/web/frontend/src/components/SectionSidebar.tsx | — | ~469 |
| 11:43 | Created .worktrees/guitar-teacher-web/web/frontend/src/components/SectionContent.tsx | — | ~700 |
| 11:44 | Created .worktrees/guitar-teacher-web/web/frontend/src/app/songs/[id]/page.tsx | — | ~1069 |
| 11:46 | Created .worktrees/guitar-teacher-web/Dockerfile | — | ~205 |
| 11:46 | Created .worktrees/guitar-teacher-web/railway.json | — | ~67 |
| 11:47 | Edited .worktrees/guitar-teacher-web/.wolf/anatomy.md | 1→2 lines | ~68 |
| 11:47 | Edited .worktrees/guitar-teacher-web/.wolf/anatomy.md | 1→2 lines | ~47 |

## Session: 2026-03-27 11:51

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 12:11 | Edited .worktrees/guitar-teacher-web/web/backend/services/storage.py | modified toggle_section_complete() | ~155 |
| 12:11 | Edited .worktrees/guitar-teacher-web/web/backend/routers/songs.py | modified toggle_complete() | ~141 |
| 12:11 | Edited .worktrees/guitar-teacher-web/web/backend/routers/theory.py | modified enumerate() | ~123 |
| 12:11 | Edited .worktrees/guitar-teacher-web/web/frontend/src/components/UploadZone.tsx | added 1 condition(s) | ~43 |
| 12:11 | Edited .worktrees/guitar-teacher-web/web/frontend/src/app/songs/[id]/page.tsx | added error handling | ~136 |
| 12:11 | Created .worktrees/guitar-teacher-web/.dockerignore | — | ~104 |
| 12:12 | Edited .worktrees/guitar-teacher-web/web/backend/tests/test_theory_router.py | inline fix | ~26 |
| 12:12 | Session end: 7 writes across 7 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 31 reads | ~30663 tok |
| 12:18 | Session end: 7 writes across 7 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 31 reads | ~30663 tok |
| 12:25 | Session end: 7 writes across 7 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 31 reads | ~30663 tok |
| 12:28 | Session end: 7 writes across 7 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 31 reads | ~30663 tok |
| 12:29 | Session end: 7 writes across 7 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 31 reads | ~30663 tok |
| 12:30 | Session end: 7 writes across 7 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 31 reads | ~30663 tok |
| 12:47 | Edited web/backend/services/processor.py | added 1 import(s) | ~16 |
| 12:47 | Edited web/backend/services/processor.py | "python" → "-m" | ~25 |
| 12:47 | Session end: 9 writes across 8 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 32 reads | ~30704 tok |
| 12:55 | Created ../../../kazam/.claude/projects/-Users-leo-hobby-tab/memory/project_web_platform.md | — | ~1104 |
| 12:55 | Session end: 10 writes across 9 files (storage.py, songs.py, theory.py, UploadZone.tsx, page.tsx) | 33 reads | ~31887 tok |

## Session: 2026-03-27 12:56

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-03-27 12:59

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 13:22 | Edited web/frontend/src/app/songs/[id]/page.tsx | 6→6 lines | ~68 |
| 13:22 | Created web/frontend/src/components/SectionContent.tsx | — | ~1702 |
| 13:23 | Session end: 2 writes across 2 files (page.tsx, SectionContent.tsx) | 11 reads | ~2665 tok |

## Session: 2026-03-27 14:48

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 16:25 | Edited Dockerfile | 2→2 lines | ~22 |
| 16:25 | Session end: 1 writes across 1 files (Dockerfile) | 4 reads | ~55 tok |
| 16:26 | Session end: 1 writes across 1 files (Dockerfile) | 4 reads | ~55 tok |
| 16:39 | Session end: 1 writes across 1 files (Dockerfile) | 4 reads | ~55 tok |
| 16:47 | Session end: 1 writes across 1 files (Dockerfile) | 4 reads | ~55 tok |
| 16:48 | Session end: 1 writes across 1 files (Dockerfile) | 5 reads | ~80 tok |
| 16:49 | Session end: 1 writes across 1 files (Dockerfile) | 5 reads | ~80 tok |
| 16:55 | Edited gp2tab/gp2tab/parser_gp5.py | inline fix | ~16 |
