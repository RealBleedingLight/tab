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

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
