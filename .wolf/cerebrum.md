# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-03-26

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

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

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

- [2026-03-27] **Never hardcode `"python"` in subprocess** — use `sys.executable`. Caused 422 on upload when gp2tab tried to spawn `python` which doesn't exist on macOS.
- [2026-03-27] **toggle_section_complete must return None on missing section** — original silently no-op'd and saved unchanged data, returning 200. Now returns None → router raises 404.
- [2026-03-27] **Roman numerals in key endpoint must use _QUALITY_NUMERAL** — was returning all uppercase (I II III...) regardless of chord quality. Fixed to use `cr.chord.key` lookup.
- [2026-03-27] **File input must reset after upload** — `inputRef.current.value = ""` after success, otherwise same file can't be re-uploaded via click (onChange doesn't fire if value unchanged).
- [2026-03-27] **Never hardcode Railway port** — use `CMD uvicorn ... --port ${PORT:-8000}` shell form in Dockerfile. JSON array form `["uvicorn", "--port", "8000"]` won't expand env vars and healthcheck will fail.
- [2026-03-27] **pyguitarpro NoteEffect.deadNote missing** — not present in all file versions. Use `getattr(eff, 'deadNote', False)`. Same pattern for `MeasureHeader.tempo` — use `getattr(measure_header, 'tempo', None)`.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

- **gitignore .env.local.example**: The `web/frontend/.gitignore` uses `.env*` glob which also blocks `.env.local.example`. Use `git add -f` to force-add the example file — it's safe documentation, no secrets.
- **Next.js 16 layout**: Standard App Router layout.tsx pattern unchanged from training data — html/body wrapper, Inter font, dark mode via className on html element.
- **Web platform architecture**: FastAPI backend (`web/backend/`) + Next.js 16 frontend (`web/frontend/`). Backend runs on port 8000, frontend on 3000. Backend module path: `web.backend.main:app`. Storage: JSON files at `data/songs/`. Deploy: Railway (backend via Dockerfile) + Vercel (frontend).
- **Web platform stack summary**: 19 backend tests (pytest), routes: GET/POST /songs, DELETE /songs/{id}, POST /songs/{id}/sections/{sid}/complete, GET /theory/scales|chords|keys. Frontend routes: `/` (home+upload), `/theory` (3 tabs: scales/chords/keys), `/songs/[id]` (section viewer + full tab).
- **gp2tab integration**: Called as `subprocess.run([sys.executable, "-m", "gp2tab", path, "-o", outdir, "--format", "tab"])`. Produces `tab.txt` in outdir. Then `analyze_file(path)` from `guitar_teacher.core.analyzer` for section/technique analysis.
- **JSON upload limitation**: When uploading a `.json` file, `full_tab` is empty because `tab.txt` is expected as a sibling file — but upload saves to a temp path. This is a known limitation; app degrades gracefully ("No tab available").
- **Railway PORT**: Railway injects a `PORT` env var dynamically — never hardcode `--port 8000` in the Dockerfile CMD. Use shell form: `CMD uvicorn web.backend.main:app --host 0.0.0.0 --port ${PORT:-8000}`.
- **Railway CORS**: `ALLOWED_ORIGINS` defaults to `http://localhost:3000`. Must set `ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-url.vercel.app` as a Railway env var for the live frontend to reach the backend.
- **Railway filesystem is ephemeral**: Songs uploaded to `/app/data/songs/` are wiped on every redeploy. To persist, mount a Railway Volume at `/app/data`.
- **pyguitarpro attribute variance**: Different `.gp` files expose different attributes on `NoteEffect` and `MeasureHeader`. Always use `getattr(obj, 'attr', default)` for optional fields like `deadNote` and `tempo` on measure headers.
- **Vercel free tier CLI limit**: Free tier caps at 100 CLI deployments/day. If hit, deploy via GitHub integration (Vercel dashboard → Import Git Repo → set root dir to `web/frontend`) — no CLI limit.
