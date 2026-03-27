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

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

- **gitignore .env.local.example**: The `web/frontend/.gitignore` uses `.env*` glob which also blocks `.env.local.example`. Use `git add -f` to force-add the example file — it's safe documentation, no secrets.
- **Next.js 16 layout**: Standard App Router layout.tsx pattern unchanged from training data — html/body wrapper, Inter font, dark mode via className on html element.
