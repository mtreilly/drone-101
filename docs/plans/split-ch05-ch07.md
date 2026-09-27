# Split Chapters 5 and 7 — plan

> **Goal:** lighten the two heaviest chapters (the plan's "E. Load and difficulty jumps") by
> splitting each in two, so each new chapter keeps one driving question, its own mistake,
> recap, quiz, concept-map nodes and cliffhanger. The course grows from 12 to 14 chapters.
> **Baseline:** `0.9.0` at `7aa5682` (main, 2026-09-27).
> **Status (2026-09-27): built** (`0.10.0`). See "Built" at the end.

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

## Built

- **Prose:** `scratch/split/remap.py` decided every English reference to old 5 or 7 by what it
  points at (three by hand: Chapter 5's *i*, the probe chapter's kicker, and the ch08 sentence
  that cites both the spinning numbers and the spring's twin), carried the decision string by
  string to all ten locales (Arabic ordinal words, Italian "dal … al …", Chinese "第 N 到第 M 章"
  included) and checked the chapter numbers per string against English. The translators then
  proofread the renumbered sentences; none needed a grammar fix.
- **Split:** ch05 keeps arrows, turns, spin (widgets rotate, turns, tiny, spinner); ch06 has
  twins, map, fourier (widgets twins, smap, fourier, with `canvases.ts`). ch08 keeps probe and
  explode (widgets probe, explode, unspin; plays stepArea, longArea, scream; shared
  `area-plot.ts`); ch09 has rule, table, pieces, solve (widgets derivRule, table, pieces, solve;
  plays ruleExp, scale, square, residues) and imports ch08's `tools.ts`.
- **New content:** ch05 wrap (recap + velocity item, quiz `ch5-q1`, new `ch5-q5` period of a
  turn, `ch5-q6` direction of the velocity; cliffhanger into the twins); ch06 opening line and
  Fourier recap item; ch08 wrap (new recap item on finite areas, Theo's mistake `ch7-q7`, `ch7-q2`
  reworded, `ch7-q8` where the spinner's transform explodes; cliffhanger into the slope rule);
  two ch08 forward references now point at "the next chapter". Quiz and prediction ids are
  unchanged (they are saved answers). Numbers pinned in `ch05.test.ts` and `ch08.test.ts`.
- **Code:** registry (14 chapters), imports, concept graph anchors, concept map (14 clusters,
  a fourth row, viewBox 1320 high), a11y routes, `progress.migrate` (course 2) with tests, and
  comments.
- **Docs:** course plan (four chapter sections), glossary (renumbered live references, new
  names table, review notes), AGENTS.md lesson, historical-numbering notes in the older plans.
