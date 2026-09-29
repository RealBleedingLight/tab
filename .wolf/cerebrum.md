# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-03-26

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

- **Subagent-driven execution**: User prefers parallel subagent dispatch for multi-task plans. Fork agents for independent tasks, wait for completion, then dispatch next wave.

## Key Learnings

- **Project:** tab
- **GitHub batch commit**: Use Git Trees API (create blobs → create tree with base_tree → create commit → patch ref) for uploading many files at once. Much faster than per-file Contents API writes. Lives in `GitHubClient.commit_files_batch`.
- **GitHub delete directory**: Contents API list_directory returns `sha` for each file — use that to delete one by one recursively. Lives in `GitHubClient.delete_directory`.
- **.context.md has two formats**: Old format: `- **Current lesson:** 01`. New format: `current_lesson: 01`. Frontend regex must handle both.
- **Practice page blank screen**: Caused by `lessonContent` staying null when `getLesson` 404s and sets `error` — the catch was shared for both context and lesson load. Fixed by separating lesson 404 into a no-lessons state.

- **Python 3.14 venv**: The venv at `guitar-teacher/.venv` uses Python 3.14. Pinned old pydantic (2.9.0) fails to build wheels. Use `>=` constraints — pydantic 2.12.5, fastapi 0.135.2, uvicorn 0.42.0 are already installed and work fine.
- **web/ package import**: `web/__init__.py` must exist at the root of the worktree for `from web.backend.x import y` imports to resolve.
- **create-next-app creates nested .git**: After scaffolding, remove `web/frontend/.git` before adding to the outer repo, otherwise git treats it as a submodule.
- **subprocess python executable**: Never hardcode `"python"` in subprocess calls — macOS only has `python3`. Always use `sys.executable` which points to the running interpreter, works in venv and Docker.
- **Run backend with venv**: `guitar-teacher/.venv/bin/python -m uvicorn web.backend.main:app --reload --port 8000` from repo root. The venv has all deps (fastapi, pydantic, gp2tab, guitar_teacher).
- **Frontend local dev**: `cd web/frontend && npm install && npm run dev` — must run `npm install` first on a fresh clone. Defaults to port 3000, points to localhost:8000 via NEXT_PUBLIC_API_URL default.
- **Storage is ephemeral locally**: Uploaded songs stored as JSON in `data/songs/` (created automatically). Cleared on restart only if the directory is deleted.
- **Monkeypatching SONGS_DIR in tests**: All router calls must use `storage_mod.SONGS_DIR` at call time (not default arg), so pytest monkeypatch of `storage_mod.SONGS_DIR` takes effect. This pattern is used throughout songs router.
- **Frontend is standalone Next.js**: As of 2026-09-18, `frontend/` is a self-contained Next.js 16 app. No Python backend, no API keys, no auth. All music theory logic runs client-side in `frontend/lib/engine/`. Routes: `/` (landing), `/tab` (ASCII tab analysis), `/theory` (scale/chord/key/interval lookup), `/settings` (about).
- **Engine module structure**: `lib/engine/` has: `notes.ts` (pitch class math), `data/scales.ts` (21 scales), `data/chords.ts` (22 chords), `data/intervals.ts` (12 intervals), `theory.ts` (getScale, getChord, detectKey, chordsInKey, suggestScales, getInterval, getFretboardPositions), `tab-parser.ts` (ASCII tab → ParsedNote[]), `analyzer.ts` (tab → full analysis), `types.ts` (all interfaces), `index.ts` (barrel). 54 tests total.
- **Fretboard uses camelCase**: `FretboardPosition.isRoot` not `is_root`. Changed from snake_case in the engine rewrite.

- **GP learning app (2026-09-29)**: `/` = library + upload (IndexedDB), `/song?id=<hash>` = workspace (alphaTab tab + player + lesson plan + live fretboard + insights), `/song?id=demo` = built-in alphaTex demo. `/tab` = ASCII analyzer only (GP mode removed), `/theory` unchanged. BottomNav + /settings removed in favour of top `Header`.
- **alphaTab loading**: UMD `alphaTab.min.js` + Bravura font + `sonivox.sf3` are copied to `public/alphatab/` by `scripts/copy-alphatab.mjs` (postinstall/predev/prebuild, git-ignored) and loaded via script tag in `lib/alphatab/loader.ts`. Never `import` alphaTab at runtime in app code — only `import type`. Tests use `require("@coderline/alphatab")` with `@jest-environment node`.
- **alphaTab string numbering**: `Note.string` 1 = lowest string; `staff.tuning` is high → low. Engine/SongModel use 1 = highest, tuning low → high. Fretboard component uses 0 = lowest.
- **alphaTex strings**: `fret.string` with string 1 = high e (opposite of alphaTab's model). Hammer `{h}` only links to the next note on the SAME string.
- **alphaTab settings JSON**: Map-typed options (e.g. `notation.elements`) accept plain objects at runtime; cast `as unknown as SettingsJson`.
- **Player state**: `ScorePlayer` is an external store; read with `usePlayer(player, selector)` (useSyncExternalStore). Position updates are throttled to 200 ms.
- **Key detection for songs**: use `detectWeightedKey` (duration-weighted, common-scale priors) in `lib/song/analysis.ts`, not engine `detectKey` — the latter favours 8-note diminished scales on solos with chromatic passing tones.

- **Harmony layer (lib/song/harmony.ts)**: chords per bar from (1) GP chord symbols, (2) accompaniment = all other pitched tracks (bass track's first note in the window = root), (3) implied from the melody (triads only, diatonic bonus). Key from lead+accompaniment profile + chord diatonic fit (+minor V) + tonic first/last chord. Chord→scale by minimal alteration of the key scale (F#7 in Bm → Phrygian Dominant, E in Bm → Mixolydian). `SongBar` now has `start`, `duration`, `accompaniment`, `chordSymbols`. User wants the app to algorithmically explain underlying scale/chords and give playing suggestions, not just list notes.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

- [2026-03-27] **Never hardcode `"python"` in subprocess** — use `sys.executable`. Caused 422 on upload when gp2tab tried to spawn `python` which doesn't exist on macOS.
- [2026-03-27] **toggle_section_complete must return None on missing section** — original silently no-op'd and saved unchanged data, returning 200. Now returns None → router raises 404.
- [2026-03-27] **Roman numerals in key endpoint must use _QUALITY_NUMERAL** — was returning all uppercase (I II III...) regardless of chord quality. Fixed to use `cr.chord.key` lookup.
- [2026-03-27] **File input must reset after upload** — `inputRef.current.value = ""` after success, otherwise same file can't be re-uploaded via click (onChange doesn't fire if value unchanged).
- [2026-03-27] **Never hardcode Railway port** — use `CMD uvicorn ... --port ${PORT:-8000}` shell form in Dockerfile. JSON array form `["uvicorn", "--port", "8000"]` won't expand env vars and healthcheck will fail.
- [2026-09-29] **Don't `pkill -f "next start"` / `pgrep -f next-server` in a compound bash command** — the pattern matches the shell's own command line and kills it (exit 144, can leave a half-written .next). Use `kill $(pgrep -f "^next-server")` on its own.
- [2026-09-29] **Never hide the alphaTab container with display:none** — it renders at width 0. Use zero height + overflow hidden.
- [2026-09-29] **alphaTab loop wrap is reported as a seek** — detect loops by end→start tick jump, not `!isSeek`.
- [2026-03-27] **pyguitarpro NoteEffect.deadNote missing** — not present in all file versions. Use `getattr(eff, 'deadNote', False)`. Same pattern for `MeasureHeader.tempo` — use `getattr(measure_header, 'tempo', None)`.

## Decision Log

- **2026-09-29 alphaTab via public/ UMD instead of bundled ESM**: keeps ~1.2 MB out of Next chunks, cached independently, and lets alphaTab spawn render/synth workers from `core.scriptFile` without a bundler plugin (Next 16 uses Turbopack).
- **2026-09-29 Lesson plan structure** mirrors the repo's lesson methodology (CLAUDE.md): technique prerequisites → 1–4 bar chunks → connect/assembly lessons → final performance, with speed ladders from a computed start speed (busiest bar ≈ 4 notes/sec) to 100%.

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

- **gitignore .env.local.example**: The `web/frontend/.gitignore` uses `.env*` glob which also blocks `.env.local.example`. Use `git add -f` to force-add the example file — it's safe documentation, no secrets.
- **Next.js 16 layout**: Standard App Router layout.tsx pattern unchanged from training data — html/body wrapper, Inter font, dark mode via className on html element.
- **Web platform architecture (SUPERSEDED 2026-09-18)**: The old FastAPI backend + Railway deployment is no longer used. Frontend is now standalone — see "Frontend is standalone Next.js" above.
- **Web platform stack summary**: 19 backend tests (pytest), routes: GET/POST /songs, DELETE /songs/{id}, POST /songs/{id}/sections/{sid}/complete, GET /theory/scales|chords|keys. Frontend routes: `/` (home+upload), `/theory` (3 tabs: scales/chords/keys), `/songs/[id]` (section viewer + full tab).
- **gp2tab integration**: Called as `subprocess.run([sys.executable, "-m", "gp2tab", path, "-o", outdir, "--format", "tab"])`. Produces `tab.txt` in outdir. Then `analyze_file(path)` from `guitar_teacher.core.analyzer` for section/technique analysis.
- **JSON upload limitation**: When uploading a `.json` file, `full_tab` is empty because `tab.txt` is expected as a sibling file — but upload saves to a temp path. This is a known limitation; app degrades gracefully ("No tab available").
- **Railway PORT**: Railway injects a `PORT` env var dynamically — never hardcode `--port 8000` in the Dockerfile CMD. Use shell form: `CMD uvicorn web.backend.main:app --host 0.0.0.0 --port ${PORT:-8000}`.
- **Railway CORS**: `ALLOWED_ORIGINS` defaults to `http://localhost:3000`. Must set `ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-url.vercel.app` as a Railway env var for the live frontend to reach the backend.
- **Railway filesystem is ephemeral**: Songs uploaded to `/app/data/songs/` are wiped on every redeploy. To persist, mount a Railway Volume at `/app/data`.
- **pyguitarpro attribute variance**: Different `.gp` files expose different attributes on `NoteEffect` and `MeasureHeader`. Always use `getattr(obj, 'attr', default)` for optional fields like `deadNote` and `tempo` on measure headers.
- **Vercel free tier CLI limit**: Free tier caps at 100 CLI deployments/day. If hit, deploy via GitHub integration (Vercel dashboard → Import Git Repo → set root dir to `web/frontend`) — no CLI limit.
