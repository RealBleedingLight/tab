#!/bin/bash
# Auto-sync: commits and pushes any changes after a Claude session ends.
# Called by the Stop hook in .claude/settings.json

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    exit 0
fi

# Stage all changes
git add -A

# Commit with a session timestamp
git commit -m "Auto-sync practice session $(date '+%Y-%m-%d %H:%M')" --no-verify 2>/dev/null || exit 0

# Push (non-blocking, don't fail if offline)
git push origin main 2>/dev/null || true
