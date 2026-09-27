# Split Chapters 5 and 7 — plan

> **Goal:** lighten the two heaviest chapters (the plan's "E. Load and difficulty jumps") by
> splitting each in two, so each new chapter keeps one driving question, its own mistake,
> recap, quiz, concept-map nodes and cliffhanger. The course grows from 12 to 14 chapters.
> **Baseline:** `0.9.0` at `7aa5682` (main, 2026-09-27).
> **Status (2026-09-27): in progress.**

## The new order

| New | Title | Sections | From old |
|---|---|---|---|
| 5 | Spinning Numbers | arrows, turns, spin | 5 |
| 6 | The Map of s | twins, map, fourier | 5 |
| 7 | The Drone's Real Personality | (unchanged) | 6 |
| 8 | The Laplace Probe | probe, explode | 7 |
| 9 | Calculus into Algebra | rule, table, pieces, solve | 7 |
| 10–13 | (unchanged content) | | 8–11 |

Chapters 0–4 keep their numbers.

## What the renumbering touches

- **Files:** `public/locales/{lang}/chNN.json` and `src/chapters/chNN/` renamed from the top down
  (`git mv`, so history follows); the two new chapters are split out of the old 5 and 7.
- **Prose:** every "Chapter N" / "Ch N" / range / `#/ch/N` link in all ten locales. References to
  old 5 or 7 are mapped by what they point at (spinners, i, radians, velocity → 5; twins, mirror
  pairs, spirals, the map of s, Fourier → 6; the probe, "screams", the s-plane's name → 8; the
  slope rule, the table, partial fractions, starting values, solving → 9), decided on the English
  and carried to each translation string by string; anything ambiguous is fixed by hand.
- **Code:** the chapter registry, cross-chapter imports, `concepts.ts` (`at(ch, …)`), the concept
  map (`CENTRES` for 14 clusters, node chapters, split nodes), the accessibility route list,
  tests that name a chapter, and comments that cite chapter numbers.
- **Progress:** stored `visited` / `completed` chapter numbers are migrated once (old 5 → 5 and 6,
  old 7 → 8 and 9, old 6 → 7, old 8–11 → 10–13). Saved-data keys (`ch10.robot`, `ch11.best`) are
  storage ids, not chapter numbers, and stay.
- **New content (English, then all nine translations):** a wrap for the new Chapter 5 (recap,
  2–4 quiz items with a "why" for every option, map, cliffhanger into the twins), kicker / title /
  question for the new 6 and 9, a wrap for the new Chapter 8 (recap, quiz, cliffhanger into the
  slope rule) including a new character mistake (a formula used where the area does not exist),
  and `common:chapters` entries.
- **Docs:** README, course plan, glossary "first chapter" cells, AGENTS.md examples. Past plans
  stay historical, with a note.

## Checks

`pnpm test` (locale validator, concept graph, claim tests), `pnpm lint`, `pnpm build`, full
`pnpm a11y` over the 16 routes in every language, screenshots of the new chapter ends and the
concept map at 1280 and 375 px, and a translator pass on every renumbered sentence.
