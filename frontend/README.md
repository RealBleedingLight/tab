# Tab Engine (frontend)

Learn solos from Guitar Pro files — entirely in the browser. No backend, no account.

Open a `.gp / .gp5 / .gpx / .gp4 / .gp3` (or MusicXML) file and you get:

- **The tab, rendered and playable** — alphaTab draws tab (optionally with notation) and plays it with a
  built-in synth. A cursor follows along; drag across the tab to select bars.
- **Practice controls** — 25–150% speed, loop any bars, metronome, count-in, solo/mute your part to play
  along with the backing tracks. Shortcuts: `Space` play/pause, `[` `]` speed, `L` loop, `M` metronome.
- **A generated lesson plan** — the song is split into regions (from Guitar Pro markers, or evenly) and
  1–4 bar chunks (denser passages get shorter chunks). The plan goes: overview → warm-ups for the hardest
  techniques the part uses → every chunk (listen, slow play-along, speed trainer) → "connect" lessons that
  chain neighbours → full performance. Each lesson has one-click practice actions and a self-check.
- **Speed trainer** — loops a chunk and adds +5% every 2 clean loops up to 100%. The best speed reached is
  saved per lesson.
- **Live fretboard** — shows exactly which frets the current bars use and lights up notes as they play.
- **Insights** — detected key/scale with a scale map, difficulty map of the whole song, technique guides
  (how-to, common mistakes, drills), practice log.
- **Library & progress** — files and progress live in IndexedDB in your browser.

There's also a paste-an-ASCII-tab analyzer (`/tab`) and a scale/chord/key/interval reference (`/theory`).

## Development

```bash
npm install        # also copies the alphaTab runtime into public/alphatab (postinstall)
npm run dev        # http://localhost:3000
npm test           # jest (engine, song analysis, lesson plans, components)
npm run lint && npm run typecheck
npm run build
```

`/song?id=demo` opens a built-in demo exercise (alphaTex), no file needed.

## How it's put together

| Path | What |
| --- | --- |
| `lib/alphatab/loader.ts` | Loads the alphaTab UMD build from `/alphatab/` on demand (kept out of the JS bundle; its workers load from the same script). |
| `lib/alphatab/player.ts` | `ScorePlayer`: wraps the alphaTab API — rendering, playback, loop ranges, speed trainer, live notes. UI subscribes with `usePlayer(player, selector)` so the 20 Hz position updates only re-render the player bar. |
| `lib/song/extract.ts` | alphaTab `Score` → `SongModel` (engine string numbering: 1 = high e; tuning low → high). Detects per-note techniques. |
| `lib/song/analysis.ts` | Per-range analysis: notes/sec, techniques (incl. sweeps, string skips, stretches, position shifts), duration-weighted key detection, difficulty 1–5, suggested start speed; splits songs into regions & chunks. |
| `lib/song/lessons.ts` | Builds the ordered lesson plan from the analysis. |
| `lib/song/techniques.ts` | Technique guide content. |
| `lib/storage/library.ts` | IndexedDB library (file bytes stored apart from metadata) and progress. |
| `lib/engine/` | Music-theory engine (scales, chords, keys, ASCII tab parser). |
| `scripts/copy-alphatab.mjs` | Copies `alphaTab.min.js`, the Bravura font and the SF3 soundfont to `public/alphatab/` (git-ignored). |

Rendering and playback by [alphaTab](https://alphatab.net) (MPL-2.0).
