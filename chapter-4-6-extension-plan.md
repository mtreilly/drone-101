# Chapters 4 & 6 extension — plan

> **Goal:** give Chapter 4 a floor under the exponent (what `bᵗ` means, why slope ÷ height is
> constant, where e comes from) and give Chapter 6 room to earn every term it uses (ωn, ζ,
> c_crit, the substitution, the ± roots, the circle, settling time, mode).
> **Style:** Bret Victor-style playable numbers in the prose, plus always-visible "side trip"
> callouts that are visually quieter than the main path.
> **Chapter 5 is unchanged.** Chapter 6 leans on its radians/ω definition.
> **Baseline:** `0.1.0` at `07b15e0`.

Every phase follows the project rules: all text in `public/locales/{lang}/chNN.json` for all
10 locales in the same commit, `locales.test.ts` green, every stated number verified in
`chNN.test.ts`, `pnpm a11y` zero violations, screenshots at 1280 / 375 px × light / dark (+ `de`
or `pl`, and `ar` for RTL).

---

## Phase 1 — Shared building blocks (`0.2.0`)

One owner; the chapters only consume these.

### 1a. Scrubbable numbers in prose

A number inside a sentence the reader can drag (or focus and use arrow keys), with other
numbers in the same block recomputing live.

- **Locale syntax** (text stays translatable, maths stays in code):
  `{scrub|n}` marks an input, `{calc|pow}` marks a computed output. The block carries the model:
  ```json
  { "t": "play", "id": "doubling", "text": "Doubling every second, after {scrub|n} s you have {calc|value}." }
  ```
  The widget-like `play` block looks up `id` in a chapter registry
  (`src/chapters/chNN/plays.ts`) giving, per input, `min / max / step / initial / unit` and, per
  output, a pure function of the inputs plus a `fmt()` precision. Outputs can also be words
  (`{calc|reading}` → a key from `plays.<id>.*`, e.g. "×√2 for the half-step").
- **Rendering:** input = `<span role="slider" tabindex="0" aria-valuemin/max/now/valuetext>`,
  dotted underline, `cursor: ew-resize`, hand font; pointer drag horizontal, `←/→` step,
  `Shift` ×10, `Home/End`. Outputs are plain spans; the sentence is one throttled polite live
  region (`aria-live` only on the paragraph, updated at most every ~400 ms).
- **Colour language:** inputs/outputs can take a role colour (`{scrub|k|eff}` → orange).
- **i18n:** all numbers via `fmt()`; in RTL the span is `dir="ltr"` isolated (`<bdi>`) when a
  unit follows. `locales.test.ts` learns that `{scrub|…}` / `{calc|…}` tokens must match across
  locales, like placeholders.
- **Motion:** none on keyboard steps; a small `scale(0.96)` press on pointer-down only.
- **Tests:** tokeniser unit test, registry test (every token in every locale resolves), keyboard
  test of value clamping/stepping.

**Testable outcome:** a demo `play` block in Ch 4 renders in all 10 locales, is operable by
keyboard only, announces its new value once per settle, and passes axe.

### 1b. Side-trip callouts (always visible, quieter)

The `callout` block (`{ t: 'callout', title, text }`) already renders as `card callout` but has
no styling of its own and is unused. Make it the "side trip":

- **Visually subordinate to widgets and cards:** no card shadow/fill; thin dashed `--ink-3`
  border (hand-drawn feel, like a pencilled box), slightly smaller type (≈0.95rem), body
  `--ink-2`, title in Patrick Hand with a small "side trip" kicker (`tc('sideTrip')` in
  `common.json`). Narrower than the text column on desktop (inline-start indent), full width
  at 375 px. Logical properties only, so RTL mirrors.
- **Still readable:** body contrast ≥ 4.5:1 in both themes and `prefers-contrast: more`
  (solid border there); forced-colours uses `CanvasText` border.
- **Content allowed:** `text` supports the full rich text (maths, colours) plus an optional
  `tex` display line and optional `play` sentence, so a side trip can be playable too.
  Extend the type to `{ t: 'callout'; title: string; text: string; tex?: string; play?: string }`.
- Not collapsible (decision: stays visible). Readers skip it by eye, which is why it must look
  optional.

**Testable outcome:** a callout sits visibly "below" a widget in hierarchy in screenshots at
both widths and themes; axe passes; `ar` mirrors correctly.

---

## Phase 2 — Chapter 4: build the exponent (`0.3.0`)

Two new sections **before** the existing `copy` section; existing sections keep their order.

### 2a. New section `ladder` — "Multiplying, again and again"

- Opening: Mika takes the coffee rule from Ch 3 at face value: "every step multiplies the gap
  by the same number". Theo: "then what does *half* a step multiply by?"
- `play` sentence: "Doubling every second, after {scrub|n} s you have {calc|value} —
  {calc|reading}." with n from −2 to 4 in steps of 0.5; readings: "2 × 2 × 2", "×√2 for the
  half second", "1: nothing has happened yet", "÷2: one second back".
- **Widget `ladder`:** bars for 2ⁿ at whole steps; toggle "split each step in half" / "in
  quarters" fills in intermediate bars (×√2, ×⁴√2) until they trace the smooth curve. Tangent
  shown over a short Δt: *the rise over Δt is always the same fraction of the height*. This is
  the reason slope ÷ height is constant, shown before `bases` measures it.
- Short `p` after: `bᵗ` for any t is "the multiplier that, repeated, makes b per second".
- **Tests:** √2, 2^−1, 2^2.5 ≈ 5.66 values used in prose; fraction-of-height is constant.

### 2b. New section `tiny-steps` — "Where e comes from"

The Ch 3 callback: its step rule `gap_next = (1 − Δt/τ)·gap` *is* the recipe for e.

- **Gated predict** (`ch4-compound`): "Grow by 100% over one second, but split it into more and
  more tiny steps (2 of 50%, 4 of 25%, …). With infinitely many, what do you end up with?"
  (a) infinitely much (b) exactly 2 (c) something a bit bigger than 2, and it stops growing.
  Every option has a why.
- **Mistake:** Mika picks (a) ("more steps, more growth, forever!"). The widget shows the total
  levelling off.
- **Widget `compound`:** step-count knob n (1, 2, 4, 12, 100, 1000); staircase of growth steps
  over one second with the running product; readout (1 + 1/n)ⁿ → 2, 2.25, 2.441, 2.613, 2.705,
  2.717 → e ≈ 2.718. Toggle **grow ↔ shrink**: (1 − 1/n)ⁿ → 0.368 = 1/e, with Ch 3's coffee
  dots overlaid, and a label: "63% of the way there — Chapter 3's τ ruler".
- Theo: "So e isn't random. It's what you get when you stop taking steps." (Resolves Mika's
  Ch 4 misconception from the existing `copy` section; move/trim her "random number" line so it
  is asked in `tiny-steps` and confirmed by measurement in `copy`.)
- `play` sentence: "With {scrub|n} steps of {calc|pct} each, you end with {calc|total}."
- **Tests:** every (1 ± 1/n)ⁿ value shown, 1/e ≈ 0.368, 1 − 1/e ≈ 0.632.

### 2c. Touch-ups to existing sections

- `copy`: replace the ln aside with a side-trip callout **"Every base is secretly e"**:
  `bᵗ = e^{(\ln b)\,t}`, so base 2 is `e^{0.693 t}`; that's why the slope ÷ height readout
  said 0.693. `play`: "base {scrub|b} → a = {calc|lnb}".
- `stretch`: one sentence linking a to the base (`e^{at} = (e^a)^t`), and a `play` line
  "a = {scrub|a} → every second multiplies by {calc|ea}".
- Concept map: add `Repeated multiplication` and `e (limit of tiny steps)` nodes (ch4), with
  links back to the new sections.
- Recap gets two items (fractional exponents; e from tiny steps). Quiz unchanged, plus one new
  item: "(1 + 1/n)ⁿ for huge n is closest to…" with a why for every option.

**Testable outcome:** a reader can answer "what is 2^1.5?" and "why 2.718?" from the page alone;
all new numbers tested; all locales in step; a11y clean; screenshots checked.

---

## Phase 3 — Chapter 6: earn every term (`0.4.0`)

Same five sections; each gets the missing steps. Order of terms follows first use.

### 3a. Section `spring` — build the equation in the prose

- One force at a time, with coloured arrows on `MsdView` (new overlay option, shared owner):
  spring `−kx` (orange: it is the "effort" in the analogy), damper `−c ẋ` (force ∝ speed; show
  it growing with speed), gravity handled by the free hover-thrust note.
- Math block assembles `m ẍ + c ẋ + k x = 0` term by term (Ch 4's "force = mass ×
  acceleration" repeated in one line).
- Side trip **"Units check"**: k and Kp are both N/m. A controller gain *is* a spring stiffness.
- Side trip **"Real dampers"**: car shock absorbers, door closers, a slamming door vs. a
  soft-close drawer. Intuition before numbers.

### 3b. Section `knobs` — ωn, ζ, the substitution, the roots

- **ωn earned:** "Take the damper away and you're back in Chapter 5: ω = √(k/m). That's ωn:
  how fast it swings when nothing slows it down." Plus the period: one swing every 2π/ωn s.
  `play`: "k = {scrub|k|eff} N/m, m = 0.5 kg → ωn ≈ {calc|wn} rad/s → one swing every
  {calc|period} s."
- **c_crit named, then ζ as a ratio:** "the damping that exactly stops the overshoot" is
  `c_crit = 2√(mk)`; `ζ = c / c_crit`. `play`: "c = {scrub|c}, c_crit = {calc|ccrit} →
  ζ = {calc|zeta}." (Quiz q2's "≈ 6.3 N·s/m" now refers back to this.)
- **The substitution shown:** divide by m, then colour-matched relabelling
  `c/m ↦ 2ζωn`, `k/m ↦ ωn²`, with Theo's check ("that's just renaming, so the two knobs show").
- Side trip **"Where the ± comes from"**: the quadratic formula applied step by step; a
  negative under the root is exactly Chapter 5's i.
- Side trip **"Why a circle?"**: `σ² + ω² = ζ²ωn² + ωn²(1 − ζ²) = ωn²`, with a `play`
  "ζ = {scrub|z} → s = {calc|roots}, distance from 0 = {calc|r}".
- **Damped frequency:** one sentence and the formula `ωd = ωn√(1 − ζ²)`: the wiggle is a bit
  slower than ωn. Add an `ωd` readout to the `personality` widget.
- Define **σ** (how fast it shrinks) and **ω** (how fast it spins) where the axes first appear.
- Define **step response** in the vocab list ("how it answers a sudden 1 m change of target").

### 3c. Section `damping` — mode, settling, the 0.7 rule

- Define **mode** in a vocab item ("one e^{st} ingredient of the motion") before "the slowest
  mode that actually appears".
- Side trip **"How long is 'settled'?"**: the 2% band; e^{−4} ≈ 1.8% → "about 4 time constants"
  → Chapter 3's τ ruler.
- **"Four times as long"** made visible: `race` widget shows both settle times and the ratio
  (already computed; make the sentence cite them).
- **The 0.7 rule earns its reason:** add a ζ = 0.7 ghost to `race` (≈ 4.6% overshoot, reaches
  within 5% first). Prose: what you trade, a little overshoot for speed.

### 3d. Section `drone` — callback

- `play`: "Kp = {scrub|kp|eff} N/m → ζ = {calc|zeta}, ωn = {calc|wn} rad/s,
  droop = {calc|droop} m (if we took away the free hover thrust)." Makes the Kp ↔ ζ ↔ droop
  trade-off something the reader can drag.
- Remove the "Try it in the first widget" note (the `play` replaces it).

### 3e. Wrap

- Recap: add c_crit/ζ-as-ratio and ωd items.
- Quiz: add one item on ωd or c_crit (why for every option); keep existing four.
- Concept map: add `Critical damping`, `Mode` nodes.

**Tests (`ch06.test.ts`):** c_crit = 2√(0.5·20) ≈ 6.32; ωn = √(20/0.5) ≈ 6.32 rad/s, period ≈
0.99 s; circle identity for sampled ζ < 1; ωd at the default; ζ = 0.7 overshoot ≈ 4.6%;
e^{−4} ≈ 0.018; race ratio for ζ = 3 vs 1 matches the "about four times" wording; every `play`
output at its initial value.

**Testable outcome:** every symbol in Ch 6 is defined in the prose or a side trip before it is
used; the side trips can be skipped without losing the main thread; all locales, tests, a11y
and screenshots pass.

---

## Phase 4 — Translations and review (`0.4.x`)

- Glossary additions per locale, recorded like the existing terms (definition, choice, rejected
  alternatives, source): *side trip*, *critical damping*, *damped frequency*, *mode*,
  *step response*, *settling time*, *compound/tiny steps*. Check against the per-locale
  control sources in `CLAUDE.md`.
- CJK line-break and Arabic RTL passes on `play` sentences (numbers isolated, units on the
  intended side).
- Native-speaker review queued for the new prose and quiz items.

---

## Order of commits (sketch)

1. `feat(story): scrubbable numbers in prose (play blocks)` + tests
2. `feat(story): side-trip callout styling` + `common.json` key ×10
3. `feat(ch04): ladder section` (EN + 9 locales + tests)
4. `feat(ch04): tiny-steps section and compounding widget`
5. `feat(ch04): every base is secretly e side trip; recap/quiz/map`
6. `feat(ui): force arrows on MsdView`
7. `feat(ch06): build the equation; units and dampers side trips`
8. `feat(ch06): earn ωn, c_crit, ζ, substitution, roots, circle, ωd`
9. `feat(ch06): mode, settling time, 0.7 rule on the race`
10. `feat(ch06): drone play sentence; recap/quiz/map`
11. `docs: update control-course-plan.md for chapters 4 and 6`

## What's Next

- Reuse `play` sentences where Chapter 7 and 8 state numbers (transform of `3e^{−2t}`, pole
  positions → overshoot/settling) and in Chapter 2's droop explanation (`4.9/Kp`).
- Consider side trips for Chapter 7's partial fractions and Chapter 8's overshoot formula.
- Audit remaining chapters with the same "every term defined before use" table used for Ch 6.
