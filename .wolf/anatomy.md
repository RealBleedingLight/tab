# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-03-27T00:00:00.000Z
> Files: 98 tracked | Anatomy hits: 0 | Misses: 0

## ../../../kazam/.claude/projects/-Users-leo-hobby-tab/memory/

- `MEMORY.md` — Memory Index (~182 tok)
- `project_web_platform.md` — Guitar Teacher Web Platform (~511 tok)

## ./

- `.gitignore` — Git ignore rules (~8 tok)
- `CLAUDE.md` — OpenWolf (~2397 tok)
- `Dockerfile` — Docker container definition (~203 tok)
- `INDEX.md` — Guitar Tab Workspace (~465 tok)
- `railway.json` — Railway deployment config: DOCKERFILE builder, /health healthcheck, ON_FAILURE restart (~10 tok)
- `UPGRADE_ROADMAP.md` — Guitar Teacher — Upgrade Roadmap (~477 tok)

## .claude/

- `settings.json` (~507 tok)
- `settings.local.json` (~1676 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## concepts/

- `.context.md` — Concepts — Progress (~31 tok)

## docs/superpowers/specs/

- `2026-03-24-gp2tab-design.md` — gp2tab — Guitar Pro to Tab Converter (~3480 tok)
- `2026-03-24-guitar-teacher-design.md` — Guitar Teacher — Design Spec (~6339 tok)
- `2026-03-25-guitar-teacher-web-platform-design.md` — Guitar Teacher Web Platform — Design Spec (~3480 tok)

## frontend/

- `.gitignore` — Git ignore rules (~128 tok)
- `AGENTS.md` — This is NOT the Next.js you know (~82 tok)
- `CLAUDE.md` (~3 tok)
- `eslint.config.mjs` — ESLint flat configuration (~124 tok)
- `jest.config.ts` — Jest test configuration (~79 tok)
- `jest.setup.ts` (~11 tok)
- `middleware.ts` — API routes: GET (1 endpoints) (~160 tok)
- `next-env.d.ts` — / <reference types="next" /> (~71 tok)
- `next.config.ts` — Next.js configuration (~38 tok)
- `package.json` — Node.js package manifest (~255 tok)
- `postcss.config.mjs` — Declares config (~26 tok)
- `README.md` — Project documentation (~363 tok)
- `tsconfig.json` — TypeScript configuration (~191 tok)
- `vercel.json` (~37 tok)

## frontend/__tests__/components/

- `Fretboard.test.tsx` — positions (~299 tok)
- `ProgressBar.test.tsx` — bar (~203 tok)
- `SaveIndicator.test.tsx` — savedAt (~209 tok)

## frontend/__tests__/lib/

- `api.test.ts` — mockFetch: mockResponse (~868 tok)

## frontend/app/

- `globals.css` — Styles: 2 rules (~106 tok)
- `layout.tsx` — inter (~185 tok)
- `page.tsx` — parseContext (~1227 tok)

## frontend/app/login/

- `page.tsx` — LoginPage — renders form — uses useRouter, useState (~539 tok)

## frontend/app/practice/[artist]/[song]/

- `page.tsx` — parseCurrentLesson (~2562 tok)

## frontend/app/queue/

- `page.tsx` — MODELS (~1875 tok)

## frontend/app/settings/

- `page.tsx` — MODELS — uses useRouter, useState (~531 tok)

## frontend/app/songs/[artist]/[song]/

- `page.tsx` — parseContext — uses useState, useEffect (~784 tok)

## frontend/app/theory/

- `page.tsx` — NOTES — uses useState (~2407 tok)

## frontend/components/

- `BottomNav.tsx` — tabs (~309 tok)
- `Fretboard.tsx` — STRING_COUNT (~841 tok)
- `MarkdownLesson.tsx` — MarkdownLesson (~451 tok)
- `ProgressBar.tsx` — ProgressBar (~179 tok)
- `SaveIndicator.tsx` — minutesAgo (~210 tok)

## frontend/lib/

- `api.ts` — Exports api (~1049 tok)
- `types.ts` — Exports Song, FretboardPosition, ScaleResult, ChordResult + 10 more (~535 tok)

## gp2tab/

- `cli.py` — CLI entry point for gp2tab. (~972 tok)
- `pyproject.toml` — Python project configuration (~98 tok)
- `README.md` — Project documentation (~333 tok)
- `requirements.txt` — Python dependencies (~5 tok)
- `USAGE.md` — gp2tab Usage Guide (~863 tok)

## gp2tab/gp2tab.egg-info/

- `dependency_links.txt` (~1 tok)
- `PKG-INFO` (~50 tok)
- `requires.txt` (~5 tok)
- `SOURCES.txt` (~142 tok)
- `top_level.txt` (~3 tok)

## gp2tab/gp2tab/

- `__init__.py` (~18 tok)
- `__main__.py` — Allow running as `python -m gp2tab`. (~69 tok)
- `formatter_json.py` — Format Song model as structured JSON. (~390 tok)
- `formatter_llm.py` — Format Song model as LLM-optimized condensed text. (~771 tok)
- `formatter_tab.py` — Format Song model as ASCII tab. (~2105 tok)
- `models.py` — Data models for gp2tab. (~346 tok)
- `parser_gp_xml.py` — Parser for GP6/7/8 files (ZIP containing Content/score.gpif XML). (~3888 tok)
- `parser_gp5.py` — Parser for GP3/4/5 files using pyguitarpro library. (~1278 tok)
- `parser.py` — Format-detecting parser dispatcher. (~251 tok)
- `utils.py` — Shared utilities for gp2tab. (~265 tok)

## gp2tab/tests/

- `__init__.py` (~0 tok)
- `conftest.py` — sample_song, rest_bars_song (~642 tok)
- `test_formatter_json.py` — Tests: json_structure, json_note_fields, json_techniques, json_technique_null_value + 2 more (~494 tok)
- `test_formatter_llm.py` — Tests: llm_header, llm_note_format, llm_techniques, llm_section_header + 3 more (~318 tok)
- `test_formatter_tab.py` — Tests: tab_header, tab_string_names, tab_fret_numbers, tab_techniques + 3 more (~465 tok)
- `test_models.py` — Tests: technique_bend, technique_no_value, note_basic, note_with_techniques + 3 more (~432 tok)
- `test_parser_gp_xml.py` — Tests: parse_metadata, parse_bar_count, parse_time_signature, parse_rest_bars + 8 more (~964 tok)
- `test_parser_gp5.py` — Tests: extract_hammer, extract_vibrato, extract_palm_mute, extract_dead_note + 5 more (~712 tok)
- `test_utils.py` — Tests: midi_standard_tuning, midi_flats, duration_beats, duration_beats_dotted + 1 more (~281 tok)

## guitar-teacher/

- `DOCS.md` — Guitar Teacher — Full Documentation (~5091 tok)
- `pyproject.toml` — Python project configuration (~252 tok)
- `README.md` — Project documentation (~831 tok)

## guitar-teacher/guitar_teacher/

- `__init__.py` (~0 tok)
- `cli.py` — CLI entry point (~972 tok)
- `config.py` — App configuration and environment variables (~250 tok)
- `core/__init__.py` (~0 tok)
- `core/analyzer.py` — Solo analysis logic (~800 tok)
- `core/fretboard.py` — Fretboard position calculations (~400 tok)
- `core/models.py` — Core data models (~346 tok)
- `core/note_utils.py` — Note/pitch utilities (~265 tok)
- `core/theory.py` — Music theory helpers (~500 tok)
- `llm/__init__.py` (~0 tok)
- `llm/enhancer.py` — LLM-based content enhancement (~600 tok)
- `llm/providers.py` — LLM provider abstraction (~400 tok)

## guitar-teacher/guitar_teacher/api/

- `__init__.py` (~0 tok)
- `app.py` — FastAPI app factory (~200 tok)
- `auth.py` — Authentication middleware (~150 tok)
- `deps.py` — FastAPI dependency injection (~100 tok)
- `github_client.py` — GitHub Contents API client for reading/writing repo files. (~2176 tok)
- `jobs.py` — Background job management (~300 tok)

## guitar-teacher/guitar_teacher/api/routers/

- `__init__.py` (~0 tok)
- `analysis.py` — Analysis endpoints (~500 tok)
- `queue.py` — GP file queue endpoints — upload, list, process. (~1509 tok)
- `songs.py` — Song data and progress endpoints. (~1413 tok)
- `theory.py` — Theory/scale endpoints (~600 tok)

## guitar-teacher/guitar_teacher/lessons/

- `__init__.py` (~0 tok)
- `generator.py` — Generate lesson plans from SoloAnalysis. (~7573 tok)
- `templates.py` — Lesson template helpers (~300 tok)

## songs/guthrie-govan/man-of-steel/

- `.context.md` — Man Of Steel — Progress (~358 tok)

## web/backend/

- `__init__.py` — empty package marker (~1 tok)
- `config.py` — DATA_DIR, SONGS_DIR, ALLOWED_ORIGINS, THEORY_DIR from env/guitar_teacher (~25 tok)
- `main.py` — FastAPI app factory with CORS, health endpoint, routers mounted (~30 tok)
- `requirements.txt` — fastapi, uvicorn, pydantic, pytest, httpx, python-multipart (~10 tok)

## web/backend/routers/

- `songs.py` — stub: `router = APIRouter()` (~5 tok)
- `theory.py` — stub: `router = APIRouter()` (~5 tok)
- `upload.py` — stub: `router = APIRouter()` (~5 tok)

## web/backend/services/

- `processor.py` — make_song_id, slug, process_gp_file (~890 tok)

## web/frontend/

- `.env.production.example` — documents NEXT_PUBLIC_API_URL for Railway deployment (~2 tok)
- `package.json` — Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui (~50 tok)
- `src/app/layout.tsx` — root layout (~30 tok)
- `src/app/page.tsx` — default home page (~20 tok)
- `src/components/ui/` — shadcn components: button, card, badge, tabs, separator, scroll-area (~200 tok)
- `src/lib/utils.ts` — cn() utility (~10 tok)

## web/frontend/src/app/songs/[id]/

- `page.tsx` — SongPage (~1130 tok)

## web/frontend/src/components/

- `SectionContent.tsx` — Parse "E minor pentatonic" → { root: "E", scaleType: "minor_pentatonic" } (~1702 tok)
