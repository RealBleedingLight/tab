@AGENTS.md

# Frontend notes (conventions & gotchas)

Standalone Next.js 16 app, everything client-side. See README.md for the architecture table.

## Conventions
- **String numbering differs per layer — convert explicitly:**
  - alphaTab model: `Note.string` 1 = LOWEST string; `staff.tuning` is high → low.
  - Engine / `SongModel`: string 1 = HIGHEST (high e); tuning arrays low → high.
  - `Fretboard` component: string 0 = lowest.
  - alphaTex source: `fret.string` with 1 = high e. `{h}` only links to the next note on the same string.
- **alphaTab is never imported at runtime** in app code — only `import type`. The UMD build, Bravura font and
  SF3 soundfont are copied to `public/alphatab/` by `scripts/copy-alphatab.mjs` (postinstall/predev/prebuild,
  git-ignored) and loaded via `lib/alphatab/loader.ts`. Tests use `require("@coderline/alphatab")` with
  `/** @jest-environment node */`.
- alphaTab settings JSON: Map-typed options (e.g. `notation.elements`) accept plain objects; cast `as unknown as SettingsJson`.
- Player state lives in `ScorePlayer` (external store); read it with `usePlayer(player, selector)`.
- Song key: use `analyzeHarmony(song).key` (whole band + chords). The lead-only `detectWeightedKey` and the
  engine's `detectKey` are weaker (the latter favours exotic 8-note scales on solos).
- Harmony source priority: GP chord symbols → accompaniment tracks (bass note at window start = root) → implied
  from the melody (triads only). Chord → scale = minimal alteration of the key scale.
- Real GP files in `../songs/` double as regression fixtures (tests skip if they're missing).

## Gotchas (learned the hard way)
- Don't hide the alphaTab container with `display: none` — it lays out at width 0. Use zero height + overflow hidden.
- alphaTab reports the loop jump back to the range start as a *seek*; detect loop completion by an end → start tick jump.
- Clear file inputs after upload (`e.target.value = ""`) or re-selecting the same file won't fire `onChange`.
- In a shell, don't `pkill -f "next start"` / `pgrep -f next-server` inside a compound command — the pattern
  matches the shell itself. Use `kill $(pgrep -f "^next-server")` on its own.
