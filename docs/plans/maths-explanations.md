# Maths explanations pass — plan

> **Goal:** every mathematical tool is built before a chapter leans on it, every rule of thumb
> says when it holds and when it breaks, and no two chapters disagree. The arithmetic is already
> right; this pass is about the explanations around it.
> **Style:** the house pattern (`AGENTS.md`): build before measuring, picture before symbol, one
> idea per section, a character's mistake, playable numbers, quieter side trips.
> **Baseline:** `0.1.0` at `3d836e9` (main, 2026-09-27).
> **Status (2026-09-27): built.** See "Status: built" at the end for what changed from this plan
> and what is still open.

Every phase follows the project rules: all text in `public/locales/{lang}/chNN.json` for all 10
locales in the same commit, new terms in `docs/glossary.md`, `locales.test.ts` green, every stated
number verified in `chNN.test.ts`, `pnpm a11y` zero violations, screenshots at 1280 / 375 px ×
light / dark (+ `de` or `pl`, and `ar` for RTL), and the dialogue share per chapter kept at
roughly a quarter to a third.

## How this review was done

A read-only review, 2026-09-27:

- Chapters 0–5 and 6–11 were read in two parallel passes: the English locale files, each
  chapter's `src/chapters/chNN/`, `docs/course-plan.md` and the "still open" part of
  `docs/plans/ch07-11-extension.md`.
- A third pass read `../irish-explainer` and `../explainer-research` for transferable method.
- Numbers spot-checked by hand all held: ch10 GM 1.4 / PM 22°, the 0.95 rad/s / 6.6 s edge and
  0.031 critical gain, ch08's (13/9)e^{−2t} sin 3t, ch09's edges at 40 / 60 / 200, ch01's 1 m gust
  drop and 0.245 m droop.
- Nothing was run in a browser. **Every new number proposed below must be computed and pinned by
  a test before it is worded** ("compute a claim before you word it").

Section references (`§4.11`, `S2.6.b2`, …) are *section index . block index* in the English
locale file. Confirm the exact key before editing, because block indices move.

## What is already strong (keep)

- **Ch 0–2:** "3½ s" lateness, Theo's "(extra thrust ÷ drag) × climb time" (exact for linear
  drag), droop = 4.9/Kp, the plotted proof that no Kp passes Chapter 2's challenge.
- **Ch 3:** the step factor (1 − Δt/τ) and its three cases, the 86% prediction, the area quiz.
- **Ch 4:** e built twice ("one wish, two costumes"), the doubling ladder, the linear-rules caveat.
- **Ch 5:** i as a quarter turn, velocity = iω × position, cancelling twins, the Gibbs note.
- **Ch 6:** forces one at a time, the "2ζωn looks made up" multiply-out, the circle by Pythagoras.
- **Ch 7:** the whole table derived rather than handed over, the scribble test, the ledge mistake.
- **Ch 8:** the thrust-budget circle, the "How good is 4/|σ|?" honesty table, a zero as
  "no-zero curve + 1/|z| × slope".
- **Ch 9:** the Routh edge from s = iω, "the slowest pole doesn't make it slow".
- **Ch 10:** "can't tell 90° from 450°", the delay margin.

## Findings

### A. Wrong or contradictory (fix first)

| # | Where | Problem | Fix |
|---|---|---|---|
| A1 | `ch10` §3.8 (`sections.3.blocks.8.blocks.1`) | "45°–60° … is the ζ ≈ 0.4–0.6 sweet spot from Chapter 6", but Ch 6 §2.8, Ch 8 §3.2 and Ch 9 §4.2 all say 0.7–1 | "…corresponds to ζ ≈ 0.4–0.6: bouncier than Chapter 6's 0.7–1, because with a pipe in the loop being slow hurts more than a small overshoot." Say the 43 / 52 / 59° values are exact for ωn²/(s(s+2ζωn)) |
| A2 | `ch07` §4.11 | Final value theorem used without saying it needs stability; Theo's "That feels like cheating" (§4.11.b3) is left unanswered | Answer it: honest only if every other piece fades; a bottom with a right-half root leaves A/s but the rest grows and swamps it; checked in Ch 8 |
| A3 | `ch09` §3.6 | "the final height doesn't care about mg at all" | Add "…as long as it settles at all, which Mika's Ki = 50 doesn't" |
| A4 | `ch11` §0.8.b2 / b4, q3 | ~33° margin for a tune under 10% overshoot contradicts Ch 10's margin → overshoot rule (43° → ~25%) | One sentence: D acts on the measurement and the PI zero shapes the step, so the rule applies to the Ch 10 loop shape, not this one. Verify the numbers first |
| A5 | `ch03` §3.3 | Cliffhanger: slope "proportional to itself"; it was proportional to the *gap* (Ch 4's opener says "gap") | Say "the gap" |
| A6 | `ch05` q `ch5-q4` + §2.8 | Mirror twins justified by the result ("sideways parts cancel") | Real reason: the spring's rule has only real numbers, so the mirror of a solution is a solution. Rewrite the correct option and its why |
| A7 | `ch03` §1.20 | The tank "slows as it fills" with a constant tap | State the assumption (inflow driven by the level difference, or a drain leaking in proportion to depth) |
| A8 | `ch07` §1.8 | "the total shoots off" when spins match, but it's 1/σ, finite until σ → 0 | Match the widget string `unspin.matched` |

### B. Conditions missing from rules of thumb

Irish rule (`irish-explainer/docs/plan/heuristics.md`): every heuristic has a scope and at least
one named exception.

| # | Where | Rule | Missing condition |
|---|---|---|---|
| B1 | `ch08` §1.11.items.3 | overshoot = e^{−π\|σ\|/ω} | Two poles, no zero, step from rest; point forward to §2.0 (a zero turns 12% into 15%) |
| B2 | `ch08` §1.21.items.2 | the dominant pole decides | "…unless a zero nearly cancels it" (Ch 9 §3.22 is the counterexample) |
| B3 | `ch06` §1.25, §1.27.items.1 | "always a mix of e^{s₁t} and e^{s₂t}" | Fails at ζ = 1 (t·e^{−ωn t}); leaves out the constant target term. Say it where critical damping is defined, not only in Ch 8's side trip |
| B4 | `ch07` §1.9, §1.10, §3.3 | the transform "explodes" at the pole | The integral exists only to the right of the slowest rate; the fraction outlives the area. Honesty box: "from here on we trust the fraction…" |
| B5 | `ch10` §2.5 | "set s = iω" as a measurement | Assumes a stable system (true for the shower) |
| B6 | `ch08` §2.0 | cancellation makes a mode "disappear" | It's still inside the system, which matters if it's unstable |
| B7 | `ch09` §1.11 | right half = blows up, but the reader sees a steady half-metre yo-yo | The 0–20 N limits cap the growth (Ch 10 §6.0.items.3 already says so) |

### C. Used before it is built

This is the gap class a prerequisite validator catches (Phase 1).

| # | First use | Missing tool | Built in |
|---|---|---|---|
| C1 | `ch01` §0.4 promises it; `ch04` §3.6–7 uses d²/dt² | acceleration / second derivative | Phase 4 "Slopes of slopes" |
| C2 | `ch04` quiz items 2–3 | prime notation x′, x″ | Phase 4 notation table |
| C3 | `ch03` §1.18, vocab §1.22.items.2 | τ defined *by* 63% | Phase 4: τ as "time to finish at today's speed" (initial tangent on `ruler`), plus the Δt = τ one-step case; Ch 4 §1.11 links (1 − 1/n)ⁿ back to the coffee widget |
| C4 | `ch05` §1.0–2 | radians, π, arc = radius × angle; turns/s vs rad/s in the `smap` readout | Phase 5 "Measuring turns" |
| C5 | `ch05` §1.6–8 | cos and sin as waves | Phase 5 |
| C6 | `ch05` §1.3–4 | what an *imaginary* exponent means; velocity of an arrow is an arrow | Phase 5 "Tiny turns" |
| C7 | `ch10` §2.6–7, `ch11` §0.8.b1, q3 | an arrow's length and angle, arctan, dividing complex numbers | Phase 3 "Arrows have a length and an angle" |
| C8 | `ch07` table sine row | conjugates, (s − iω)(s + iω) = s² + ω² | Phase 3 |
| C9 | `ch09` §3.9.b1 | 1 + C(s)P(s) = 0 appears with no closed-loop algebra | Phase 2 "Closing the loop" |
| C10 | `ch07` §4.7–8, `ch08` §1.3.b1 | partial-fraction forms; complex residues → a decaying cosine | Phase 6 interlude |
| C11 | `ch07` §4.17.b0 | cites Ch 6's completing the square, which was an optional side trip | One-line restatement (Phase 6) |
| C12 | `ch10` §1.10 | e^{−Ls} argued from one line of the map; no mention of infinitely many poles | Phase 2: derive it with the probe (∫f(t−L)e^{−st}dt = e^{−sL}F(s)), then say it isn't a polynomial fraction, which is *why* the chapter leaves the pole map |
| C13 | `ch10` §2.4 | log axes explained as "fitting a wide range" | Phase 7: multiplying gains becomes adding heights; the gain axis is log too |
| C14 | `ch03` §0.9, §2.6 | Δ and ∫ never explained; t used as both limit and variable | Phase 4 |

### D. Smaller wording and consistency

- **Symbols reused:** σ (pole real part vs noise size, Ch 9 §5.9, Ch 11 §0.6 / §1.9); T
  (temperature, thrust, period); A (residue vs Ch 10's arrow); k (spring vs hand speed); P(s)
  clashes with the "P" controller.
- **Wording:**
  - `ch01` §2.1 option 2's why compares a force with a drag coefficient.
  - `ch01` §1.3: 2 ÷ 1.1 = 1.82, not 1.83.
  - `ch02` §2.0: overshoot needs a baseline.
  - `ch00` q1/q2: "about a second" is loose (63% in 1 s, 95% in 3 s).
  - `ch04` §4.0: "linear change rule with fixed coefficients" is jargon.
  - `ch04` §4.3: the slope of a constant and pulling constants out front are left unstated.
  - `ch05` §3.6 "further up" should be "further from the horizontal line".
  - `ch05` §4.0 vs §4.2: "almost any shape" vs "many periodic signals".
  - "speed" becomes "velocity" without comment.
  - `ch03` §1.22.items.1: "depends on" should be "is proportional to".

### E. Load and difficulty jumps

- **Ch 4 → Ch 5 is the sharpest jump.** One chapter brings complex numbers, radians, π, cos/sin,
  complex exponentials, Euler, mirror pairs, the map of s and Fourier.
- **Ch 7 is overloaded:** 82 blocks, `solve` alone 27, about 12 new ideas. Integration by parts
  appears twice (§2.12 and the §2.14 side trip).
- **Ch 3 carries three ideas.** Acceptable once Phase 4 moves notation into its own section.

## Phases

Each phase is independently shippable and keeps every commit green: shared building blocks land
first with their tests, then each piece of chapter content lands with its English text, every
translation, its glossary entries and its number tests together.

### Phase 1: concept graph and validator (`0.2.0`)

Stops this class of gap coming back. Modelled on `irish-explainer/scripts/plan/validate.ts` and
`docs/plan/knowledge-graph.md`.

- Add `src/story/concepts.ts`: one entry per concept (`id`, `prereqs`, `introducedIn`,
  `exercisedIn`, optional `preview` chapters where it may appear labelled but unbuilt).
- Add a validator test with four checks:
  - no cycles;
  - no concept used before all its prerequisites are introduced;
  - every concept exercised at least once after its introduction;
  - every `concept-map.ts` node maps to a concept id.
- Seed it from the tables above. Its first run should reproduce C1–C14 as known failures,
  recorded in an allow-list that later phases empty.
- Optional: a per-chapter "explained / applied / assumed" pass over the prose, using the
  `explainer-research/book-graph-pilot` judge method, to find gaps this review missed.

**Testable:** the validator fails on C1–C14 with the allow-list removed and passes with it.
The allow-list shrinks as each later phase lands.

### Phase 2: correctness fixes + "Closing the loop" (`0.3.0`)

- **Text-only fixes:** A1–A8, B1–B7, C12. Compute each new claim first: A4's margins, B1's 15%,
  the delay-probe identity.
- **New section at the end of Ch 8 (or the start of Ch 9 §3):**
  - Derive H = P·C·(R − H), so H = CP/(1+CP)·R and the poles are where 1 + CP = 0.
  - Ch 9's edge (s = iω in the cubic) and Ch 10's cliff (G∘(iω) = −1) become **one idea**,
    currently the biggest missed connection.
  - Rename P(s) to G(s) or "plant".
- **Widget:** a block diagram whose loop-gain arrow G∘(iω) sweeps with ω and turns red near −1.
  Keyboard operable, and its live region updates only on change.
- **Character beat (suggested):** June tries to add the controller and plant as if they were in
  series, with no loop.

**Testable:** Ch 10 no longer contradicts Ch 6; the closed-loop poles from 1 + CP = 0 match
`solveDrone` for the Ch 9 default gains; the widget's −1 crossing happens at the Ch 10 phase
crossover (0.95 rad/s for the position hand).

### Phase 3: interlude "Arrows have a length and an angle" (`0.4.0`)

Slots after Ch 6 or before Ch 10. It must precede C7 and should precede C8.

- **Builds:** length (Pythagoras again), angle, arctan, conjugates (z·z̄ = |z|²), dividing as
  un-stretching and un-turning, sinusoids with a phase (B cos + C sin as one shifted cosine; a
  time shift as an angle ωL).
- **Widget:** drag z and read its length and angle. Then slide ω in 1 + iωτ and watch
  1/(1+iωτ) shrink and turn back. That dot is a Bode-plot point being born, so Ch 10's plot
  can call back to it.
- **Character beat (suggested):** Theo divides the lengths but *adds* the angles.
- **Registry:** decide whether this is a new chapter id (renumbering touches the registry,
  routes, the a11y route list, concept map and saved runs) or a sub-route like `ch06b`. Prefer
  whichever avoids renumbering existing locale files.

**Testable:** C7 and C8 leave the allow-list; readouts match `src/math/` complex helpers at
ω = 0, 1/τ, 10/τ (−45° and 1/√2 at ωτ = 1).

### Phase 4: Chapter 3 foundations (`0.5.0`)

- **New section "Slopes of slopes":** three stacked, linked plots (height, speed, acceleration)
  sharing one cursor, reusing the `tangent` widget. Decode `0.5ḧ = T − 4.9 − 1.0ḣ` term by
  term, calling back to Ch 1's "two dots".
- **Notation table:** ḣ = h′ = dh/dt, ḧ = h″ = d²h/dt²; Δ as "change in"; ∫ as a stretched S
  for "sum", with a dummy variable.
- **τ picture first:** τ as "the time to reach room temperature if it kept today's speed".
  - Add the initial tangent to the `ruler` widget.
  - "It actually gets 63%, and Chapter 4 explains why."
  - Fourth step case: Δt = τ lands exactly on room temperature in one step.
- **Ch 4 §1.11:** link (1 − 1/n)ⁿ to the coffee widget with Δt = τ/n, so two constructions meet
  at one number.

**Testable:** C1–C3 and C14 leave the allow-list; the Δt = τ one-step claim and (1 − 1/n)ⁿ at
n = 1, 10, 100 are pinned in `ch03.test.ts` / `ch04.test.ts`.

### Phase 5: Chapter 5 rebuild (`0.6.0`)

- **"Measuring turns" (before 5b):** a unit wheel rolls along a line. Radian = the angle whose
  arc is one radius; the x and y shadows trace cos and sin over time; turns ↔ radians ↔ degrees.
  Fix the `smap` readout to say turns per second = ω/2π.
- **"Tiny turns" (inside 5b, before the spinner):** the Ch 4 `compound` widget in the complex
  plane, computing (1 + iθ/n)ⁿ. Each step is a tiny sideways nudge; as n grows the stretch
  vanishes and the path lands on the circle at angle θ. This builds e^{iθ} before Euler is quoted
  and shows *why* radians. State that an arrow's velocity is an arrow.
- **Twins:** explain the ½ and the "released from 1 m at rest" assumption.
- **Optional:** split into "Spinning numbers" and "The map of s", or move Fourier nearer Ch 10.

**Testable:** C4–C6 leave the allow-list; |(1 + iθ/n)ⁿ| → 1 and its angle → θ are pinned; the
dialogue share of Ch 5 stays in range despite the added material.

### Phase 6: split Chapter 7 + "Undoing a common denominator" (`0.7.0`)

- **7a "The Probe":** Ch 7 sections 0–1, plus the step and exponential table rows and linearity.
  Cliffhanger: "what does it do to a slope?"
- **7b "Calculus into Algebra":** the slope rule, the sine rows, solving the drone. Keep one
  integration-by-parts presentation, not two.
- **Interlude between them:**
  - partial fractions: one unknown per power of s in the bottom, so a quadratic gets Bs + C;
  - the cover-up trick;
  - complex residues pairing into A·e^{−σt}cos(ωt + φ), which is Ch 5's twins again;
  - a one-line restatement of completing the square.
  - Widget: coefficient sliders for A/s + (Bs + C)/quadratic, showing each piece's time curve
    and their sum.

**Testable:** C10–C11 leave the allow-list; each new chapter has its own cliffhanger, quiz and
concept-map nodes; saved-run contracts and deep links (`?ch=`) still resolve.

### Phase 7: log and decibel toolkit + wording sweep (`0.8.0`)

- A short Ch 10 side trip or interlude: multiplying becomes adding (building on the Ch 4 ln
  side trip), decibels, and the gain axis being log too.
- Sweep section D: disambiguate symbols (σ_n or "2 cm", T subscripts, residue vs arrow) and
  apply the small wording fixes.

**Testable:** C13 leaves the allow-list, which should now be empty; glossary updated for every
renamed symbol.

## Process lessons carried over from the sibling projects

- **Prerequisite graph with a validator** (`irish-explainer/docs/plan/knowledge-graph.md`,
  `scripts/plan/validate.ts`). A concept is introduced only after its prerequisites; an early use
  is a labelled preview, never counted as built. Phase 1.
- **Heuristics with honest limits** (`irish-explainer/docs/plan/heuristics.md`). Every rule has a
  scope, examples and a named exception. Section B.
- **Confusable pairs and spaced return** (`irish-explainer/docs/plan/curriculum.md`,
  `explainer-research/research.md`). Finishing a chapter isn't mastery, and this course has no
  spaced review. Candidate pairs for later recap or quiz items: value vs slope, pole position vs
  settling time, damping vs speed, gain vs phase margin.
- **Exposure ≠ supported use ≠ independent use** (`explainer-research/development-plan.md`).
  Relevant if chapter quizzes ever feed a progress model.
- **Reader sessions** (`irish-explainer/docs/engine/reader-sessions.md`;
  `docs/plan/reference-lessons.md` notes this course has no playtest evidence). 5–8 think-aloud
  readers on Ch 5 and Ch 7, with four probes: explain, locate the evidence, recognise it in an
  unseen example, keep your place. Report counts, not percentages. Ideally run *before* Phases 5
  and 6 to confirm the ranking.
- **Not useful here:** the `book-graph-pilot` graph data. It covers MacKay's *Information
  Theory* only, with no complex numbers, Laplace transform or ODEs, and its "Laplace's Method" is
  unrelated to the transform. Its *method* (explained / applied / assumed per passage) is useful.

## What's next

(The plan as proposed; see "Status: built" below for what happened.)

1. Phase 2's text-only fixes (A1–A3 first) are cheap and remove a visible contradiction; they
   can land before Phase 1 if wanted.
2. Phase 1 next, so every later phase has a finish line.
3. Decide the registry question (new chapter ids vs sub-routes) before Phases 3, 5 and 6.
4. Consider reader sessions before committing to the Ch 5 and Ch 7 rebuilds.
5. **Later, out of scope here:** a state-space / linearisation bridge (`explainer-research`
   `roadmaps.md` arc R11) and the Ch 10 → Ch 11 drone Bode widget still listed as open in
   `docs/plans/ch07-11-extension.md`.

## Status: built

Built 2026-09-27, one commit per phase, each with English, all nine translations, glossary
entries and claim tests together (`0.2.0` … `0.8.0`).

| Phase | Commit | What landed |
|---|---|---|
| 1 | `62943f8` | `src/story/concepts.ts` + `concepts.test.ts`: the prerequisite graph, read against the English chapters in reading order; `KNOWN_GAPS` started with 14 gaps |
| 2 | `e5d4367` | ch08 "Closing the loop on paper" + `loop` widget; ch10 delay derived with the probe; A1–A8, B1–B7 |
| 3 | `d97f3d4` | ch06 "Arrows have a length and an angle" + `arrows` widget; ch07/ch10/ch11 callbacks |
| 4 | `5866c9f` | ch03 "The slope of a slope" + `slopes` widget; Δ, ∫, τ picture first (ruler's starting-speed line), Δt = τ case; ch04 ties (1 − 1/n)ⁿ to the coffee |
| 5 | `7a73ef1` | ch05 "Measuring turns" (`turns` widget) and tiny turns (`tiny` widget) before Euler; twins' ½; map tour; Fourier wording |
| 6 | `eda7888` | ch07 "Undoing a common denominator" + `pieces` widget; one integration by parts, picture first |
| 7 | `66ea8eb` | ch10 "multiplying becomes adding" and decibels; σₙ for noise; ch00/ch01 wording; `KNOWN_GAPS` empty |

### Deviations from the plan

- **No new chapter ids.** The chapter number is the key for routes, the concept-map layout,
  progress, `common.json`'s `chapters.N` and the prose ("Chapter 7…") in all ten locales, so
  every interlude went in as a section of an existing chapter: "Closing the loop" in ch08,
  "Arrows" in ch06, "The slope of a slope" in ch03, "Measuring turns" in ch05, "Undoing a common
  denominator" in ch07.
- **Chapter 7 was slimmed, not split.** Partial fractions moved to their own section and the
  duplicated integration by parts is gone (the rectangle picture is now the main path). A true
  7a/7b split would renumber every later chapter.
- **Chapter 5 was not split** either; it gained two sections instead, so its load went up while
  its prerequisite gaps closed. Reader sessions (below) should decide whether to split it.
- **The P(s) letter stays.** Chapter 9 already used it; ch08 now introduces it as "P for plant, not
  the P of P control". T (thrust / temperature / period) and k (spring / hand speed) also stay:
  each use is local and ch10 already flags T as a period. The residue/arrow clash is fixed (ch10's
  arrow is now Y) and the noise size is σₙ.
- **Phase 1's optional explained/applied/assumed pass** was not run; the marker-based checker
  covers the gaps this review found.

### Found in review

- The concept checker caught two of this plan's own edits: "63%" written into Chapter 0 before
  τ exists, and partial fractions never named again after Chapter 7.
- Translators caught: the Chapter 11 "table" that is a paragraph in Chapter 10; the lost name
  "integration by parts" after the merge; `K_pσ` still meaning the noise; a pt-BR "sideways"
  rendered as "horizontal"; Spanish "a veces" ("sometimes") for "a times".
- Screenshots caught: labels clipping or colliding at 375 px (arc and target labels), reversed
  tick numbers on right-to-left canvases, a bracketed Arabic legend reordering.

### Validation

- `pnpm test` green on every staged commit (690 tests at the end, verified in a clean worktree
  before each commit); `concepts.test.ts` ends with `KNOWN_GAPS` empty.
- `pnpm a11y`: the full suite (154 pages: every page in every language, plus English dark) gave
  0 violations for Phases 2, 3, 4 and the final tree; Phases 5 and 6 ran the English suite
  (14 pages), also 0.
- Screenshots, looked at and fixed where needed: `loop` (en 1280 dark, en 375 light, de 375,
  ar 1280 dark), `arrows` (en 1280 light, both modes; ar 375), `slopes` (en 1280 dark, de 375
  dark), `turns` (en 1280 and 375 light, ar 1280 dark), `tiny` (en 1280), `pieces` (en 1280,
  ar 375), ch10's decibel note (pl 375). Not every widget was shot in every theme × language.

### Still open

- Native review of every new term (the "Open terminology questions" in `docs/glossary.md` list
  the translators' doubts phase by phase).
- Reader sessions on Chapters 5 and 7 (see "Process lessons"); they decide the splits above.
- A state-space / linearisation bridge, and the Ch 10 → Ch 11 drone Bode widget.
