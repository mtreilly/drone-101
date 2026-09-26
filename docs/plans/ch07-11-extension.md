# Chapters 7–11 extension — plan

> **Goal:** give Chapters 7–11 the same floor Chapters 4 and 6 got: every term, symbol, formula
> and number earned before it is used; every rule of thumb given its reason and its error bar;
> every stated number something the reader can drag; the group's mistake actually happening on
> the page; and widgets whose pictures, readouts and status lines never disagree with the maths.
> **Style:** playable numbers in the prose (`play` blocks, `src/story/play.ts`) plus always-visible
> side-trip callouts that are quieter than the main path, exactly as built for Ch 4/6
> (`docs/plans/ch04-06-extension.md`, commits `7e76684`, `16c2598`, `af4d4f8`, `ffc8acf`).
> **Chapters 0–6 are unchanged** except where a shared component (plot labels, s-plane, drone
> view, concept map) is fixed for everyone.
> **Baseline:** `0.1.0` at `9815e60` (main, 2026-09-26). Nothing in this document has been
> implemented; it is research and planning only.

Every phase follows the project rules (`AGENTS.md`): all text in `public/locales/{lang}/chNN.json`
for all 10 locales in the same commit, `locales.test.ts` green, every stated number verified in
`chNN.test.ts`, `pnpm a11y` zero violations, screenshots at 1280 / 375 px × light / dark
(+ `de` or `pl`, and `ar` for RTL), colour language kept, page-physics rules 1–11 respected.

## How this review was done

For each chapter: the English locale file, every file under `src/chapters/chNN/`, its tests, its
outline in `docs/course-plan.md` and its nodes in `src/story/concept-map.ts` were read in full.
The chapter was run from the dev server with `?reveal` at 1280 × 900 and 375 × 800, light and
dark (German at 375 px for Ch 8 and Ch 10), with a named `agent-browser` session, and every
widget was screenshotted and looked at. Keyboard paths were tabbed through in the browser.

Every number in the chapters' prose, quiz items and status lines was re-derived, and **every new
number this plan proposes was checked first**, with Vitest files that import the real simulation
and chapter code (`DroneSim`, `ShowerSim`, `solveDrone`, `stepMetrics`, `runMission`, `margins`,
…), including the cases where the obvious claim turns out to be false (for example 4/σ settling
is up to 46 % optimistic at ζ = 1; more Kd makes noise-driven chatter *worse*; the "slowest
pole" of a PI loop does not make the step slow). The chapter tests to add are listed with their
expected values, so an implementer can copy them into `chNN.test.ts`.

**Where the evidence lives** (copied from the review session into the gitignored `scratch/ch07-11-evidence/`; original `$SCRATCH` =
`/private/tmp/claude-501/-Users-micheal-Development-animations/ad47549a-62e8-48b3-821f-378548ccb79c/scratchpad`):

| What | Path |
| --- | --- |
| Screenshots (143 PNGs, indexed in the appendix) | `$SCRATCH/shots/ch07` … `ch11` |
| Number checks (149 tests, all passing) | `$SCRATCH/checks/ch07-*.test.ts` … `ch11-*.test.ts` |
| Run them | `cd /Users/micheal/Development/animations && pnpm vitest run --root $SCRATCH/checks` |
| Per-chapter raw review notes | `$SCRATCH/reviews/ch07.md` … `ch11.md` |

Inside each chapter's phase, "block references" such as `solve[10]` mean section id + 0-based
block index in the English locale file; test references such as `N:226` mean the check file
(N = `chNN-numbers.test.ts`, X/E = `-extra`, P = `-plays`, M = `-misc`, D = `-pderr`) and line.
Every item carries **Impact** (High / Medium / Low, for the learner) and **Size** (S / M / L).

---

## Ranked summary: what matters most

Highest learner impact first. Each line names the chapter phase where it is specified.

1. **Ch 8: the pole playground's challenge zone contradicts its own status** (drawn from the 4/σ
   and ζ rules, judged by measured metrics: 93 grid points "inside" fail, 16 "outside" pass), and
   the guide lines are drawn without a reason. Fix the zone, show ζ, ωn, the first-push thrust,
   and give overshoot and settling their derivations. (Phase 3b/3c)
2. **Ch 7: the ledge mistake never happens on the page.** Step 1 already shows the correct −h(0)
   terms before the widget "reveals" they were forgotten; the outline's second predict is missing.
   Show the group's wrong Step 1, swap it on the existing (unlistened) `ch7:ic` event, add
   `ch7-ledge`. (Phase 2e)
3. **Ch 9: three status lines give wrong advice or false claims** ("Add more Kd" where more Kd
   raises overshoot from 0.4 % to 7.9 %; "shrinking slowly" for Ki = 30–38 drones that are still
   ringing; "the jitter left comes from P" when D still contributes 0.4 N vs P's 0.3 N), and the
   kick widget's headline readout is 20.0 N vs 19.9 N. (Phase 4c/4b/4f)
4. **Ch 10: the Bode curve is never derived, phase in degrees is never defined,** and June's
   mistake is off-page (the designer opens on the normal hand) with her diagnosis line reversed.
   (Phase 5b/5c/5f)
5. **Ch 11: the four "real-world grit" ingredients have numbers but no reasons or callbacks**
   (motor lag → Ch 3 τ and Ch 10 phase: it costs the reference tune 25° of phase margin), the
   suggested fix "Kd ≈ 6, a hair of speed" is fragile (fails 1 of 30 noise seeds, more than
   doubles arrival), and the "D from measurement" toggle is a no-op. (Phase 6a/6b/6c)
6. **Terms used before they are defined, per chapter** (full tables inside each phase): Ch 7
   𝓛{·}, f′, H(s), linearity, complex s; Ch 8 Kd, p̄, T(s), ζ (never visible); Ch 9 h⃛, τ as a
   dummy variable, τ_f; Ch 10 phase (degrees), log axes, "phase lead", "frequency response", the
   symbol L used for both the delay and the loop; Ch 11 crossover, standard deviation window.
7. **Bridges back that are missing** (each phase lists them): Ch 4's sticky note ("in Chapter 7
   this grows up") is never cashed in; Ch 6's ωn/ζ/ωd are absent from Ch 8's playground and
   Ch 9's derivative section; Ch 7's transfer-function route is not used by Ch 8's G(s) or Ch 9's
   cubic; Ch 8's zeros are not used to explain Ch 9's PI zero; Ch 3's first-order lag is both the
   motor lag and the D filter in Ch 11.
8. **Widgets whose pictures disagree with the numbers:** Ch 7 `unspin` payoff off-screen and a
   pole × used for "final total"; Ch 7 `probe` says "infinite" for the sine at s = 0 (false);
   Ch 8 `zero` plot clips at every zero right of −0.93 (readout 569 %, curve gone); Ch 8
   playground under reduced motion shows "CRASH!" while the plot flies off; Ch 9 playground clips
   the bump flight at 3 m; Ch 10 Bode slider shows 0.2012 rad/s for a 0.20 measurement; Ch 11
   checklist shows sentinel "6.00 s"/"8.00 s" for failures and the plot hides the clipping Theo
   describes.
9. **Label collisions at 375 px and in German** in every chapter (Ch 7 explode/unspin, Ch 8 limit
   "motors can't pull down", Ch 8/11 DroneView "target", Ch 10 margins, Ch 11 "20 N max"), and
   s-plane/DroneView text at ~7 px on phones. One shared fix in `Plot` and `SPlane`. (Phase 1)
10. **Quiz gaps:** Ch 8 q3 overstates "same σ → same settling" (−8 % … +56 %); Ch 8 q4 repeats
    the predict card; Ch 11's three items test Ch 7/8/10, not the finale's own ideas; Ch 9 has no
    item on "too much D"; Ch 10 has no read-the-margins item.
11. **Concept map:** Ch 11 owns one node; motor limits appear nowhere; 8 ellipse overlaps in
    English, 19 in German, 16 in Polish; the outline's finale draw-in is missing. (Phase 6e)
12. **Outline drift:** `docs/course-plan.md` still lists Ch 11's old "saturates < 0.5 s"
    criterion, Ch 9's peak-thrust star (impossible: every take-off with Kp ≥ 10 asks for 20 N),
    and attributes the 6.6 s hunting period to Ch 0's robot hands (theirs is 13.8 s; 6.6 s is a
    position hand). (Phases 4e, 5g, 6g)

---

## Phase 1 — Shared building blocks (`0.5.0`)

One owner each; the chapters only consume these. Ordered by how many chapters need them.

| # | Building block | Needed by | Owner | Size |
| --- | --- | --- | --- | --- |
| 1a | **`plays.ts` per chapter** registered in `src/chapters/registry.ts` (`plays: () => import('./chNN/plays')`) for ch07–ch11, following ch04/ch06. `play.test.ts` already checks every token in every locale resolves. | all five | registry (story) | S |
| 1b | **`Plot` label avoidance**: line labels that step off their own line and off series (`setLines` label offset, `avoid: [...]`), marker labels that avoid line labels, an optional label side (`labelAt: 'start'`), custom ticks, and a minimum label font at narrow widths. | Ch 7 explode/unspin, Ch 8 limit, Ch 9 poles, Ch 10 margins, Ch 11 thrust | `src/ui/plot.ts` | M |
| 1c | **`Plot` autoscale / clamp-and-arrow** for points that leave the frame (`autoMax`, eased on pointer, snapped on keyboard), plus a "distance arrow" annotation (vertical double arrow with a value label). | Ch 7 unspin/explode, Ch 8 zero, Ch 9 playground bump, Ch 10 margins (GM/PM arrows) | `src/ui/plot.ts` | M |
| 1d | **Non-pole marker shape** (diamond/flag) so × and ○ stay reserved for poles and zeros. | Ch 7 unspin | `src/ui/plot.ts` | S |
| 1e | **`SPlane`**: ωn circle guide (Ch 6 already draws one; move it into options), rays labelled from ζ via `fmt()` and locale keys, guide-label font ≥ 11 px at narrow widths, keyboard snapping to the step grid, off-edge markers with **true** values in `describe()`, ghost poles, a `zero` marker where missing, and a "double" wording for real double poles. Optional: split a mirror pair into two real poles when dragged past the axis. | Ch 8 playground/zero, Ch 9 poles, Ch 11 mission | `src/ui/s-plane.ts` | M (L with the split) |
| 1f | **`DroneView` target-label placement** that avoids the drone body and the thrust label, and a minimum text size at 375 px. | Ch 1/2/6/8/9/11 pictures | `src/ui/drone-view.ts` | S |
| 1g | **`Trace.command`** (requested, unclipped thrust) recorded by `runDrone` / `sample()`. | Ch 9 kick/noise, Ch 11 mission ("asked for" vs "delivered"), Ch 8 limit | `src/chapters/ch09/pid-tools.ts` (Ch 11 imports it) | S |
| 1h | **Math block that swaps on a bus event** (`{ t: 'math', tex, alt?, on?: 'ch7:ic' }`) for on-page mistakes that get fixed; renders the correct form under `?reveal`; both forms validated across locales. | Ch 7 solve (first consumer); Ch 9/10 mistakes could reuse | `src/story/renderer.ts` | S |
| 1i | **Widgets follow `play:<id>`** (the bus already emits it; nothing listens yet): a small helper `followPlay(bus, id, fn)` and, per chapter, one widget that moves its sliders to the sentence's values. | Ch 9 `cliff` → poles widget (first), Ch 8 gains → playground, Ch 10 total → bode | `src/story/play.ts` | S |
| 1j | **`toggle()` accessible names from maths labels** via `plainText()`, as sliders already do (today "Mika's big Ki = 50" is announced as "Mika's big = 50"). | every chapter with maths in a switch label | `src/ui/controls.ts` | S |
| 1k | **Keyboard-settle helper** for sliders that record one dot per deliberate choice (fire after ~600 ms idle or on Enter). | Ch 7 probe (60 arrow presses = 60 dots); Ch 10 bode | `src/ui/controls.ts` | S |
| 1l | **Droop band / settle line helper** (dotted blue "settles here" line + red band + label), one look for Ch 2, Ch 6, Ch 7 solve, Ch 9 integral. | Ch 7, Ch 9 | `src/ui/plot.ts` | S |
| 1m | **`regionFromMetric(f, grid)`** contour helper → polygon, for challenge zones judged by `stepMetrics` (pure, testable). | Ch 8 playground zone; Ch 9 tuning targets | `src/math/` | M |
| 1n | **Ground handover** `groundCut(trace)` next to `fallTrace` (formula up to h ≤ 0, then 0), same stay-down rule as `hitPage`. | Ch 8 playground | `src/chapters/ch08/fall.ts` | S |
| 1o | **Loop-margin helper** `loopMargins(C, plant, extras)` (crossover, PM, GM, delay margin) in `src/math/bode.ts`, with `criticalHandGain(L, τ)`, `delayMargin()`, `lagStatus(deg)` as pure functions. | Ch 10 plays P4–P7, Ch 11 play P3 | `src/math/bode.ts` (Ch 10) | M |
| 1p | **Multi-seed helper** `starsOnSeeds(tune, n)` for any noisy mission claim. | Ch 11 (every tune named in prose), Ch 9 noise | `src/chapters/ch11/mission.ts` | S |
| 1q | **Ch 6 `regime.*` strings → `common.json`** so Ch 9's ζ play (and Ch 10/11) can say "underdamped / critical / overdamped". | Ch 9 | story/i18n | S |
| 1r | **Concept map**: overlap unit test for every locale (using the renderer's own width formula), no node outside the viewBox, new nodes `limits` (Ch 8), `motorlag` and `tradeoff` (Ch 11), edges listed in Phase 6e, finale draw-in animation gated on `prefers-reduced-motion`, phone scroll to the finale cluster. | Ch 7–11 map edges, Ch 11 reveal | `src/story/concept-map.ts` | M |
| 1s | **Readout labels never hyphenate mid-word** in long-word locales (`hyphens: manual` on `.readout .label`, wrap at spaces). | every HUD (seen in `de` Ch 10) | `src/ui/ui.css` | S |
| 1t | **Page-ceiling re-measure on scroll** (debounced), rule 6, for precomputed traces. | Ch 11 `page-hit.ts` (Ch 9 already does it) | Ch 11 / page-physics | S |

**Tests:** unit tests for 1b–1e (label geometry, autoscale keeps the limit in frame, SPlane
`describe()` reports true values), 1g (command recorded and within [0, 20] only after clipping),
1h (both forms validated in all locales), 1i (a widget receives the play values), 1j (accessible
name equals `plainText()`), 1m (contour agrees with `stepMetrics` at sampled points), 1r
(no overlaps in en/de/pl; every edge references existing nodes).

**Testable outcome:** the shared components change in one commit each, with tests, and every
chapter 0–11 still passes `pnpm test`, `pnpm a11y --quick` and a screenshot pass (the map is
shown on every chapter page, so the map re-layout is checked in all 12).

---

## Phase 2 — Chapter 7: The Laplace Transform (`0.6.0`)

### The phase

Same six sections, same order. The new material sits in play sentences and side-trip callouts, so the main thread stays short. Order of terms follows first use.

#### 2a. Section `probe` — why this probe, and an endless finite area

- **Move** the last sentence of probe[9] ("With complex s, its left-right part…") into explode[4]. Keep: "The total area must settle to a finite value, so that each s gets one number. If the probe fades too slowly, the area keeps growing and that s has no answer." **Impact High / Size S**
- **Fix** probe[3]: "Multiply it by a **probe**, the exponential $e^{-st}$ from Chapter 4 (for positive s it shrinks)". Also add one clause for "signal": "Take any signal, any curve that changes over time, $f(t)$." **Impact Medium / Size S**
- **Side trip S1 "Why this probe?"** after probe[5] (prose in §5). **Impact High / Size S**
- **Side trip S2 "An endless area that stops growing"** with `play longArea` (P2): "Stop adding the area of $e^{-t}$ at t = {scrub|T} s and you already have {calc|A}. Everything after that adds only {calc|left}." **Impact High / Size S**
- **Play `stepArea`** (P1) replaces the first sentence of probe[8]: "Probe the step at s = {scrub|s}: the area is 1 ÷ {calc|s} = {calc|F}. Double s and the area halves." **Impact Medium / Size S**
- **Widget `probe`:** status `sloshes` for the sine at s ≤ 0 (new key ×10); debounce keyboard dots; F-plot marker and "no finite area" band; help "the F(s) plot". **Impact High / Size M**
- **Tests:** 1/s at 1, 2, 4 → 1, 0.5, 0.25; 1 − e^{−T} at 1, 3, 5 → 0.632, 0.950, 0.993; sin 2t at s = 0 running area ∈ [0, 1] (not infinite); dot-debounce unit test (keyboard steps ≠ dots).
- **Testable outcome:** a reader can say why the probe is e^{−st} and why an infinitely long area can be finite. The sine no longer claims "infinite" at s = 0. Keyboard users get one dot per deliberate choice.

#### 2b. Section `explode` — make the scream visible

- **Play `scream`** (P3) after explode[3]: "Signal $e^{at}$ with a = {scrub|a|out}, probe s = {scrub|s}: the product fades at s − a = {calc|gap} per second, so its area is {calc|F}{calc|verdict}." Verdict words `plays.scream.none` / `.loud` ×10. **Impact High / Size S**
- **explode[4]:** add the Ch 5 bridge, "Our spring's spinner from Chapter 5, $e^{2it}$ (half of the twin pair)", and either draw arrows or say "path". **Impact Medium / Size S**
- **Widget `explode`:** move the line label off the line; clamp the marker with ↑ value; status `close` quotes F; visible-fraction clause. **Impact Medium / Size S**
- **Widget `unspin`:** autoscale so the matched payoff (→ 1/σ) stays in view; replace the × with a non-pole marker; label placement; optional piece-arrows every 0.25 s; optional linked s-plane with draggable s and the signal's point at 2i. Status: "Spins matched! … The total is {m} = 1/σ, and it heads to infinity as σ → 0." **Impact High / Size M** (s-plane link: **Size L**, optional)
- **Tests:** a = 0.5 with s = 1, 0.6, 0.51 → 2, 10, 100; default explode 0.50; unspin default |F| 0.644; matched 10 (σ 0.1) and 20 (σ 0.05); running total at 25 s = 9.18; autoscale keeps the limit inside the frame for all σ ∈ [0.05, 2], ω ∈ [0, 4].
- **Testable outcome:** at 1280 and 375 px the matched spin visibly runs to its (in-frame) limit. No × appears before Ch 8 except as a deliberate pole seed. Labels never collide.

#### 2c. Section `rule` — notation, the Ch 4 sticky note, the missing product rule

- **rule[0]** opens with the sticky note: "Remember the sticky note from Chapter 4? For $e^{at}$, taking a slope was just × a. Now watch what the probe does with a slope." **Impact Medium / Size S**
- **Vocab block** (before rule[1]): *f′* "short for df/dt, the slope (Chapter 6 wrote ẋ)"; *𝓛{f}* "the transform of f: the same thing as F(s)"; "a capital letter is the transform of its small letter". **Impact High / Size S**
- **Play `ruleExp`** (P5) after rule[2]: "With a = {scrub|a} and s = {scrub|s}: the slope's area is {calc|lhs}, and s·F − f(0) = {calc|sF} − 1 = {calc|rhs}. Same number." **Impact Medium / Size S**
- **Side trip S3 "Area undoes slope, even for a product"** after rule[9], holding the product-rule TeX and the one-line 𝓛{f″} derivation. Replace rule[10]'s "follows" with that line. **Impact High / Size S**
- **Side trip S4 "What about a jump?"** after rule[7]. Reword rule[7]'s Theo line: "They match, even for my wobbly scribble. Not a lookup rule after all: it's what the area machine does to any slope." **Impact Medium / Size S**
- **Widget `derivRule`:** rhs colour away from orange; "second plot" wording; ≥ 3 y ticks at 375; status quotes both values; help mentions presets as the keyboard route. **Impact Medium / Size S**
- **Tests:** e^{at} identity at (a, s) = (−1, 1) → −0.5; L{f″} for cos 2t at s = 1 → −0.8; presets worst gap < 1e-3; jump gap without spike 1.4e^{−2s} = 0.189 at s = 1.
- **Testable outcome:** every symbol in rule (f′, 𝓛, H, [·]₀^∞, f′(0)) is defined before use, and a reader can reproduce integration by parts from the product rule.

#### 2d. Section `table` — twins honestly, linearity earned

- **table[2]** (Mika) plus one sentence: "Chapter 5 *added* the twins to get a cosine. *Subtract* them instead and the along parts cancel, leaving $2i\sin\omega t$. That's where the $2i$ comes from. (For complex a, the row works when the real part of s beats the real part of a.)" **Impact High / Size S**
- **Linearity sentence plus play `scale`** (P4) after table[3]: "Scale the signal and the area scales too: {scrub|k} times $e^{-rt}$ with r = {scrub|r}, probed at s = {scrub|s}, has area {calc|F} = k ÷ (s + r). Add two signals and their areas add. That's what lets us transform an equation term by term." **Impact High / Size S**
- **Widget `table`:** replace `aria-pressed` with `aria-current` or `aria-expanded`; visually-hidden "not derived yet"; `agree`/`differ` status by the same test as the class (new key `differ` ×10); wrap the last row at 375; optional twin-transform readouts on the sine row. **Impact Medium / Size S**
- **Tests:** rows at s = 1 → 1, 0.5, 0.4, 0.2, 0.32, 0.24; twin algebra at complex s; 3/(s+2) at s = 1 → 1; 5/(1+4) → 1.
- **Testable outcome:** the reader can transform 3e^{−2t} *before* the quiz; screen readers announce the table's buttons correctly.

#### 2e. Section `solve` — an on-page mistake, every coefficient, the droop on the plot

- **Step 1 shows the group's version first** (no h(0) terms). The bus event `ch7:ic` (already emitted at widgets.ts:654, currently unused) swaps solve[3]/[5] to the correct forms after the fix. Needs a small renderer hook: a `math` block with `alt` tex and a `when` event (shared building block). **Impact High / Size M**
- **Gated predict `ch7-ledge`** before the widget (wording in §7). **Impact High / Size S**
- **solve[2]:** "Because areas scale and add (the table section), we can transform each term on its own. A step of size r becomes r/s…" Also say "no free hover thrust this time". **Impact Medium / Size S**
- **solve[4]→[5]:** add the middle line `(m s^2 + c s + K_p)\,H = m\,h(0)\,s + m\,h'(0) + c\,h(0) + \frac{2K_p - mg}{s}`. **Impact Medium / Size S**
- **solve[10]** rewritten: "Compare the plain numbers: $A\,K_p = 2K_p - mg$, so $A = 2 - mg/K_p$. The $s^2$ terms give $B = m\,(h(0) - A)$, and the $s$ terms give $C = m\,h'(0) + c\,(h(0) - A)$." Plus **side trip S6 "The cover-up trick"**. **Impact High / Size S**
- **Side trip S5 "Completing the square: Chapter 6 was hiding in the bottom"** after solve[11], with `play square` (P7): "With $\eff{K_p}$ = {scrub|kp|eff} N/m: … $\omega_d^2$ = {calc|wd2}, so the bottom is zero at s = −1 ± {calc|wd} i." **Impact High / Size S**
- **solve[16]:** "…the biggest gap is less than a millionth of a metre, just rounding." **Impact Low / Size S**
- **solve[17] replaced by `play residues`** (P6): "With $\eff{K_p}$ = {scrub|kp|eff} N/m from a {scrub|h0|out} m ledge: A = {calc|A|out} m, so the drone settles {calc|droop|err} m below the 2 m target. That's Chapter 2's droop, $mg/K_p$, and the ledge doesn't change it…" **Impact High / Size S**
- **Note S7 "What's RK4?"**, or rename the legend to "simulation (tiny steps)". **Impact Low / Size S**
- **Widget `solve`:** dotted blue settle line at A; red droop band with label; status `hidden` for h0 = 0 with the toggle off (new key ×10); drop zero numerator terms; σ from DRONE; `\eff{K_p}` consistency in solve[9]/[10]. **No page physics** (no drone picture; a bonk would contradict "formula = sim"). **Impact High / Size M**
- **Tests:** A 1.75475, droop 0.24525, B −0.377375, C −0.75475, K1 −0.75475, K2 −0.12086, ωd √39 (fmt "6.24"); wrong B −0.877375, C −1.75475, K2 −0.28098; wrong vs right gap > 0.4 m near t = 0.5 s and < 1e-4 at 10 s; h0 = 0 wrong ≡ right; whole grid gap < 1e-6 (measured 9.3e-10); lowest height > 0 (0.324 m); P6 at Kp 5 → droop 0.981 and ωd 3.00; completing-square identity; final value s·H → A.
- **Testable outcome:** the reader sees the wrong Step 1, predicts the mismatch, watches the fix swap the maths, and can compute A, B, C, σ, ωd for any Kp from the page alone. The droop is drawn, not only named.

#### 2f. Wrap

- Recap item 3 reworded (§7); add "Areas scale and add, so we can transform an equation term by term." and "Split into table pieces: the 1/s piece is where the drone settles." **Impact Medium / Size S**
- Quiz: fix q2's "below" → "in our table". Add **q5** (𝓛{f′} for e^{−t}), and optionally q6 (settle height at Kp = 10), keeping the 2–4 guideline by treating q6 as a swap for q4 if needed. **Impact Medium / Size S**
- Map: edges `guess → dtos`, `spin → laplace`; optional node `pf`. **Impact Low / Size S**
- **Tests:** q1–q3 numbers (currently untested in `ch07.test.ts`): 3/(s+2), 5/(s+4), X = 1/(s+2) with x = e^{−2t}; q5 −1/(s+1); q6 1.5095 / 0.4905.
- **Testable outcome:** every quiz number is verified in `ch07.test.ts`; every option has a why; the map shows where the probe came from.

#### Shared building blocks (candidate owners)

- **Math block that swaps on a bus event** (`{t:'math', tex, alt?, on?: 'ch7:ic'}`) for on-page mistakes that get fixed. Ch 9/10 mistakes could reuse it. Owner: story renderer (`src/story/renderer.ts`).
- **Plot autoscale with easing**, or "clamp and arrow" for points that leave the frame (`src/ui/plot.ts`). Needed by `unspin` and `explode`, likely Ch 8's pole playground and Ch 10's Bode. Owner: ui/plot.
- **Line-label placement that avoids its own line** (`setLines` label offset). Useful everywhere. Owner: ui/plot.
- **Non-pole "target/limit" marker shape** (diamond/flag), so × and ○ stay reserved for Ch 8. Owner: ui/plot.
- **Keyboard-settle helper** for sliders (fire a "settled" callback after N ms idle). Chapters that record a dot per choice need it (Ch 7 probe; possibly Ch 3/10 sweeps). Owner: ui/controls.
- **Droop band / settle line helper** (Ch 2, Ch 6 drone play, Ch 7 solve, Ch 9 integral action). Owner: ui/plot or a chapter-agnostic helper.
- **`solveDrone`** could move to `src/sim/` if Ch 8/9 reuse closed-form responses. Owner: sim.

#### New glossary terms for translators

- *probe (Laplace probe)*: the curve e^{−st} a signal is multiplied by before its area is measured.
- *Laplace transform*: F(s), the total area under f(t)·e^{−st} from 0 to ∞, one number per s.
- *linearity (areas scale and add)*: the transform of k·f is k·F; of f + g, F + G.
- *integration by parts*: moving a slope from one factor of a product onto the other, paying with the edge values.
- *partial fractions*: splitting a fraction with a product on the bottom into simpler fractions, the reverse of finding a common denominator.
- *cover-up trick*: finding one partial-fraction coefficient by multiplying by its factor and setting s to that factor's zero.
- *completing the square*: rewriting a quadratic as (s + σ)² + ω².
- *starting value / starting speed*: f(0), f′(0).
- *s-plane* (already in the glossary; check it stays "map of s" before this chapter).
- *RK4 simulation* (if kept): a step-by-step simulation using a four-look step recipe.

#### Risks

- **Length:** `solve` already has 19 blocks. Keep every added derivation in callouts (S5, S6) so the main thread still reads Step 1 → 4 → widget → mistake → fix.
- **Swapping maths on an event** must not break the locale validator (both `tex` and `alt` need identical control structure in all 10 locales), and must keep `?reveal` and axe runs deterministic (render the correct version under `?reveal`, or both).
- **Unspin autoscale** must not animate on keyboard steps (AGENTS.md motion rule). Snap on keyboard, ease on pointer release.
- **The sine `sloshes` status** must not contradict probe[8] ("Below that, the area runs off to infinity", which is about e^{0.5t} and stays true). Check all 10 locales keep that scoping.
- **P4 inside TeX:** play tokens can't live inside `$…$`. Write the sentence with the scrubs in prose.
- **Numbers formatted with `fmt` in RTL/decimal-comma locales** inside play sentences next to TeX (ar, de, fr, pl, pt-BR, it, es).

#### Suggested commit order (this chapter)

1. `test(ch07): quiz numbers, L{f''}, twin algebra, B/C coefficients, grid gap` (no UI change)
2. `fix(ch07): sine status at s ≤ 0, keyboard dot debounce, probe help wording` (+ keys ×10)
3. `feat(ch07): why-this-probe and endless-area side trips with stepArea/longArea plays`
4. `feat(ui): plot autoscale/clamp, line-label offset, non-pole marker` (shared owner, with tests)
5. `feat(ch07): scream play; explode/unspin polish (payoff in frame, labels, marker)`
6. `feat(ch07): notation vocab, sticky-note callback, ruleExp play, product-rule and jump side trips`
7. `feat(ch07): twin subtraction sentence, linearity play, table a11y fixes`
8. `feat(story): math block that swaps on a bus event` (shared owner, with tests)
9. `feat(ch07): on-page ledge mistake, ch7-ledge predict, B/C and completing-square/cover-up side trips, residues play, droop band`
10. `feat(ch07): recap/quiz (q5, q2 fix)/map edges`
11. `docs: update control-course-plan.md for chapter 7`

### Evidence for this phase

*Reviewer's scope: `public/locales/en/ch07.json`, `src/chapters/ch07/{widgets.ts,tools.ts,ch07.test.ts,ch07.css}`,
`src/math/laplace.ts`, the "### Chapter 7" outline in `docs/course-plan.md`, concept-map nodes in
`src/story/concept-map.ts`. Block references are `section[index]`, 0-based, as listed by
`jq '.sections[].blocks'`. Number checks: `$SCRATCH/checks/ch07-numbers.test.ts` (33 tests) and
`$SCRATCH/checks/ch07-extra.test.ts` (6 tests), all 39 green
(`pnpm vitest run --root $SCRATCH/checks ch07`).*

#### 0. Snapshot

**Driving question** (`question`): "Can we turn calculus into algebra?"

##### Sections in order

| id | title | one line |
|---|---|---|
| `probe` | A probe for signals | Theo's notebook is "on fire" from guessing e^{st}; the probe e^{−st} × signal, total area = F(s); gated predict on the step's area; `probe` widget; note that complex s comes later. 11 blocks. |
| `explode` | The transform screams where the signal lives | e^{at} probed gives 1/(s−a) (stated, forward-referenced to the table); `explode` widget; Mika/Theo "blows up where the signal lives"; complex s and the `unspin` widget; the s-plane is named (vocab). 9 blocks. |
| `rule` | Slopes become multiplication | L{f′} = sF − f(0) shown for e^{at}; Theo doubts ("lookup rule"); `derivRule` widget on a hand-drawn signal; integration by parts math; L{f″} stated. 13 blocks. |
| `table` | Our own table | `table` widget derives 1/s, 1/(s−a), sin/cos, damped sin/cos row by row; Mika on twin spinners; shift rule sentence. 4 blocks. |
| `solve` | Solving the drone with algebra | P-controlled drone from a 1 m ledge to 2 m; Steps 1–4 (transform, collect H, partial fractions, table lookup); `solve` widget; the h(0) mistake and fix; droop callback; thrust-limit note. 19 blocks. |
| `wrap` | What we know now | 5-item recap, 4 quiz items, map, cliffhanger. |

##### Widgets (`src/chapters/ch07/widgets.ts`)

| id | shows | controls | readouts / status |
|---|---|---|---|
| `probe` (l.66) | Left: signal (blue), probe e^{−st} (grey dashed), product (ink) with shaded area animated to 8 s. Right: F(s) plot with the user's traced dots, optional formula curve. | Segmented signal (step, e^{−t}, e^{0.5t}, sin 2t); slider s ∈ [−1, 4] step 0.05; "Sweep the area again"; "Reveal the formula curve" (unlocks after 5 dots). | "area so far", "total area F(s)"; status `finite`/`infinite`. Predict `ch7-step` resets it to the step. |
| `explode` (l.228) | Left: product e^{(a−s)t} shaded over 10 s. Right: 1/(s−a) with "infinite area" band for s ≤ a and dashed line "signal lives at s = a"; marker at current s. Live KaTeX equation. | Sliders a ∈ [−2, 1] (blue), s ∈ [−2.5, 4]. | Readout F(s); status `never`/`close` (s−a < 0.3)/`calm`. |
| `unspin` (l.283) | Running complex total of ∫₀ᵗ e^{2iτ}e^{−sτ}dτ as a path in the complex plane, animating to 25 s; × at the limit 1/(s−2i). | σ ∈ [0.05, 2], ω ∈ [0, 4]; Replay. | |F|, "leftover spin" 2−ω; status `matched` (|2−ω| < 0.05) / `spinning`. |
| `derivRule` (l.362) | Left: drawn or preset f (blue) and its slope (dashed ink2). Right: both sides of the rule vs s (ink solid vs **orange** dashed). Underbraced equation. | Slider s ∈ [0.2, 3]; presets wobble/jump/decay; "Draw your own signal" (pointer sketch). | Both sides at s; status `match` (< 0.01) / `nomatch`; hint line. |
| `table` (l.480) | 4-row table with Derive/Show buttons; plot of the row's signal and product with area; per-row KaTeX derivation ("How we got it"). | Row buttons; slider s ∈ [0.2, 3]. | "measured area" vs "formula" (good/bad class); status `agree` or `twinCheck` for cos rows. |
| `solve` (l.567) | Height vs time: RK4 sim (blue, thick, ghost on change) vs Laplace formula (ink dashed); green target line at 2 m; live H(s) partial fractions and h(t). | Toggle "Include the starting-height terms −h(0)" (starts **off**); Kp ∈ [5, 60]; h(0) ∈ [0, 3]. | "biggest gap", "at t = 0: sim / formula"; status `mismatch`/`odd`/`match`. Emits `ch7:ic` on the bus, which **nothing listens to** (only emitter at widgets.ts:654). |

**Predict card:** one, `ch7-step` (probe[6], gated): step's area as s grows → shrinks (1/s). Every option has a why.
The outline's second predict (7e "Will the formula match the sim?") is **missing**.

**Misconception:** Theo, rule[3]: "Next you'll tell me it's a lookup rule we're supposed to memorise." Resolved by `derivRule` + integration by parts + the table widget.

**Mistake:** solve[14]–[15]: the formula starts at 0, the sim at the 1 m ledge; Theo says "When we typed Step 1 into the checker, we wrote L{h′} = sH and dropped the −h(0) bits". The toggle fixes it.

**Quiz (4):** q1 transform of 3e^{−2t}; q2 which signal is 5/(s+4) (sketch options); q3 solve x′+2x=0, x(0)=1; q4 why 1/(s−a) blows up at s=a. Every option has a why.

**Map nodes (ch 7):** `laplace` "Laplace probe", `dtos` "d/dt → × s", `table` "our table", `splane` "s-plane". Incoming edges: `sum→laplace`, `integral→laplace`, `smap→splane`. No edge from Ch 4 `exponential`/`guess` or Ch 5 `spin`, although the probe is e^{−st} and the `unspin` widget is built on Ch 5's spinners.

**Cliffhanger:** June: the answer was always (something) ÷ (polynomial in s) … "What if that fraction **is** the drone?"

**Tests (`src/chapters/ch07/ch07.test.ts`):** table rows vs numeric probe at s = 0.5, 1.5, 3 (l.9); PF solution vs RK4 for (Kp, h0) = (20,1), (5,3), (60,0.5), (12,0) < 1e-6 (l.21); forgetting h(0) starts at 0 (l.31); PF pieces recombine, A = 2 − mg/20 (l.37); unspin limit and matched growth (l.48); derivative rule on a smooth and a drawn signal (l.61).
**Not tested today:** quiz numbers (3/(s+2), 5/(s+4), X = 1/(s+2)); L{f″} formula; the twin-spinner algebra; the explode/unspin default readouts; the "millionths" claim; B and C.

No `play` or `callout` blocks yet (checked: 0 in every ch07 locale). All 10 locales have `ch07.json`.

#### 1. Screenshots

Saved to `$SCRATCH/shots/ch07/` (19 PNGs):

- `1280-light-full.png`, `375-dark-full.png`: full page at both widths/themes. Nothing clips sideways at 375 px.
- `1280-light-probe.png`: layout clean. The dashed probe line sits exactly under the product for the step, so the "probe" legend entry cannot be seen. The right plot has no marker for the current (s, F), only a dotted vertical line. There is no "no finite area" band for s ≤ a (the `explode` plot does have one), so the two widgets don't match.
- `1280-light-probe-keyboard.png`: **keyboard flood.** 60 ArrowRight presses add 60 dots, because every keyboard step fires `change` (widgets.ts:192). "your measurements" becomes a thick solid line from 1.05 to 4, and "Reveal the formula" unlocks after five key presses, before the reader has thought about anything.
- `1280-light-probe-sine-s0.png` / code: at s = 0 the status reads "The area never settles: it's infinite." For sin 2t that is **false** (see §8): the running area sloshes between 0 and 1.
- `375-dark-probe.png`, `375-dark-probe-lower.png`: at 375 px the F(s) plot sits *below* the time plot, but the help says "a dot is added to the **right-hand** plot". The legend wraps onto two lines ("f(t)·e^(−st)" on its own line). This is fine.
- `1280-light-explode.png`, `1280-light-explode-close.png`, `375-dark-explode.png`: the label "signal lives at s = −0.50" starts right on the dashed line, so the "s" is struck through (both widths). At 375 px "infinite area" and "signal lives…" run into each other. At s − a = 0.1 the product plot's 10 s window shows only 63% of the area (6.32 of 10), and the F marker is hidden because F > 6. The reader sees "10.00" only in the readout.
- `1280-light-unspin.png`, `375-dark-unspin.png`: the "final total" label is drawn on top of the path and the running dot (375: "nal total"). The plot is 460 px tall while the default path only uses [0, 0.5] × [0, 0.9]. There are no arrows anywhere, although explode[4] promises "pieces of area are added up head-to-tail as **arrows**".
- `1280-light-unspin-matched.png`: **the payoff is off-screen.** When the spins match (σ = 0.1, ω = 2), the path runs flat along the real axis, right on top of the axis line, and leaves the frame at x = 4.5 (t ≈ 5.98 s). The × at 10 is never visible. The status says "The total is 10.0", but the picture shows nothing special. The × also borrows the **pole** symbol (black ×) for "final total".
- `1280-light-derivRule.png`, `375-dark-derivRule.png`: the two sides overlap perfectly, which is good. The rhs is **orange** (`eff`), which misuses the colour language (orange = control effort). At 375 px the s-plot has a single y tick (−0.50). The prose (rule[5]) says "The two curves on the **right**", but at 375 px they are below.
- `1280-light-table.png`, `375-dark-table.png`: the table reads well. At 375 px the last row's "e^{−σt} cos ωt" butts into the "?" cell. The "How we got it" steps have large vertical gaps between math blocks at 1280.
- `1280-light-solve.png`, `375-dark-solve.png`: formula (ink dashed) vs sim (blue). There is no dotted "settles here" line at A = 1.755 and no droop band, so the droop callback in solve[17] has nothing to point at. At 375 px, h(t) wraps to two aligned lines correctly.

Keyboard: every slider is a native range input (arrows work). Presets are the keyboard equivalent of drawing, but the help never says so. The table's Derive/Show buttons carry `aria-pressed` (widgets.ts:523), so screen readers announce them as toggles. The "?" placeholder is a `<span aria-label>` with no role (widgets.ts:535), and a generic span's `aria-label` is not reliably announced.

#### 2. Terms before use

| # | Term / symbol / formula / number | First appears | Status | Note |
|---|---|---|---|---|
| 1 | "guessed e^{st}, plugged it in" | probe[0] | earned | Ch 4 `guess`, Ch 5 `map`, Ch 6 `drone`. |
| 2 | "slopes of slopes", calculus vs algebra | probe[1] | earned | Ch 3/4. |
| 3 | signal f(t) | probe[3] "Take any signal f(t)" | only stated | "Signal" as a word for "a curve over time" is new here. One clause would do. |
| 4 | probe e^{−st}, "the **shrinking** exponential from Chapter 4" | probe[3] | only stated | Shrinks only for s > 0, yet the probe widget runs s to −1 and explode to −2.5. *Why this probe* is never motivated (see §3). |
| 5 | "total area under the product" to ∞ | probe[3], probe[4] | used before defined | Ch 3 only had ∫₀ᵗ. A finite area under an infinitely long curve is a real wall. |
| 6 | ∫₀^∞ … dt | probe[4] | used before defined | The ∞ limit is new. Ch 3 wrote `h(t) = h(0) + ∫₀ᵗ speed dt`. |
| 7 | F(s), "fingerprint" | probe[5] | earned / only stated | "Fingerprint" implies one F per f (uniqueness), which Step 4 relies on and nobody says. |
| 8 | Laplace transform | probe[5] | earned (named) | |
| 9 | area of step = 1/s | predict why (probe[6]) | only stated | Derived later (table row 0). Say "we'll check it in the table". |
| 10 | e^{0.5t} finite only for s > 0.5 | probe[8] | earned | Widget shows it. |
| 11 | "left-right part / up-down part" of complex s, "unspinning" | probe[9] | **used before defined** | Complex s arrives in explode[4]. The paragraph sits before the note that says "Complex s comes in a minute". |
| 12 | 1/(s−a) | explode[0] | only stated → derived in table row 1 | Condition s > a missing in the prose. |
| 13 | "blows up / screams / lives at" | explode[2]–[3] | earned | Widget. Seed for poles. |
| 14 | s = σ + iω | explode[4] | earned | Ch 5 `map`. |
| 15 | e^{2it} as a *signal* | explode[4] | earned | Ch 5 `twins`. Worth one clause: "half of the spring's twin pair". |
| 16 | "head-to-tail as arrows" | explode[4] | **mismatch** | The widget draws a smooth path, no arrows. |
| 17 | s-plane | explode[7], vocab | earned | Named here as the outline asks. |
| 18 | slope of e^{at} = a e^{at} | rule[0] | earned | Ch 4 `stretch`. That section ends with a sticky note promising exactly this chapter ("In Chapter 7 this idea grows up…"), and Ch 7 never cashes it in. |
| 19 | **𝓛{·} notation** | rule[1] | **used before defined** | Never introduced ("𝓛{f} means the transform of f, the same thing as F"). |
| 20 | **prime notation f′, f″, h′, h″** | rule[1] | **used before defined** | Ch 3–5 use d/dt, Ch 6 uses dots (ẋ, ẍ). Ch 7 switches to primes silently. |
| 21 | f(0) "the starting value" | rule[2] | earned | |
| 22 | "general rule for smooth signals whose weighted areas settle" | rule[7] | only stated | Hedge in Theo's voice. The "jump" preset is **not smooth** and still matches (§8). |
| 23 | integration by parts | rule[8]–[9] | only stated | Needs the product rule (never taught) plus "area undoes slope" (Ch 3). Skipped step: (f·e^{−st})′ = f′e^{−st} − s f e^{−st}. |
| 24 | [·]₀^∞ bracket | rule[9] | used before defined | Also in table row 0. "Value at the end minus value at the start" (Ch 3's area undoes slope). |
| 25 | L{f″} = s²F − s f(0) − f′(0) | rule[11] | only stated ("follows") | Skipped line: 𝓛{f″} = s𝓛{f′} − f′(0) = s(sF − f(0)) − f′(0). |
| 26 | f′(0), the starting speed | rule[11] | only stated | Name it "starting speed". |
| 27 | "the curve whose slope is e^{−st} is −(1/s)e^{−st}" | table row 0 steps | earned | Ch 4 slope rule. "Area = change of that curve" needs Ch 3's "area undoes slope" named. |
| 28 | (s > 0), (s > a) | table rows 0–1 | only stated | |
| 29 | sin ωt = (e^{iωt} − e^{−iωt})/(2i) | table row 2 steps; table[2] | only stated | Ch 5 derived only the **cosine** twin sum ½(e^{iωt}+e^{−iωt}). Why subtract and divide by 2i (the sideways parts) is not said. |
| 30 | 𝓛{e^{±iωt}} = 1/(s ∓ iω) with complex a | table row 2; table[2] | only stated | The exponential row was derived for real a. The condition becomes "Re s > Re a", never said. |
| 31 | cos row s/(s²+ω²) | table row 2 | only stated (arrow) | Fine as the twin. |
| 32 | shift: × e^{−σt} ⇒ s → s+σ | table row 3, table[3] | earned | |
| 33 | **linearity** (𝓛{3f} = 3F, 𝓛{f+g} = F+G) | first used solve[2]/[3]; first *said* in the quiz q1 why ("areas scale") | **used before defined** | Step 1 needs it for K_p(2/s − H), Step 4 for splitting A/s + … |
| 34 | 1 m ledge, target 2 m | solve[0] | earned | |
| 35 | m h″ + c h′ = Kp(2 − h) − mg | solve[1] | earned | Ch 2/6. "The Chapter 2 drone" had a hover feed-forward in Ch 6's play; here there is none, and the text doesn't say "no free hover thrust". |
| 36 | "A step of size r becomes r/s" | solve[2] | only stated | Needs linearity (#33). "r" isn't in the equation (it says 2). |
| 37 | H(s) (capital = transform of h) | solve[3] | used before defined | Convention not stated. |
| 38 | N(s) | solve[5] | earned | Defined in the block. |
| 39 | partial fractions | solve[6] | only stated | School analogy only. *How* is half-shown. |
| 40 | A = 2 − mg/Kp; "the other two give B and C" | solve[10] | A only stated, **B, C skipped** | B = m(h0 − A), C = m h′(0) + c(h0 − A). |
| 41 | "decaying cosine plus a decaying sine" | solve[11] | **skipped** | Needs completing the square m s² + c s + Kp = m((s+1)² + ωd²) and splitting Bs + C = B(s+1) + (C − B). The widget's e^{−t} and 6.24 come from nowhere. |
| 42 | "RK4 simulation" | solve widget legend | **used before defined** | "RK4" appears in no other locale file. |
| 43 | "maximum gap is millionths of a metre" | solve[16] | stated, **overstates the error** | Measured ≤ 9.3e-10 m over the whole slider grid, 2.3e-11 m at the default. "Less than a millionth" is true. "Millionths" suggests ~1e-6. |
| 44 | "piece A: it's 2 − mg/Kp, the droop" | solve[17] | only stated, **conflated** | A is where it *settles*. The droop is mg/Kp = 0.245 m (Kp = 20). |
| 45 | "no thrust limit … Chapter 8" | solve[18] | earned | At the default the start thrust is Kp(2 − 1) = 20 N, exactly the real limit. From the ground at Kp = 60 it's 120 N. |
| 46 | "(like s² + ω² **below**)" | quiz q2 option 3 why | wrong pointer | The sine row is *above* the quiz. |

##### Where a curious beginner gets stuck

1. **"Why multiply by e^{−st}? Why that minus sign?"** The chapter says "here's the idea" (probe[3]) and moves on. Neither of the two reasons (it cancels e^{st} at s = a; its slope is −s × itself, so slopes turn into × s) is stated up front. **Fix:** a side trip "Why this probe?" right after probe[4] (§5 S1): one sentence per reason, each pointing forward to where the page proves it.
2. **An infinitely long area that is finite.** Ch 3 only added area up to a time t. **Fix:** a playable side trip "Stop the area of e^{−t} at T = {scrub|T} s…" showing 0.950 at T = 3 and only 0.050 still to come (§4 P2).
3. **Complex s mentioned too early** (probe[9]). **Fix:** delete the last sentence of probe[9] and move it into explode[4].
4. **Notation switch f′ / 𝓛{·} / H(s).** Three new notations in two blocks. **Fix:** one vocab block at rule[0]: "f′ is short for df/dt (Chapter 6 wrote ẋ); 𝓛{f} is 'the transform of f'; a capital letter is the transform of its small letter: F for f, H for h."
5. **Integration by parts out of nowhere.** The product rule was never taught. **Fix:** side trip "Area undoes slope, for a product" (§5 S3): the rectangle-area picture of the product rule plus Ch 3's "area undoes slope".
6. **Linearity** is needed in Step 1 and first said in the quiz. **Fix:** a sentence and a playable number in the `table` section (§4 P4): "Scale the signal, scale the area."
7. **Where B, C, e^{−t} and 6.24 come from.** **Fix:** show B and C in solve[10]. Add a side trip "Completing the square" (§5 S5) with a play sentence tying σ = c/(2m) = 1 and ωd = √(2Kp − 1) back to Ch 6's ωn, ζ and ωd.
8. **"RK4"** in a legend. **Fix:** legend "simulation (tiny steps)" or a one-line note: "the simulation takes 1 ms steps, Chapter 4's tiny-steps idea with a four-look recipe called RK4".
9. **Droop vs final height** (solve[17]). **Fix:** reword and add a play sentence (§4 P6). In the widget, draw a dotted blue settle line at A and a red droop band.

#### 3. Explanation gaps

##### Bridges back

- **Ch 3 (area, "area undoes slope"):** probe[3] cites "Chapter 3's accumulated area", which is good. Three uses rely on Ch 3's *other* fact, "slope takes you one way, area brings you back", without citing it: table row 0 ("the curve whose slope is e^{−st} is −(1/s)e^{−st}", then [·]₀^∞), rule[9] (integration by parts) and Step 4 (inverse lookup). Add "Chapter 3: area undoes slope, so the area is the change in the curve whose slope we're adding up." Ch 3 also taught **negative area** (ch03 `area`). That is exactly why sin 2t's area can shrink; `probe` never says so when the sine's product dips below zero (the lighter shading at `shadeOverlay` l.36 is the only cue).
- **Ch 3 (τ ruler / step):** a step and "63% after one τ" connect directly. The area of e^{−t} up to T = 1 is 0.632 (verified), which is the τ ruler again. That's a one-sentence callback inside side trip S2.
- **Ch 4 (e, slope ÷ height, sticky note):** `stretch` ends with "Put a sticky note on that. In Chapter 7 this idea grows up into a trick that turns calculus into algebra for every signal." Ch 7 rule[0] should **peel that sticky note**: "Remember the sticky note from Chapter 4? For e^{at}, a slope was just × a. Here's the grown-up version." This also motivates the probe (it is the one curve whose slope is a multiple of itself).
- **Ch 4 (guess-an-exponential / characteristic equation):** the cliffhanger alludes to "where the bottom is zero". The page never says that the denominator m s² + c s + Kp is Ch 4/6's characteristic polynomial, with the same roots Ch 6 put on the map. This is the key seed for Ch 8. Add one sentence to solve[11] or a side trip (S5).
- **Ch 5 (spinners, twins, Euler):** `unspin` builds on spinners, which is good, but (a) the widget shows no spinner. The reader sees only an abstract running-total path, not "the probe spins the signal backwards". (b) The sine row uses (e^{iωt} − e^{−iωt})/(2i), while Ch 5 only built the cosine as ½(sum). Missing sentence: "Subtract the twins instead of adding them and the along parts cancel; what's left is 2i·sin ωt." (c) Ch 5's `fourier` section ("everything is made of spinners") is the natural motivation for "a probe that measures how much of e^{st} a signal contains", and it is not used.
- **Ch 6 (ωn, ζ, ωd, modes, c_crit):** the drone's H(s) denominator is Ch 6's drone spring. σ = c/(2m) = 1 = ζωn, ωd = √(Kp/m − 1) = 6.245 at Kp = 20 (Ch 6 says ζ ≈ 0.16 at Kp = 20; verified ζ = 0.158). The h(t) in the widget *is* two modes plus the 1/s mode. None of this is said. Add to Step 4: "The e^{−t} and the 6.24 are Chapter 6's old friends: σ = ζωn = 1 and ωd."
- **Ch 2 (droop 4.9/Kp):** solve[17] makes the callback but conflates final height and droop. Ch 2 uses "dotted blue line" for where it ends up, which the solve widget should reuse.

##### Skipped derivation steps (named)

1. rule[10]→[11]: 𝓛{f″} = s·𝓛{f′} − f′(0) = s(sF − f(0)) − f′(0). One line, currently "follows".
2. rule[9]: the product rule (f·e^{−st})′ = f′e^{−st} − s f e^{−st}, then "area of a slope = change of the curve" (Ch 3). Without it, "moving the slope onto the probe" is magic.
3. rule[9]: why the far end vanishes: f(t)e^{−st} → 0 needs s larger than f's growth rate (the same condition as the probe). Currently it says "If the weighted signal fades away at the far end" with no link back to probe[8].
4. solve[3]→[5]: collecting H. Missing middle line: (m s² + c s + Kp)·H = m h(0) s + m h′(0) + c h(0) + (2Kp − mg)/s, then × s.
5. solve[10]: B and C. s² terms: m h(0) = A m + B ⇒ B = m(h(0) − A). s terms: m h′(0) + c h(0) = A c + C ⇒ C = m h′(0) + c(h(0) − A). (verified, ch07-numbers.test.ts:240)
6. solve[10]: the **cover-up trick** is the quickest *why* for A: multiply H by s and set s = 0, so A = N(0)/Kp = (2Kp − mg)/Kp. It is also the final-value idea: where the drone settles is s·H(s) at s → 0 (verified l.320). That is the cleanest route to "the droop falls out".
7. solve[11]: completing the square and splitting the numerator:
   `m s² + c s + Kp = m((s+σ)² + ωd²)`, σ = c/2m = 1, ωd² = Kp/m − σ² = 2Kp − 1 (for m = 0.5, c = 1), and `Bs + C = B(s+σ) + (C − Bσ)`, giving K1 = B/m, K2 = (C − Bσ)/(m ωd) (tools.ts:36–38). The widget shows the result with no path to it.
8. table row 2: complex-a version of the exponential row needs "Re s > Re a". Mika's line (table[2]) asserts it.

##### Rules of thumb / claims given without a reason

- probe[9]: "The total area must settle to a finite value." Why must it? Because we want one number per s. Say that.
- rule[7]: "this is a general rule for smooth signals whose weighted areas settle; the drawing gives us a numerical check." Hedged but unexplained, and the "jump" preset is not smooth (§8). Either make the jump a teachable side trip (S4) or rename the preset.
- probe[5]: "a fingerprint of the signal". Uniqueness is asserted and later used (Step 4 lookup). Make it an explicit, honest claim: "Two different (reasonable) signals never share the same F(s), which is why we can look answers up backwards."
- solve[16]: "the maximum gap is millionths of a metre, just numerical rounding". The truth is ≤ 1e-9 m. Say "less than a millionth of a millimetre" (true: 9.3e-10 m < 1e-9 m), or simply "less than a millionth of a metre".
- quiz q2 why: "Wiggles need a pair of complex explosion points". Correct, and a nice seed. Fix "below" to "in our table".

#### 4. Playable-number opportunities

All values verified in `$SCRATCH/checks/ch07-*.test.ts`. Inputs take the usual `{min,max,step,value,unit}`. Outputs are formatted with `fmt()`.

##### P1 `stepArea` — the area of a step for a chosen s

- **Sentence (probe section, after probe[8], replacing its first sentence):**
  "Probe the step at s = {scrub|s}: the area is 1 ÷ {calc|s} = {calc|F}. Double s and the area halves."
- **Inputs:** s: min 0.25, max 4, step 0.25, value 2.
- **Outputs:** `s` = fmt(s, 2); `F` = fmt(1/s, 3).
- **At initial:** s = 2 → F = 0.500. Also s = 1 → 1.000 and s = 4 → 0.250 (ch07-numbers.test.ts:20).

##### P2 `longArea` — an infinitely long region with a finite area (inside side trip S2)

- **Sentence:** "Stop adding the area of $e^{-t}$ at t = {scrub|T} s and you already have {calc|A}. Everything after that adds only {calc|left}."
- **Inputs:** T: min 0.5, max 10, step 0.5, value 3, unit "s".
- **Outputs:** `A` = fmt(1 − e^{−T}, 3); `left` = fmt(e^{−T}, 3).
- **At initial:** T = 3 → A = 0.950, left = 0.050. T = 1 → 0.632 (Ch 3's 63%). T = 5 → 0.993 (l.27).

##### P3 `scream` — "the transform screams at s = a"

- **Sentence (explode section, after explode[3]):**
  "Signal $e^{at}$ with a = {scrub|a|out}, probe s = {scrub|s}: the product fades at s − a = {calc|gap} per second, so its area is {calc|F}{calc|verdict}."
- **Inputs:** a: min −2, max 1, step 0.1, value 0.5. s: min −1, max 4, step 0.01, value 1.
- **Outputs:** `gap` = fmt(s − a, 2); `F` = gap > 0 ? fmt(1/gap, 2) : "∞"; `verdict` = word key: gap ≤ 0 → `plays.scream.none` (": no finite area at all"); 0 < gap < 0.3 → `plays.scream.loud` (", and it's screaming"); else "" (".").
- **At initial:** a = 0.5, s = 1 → gap 0.50, F = 2.00. s = 0.6 → 10.00, s = 0.51 → 100.00 (l.85).
- Optional extra output: `half` = fmt(ln 2/gap, 2) s, "the product halves every {calc|half} s" (0.693 s at gap 1, 6.93 s at gap 0.1, l.81). This makes the "slower fade ⇒ bigger area" link numeric.

##### P4 `scale` — linearity, and quiz 1 rehearsed

- **Sentence (table section, new block after table[3]):**
  "Scale the signal and the area scales too. $\,${scrub|k}$\,e^{-${scrub|r}t}$ probed at s = {scrub|s} has area {calc|F} = {calc|k} ÷ ({calc|s} + {calc|r})."
  (Implementation note: scrubs inside TeX are not supported. Write it as "{scrub|k} × e^(−{scrub|r} t)" in plain prose with the maths after, or split: "Take {scrub|k} times $e^{-rt}$ with r = {scrub|r}…".)
- **Inputs:** k: min 1, max 5, step 1, value 3. r: min 0, max 4, step 0.5, value 2. s: min 0.5, max 3, step 0.5, value 1.
- **Outputs:** `F` = fmt(k/(s + r), 3); echoes of k, s, r.
- **At initial:** 3/(1 + 2) = 1.000 (quiz 1 at s = 1; numeric check l.193). k = 5, r = 4, s = 1 → 1.000 (quiz 2's F at s = 1).

##### P5 `ruleExp` — the derivative rule for e^{at} with numbers

- **Sentence (rule section, after rule[2]):**
  "With a = {scrub|a} and s = {scrub|s}: the slope's area is {calc|lhs}, and s·F − f(0) = {calc|sF} − 1 = {calc|rhs}. Same number."
- **Inputs:** a: min −2, max 0, step 0.5, value −1. s: min 0.5, max 3, step 0.5, value 1 (s > a always holds on these ranges).
- **Outputs:** `lhs` = fmt(a/(s−a), 3); `sF` = fmt(s/(s−a), 3); `rhs` = fmt(s/(s−a) − 1, 3).
- **At initial:** lhs = −0.500, sF = 0.500, rhs = −0.500 (l.121).

##### P6 `residues` — partial-fraction pieces of the drone, and the droop

- **Sentence (solve section, replaces solve[17]):**
  "With $\eff{K_p}$ = {scrub|kp|eff} N/m from a {scrub|h0|out} m ledge: A = {calc|A|out} m, so the drone settles {calc|droop|err} m below the 2 m target. That's Chapter 2's droop, $mg/K_p$, and the ledge doesn't change it. The rest wiggles as $e^{-t}$ times ({calc|k1} cos + {calc|k2} sin) at {calc|wd} rad/s and fades away."
- **Inputs:** kp: min 5, max 60, step 1, value 20, unit N/m. h0: min 0, max 3, step 0.1, value 1, unit m.
- **Outputs (from `solveDrone`, tools.ts:28):** `A` = fmt(2 − mg/kp, 3); `droop` = fmt(mg/kp, 3); `k1` = fmt(h0 − A, 3); `k2` = fmt((C − Bσ)/(m ωd), 3); `wd` = fmt(√(kp/m − 1), 2).
- **At initial (Kp 20, h0 1):** A = 1.755 (1.75475), droop = 0.245 (0.24525), k1 = −0.755, k2 = −0.121 (−0.12086), wd = 6.24 (√39 = 6.2450, and fmt(…, 2) = "6.24", checked with Math.round). Kp = 5 → A = 1.019, droop 0.981 (Ch 2's Kp = 5 figure), ωd = 3.00. Kp = 60 → droop 0.082 (Ch 2's "8 cm"). (l.226, l.303, extra l.46)
- The sentence "the ledge doesn't change it" is verified: A doesn't depend on h0, and right/wrong formulas agree to 4e-5 m by t = 10 s (l.267).

##### P7 `square` — completing the square (inside side trip S5)

- **Sentence:** "With $\eff{K_p}$ = {scrub|kp|eff} N/m: $0.5s^2 + s + K_p = 0.5\,\big((s+1)^2 + \omega_d^2\big)$ with $\omega_d^2$ = {calc|wd2}, so the bottom is zero at s = −1 ± {calc|wd} i. Those are Chapter 6's two dots on the map."
- **Inputs:** kp: min 5, max 60, step 1, value 20.
- **Outputs:** `wd2` = fmt(2·kp − 1, 0); `wd` = fmt(√(2kp − 1), 2).
- **At initial:** wd2 = 39, wd = 6.24. Kp = 5 → 9, 3.00. Kp = 60 → 119, 10.91 (l.248, extra l.46).

##### P8 (optional) `twinArea` — sine row by twins at a chosen s

- "At s = {scrub|s}: the spinner gives {calc|plus}, its twin {calc|minus}; subtract and divide by 2i → {calc|F} = 2/(s² + 4)."
  Complex outputs are awkward in prose. Recommended only as a readout in the `table` widget's sine row, not as a play. Value at s = 1: 0.400 (l.63, l.184).

#### 5. Side trips

##### S1 "Why this probe?" (probe, after probe[5])

- **Proves:** the choice of e^{−st} is not arbitrary. It has two jobs, each proved later on the page.
- **Formula:** `\frac{d}{dt}e^{-st} = -s\,e^{-st} \qquad e^{at}\cdot e^{-st} = e^{(a-s)t}`
- **Prose:** "Theo: 'Why *that* curve? Why not a bump, or a sine?' June counts on her fingers. One: the probe is Chapter 4's special curve. Its slope is just −s times itself, so when slopes show up, they'll turn into multiplying by s. Two: it's the exact opposite of the $e^{st}$ we kept guessing. Hold it against $e^{at}$ and the two cancel when s = a. We'll see both jobs happen on this page."
- No playable.

##### S2 "An endless area that stops growing" (probe, after S1 or after probe[8])

- **Proves:** an infinitely long region can have a finite area (improper integral), tying back to Ch 3's area and τ ruler.
- **Formula:** `\int_0^{T} e^{-t}\,dt = 1 - e^{-T} \;\to\; 1`
- **Play:** P2.
- **Prose:** "Mika: 'The probe goes on forever. How can forever have a finite area?' Because most of it is almost nothing. Each extra second adds less than the one before. After one second you already have 63% (Chapter 3's τ ruler again). After five, you're past 99%."

##### S3 "Area undoes slope, even for a product" (rule, after rule[9])

- **Proves:** integration by parts from the product rule and Ch 3's "area undoes slope".
- **Formula:**
  `\big(f\,e^{-st}\big)' = f'\,e^{-st} - s\,f\,e^{-st} \;\Rightarrow\; \big[f\,e^{-st}\big]_0^\infty = \int_0^\infty f' e^{-st}\,dt - s\,F(s)`
  plus the one-line second slope: `\mathcal{L}\{f''\} = s\,\mathcal{L}\{f'\} - f'(0) = s^2F - s\,f(0) - f'(0)`.
- **Prose:** "A product changes for two reasons. f changes while the probe holds still, and the probe changes while f holds still. Picture a rectangle with sides f and $e^{-st}$: it grows along one side, then the other. Add up those changes (Chapter 3: area undoes slope) and you get the value at the end minus the value at the start. At the far end the probe has squashed everything to zero, so only $-f(0)$ is left. Theo: 'So f(0) isn't a fudge. It's the rectangle we started with.'"

##### S4 "What about a jump?" (rule, after rule[7])

- **Proves:** the rule holds for the "jump" preset only if the jump's instant slope spike is counted. That is honest about "smooth", and it foreshadows impulses.
- **Formula:** `\text{gap if you ignore the spike} = 1.4\,e^{-2s}` (jump of 1.4 at t = 2 in the preset).
- **Prose:** "Theo presses 'jump'. It still matches! But a jump isn't smooth… Look at the slope plot: at t = 2 there's a tall, thin spike. The computer's slope saw the jump as a very steep climb. Leave that spike out and the two sides disagree by $1.4e^{-2s}$, about 0.19 at s = 1. A sudden jump is still a change, and the rule counts every change, even an instant one."
- Verified: gap 0.1895 at s = 1 (ch07-numbers.test.ts:150). All three presets match within 7e-4 with the spike included (l.129).

##### S5 "Completing the square: Chapter 6 was hiding in the bottom" (solve, after solve[11])

- **Proves:** where σ = 1 and ωd come from, and that they are Ch 6's s-values (seed for Ch 8 poles).
- **Formula:** `0.5s^2 + s + K_p = 0.5\big((s+1)^2 + (2K_p - 1)\big),\qquad Bs + C = B(s+1) + (C - B)`
- **Play:** P7.
- **Prose:** "The second piece isn't in our table yet. Its bottom is a plain quadratic. Push it into the shape $(s+\sigma)^2 + \omega^2$ and it matches the decaying-sine rows exactly. For our drone σ = 1: that's Chapter 6's ζωn. And ω is the damped wiggle ωd. June: 'The bottom is zero at exactly the two dots we put on the map in Chapter 6.' Keep that thought."

##### S6 "The cover-up trick" (solve, after solve[9])

- **Proves:** why A is the droop-carrying piece and how to get it in one line. It also shows B and C.
- **Formula:**
  `A = \Big[s\,\out{H}(s)\Big]_{s=0} = \frac{N(0)}{\eff{K_p}} = \sp{2} - \frac{\dis{mg}}{\eff{K_p}},\quad B = m\,(h(0) - A),\quad C = m\,h'(0) + c\,(h(0) - A)`
- **Prose:** "Multiply H by s and every piece except A/s still has an s on top. Set s = 0 and they vanish. Only A survives. And s·H at s → 0 is where the drone ends up: the long-run height falls straight out of the algebra, no simulation needed."

##### S7 (small, a note, not a callout) "What's RK4?" (solve, next to the widget)

- "The simulation takes 1 ms steps, like Chapter 4's tiny steps, but each step peeks four times to aim better. People call that recipe RK4."

#### 6. Widget polish

##### `probe`

- **False status for the sine (widgets.ts:124, 153).** `a = 0` is treated as "area infinite for s ≤ 0". At s = 0 the running area of sin 2t sloshes between 0 and 1 forever (verified, l.44). At s < 0 it swings with growing size and alternating sign (+20.5 at T = 20, −22.8 at T = 21.5). Add a separate status key `sloshes`: "Here the area never settles. It keeps sloshing back and forth, so this s has no single answer." Use it when the signal oscillates (a flag on `SIGNALS.wiggle`).
- **Keyboard flood (l.192).** Add a dot on `change` from the pointer, but on keyboard only after ~600 ms of no key presses (or on Enter). Keep "Reveal the formula" gated on 5 dots at least 0.25 apart in s.
- **Help text at 375 px** says "right-hand plot". Change to "the F(s) plot" (all locales).
- **Linked representation:** mark the current (s, F) on the F plot (as `explode` does) and shade "no finite area" for s ≤ a, reusing `explode`'s band and the same `noArea` label. The two widgets then speak one visual language.
- **Probe hidden under the product** for the step. Draw the probe on top at lower opacity, or make the product line slightly thinner for the step.
- The "area so far" (8 s window) vs "total" difference is never explained. For s just above a (e.g. decay at s = −0.9) the 8 s window shows a small fraction. Add a status clause: "The picture shows the first 8 s; the rest adds {rest}."
- Colours: signal blue = output is fine. Product/probe ink/grey are fine (no role).

##### `explode`

- **Label collision:** "signal lives at s = −0.50" starts on the dashed line (1280 and 375), and at 375 it collides with "infinite area". Offset the line label to the right of the line by 6 px, or put it at the bottom. At narrow widths drop the band label, or move it to the band's centre.
- **Seed the pole symbol here, deliberately:** a small black × on the s axis at s = a with the vocab "Chapter 8 gives this spot a name" would pay off in Ch 8. (Ch 8 is where × = pole is defined, so be careful. The unspin × below is the one to remove.)
- At s − a < 0.6 the marker disappears (F > 6) and the product's 10 s window shows ≤ 63% of the area at s − a = 0.1. Clamp the marker to the top edge with an ↑ and the value. Add a status clause with the visible fraction: "The picture shows only the first 10 s; {pct}% of the area is still to come."
- Status `close` could say the number: "Getting close to a: the area is {F} and climbing!"
- `readout('F(s)')` and the series label `'1/(s − a)'` are hard-coded (l.250, 254). They are maths, but route them through `t()` for RTL isolation, like other chapters' maths labels.

##### `unspin`

- **The matched payoff is off-screen** (1280-light-unspin-matched.png): x axis −1…4.5, path heads to 10 (σ = 0.1) or 20 (σ = 0.05), leaving at t ≈ 5.98 s. Autoscale the x/y range to 1.15 × max(|path|, |limit|) with a short ease, or clamp and show an arrow "→ 10". Also offset the path from the axis line (draw the axis lighter or the path thicker, in a colour).
- **Colour language:** the "final total" marker uses shape `cross` (l.321), which is the pole symbol. Use a ring-free diamond or a flag with the label.
- **Label collision:** "final total" overlaps the path and running dot. Place labels away from the path direction.
- **Promise vs picture:** explode[4] says "added up head-to-tail as arrows". Either draw every ~0.25 s piece as a small arrow along the path (a strong teaching image for "unspinning", and it matches Ch 5's arrows) or change the prose to "added up as a path".
- **Linked representations:** add a small s-plane (`src/ui/s-plane.ts`) where the reader drags s = σ + iω, with the signal's point 2i marked. This joins the two sliders into one gesture and teaches "the transform explodes at the complex s where the signal lives" on the map named two blocks later. Also consider a tiny spinner inset: signal arrow, probe arrow, and their product arrow (Ch 5 style).
- Height 460 px is too tall for the default content at 1280. 360 px would do if autoscaling is added.
- Status when matched: "Spins matched! … The total is 10.0". Add the formula "= 1/σ", so the reader can predict 20 at σ = 0.05.

##### `derivRule`

- **Colour misuse:** rhs is `eff` orange (l.388). Orange is control effort. Use ink2 dashed, or a neutral accent, with the underbrace legend.
- The prose rule[5] says "the two curves on the right". At 375 they are below. Reword: "The second plot shows those two sides for every s."
- Sparse y ticks at 375 (only −0.50). Force at least 3 ticks.
- Help should say presets are the keyboard route: "…or pick a preset (keyboard friendly)".
- The `jump` preset needs S4 or a note, otherwise it contradicts "smooth signals" (rule[7]).
- Status `match` could quote both numbers: "At s = 1.00 both sides are −0.579. The rule holds for your signal."

##### `table`

- `aria-pressed` on Derive/Show buttons (l.523) announces them as toggles. Use `aria-current="true"` on the current row, or `aria-expanded` plus `aria-controls` pointing at the derivation.
- `<span aria-label=…>?</span>` (l.535). Use visually-hidden text instead.
- Status `agree` is hard-coded even when the readout is `bad` (l.552). Pick `agree` or `differ` from the same test as the class.
- 375 px: the last row's f cell runs into "?". Allow wrapping at the comma: split "e^{−σt} sin ωt, e^{−σt} cos ωt" onto two lines, as the F cell already needs.
- Opportunity: after the sine row is derived, show the twin spinners' two transforms as a readout pair (P8). That earns Mika's table[2] line on screen.
- Add the linearity sentence P4 right under the table.

##### `solve`

- **Mistake visibility:** the page shows the *correct* Step 1 (with h(0)) *before* the widget reveals the mistake. The reader never sees the group's wrong Step 1. Fix: show Step 1 initially as the group wrote it (no h(0) terms, h(0) highlighted as missing after the reveal) and let the toggle swap the math block. The bus event `ch7:ic` (l.654) already exists and has **no listener**, so the renderer can subscribe and swap solve[3]/[5] between wrong and right versions. Add the outline's second gated predict before the widget (§7).
- **Droop not visible:** add a dotted blue line at A (Ch 2's "where it ends up" style), a red error band between A and 2 labelled "droop mg/Kp = 0.245 m", and a readout "settles at A".
- **Status when h0 = 0 and the toggle is off:** currently "Perfect match…" although the mistake is still in (it hides because h0 = 0; verified l.281). New status key `hidden`: "From the ground the missing terms are zero, so the mistake hides. Put the drone on a ledge to catch it."
- **Claim wording:** status `match` "agree to a millionth of a metre" and solve[16] "millionths". Measured ≤ 9.3e-10 m, so write "better than a millionth of a metre". The readout prints `0.000000 m`, which is consistent.
- Numerator formatting with `ic` on and h0 = 0 prints "0.00s^2 + 0.00s + 35.095". Drop zero terms.
- `e^{-t}` is hard-coded in the h(t) TeX (l.637). Compute σ from DRONE (it is 1 today).
- `Kp` in solve[9]/[10] math lacks `\eff{}` while solve[1]/[3]/[5] have it. Keep the colour consistent.
- **Page physics (`docs/page-physics.md` rule 7):** Ch 7 draws no drone, only plots. The sim's highest point on the slider grid is 3.36 m (Kp = 60 from the ground, verified), and it never touches the ground (lowest 0.32 m at Kp = 5, h0 = 3). Adding a DroneView just to bonk would break rule 3: the chapter's idea is "the formula equals the sim", and a ceiling hit makes the linear formula wrong. **Recommendation: no page physics in Ch 7.**

#### 7. Pedagogy checklist

| Item | Status | Note |
|---|---|---|
| Driving question | present | "Can we turn calculus into algebra?" Theo's opening makes it felt. |
| Feel-it interactive first | present | `probe` right after the definition. |
| Gated predict-then-reveal | weak | Only `ch7-step`. The outline's 7e predict ("Will the formula match the sim?") is missing, and that is where the mistake should land. |
| One idea per section | weak | `explode` holds two ideas (real blow-up, complex unspinning plus the s-plane). `solve` holds four steps, the mistake and the droop. Acceptable if S5/S6 carry the algebra out of the main thread. |
| Misconception AND on-page mistake | weak | Theo's "lookup rule" is real and resolved. The h(0) mistake happens off-page ("when we typed Step 1 into the checker"). The page's Step 1 is already correct, so the reader never makes or sees the mistake in the maths. |
| Recap | present | 5 items. Item 3 reads awkwardly: "For smooth signals with a convergent transform, the starting value matters." Proposed: "Slopes become multiplication: 𝓛{f′} = sF − f(0). The f(0) remembers where the signal started. Forget it and your answer starts in the wrong place." Add a linearity item. |
| 2–4 quiz items, why for every option | present (4, all whys) | q2 option-3 why says "below", but the table is above. No item on linearity, partial fractions or the droop. |
| Concept-map nodes | present (4) | Missing edges: `guess → dtos` (Ch 4's sticky note), `spin → laplace` (unspinning). Consider a node `pf` "split into table pieces" (partial fractions) with `table → pf`, `pf → tf`. |
| Cliffhanger | present | Strong. Make sure S5 says the two dots out loud, so the cliff lands. |

##### Proposed fixes

**New gated predict `ch7-ledge` (solve, before the widget, after solve[12]):**
- q: "We start the drone on a 1 m ledge and run our formula next to the simulation. What will we see?"
- (a) "They match from the very first moment." why: "They will, once the formula knows about the ledge. Our first try doesn't: look at what we wrote in Step 1."
- (b) "They start apart, but end up at the same height." **correct**, why: "Right. We dropped the h(0) terms, so the formula starts at 0 m while the drone starts at 1 m. Both still settle at the same 1.755 m, because the ledge doesn't change the droop."
- (c) "They never agree, not even at the end." why: "The end height comes from piece A = 2 − mg/Kp, which doesn't depend on h(0). So they meet in the end; only the start is wrong."
- Verified: wrong starts at 0, right at 1; gap > 0.4 m near t = 0.5 s (0.60 m); by t = 10 s < 4e-5 m; A identical (ch07-numbers.test.ts:259, 267).

**Make the mistake on-page:** Step 1 (solve[3]) first shows `m s^2 H + c s H = K_p(2/s − H) − mg/s` (the group's version, as in the outline). After the reveal (toggle on, `ch7:ic` true), the math block swaps to the current correct version with the h(0) terms highlighted. Theo's line becomes: "The algebra's fine. *We* lied. Look at Step 1: we wrote 𝓛{h′} = sH and dropped the −h(0). That's exactly the piece that remembers the ledge."

**New quiz item q5 (derivative rule with a starting value):**
- q: "$f(t) = e^{-t}$, so $F(s) = \frac{1}{s+1}$ and $f(0) = 1$. What's the transform of its slope $f'$?"
- (a) "$\frac{s}{s+1} - 1 = -\frac{1}{s+1}$" **correct**, why: "s·F − f(0). And it checks out: the slope of $e^{-t}$ is $-e^{-t}$, whose transform is $-\frac{1}{s+1}$."
- (b) "$\frac{s}{s+1}$" why: "That's s·F with the starting value forgotten: the ledge mistake again."
- (c) "$\frac{1}{(s+1)^2}$" why: "Slopes turn into *multiplying* by s, not dividing by another (s+1)."
- Verified numerically at s = 0.5, 1, 2 (ch07-extra.test.ts:33).

**New quiz item q6 (droop from the algebra), optional as a replacement for q4 if 4 is the cap:**
- q: "With $K_p$ = 10 N/m, where does piece $A/s$ say the drone settles (target 2 m, mg ≈ 4.9 N)?"
- (a) "About 1.51 m" **correct**, why: "A = 2 − 4.9/10 ≈ 1.51 m. The drone hangs 0.49 m low: Chapter 2's droop."
- (b) "Exactly 2 m" why: "Only without gravity. The −mg/s term pulls A down by mg/Kp."
- (c) "About 0.49 m" why: "That's the droop itself, the gap below the target, not the height."
- Verified: A = 1.5095, sim-equivalent f(30) = 1.5095, droop 0.4905 (ch07-extra.test.ts:40).

**Map:** add edges `guess → dtos`, `spin → laplace`. Optional node `pf` ("split into table pieces").

#### 8. Numerical claims (verified)

Files: N = `$SCRATCH/checks/ch07-numbers.test.ts`, X = `$SCRATCH/checks/ch07-extra.test.ts`. All pass.

| Claim | Expected value | Method (test file + line) | Result |
|---|---|---|---|
| Step area = 1/s (predict; widget s = 1; s = 4) | 1, 0.25 (also 0.5 at 2, 2 at 0.5) | Simpson laplaceReal to T = 80 (N:20) | ✓ |
| Area of e^{−t} to T | 0.632 (T=1), 0.950 (3), 0.993 (5), 0.99966 (8) | Simpson (N:27) | ✓ |
| Probe "area so far" at s = 1, step, 8 s window | 1 − e^{−8} = 0.99966 → "1.000" | closed form (N:34) | ✓ |
| e^{0.5t} finite only for s > 0.5; F(1) = 2 | 2; area at s = 0.4 more than doubles from T = 20 to 40 | Simpson (N:37) | ✓ |
| **FALSE-OBVIOUS:** "the area is infinite" for sin 2t at s = 0 | false: running area ranges 0…1 forever; at s = −0.2: +20.5 (T=20), −22.8 (T=21.5) | exact (1 − cos 2T)/2 plus Simpson (N:44) | ✓ (current status text is wrong) |
| Sine row at s = 1 | 0.4 | Simpson (N:63) | ✓ |
| Explode default a = −0.5, s = 1.5 | 0.50 | Simpson (N:69) | ✓ |
| Explode a = 0.5, s = 0.6 | 10.0 | Simpson to T = 400 (N:69) | ✓ |
| Visible fraction of the area in 10 s window at s − a = 0.1 | 63.2% (6.32 of 10) | closed form (N:73) | ✓ |
| "close" status threshold s − a < 0.3 | F > 3.33 | (N:78) | ✓ |
| Product half-life ln2/(s − a) | 0.693 s (gap 1), 6.93 s (gap 0.1) | (N:81) | ✓ |
| P3 values a = 0.5: s = 1, 0.6, 0.51 | 2, 10, 100 | (N:85) | ✓ |
| Unspin default |F| (σ 0.4, ω 0.5) | 0.644; leftover spin 1.50 rad/s | unspinLimit (N:93) | ✓ |
| Unspin matched |F| = 1/σ | 10 (σ 0.1), 20 (σ 0.05) | (N:98) | ✓ |
| Running total at T1 = 25 s, σ = 0.1 matched | 9.18 (not 10) | unspinIntegral (N:98) | ✓ |
| Matched path leaves the x = 4.5 frame | t ≈ 5.98 s | closed form (N:98) | ✓ |
| Unspin integral = 𝓛{cos 2t} + i𝓛{sin 2t} at s = 0.4 + 0.5i | agreement < 1e-6 | complex Simpson (N:109) | ✓ |
| 𝓛{f′} for e^{at}: a/(s−a) = s/(s−a) − 1 | −0.5 at a = −1, s = 1 | Simpson + algebra (N:121) | ✓ |
| derivRule presets agree within 0.01 over s ∈ [0.2, 3] | worst 7.0e-4 (wobble), 6.2e-5 (jump), 5.9e-4 (decay) | tools.derivativeRule (N:129) | ✓ |
| derivRule default wobble at s = 1 | both −0.579 (−0.57933 / −0.57923) | (N:129) | ✓ |
| **FALSE-OBVIOUS:** the jump preset matches because it is smooth | false: it matches only because the sampled slope contains the spike; without it gap = 1.4e^{−2s} = 0.189 at s = 1 | exact F plus Simpson (N:150) | ✓ |
| 𝓛{f″} = s²F − s f(0) − f′(0), f = cos 2t, s = 1 | −0.8 | Simpson (N:161) | ✓ |
| Table rows at s = 1 | 1, 0.5, 0.4, 0.2, 0.32, 0.24 | Simpson plus table fns (N:170) | ✓ |
| Twin-spinner algebra = ω/(s²+ω²) | < 1e-12 at 3 complex s | complex arithmetic (N:184) | ✓ |
| Quiz 1: 𝓛{3e^{−2t}} = 3/(s+2) | 1.000 at s = 1 (also s = 0.5, 3) | Simpson (N:193) | ✓ |
| Quiz 2: 5e^{−4t} ↔ 5/(s+4); 5e^{4t} explodes at +4 | 5/(s+4) at s = 0.5, 2; 5/(5−4) at s = 5 | Simpson (N:199) | ✓ |
| Quiz 3: x′+2x=0, x(0)=1 → X = 1/(s+2), x = e^{−2t}; forgetting x(0) gives 0 | x(2) = e^{−4} (RK4 1e-3 steps, to 1e-10) | algebra plus RK4 (N:206) | ✓ |
| Solve default (Kp 20, h0 1): numerator constant | 35.095 | (N:226) | ✓ |
| A = 2 − mg/Kp | 1.75475 ("1.755") | (N:226) | ✓ |
| Droop mg/Kp at Kp 20 | 0.24525 m | (N:226) | ✓ |
| B, C (correct) | −0.377375, −0.75475 | (N:226, N:240 coefficient matching) | ✓ |
| σ, ωd | 1, √39 = 6.2450 ("6.24") | (N:226, X:46) | ✓ |
| K1, K2 (correct) | −0.75475, −0.12086 | (N:226) | ✓ |
| Completing the square identity, Kp ∈ {5, 20, 60} | exact; ωd = 3 (Kp 5), 10.909 (Kp 60) | (N:248) | ✓ |
| Wrong attempt (no h0): B, C, K2 as the widget shows | −0.877375, −1.75475, −0.28098; f(0) = 0 | (N:259) | ✓ |
| **FALSE-OBVIOUS:** forgetting h(0) only shifts the start | false: 0.60 m apart near t = 0.5 s; wrong peak 2.82 m vs right 2.21 m; same A, < 4e-5 m apart at t = 10 s | (N:267) | ✓ |
| **FALSE-OBVIOUS:** the wrong formula is always wrong | false: with h0 = 0 it equals the right one | (N:281) | ✓ |
| "maximum gap is millionths of a metre" | worst 9.3e-10 m over the Kp 5…60 × h0 0…3 grid; 2.3e-11 m at default | DroneSim RK4 vs solveDrone, widget sampling every 10 steps (N:286, N:303) | ✓ (claim is conservative; reword) |
| Sim never touches the ground on the slider grid | lowest 0.324 m (Kp 5, h0 3) | solveDrone scan (X:5) | ✓ |
| Highest point on the slider grid | 3.36 m (Kp 60, h0 0) | scan (X:23) | ✓ |
| Ch 2 droop callbacks | 0.981 m (Kp 5), 0.0818 m (Kp 60) | (N:303) | ✓ |
| P6 A at Kp 10 / 40 | 1.5095 / 1.877375 | (N:313) | ✓ |
| Final value s·H(s) → A | 1.75475 | s = 1e-7 (N:320) | ✓ |
| ζ at Kp 20 (Ch 6 callback) | 0.158 | (X:18) | ✓ |
| Proposed q5: 𝓛{(e^{−t})′} = −1/(s+1) | at s = 0.5, 1, 2 | Simpson (X:33) | ✓ |
| Proposed q6: Kp = 10 settles at 1.51 m, droop 0.49 m | 1.5095, 0.4905 | solveDrone at t = 30 (X:40) | ✓ |
| P4/P5/P7 initial values | 1, 1 (5/(1+4)), −0.5, 39 and 9, fmt √39 → 6.24 | arithmetic (X:46) | ✓ |
| Start thrust at the solve default | Kp(2 − h0) = 20 N (at the real 20 N limit) | (X:46) | ✓ |
| ln 50 (2% band for e^{−t}) | 3.912 | (X:23) | ✓ |

---

## Phase 3 — Chapter 8: Transfer Functions, Poles and Zeros (`0.7.0`)

### The phase

Same five sections, plus one short sub-section in `poles` ("reading the map"). Every new number is listed with its expected value for `ch08.test.ts`. All 10 locales change in the same commit as English.

#### 3a. Section `recipe`: derive G(s) and say why "starting at zero"

- **Impact High, Size S.** After recipe#0 (June), a Theo line:
  > Theo: "Last chapter I dropped the $-h(0)$ bits and the formula lied. If we measure from the hover, those starting values really are zero, so they vanish honestly."
- **Side trip S1 "Where the recipe comes from"** (TeX in §5). Place it after the math block. **Impact High, Size S.**
- Mika's line gets June's Ch 7 cliff callback:
  > Mika: "June was right: the fraction **is** the drone. It's like its **recipe**…"
- **Widget `recipe`** (Medium/S): show each input's time formula under ΔR(s) (`2 − e^{−2t}`, `0.5 \sin 2t`). Fix the target-label collision (shared, see below).
- **Tests to add:**
  - step peak 2.6047 m;
  - gentle-step peak 2.0255 m;
  - wave amplitude 0.552 m (|G(2i)| = 1.104);
  - "about four times the weight" = 4.08;
  - hover 4.905 N.
- **Testable outcome:** a reader can reproduce G(s) from Ch 7's rule on paper, and can say why the starting values are zero.

#### 3b. Section `poles`: tie poles to Ch 7's scream and Ch 6's modes; show the gains

- **Reorder** (High/S): move "Now flip it around… new knob $K_d$…" before the math block poles#1. Write "p and its mirror twin $\bar p$".
- New sentence after poles#0 (High/S):
  > "In Chapter 7, $e^{at}$'s transform screamed at $s = a$. Read it backwards: wherever $G$ screams, a motion $e^{pt}$ is hiding. These are Chapter 6's **modes**, now sitting on the map."
- **Side trip S2 "Why poles are the motions"** (High/S).
- **Play P2 `gains`** replaces the "(Behind the scenes…)" parenthesis (High/S).
- **Widget `playground`:**
  1. Challenge zone drawn from the measured criterion, plus a "settles (measured)" readout. **High/M.**
  2. ζ and ωn readouts, the ωn circle, ray labels "ζ = 0.2 · 53 %" via `fmt()` and locale keys (removing the hard-coded strings at `widgets.ts:148-173`). **High/S.**
  3. First-push readout (orange, mg + Kp, red above 20 N) and a faint 20 N budget circle (radius 5.49). **Medium/S.**
  4. Kd < 0 status line (`negKd`, wording in §6). **Medium/S.**
  5. The ground as a real event when no page hit happens (`verdict.hitGround`, plot cut at the crash). **High/S.**
  6. Reduced motion: pin the view to the state at T1 with the true readout. **High/S.**
  7. Marginal hit sentence (`hitPageMarginal`). **Low/S.**
  8. Snap keyboard steps. **Low/S.**
  9. 375 px: label font ≥ 11 px and a 2-column readout grid. **Medium/S.**
  10. "double" wording for a real double pole. **Low/S.**
  11. Optional split into two real poles below the axis. **Medium/L.**
- **Tests to add:**
  - P2 values: −2 ± 4i → Kp 10, c+Kd 2, Kd 1; default → Kp 20, Kd 0; 0.6 ± 3i → Kd −1.6; first push 14.905 / 24.905 N;
  - the zone contour agrees with `stepMetrics` at sampled points (e.g. (−2.1, 0) is *outside*, −1.6 ± 1.2i is *inside*);
  - ground-crash test: formula < 0 ⇒ plot cut at 1.756 s for 0.6 ± 3i;
  - reduced-motion view state equals the formula at T1, clipped.
- **Testable outcome:** the challenge zone never says "you're in" while the status says "not yet"; ζ is visible; the picture, the plot and the status agree in motion and reduced motion.

#### 3c. New sub-section in `poles`: `read` — "Reading the map" (rules with reasons)

- h3 + list stays, but each rule now has its reason (High/M):
  - Settling: "about $4/|\sigma|$ s: Chapter 6's four time constants ($\ln 50 \approx 3.9$, rounded)".
  - Wiggle: "the height ω is Chapter 6's damped frequency; one wiggle takes $2\pi/\omega$ s".
  - Overshoot: "the angle is ζ ($\cos\theta = \zeta$), and the overshoot is $e^{-\pi|\sigma|/\omega}$".
- **Play P1 `poleRead`** inside **side trip S3 "Why the angle sets the overshoot"** (High/S).
- **Side trip S4 "How good is 4/σ?"** with the verified table (Medium/S).
- **Predict `ch8-up`** ("straight up", full options in §7) with the bus move to −2 ± 8i (High/S).
- **Dominant pole:** play P3 plus two lines of dialogue (High/S):
  > Mika: "What if both poles sit on the real axis, one at −0.2 and one at −5?"
  > June: "The fast one's gone in a second. The slow one is the boss."
- Keep Mika's twin mistake and Theo's callback as they are.
- **Tests to add:**
  - P1 at −2 ± 4i: ts 2.0, period 1.57, tp 0.785, os 20.79 %;
  - −2 ± 8i: Ts 1.718 s, OS 45.59 %;
  - the S4 table rows (ζ 0.3 → 3.37, 0.8 → 3.01, 1.0 → 5.834, at σ = 1; tolerance 0.01 s);
  - P3 rows (t = 1 → 0.674 % / 81.9 %; t = 2 → 0.0045 % / 67.0 %; t = 0.5 → 8.21 % / 90.5 %);
  - pair settling 19.76 s vs rule 20 s.
- **Testable outcome:** every rule in the list has a one-sentence reason on the page; a reader can compute an overshoot from σ and ω; the dominant pole is playable.

#### 3d. Section `zeros`: the zero's reason, the drone's zero, less jargon

- zeros#0: cut "An internal motion can still remain hidden from that particular input and output." Or move it into S5 as the last line (Medium/S).
- zeros#1: add the Ch 9 bridge (Medium/S):
  > "(Our playground's $K_d$ pushes against the drone's *speed*, so its recipe has no zero. Push against the *error's* speed instead and a zero appears at $-K_p/K_d$: for these poles that's −6.5, with 15 % overshoot instead of 12 %.)"
- zeros#4: replace the first sentence with **play P6 `zeroKick`**, then keep "Far away, the zero hardly matters." (High/S)
- **Side trip S5 "What a zero blocks"** (Medium/S).
- **Widget `zero`:**
  - autoscale the y-axis (High/S);
  - dotted slope-term curve (Medium/M);
  - status lines with {g} (wording in §6) (Medium/S);
  - rename T(s) → G(s) and trim the decimals (Low/S).
- **Tests to add:**
  - OS table (−0.3 → 568.8, −0.5 → 320.7, −1 → 137.5, −2 → 52.6, −3 → 29.8, −5 → 17.6, −8 → 14.1, −12 → 13.0 %; no zero 12.31 %);
  - y = y₀ + y₀′/|z|;
  - blocking e^{−3t} → (13/9)e^{−2t} sin 3t;
  - PD-on-error zero −6.5 with OS 15.2 %;
  - the y-axis never clips (peak ≤ y-max for every z in range).
- **Testable outcome:** "near the origin → kick" has a stated reason (× slope); the curve never leaves its plot.

#### 3e. Section `limits`: put a number on June's misconception

- limits#2: add the callback (Medium/S):
  > "Below, the poles move left along a 45° line (that's ζ ≈ 0.71, Chapter 6's sweet spot)."
- limits#4: first sentence → **play P4 `push`**. Then fix the overshoot claim (High/S):
  > "Past about −3.9 ± 3.9i the maths asks for more than 20 N. The orange thrust flattens against the limit; past about −6 ± 6i the maths even wants to pull the drone *down*, which propellers can't. The real drone stops following the pretty linear prediction. Its settling stops improving at about 0.72 s, near −6.5 ± 6.5i, and further left it gets *worse*, with extra overshoot."
- June does the mistake on the page (High/S):
  > June: "I slid it all the way to −8 ± 8i. The maths says 0.53 s. The real drone takes 0.77 s: slower than at −6.5!"
- **Side trip S6 "A thrust budget is a circle"** with **P5 `budget`** (Medium/S).
- **Widget `limit`:**
  - move the "can't pull down" label below the 0 line (High/S);
  - add a 20 tick (Low/S);
  - "overshoot (real)" readout (Medium/S);
  - new capped status with the best settling (Medium/S);
  - optional mini s-plane with the ray and the 5.49 circle (Medium/M).
- **Tests to add:**
  - peak 4.905 + σ² (σ = 4 → 20.905, 8 → 68.905);
  - crossing σ = 3.885;
  - ideal thrust < 0 from σ ≈ 5.9 (σ = 6 → −0.32 N);
  - real OS at σ = 6 (4.10) < gentle (4.32) and σ = 7 (8.60) > gentle;
  - best real settling 0.718 s at σ = 6.5, with 8 → 0.768 s;
  - P5 radii 5.4945 / 7.7705 / 3.8852 and angle independence;
  - Kp = 20 drone with limits: OS 74.95 %, saturated 0.133 s (so Ch 9 quotes the right number).
- **Testable outcome:** every thrust number in the prose comes from a formula the reader can drag, and the "overshoots more" claim is true for the setting the text points at.

#### 3f. Section `wrap`

- Recap, replace item 3 with (Medium/S):
  > "Left half = stable, right half = explodes. Further left = faster (settles in about 4/|σ| s, a rule of thumb), higher = wigglier (one wiggle = 2π/ω s), angle = damping ζ = overshoot $e^{-\pi|\sigma|/\omega}$. The pole nearest the axis is the boss."
- Recap, replace item 6 with:
  > "The first push is $mg + m|p|^2$ per metre of step, so far-away poles need thrust the motors don't have."
- Quiz (High/S): q3 why fix; q2 `c` → `q`; replace q4 with the dominant-pole item (wording in §7); optionally swap q1 for the thrust item.
- Concept map (Low/S): edges `['mode','poles']`, `['wnzeta','poles']`. Optional node `limits` ("motor limits") in ch8, with an edge to Ch 9's `integralaction` (anti-windup).
- **Tests to add:** q1 real settling 3.736 / 1.038 / 7.646 s, ranking kept; q2 roots −1 ± 3i; dominant-quiz numbers 67 %, 0.0045 %, 0.67 %, 8 %, 90 %, ratio 25; thrust-quiz 13.905 / 40.905 N.
- **Testable outcome:** every number in the recap and quiz has a test; four quiz items, a why on every option.

#### Shared building blocks

- `DroneView` target-label placement: avoids the drone body. It shows up in Ch 1/2/6/8/9 pictures. Owner: `src/ui/drone-view.ts`.
- `SPlane`:
  - `circle` guide (Ch 6 already has one; move it into SPlane options);
  - labelled rays built from ζ with `fmt()`;
  - optional "split on the real axis" mode for a mirror pair (Ch 9 root-locus-like tuning could reuse it);
  - guide-label font scaling at narrow widths;
  - keyboard snapping.
- `Plot`: animated auto-y-max (`autoMax: true`) and custom ticks; line-label placement that avoids series (`avoid: ['real']`). Ch 9/10 thrust plots need it.
- A contour helper `regionFromMetric(f, grid)` → polygon, for challenge zones judged by `stepMetrics` (Ch 9's tuning challenges).
- A formula-to-ground handover, like `fall.ts` but for h ≤ 0: `groundCut(trace)` next to `fallTrace`.

#### New glossary terms for translators

| term | English definition |
| --- | --- |
| transfer function | output change ÷ input change in s-land, starting from rest |
| pole | a value of s where the transfer function blows up; one motion e^{pt} of the system |
| zero | a value of s where the transfer function is zero; a motion the system does not pass on |
| mirror pair / conjugate pair (p, p̄) | two poles with the same σ and opposite ω |
| dominant pole | the pole nearest the vertical axis, whose slow motion outlasts the others |
| peak time | when the first overshoot peak happens, half a wiggle, π/ω |
| first push | the thrust asked for at the first instant of a step, mg + Kp·Δr |
| thrust budget | the region of pole positions the motors can afford for a given step |
| motor limit / saturation | thrust clipped to 0–20 N |
| starting from rest (zero initial conditions) | all changes and their speeds are zero at t = 0 |
| rule of thumb | an approximate formula (4/σ) |

#### Risks

- The measured-criterion challenge zone is irregular (the settling time jumps as peaks leave the 2 % band). It may look odd; draw it smoothed from a 0.05 grid and test the samples.
- More side trips in `poles` risk overload. Keep S2 and S3 short (3–5 sentences) and move S4 to the end of the section.
- The playground's real-axis split changes the twin-mistake story. Keep the mirror constraint off the axis, and gate the split behind dragging *past* the axis.
- Numbers like "0.72 s best" depend on the saturated sim. Compute them in code; the text says "about 0.7 s" and the test pins 0.718 ± 0.01.
- The Kp = 20 saturated overshoot (74.9 %) changes what Ch 9 can quote once "the limit stays on". Coordinate with the Ch 9 reviewer.

#### Suggested commit order (this chapter)

1. `fix(ch08): real-metric challenge zone, reduced-motion view, ground crash handover` + tests (no text change beyond `verdict.hitGround` ×10 locales)
2. `fix(ch08): locale-aware guide labels, zero-plot autoscale, limit label placement`
3. `feat(ch08): plays.ts (poleRead, gains, dominant, push, budget, zeroKick)` + registry + tests
4. `feat(ch08): recipe derivation side trip and zero-initial-conditions callback` (EN + 9 locales)
5. `feat(ch08): poles tied to Ch 7 and Ch 6; gains play; reorder Kd`
6. `feat(ch08): reading the map (overshoot and settling side trips, straight-up predict, dominant pole)`
7. `feat(ch08): zeros (slope reason, blocking side trip, Ch 9 bridge)`
8. `feat(ch08): limits (first-push play, thrust-budget circle, corrected overshoot claim, June's run)`
9. `feat(ch08): recap, quiz, concept-map edges`
10. `docs: update control-course-plan.md Chapter 8`

### Evidence for this phase

*Reviewer scope: `public/locales/en/ch08.json`, `src/chapters/ch08/{widgets.ts,poles.ts,fall.ts,ch08.css,ch08.test.ts,fall.test.ts}`,
outline "### Chapter 8" in `docs/course-plan.md`, concept-map nodes in `src/story/concept-map.ts:56-59`.
Checks: `$SCRATCH/checks/ch08-numbers.test.ts`, `ch08-extra.test.ts`, `ch08-plays.test.ts`, `ch08-pderr.test.ts`
(all 28 tests pass: `pnpm vitest run --root $SCRATCH/checks ch08`). Raw numbers were logged to `$SCRATCH/checks/ch08-log*.txt` during the runs.
`$SCRATCH` = `$SCRATCH`.*

#### 0. Snapshot

**Driving question:** "Can we read a system's whole personality off one fraction?" (`question`).

**Sections in order**

| id | title | one line |
| --- | --- | --- |
| `recipe` | The system's recipe | June sets up changes from the 1 m hover. G(s) = Kp/(ms²+cs+Kp) is **stated** as ΔH/ΔR ("transfer function"). Mika: "recipe". Widget `recipe`. Vocab: transfer function. |
| `poles` | Poles: where the system wants to live | Poles = where G blows up = roots of m s² + (c+Kd)s + Kp. Flip it: drag poles, and the gains follow. Gated predict `ch8-rhp`. Widget `playground`. Four rules (left/right, 4/\|σ\|, 2π/ω, angle → overshoot). Mika's twin-pole mistake, Theo's mirror-pair callback. Note: default −1 ± 6.24i is the Kp = 20 drone. |
| `zeros` | Zeros: a quick look | Zeros = numerator roots, ○, change "how much" of each mode; cancellation; hidden internal motion. Widget `zero` (fixed poles −2 ± 3i, slide a real zero). June: near origin → faster and more overshoot. "React strongly to changes". |
| `limits` | Is further left always better? | June: drag way left. Theo: what thrust? Motors 0–20 N. Widget `limit` (poles on a 45° line, ideal vs saturated). "50, 60, 70 newtons". June's trade-off line. Note: 20 N limit stays on. |
| `wrap` | What we know now | Recap (6 items), quiz (4), map, cliff (Theo: we cheated with the hover thrust; droop; fix the controller). |

**Widgets**

| id | shows | controls | readouts / status |
| --- | --- | --- | --- |
| `recipe` (`widgets.ts:21-103`) | setpoint (green dashed) + height (blue, ghost) over 8 s; a `DroneView` replaying it; the equation ΔH = G·ΔR with ΔR(s) for the chosen input | segmented: step / gentle step (2 − e^{−2t}) / wave (1 + 0.5 sin 2t) | no readouts; plot description only |
| `playground` (`widgets.ts:106-369`) | s-plane (−10…4, ±8i) with a draggable mirror pair, green/red half-planes, settling lines (−1, −2, −4), overshoot rays (ζ 0.2/0.5/0.7), a blue "one wiggle" line, fading trail, optional challenge zone; drone view (page physics: `onCeiling → hitPage → fallSim`); step response plot 0–6 s with ghost; the equation (general → numeric → factored) | drag or arrow keys (Shift ×5), challenge toggle | poles, "settles (≈4/σ)", overshoot (formula), Kp, Kd; verdict status; challenge status (uses the *measured* metrics) |
| `zero` (`widgets.ts:372-433`) | s-plane with fixed × at −2 ± 3i and a draggable ○ on the real axis (≤ −0.3); plot with/without the zero, 0–4 s, y 0–2.5 | drag / ← → | overshoot without/with; status near/mid/far; T(s) equation |
| `limit` (`widgets.ts:436-511`) | height (ideal pencil dashed, real blue) and thrust (ideal pencil dashed, real orange) over 3 s, lines at 20 N and 0 N | slider σ = 1…8 step 0.5 (poles −σ ± σi), toggle real motors | peak thrust the maths wants, settles (maths), settles (real); status capped/fantasy/fine |

**Predict card:** `ch8-rhp` (gated, before the playground): lands / hovers wobbly / swings harder until it crashes (correct). On answer, the bus moves the poles to 0.6 ± 3i (`widgets.ts:357-363`).

**Mistake / misconception:** Mika tries to separate the twin poles (poles block 6–7). June: "drag way left" (limits 0), corrected by the limit widget.

**Quiz (4):** q1 fastest settling of three pairs; q2 poles of 3/(s²+2s+10); q3 less overshoot at the same settling; q4 poles at +0.5 ± 2i. Every option has a why.

**Map nodes:** `tf`, `poles`, `zeros`, `stability` (`concept-map.ts:56-59`); edges `dtos→tf`, `tf→poles`, `tf→zeros`, `splane→poles`, `poles→stability`, `stability→robust`.

**Cliffhanger:** Theo: hover thrust was a cheat; gravity still makes it droop; fix the controller.

**Tests today** (`src/chapters/ch08/ch08.test.ts`, `fall.test.ts`):
- gains from poles put the roots there, including the Kp = 20 drone at −1 ± 6.245i with Kd = 0 (`ch08.test.ts:10-20`);
- DroneSim PD matches `stepFromPoles` (`:22-31`);
- the overshoot formula matches measured values, and `overshootOf(−2,4) ≈ 20.8` (`:33-41`);
- 4/σ is within 0.6–1.15× for four ζ in [0.3, 0.8] (`:43-54`);
- the zero formula matches an RK4 simulation, and overshoot is ordered with zero position (`:56-77`);
- far-left poles saturate at 20 N and 0 N (`:79-92`);
- saturated σ = 8 overshoots more than σ = 2 (`:95-107`);
- fall: stops at the hit, never rises, crashes; the fall time matches the analytic drag fall (`fall.test.ts`).

**Not tested today:**
- quiz q1 numbers (4 s, 1 s, 8 s);
- q2 roots;
- the ray labels 53 / 16 / 5 %;
- "about four times the drone's weight";
- "50, 60, 70 newtons";
- the 12.3 % no-zero overshoot readout;
- the challenge zone against the challenge criterion.

#### 1. Screenshots

31 PNGs in `$SCRATCH/shots/ch08/`: 1280 and 375 × light and dark for the full page and each of the four widgets, 375 `de`, plus interaction shots. The ones worth citing:

- `1280-light-playground.png`: readout "settles (≈4/σ) ≈ 4.0 s", but the plot visibly settles about 3.7 s (true value 3.66 s). The drone view's "target" label is hidden under the drone body ("targe…"). There is no ζ, ωn or thrust readout. The equation uses `H(s)/R(s)`, while the recipe used `ΔH/ΔR`.
- `375-light-playground.png`: at 375 px the s-plane labels (ticks, "settles ≈ 1 s", 5 %/16 %/53 %, "one wiggle ≈ 1.01 s") are ~7 px and hard to read. Five stacked readouts beside the drone make the widget 1282 px tall.
- `1280-light-playground-rhp-0.9s.png`: the page hit works. The drone tumbles out above the picture, and the plot becomes formula-then-fall. The status reads "Right half: it blows up! It flew out of its picture, hit the page, and fell. Move a pole to try again." The Kd readout shows **−1.60 N·s/m** with no comment. Keyboard steps of 0.1 from 6.245 leave the pole at "0.60 ± 3.05i" (not snapped).
- `1280-light-playground-rhp-9.5s.png`: taken after the 7 s replay cycle. The drone stays crashed at 0.00 m, and the plot and status are unchanged. **It does not come back to life.** ✓
- `1280-light-reduced-motion-playground-rhp.png`: with reduced motion (the pole ended at a real double pole, 2.20), the picture says "CRASH!" at 0.00 m while the blue plot line runs off the top. The picture and the numbers disagree. The readout shows "poles 2.20" with no "double" wording.
- `1280-light-recipe.png` / `375-light-de-recipe.png`: the "target" label collides with the drone at 2 m. Apart from that the widget is clean. The underbraces "G(s) stays the same" and "ΔR(s) changes" are good.
- `1280-light-zero.png`: fine at z = −3 (12.3 % vs 29.8 %). `1280-light-zero-near-origin.png`: at z = −0.3 the blue curve leaves the plot at ~0.1 s and comes back at 1.0 s, while the readout says **568.8 %**. The plot's y-max of 2.5 clips every z ≥ −0.93. The equation reads "13/0.30 · (s+0.30)/…" (a normalisation that is never explained).
- `375-dark-zero.png`: the s-plane is short and wide. Tick labels at 375 are ~6 px.
- `1280-light-limit.png`, `375-dark-limit.png`, `375-light-de-limit.png`: the label "motors can't pull down" sits on top of the orange thrust curve (all widths). In German ("Motoren können nicht nach unten ziehen") it spans the whole plot. The thrust y-axis has ticks only at 0 and 50, with no 20.
- `1280-light-limit-sigma8.png`: σ = 8 reads peak 69 N, settles 0.53 s (maths) / 0.77 s (real). The status is good. There is no real-overshoot readout, although the prose claims "it overshoots more".

#### 2. Terms before use

| # | Term / symbol / formula / number | First appears | Status | Note |
| --- | --- | --- | --- | --- |
| 1 | hover at 1 m, "4.9 N of base thrust" | recipe#0 | earned (Ch 6 note, Ch 2) | 4.905 N ✓ |
| 2 | "requested change", "actual height change", baseline | recipe#0 | earned | good deviation-variable setup |
| 3 | Δ (change) on `\out{H}`, `\sp{R}` | recipe#1 | only stated | Δ never said aloud as "change of". Fine once #2 is read, but the playground drops the Δ |
| 4 | G(s) = Kp/(ms²+cs+Kp) | recipe#1 | **only stated** | no derivation from Ch 7's rule. See stuck #1 |
| 5 | "transfer function … both changes starting at zero" | recipe#2 | only stated | *why* zero initial conditions (Ch 7's f(0) terms vanish) is never said |
| 6 | "Add the 1 m starting height" | recipe#3 | earned | |
| 7 | "recipe" metaphor | recipe#4 | earned | nice |
| 8 | 1/s, 1/s − 1/(s+2), 0.5·2/(s²+4) (widget) | recipe widget | earned (Ch 7 table) | the time formula of the "gentle step" (2 − e^{−2t}) is never shown |
| 9 | "fraction of polynomials in s" | recipe vocab | only stated | "polynomial" is fine at school level |
| 10 | "blow up", "zero of its denominator" | poles#0 | earned (Ch 7 `explode`) | but Ch 7's "screams at s = a" is not quoted, and neither is 1/(s−a) ↔ e^{at} |
| 11 | "after any common factors have been canceled" | poles#0 | used before defined | cancellation needs zeros, which come a section later |
| 12 | pole, × | poles#0 | earned | |
| 13 | "two natural e^{st} motions from Chapter 6" | poles#0 | earned (Ch 6 modes) | the word **mode** (Ch 6 vocab) is not reused |
| 14 | Kd, (c + Kd) | poles#1 (math) | **used before defined** | explained only in poles#2 |
| 15 | p, p̄ (bar) | poles#1 | **used before defined** | the conjugate bar is never introduced ("mirror twin" is Ch 5's word) |
| 16 | "work out the controller that puts them there" | poles#2 | only stated | Kp = m(σ²+ω²), c + Kd = 2mσ is never shown, though the playground displays the results |
| 17 | right half, σ > 0 growing spiral | predict | earned (Ch 5/7) | |
| 18 | readouts Kp (N/m), Kd (N·s/m) | playground | Kp earned; Kd only named | negative Kd is unexplained |
| 19 | "settles (≈4/σ)" | playground | only stated | Ch 6's callout gives ln 50/a ≈ 3.9/a for one mode; the link isn't made |
| 20 | ray labels 53 %, 16 %, 5 % | playground | only stated | ζ values behind them are not shown; strings are hard-coded (`widgets.ts:160-163`) |
| 21 | "one wiggle ≈ 1.01 s" | playground | earned (Ch 5 2π/ω) | |
| 22 | "Damping ratio {z}" | playground SR text only | earned (Ch 6) | sighted users never see ζ in Ch 8 |
| 23 | challenge "overshoot under 10 % and settled within 2 s" | playground | only stated | the zone is drawn from the rules of thumb, but judged by real metrics (§6) |
| 24 | "Left half = calms down …" σ as shrink/grow rate | poles#5 | earned | |
| 25 | "Settling takes about 4/\|σ\| seconds" | poles#5 | **only stated** | the reason and the size of the error are missing (§3, §8) |
| 26 | "one wiggle takes 2π/ω seconds" | poles#5 | earned | |
| 27 | "The angle sets the overshoot" | poles#5 | **only stated** | which angle? No ζ = cos θ, no formula, no reason |
| 28 | mirror pairs | poles#7 | earned (Ch 5) | |
| 29 | "−1 ± 6.24i", "Kp = 20 drone" | poles#8 | earned | √39 = 6.245 → "6.24" ✓ |
| 30 | zero, ○ | zeros#0 | earned | |
| 31 | "how much of each pole's motion" | zeros#0 | only stated | residues, informally. OK |
| 32 | "an internal motion can still remain hidden" | zeros#0 | only stated | a wall for beginners (hidden modes). Cut it or move it to a side trip |
| 33 | "fixed poles at −2 ± 3i" | zeros#1 | earned | |
| 34 | "a controller that reacts to how fast the *error* changes" | zeros#1 | teaser | but the playground's Kd acts on the measured speed (no zero). Say so |
| 35 | T(s) | zero widget | **used before defined** | a new letter, where the prose says G(s) |
| 36 | 13/\|z\| normalisation | zero widget | only stated | "scaled so it still ends at 1" is missing |
| 37 | overshoot 12.3 % without the zero | zero widget | only stated | verified 12.31 % |
| 38 | "react strongly to changes" | zeros#4 | **only stated** | the reason (the zero adds 1/\|z\| × slope) sits in a code comment (`poles.ts:40-42`), not in the prose |
| 39 | 0 N and 20 N, "about four times the drone's weight" | limits#2 | stated | 20/4.905 = 4.08 ✓ |
| 40 | "45° line" | limits#2 | only stated | this is ζ = 0.707, Ch 6's sweet spot. The callback is missing |
| 41 | dashed = maths, solid = real | limits#2 | earned | |
| 42 | "50, 60, 70 newtons" | limits#4 | stated | σ = 7 → 53.9 N, σ = 8 → 68.9 N ✓ (≈). There is no formula for *why* |
| 43 | "it overshoots *more* than it would with gentler poles" | limits#4 | **partly false** | true only for σ ≥ 6.25 (§8) |
| 44 | recap "≈ 4/\|σ\| s", "angle = overshoot" | wrap recap | stated | |
| 45 | quiz q1: 4 s, 1 s, ≈ 8 s | q1 | stated | rule values ✓; real values 3.74 / 1.04 / 7.65 s |
| 46 | quiz q2: quadratic formula, "s² + bs + c" | q2 | earned (Ch 6 ±) | the letter **c** clashes with the drag c. Ch 6 uses `s² + b s + q` |
| 47 | quiz q3 "same distance from the axis means same settling time" | q3 | overstated | real settling at σ = 2 goes 1.87 → 2.08 → 2.92 s as ω goes 4 → 1 → 0 |
| 48 | "droop", "hover thrust" | cliff | earned (Ch 2/6) | |

##### Where a curious beginner gets stuck

1. **Where G(s) comes from.** Wall: the fraction arrives fully formed, one chapter after Ch 7 made a point of *deriving* everything. Fix: a three-line side trip "Where the recipe comes from". Transform `m Δh'' + c Δh' = Kp(Δr − Δh)` with Δh(0) = Δh'(0) = 0 using Ch 7's rule, collect ΔH, done (TeX in §5 S1).
2. **Why "starting at zero".** Wall: it sounds like a technicality. Fix: one Theo line tying it to his Ch 7 mistake: "Last chapter I dropped the −h(0) bits and the formula lied. Measure from the hover and those bits really are zero, so the fraction is honest."
3. **Why poles *are* the motions.** Wall: the text asserts it ("matching the two natural e^{st} motions"). Fix: S2. The step response is G(s)·1/s. Split it into pieces, one 1/(s − p) per pole. Ch 7's table turns each piece back into e^{pt}. "The transform screams at s = a" run backwards.
4. **Kd and p̄ before definition** (poles#1). Fix: reorder. Put the "flip it around / new knob Kd" paragraph *before* the math block, and write "p and its mirror twin p̄".
5. **4/|σ|.** Wall: where does 4 come from, and how exact is it? Fix: one sentence ("Ch 6: a mode e^{−σt} is below 2 % after ln 50/σ ≈ 3.9/σ; round it to 4") and a side trip "How good is 4/σ?" with the verified error table (§5 S4).
6. **"The angle sets the overshoot".** Wall: no reason, no formula, no ζ. Fix: S3. The first peak comes after half a wiggle, t = π/ω. By then the envelope has shrunk to e^{−σπ/ω}, which is the overshoot. σ/ω depends only on the angle, and cos θ = ζ (Ch 6's circle). Add the playable P1.
7. **What Kp/Kd the pole pair needs.** Wall: readouts appear without the formula. Fix: P2 ("To put the poles at … the controller needs Kp = m(σ²+ω²) = … and c + Kd = 2mσ = …").
8. **T(s) vs G(s) and 13/|z|.** Fix: rename to G(s) in the widget, or say "call this one T". Add "(scaled so it still ends at 1)".
9. **Why a zero near 0 kicks.** Fix: P5 plus one sentence. The factor (1 + s/|z|) means "old response + (1/|z|) × its slope" (Ch 7: × s = slope). Near 0, 1/|z| is big.
10. **"Hidden internal motion".** Fix: cut the sentence from zeros#0 or move it into a side trip. It is a Ch 10/11 idea.
11. **45° = ζ ≈ 0.7.** Fix: "a 45° line, which is ζ ≈ 0.71, Chapter 6's sweet spot".
12. **Where the thrust demand comes from.** Wall: "50, 60, 70 N" is a sentence, not a reason. Fix: P4. At the first instant the error is the whole metre and the speed is zero, so thrust = mg + Kp·1 m = 4.9 + m|p|² N. It grows with the square of the distance from 0.
13. **Negative Kd** (right half, and even −0.5 ± 5i needs Kd = −0.5). Fix: a status line when Kd < 0 (§6).
14. **Two real poles.** Wall: the playground can only make a *double* real pole (`im = Math.max(0, p.im)`, `widgets.ts:129`), so the outline's dominant-pole idea (−0.2 vs −5) can't be felt, and "2.20" shows with no "double". Fix: P3, plus optionally a "split on the axis" drag mode (§6).

#### 3. Explanation gaps

**Bridges back**

- **Ch 3 (steps, τ, area):** settling 4/σ = "four time constants, τ = 1/σ" is never said. Ch 6's callout already has "about four time constants: Chapter 3's ruler again". Reuse it in poles#5.
- **Ch 4 (guess-an-exponential):** the old way was guessing e^{st} and finding s from m s² + … = 0. Ch 8's denominator *is* that same polynomial. One line would land it: "the bottom of G is the very equation we got by guessing e^{st} in Chapters 4–6".
- **Ch 5 (spinners, i, mirror twins):** the twin callback is present ✓. The conjugate bar p̄ is not connected to "mirror twin" (poles#1).
- **Ch 6 (ωn, ζ, modes, circle, ωd, 0.7 rule):**
  - ζ is never visible in Ch 8, only in the SR description.
  - ωn = |p| (distance from 0) is never mentioned, although Ch 6 draws the circle.
  - "mode" is not reused.
  - ω in the playground *is* ωd. Say "the height is Ch 6's damped frequency ωd".
  - The 45° line in `limit` is ζ ≈ 0.71 (Ch 6's "0.7").
- **Ch 7 (probe, screams at s = a, derivative rule, table, solve):**
  - The derivative rule with zero ICs is not shown producing G.
  - Mika/Theo's "dropped −h(0)" mistake is the perfect reason for "zero initial conditions" and isn't used.
  - Ch 7's `solve` denominator s(m s² + c s + Kp) contains the same polynomial. Say "the s in front was the step; the rest is the drone".
  - Ch 7's cliff ("What if that fraction is the drone?") is answered only implicitly. Mika's "recipe" line could open with "June was right".
- **Forward to Ch 9:**
  - The zero teaser says "reacts to how fast the error changes", but the playground's Kd uses the measured speed (`pd(..., dOnMeasurement: true)`, `widgets.ts:18`), so its G has no zero. One sentence: "Our playground's Kd pushes against the drone's *speed*, so its recipe has no zero. Push against the *error's* speed instead and a zero appears at −Kp/Kd." Verified: for poles −2 ± 3i that is Kp = 6.5, Kd = 1 → zero at −6.5, overshoot 15.2 % vs 12.3 % (`ch08-pderr.test.ts`).
  - With the 20 N limit "switched on from now on", Ch 2's Kp = 20 drone saturates for 0.13 s at the start of a 1 m step. The 0 N floor then lets it overshoot **74.9 %** instead of 60.5 % (`ch08-plays.test.ts:25`). Ch 9 must not quote the unsaturated 60 % for that drone.

**Skipped derivation steps**

1. From the ODE to G(s): transform with zero ICs and collect ΔH (recipe).
2. From G(s)·ΔR(s) to e^{pt} terms: partial fractions (Ch 7 `solve` did it once; one line suffices).
3. From the pole pair to the gains: expand m(s − p)(s − p̄) = m s² − 2mσ_p s + m|p|². `poles.ts:8-9` has it as a comment; the prose never shows it.
4. From the angle to the overshoot: t_peak = π/ω, OS = e^{−σπ/ω}.
5. From the zero to the kick: G_z = (1 + s/|z|)·G_0 → y = y_0 + y_0′/|z|.
6. From the pole distance to the thrust: T(0⁺) = mg + Kp·Δr = mg + m|p|²·Δr.

**Rules of thumb given without a reason**

- "Settling takes about $4/|\sigma|$ seconds" (poles#5, recap#2). No reason, no accuracy.
- "The angle sets the overshoot. Poles near the real axis barely overshoot, poles near the vertical axis overshoot a lot" (poles#5). No formula.
- "Near the origin they add a kick" (recap#4). No reason.
- "Far-left poles need thrust the motors don't have" (recap#5). No number or formula.
- q3's why: "Same distance from the axis means same settling time". Presented as exact; it is a rule of thumb (−11 % … +56 % spread along σ = 2, §8).

#### 4. Playable-number opportunities

The models go in a new `src/chapters/ch08/plays.ts`, registered in `src/chapters/registry.ts:18` as `plays: () => import('./ch08/plays')`.
All values below are verified in `$SCRATCH/checks/ch08-plays.test.ts` / `ch08-numbers.test.ts`.

##### P1 `poleRead`: reading a pole pair (replaces list items 2–4 of poles#5 as the "why", or sits in side trip S3)

> "Poles at −{scrub|sig} ± {scrub|w}i: the wiggles shrink like $e^{-\sigma t}$, so it settles in about {calc|ts} s. One wiggle takes {calc|period} s. The first peak comes after half of one, at {calc|tp} s, and by then the shrinking has left an overshoot of {calc|os}."

- inputs: `sig` min 0.2, max 8, step 0.1, initial 2 (shown as a positive number after the printed "−"); `w` min 0, max 8, step 0.1, initial 4.
- outputs:
  - `ts` = fmt(4/sig, 1);
  - `period` = fmt(2π/w, 2), or the word `plays.poleRead.noWiggle` ("no wiggle at all") when w = 0;
  - `tp` = fmt(π/w, 2), or the word "never" when w = 0;
  - `os` = fmt(100·e^{−π·sig/w}, 0) + " %", or the word "no overshoot" when w = 0.
- Placement: poles section, right after the `list` block (poles#5). Keep the list's four bold headlines but drop the parentheticals the play now explains.
- Values at the initial setting (−2 ± 4i): ts **2.0** s (true 2 % settling 1.87 s), period **1.57** s, tp **0.79** s (measured 0.785), os **21 %** (20.79 %).
- Also verified: −2 ± 8i → tp 0.39 s, os 46 % (45.59); −1 ± 6.24i → tp 0.50 s, os 60 % (60.47).

##### P2 `gains`: the controller that puts the poles there (replaces "(Behind the scenes we work out the controller…)" in poles#2)

> "To put the poles at −{scrub|sig} ± {scrub|w}i, the controller needs $\eff{K_p} = m(\sigma^2+\omega^2)$ = {calc|kp|eff} N/m and $c + \eff{K_d} = 2m\sigma$ = {calc|damp} N·s/m, so $\eff{K_d}$ = {calc|kd|eff} N·s/m. {calc|note}"

- inputs as P1 (sig 0.2–8 step 0.1 initial 2; w 0–8 step 0.1 initial 4).
- outputs:
  - `kp` = fmt(0.5·(sig²+w²), 1);
  - `damp` = fmt(sig, 2) (since 2m = 1 kg);
  - `kd` = fmt(sig − 1, 2);
  - `note`: word `plays.gains.negKd` when sig < 1 ("That's a *negative* Kd: the drag alone is already more damping than these poles want, so the controller has to push *with* the motion."), otherwise empty.
- Values at the initial setting: Kp **10.0** N/m, c + Kd **2.00**, Kd **1.00** N·s/m.
- Checks:
  - sig 1, w 6.24 → Kp 19.97 ≈ 20, Kd 0.00 (Ch 2 drone; exact with w = √39);
  - −4 ± 2i → Kp 10, Kd 3;
  - −0.5 ± 5i → Kp 12.63, Kd −0.50.
- Place: poles section, after the math block poles#1 (and after reordering so Kd is introduced first).

##### P3 `dominant`: two real poles, one in charge (new, poles section after the note poles#8, or in the new sub-section 9c)

> "Real poles at −0.2 and −5. After {scrub|t} s, the fast motion $e^{-5t}$ has {calc|fast} of its start left, and the slow one $e^{-0.2t}$ still has {calc|slow}. So the slow pole decides: settling takes about 4/0.2 = 20 s."

- inputs: `t` discrete values [0, 0.25, 0.5, 1, 2, 5, 10], initial 1, unit s.
- outputs: `fast` = 100·e^{−5t} %, `slow` = 100·e^{−0.2t} %. Use fmt(·, 2) below 1 %, fmt(·, 0) above; below 0.01 % print the word "almost nothing".
- Values:

  | t | fast | slow |
  | --- | --- | --- |
  | 1 (initial) | 0.67 % | 82 % |
  | 0.5 | 8.2 % | 90 % |
  | 2 | 0.0045 % | 67 % |
  | 5 | ≈ 1e−9 % → "almost nothing" | 37 % |

- True 2 % settling of the pair's step response: **19.76 s** (formula ln(50·5/4.8)/0.2). Rule 4/0.2 = 20 s. The slow pole alone: ln 50/0.2 = 19.56 s. Largest gap between the pair's step response and the one-pole approximation 1 − e^{−0.2t}: 0.035 (3.5 % of the step).
- Drone gains for this pair: Kp = 0.5 N/m, c + Kd = 2.6 → Kd = 1.6 N·s/m (`ch08-numbers.test.ts:25`).

##### P4 `push`: the first push a pole pair asks for (replaces "Past a certain point the maths demands 50, 60, 70 newtons…" in limits#4, first sentence)

> "At the first instant of a 1 m step the error is the whole metre and the drone isn't moving yet, so the maths asks for hover plus $\eff{K_p}$ × 1 m. With the poles at {scrub|sig} that's 4.9 + {calc|kp|eff} = {calc|peak|eff} N: {calc|verdict}."

- inputs: `sig` min 1, max 8, step 0.5, initial 4; `format: (v) => "−v ± vi"` (as the limit slider).
- outputs: `kp` = fmt(sig², 1) (on the 45° line Kp = m·2σ² = σ²); `peak` = fmt(4.905 + sig², 1); `verdict` word:
  - peak ≤ 20: "the motors can do that";
  - peak ≤ 25: "just over the 20 N the motors have";
  - otherwise: "far beyond the motors".
- Values:

  | poles | Kp (N/m) | peak | verdict |
  | --- | --- | --- | --- |
  | −4 ± 4i (initial) | 16.0 | 20.9 N | just over |
  | −2 ± 2i | 4.0 | 8.9 N | can do |
  | −3 ± 3i | 9.0 | 13.9 N | can do |
  | −6 ± 6i | 36.0 | 40.9 N | far beyond |
  | −8 ± 8i | 64.0 | 68.9 N | far beyond |

  The limit is crossed at σ = √(20 − 4.905) = **3.885**. The measured sim peak equals 4.905 + σ² to 1e−6 (`ch08-numbers.test.ts:176`).
- Rest of limits#4 stays ("The orange thrust flattens…"), with the overshoot claim fixed (§8, §3d).

##### P5 `budget`: a thrust budget is a circle (side trip S6 in limits)

> "For a {scrub|dr} m step, the first push stays under 20 N only if the poles sit within {calc|r} of 0, in any direction."

- inputs: `dr` discrete [0.25, 0.5, 1, 2], initial 1, unit m.
- output: `r` = fmt(√((20 − 4.905)/(0.5·dr)), 2).
- Values: dr 1 → **5.49**, 0.5 → 7.77, 2 → 3.89, 0.25 → 10.99.
- Angle-independence verified: poles at radius 5.4945 at 45°, 60° and 11.5° from the real axis all ask for 20.000 N (`ch08-plays.test.ts:42-53`). This makes the circle a real, drawable guide in the playground (§6).

##### P6 `zeroKick`: why a zero near 0 kicks (zeros section, replaces the first sentence of zeros#4)

> "With the zero at −{scrub|z}, the output is the no-zero curve **plus {calc|gain} × its slope**, and it overshoots by {calc|os} (12 % without the zero)."

- inputs: `z` discrete [0.3, 0.5, 1, 2, 3, 5, 8, 12], initial 3.
- outputs: `gain` = fmt(1/z, 2); `os` from a table keyed by z (pure numbers, tested).
- Values:

  | zero at | gain | overshoot |
  | --- | --- | --- |
  | −0.3 | 3.33 | 569 % |
  | −0.5 | 2.00 | 321 % |
  | −1 | 1.00 | 138 % |
  | −2 | 0.50 | 53 % |
  | −3 (initial) | 0.33 | 30 % (29.8) |
  | −5 | 0.20 | 18 % |
  | −8 | 0.13 | 14 % |
  | −12 | 0.08 | 13 % |

  No zero: 12.3 %. The identity y = y₀ + y₀′/|z| is verified numerically (`ch08-plays.test.ts:54-61`).

#### 5. Side trips

##### S1 "Where the recipe comes from" (recipe section, after the math block recipe#1)
- Proves: G(s) follows from Ch 7's slope rule, and "starting at zero" is what kills the f(0) terms.
- Formula:
  ```tex
  m\,\Delta\out{h}'' + c\,\Delta\out{h}' = \eff{K_p}\,(\Delta\sp{r} - \Delta\out{h})
  \;\xrightarrow{\ \Delta h(0)=0,\ \Delta h'(0)=0\ }\;
  (m s^2 + c s + \eff{K_p})\,\Delta\out{H} = \eff{K_p}\,\Delta\sp{R}
  ```
- Prose: "Hover thrust cancels gravity, so only the *changes* are left: $m\,\Delta h'' + c\,\Delta h' = K_p(\Delta r - \Delta h)$. Now use Chapter 7's rule: every slope becomes × s, minus the starting value. Theo: 'Last time I forgot those starting values and the formula lied.' Mika: 'This time they really are zero. We measure from the hover, where nothing has changed yet.' Collect $\Delta H$ on one side and divide. That's G(s)."

##### S2 "Why poles are the motions" (poles section, after poles#0)
- Proves: each pole p contributes exactly one e^{pt} to the output. This is Ch 7's "screams at s = a" run backwards.
- Formula:
  ```tex
  \Delta\out{H}(s) = G(s)\cdot\frac{1}{s} = \frac{A}{s} + \frac{B}{s-p} + \frac{\bar B}{s-\bar p}
  \;\Longrightarrow\; \Delta\out{h}(t) = A + B e^{pt} + \bar B e^{\bar p t}
  ```
- Prose: "In Chapter 7 the transform of $e^{at}$ screamed at $s = a$. Read that backwards: wherever a transform screams, a motion $e^{at}$ is hiding. Split the step response into pieces with partial fractions: the step's own pole at 0 gives the final height A, and each pole of G gives one $e^{pt}$. June: 'So the poles are Chapter 6's modes, sitting on the map.'"

##### S3 "Why the angle sets the overshoot" (poles section, after the playground list; holds P1)
- Proves: OS = e^{−π|σ|/ω} = e^{−πζ/√(1−ζ²)}, the peak comes at half a wiggle, and ζ = cos θ.
- Formula:
  ```tex
  t_{\text{peak}} = \frac{\pi}{\omega}, \qquad
  \text{overshoot} = e^{-|\sigma|\,t_{\text{peak}}} = e^{-\pi|\sigma|/\omega} = e^{-\pi\zeta/\sqrt{1-\zeta^2}}, \qquad \zeta = \cos\theta
  ```
- Prose: "The drone passes the target and turns round after half a wiggle, at $t = \pi/\omega$. By then the shrinking $e^{-|\sigma| t}$ has already worked for that long, and what's left is the overshoot. Only the ratio $|\sigma|/\omega$ matters, and that ratio is the *angle* of the pole. From Chapter 6's circle, the cosine of that angle is ζ. Theo: 'So every ray from 0 is one ζ, and one overshoot.'" (+ P1)

##### S4 "How good is 4/σ?" (poles section, after S3; no playable, a small table)
- Proves: the rule is an envelope estimate, good to about ±16 % for ζ between 0.3 and 0.9. It is 25 % too pessimistic at ζ = 0.8 and **46 % too optimistic at ζ = 1** (the double pole).
- Formula: `e^{-\sigma t} = 0.02 \Rightarrow t = \ln 50/\sigma \approx 3.9/\sigma`
- Prose: "Four is Chapter 6's ln 50 ≈ 3.9, rounded: the time for the *envelope* to shrink to 2 %. The real curve sits inside the envelope, so it often settles a bit sooner. It settles later when the poles sit right on the real axis, because a double pole has a $t\,e^{-\sigma t}$ part that lingers. Mika tried σ = 1: the rule said 4 s. The measured times ran from 3.0 s to 5.8 s depending on ζ." Table (σ = 1, 2 % band), from `ch08-numbers.test.ts:74-87`:

  | ζ | 0.1 | 0.2 | 0.3 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 0.95 | 1 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | real σ·Ts | 3.84 | 3.92 | 3.37 | 4.04 | 3.57 | 4.19 | 3.01 | 4.23 | 5.00 | 5.83 |
  | error vs 4 | −4 % | −2 % | −16 % | +1 % | −11 % | +5 % | −25 % | +6 % | +25 % | +46 % |

##### S5 "What a zero blocks" (zeros section, after the widget)
- Proves: the outline's "a zero is a frequency the system blocks". Feed the system e^{zt} (for the zero at −3, the input e^{−3t}) and the output has **no** e^{−3t} part, only the poles' own motion.
- Formula:
  ```tex
  G(s) = \tfrac{13}{3}\,\frac{s+3}{s^2+4s+13},\quad u = e^{-3t}:\quad
  Y(s) = \tfrac{13}{3}\,\frac{\cancel{s+3}}{(s^2+4s+13)\,\cancel{(s+3)}} \;\Rightarrow\; y = \tfrac{13}{9}\,e^{-2t}\sin 3t
  ```
  (verified against RK4 to 1e−8, `ch08-numbers.test.ts:153-160`)
- Prose: "A pole is a motion the system *makes*; a zero is a motion it *refuses to pass on*. Feed this system exactly $e^{-3t}$ and none of it comes out: only the system's own wiggle, which dies away. Without the zero, 1.3 × $e^{-3t}$ would come straight through. June: 'Like noise-cancelling headphones for one particular hum.'"

##### S6 "A thrust budget is a circle" (limits section, after the limit widget; holds P5)
- Proves: the first push is mg + m|p|²·Δr, so for a given step the allowed poles fill a circle around 0. Poles far left along *any* ray cost thrust as the square of their distance.
- Formula: `T(0^+) = mg + \eff{K_p}\,\Delta r = mg + m\,|p|^2\,\Delta r \le 20\ \text{N} \;\Rightarrow\; |p| \le \sqrt{\tfrac{20 - mg}{m\,\Delta r}}`
- Prose: "At the very first instant the drone hasn't moved, so only Kp pushes, and Kp = m|p|². Double the distance from 0 and you need four times the push. For a 1 m step our motors allow poles out to 5.5 from 0. Ask for a 2 m step and the circle shrinks to 3.9." (+ P5)

#### 6. Widget polish

##### `recipe`
- **Label collision:** the "target" label is drawn under the drone at 2 m (`1280-light-recipe.png`, "targe…"). This is a shared `DroneView` issue; the same happens in the playground. Move the label to the left of the axis or above the line when the drone is within ±0.3 m. Owner: `src/ui/drone-view.ts`.
- **Notation:** keep ΔH/ΔR here, and change the playground's `\frac{\out{H}(s)}{\sp{R}(s)}` (`widgets.ts:319`) to `\frac{\Delta\out{H}(s)}{\Delta\sp{R}(s)}` so the two widgets agree.
- **Linked representation:** show the input's time formula next to its transform in the equation's underbrace. For example, `\underbrace{\tfrac1s - \tfrac1{s+2}}_{2 - e^{-2t}\ \to\ \Delta R(s)}`. The reader sees the Ch 7 table working.
- **Readout for the wave** (a Ch 10 teaser, optional): the output amplitude **0.55 m** for a 0.5 m wave (|G(2i)| = 20/|18 + 2i| = 1.104, measured 0.5522). Status: "The recipe turns a 0.50 m wave into a 0.55 m wave." (Low.)
- **Page physics (rule 7):** the step peaks at **2.60 m** (60.5 % overshoot), inside the 3 m picture, and the gentle step at 2.03 m. The drone never leaves its picture, so no page physics. Correct as is.

##### `playground` (centrepiece)
1. **The challenge zone contradicts the challenge status.**
   - The zone (`widgets.ts:232-246`) is σ > 2 ∧ ζ > 0.591, i.e. the rules of thumb. The status (`:344-350`) uses the *measured* metrics.
   - On a 0.1 grid, **93 points inside the zone fail**, and **16 outside pass**.
   - Example inside: (−2.1, 0) has readout "≈ 1.9 s", true 2.79 s → "Not yet".
   - Example outside: −1.6 ± 1.2i settles in 1.89 s with 1.5 % overshoot (`ch08-numbers.test.ts:104-123`).
   - Fix: draw the zone from the real criterion. Precompute a contour of {OS < 10 %, Ts < 2 s} on a grid; this is a pure function, so it can be tested. Also add a second readout "settles (measured)" next to "settles (≈4/σ)", so the rule and reality are both on screen. (High/M)
2. **Missing readouts that tie back to Ch 6:**
   - ζ (shown on screen, not only in the SR text) and ωn = |p|;
   - draw the ωn circle through the pole (Ch 6 already draws it);
   - label the rays "ζ = 0.2 · 53 %" instead of the bare "53 %".
3. **Hard-coded visible strings and numbers:** `'4 s', '2 s', '1 s'` and `'53%', '16%', '5%'` (`widgets.ts:148-173`) bypass `fmt()` and the locales (fr should read "53 %", and so on). Build them as `fmt(4/σ, 0)` + `tc('units.s')` and `fmt(osz(z), 0)` + a locale percent template.
4. **First-push thrust readout** (orange, red above 20 N): value mg + Kp.
   - The default −1 ± 6.24i already asks for **24.9 N**, above the limit. That sets up June's misconception *before* the limits section.
   - Proposed label: `"push": "first push (1 m step)"`. Proposed status suffix when > 20 N: `"pushWarn": "Real motors stop at 20 N. We'll see what that costs in a moment."`
   - Draw P5's 5.49 circle as a faint orange "20 N budget" guide.
5. **Negative Kd:** readouts show −1.60 N·s/m (right half) and −0.50 (−0.5 ± 5i) with no word. Proposed status line, added when kd < 0: `"negKd": "Kd is negative here: the drag already damps more than these poles allow, so the controller has to push along with the motion."`
6. **Real axis:**
   - `im` is clamped ≥ 0 (`:129`). Moving onto the axis gives a *double* pole, and the readout shows "2.20" as if it were one pole. Proposed: `formatS` → "−2.20 (double)" (new key `double`).
   - Optional (L): let the drag continue *below* the axis to split the pair into two real poles, −σ ± δ (Ch 6's overdamped picture). The math is `gainsFromPoles` with the product/sum of two real roots: Kp = m·p₁p₂, c + Kd = −m(p₁ + p₂). This makes the dominant-pole idea playable in the centrepiece. The twin-mistake story still holds: off the axis they stay mirrored.
7. **The picture and the numbers disagree when the formula crashes without a page hit** (rule 2).
   - When the unstable formula goes below 0 m (e.g. 0.6 ± 3i at 1.76 s) and nothing was hit, the view shows "CRASH!" (`downThisCycle`, `:291-293`), but the plot keeps the formula below 0 (y-min −0.5), and the status says only "Right half: it blows up!".
   - Fix: treat the ground like the page. At the first h ≤ 0, cut the plot at the crash time (formula up to it, then 0) and append a status sentence. Proposed: `"verdict.hitGround": "It crashed into the ground. Move a pole to try again."`
   - Same "stays down until the replay restarts or the input changes" rule as `hitPage`.
8. **Reduced motion** (rule 10 and 2). `update()` (`:303-354`) never calls `view.update` when `!Loop.autoplay`. The recipe widget does (`:99`). The picture then shows stale state: `1280-light-reduced-motion-playground-rhp.png` shows "CRASH!" at 0.00 m while the plot flies off the top. Fix: in reduced motion, pin the drone to the state at T1, clipped to the picture, with the true readout.
9. **Page physics:**
   - Verified: the hit → `fallSim` handover works, the status composes verdict + hit, and the drone stays down past the 7 s replay (`1280-light-playground-rhp-9.5s.png`) ✓.
   - The unstable 0.6 ± 3i passes 3 m at 0.69 s and 6 m at 2.82 s, so it always reaches the page (rule 7 satisfied; stable responses peak ≤ 2.96 m inside the 3 m picture).
   - One wording edge: a *marginal* pair peaks at 3.0 m and could touch a low ceiling, giving "Right on the axis: it swings forever. It flew out of its picture…". Give the marginal verdict its own hit sentence: `"hitPageMarginal": "Each swing reached 3 m, just enough to touch the page; the motors stalled and it fell."`
10. **Keyboard:** arrows move by 0.1 from 6.245, leaving "0.60 ± 3.05i". Snap to the step grid on the first key press so values read cleanly. The role is `button` with arrow semantics; that belongs to the shared `SPlane` owner, so note it there (consider `aria-roledescription` + instructions in `aria-describedby`).
11. **375 px:**
    - The s-plane labels are ~7 px (`375-light-playground.png`). Scale the guide-label font with the plane width (min 11 px), and drop the "settles ≈" prefix below 480 px (keep "1 s", "2 s", "4 s").
    - Put the five readouts in a 2-column grid under the plot; this cuts ~300 px of height.
12. **Colour:** the "one wiggle" guide is output-blue (`ch08.css:11-14`). Acceptable (it is a property of the output), but it competes with the step curve. Consider pencil/ink-3 with a blue label only.

##### `zero`
1. **Clipping:** the y-axis max of 2.5 (`widgets.ts:403`) clips every zero at or right of **−0.93**. At −0.3 the peak is **6.69** while the readout says 568.8 % (`1280-light-zero-near-origin.png`). Fix: animate the y-max to max(2.5, 1.1 × peak), or cap the zero at −1 (peak 2.38). The readout and the curve must agree.
2. **Linked explanation:** draw the slope term (1/|z|)·y₀′ as a faint dotted third curve labelled `"slope": "+ {g} × its slope"`, so "no zero + slope part = with zero" is visible. This is P6 in picture form.
3. **Status lines** could say why. Proposed:
   - `near`: "Near the origin: the slope part is {g} times the old slope, so the start kicks hard.";
   - `mid`: "A moderate kick: {g} × the slope.";
   - `far`: "Far away: only {g} × the slope. It hardly shows."
4. **Equation:** `T(s) = \frac{13}{3.00}…`. Rename to G(s) (or explain T), and format with trimmed decimals (`fmt(-z, z % 1 ? 1 : 0)`). Add the text "(scaled so it still ends at 1)".
5. **Keyboard:** the help says ← →. Also accept Home/End for the ends of the range (low).
6. At 375 the tick labels are ~6 px (`375-dark-zero.png`); same fix as the playground.

##### `limit`
1. **Label collision:** "motors can't pull down" sits on the orange thrust curve at every width (`1280-light-limit.png`, `375-dark-limit.png`). In German the label spans the whole plot (`375-light-de-limit.png`). Place it below the 0 line (inside the −40…0 band, which is otherwise empty), left-aligned.
2. **Ticks:** the thrust axis shows only 0 and 50. Add a 20 tick (custom ticks [−20, 0, 20, 50, 80]).
3. **Wrong claim in the prose** (limits#4): "it overshoots *more* than it would with gentler poles" holds only for σ ≥ 6.25. Measured real overshoot:

   | σ | 2–4 | 5 | 6 | 6.25 | 7 | 8 |
   | --- | --- | --- | --- | --- | --- | --- |
   | real overshoot | 4.32 % | 4.26 % | 4.10 % | 4.49 % | 8.60 % | 16.0 % |

   (`ch08-extra.test.ts:16-19`). Add an "overshoot (real)" readout, and change the sentence (§3d).
4. **The best number the widget hides:**
   - Real settling improves only up to σ ≈ 6.5 (**0.718 s**), then gets *worse*: 0.768 s at σ = 8. The maths promises 0.528 s there.
   - That is the June lesson in one number. Proposed status (capped case): `"capped": "The maths wants {p} N; the motors stop at 20 N. Real settling {s} s, and no amount of 'further left' gets it under about 0.72 s."`
   - Keep the numbers computed from the sim, not hard-coded.
5. **Floor limit:** the ideal thrust dips below 0 N only from σ ≈ 5.9 (−0.32 N at σ = 6, −5.3 N at σ = 8). Say so in the prose ("and past about −6 ± 6i it even wants to pull the drone *down*, which propellers can't").
6. **Linked representation:** a small non-draggable s-plane showing the pair sliding along the 45° ray with P5's 20 N circle (radius 5.49). The slider's "−2.0 ± 2.0i" becomes a picture. (Medium/M)
7. The toggle sits in a large empty band (`.fix-row`); tighten it or put the toggle on the slider row at ≥ 768 px.
8. **Page physics (rule 7):** there is no drone view, and the real peak is 2.16 m at σ = 8. Not applicable.

#### 7. Pedagogy checklist

| Item | Status | Note |
| --- | --- | --- |
| Driving question | present | "Can we read a system's whole personality off one fraction?" Answered implicitly; the recap should answer it explicitly. |
| Feel-it interactive first | weak | `recipe` is a watch-and-choose widget. The feel-it centrepiece comes after the formulas. Acceptable, since G has to exist before it can be dragged. |
| Gated predict-then-reveal | present / weak | `ch8-rhp` ✓. The outline's second predict ("Move poles straight up. What changes?") is missing. It is the cleanest test of "σ = settling, ω = wiggle". |
| One idea per section | weak | `poles` carries poles, Kd, the playground, four rules, the twin mistake and the Ch 2 callback. `limits` is fine. Split "reading the map" (rules + dominant pole) from "poles" (§3b/c). |
| Misconception + on-page mistake | present | Mika's twins (she drags; it copies) ✓. June's "further left" ✓, but she only *says* it. Make her do it: she drags to σ = 8 in `limit`, then reads 0.77 s real vs 0.72 s at σ = 6.5. |
| Recap | present | Add "one fraction = the recipe; poles = modes; the rules of thumb and when they're rough". |
| 2–4 quiz items, why for every option | present | 4 items, all whys ✓. Issues: q3's why overstates "same settling time"; q2's why uses `c` (clashes with drag c); q4 repeats the predict card; the outline's dominant-pole item is missing. |
| Concept-map nodes | present | 4 nodes. Missing edges: `mode → poles`, `wnzeta → poles`. Consider a `limits` node ("motor limits / saturation") that Ch 9's anti-windup can connect to. |
| Cliffhanger | present | Good. Matches the outline. |

**Proposed fixes**

1. New gated predict `ch8-up` (poles section, after the playground list):
   - q: "Keep σ = 2 and slide the poles **straight up**, from ±4i to ±8i. What changes?"
   - (a) "It settles twice as fast". Why: "Settling follows the shrink rate σ, which didn't move. Measured: 1.87 s → 1.72 s, nearly the same."
   - (b) "Faster wiggles and more overshoot; settling stays about the same" (correct). Why: "One wiggle drops from 1.57 s to 0.79 s, and the overshoot rises from 21 % to 46 %, but the envelope $e^{-2t}$ is unchanged, so settling stays near 4/2 = 2 s."
   - (c) "It becomes unstable". Why: "Only the left-right position decides that. Up and down never crosses into the right half."
   - Bus action: move the pole to −2 ± 8i.
   - Numbers from `ch08-plays.test.ts:62-65`: Ts 1.868 → 1.718 s, OS 20.79 → 45.59 %, periods 1.571 → 0.785 s.
2. Replace q4 (it duplicates the predict) with the outline's dominant-pole item `ch8-q4`:
   - q: "A system has real poles at −0.2 and −5. After two seconds, which one is still shaping the response?"
   - "The one at −0.2, near the axis" (correct). Why: "$e^{-0.2t}$ is still at 67 % after 2 s; $e^{-5t}$ is down to 0.005 %. The slow pole is in charge, so settling takes about 4/0.2 = 20 s."
   - "The one at −5, further left". Why: "Further left means it dies *faster*. After just 1 s it's below 1 % of its start (0.67 %)."
   - "Both equally". Why: "One shrinks 25 times faster than the other (5 ÷ 0.2). After half a second the fast one is at 8 %, the slow one still at 90 %."
3. q3's correct why: "Same distance from the axis keeps the *envelope* the same, so settling stays about the same (the 4/σ rule; it's rough near the real axis). A smaller angle from the real axis means more damping, so less overshoot."
4. q2's second why: "Sign slip. For $s^2 + bs + q$ the real part is $-b/2 = -1$, which is in the left half."
5. Optional replacement for q1 (or a fifth item if the team allows it): a thrust question tying to P4.
   - q: "For a 1 m step, poles at −3 ± 3i ask for 13.9 N at the start. What do −6 ± 6i ask for?"
   - "40.9 N" (correct). Why: "Kp = m(σ²+ω²) grows with the *square* of the distance: twice as far, four times the Kp (9 → 36 N/m), plus 4.9 N of hover."
   - "27.8 N". Why: "Doubling the thrust assumes Kp grows in step with the distance. It grows with its square."
   - "13.9 N". Why: "The start doesn't depend only on the angle; distance from 0 costs thrust."

#### 8. Numerical claims (verified)

Test files: `N` = `$SCRATCH/checks/ch08-numbers.test.ts`, `E` = `ch08-extra.test.ts`, `P` = `ch08-plays.test.ts`, `D` = `ch08-pderr.test.ts`. All pass.

| Claim | Expected value | Method (test file + line) | Result |
| --- | --- | --- | --- |
| hover base thrust "4.9 N" | 4.905 N | HOVER_THRUST = 0.5·9.81 | ✓ |
| "about four times the drone's weight" | 20/4.905 = 4.08 | arithmetic | ✓ |
| default poles "−1 ± 6.24i" = Kp 20, Kd 0 | √39 = 6.2450 → "6.24"; Kp 20, Kd 0 | N:17-27 `gainsFromPoles` + roots | ✓ |
| Kp = m(σ²+ω²), c+Kd = 2mσ | −2±4i → 10, 1; −8±8i → 64, 7; −4±2i → 10, 3; −0.5±5i → 12.625, −0.5; −1±3i → 5, 0 | N:17-27 | ✓ |
| ζ = cos θ, ωn = \|p\| | default ζ 0.158, ωn 6.325; −2±4i ζ 0.447, ωn 4.472 | N:28-34 | ✓ |
| analytic step = DroneSim RK4 | max error < 1e−6 m for −2±4i, −1±6.245i, −3 (double), −0.5±5i, 0.4±3i (1.5 s); real pair −0.2/−5 over 30 s | N:36-53 | ✓ |
| OS = e^{−π\|σ\|/ω} and first peak at π/ω | −2±4i: 20.79 %, 0.785 s; −1±3i: 35.09 %, 1.047 s; default: 60.47 %, 0.503 s; −3±2i: 0.90 %; −0.5±5i: 73.04 %, 0.628 s | N:55-66 (measured on a 0.5 ms grid) | ✓ |
| ray labels 53 / 16 / 5 % | ζ 0.2 → 52.66; 0.5 → 16.30; 0.7 → 4.60 (0.707 → 4.33) | N:67-68 | ✓ (rounded) |
| challenge "overshoot < 10 %" ⇔ ζ > 0.591 | OS(0.5912) = 9.997 % | N:69 | ✓ |
| rule 2 % settling ≈ 4/σ (σ = 1) | real σ·Ts: 0.05 → 3.80; 0.1 → 3.84; 0.16 → 3.70; 0.2 → 3.92; 0.3 → 3.37; 0.4 → 3.36; 0.5 → 4.04; 0.6 → 3.57; 0.7 → 4.19; 0.75 → 4.31; 0.8 → 3.01; 0.85 → 3.56; 0.9 → 4.23; 0.95 → 5.00; 0.99 → 5.66; 1.0 → 5.83 | N:74-87 | **rule only approximate**: −25 % … +46 %, worst at ζ = 1 (double pole 5.834/σ); non-monotonic in ζ |
| envelope: e^{−σt} = 2 % at ln 50/σ | 3.912/σ | N:86 | ✓ |
| q1: settling "≈ 4 s / 1 s / 8 s" (rule) | real 3.736 / 1.038 / 7.646 s; ranking unchanged | N:91-95 | ✓ (rule), ranking ✓ |
| q2: s²+2s+10 → −1 ± 3i | −1 ± 3i | N:203-206 | ✓ |
| q3: "same σ → same settling time" | σ = 2: ω 8 → 1.718 s; 4 → 1.868; 2 → 2.109; 1 → 2.075; 0.5 → 2.664; 0 → 2.917 | N:88-90 | **overstated**: −8 % … +56 % |
| q3: shrinking ω lowers overshoot | σ = 2: ω 4 → 20.79 %, 2 → 4.32 %, 1 → 0.19 %, 0 → 0 | N:88-90 | ✓ |
| playground default readout "≈ 4.0 s" | real 3.659 s; OS 60.47 %; peak 2.605 m; one wiggle 1.006 s ("1.01") | N:96-101 | readout is the rule (8.5 % high) |
| challenge zone vs challenge test | 93 grid points in the zone fail, 16 outside pass; (−2.1, 0): Ts 2.79 s vs readout 1.90; (−2.1, 1): 2.04 s; (−1.6, 1.2): 1.89 s, OS 1.5 % (outside the zone, passes) | N:104-123 (widget sampling 0.015 s over 6 s) | **inconsistent** |
| recipe: step peak | 2.6047 m (= 2 + e^{−π/√39}) | N:192-201 | ✓ |
| recipe: gentle step "smaller bounce" | peak 2.0255 m (2.6 %) | N:192-201 | ✓ |
| recipe: wave | output amplitude 0.5522 m = 0.5·\|G(2i)\| (1.104) | N:192-201 | ✓ |
| zero widget: OS without zero | 12.31 % (e^{−2π/3}) | N:145-151 | ✓ ("12.3 %") |
| zero: OS with zero | −0.3 → 568.8; −0.5 → 320.7; −0.8 → 182.7; −1 → 137.5; −1.5 → 79.4; −2 → 52.6; −3 → 29.8; −5 → 17.6; −8 → 14.1; −12 → 13.0 % | N:145-152 | ✓; ordering claim ✓ |
| zero: y = y₀ + y₀′/\|z\| | agreement to 1e−6 at t = 0.2, 0.5, 1 | P:54-61 | ✓ |
| zero plot clipping (y-max 2.5) | clipped for z ≥ −0.93; peak at −0.3 = 6.688; at −1.5 = 1.794 | E:20-27 | **clips** |
| zero at −3 blocks e^{−3t} | output = (13/9)e^{−2t} sin 3t (RK4 error < 1e−8); without the zero, gain at s = −3 is 1.3 | N:153-161 | ✓ |
| PD on the error puts a zero at −Kp/Kd | poles −2 ± 3i ⇒ Kp 6.5, Kd 1, zero −6.5; sim vs formula < 0.02 m; OS 15.2 % | D:5-20 | ✓ |
| peak ideal thrust on the 45° line | 4.905 + σ²: σ 1 → 5.91; 2 → 8.91; 3 → 13.91; 4 → 20.91; 5 → 29.91; 6 → 40.91; 7 → 53.91; 8 → 68.91 N | N:172-184 | ✓ ("50, 60, 70": 54 N at σ = 7, 69 N at σ = 8) |
| limit first reached | σ = √(20 − 4.905) = 3.885 | N:179 | ✓ |
| ideal thrust goes negative | from σ ≈ 5.9 (−0.32 N at σ = 6, −5.30 at σ = 8) | E:16-19 | new |
| "overshoots more than gentler poles" (saturated) | real OS: σ ≤ 4 → 4.32; 5 → 4.26; 6 → 4.10; 6.25 → 4.49; 6.5 → 5.44; 7 → 8.60; 8 → 16.03 % | E:16-19 | **true only for σ ≥ 6.25** |
| saturated settling | real: σ 4 → 1.055; 5 → 0.859; 6 → 0.739; 6.5 → 0.718 (best); 7 → 0.727; 8 → 0.768 s; ideal at 8 → 0.528 s | E:16-19 | new (sweet spot) |
| widget "settles (maths)" at σ = 1 | not within 3 s (rule 4 s) → "—" | N:172 (TsI NaN) | ✓ (shows "—") |
| Kp = 20 P drone with the 20 N limit | saturated 0.133 s; OS 60.47 % → **74.95 %**; Ts 3.66 → 3.95 s | P:25-32 | new (matters for Ch 9) |
| P1 at −2 ± 4i | ts 2.0 s (real 1.87), period 1.571 s, tp 0.785 s, os 20.79 % | P:10-16, N:96-101 | ✓ |
| P1 straight up −2 ± 8i (predict `ch8-up`) | tp 0.393 s, OS 45.59 %, Ts 1.718 s, period 0.785 s | P:10-16, 62-65 | ✓ |
| P2 first push = mg + Kp | −2±4i 14.905; default 24.905; 0.6±3i 9.585 (Kp 4.68, Kd −1.6); −4±2i 14.905; −0.5±5i 17.53 N | P:17-24 | ✓ |
| P3 dominant −0.2 / −5 | fast/slow left: t 0.5 → 8.21 % / 90.5 %; 1 → 0.674 % / 81.9 %; 2 → 0.00454 % / 67.0 %; 5 → 1.4e−9 % / 36.8 % | P:33-41, N:125-143 | ✓ |
| P3 settling | pair 19.76 s; rule 20 s; slow pole alone 19.56 s; fast alone 0.782 s; one-pole approximation max error 0.035 | N:125-143, P:39-40 | ✓ |
| P3 drone gains | Kp 0.5 N/m, c+Kd 2.6, Kd 1.6 | N:25 | ✓ |
| P5 thrust circle radius | Δr 1 → 5.4945; 0.5 → 7.7705; 2 → 3.8852; 0.25 → 10.989 | P:42-53 | ✓ |
| P5 angle independence | radius 5.4945 at 45°, 60°, 11.5° → first push 20.000 N | P:42-53 | ✓ |
| unstable 0.6 ± 3i reaches the page | > 3 m at 0.69 s, > 6 m at 2.82 s; below 0 at 1.76 s (formula) | E:29-35 | ✓ (rule 7 satisfied) |
| stable responses stay in a 3 m picture | peak ≤ 2.96 m (−0.1 ± 8i) | E:29-35 | ✓ |
| predict move 0.6 ± 3i gains | Kp 4.68, Kd −1.6 | E:28 | ✓ |

---

## Phase 4 — Chapter 9: PID: Fixing Everything (`0.8.0`)

### At a glance
1. **The kick widget doesn't show the kick in its number.** "peak thrust" reads **20.0 N** when D
   works on the error and **19.9 N** when it works on the measurement. P alone already asks for
   Kp·Δr + mg = 15 + 4.9 = 19.9 N. The requested spike is **413 N**, but the motors clip it to
   20 N for 50 ms, and the kick run even peaks *lower* (2.115 m vs 2.137 m). Fix: a 1 → 1.5 m jump
   (20 N vs 12.4 N), or also show the requested thrust.
2. **Two status lines give wrong advice.** The damper widget says "Stable, but bouncy. Add more Kd."
   But at Ki = 10 more D makes the overshoot *worse* past Kd ≈ 5 (0.4 % → 2.3 % → 5.4 % → 7.9 % at
   Kd = 5, 6, 8, 10). At Ki = 50 it never drops below 24 %. The integral widget says "shrinking,
   but slowly" for Ki = 30–38. Those drones are stable but still ringing (±7–19 cm at 8–12 s).
3. The noise widget's calm status is false: "The little jitter left comes from the P term". At the
   longest filter (0.2 s), D still gives Kd·σ/τf = 0.4 N, while P gives 0.3 N (sim: 0.67 N total vs
   0.29 N with P only).
4. **ζ is never carried over from Ch 6.** The chapter says "drag c + Kd" but never writes
   ζ = (c+Kd)/(2√(m Kp)). Kd = 4 gives ζ = 0.79, and critical damping is Kd = 5.32.
5. **The integral is tied to Ch 3's area in words only.** The climb to exactly mg = 4.9 N is never
   given a number. There is a clean Ch 3 bridge: stuck at the 24.5 cm droop, the pile first adds
   Ki·mg/Kp N/s, so its tangent reaches 4.9 N at **τ = Kp/Ki = 2 s**. The real climb is
   63 % at 1.96 s and 98 % at 7.7 s, which is Ch 3's τ ruler. At the end the net red area is
   **mg/Ki = 0.49 m·s**.
6. **The closed-loop cubic is re-derived from the ODE with "guess e^{st}".** Ch 7/8's transfer
   function is not used (I = ÷s, mirroring Ch 7's d/dt = ×s). **Routh–Hurwitz** is only stated; the
   iω crossing *is* derived, which is good. The "stable side" argument is missing.
7. The poles widget reports the "slowest pole σ = −0.54" at the defaults (20/10/2). By Ch 8's 4/|σ|
   rule the step should take 7.4 s, but it settles in 2.7 s: the PI zero at −Ki/Kp = −0.5 nearly
   cancels that pole. It also overshoots 28.7 %, and still 13 % with Kd = 4 (ζ_PD = 0.79). Nothing
   on the page explains this.
8. Accessibility: the damper switch's accessible name is **"Mika's big = 50"** (Ki is lost), and the
   poles/playground sliders are named "K_p", "K_i", "K_d".
9. The playground height plot is fixed at 0–3 m, so the page-bump flight (peak ≈ 3.9–4 m) leaves the
   top of the plot exactly when it matters.

---

### The phase

Same seven sections. Each gets its missing numbers, the Ch 3 / 6 / 7 / 8 bridges, and honest status
lines. All text in 10 locales in the same commit; `ch09.test.ts` gets every number below.

#### 4a. `stuck`: put the droop on the page — Impact M, Size S
- Block 1 gains: "With $K_p$ = 20 N/m that's $\err e$ = 4.9/20 ≈ 24.5 cm, forever."
- **Tests:** 4.905 N; 0.245 m.
- **Testable outcome:** the droop number appears before the first widget.

#### 4b. `integral`: the pile in numbers, the Ch 3 τ — Impact H, Size M
- Math block 1: `\int_0^t \err e\,dt` (drop the τ dummy variable).
- `play` **P1 `pile`** after block 2; side trip **S1** after it.
- `play` **P2 `area`** in the widget lead-in (block 6).
- Theo's "below about 40" line gains: "(and the yo-yo takes about one second per swing)", which
  links to P4.
- Widget: new `status.ringing`; default Ki 10, or a "start from the droop" toggle; "net area"
  readout.
- **Tests:** rate 2.45 N/s, τ 2.0 s, 63 % at 1.96 ± 0.1 s, 98 % in [7.4, 8.0] s; area 0.49 m·s;
  Ki 30 and 38 get `ringing`, not `slow`; Ki 10 gets `gone`.
- **Testable outcome:** a reader can say how long the droop takes to die at Ki = 10 (≈ 8 s) and
  why (Ch 3's τ = Kp/Ki).

#### 4c. `derivative`: ζ comes back, and too much D — Impact H, Size M
- `play` **P3 `zeta`** after block 3.
- Block 6 wording: "…it still overshoots by **at least** a quarter…".
- New June mistake (§7) after block 6, with Theo's Kd_crit = 5.3 line.
- Widget: ζ readout; `status.tooMuch` and `status.bigPile`; accessible name fix for the switch.
- **Tests:** ζ at Kd 0/2/3/4/5 = 0.16/0.47/0.63/0.79/0.95; Kd_crit 5.32; Ki 10 overshoot 5.35 % at
  Kd 8 and 7.88 % at Kd 10; Ki 50 minimum 24.4 %; the status picks `tooMuch` at 20/10/8.
- **Testable outcome:** no Kd setting in the damper widget gives advice that makes things worse.

#### 4d. `poles`: derive, then justify Routh — Impact H, Size M
- One aligned math block for the slope step (Kp ė = −Kp ḣ, d/dt Ki∫e = Ki(r−h), −Kd ḧ), plus
  "h⃛: the slope of the slope of the slope", plus "slope and area undo each other (Chapter 3)".
- Side trip **S2** "I is a divide-by-s" after the cubic.
- Write the two iω equations explicitly.
- Side trip **S3** "Why below the line is the safe side" replaces poles #11.
- `play` **P4 `cliff`** replaces block 12, emitting `play:cliff` to the widget.
- After the widget: side trip **S4** (the PI zero); the widget draws the ○ at −Ki/Kp and adds a
  step overshoot/settling readout plus the "nearly cancels" clause.
- A11y: plain slider labels; 375 px tick thinning.
- **Tests:** P4 initial 40 / 6.32 / 0.99; kd 4 → 200; kd 0.5 → 60; kp 10, kd 1 → 40 with poles
  ±4.472i and −4; linear-sim growth ratio < 0.5 at 0.95·edge and > 2 at 1.05·edge for five (Kp, Kd)
  pairs; defaults 20/10/2: σ −0.54, settle 2.71 s, overshoot 28.7 %; 20/10/4 overshoot 13.1 %.
- **Testable outcome:** a reader can explain why 40 is the edge without the word "Routh", and why
  the slow pole doesn't make the step slow.

#### 4e. `playground`: plot range, droop wording, windup number — Impact M, Size S (M with the pole plot)
- The height plot range grows to fit the bump (4.5 m when `hitAt !== null`).
- `neverDroop` key: "never (droops)".
- Windup note gains: "At $K_p$ = 20, $K_i$ = 20, $K_d$ = 4: 7 % overshoot with anti-windup, 17 %
  without." plus "a pinned motor has no room left to correct."
- Hint note gains the reason: "($K_d$ ≈ 4 is ζ ≈ 0.8, Chapter 6's sweet spot)".
- Optional: a mini s-plane in the playground (plan item).
- **Tests:** hint path stars [2, 3, 4, 4, 2]; windup 6.73 / 17.13 %; 30/60/2 peaks 2.77 / 4.05 m;
  peak thrust = 20 N at Kp ≥ 10 (documents why there's no peak-thrust star); no Ki = 0 flight
  above 3.41 m.
- **Testable outcome:** at 1280 px the bump flight's peak is visible on the plot. The recorded
  check (rule 11) at 1280/375, light and dark, covers bump, reset mid-flight, navigate away, and
  reduced motion.

#### 4f. `warnings`: make the kick and the noise countable — Impact H, Size M
- Kick: switch to 1 → 1.5 m (text "half a metre" in warnings #1 and the widget title) and/or add
  a "D asks for" readout (needs `command` in `Trace`). `play` **P5 `kick`** before the widget.
  The status adds the requested number.
- Noise: `play` **P6 `jitter`**; side trip **S5**; fix `status.calm` (new wording, §6); toggle
  label "about 2 cm"; add a Kd slider and a mean-height readout.
- **Tests:** 1 → 1.5 m: 20 N vs 12.41 N; requested spike 400–420 N; P6 values 0.8 / 4 / 16 N and
  sim 1.10 N at τ_f 0.1; jitter vs Kd 0.29/1.20/2.10/3.51/5.28 N; P-only 0.285 N; default
  clipping 55 % / 5 %, mean height 2.20 m.
- **Testable outcome:** the two modes of the kick widget differ by at least 5 N in their headline
  readout, and no status line makes a claim a test disproves.

#### 4g. `wrap` — Impact M, Size S
- Recap: add "the droop dies with a time constant of about Kp/Ki" and
  "ζ = (c+Kd)/(2√(mKp)); more D is not always better".
- Quiz: add `ch9-q5` (§7).
- Map: consider an edge `critical → derivativeaction`.
- **Tests:** q5 values 7.88 % / 53.7 % → 0 % / 0 %.

#### Shared building blocks
- Ch 6 `regime.*` strings, used by P3 → move to `common.json` (owner: story/i18n). Ch 10/11 could
  reuse them.
- `Trace.command` (requested, unclipped thrust) in `pid-tools.ts`. Ch 11 (motor lag, noise) would
  use it too. Owner: the Ch 9 tools, since Ch 11 imports them.
- Zero markers ○ in the `poles` widget use the existing `SPlane` kind `zero` (Ch 8 owner).
- A `plainText` aria-label for maths-in-toggle labels: `ui/controls.ts` `toggle()` should do this
  itself, like sliders do (shared owner). It affects every chapter with maths in a switch label.
- The play→widget bus (`play:<id>`) following already exists; P4 is the first Ch 9 consumer.

#### New glossary terms for translators
- *integral action / the pile*: the part of the controller that pushes in proportion to
  accumulated past error.
- *integrator time constant (τ_I ≈ Kp/Ki)*: how long the pile takes to get 63 % of the way to
  holding the weight.
- *Routh–Hurwitz criterion*: a coefficient test that tells whether all poles are in the left half.
- *derivative kick*: a thrust spike caused by differentiating a jumping error.
- *derivative on measurement*: taking D from the measured output instead of the error.
- *derivative filter / τ_f*: a first-order smoothing lag applied before differentiating.
- *integrator windup / anti-windup*: the pile growing while the motors are pinned, and the fix of
  pausing it.
- *motors pinned (saturated)*: the motor command sitting at 0 N or 20 N.
- *pole–zero cancellation (near)*: a zero close to a pole, so that mode barely shows.

#### Risks
- P1's τ = Kp/Ki is approximate. Keep Ki ≤ 12 and the word "about"; the test pins the tolerance.
- Changing the kick step to 1.5 m changes the prose ("jumps by a metre") and the quiz q4 why (no
  number there, OK) in all 10 locales.
- New status keys in 10 locales; `locales.test.ts` structure check.
- Anti-windup is on by default in *every* widget through `pid()` (`pid-tools.ts:17`), including
  the integral/damper story runs. Leave it that way, but say so in the windup note ("every drone so
  far had anti-windup on").
- S2 uses Ch 8 notation (G, C); check that Ch 8's letters match (Ch 8 uses G(s) = Kp/(ms² + cs +
  Kp) for the *closed* loop; here use P(s) = 1/(ms²+cs) and avoid calling it G).

#### Suggested commit order
1. `fix(ch09): kick widget shows the kick (1 → 1.5 m, requested-thrust readout)` + tests + 10 locales
2. `fix(ch09): honest status lines (integral ringing, damper too-much-D, noise calm)` + tests + locales
3. `fix(a11y): plain-text names for maths toggle labels and PID sliders`
4. `feat(ch09): plays model (pile, area, zeta, cliff, kick, jitter)` + registry + tests
5. `feat(ch09): integral section numbers and the Ch 3 time-constant side trip`
6. `feat(ch09): derivative ζ play and June's too-much-D mistake`
7. `feat(ch09): poles derivation steps, divide-by-s and safe-side side trips, PI zero on the map`
8. `feat(ch09): playground plot range, droop wording, windup numbers`
9. `feat(ch09): noise side trip, Kd slider, drift readout`
10. `feat(ch09): recap, q5, map edge`
11. `docs: update control-course-plan.md chapter 9 (targets, quiz 2, playground)`

### Evidence for this phase

*Reviewer notes. Research only, nothing in the repo was changed. All numbers below come from
`$SCRATCH/checks/ch09-numbers.test.ts` (22 tests, all passing:
`pnpm vitest run --root $SCRATCH/checks ch09-numbers`). Exploration logs are in
`$SCRATCH/checks/ch09-explore.log` and `ch09-explore2.log`. `$SCRATCH` =
`$SCRATCH`.*

#### 0. Snapshot

**Driving question:** "How do we kill the droop *and* stop the wiggle?"

**Sections in order**

| id | title | one line |
|---|---|---|
| `stuck` | The droop that won't die | P needs e = mg/Kp to push 4.9 N; June asks for "memory"; note: motors 0–20 N since Ch 8. |
| `integral` | I: a pile of past error | T_I = Ki∫e; the pile stops growing only at e = 0. Gated predict `ch9-bigki`, widget `integral`, Mika's Ki = 50 mistake, Theo finds the edge near 40, "lag makes things swing". |
| `derivative` | D: a virtual shock absorber | T_D = −Kd ḣ, drag becomes c + Kd; note on ė vs −ḣ; widget `damper`; I/D trade-off paragraph; Mika's "D predicts the future" and Theo's rebuttal. |
| `poles` | What each knob does to the poles | Loop ODE → differentiate → m h⃛ + (c+Kd)ḧ + Kp ḣ + Ki h = Ki r → cubic → Routh rule (stated) → iω crossing (derived) → numbers 40 / 200 → widget `poles` → 3-bullet list per knob. |
| `playground` | The tuning playground | Take-off to 2 m, four stars; aside hint; windup note with a toggle. |
| `warnings` | Two warnings about D | h3 kick → widget `kick` → "derivative on measurement"; h3 noise → widget `noise` → note on upward drift from clipping → Mika's resolution. |
| `wrap` | What we fixed | Recap (5), quiz (4), map, cliffhanger. |

**Widgets** (`src/chapters/ch09/widgets.ts`)

| id | shows | controls | readouts | notes |
|---|---|---|---|---|
| `integral` (l.33–66) | Take-off with Kp = 20, 12 s: drone, height + error fill, thrust + dashed Ki∫e + purple mg line | Ki 0–60 step 1 (default 0) | droop at 12 s, integral push | status: none / slow / gone / unstable(lim) |
| `damper` (l.69–98) | Take-off, Kp = 20, Ki = 10 or 50, 10 s | Kd 0–10 step 0.5, toggle "Mika's big Ki = 50" | total damping c+Kd, overshoot | status: unstable / bouncy / calm |
| `poles` (l.107–191) | s-plane with 3 poles and a trail, Ki–Kd mini-map with the edge line and a "you" dot, step 1.5 → 2 m (hoverStep, limited motors) | Kp 2–40, Ki 0–200, Kd 0–10 | status only (limit, slowest σ) | no transport, no ghost toggle |
| `playground` (l.194–269) | Take-off 6 s shown (scored on 15 s), page-ceiling bump | Kp 0–40, Ki 0–60, Kd 0–10, anti-windup toggle | overshoot, settling (2 %), droop, motors pinned | star row, verdict + hit sentence, targets help line |
| `kick` (l.272–293) | Hover at 1 m, jump to 2 m at t = 1 s, PID 15/8/4, τf = 0.01 | segmented: error / measured height | peak thrust | status per mode |
| `noise` (l.299–325) | Hover at 2 m, σ = 2 cm noise per 1 ms step, PID 15/8/4 | τf 0.005–0.2 s, noise toggle | thrust jitter (sd) | NOISY threshold 1.5 N |

**Predict card:** `ch9-bigki` (gated, 3 sketched options, every option has a why).
**Misconception:** Mika's "D predicts the future", resolved twice (Theo, then noise).
**Mistake:** Mika sets Ki = 50, gets a permanent ±26 cm yo-yo, and Theo finds the edge.
**Quiz:** 4 items (which term kills droop; what Kd guarantees; the largest Ki for Kp = 10, Kd = 1;
why D on measurement). Every option has a why.
**Map nodes (ch 9):** `integralaction` "I: kill the droop", `derivativeaction` "D: add damping",
`pid`, `noise` "noise & kick" (`src/story/concept-map.ts:60–63`). Edges come from sserror,
integral, derivative, wnzeta.
**Cliffhanger:** June's shower PID wiggles like Chapter 0: "What is it about delay?"

**Tests:** `ch09.test.ts` covers the Routh edges 40/200/60/40, pole-vs-Routh agreement, 2 poles at
Ki = 0, sim growth either side of 40, Mika's yo-yo 0.2–0.35 m plus the rescue at Kd = 0.5, >20 %
overshoot at 50/4, calm at Kd 3–5, the 12 s droop, playground stars, kick saturation and noise
thresholds. `page-ceiling.test.ts` checks that it's identical with no ceiling, that other widgets
never reach the page (3.3 m peak vs 3.9 / 4.4 m), the windup-off bump and recovery, repeated
contacts, and `sameCeiling`.
**Not tested:** the 0.5 m "half a metre" yo-yo figure as a peak-to-peak value, "about a quarter",
and any ζ value. There is also no test for status-line logic.

#### 1. Screenshots

31 PNGs in `$SCRATCH/shots/ch09/`. Viewport captures after scrolling each widget to the top, at
1280×1100 and 375×1100, light and dark, plus 4 full-page captures and 3 extra captures (a keyboard
tuning run and a page bump). Per-element captures came out blank at first (the headless element
clip), so these are viewport shots.

- `1280-light-integral.png`: at the default Ki = 0 the dashed "integral push" line sits on the
  x-axis and can't be seen, yet the prose says to watch it "climbing". The take-off overshoot to 3 m
  (52 %) takes up most of the picture, and the droop the section is about (24.5 cm) is a small tail.
- `1280-light-damper.png`: status "Stable, but bouncy. Add more Kd." at Kd = 0, fine. Readouts show
  c+Kd but not ζ. The toggle label reads "Mika's big Ki = 50", but its a11y name drops Ki (see §6).
- `1280-light-poles.png`, `375-dark-poles.png`: the slow real pole at −0.54 sits on the origin
  crosshair and reads as "a pole at 0". At 375 px the σ tick labels (−16 … 4) are tiny and crowd
  "−2" against the axis. The mini-map legend is red dashed ("bad"), which is the error colour.
  Acceptable as a "cliff", but note it. The step response shows a clear ~29 % overshoot at the
  defaults, and nothing explains it.
- `1280-light-playground.png`, `375-light-playground.png`: 0 of 4 stars at the defaults; "settling
  time: never" for a P-only drone that *does* settle, just 24.5 cm low. At 375 px, "motors
  pinned" wraps to its own row (fine), and the sliders sit ~450 px below the plots.
- `1280-light-playground-20-10-4-keyboard.png`: tuned by keyboard (arrow keys on Ki and Kd). Four
  stars, 0.0 % / 0.83 s / 0.0 cm / 0.14 s.
- `1280-light-playground-bonk-end.png`: 30/60/2 with anti-windup off. The bump works and the status
  composes correctly: "1 of 4 stars. Bump! It hit what is above it, but the motors keep running,
  and feedback brings it back to 2 m." The height curve is **clipped at 3 m**, though: the peak
  (~3.9 m) is off the plot. The "bump!" label overlaps the ghost curve.
- `1280-light-kick.png`: peak thrust "20.0 N" (red). Switch to measurement and it reads "19.9 N"
  (green): a 0.1 N difference, while the text promises "Same damping, no kick". The spike on the
  thrust plot is a 50 ms sliver.
- `1280-dark-noise.png`: the default τf = 0.005 chatters between 0 and 20 N, and the drone drifts to
  ~2.3 m (the note explains why; good). The sensor-reading series (pencil grey) is hard to tell
  apart from the blue height line at this scale. The drone view shows no thrust arrow or label here
  (the other widgets show one).
- `1280-light-full.png`: the page reads well top to bottom. The poles section is the longest text
  run without an interactive (6 math/p blocks).

#### 2. Terms before use

| # | Term / symbol / formula / number | First appears | Status | Note |
|---|---|---|---|---|
| 1 | P controller, Kp | stuck #0 | earned (Ch 2) | |
| 2 | "hanging below 2 m", droop | stuck #0 | earned (Ch 2) | Only Ch 2's number is implied; 24.5 cm is never stated in Ch 9 prose. |
| 3 | mg ≈ 4.9 N | stuck #1 | earned (Ch 2/6) | |
| 4 | T = Kp e, e = mg/Kp | stuck #1 | earned | No number: add "20 N/m → 24.5 cm". |
| 5 | 0–20 N limits, clipping | stuck #3 | earned (Ch 8 `limits`) | |
| 6 | area under the error curve | integral #0 | earned (Ch 3 `area`) | Linked in words; nothing on the page puts a number on the area. |
| 7 | ∫₀ᵗ e(τ) dτ | integral #1 | only stated | **τ as the dummy variable clashes** with Ch 3's time constant τ and this chapter's τ_f. Ch 3 wrote `∫₀ᵗ speed dt`. Use `\int_0^t \err e\,dt`. |
| 8 | K_i, unit N/(m·s) | integral #1 / widget | only stated | The unit is never explained (N per m·s of area). |
| 9 | "pile", "memory" | integral #2 | earned | |
| 10 | "edge", ≈ 40 | integral #10 | used before defined | Theo's number comes from trying values; derived later in `poles`. Fine as a hook, but say "we'll see why in a moment". |
| 11 | lag (shower) | integral #11 | earned (Ch 0/3) | |
| 12 | damper, c | derivative #0 | earned (Ch 6) | |
| 13 | dh/dt, ḣ | derivative #2 | earned (Ch 3 vocab) | |
| 14 | c + Kd as drag | derivative #3 | earned | but **ζ is not carried over** (Ch 6 `drone` #1 had ζ = c/(2√(mKp))). |
| 15 | K_d, unit N·s/m | derivative widget | only stated | Same unit as c (say so: "Kd is drag you add"). |
| 16 | ė = −ḣ | derivative #4 | earned | |
| 17 | Kd = 0.5 → edge 60 | derivative #6 | only stated | Uses the Routh edge before `poles` derives it. |
| 18 | "overshoots by about a quarter" | derivative #6 | stated, true as a minimum | Minimum 24.4 % at Kd = 4; 54 % at 0.5, 34 % at 10. Say "at least a quarter". |
| 19 | Kd ≈ 3–5 calm | derivative #6 | verified | 0.98 %, 0 %, 0.42 %. |
| 20 | ḧ, h⃛ (third derivative) | poles #1/#3 | **used before defined** | h⃛ never appears before Ch 9. One clause: "three dots: the slope of the slope of the slope". |
| 21 | "take the slope of both sides", d/dt ∫e = e | poles #2 | only stated | Ch 3's "slope takes you one way, area brings you back" is the reason; cite it. |
| 22 | guess e^{st} → cubic | poles #5 | earned (Ch 4/6) | Ch 7/8's transfer-function route is not used (see §3). |
| 23 | three poles; "common factor cancels" at Ki = 0 | poles #5 | only stated | Which factor? (s). One clause. |
| 24 | Routh–Hurwitz, a₂a₁ > a₃a₀ | poles #7 | **only stated** | Justified afterwards by the iω crossing (good). "Why the stable side is below" is missing. |
| 25 | s = iω substitution, ω² = Kp/m | poles #9–10 | derived | The two real/imaginary equations are not written out. |
| 26 | 40, 200 | poles #12 | verified | |
| 27 | mini-map | poles #12 | earned by widget | |
| 28 | "slowest pole σ" (widget status) | poles widget | earned (Ch 6 mode, Ch 8 4/|σ|) | Misleading at defaults because of the zero (finding 7). |
| 29 | stars; overshoot; settling (2 %); droop; motors pinned | playground | overshoot and settling earned (Ch 2/6 vocab); "motors pinned" only stated | The help line defines the targets. Nothing says why "pinned" matters (a motor at its limit leaves no room to correct). |
| 30 | ghost | playground #0 | earned (course-wide) | |
| 31 | windup / anti-windup | playground #3 | only stated | Note plus toggle; no number (see §4 windup compare). |
| 32 | derivative kick | warnings #1 | earned by widget | but the widget's number doesn't show it (finding 1). |
| 33 | derivative on measurement | warnings #3 | earned | |
| 34 | "a couple of centimetres, a thousand times a second" | warnings #5 | only stated | Number available: 2 cm per 1 ms = 20 m/s phantom speed. |
| 35 | filter, τ_f | warnings #5 | **only stated** | It is Ch 3's first-order lag applied to the sensor reading. Say so; it's a free bridge. |
| 36 | "±2 cm" noise | noise widget | inaccurate | It's σ = 2 cm Gaussian (a third of readings are further than 2 cm off). |
| 37 | clipping raises the mean | warnings #7 | verified | 55 % of samples at 0 N, 5 % at 20 N; drifts to ≈ 2.20 m. |
| 38 | closed-loop polynomial and condition in recap | wrap | earned | |

##### Where a curious beginner gets stuck

1. **"Why does the pile stop at *exactly* 4.9 N?"** The text asserts it. Fix: playable `ch9-pile`
   (§4 P1) plus one sentence: "At rest e = 0, so P and D push nothing; the pile alone holds 4.9 N,
   so it must hold mg/Ki = 0.49 m·s of area."
2. **h⃛ and "take the slope of both sides".** A reader who just learnt ∫ in Ch 3 doesn't know that
   the slope of an area is the curve. Fix: one clause citing Ch 3 ("slope and area undo each
   other") and one clause naming h⃛.
3. **Routh–Hurwitz as a spell.** Fix: side trip S3 (§5), "Why below the line is the safe side".
4. **ζ with D.** The reader learnt ζ in Ch 6 but Ch 9 never uses it. Fix: playable `ch9-zeta`.
5. **"Slowest pole" but a quick step.** Ch 8 taught 4/|σ|. The widget shows σ = −0.54 (7.4 s) and a
   2.7 s settle. Fix: side trip S4 (the PI zero).
6. **τ_f.** A new τ with no link to Ch 3. Fix: S5, "The filter is Chapter 3's coffee".
7. **"Kick" in a widget that reads 20.0 vs 19.9 N.** Fix: change the widget scenario (§6).

#### 3. Explanation gaps

**Bridges back**
- **Ch 3 area/τ.** The integral links to Ch 3 area in words (integral #0) but never shows the net
  area number. Ch 3's τ ruler is the exact shape of the droop dying (slow pole −0.51 ≈ −Ki/Kp =
  −0.5 at Kp = 20, Ki = 10), and the chapter doesn't say so. Ch 3's "tangent reaches the target
  after one τ" is literally the Ki·e₀ climb rate: mg / (Ki·mg/Kp) = Kp/Ki.
- **Ch 3 slope/area are inverses.** This is needed for the "take the slope of both sides" step
  (poles #2).
- **Ch 4 guess-an-exponential.** Used ("Guess e^{st} again"). Fine.
- **Ch 5/6.** ωn and ζ are not reused. ω = √(Kp/m) at the edge *is* Ch 6's ωn of the P drone
  (6.32 rad/s, period 0.99 s), which is also the period of Mika's yo-yo (measured 1.0 s). Say it.
  ζ_PD = (c+Kd)/(2√(mKp)) is missing (finding 4).
- **Ch 6 critical damping.** Kd_crit = 2√(mKp) − c = 5.32 N·s/m at Kp = 20. That is where "calm"
  begins; past it the drone creeps, which is Ch 6's `damping` section's "more is not better", now
  with an integrator (see §8 false-obvious).
- **Ch 7/8.** The chapter re-derives the ODE by differentiation instead of using Ch 7's d/dt → ×s
  and Ch 8's G(s) = 1/(ms² + cs). With C(s) = Kp + Ki/s + Kd s, the denominator of CG/(1+CG) is
  s(ms² + cs) + Kd s² + Kp s + Ki. This is shorter, reuses two chapters, and shows why "I = ÷ s adds
  a pole". It also explains the zero at −Ki/Kp, which Ch 8 `zeros` prepares.
- **Ch 8 zeros.** Not used, although the poles widget's step response is shaped by the PI zero
  (finding 7).

**Skipped derivation steps**
- poles #2 → #3: expand d/dt of each term (Kp ė = −Kp ḣ; d/dt Ki∫e = Ki(r − h); d/dt(−Kd ḣ) =
  −Kd ḧ). One aligned math block.
- poles #9 → #10: the two equations for s = iω: real part Ki − (c+Kd)ω² = 0, imaginary part
  ω(Kp − mω²) = 0. Write them.
- The Routh direction: why *below* the edge is stable. Missing (S3 supplies it).
- "a common factor cancels" (poles #5): which factor (s) and why (with no I, the differentiation
  added a spurious root at 0).

**Rules of thumb without reasons**
- "Stuck? Start with Kd around 4, then raise Ki until the droop goes, then nudge Kp." Verified to
  work (Kp 20, Kd 4: Ki 0 → 2★, 5 → 3★, 10 → 4★). The reason is missing: Kd ≈ 4 is ζ ≈ 0.8 (Ch 6's
  sweet spot).
- "Almost every real PID does this" (D on measurement). Fine as a statement.
- The "at the cost of reacting a bit later" filter trade-off has no number. The filter delays D by
  about τ_f (a Ch 3 τ).

#### 4. Playable-number opportunities

All values verified in `ch09-numbers.test.ts` (line numbers in §8). The model goes in the new
`src/chapters/ch09/plays.ts`; register `plays` in `registry.ts` (like ch04/ch06).

**P1 `pile`**: integral section, after block 2 (the "pile only stops growing" p).
> "Stuck 24.5 cm low, the error pile grows by 0.245 m·s every second. With $K_i$ = {scrub|ki|eff}
> N/(m·s) that adds {calc|rate} N of push per second, enough for the whole 4.9 N after
> {calc|tau} s. It never goes quite that fast: as the drone rises, the error shrinks and the pile
> slows down, just like Chapter 3's coffee. After {calc|tau} s it's about 63 % of the way; after
> about {calc|ts} s, 98 %."

- inputs: `ki` min 2, max 12, step 1, value 10, unit N/(m·s). (Capped at 12: above that the fast
  pair interferes and the τ estimate drifts; at Ki = 20 the 63 % time is 0.77 s, not 1 s.)
- outputs: rate = Ki·mg/Kp (2 decimals), tau = Kp/Ki (1), ts = 4Kp/Ki (1), with Kp = 20.
- at initial: rate **2.45 N/s**, tau **2.0 s**, ts **8.0 s**. Sim (Kp 20, Ki 10, Kd 0, starting at
  the droop): 63 % at **1.96 s**, 98 % at **7.67 s**. Ki = 5 (Kd 4): τ 4 s vs 3.75 s. Ki = 2: 10 s
  vs 9.75 s.

**P2 `area`**: integral section, after the widget's lead-in (block 6), or in the widget's help.
> "At rest the pile holds the whole weight by itself, so with $K_i$ = {scrub|ki|eff} the net
> {err|red area} must add up to exactly $mg/K_i$ = {calc|area} m·s."

- ki 2–40 step 1, value 10; area = mg/Ki (2 decimals). Initial **0.49 m·s**. Sim at 12 s: integral
  0.489, push 4.89 N; at 30 s: 4.905 N.

**P3 `zeta`**: derivative section, after block 3 ("adding air resistance in software").
> "With $K_p$ = 20 N/m and $K_d$ = {scrub|kd|eff} N·s/m, the drone feels a drag of {calc|damp}
> N·s/m, so Chapter 6's damping ratio becomes $\zeta = (c+K_d)/(2\sqrt{m K_p})$ = {calc|zeta}:
> {calc|regime}."

- kd 0–10 step 0.5, value 4; damp = 1 + Kd (1); zeta (2); regime reuses Ch 6's `regime.*` strings
  (move them to `common.json`; see shared blocks).
- values: Kd 0 → **0.16**, 2 → **0.47**, 3 → **0.63**, 4 → **0.79**, 5 → **0.95**; critical at
  **Kd = 5.32**. PD poles at Kd = 4: −5 ± 3.873i → ζ 0.791 ✓.
- Add a clause: "(with I switched on there is a third, slow pole, so treat this as the pair's
  personality)".

**P4 `cliff`**: poles section, replaces block 12 ("With Kp = 20 and no D: …").
> "With $K_p$ = {scrub|kp|eff} N/m and $K_d$ = {scrub|kd|eff} N·s/m, $K_i$ must stay below
> $(c+K_d)K_p/m$ = {calc|lim} N/(m·s). Right at the edge the drone swings at
> $\omega = \sqrt{K_p/m}$ = {calc|w} rad/s: one swing every {calc|T} s."

- kp 2–40 step 1, value 20; kd 0–10 step 0.5, value 0; lim (0), w (2), T (2).
- initial: **40**, **6.32 rad/s**, **0.99 s** (Mika's yo-yo measured **1.0 s**). kd = 4 → **200**;
  kd 0.5 → **60**; kp 10, kd 1 → **40** (quiz 3; poles at ±4.472i and −4 on the edge).
- Emit `play:cliff` so the `poles` widget can follow (bus), a linked representation.
- Keep the next sentence: "That's exactly where Mika's drone went wild."

**P5 `kick`**: warnings, after block 2 (the kick p), before the widget.
> "A jump of {scrub|dr} m seen through a {scrub|tf} s filter looks like a speed of about
> {calc|slope} m/s, so with $K_d$ = 4 the D term asks for roughly {calc|spike} N. The motors top
> out at 20."

- dr 0.1–1 step 0.1, value 1; tf values [0.005, 0.01, 0.02, 0.05], value 0.01; slope = dr/tf (0),
  spike = 4·dr/tf (0).
- initial: **100 m/s**, **400 N** (sim: requested command peaks at **413 N**, i.e. 400 + Kp·Δr −
  the filter's first-step loss + mg). dr 0.5 → 200 N (sim 209). tf 0.02 → 200 N (sim 218).

**P6 `jitter`**: warnings, after block 5 (the noise p), before the widget.
> "Read every millisecond, 2 cm of jitter looks like a speed of 20 m/s. Through a filter of
> $\tau_f$ = {scrub|tf} s, $K_d$ = 4 turns σ = 2 cm into about $K_d\sigma/\tau_f$ = {calc|d} N
> of thrust jitter; P adds only $K_p\sigma$ = 0.3 N."

- tf values [0.005, 0.01, 0.02, 0.05, 0.1, 0.2], value 0.1; d = 4·0.02/tf (1).
- values: 0.1 → **0.8 N** (P+D ≈ 1.1 N; sim unlimited 1.10 N; widget 1.05 N); 0.02 → **4 N**
  (sim 4.17 unlimited, 3.51 clipped); 0.005 → **16 N** (sim 14.1 unlimited; clipped 6.29).
- "20 m/s" = 0.02 m / 0.001 s ✓. (The brief's Kd·σ·√2/Δt = 113 N is the raw two-sample difference;
  the widget never does that, since its minimum τ_f is 5 ms and dTau = 0 uses the true speed. Keep
  113 N out of the prose.)

**P7 `windup`** (optional): playground, inside the windup note.
> "With $K_p$ = 20, $K_i$ = 20 and $K_d$ = 4: anti-windup on, {calc|on} % overshoot; off,
> {calc|off} %."

- Better as static numbers than as a play (it needs a sim run). Verified: **6.7 %** vs **17.1 %**.
  The 30/60/2 pair peaks at **2.77 m** vs **4.05 m**, which reaches the page (the bump demo).

#### 5. Side trips

**S1 "Why the pile slows down"** (integral, after P1). Proves τ_I ≈ Kp/Ki.
TeX: `\frac{d}{dt}\!\int\!\err e = \err e \approx \frac{\dis{mg} - K_i\!\int\!\err e}{K_p} \;\Longrightarrow\; \tau_I \approx \frac{K_p}{K_i}`
> Theo: "Hang on, why does the climb look exactly like the coffee?" June: "Because it *is* the
> coffee. Once the fast wiggle is gone, P does whatever the pile doesn't. So the error is the
> missing push divided by $K_p$, and the pile grows by that error." Mika: "Rate proportional to how
> far it still has to go. Chapter 3!" So the droop dies like cooling coffee, with a time constant
> of about $K_p/K_i$ = 2 s at our gains. That slow pole sits near $-K_i/K_p$ = −0.5 on the map.

(Verified: pole −0.51 at Kd 0, −0.58 at Kd 4.)

**S2 "I is a divide-by-s"** (poles, after the cubic). A Ch 7/8 bridge.
TeX: `C(s) = K_p + \frac{K_i}{s} + K_d\,s,\qquad 1 + C(s)\,\frac{1}{ms^2+cs} = 0 \;\Longrightarrow\; ms^3 + (c+K_d)s^2 + K_p s + K_i = 0`
> In Chapter 7 a slope became "× s". An area is the opposite, so it becomes "÷ s". Put the three
> knobs into Chapter 8's recipe and clear the fractions: out comes the same cubic, without taking
> any slopes. The ÷ s is the extra pole. On top, the controller brings a zero at $-K_i/K_p$.
> Keep an eye on it.

**S3 "Why below the line is the safe side"** (poles, after the iω derivation). Proves the Routh
direction with a continuity argument, no tables.
> Start with a tiny $K_i$. The PD pair sits safely left, and the new pole sits just left of zero
> (near $-K_i/K_p$). As $K_i$ grows, the poles slide smoothly. To reach the right half, one of them
> must cross the vertical axis. It can cross at 0 only if $K_i = 0$, and at $\pm i\omega$ only at
> the edge we just found. So below the edge, nobody can have crossed. Theo: "So Routh's rule is
> just 'you can't get to the other side without touching the wall'."

**S4 "Why doesn't the slow pole make it slow?"** (poles, after the widget). A Ch 8 zeros callback.
> Mika: "The status says the slowest pole is at −0.54. Chapter 8 said that means about 4/0.54 ≈
> 7 s. But the step settles in under 3!" June: "Look for a zero. The I brings one at $-K_i/K_p$ =
> −0.5, right next to that pole. A pole and a zero that close nearly cancel, so that mode hardly
> shows up when we move the setpoint." Theo: "Hardly isn't never. It's also why the step still
> overshoots by almost 30 %."

(Verified: 20/10/2 settles in 2.71 s with 28.7 % overshoot; 20/10/4 overshoots 13.1 %.)
Suggested widget link: draw the zero ○ on the s-plane. The data exist: the numerator is Kp s + Ki
with D on measurement.

**S5 "The filter is Chapter 3's coffee"** (warnings, after the noise widget).
TeX: `\frac{d\,h_f}{dt} = \frac{h_{\text{meas}} - h_f}{\tau_f}`
> The smoothing filter is Newton's cooling rule pointed at the sensor: the smoothed height chases
> the jittery reading with time constant $\tau_f$. Fast jitter never gets a chance to move it.
> Real motion does, one $\tau_f$ late. That's the price in the prose, in seconds.

(Matches `drone-model.ts:219` `dx[F] = (hm − x[F])/τ`.)

#### 6. Widget polish

**`integral`**
- Status logic (`widgets.ts:54`): Ki in ~21–39 returns `status.slow` ("The pile takes time to
  build"), but those drones are ringing, not slow (Ki 30: 1.15 cm at 12 s, ±7 cm after 8 s; Ki 38:
  2.5 cm, ±19 cm). Add `status.ringing`: "Stable, but only just: it's still swinging at 12 s. The
  closer Ki gets to {lim}, the slower the swings die." Condition: ki > 0.5·lim and max |h−2| after
  8 s > 1 cm.
- Scenario: the take-off overshoot (52 % at every Ki) hides the droop story. Option: a
  "start from the droop" mode (hover at 1.755 m, I on at t = 1 s) makes the orange Ki∫e climb
  clean and matches P1/S1 exactly. Keep take-off as default if you like; the playground covers it.
- At Ki = 0 the dashed Ki∫e series is invisible on the x-axis. The prose asks the reader to watch it.
  Set the default Ki to 10 (droop gone, 4.89 N), or say "drag Ki up from 0".
- Readout: add "net area {a} m·s" (P2).
- Page physics: peak 3.30 m at Ki = 60 vs page at 3.9 m (1280) / 4.4 m (375). Rule 7: leave it
  alone (already tested).

**`damper`**
- Status advice is wrong past the optimum: "Add more Kd" at Ki = 10 with Kd ≈ 8 and above, where overshoot passes 5 % (overshoot 2.3 →
  5.4 → 7.9 % at 6/8/10), and at Ki = 50 with any Kd (min 24 %). New `status.tooMuch`: "More D made
  it worse: now the slow pile overshoots late. Try less Kd." Show it when overshoot(kd) >
  overshoot(kd − 0.5) and kd > Kd_crit (5.32). New `status.bigPile` for Ki = 50: "Stable, but the
  big pile still overshoots by {os} %. No amount of D fixes that; turn Mika's Ki off."
- Readouts: add ζ (P3's formula, label "damping ratio ζ (P and D only)").
- A11y: the switch's accessible name is "Mika's big = 50" (snapshot). Build the label with
  `plainText()` or an explicit `aria-label`: "Mika's big Ki = 50".
- The bus hook `damper:mika` exists (l.93) but no prose triggers it; the p after the widget could
  get an inline "flip it on" action.
- Page physics: peak 3.25 m (Ki 50, Kd 0) < 3.9 m. Leave it.

**`poles`**
- The slow pole on the origin: add a small zoom inset or a label "slow pole −0.54" when |re| < 1.
  Draw the PI zero ○ at −Ki/Kp (S4). The colour language already reserves ○.
- Status: "The slowest pole sits at σ = −0.54" invites Ch 8's 4/|σ| = 7.4 s, but the step settles
  in 2.7 s. Add "(a zero at {z} nearly cancels it)" when |pole − zero| < 0.2.
- Add a readout of step overshoot and settling (the plot shows 28.7 % at defaults; the text never
  mentions it).
- Slider names "K_p/K_i/K_d": give plain aria-labels ("proportional gain Kp", …).
- 375 px: the σ tick labels are cramped; drop every other tick below 400 px.
- Linked representation: follow `play:cliff` (P4) to move the Kp/Kd sliders and the "you" dot.
- The step plot uses the limited motors (hoverStep); for Kp ≥ ~30 the 0.5 m step saturates
  (Kp·0.5 + 4.9 > 20), so it departs from the pole picture. Say so in help ("with real 20 N
  motors") or use unlimited motors for this plot.

**`playground`**
- The composed status works (verdict + hit sentence, `widgets.ts:222–223, 240`) and matches
  `docs/page-physics.md` rule 9. Checked on screen: "1 of 4 stars. Bump! … brings it back to 2 m." A grid search
  (Kp 0–40, Ki 0–60, Kd 0–10, anti-windup on/off, ceiling 3.9 and 4.4 m) found **no** case where
  `hit.wild` ("never settles") fires on a flight that is actually steady.
- Height plot clipped at 3 m: when `hitAt` is not null, set `heightRange` max to
  ceil(ceiling + 0.3), or always 4.5 m. Otherwise the bump happens off-plot (screenshot).
- "settling time: never" for P-only flights that settle 24.5 cm low. Use "never (droops)" when
  |sse| > 2 %, a new key `neverDroop`.
- The targets differ from the plan (plan: settle < 2 s, peak thrust < 20 N; built: 1.5 s, pinned
  < 0.2 s). The built choice is right: **every take-off with Kp ≥ 10 peaks at exactly 20 N** (Kp·2 m
  ≥ 20 N), so a peak-thrust star is impossible. Update `docs/course-plan.md`. The unused
  `Score.peakThrust` could become a readout.
- Plan item missing: a pole plot in the playground (the plan says "live response + pole plot").
  A small s-plane (reuse `SPlane` at maxWidth 200) is a strong linked representation. Medium size.
- Difficulty: 29 of 1287 grid points earn four stars; the hint path works.
- "motors pinned" is only defined in the help line; add one clause to the windup note ("a pinned
  motor has no room left to correct").
- Page physics: correct per rules 1–9. Rule 7 is satisfied: 262 of 2574 gain combos reach 3.9 m,
  and no Ki = 0 flight does (max 3.41 m), so the bump is always an I/windup event.

**`kick`**
- **Main fix.** The readout compares 20.0 N with 19.9 N. Options, best first:
  (a) jump 1 → 1.5 m. Error: 20 N pinned; measurement: **12.4 N**. Retitle "Setpoint jump:
  1 m → 1.5 m" and change "jumps by a metre" in warnings #1 to "half a metre".
  (b) keep 1 → 2 m and add a second readout, "D asks for", showing the requested thrust (413 N vs
  19.9 N). This needs `command` in `Trace` (the sim has `sim.command`).
  Doing both is the most vivid.
- Status "error": add the number: "The error jumps, its slope is huge: D asks for about {req} N and
  the motors slam to 20 N."
- The thrust spike lasts 50 ms on a 5 s axis. Add a short tick label "kick!" at t = 1 s.
- The ghost of the other mode already appears on toggle (Plot `clear(keepGhost = true)`). Good.

**`noise`**
- Status `calm` is false (finding 3). New wording: "Much calmer. Of the ±{j} N left, P passes
  about 0.3 N straight through; the rest is D. The price: D now reacts about {tau} s later." (0.3 N
  = Kp·σ, verified: P-only jitter 0.285 N.)
- Toggle label "Sensor noise (±2 cm)" should be "Sensor noise (about 2 cm)" or "σ = 2 cm".
- Add a readout of the mean height offset (the note asks "did you spot the drift"; 2.20 m at
  τ_f = 0.005, 2.05 at 0.01, 2.01 at 0.02).
- There's no Kd control, so "more D = more noise" can't be felt. Add a Kd slider 0–8 (jitter at
  τ_f = 0.02: 0.29, 1.20, 2.10, 3.51, 5.28 N for Kd 0/1/2/4/8). This is the "adding Kd does NOT
  help" case, in the widget.
- The drone view shows no thrust arrow here; check that `DroneView.update` isn't hiding it when
  thrust flips between 0 and 20.
- The measured series is `pencil` grey at width 1; at 1280 it's hard to see. Width 1.2 and
  alpha 0.7.

#### 7. Pedagogy checklist

| Item | Status | Note |
|---|---|---|
| Driving question | present | Clear and answered in the recap. |
| Feel-it interactive first | weak | The first widget follows 7 blocks, including the predict card. Acceptable because the predict comes first by design. |
| Gated predict-then-reveal | present | `ch9-bigki`, 3 sketches, all with whys. |
| One idea per section | weak in `poles` | Derivation + Routh + crossing + numbers + widget + list. Move Routh and the crossing into S3, and cut poles #11. |
| Misconception and on-page mistake | present | Mika's Ki = 50 (mistake), Mika's "D predicts" (misconception). June over-engineering D (her cast trait) isn't used; the "too much Kd" case is a ready-made second mistake (below). |
| Recap | present | Add "the pile's time constant is about Kp/Ki" and "ζ = (c+Kd)/(2√(mKp))". |
| 2–4 quiz items with a why for every option | present (4) | Proposed q5 replaces nothing; the chapter can go to 5 or swap out q2. |
| Concept-map nodes | present | 4 nodes. Consider an edge `critical → derivativeaction` (Kd_crit). |
| Cliffhanger | present | |

**Proposed fixes**

- **June's mistake (derivative section, after the damper widget):**
  June: "If 4 is good, 10 is better. Maximum shock absorber!" Mika: "It creeps up and then goes
  *past* 2 m… slowly?" Theo: "Past Kd ≈ 5.3 it's overdamped, like your ζ = 5 drone in Chapter 6.
  But now there's a pile too, and a slow drone gives the pile time to overfill." (Verified
  overshoot 0 % → 7.9 %, settling 0.83 s → 5.0 s at Ki = 10.)
- **New quiz item `ch9-q5`:** "Kp = 20, Ki = 10. Which change makes the take-off overshoot
  *bigger*?"
  - "Raising Kd from 4 to 10" (**correct**). Why: "Too much damping makes the drone creep, and the
    pile keeps filling while it creeps: overshoot goes from 0 % to about 8 %."
  - "Raising Kd from 0 to 4". Why: "That's the good direction: overshoot drops from about 54 % to
    0 %."
  - "Lowering Ki from 10 to 5". Why: "A smaller pile remembers less, so it overshoots less (0 % at
    Kd = 4). It just takes longer to kill the droop."
  (All three verified: 20/10/10 7.88 %; 20/10/0 53.7 % and 20/10/4 0 %; 20/5/4 0 %.)
- **q2 enrichment:** the second option's why could cite the widget ("at Kd = 10 the slow pair sits
  at −0.97 while the fast pole runs to −20").

#### 8. Numerical claims (verified)

File: `$SCRATCH/checks/ch09-numbers.test.ts`. All 22 tests pass.

| Claim | Expected value | Method (test file + line) | Result |
|---|---|---|---|
| mg | 4.905 N | l.31 | ✓ |
| P droop at Kp = 20 | 0.245 m (sim at 12 s ✓) | l.31 | ✓ |
| Routh edges 40 / 60 / 200 / quiz 40 | exact | l.36 | ✓ |
| edge frequency ω = √(Kp/m), period | 6.325 rad/s, 0.993 s | l.36 | ✓ |
| on the edge (10, 40, 1): poles | ±4.472i and −4 | l.36 | ✓ |
| Routh vs sim, unlimited motors, ±5 % around the edge | envelope ratio < 0.5 below, > 2 above, for (Kp, Kd) = (20,0), (20,0.5), (20,4), (10,1), (30,2) | l.45 | ✓ (0.15–0.40 vs 2.4–4.1) |
| Mika's Ki = 50 yo-yo ("half a metre") | 0.52 m peak to peak, period 1.0 s | l.52 | ✓ |
| "still overshoots by about a quarter, however much D" | min 24.4 % (Kd 4), 34 % at Kd 10; Kd 0.5 settles | l.59 | ✓ as a minimum |
| Ki = 10, Kd 3–5 calm | 0.98 %, 0 %, 0.42 % | l.66 | ✓ |
| ζ_PD at Kp 20 | 0.16 / 0.47 / 0.63 / 0.79 / 0.95 at Kd 0/2/3/4/5; Kd_crit 5.32 | l.74 | ✓ (new) |
| pile climb rate from the droop, Ki = 10 | 2.45 N/s; τ = Kp/Ki = 2 s; 63 % at 1.96 s; 98 % at 7.4–8.0 s (7.67) | l.81 | ✓ (new) |
| Ki = 5 / 20 climb (Kd 4) | 63 % at 3.75 s (τ 4) / 0.77 s (τ 1: estimate breaks down) | l.81 | ✓ (new, sets the P1 cap) |
| slow pole ≈ −Ki/Kp | −0.51 (vs −0.5) | l.81 | ✓ (new) |
| final area mg/Ki | 0.49 m·s; push 4.89 N at 12 s, 4.905 at 30 s | l.89 | ✓ (new) |
| FALSE-obvious: Ki 30–38 "slow" | still ringing > 7 cm after 8 s, droop > 1 cm at 12 s, yet stable | l.95 | ✓ (status bug) |
| FALSE-obvious: more Kd always helps | Ki 10: 5.35 % at Kd 8, 7.88 % at 10; settling 0.83 → 5.03 s; fast pole −20.06 | l.103 | ✓ |
| FALSE-obvious: D is free | noise jitter 0.29 / 1.20 / 2.10 / 3.51 / 5.28 N for Kd 0/1/2/4/8 (τ_f 0.02) | l.110 | ✓ |
| jitter ≈ (Kp + Kd/τ_f)σ (unlimited) | 1.10 N at τ_f 0.1; 4.17 at 0.02 (4.3 predicted); 14.1 < 16.3 at 0.005 | l.114 | ✓ (new) |
| FALSE: "the jitter left comes from the P term" | at τ_f 0.2: 0.668 N total vs 0.285 P-only; D part 0.4 > P 0.3 | l.125 | ✓ (text wrong) |
| noise defaults τ_f 0.005 | ±6.29 N; 55 % at 0 N, 5 % at 20 N; mean height ≈ 2.20 m | l.130 | ✓ (supports the note) |
| 2 cm per 1 ms | 20 m/s | l.130 | ✓ (new) |
| calm threshold crossing | 1.79 N at τ_f 0.05, 1.05 N at 0.1 | l.139 | ✓ |
| KICK readout | 20.0 N vs 19.905 N (= 15 + mg); kick run peaks lower | l.142 | ✓ (widget bug) |
| kick fix 1 → 1.5 m | 20 N vs 12.41 N | l.149 | ✓ (new) |
| requested D spike | 400–420 N (413) ≈ Kd·Δr/τ_f = 400 | l.149 | ✓ (new) |
| stuck-hint path, Kp 20 / Kd 4 | Ki 0/5/10/15/20 → 2/3/4/4/2 stars | l.157 | ✓ |
| pinned time | 1.22 s (P-only), 0.14 s (20/10/4) | l.157 | ✓ |
| peak thrust at take-off | exactly 20 N for Kp 10/20/40 (plan's star impossible) | l.157 | ✓ |
| windup compare | 20/20/4: 6.73 % vs 17.13 %; 30/60/2 peak 2.77 m vs 4.05 m (hits 3.9 m) | l.165 | ✓ (new) |
| rule 7: no P/PD flight reaches the page | max 3.41 m (Kp 40) < 3.9 m | l.172 | ✓ |
| poles defaults 20/10/2 | slowest σ −0.54; step settles 2.71 s (not 7.4); overshoot 28.7 % | l.176 | ✓ (new) |
| FALSE-obvious: ζ_PD 0.79 means little overshoot | 20/10/4 step from hover overshoots 13.1 % | l.176 | ✓ |

(Earlier exploration: `ch09-explore.log` shows 29 of 1287 grid points earn 4 stars, and there is no
steady flight labelled "never settles" after a hit, from `ch09-explore2.log`.)

---

## Phase 5 — Chapter 10: Back to the Shower (`0.9.0`)

### The phase

Same seven sections, same widget ids. New `plays.ts`, five callouts, two widget fixes, one reordering in `design`. Every string lands in all 10 locales in the same commit; `locales.test.ts` green; `pnpm a11y` zero violations; screenshots at 1280 / 375 × light / dark + `de` + `ar`.

#### 5a. Section `again`: small touch-ups (Impact Medium, Size S)
- Add to June's line: "I put our drone PID on the shower (same snappy feel, scaled to knob units)". It makes the unit transfer honest.
- Name τ once: after Theo's line, add a `p`: "The shower has two slow parts: the **pipe**, a pure 2.5 s delay, and the **smoother**, the head and pipe walls warming up with Chapter 3's time constant, τ = 1 s." Use "smoother" everywhere after (replaces "thermal response", "thermal lag", "mixing" in `bode` b0, b4, `margins` b4). Ch 0's "mixing" in its `broken` note can stay; add "(the smoother)" there in a separate commit if wanted.
- **Tests:** none new (τ = 1 is `SHOWER.tau`).
- **Testable outcome:** the words "thermal lag" and "mixing adds" no longer appear in `ch10.json` in any locale.

#### 5b. Section `lag`: define phase in degrees (Impact High, Size S)
- New sentence before the math block: "One whole wiggle is one full turn of Chapter 5's spinner: 360°, or 2π radians. So what matters is **what fraction of a wiggle** the delay covers: $L/T$."
- Replace b3's "on a phase plot, that appears as a negative angle" with "Engineers write a lag as a negative angle, so the plots below go downwards."
- Math block: `\phi = \underbrace{\tfrac{L}{T}}_{\text{share of a wiggle}}\cdot 360^\circ = \omega L \text{ radians},\quad \omega = \tfrac{2\pi}{T}`.
- `play` P1 `delaylag` replaces the first sentence of b5.
- Note b6: add the one-line step `e^{i\omega(t-L)} = e^{-i\omega L}\,e^{i\omega t}` before "That's why … $e^{-Ls}$".
- Widget `phase`: readout colour `err` → `dis`; new readouts ω and "share of a wiggle"; `flipped` threshold ±5°; new status key `over` ("A lag of {d}°: more than a whole wiggle late.") for deg > 360 when not near a multiple of 360.
- **Tests to add** (`ch10.test.ts`): 360·2.5/30 = 30; 360·2.5/5 = 180; 360·2/8 = 90; P1 initial (2.5, 10) → 0.25, 90, 1.57; phase-widget status function (extract to `shower-tools.ts` as `lagStatus(deg)`): 45 → middle, 164 → middle (new threshold), 180 → flipped, 360 → full, 450 → over.
- **Testable outcome:** from the page alone a reader can say why a 2 s delay is 90° on an 8 s wiggle *and* 180° on a 4 s one.

#### 5c. Section `bode`: build the curve, don't just state it (Impact High, Size M)
- b1 list: after "Gain", add "(the same word as the controller's gain: size out ÷ size in)".
- Side trip A "What the smoother does to a spinner" (TeX + P2 `smoother`) before the `G(iω)` math.
- b4: after "form a **Bode plot**", add: "Together they are the shower's **frequency response**: how it treats each wiggle speed. To get it from the formula, set $s = i\omega$: the same trick that found Chapter 9's edge."
- `play` P3 `total` after the math block, with the verdict strings `plays.total.{before,flip,past}`.
- Side trip C "The squashed ruler" after the widget.
- Widget `bode`: fix the initial-ω mismatch; gain y-range 0.2–1.2; minor x ticks 0.2, 0.5, 2; −180° crossing marker at 0.952 rad/s once the formula is shown; formula-status line extended: "The formula runs right through your dots. It crosses −180° at {w} rad/s: a {p} s wiggle comes back upside down." (0.95, 6.6).
- **Tests:** P2 at 1 → 0.71, 45; at 10 → 0.0995; P3 at 0.5 → 72/27/98, at 0.95 → 136/44/180 (flip); shower-only −180° at 0.9523 with gain 0.724; slider initial `wFromSlider(0.34)` equals the measured ω (regression); existing `measureSine` test extended to ω = 0.05, 0.628, 3.
- **Testable outcome:** the Bode formula has a visible derivation on the page; slider, status and dots agree on ω.

#### 5d. Section `margins`: derive the 90°, draw the distances (Impact High, Size M)
- Rename the loop symbol in b1 math, b3/b6 prose and widget string `gain` ("loop gain |L|" → "loop gain"): e.g. `G_{\circ}(s)` or "the loop". Decision for the implementer; record it in the glossary.
- Side trip B "The pile of a wiggle" after b1.
- b2: "Feedback subtracts (error = target − temperature). That's a ×(−1), Chapter 5's half-turn, so the wave flips once." Replace "(gain ≥ 1), the swing grows by itself" with "If the loop returns the wave at full size (gain 1), the swing keeps itself going; bigger than 1, it grows."
- b4 → P4 `handloop` + the fixed follow-up sentence (0.457, 0.72, 1.4).
- After vocab: side trip D "Phase margin is damping in disguise".
- b6: add the PM computation in one clause: "…and a phase margin of about 22° (where its loop gain is 1, at 0.34 rad/s, the phase is −158°)."
- After the widget: P6 `double`.
- Widget `margins`: fix the 375 px / `de` label collisions; draw GM and PM arrows with values; new readouts "−180° speed" and "hunting period"; status strings with {g} and {T}.
- **Tests:** P4 at 0.30 → 17/43/150/1.15, at 0.46 → 25/66/181/0.71; PM 22.4 at ωc 0.341, loop phase −157.6; P6 at 1, 2, 2.5, 3, 4, 5 → 2.52, 1.36, 1.12, 0.95, 0.74, 0.60 (and 13.8 s, 23.9 s at 2.5, 5); PM–ζ table (43.1, 51.8, 59.2) with the "standard 2nd-order loop" comment; **sim** tests: I hand at 0.97× critical decays, 1.03× grows, period 13.75 ± 0.5 s (small kick around 38 °C, knob unsaturated).
- **Testable outcome:** at 375 px in `de` no margins label overlaps; a reader can point to both margins as arrows; the 90° of the hand is derived on the page.

#### 5e. Section `replay`: honest verdicts (Impact Medium, Size S)
- b2: add "A position hand has no pile, so no 90° of its own: the pipe and smoother alone must reach 180°, which happens at a faster wiggle."
- P5 `pgain` after b2.
- Widget `replay`: `verdict.robot` reworded (§6); prediction readouts in neutral ink; period bracket on the plot.
- **Tests:** P5 at 0.020 / 0.031 / 0.040 → 0.65 / 1.01 / 1.30; P-hand sim at 0.97× decays and 1.03× grows, period 6.6 ± 0.3 s; normal robot hand small-signal period 15.5 s.
- **Testable outcome:** the robot-case verdict no longer claims a 15.5 s run is "as predicted" by a 13.8 s edge without saying why.

#### 5f. Section `design`: put June's mistake on the page (Impact High, Size M)
- Reorder: `p` (b0) → unit note (old b6, merged with the goal) → June "Easy. I'll use big gains…" → widget **opening on June's preset** → June: "…it hunts, hot–cold–hot, every 6 seconds. Big gains pushed the gain-of-1 speed past the −180° speed. No phase margin at all." → Theo "Try about Kp ≈ 1 and Ki ≈ 0.6" → new sentence on phase lead: "P reacts to *now*, I to the pile. Mixing in some *now* moves the knob a little earlier, which gives back phase: **phase lead**, about 37° here." → b7 → P7 `delaymargin` → side trip E "Shorter pipe or faster heater?" → optional side trip F.
- Move the velocity-form note (b1) into a callout "How the robot actually turns the knob".
- Widget `designer`: initial `kp = 0.05, ki = 0.05`; presets "June's drone-style gains", "The normal hand", "Theo's gentle gains"; status `unstable` with {g} and {p}; mini loop-phase plot with the PM arrow (reuse `marginPlots`); readout labels without mid-word hyphenation.
- **Tests:** June's PI: GM 0.279, ω180 = π/5, simulated swing period 6.3 ± 0.2 s; PI (1, 0.6): phase lead 37.3° at 0.457 rad/s; P7 at (1, 0.6) → 58°, 0.29, 3.5 s, at (0, 0.8) → 22°, 0.34, 1.1 s, with PM → 0 when the delay margin is added; side trip E numbers (1.21, 2.06, 0.0252); designer goal reachable (at least one grid point, and Kp 0.9 / Ki 0.5 → 6.7 s, PM 66°).
- **Testable outcome:** a first-time reader sees June's hunting run before any fix, and the page gives robustness as a number (seconds of extra pipe).

#### 5g. Section `wrap` (Impact Medium, Size S)
- Recap item 2: "frequency response" is already defined by then; keep it. Add an item: "A pile (I) lags every wiggle by 90°; a smoother by up to 90°; a pipe by $\omega L$, without limit."
- Quiz: replace q2 with q2′ (read-off margins); optionally add q5 (pipe vs heater).
- Map: relabel `bode` → "frequency response / Bode plot" in `common.json` (all locales).
- Update `docs/course-plan.md` Chapter 10: the Ch 0 callback is 13.8 s for the (I) robot hands and 6.6 s for position-style human hands.
- **Tests:** q2′ arithmetic (4, 50); q5 numbers (1.21, 2.06; 65°/25° split).
- **Testable outcome:** every quiz number has a test; `locales.test.ts` passes with the new ids.

#### Shared building blocks (candidate owners)
- `Plot` label avoidance between `setLines` labels and `setMarkers` labels (owner: `src/ui/plot.ts`). Ch 9 and Ch 11 margin/pole plots will hit the same collision.
- A "distance arrow" annotation on `Plot` (vertical double arrow with a label). Ch 9 overshoot and Ch 11 scoring could use it too.
- A spinner mini-view (Ch 5) usable inside other widgets (the phase widget; possibly Ch 7/8).
- `shower-tools.ts`: `criticalHandGain(L, tau)`, `delayMargin(margins)`, `lagStatus(deg)` as pure, tested helpers (owner: Ch 10; Ch 11 may reuse them if the finale has a delay).
- Readout label hyphenation rule for long-word locales (owner: `src/ui/controls.ts` CSS). This affects every HUD.

#### New glossary terms for translators
- *phase / phase lag*: how far a wiggle trails, as a share of one full wiggle (360°).
- *frequency response*: how a system scales and delays a steady wiggle at each speed.
- *Bode plot*: frequency response drawn as two plots (gain and phase) against wiggle speed on a ×10 ruler.
- *gain (of a system at one speed)*: output wiggle size ÷ input wiggle size.
- *smoother* (first-order lag): a part that follows its input with time constant τ, shrinking and delaying fast wiggles.
- *gain margin*: how many times the gain could be multiplied before the loop gain reaches 1 at the −180° speed.
- *phase margin*: extra lag that would bring the loop to −180° at the speed where its gain is 1.
- *phase lead*: an earlier reaction that gives back phase (from P or D).
- *delay margin*: how much longer the delay could get before the loop starts to hunt.
- *hunting*: a steady self-sustained oscillation of a control loop.
- *logarithmic axis*: a ruler where each equal step is ×10.
- *robust*: still works when the real system differs from the model.

#### Risks
- Renaming the loop symbol touches maths in 10 locales; `locales.test.ts` compares maths, so do it in one commit.
- Opening the designer on June's gains means the first autoplay run is the bang-bang one. Check reduced motion (no autoplay) still shows it as a static trace.
- The PM–ζ bridge is only exact for the standard 2nd-order loop; wording must say "for Chapter 6's simple loops".
- `comfortTime` is a discontinuous function of the gains; any stated "best" design number is fragile. Test it with tolerance, or don't state it in prose.
- The sim tests near the critical gain need a small kick around 38 °C, or the knob saturates and hides the linear behaviour.

#### Suggested commit order
1. `fix(ch10): bode slider shows the measured ω` (+ regression test).
2. `fix(ui): avoid marker/line label collisions in plots` (shared owner; screenshots 375 px en/de).
3. `test(ch10): verify every stated number` (25°/65°, 0.72, PM computation, sim near critical, June's period, "most of a minute").
4. `feat(ch10): playable sentences and plays.ts` (P1–P7, all locales).
5. `feat(ch10): side trips A–E` (all locales).
6. `feat(ch10): phase and margins widgets draw what they measure` (readouts, arrows, statuses; all locales).
7. `feat(ch10): June's mistake opens the designer` (reorder, presets, lead sentence, reversed line fixed; all locales).
8. `feat(ch10): loop symbol, smoother term, frequency-response naming` (all locales; glossary).
9. `feat(ch10): quiz q2′ and map label` (all locales).
10. `docs: update Chapter 10 outline` (plan text: 13.8 s vs 6.6 s).

### Evidence for this phase

*Reviewer scope: `public/locales/en/ch10.json`, `src/chapters/ch10/{widgets.ts,shower-tools.ts,ch10.test.ts}`,
`src/sim/shower-model.ts`, `src/sim/delay-line.ts`, `src/math/bode.ts`, outline "### Chapter 10" in
`docs/course-plan.md`, concept-map nodes in `src/story/concept-map.ts:64-67,117-124`.
Checks: `$SCRATCH/checks/ch10-numbers.test.ts`, `ch10-extra.test.ts`, `ch10-misc.test.ts` (25 tests, all green;
raw values dumped to `ch10-out.txt` and `ch10-extra-out.txt`).
`SCRATCH=$SCRATCH`.*

#### 0. Snapshot

**Driving question** (`question`): "Why did we oscillate, and how close to the edge are we?"

**Sections in order**

| id | title | one line |
| --- | --- | --- |
| `again` | The shower, with new eyes | June put the drone PID on the shower and it swung; Theo names the 2.5 s delay; confession: Ch 0's normal hand was an I controller, `k = 0.8 %` of the knob per second per °C (unit note: 0.008 knob units). |
| `lag` | Delay is a lag in the wiggle | Theo's misconception ("a delay just makes everything slower"); pure-delay sine widget; `φ_deg = 360°·L/T`, `φ_rad = ωL`; 30 s wave → 30°, 5 s wave → 180°; note: delay rotates Ch 5's arrow by `ωL`, hence `e^{−Ls}`. |
| `bode` | Measuring the shower one wiggle at a time | Gain and phase defined in a two-item list; widget measures sine responses and drops dots; "Bode plot" named; `G(iω) = e^{−iωL}/(1+iωτ)` with `|G|` and `∠G` stated; note on 90° vs 450° ambiguity. |
| `margins` | How close to the cliff? | Loop `L(s) = k/s · 45e^{−2.5s}/(s+1)`; feedback flip + 180° lag = in-step pushes; worked example at 0.457 rad/s (90 + 25 + 65); vocab gain/phase margin; GM ≈ 1.4, PM ≈ 22°, harder hand 0.7; gated predict (double the delay); margins widget; Theo recants. |
| `replay` | Your Chapter 0 shower, explained | Learner's saved Ch 0 run (or the normal robot hand) with measured swing period vs two predictions: speed hand 13.8 s, position hand 6.6 s (`K ≈ 0.031` knob/°C); robot hand 15.5 s, harder 11.6 s. |
| `design` | Design a robot shower | PI explained in words; velocity-form note; June: "big gains, like on the drone"; PI designer; June: "…it swings exactly like we did"; Theo suggests `Kp ≈ 1`, `Ki ≈ 0.6`; unit note; 9.4 s comfort; Smith predictor aside; robustness note. |
| `wrap` | What we understand now | 5-item recap, 4 quiz items, map, cliffhanger to Ch 11. |

**Widgets**

| id | shows | controls | readouts / status |
| --- | --- | --- | --- |
| `phase` | input sine (orange `eff`) and the same sine delayed 2.5 s (blue `out`), 0–30 s, purple double arrow "2.5 s" between matching crests | slider "Wiggle period" 2–30 s, step 0.5, start 20 s | readout "phase lag" (red `err`) in degrees; status small/middle/flipped/full |
| `bode` | left: last measurement (mix temperature orange, head temperature blue); right: log-log gain plot and log-x phase plot with measured dots (blue) and optional dashed formula (`ink3`), red −180° line | log slider "Wiggle speed" 0.05–3 rad/s; buttons Measure / Measure 8 speeds / Clear; switch "Show the formula curve (needs 5 dots)" | status "At ω = … (a … s wiggle): gain …, phase …°" |
| `margins` | Bode gain and phase of the hand+shower loop, ghost of previous setting, markers "gain at −180°" and "phase margin"; 60 s temperature run | sliders "Hand speed k" 0.1–2 %/(°C·s), "Pipe delay" 1–5 s | gain margin ×, phase margin °, "edge (largest k)" %/(°C·s); status safe/edge/over |
| `replay` | saved Ch 0 run (or normal robot hand) temperature + knob's requested mix, 60 s | none | swing period (yours/robot), edge: speed hand 13.8 s, edge: position hand 6.6 s; verdict |
| `designer` | `ShowerView` (knob, pipe colour profile, head, thermometer) + 40 s temperature/mix plot with ghost | sliders `Kp` 0–6 %/°C, `Ki` 0–6 %/(°C·s); presets "The normal hand", "June's drone-style gains"; transport (play/pause, reset, step, speed) | phase margin, gain margin, comfortable after, you (Chapter 0); status unstable/edge/slow/win/winButYou; goal line |

**Predict card** `ch10-delay` (gated, `margins` block 6): double the pipe → largest stable hand gain goes down (1.12 → 0.60 %/(°C·s)).

**Misconception**: Theo, `lag` block 0: "a delay just makes everything *slower*. It shouldn't be able to make anything unstable." Resolved by Theo at `margins` block 8.

**Mistake**: June's "drone-style" gains in the designer (`design` blocks 2, 4). Only visible if the reader presses the preset (the widget opens on the normal hand).

**Quiz** (4): q1 2 s delay on 8 s period → 90°; q2 loop gain 0.5 at −180° → GM ×2; q3 why a longer pipe forces gentler control; q4 GM 1.4, react 1.5× harder → swings grow. Every option has a `why`.

**Map nodes**: `phaselag` "phase lag", `bode` "Bode plot", `margins` "gain/phase margin", `robust` "robustness"; links delay→phaselag, spin→bode, phaselag→bode, bode→margins, margins→robust, stability→robust, pid→robust, robust→you.

**Cliffhanger**: "We have every tool now … **Can you keep the drone at 2 m?**"

**Tests today** (`src/chapters/ch10/ch10.test.ts`): I-hand crossover 0.457 rad/s, 13.75 s, `kcrit` 0.01116; normal hand GM 1.395 / PM 22.4°, doubled hand unstable; doubled delay `kcrit` 0.00604; P-hand ω180 0.952, `Kcrit` 0.0307; simulated swing periods 15.5 s / 11.6 s, normal hand never comfortable within 60 s; PI (0.01, 0.006) PM 58.3°, GM 2.12, comfort 9.4 s; June's PI (0.05, 0.05) unstable; `measureSine` matches the formula at ω = 0.1, 0.4, 1, 2. Not covered: the 25°/65° split, 0.72, 30°/180°/90° examples, q4's growth, June's swing period, "most of a minute".

#### 1. Screenshots

All in `$SCRATCH/shots/ch10/` (30 files: full page + 5 widgets × {1280, 375} × {light, dark}, plus 3 interaction shots and 4 German 375 px shots).

- `1280-light-phase.png`: clean. Purple "2.5 s" arrow sits between matching crests. The readout "45°" is **red** (`err`), but a phase lag is not an error. Initial status "A lag of 45°: the water is noticeably out of step." At 45° that is fine.
- `375-light-phase.png`: no clipping, arrow label readable.
- `1280-light-bode.png`: **number mismatch.** The slider says "0.20 rad/s (period 31.2 s)" but the status says "(a 31.4 s wiggle)". The first measurement uses `w = 0.2` exactly, while the slider snaps to 0.34 on its 0–1 log scale, i.e. 0.2012 rad/s (`widgets.ts:108,201-202`). The gain axis runs 0.02–1.5 while the lowest gain in range is 0.316 at 3 rad/s, so the bottom 40 % of the plot is empty. Only two gain ticks (1, 0.1) and two ω ticks (0.1, 1): the log scale is never labelled at 2, 5, 0.2, 0.5.
- `1280-light-bode-swept.png`: after "Measure 8 speeds" + formula, the dashed formula runs through the dots and crosses −180° near ω ≈ 0.95. Nothing marks that crossing, although it is the P-hand edge the replay section uses later.
- `1280-light-margins.png`: good at 1280. Markers "gain at −180°" (red) and "phase margin" (blue dot on the curve) are shown, but neither **distance** is drawn (no arrow from the red dot up to the gain = 1 line, no arrow from the curve down to −180°). "Distance to the cliff edge" is the plan's picture and it is missing.
- `375-dark-margins.png`: **label collisions**: "gain at −180°" overprints "gain = 1", and "phase margin" overprints "−180°: the cliff".
- `375-light-de-margins.png`: the same collisions, worse in German ("Verstärkung bei −180°" on top of "Verstärkung = 1"; "Phasenreserve" on top of "−180°: die Klippe").
- `1280-light-replay.png` / `375-dark-replay.png`: fine. Readouts "15.5 s / 13.8 s / 6.6 s". With no saved run the verdict reads "as predicted", but the shown run is 15.5 s against a 13.8 s edge. The prose explains the gap and the widget doesn't.
- `1280-light-designer.png`: opens on the **normal hand** (`Kp 0`, `Ki 0.80`) right after June says "I'll use big gains". Her mistake isn't on screen until the reader finds the preset button. There is no Bode view in the designer, so the phase-margin readout isn't linked to a picture.
- `1280-light-designer-june.png`: June's preset gives bang-bang swings with the knob slamming 0↔1, period ≈ 6.3 s (verified, §8). The status "Over the cliff: no margin, endless swings." doesn't mention that the period matches the *position hand's* 6.6 s edge, not the Ch 0 robot hands' 15.5 s / 11.6 s.
- `375-light-de-designer-hud.png`: German readout labels hyphenate mid-word ("Phasenreser-ve", "Amplitudenre-serve"). Two presets wrap to two lines, which is fine.
- `375-light-designer.png`: `ShowerView` fits; legend wraps to two lines. OK.

Keyboard: every control is a native range/button/switch/radio and the snapshot shows accessible names. The Bode slider's `aria-valuetext` is "0.20 rad/s (period 31.2 s)" (good), though its `aria-valuenow` is the raw 0.34. Arrow keys work on all sliders. `margins` and `designer` recompute on every keyboard step. Keyboard steps in the designer never animate (`preview()` pauses the loop), as the rules require.

#### 2. Terms before use

| # | Term / symbol / formula / number | First appears | Status | Note |
| --- | --- | --- | --- | --- |
| 1 | "drone PID" on the shower | `again` b0 (June) | only stated | Drone gains are N/m, N·s/m. Nothing says how they were turned into knob units (5 %/°C). |
| 2 | 2.5 s pipe delay | `again` b1 | earned (Ch 0) | |
| 3 | knob speed `= k·e`, `k = 0.8 %` per s per °C | `again` b2 | earned | Matches `HAND_GAIN = 0.008` (`ch00/widgets.ts:23`). |
| 4 | "the knob position is the pile of past error" → I controller, `K_i = k` | `again` b2 | earned (Ch 3 area, Ch 9 I) | |
| 5 | 0.008 knob units | `again` b3 | earned | |
| 6 | pure delay | `lag` b1 | earned | |
| 7 | sine wave / wiggle | `lag` b1 | earned (Ch 5) | |
| 8 | **phase lag** | `lag` b3 | only stated | The formula defines it implicitly. No sentence says "360° = one whole wiggle = one full turn of Ch 5's spinner". Ch 5 measured angles in turns and radians only, never degrees. |
| 9 | `φ` | `lag` b3 | earned | |
| 10 | `T` (period) | `lag` b3 | earned, **symbol clash** | `T` is also temperature (`T_mix` in Ch 0, plot label). |
| 11 | `ω = 2π/T`, rad/s | `lag` b3 | earned (Ch 5, Ch 6) | |
| 12 | "on a phase plot, that appears as a negative angle" | `lag` b3 | used before defined | No phase plot has been shown yet. |
| 13 | `φ_deg = 360°L/T`, `φ_rad = ωL` | `lag` b4 | only stated | One step missing: "L/T is the fraction of a wiggle the delay covers". |
| 14 | 30 s → 30°, 5 s → 180° | `lag` b5 | earned (verified) | |
| 15 | "crest lines up with an input trough" | `lag` b5 | earned | |
| 16 | delay rotates `e^{iωt}` by `ωL` → `e^{−Ls}` | `lag` b6 | only stated | Skipped: `e^{iω(t−L)} = e^{−iωL}·e^{iωt}`, then `s = iω`. "Transfer function" comes from Ch 8, fine. |
| 17 | thermal response / "thermal lag" / "mixing" | `bode` b0, b4; `margins` b4 ("mixing adds about 25°") | **inconsistent** | Three names for one first-order block. Ch 0 calls it "mixing". Pick one ("the smoothing", τ = 1 s) and tie it to Ch 3's τ. |
| 18 | **gain** (output ÷ input amplitude) | `bode` b1 | earned | But "gain" already means controller gain (N/m) from Ch 2 on. One sentence should say they are the same idea (size out ÷ size in). |
| 19 | **phase** | `bode` b1 | only stated | "how far behind it is, as an angle". Needs #8. |
| 20 | "steady rhythm" (steady state) | `bode` b0 | earned | |
| 21 | log axes | `bode` widget `gainAria` "logarithmic axes" | **used, never explained** | The prose never mentions the squashed ruler. |
| 22 | **Bode plot** | `bode` b4 | earned (named after it's built) | |
| 23 | "gain 1 for slow wiggles", "45 times larger" | `bode` b4 | earned | |
| 24 | `G(iω)`, "set `s = iω`" | `bode` b4 | only stated | Ch 9 `poles` b9 already used `s = iω` for the edge. Say so. |
| 25 | `|G| = 1/√(1+ω²τ²)`, `∠G = −arctan(ωτ) − ωL` | `bode` b5 | **only stated** | The lag's own gain/phase are never derived. The Ch 4/5 "guess an exponential" route gives them in three lines (§5 side trip A). |
| 26 | τ | `bode` b5 | used before defined *in this chapter* | τ = 1 s is not stated anywhere in the Ch 10 prose. It only appears as the model value. Ch 3 introduced τ generally. |
| 27 | 90° vs 450° ambiguity, "whole extra cycles" | `bode` b6 | earned | Good honesty note. |
| 28 | loop `L(s)` | `margins` b1 | **symbol clash** | `L` is the delay (b4 of `lag`, the formula in `bode`). Now `L(s)` is the loop and the widget label is "loop gain |L|". |
| 29 | `k/s` "hand" | `margins` b1 | only stated | Why an accumulating hand is `k/s` (Ch 7/8 integrator = `1/s`) is not recalled. Its gain `k/ω` and 90° lag are not derived. |
| 30 | feedback subtracts → "flips the wave once" | `margins` b2 | earned-ish | Should say: ×(−1) is Ch 5's half-turn. |
| 31 | −180° → "perfectly in step … pushing a playground swing at just the right moment" | `margins` b2 | earned | Strong. Brief asked for "wrong moment" wording: here it is the *combined* push that lands at the right moment for growth, which is correct. |
| 32 | "If the loop also doesn't shrink the wave (gain ≥ 1), the swing grows by itself" | `margins` b2 | imprecise | At exactly 1 it neither grows nor shrinks. Recap item 3 gets it right. |
| 33 | "one relevant wiggle speed" (phase crossover) | `margins` b3 | earned | |
| 34 | 0.457 rad/s, 90° + 25° + 65° = 180° | `margins` b4 | only stated | Numbers correct (24.6° + 65.4°). The 90° of the "accumulating hand" is unexplained (see #29). |
| 35 | 0.72, 1 ÷ 0.72 ≈ 1.4 | `margins` b4 | earned (verified 0.717, 1.395) | |
| 36 | **gain margin** | `margins` b5 | earned | Words plus the 1.4 example. |
| 37 | **phase margin** | `margins` b5 | earned in words, number stated | 22° is given, never computed on the page (ωc = 0.341 rad/s, loop phase −157.6°). |
| 38 | "45°–60° is a common target" | `margins` b5 | **rule of thumb, no reason** | Bridge to Ch 6 ζ: PM ≈ 43°/52°/59° ↔ ζ ≈ 0.4/0.5/0.6 for the standard 2nd-order loop (verified). |
| 39 | 13.8 s, GM 1.4, PM 22°, harder 0.7 | `margins` b6 | earned (verified) | |
| 40 | 1.12 → 0.60 %/(°C·s) | `margins` b7 (predict why) | earned (verified) | "the hand's pile (k/s) is big" at slow speeds needs #29. |
| 41 | "eats phase margin" | `margins` b9 | earned | |
| 42 | speed hand / position hand | `replay` b2 | earned | |
| 43 | P hand `L(s) = 45K e^{−2.5s}/(s+1)`, 0.95 rad/s, 6.6 s, `K ≈ 0.031` knob/°C | `replay` b2 | only stated (verified) | Why the 90° of the hand vanishes (P has no pile) goes unsaid. That one sentence explains why the P edge is twice as fast. |
| 44 | 15.5 s "just inside the edge"; 11.6 s "squashed by the knob hitting its ends" | `replay` b2 | earned (verified: small-signal 15.5 s, harder hand saturates 0↔1) | |
| 45 | PI: P = current error, I = accumulated | `design` b0 | earned (Ch 9) | |
| 46 | **phase lead** | `design` b0 | **used, never defined** | "Compared with I alone, P can add phase lead." (verified: +37.3° at 0.457 rad/s for Kp 1 %, Ki 0.6 %). |
| 47 | "phase margin above 45°", "10 s in band starting within 12 s" | `design` b0 | earned | Matches `comfortTime` semantics. |
| 48 | velocity-form PI note | `design` b1 | only stated | Heavy for beginners. Move to a side trip. |
| 49 | Kp units %/°C, Ki %/(°C·s) | `design` b6 (note), slider units | earned, but **after** the widget and Theo's suggestion | Move before the widget. |
| 50 | "Big gains pushed the −180° speed past the point where the loop gain is 1" | `design` b4 | **reversed** | For June's gains, gain crossover ωc = 2.25 rad/s is past ω180 = 0.628 rad/s. The gain-of-1 speed moved past the −180° speed, not the other way round. |
| 51 | `Kp ≈ 1`, `Ki ≈ 0.6` | `design` b5 | earned (verified PM 58°, GM 2.1) | |
| 52 | 9.4 s; "normal hand … most of a minute swinging" | `design` b7 | earned (verified 9.4 s; normal hand comfortable from 50.5 s) | |
| 53 | Smith predictor | `design` b7 | only stated (acceptable "where next") | |
| 54 | **robust / robustness** | `design` b5 (Theo), b8 note | earned in words | No number shows it. A delay margin (3.5 s vs 1.1 s, verified) would make it concrete. |
| 55 | **frequency response** | `wrap` recap item 2 | **used before defined** | First and only appearance is in the recap. Also a map node. |

##### Where a curious beginner gets stuck

1. **Degrees of phase.** Ch 5 taught turns and radians, never degrees. The reader meets "45°" for a delay with no sentence tying 360° to one wiggle. *Fix:* one sentence plus a playable (`delaylag`, §4): "One whole wiggle is one full turn of Chapter 5's spinner: 360°. A delay that covers a quarter of a wiggle turns the arrow a quarter-turn back: 90°."
2. **Why `ωL`, not just `L`.** The formula appears without the step "L/T is the fraction of a wiggle". *Fix:* write `φ = 360°·(L/T)` as "(fraction of a wiggle) × 360°" before the radians line, and derive `ωL = 2π·L/T` in one line.
3. **Where `1/√(1+ω²τ²)` and `−arctan(ωτ)` come from.** This is the biggest wall: the Bode curve "just appears". *Fix:* side trip A (§5), "What the smoother does to a spinner", guess-an-exponential in three lines with a playable (`smoother`).
4. **Why the hand is `k/s` and lags 90°.** The worked example says "the accumulating hand lags by 90°" and the predict card says "at slow speeds the hand's pile is big". Neither is shown. *Fix:* side trip B, "The pile of a wiggle": the pile (area) of a cosine is a sine, a quarter-turn behind. It is also bigger for slow wiggles, by `1/ω` (Ch 5: velocity = iω × position, so the pile is position ÷ iω).
5. **The two `L`s.** `L` = 2.5 s delay, then `L(s)` = the loop, then "loop gain |L|". *Fix:* rename the loop (e.g. `G_{\text{loop}}(s)` or "the loop, $\ell(s)$") in prose, math and the widget label.
6. **Log axes.** Gain and ω are on squashed rulers, and nothing says so. *Fix:* side trip C, "The squashed ruler": each step is ×10; that's how 0.05 and 3 rad/s fit on one plot.
7. **"Phase lead".** It appears once with no meaning. *Fix:* "P reacts to *now*, I to the *pile*. Mixing some *now* into the pile makes the knob move a little earlier: that's **phase lead**. With Kp = 1 % and Ki = 0.6 % it gives back about 37° at the old −180° speed."
8. **Why 45–60°.** *Fix:* side trip D (Ch 6 bridge): "phase margin ≈ damping in disguise".
9. **"Frequency response".** It first appears in the recap. *Fix:* name it in `bode` b4, where the Bode plot is named.
10. **June's mistake isn't on the page.** The widget starts on the normal hand. *Fix:* open the designer on June's gains (or auto-apply her preset), then let Theo propose the gentle ones.

#### 3. Explanation gaps

**Bridges back**

- **Ch 3 (τ, steps, area).** τ = 1 s is never stated in Ch 10 prose. It should appear as "Chapter 3's time constant: the smoother needs about 1 s to get 63 % of the way". The I hand as "pile = area under the error" is used (`again` b2) but the area-of-a-sine step (item 4 above) is skipped.
- **Ch 4 (guess an exponential).** The frequency response of the lag is exactly "guess `A e^{iωt}`, plug in, solve for A". It's the chapter's best chance to reuse Ch 4/5's trick, and it's skipped.
- **Ch 5 (spinners, ×(−1) = half turn, ×i = quarter turn, velocity = iω × position).** Used once (`lag` b6 note). Missing: (a) feedback's minus sign is Ch 5's half-turn (`margins` b2); (b) the integrator ÷iω is a quarter-turn back and ÷ω in size (`margins` b4); (c) degrees = fraction of a full turn.
- **Ch 6 (ωn, ζ, modes).** PM 45–60° ↔ ζ 0.4–0.6 (verified) turns the rule of thumb into something the reader already knows (overshoot 25 % → 10 %). Also: the hunting period 13.8 s is the period of a mode sitting *on* the vertical axis.
- **Ch 7/8 (transfer function, `1/s` integrator, poles).** "`k/s` hand" should recall Ch 7's `1/s` = "pile up". One sentence could link margins to poles: "gain margin 1 means a pole pair is sitting on the vertical line of the map of s at ±0.457i" (true by construction: the edge is where `1 + L(iω) = 0`).
- **Ch 9 (`s = iω` for the edge).** Ch 9 `poles` b9 already set `s = iω` to find the I-gain limit. Ch 10 `bode` b4 should say "the same trick as Chapter 9's edge".
- **Ch 0.** The `broken` section's "about 3½ s" shift (2.5 s delay + ≈ 1 s smoothing) is the same fact as "slow wiggles lag by about `L + τ`". Verified: at ω = 0.1 the lag is 20.0° ≈ 360°·3.5/62.8 = 20.1°. It's a lovely callback that nothing uses.

**Skipped derivations (named steps)**

1. `e^{iω(t−L)} = e^{−iωL} e^{iωt}` (delay = rotate by −ωL) → with `s = iω`, `e^{−Ls}` (`lag` b6).
2. `τẏ + y = u`, `u = e^{iωt}`, guess `y = A e^{iωt}` → `A = 1/(1+iωτ)` → `|A|`, `∠A` (`bode` b5).
3. Area of `cos ωt` is `sin(ωt)/ω`: 90° behind, `1/ω` big (`margins` b4, predict why).
4. Phase margin 22°: `ωc` from `|L| = 1` (0.341 rad/s), loop phase −157.6° → 180 − 157.6 = 22.4° (`margins` b6).
5. P hand: no pile, so no 90°; the pipe + smoother alone must reach 180° → higher ω (0.952) → shorter period (6.6 s) (`replay` b2).
6. June's loop: with `Ki/Kp = 1/τ`, the PI zero cancels the smoother pole, leaving `2.25 e^{−2.5s}/s`. So ω180 = π/5 = 0.628 rad/s and GM = 0.28 (verified). Optional side trip; it's elegant but not needed.

**Rules of thumb given without a reason**

- "More is safer; 45°–60° is a common target." (`margins` b5, vocab) → give the ζ bridge.
- "Aim for a **phase margin above 45°**" (`design` b0) → same.
- "Try about Kp ≈ 1 and Ki ≈ 0.6" (`design` b5) → fine as a hint, but nothing says why these (PM 58°, GM 2.1, delay margin 3.5 s, verified).
- "Robustness is the real lesson. Your model … is never perfect: the pipe might be longer" (`design` b8) → quantify with the delay margin: the gentle robot survives a pipe 3.5 s longer, the normal hand only 1.1 s.

#### 4. Playable-number opportunities

All maths goes in a new `src/chapters/ch10/plays.ts` (register `plays: () => import('./ch10/plays')` for `ch10` in `src/chapters/registry.ts`). All outputs use `fmt()`.

##### P1 `delaylag`: delay as a fraction of a wiggle (Impact High, Size S)
- **Sentence:** "A {scrub|L|dis} s delay on a wiggle that repeats every {scrub|T} s covers {calc|frac} of a wiggle, so the output trails by {calc|deg}°, or {calc|rad} radians."
- Inputs: `L` 0.5–5, step 0.5, initial 2.5, unit s; `T` 2–30, step 0.5, initial 10, unit s.
- Outputs: `frac = L/T` (2 decimals); `deg = 360·L/T` (0 decimals); `rad = 2π·L/T` (2 decimals).
- Placement: `lag`, after the math block (b4), replacing the first sentence of b5 ("For a slow 30-second wiggle …"). Keep the 180° / crest-trough sentence.
- Verified at initial: 0.25, 90°, 1.57 rad (`ch10-misc.test.ts` play outputs; `ch10-numbers.test.ts:122`). Other checks: (2.5, 30) → 30°, (2.5, 5) → 180°, (2, 8) → 90° (quiz q1).

##### P2 `smoother`: the lag block's own gain and phase (Impact High, Size S)
- **Sentence:** "At ω = {scrub|w} rad/s, the smoother (τ = 1 s) keeps {calc|g} of the wiggle and lags it by {calc|lag}°."
- Input `w` 0.05–5, step 0.05, initial 1, unit rad/s.
- Outputs: `g = 1/√(1+w²)` (2 decimals); `lag = atan(w)·180/π` (0 decimals).
- Placement: inside side trip A (§5) in `bode`.
- Verified at initial: 0.71, 45° (`ch10-extra.test.ts:51-52`). At ω = 10: 0.0995 (≈ 1/ω), 84.3°. At ω = 0.1: 0.995, 5.7°.

##### P3 `total`: find the −180° speed of the shower by hand (Impact High, Size S)
- **Sentence:** "At ω = {scrub|w} rad/s the pipe lags {calc|pipe}° and the smoother {calc|lag}°: {calc|total}° in all. {calc|verdict}"
- Input `w` 0.1–2, step 0.01, initial 0.5, unit rad/s.
- Outputs: `pipe = 2.5w·180/π` (0 decimals); `lag = atan(w)·180/π` (0); `total = pipe + lag` (0); `verdict` = `plays.total.flip` ("Upside down: a crest comes out as a trough.") when |total − 180| < 3, `plays.total.before` ("Not upside down yet.") below, `plays.total.past` ("Past upside down.") above.
- Placement: `bode`, directly after the math block b5.
- Verified at initial: 72°, 27°, 98° (`ch10-out.txt` "shower phase at 0.5": 71.6 / 26.6 / 98.2). At 0.95: 136°, 44° (43.5), 180° (179.6) → flip (`ch10-misc.test.ts`). Exact crossing 0.952 rad/s, where the shower's gain is 0.724 (`ch10-numbers.test.ts` "shower-only −180").

##### P4 `handloop`: replaces the static worked example (Impact High, Size S)
- **Sentence:** "At ω = {scrub|w} rad/s the hand's pile lags 90°, the smoother {calc|lag}°, the pipe {calc|pipe}°: {calc|total}° in all. There the normal hand's loop returns a swing {calc|g} times as big."
- Input `w` 0.2–0.8, step 0.01, initial 0.30, unit rad/s.
- Outputs: `lag = atan(w)` in ° (0 decimals); `pipe = 2.5w` in ° (0); `total = 90 + lag + pipe` (0); `g = 0.36/(w·√(1+w²))` (2 decimals).
- Placement: `margins`, replacing b4 ("For example, near 0.457 rad/s …"). Follow with a fixed sentence: "Slide until the total reads 180°: near 0.457 rad/s the swing comes back 0.72 times as big, so the hand could be about 1 ÷ 0.72 ≈ 1.4 times stronger before reaching the edge."
- Verified: at 0.30 → 17°, 43°, 150°, 1.15 (`ch10-misc.test.ts`). At 0.46 → 25°, 66°, 181°, 0.71. At the exact 0.4569 → 24.6°, 65.4°, 180°, 0.717 (`ch10-numbers.test.ts:29-34`).

##### P5 `pgain`: the position hand over the cliff (Impact Medium, Size S)
- **Sentence:** "A position hand with K = {scrub|K|eff} knob per °C: at the −180° speed (0.95 rad/s) its loop returns a swing {calc|g} times as big. {calc|verdict}"
- Input `K` 0.005–0.05, step 0.001, initial 0.020.
- Outputs: `g = K/0.030686` (2 decimals); `verdict` "The swings die away." (g < 0.98) / "Right on the edge: swings that neither grow nor shrink." (0.98–1.02) / "The swings grow." (> 1.02).
- Placement: `replay`, after b2.
- Verified: 0.020 → 0.65 (dies); 0.030 → 0.98; 0.031 → 1.01; 0.040 → 1.30 (`ch10-out.txt` "P K=…"). Simulated with the real sim: 0.97 × Kcrit decays (ratio 0.26 over 140 s), 1.03 × Kcrit grows (×3.9), period 6.6 s (`ch10-numbers.test.ts:150-158`).

##### P6 `double`: the predict card's claim, playable after the reveal (Impact High, Size S)
- **Sentence:** "With a {scrub|L|dis} s pipe, the speed hand's edge is k = {calc|k} %/(°C·s), and at the edge it swings every {calc|T} s."
- Input `L` values `[1, 1.5, 2, 2.5, 3, 4, 5]`, initial 2.5, unit s.
- Outputs: solve `atan(ω) + ωL = π/2` by bisection; `k = 100·ω√(1+ω²)/45` (2 decimals); `T = 2π/ω` (1 decimal).
- Placement: `margins`, right after the margins widget (after b7), before Theo's recant.
- Verified: 2.5 → 1.12, 13.8 s; 5 → 0.60, 23.9 s; 1 → 2.52; 2 → 1.36; 3 → 0.95; 4 → 0.74 (`ch10-out.txt` "I kcrit … at L=").

##### P7 `delaymargin`: robustness as a number (Impact High, Size M)
- **Sentence:** "With Kp = {scrub|kp|eff} % and Ki = {scrub|ki|eff} %, the phase margin is {calc|pm}° at {calc|wc} rad/s, so the pipe could get {calc|dm} s longer before this robot starts to hunt."
- Inputs `kp` 0–3, step 0.1, initial 1.0 (%/°C); `ki` 0.1–1.5, step 0.05, initial 0.6 (%/(°C·s)).
- Outputs from `loopMargins(piLoop(kp/100, ki/100), 2.5)`: `pm` (0 decimals), `wc` (2), `dm = (pm·π/180)/wc` (1). When `gm ≤ 1`: `plays.delaymargin.none` ("none: it already hunts").
- Placement: `design`, replacing the robustness note b8 (keep its first sentence).
- Verified: (1.0, 0.6) → 58°, 0.29 rad/s, 3.5 s. Normal hand (0, 0.8) → 22°, 0.34 rad/s, 1.1 s. Adding that delay drives PM to 0 and GM to 1.00 (`ch10-extra.test.ts:21-30`).

#### 5. Side trips

Callout blocks (`{ t: 'callout', title, blocks: [...] }`, as in `ch06.json:75`).

##### A. "What the smoother does to a spinner" (Impact High, Size S)
- **Proves:** `|G| = 1/√(1+ω²τ²)` and `∠G = −arctan(ωτ)`.
- **Where:** `bode`, immediately before the `G(iω)` math block (b5).
- **TeX:** `\tau\,\dot y + y = u,\quad u = e^{i\omega t},\ y = A\,e^{i\omega t} \;\Rightarrow\; (1 + i\omega\tau)\,A = 1 \;\Rightarrow\; A = \frac{1}{1+i\omega\tau}`
- **Play:** P2 `smoother`.
- **Prose:** "Theo: 'Chapter 4's trick again: guess the answer is the same spinner, just a different size and angle.' Put the spinner $e^{i\omega t}$ into the smoother's rule and the arrow $A$ must satisfy $(1 + i\omega\tau)A = 1$. The arrow $1 + i\omega\tau$ has length $\sqrt{1+\omega^2\tau^2}$ and points up at the angle $\arctan(\omega\tau)$. Dividing by it shrinks by that length and turns back by that angle. Slow wiggles barely notice. Fast ones get squashed and lag towards a quarter-turn, but never past it."

##### B. "The pile of a wiggle" (Impact High, Size S)
- **Proves:** an accumulating hand `k/s` lags every wiggle by exactly 90° and boosts it by `k/ω`. That's why slow wiggles get the biggest push, as the predict card and q3 claim.
- **Where:** `margins`, after the loop math block (b1).
- **TeX:** `\int \cos(\omega t)\,dt = \frac{\sin(\omega t)}{\omega} \qquad\Longleftrightarrow\qquad \frac{1}{i\omega}:\ \text{a quarter-turn back, } \tfrac{1}{\omega}\text{ as big}`
- **Prose:** "Mika: 'My hand piles up error. What does a pile do to a wiggle?' The area under a cosine is a sine, a quarter-wiggle behind: 90° of lag, at *every* speed. And the pile is bigger for slow wiggles, because each hump lasts longer before it cancels: the size goes like $1/\omega$. Chapter 5 said velocity is $i\omega$ times position. Piling up is the reverse: divide by $i\omega$."

##### C. "The squashed ruler" (Impact Medium, Size S)
- **Proves:** why Bode axes are logarithmic; reading ×10 steps.
- **Where:** `bode`, after the widget (before b4).
- **Prose:** "On these plots, each big tick is ten times the last: 0.1, 1, 10. The halfway point between 0.1 and 1 is about 0.3, not 0.55. The ruler is squashed so that a 60-second wiggle and a 2-second wiggle fit on the same page. Look at the smoother's gain on this ruler. It is flat for slow wiggles and slides down in a straight line for fast ones, with a bend near $\omega = 1/\tau$."
- Verified: 0.71 at ω = 1/τ; 0.0995 at ω = 10 (≈ 1/ω, the straight line) (`ch10-extra.test.ts:48-53`).

##### D. "Phase margin is damping in disguise" (Impact Medium, Size S)
- **Proves:** a reason for the 45°–60° rule.
- **Where:** `margins`, after the vocab block (b5).
- **Prose:** "June: 'Why 45° to 60°? Who picked that?' For the simple loops of Chapter 6, phase margin and damping ratio move together. About 43° goes with ζ = 0.4 (25 % overshoot), 52° with ζ = 0.5 (16 %), and 59° with ζ = 0.6 (under 10 %). A margin of 45°–60° is the ζ ≈ 0.4–0.6 sweet spot from Chapter 6, measured in degrees."
- Verified with the standard loop `ωn²/(s(s+2ζωn))` (`ch10-extra.test.ts:10-19`): ζ 0.4 → 43.1°, 25.4 %; 0.5 → 51.8°, 16.3 %; 0.6 → 59.2°, 9.5 %. State it as "for the simple loops of Chapter 6", not as a law for the shower.

##### E. "Shorter pipe or faster heater?" (false-obvious; Impact Medium, Size S)
- **Proves:** delay dominates; the smoother is a minor player. For a P hand, a faster smoother even makes things *worse*.
- **Where:** `design`, after b7 (next to the Smith predictor sentence).
- **Prose:** "Mika: 'Can we just buy a faster heater?' Halving the smoothing time (τ = 0.5 s) lifts the speed hand's edge only from 1.12 to 1.21 %/(°C·s). Halving the pipe (1.25 s) lifts it to 2.06. For a position hand, the faster heater is even *worse*: its edge drops from 0.031 to 0.025 knob per °C, because the smoother was quietly shrinking fast wiggles. Delay is the enemy, not sluggishness."
- Verified: `ch10-numbers.test.ts:69-85`, `ch10-misc.test.ts:18-21`.

##### F. (optional) "Why June's gains hunt at 10 s on paper but 6.3 s in the shower" (Impact Low, Size S)
- **Where:** `design`, after June's second line.
- **Prose:** "June's gains have $K_i/K_p = 1$, which is exactly $1/\tau$. The PI's zero sits on the smoother's pole and cancels it, leaving $2.25\,e^{-2.5s}/s$. On paper that edge is at $\omega = \pi/5$, a 10 s swing. But her loop is far past the edge, so the knob slams from end to end. Those slammed swings come every 6.3 s, close to the position hand's 6.6 s."
- Verified: ω180 = 0.6283 = π/5, GM 0.279 (`ch10-extra.test.ts:40-42`); simulated period 6.27 s (40 s run), 6.31 s (90 s), knob 0↔1 (`ch10-out.txt`).

#### 6. Widget polish

##### `phase`
- **Colour language:** the readout "phase lag" is `err` red (`widgets.ts:61`), but a phase lag is not an error. Use `dis` (the delay's purple, matching the arrow) or neutral ink.
- **Status wording:** "flipped" fires for wrapped lags within ±20° of 180° (`widgets.ts:95`), so 164° (5.5 s) and 200° (4.5 s) both say "Upside down! Hot arrives *exactly* when the knob says cold." Narrow it to ±5°, or drop "exactly". At 2 s (450°) the status reads "A lag of 450°: the water is noticeably out of step." Add a key for more than a whole wiggle that isn't in step: "A lag of {d}°: more than a whole wiggle late, and a quarter out of step on top." (All statuses listed in `ch10-extra-out.txt`.) Also, `full` requires `deg > 300` and `wrapped > 315`, so it never fires on 0.5 s steps except at 2.5 s. Fine as is; keep the logic but add a unit test.
- **Missing readouts:** ω (rad/s) and "fraction of a wiggle" (L/T). The prose defines both right after the widget. Proposed readouts: "wiggle speed ω" `fmt(2π/T, 2)` rad/s, and "share of a wiggle" `fmt(L/T, 2)`. That links the picture to both formulas in `lag` b4.
- **Linked representation chance:** a small Ch 5 spinner pair (input arrow, output arrow turned back by ωL) beside the plot. This is the plan's "half-turn for a fast one". Medium size; reuse the Ch 5 spinner drawing if it's a shared component.
- **Status:** add the verdict of the model, e.g. `status.middle`: "{d}°: the output trails by {f} of a wiggle."
- **Keyboard:** fine (native range, step 0.5).

##### `bode`
- **Bug (Impact High, Size S):** the initial measurement is at `w = 0.2`, but the slider shows 0.2012 (31.2 s vs 31.4 s in the status). Fix: `w = wFromSlider(snappedInitial)` or format the status from the same value (`widgets.ts:108,201`).
- **Axes:** gain y-range 0.02–1.5 → 0.2–1.2 (min gain in range is 0.316 at 3 rad/s). Add minor log ticks (0.2, 0.5, 2) on the x axis and label them, which supports side trip C. Add a −90° and −270° tick? No: keep 0/−180/−360/−540 but add a vertical dashed marker where the formula crosses −180° (0.952 rad/s), label "upside down at 0.95 rad/s", shown once the formula is on. The replay section's 6.6 s depends on that dot.
- **Formula colour:** `ink3` dashed is fine (it's a reference, not a signal). The measured dots are `out` blue, correct.
- **Status line:** after the formula is shown: "The formula runs right through your dots. It crosses −180° at 0.95 rad/s: a 6.6 s wiggle comes back upside down." (verified 0.952, 6.60 s).
- **"Measure 8 speeds"** measures 0.07–2.5 rad/s, then re-measures the current slider value, so the ninth dot can duplicate. Harmless.
- **Keyboard:** slider `aria-valuenow` is the raw log fraction (0.34); `aria-valuetext` is right. OK.
- **Link to P3:** when the reader scrubs P3's ω, highlight that ω on the phase plot. Nice-to-have (Low, M).

##### `margins`
- **Collisions at 375 px (Impact High, Size S):** "gain at −180°" over "gain = 1", and "phase margin" over "−180°: the cliff" (`375-dark-margins.png`, `375-light-de-margins.png`). Fix: move the line labels to the left end (`labelAt: 'start'`) or put the marker labels below the point when the line label is on the right. Check the Plot label-avoidance API.
- **Draw the distances (Impact High, Size S):** a vertical double arrow from the red dot to the gain = 1 line, labelled "× 1.40", and a vertical arrow from the blue dot down to −180°, labelled "22°". That is the plan's "distance to the cliff edge". Today the reader has to infer it.
- **Symbol clash:** label "loop gain |L|" → "loop gain" (drop `|L|`), or rename to the new loop symbol (§2 #28).
- **Readouts:** add "−180° speed" (rad/s) and "hunting period 2π/ω" (s). The replay section's 13.8 s is born here. Verified: 0.457 rad/s, 13.8 s at L = 2.5; 0.263 rad/s, 23.9 s at L = 5.
- **Status line:** make it true and specific: `edge`: "Close to the edge: phase margin {p}°, gain margin ×{g}. Expect long, lazy swings about every {T} s." (15.5 s for the normal hand, verified in the small-signal sim). `over`: "Over the cliff (gain margin ×{g}): the swings grow until the knob hits its ends."
- **Colour:** delay slider `dis` purple, k slider `eff` orange. That's consistent. The `crit` readout is orange, which is fine.
- **Ghost:** works (`fresh` flag).
- **Page physics:** not applicable. There is no moving object that leaves the picture (rule 7: the model's output is a temperature, with no page geometry to reach).

##### `replay`
- **Verdict (robot case)** says "as predicted" while showing 15.5 s against a 13.8 s edge. Proposed `verdict.robot`: "The robot hand swings every {p} s. That's a bit slower than the 13.8 s edge, because it sits just inside it: a speed hand (an I controller)."
- **Readout colours:** both predictions are `err` red. A prediction isn't an error; use neutral ink, or ghost style for "predicted" vs blue for "measured".
- **Add a mark:** a horizontal bracket over one measured swing on the plot, labelled with the period, so "15.5 s" is visible in the picture.
- **Link:** a P5 `pgain` sentence under it (§4).

##### `designer`
- **Mistake on the page (Impact High, Size S):** open with June's preset (kp 0.05, ki 0.05), so her line "…it swings exactly like we did" follows what the reader just saw. Keep "The normal hand" as the second preset, and add a third, "Theo's gentle gains" (1 %, 0.6 %).
- **Units before the widget:** move the `design` b6 note ("These slider numbers are percentages…") before the widget and merge it with the goal line.
- **June's line is reversed** (§2 #50). Proposed: "…it hunts, hot–cold–hot, every 6 seconds. Big gains pushed the gain-of-1 speed past the −180° speed. No phase margin at all."
- **"exactly like we did":** June's run swings every ≈ 6.3 s. That matches a *position* hand (6.6 s), not the Ch 0 robot hands (15.5 s / 11.6 s). Say "like a position hand in Chapter 0", or have the status report the measured period.
- **Status line:** `unstable`: "Over the cliff (gain margin ×{g}): it hunts every {p} s, the knob slamming end to end." (June: ×0.28, 6.3 s.) `edge`: "Stable, but only {pm}° of phase margin: more margin please."
- **Linked representation (Impact Medium, Size M):** a mini loop Bode (phase only, with −180° and the PM arrow) under the plot, sharing `marginPlots()`. Then the "phase margin" readout has a picture.
- **Readout "comfortable after":** red dashed border ('bad') even at the start. Fine.
- **German HUD:** readout labels break mid-word ("Phasenreser-ve"). Allow the label to wrap at spaces only (`hyphens: manual` for `.readout .label`), or shorten the de strings.
- **Challenge difficulty:** only 20 of 930 slider-grid points (Kp 0–3 step 0.1, Ki 0.05–1.5 step 0.05) meet the goal. The best is Kp 0.9, Ki 0.5 → 6.7 s, PM 66°. The winning set is patchy because `comfortTime` jumps when an overshoot grazes 39 °C (e.g. 0.8/0.45 → 11.7 s, 0.8/0.50 → 6.9 s). Consider showing "best so far" and a hint when PM > 45° but comfort > 12 s: "Safe, but slow. Try a little more I." (verified list in `ch10-extra-out.txt`).
- **Page physics:** not applicable (no object can leave the picture; rule 7).

#### 7. Pedagogy checklist

| Item | Status | Note |
| --- | --- | --- |
| Driving question | present | "Why did we oscillate, and how close to the edge are we?" Good; the answer arrives in `margins`/`replay`. |
| Feel-it interactive first | present | `phase` comes before any formula. |
| Gated predict-then-reveal | present | `ch10-delay`, gated, before the margins widget that has the delay slider. Good. |
| One idea per section | weak | `bode` packs gain, phase, Bode plot, log axes, the lag formula and phase unwrapping. `design` packs PI, velocity form, units, mistake, Smith predictor, robustness. Side trips A/C and moving the velocity-form note to a callout fix this. |
| Misconception AND on-page mistake | weak | Theo's misconception is voiced and recanted (good). June's mistake is only on screen if the preset is clicked, and her diagnosis line is reversed (§2 #50). |
| Recap | present | 5 items; item 2 names "frequency response" for the first time (move it into `bode`). |
| 2–4 quiz items, why for every option | present | 4 items, all whys present and correct (verified q1 90°, q2 ×2, q4 1.5 > 1.395 → grows). The plan's check 2 ("read margins off a Bode plot") and check 4 (mini-challenge) are only in the widget. |
| Concept-map nodes | present | 4 nodes. Missing: "frequency response" (the plan's label is "Frequency response / Bode plot"); consider relabelling `bode` → "frequency response / Bode plot". |
| Cliffhanger | present | Good hand-off to Ch 11. |

**Proposed quiz changes**

Replace q2 with a read-off item (keeps 4 items). Use a static sketch key if the `sketch` system supports Bode shapes; otherwise use numbers:

- **q2′** "On a loop's Bode plot, the phase reaches −180° at 0.5 rad/s, where the loop gain is 0.25. At the speed where the loop gain is 1, the phase is −130°. What are the gain and phase margins?"
  - "× 4 and 50°" (correct). *Why:* "The gain could grow 1 ÷ 0.25 = 4 times before it reaches 1 at −180°, and −130° is 50° short of −180°."
  - "× 0.25 and 130°". *Why:* "Those are the raw readings. Margins are the *distances* to the cliff: 1 ÷ 0.25 and 180° − 130°."
  - "× 4 and 130°". *Why:* "The gain margin is right, but phase margin is the extra lag you could add before reaching −180°: 180° − 130° = 50°."
  - Verified: `ch10-misc.test.ts:13-17`.

Optional 5th (only if q2 is kept; otherwise swap for q3): a false-obvious item.
- **q5** "Your shower hunts. Which change buys the most room for a speed hand: halving the heater's smoothing time, or halving the pipe?"
  - "Halving the pipe" (correct). *Why:* "The edge rises from 1.12 to 2.06 %/(°C·s). The delay adds lag that grows without limit; the smoother's lag never passes 90°."
  - "Halving the smoothing time". *Why:* "It helps a little (1.12 → 1.21), because the smoother adds at most a quarter-turn of lag."
  - "Both help equally". *Why:* "They don't: at the edge, the pipe contributes about 65° of lag and the smoother only about 25°."
  - Verified: `ch10-misc.test.ts:18-21`, `ch10-numbers.test.ts:29-30`.

#### 8. Numerical claims (verified)

Test files are under `$SCRATCH/checks/`. "n" = `ch10-numbers.test.ts`, "x" = `ch10-extra.test.ts`, "m" = `ch10-misc.test.ts`.

| Claim | Expected value | Method (test file + line) | Result |
| --- | --- | --- | --- |
| Ch 0 normal hand `k` | 0.008 knob/(°C·s) = 0.8 % | read `ch00/widgets.ts:23` | ✓ |
| 30 s wiggle, 2.5 s delay → 30° | 30° | n:118 | ✓ |
| 5 s wiggle → 180° | 180° | n:119 | ✓ |
| q1: 2 s at 8 s → 90° | 90° | n:120 | ✓ |
| phase widget initial (20 s) → 45° | 45° | n:121 | ✓ |
| `|G(iω)|`, `∠G(iω)` analytic = `sweep` = `measureSine` | e.g. ω=0.1: 0.995, −20.0°; ω=0.4: 0.929, −79.1°; ω=1: 0.707, −188.2°; ω=2: 0.447, −349.9°; ω=3: 0.316, −501.3° | n:98-110 (8 ω values, gain to 2 d.p., phase to 1°) | ✓ |
| slow wiggles lag ≈ L+τ (Ch 0's "3½ s") | ω=0.1: 20.0° vs 360·3.5/62.8 = 20.1° | n:98 dump | ✓ |
| shower alone reaches −180° | ω = 0.952 rad/s, gain 0.724 | n:112 dump | ✓ |
| I hand ω180 | 0.4569 rad/s | n:24 (analytic bisection = `margins()`) | ✓ |
| I hand hunting period | 13.75 s (shown 13.8) | n:25 | ✓ |
| I hand critical k | 0.01116 (1.12 %/(°C·s)) | n:26 | ✓ |
| split at ω180: smoother / pipe | 24.6° / 65.4° ("about 25°, 65°") | n:29-30 | ✓ |
| normal hand loop gain at ω180 | 0.717 ("0.72") | n:34 | ✓ |
| normal hand GM | 1.395 ("1.4") | n dump, existing test | ✓ |
| normal hand PM | 22.4° at ωc = 0.341 rad/s | n:37-38 | ✓ |
| harder hand GM | 0.698 ("0.7") | n:40 | ✓ |
| doubled delay critical k (I hand) | 0.00604 (0.60 %/(°C·s)); ω180 0.263, period 23.9 s | n:58-59 | ✓ |
| doubled delay, P hand (false-obvious: drops much less) | 0.0307 → 0.0252 (−18 %) vs I hand −46 % | n:60, dump | ✓ |
| P hand ω180 / period / Kcrit | 0.9523 rad/s / 6.598 s / 0.03069 knob/°C | n:46-50 | ✓ |
| P hand split at ω180 | smoother 43.6°, pipe 136.4° | n dump | ✓ |
| SIM I hand 0.90× / 0.97× crit | decays (late/early 0.009 / 0.25), period 14.2 / 13.9 s | n:137-146 | ✓ |
| SIM I hand 1.03× / 1.075× / 1.10× crit | grows (×3.8 / ×10.8 / ×8.6, the last two saturate the knob), period 13.6 / 13.4 / 13.2 s | n:137-146 | ✓ |
| SIM P hand 0.97× / 1.03× crit | decays 0.26 / grows 3.9, period 6.62 / 6.59 s | n:150-159 | ✓ |
| normal robot hand swing period | 15.5 s (from cold) and 15.5 s (small kick): not a saturation effect | n dump, x:33-37 | ✓ |
| harder hand swing period, knob saturating | 11.6 s, knob 0↔1 | n dump | ✓ |
| normal hand comfortable within 60 s | never (NaN); first comfortable from 50.5 s ("most of a minute") | n dump (60/90/120/180 s windows) | ✓ |
| q4: 1.5× normal hand (k = 0.012) | 1.075× critical → small swings grow (×10.8); from Ch 0's cold start it never settles (amplitude 21 °C at 30–120 s) | n dump | ✓ |
| recommended PI (1 %, 0.6 %) | PM 58.3°, GM 2.12, comfort 9.4 s, peak 40.9 °C | existing test + x:33 | ✓ |
| PI phase lead at 0.457 rad/s | +37.3° | m:5-12 | ✓ (new) |
| June's PI (5 %, 5 %) | GM 0.279, ω180 = π/5 (10 s on paper), simulated period 6.27–6.31 s, knob 0↔1 | x:40-42, n dump | ✓ (new) |
| delay margin normal hand / PI | 1.15 s / 3.54 s (PM → 0 and GM → 1.00 when added) | x:21-31 | ✓ (new) |
| PM ↔ ζ (std 2nd order) | ζ 0.4: 43.1°, 25.4 % OS; 0.5: 51.8°, 16.3 %; 0.6: 59.2°, 9.5 % | x:10-19 | ✓ (new) |
| smoother at ω = 1/τ | 0.707, −45° | x:48-53 | ✓ (new) |
| integrator `1/(iω)` | gain 1/ω, −90° | x:56-60 | ✓ (new) |
| FALSE-OBVIOUS: halve τ vs halve L (I hand) | ω180 0.457 → 0.526 vs 0.745; kcrit 1.12 → 1.21 vs 2.06 %/(°C·s) | n:69-75, m:18-21 | ✓ (halving L matters ~10× more) |
| FALSE-OBVIOUS: halve τ, P hand | Kcrit 0.0307 → 0.0252 (goes **down**) | n:80 | ✓ |
| FALSE-OBVIOUS: pure-delay P loop still has an edge | Kcrit = 1/45 = 0.0222, ω180 = π/L (period 2L = 5 s) | n:83-84 | ✓ |
| FALSE-OBVIOUS: no delay → P hand never unstable; a lag alone never passes −90°; delay never changes gain | GM = ∞; phase > −90°; `|e^{−iωL}|` = 1 | n:87-96 | ✓ |
| designer goal attainable | 20 of 930 grid points; best Kp 0.9 / Ki 0.5 → 6.7 s, PM 66° | x:62-76 | ✓ (new) |
| P1 at (2.5, 10) | 0.25, 90°, 1.57 rad | m play outputs | ✓ |
| P3 at ω 0.5 / 0.95 | 72° + 27° = 98° / 136° + 44° = 180° (179.6) | n dump, m | ✓ |
| P4 at ω 0.30 / 0.46 | 17°, 43°, 150°, gain 1.15 / 25°, 66°, 181°, gain 0.71 | m | ✓ |
| P5 at K 0.020 / 0.031 / 0.040 | 0.65 / 1.01 / 1.30 | n dump | ✓ |
| P6 at L 1, 2, 2.5, 3, 4, 5 | 2.52, 1.36, 1.12, 0.95, 0.74, 0.60 %/(°C·s) | n dump | ✓ |
| Bode slider initial display | shows 0.2012 rad/s / 31.2 s; status 0.20 / 31.4 s | code reading `widgets.ts:108,201` + screenshot | ✗ mismatch (bug) |

The task's stated callback numbers (period ≈ 6.6 s, ω ≈ 0.95 rad/s, critical gain ≈ 0.031 knob/°C) belong to the **position (P) hand**, and the chapter attributes them correctly. The Ch 0 robot hands are I controllers, whose edge is 13.8 s. The outline in `docs/course-plan.md` ("the human reacting hard had gain > 1 at ≈6.6 s period") is out of date and should be updated to match the chapter.

---

## Phase 6 — Chapter 11: The Drone Challenge (`1.0.0`)

### The phase

Same five sections. The grit ingredients each get a number, a reason and a callback. The mistake's fix gets true numbers. The widget shows what Theo says. The map gets its finale.

#### 6a. Section `briefing`: grit with callbacks — Impact High, Size S

- Rewrite the grit list (b6) so each bullet has **number + reason + callback**:
  - "**Motor lag (τ ≈ 0.05 s):** a propeller can't change speed instantly. Its thrust follows the command like Chapter 3's first-order lag: 63 % of the way after 0.05 s. A late push is Chapter 10's phase lag in disguise."
  - "**A noisy sensor (σ ≈ 2 cm):** every height reading is off by about 2 cm, randomly, a thousand times a second. Chapter 9 warned us: D turns that jitter into big thrust spikes."
  - "**Limited motors (0 to 20 N):** Chapter 8's limit stays on. With the package the drone weighs 6.9 N, so 20 N is only about three times its weight, and the motors can never pull down."
  - "**D is filtered:** Chapter 9's fix. D takes the slope of a smoothed sensor reading, a first-order lag with the time constant $\tau_f$ you choose. Longer $\tau_f$ means calmer but later."
- Theo's b2: "We just pick three numbers. Well, four: the filter too."
- Add **P5 `limit`** after the grit list.
- Add side trip **S1 "A short lag is almost a delay"** with **P3 `lag`** (callout, always visible, quieter).
- After the predict card (gated): **P1 `drop`**, and in the I option's why add "at rest e = 0 and D = 0, so the pile alone must hold the new weight."
- **Tests (`ch11.test.ts`):** 0.7·9.81 = 6.867; 20/6.867 = 2.91; the P5 initial output 40 N clipped; P1 initial outputs 1.96 N / 0.131 m·s / 2.6 s; the integral change across the drop with no gust and no noise = 1.962 N ± 0.01; P3 initial wc 9.85 ± 0.05, lag 26.2° ± 0.5, PM 33.4° ± 0.5 and τm = 0 PM 58.5°; the "short lag ≈ delay" pair 26.2° vs 28.2°.
- **Testable outcome:** every grit bullet states its number, one physical reason and one chapter callback. The three playables show the verified values at their initial settings in all locales.

#### 6b. Section `mission`: criteria with reasons, a fix that holds — Impact High, Size S/M

- Mission b0/b1: give each limit a one-clause reason. Proposed extra sentence: "The limits are what a delivery customer would notice: settled within 3 s, never more than 10 % too high, not blown more than a hand's width (20 cm) by the gust, back in 2 s after the drop, never scraping the ground, and motors that don't buzz (under 0.5 N of chatter)."
- Also b0: "The nominal poles include the motor lag and the filter; only the noise, the package and the limits are left out."
- Replace b7 with: "Try **June's calm-air tune** and watch the 'motors calm' star fail. Then lengthen the filter to about 0.04 s and bring $K_d$ down to about 7. It arrives in 1.9 s instead of June's dream of 1.3 s: that's the price of calm motors. That trade, speed against noise and against robustness, *is* control engineering."
- Theo's b6: append "(the thin orange line shows what the controller *asked* for: see how often it hits 0 N)", which needs 6c item 1.
- After Theo, add **P2 `spike`** and side trip **S3 "Why not just more D?"**.
- Add **P4 `gust`** as a note next to the gust criterion.
- Aside b3: "Stuck? Start from a calm Chapter 9 tune such as $K_p$ = 20, $K_i$ = 10, $K_d$ = 4, then lengthen $\tau_f$ and nudge $K_i$ up until the drop star lights." Verified: (20, 10, 4) gets 5 stars at τf 0.04, and the reference (20, 15, 5, .04) gets 6.
- Add side trip **S2 "Same noise every flight"** (1 note).
- **Tests:** (30, 15, 7, .04) gets 6 stars on seeds 1–30, arrival 1.87 ± 0.02 s. June noise-free arrival 1.27 s. (30, 15, 10, .04) fails recover (2.76 s). Chatter vs Kd at τf .04: 0.218 / 0.407 N at Kd 5 / 10 (± 0.01). P2 initial 40 N and at (7, 0.04) 3.5 N, with the parked-drone sim within 5 %. P4 1.5/20 = 7.5 cm and the P+D sim 0.075 m ± 1e−3. Reference gust 6.8 cm ± 0.2.
- **Testable outcome:** every number in `mission` prose is asserted in `ch11.test.ts` on at least 30 seeds where noise matters. The suggested fix gets 6 stars for any seed.

#### 6c. Widget `mission` — Impact High (items 1–4), Medium (5–9); Size M

1. Draw the **commanded thrust** (thin faint orange, legend "asked for") behind the motor thrust ("delivered"), and add a "0 N" limit label. Shared: `Plot` already supports series and lines; only the sim needs to expose `command` in the trace (`Trace` gains `command: number[]`; `sample()` in `page-hit.ts:15` and `runDrone` in `pid-tools.ts:36`: shared owner Ch 9).
2. **Remove the dead toggle** (`dMeas`), or add the explanation line (see §6.1). Remove the key in all 10 locales.
3. **Sentinel readouts**: new strings `crit.neverRise` "not settled by {s} s" and `crit.neverBack` "not back by {s} s".
4. **Screen-reader state per checklist item** (visually hidden "passed" / "failed" / "not decided yet") and **true pole values** in the s-plane description, with off-edge markers. The plural "pole(s)" becomes `poles.off_one` and `poles.off_other`.
5. **Hint after the score** (the 6 `hint.*` strings in §6.10).
6. Move the "20 N max" label off its line. Fix the DroneView thrust label colliding with the target line, and the ~7 px text at 375 px.
7. **Ghost poles** on the s-plane for the previous tune.
8. **Linked windows**: focusing or hovering a checklist item shades its time window on both plots.
9. **Page physics**: add a debounced scroll re-measure to `pageCeiling` (rule 6). When a hit happens with τf ≤ 0.01 and Kd ≥ 8, append `hitNoise`: "It was the sensor noise that lifted it: clipped chatter pushes up more than down." Verified with (5, 0, 12, .005) → 5.97 m (rule 3: the event teaches).
- **Tests:** `Trace.command` recorded and inside [0, 20]. June's command clipped at 0 N in more than 50 % and at 20 N in less than 30 % of 3–6 s, while motor thrust stays inside (2.9, 10.7) N. Toggle-removed snapshot (or, if kept, a test that asserts it is a no-op so the help text stays true). Sentinel formatting. (5, 0, 12, .005) peaks above 4.9 m with noise and below 2 m without. Scroll re-measure calls `onChange` (DOM unit test with a fake view).
- **Testable outcome:** at 1280 px and 375 px, light and dark, the "asked for" trace visibly hits 0 N for June's tune. No label collides. axe shows 0 violations, and a screen reader hears pass/fail for each star and true pole values.

#### 6d. Section `reflect` + `final-check` — Impact Medium, Size S

- Recap item 8 → "Real hardware adds **limits** (Ch 8), **lag** that costs phase margin (Ch 3 + Ch 10) and **noise** that D amplifies (Ch 9), so good controllers are calm as well as fast (Ch 11)."
- Self-assessment prompt in `final-check` b0 (§7).
- Add quiz **`ch11-q4`** (noise/filter; text in §7). Optionally `ch11-q5` (motor lag → PM).
- **Tests:** q4's numbers: 40 N, 3.5 N, 0.22 → 0.41 N. q5's numbers: 33.4° → 20.5°.
- **Testable outcome:** the quiz tests at least one Ch 11 idea, and every option has a why that matches a tested number.

#### 6e. Concept map (shared owner: `src/story/concept-map.ts`) — Impact Medium, Size M

- **New nodes** (positions checked against the width formula `max(64, len·9.6 + 30)`):
  - `limits`: [8, 0, 0], "motor limits". It fills the Ch 8 gap; the node sits in the empty centre of the Poles cluster.
  - `motorlag`: [11, −75, −55], "motor lag".
  - `tradeoff`: [11, 70, 75], "fast vs calm".
- **New edges:** `firstorder → motorlag`, `motorlag → phaselag`, `limits → tradeoff`, `noise → tradeoff`, `margins → tradeoff`, `tradeoff → you`, `stability → limits`, and `firstorder → noise` (the filter is a first-order lag).
- **Fix overlaps:** en derivative/firstorder (58 px), tau/integral, integralaction/derivativeaction, complex/spin, laplace/dtos, margins/robust. Re-space de/pl, where `guess` and `you` leave the viewBox in de. Add a unit test that measures ellipse overlaps for every locale with the renderer's width formula (script `$SCRATCH/tmp11/map.mjs` does this today).
- **Finale reveal:** on the Ch 11 map (`highlight === 11`), edges draw in with `stroke-dasharray`/`stroke-dashoffset`, staggered ~15 ms per edge (whole map < 1.2 s), only under `prefers-reduced-motion: no-preference`. With reduced motion the map is static. The motion has a purpose: it shows the course joining up. On phones, scroll the map so "YOU" is in view (`scrollLeft` to the finale cluster) or reflow the finale cluster first.
- Locale keys: `map.nodes.limits`, `map.nodes.motorlag`, `map.nodes.tradeoff` in 10 locales.
- **Tests:** every chapter 0–11 has at least 1 node. Ch 11 has at least 2 besides `you`. No node overlaps in any locale. No node leaves the viewBox. Every edge references existing nodes.
- **Testable outcome:** the full map shows the grit ideas linked to Ch 3/8/9/10 with no overlapping ellipses in en/de/pl. Edges draw in once, and not at all with reduced motion.

#### 6f. Section `next`: one sentence of *why* each — Impact Low, Size S

Proposed list:
- "**Root locus:** instead of dragging poles, drag the *gain* and watch the poles trace paths. You'd see at a glance which $K_p$ is too much."
- "**State-space control:** many sensors and motors at once. A real drone must hold tilt, spin and position together, and one-knob-at-a-time tuning stops working."
- "**Digital control:** real controllers run on computers that sample every few milliseconds. Sampling is a small delay too, and the s-plane gets a cousin, the z-plane."
- "**Kalman filters:** blend what a model predicts with what the sensor says, so you can use a noisy sensor without a slow filter."
- "**Smith predictors and model predictive control:** controllers that carry a little simulation inside them to see around delays, the shower's real cure."
- "**Nonlinear and robust control:** what to do when drag isn't linear or the drone flies in 3-D, and how to *prove* you still have margin."
- Tests: none (no numbers). **Testable outcome:** each topic has one *what* and one *why* clause, and the outline's "nonlinear drag and 3-D drones" appears.

#### 6g. Outline and doc sync — Impact Low, Size S

- `docs/course-plan.md:296` still lists "thrust saturates < 0.5 s total". The code uses thrust std < 0.5 N over 3–6 s (`mission.ts:42`). Update the outline. The saturation-time criterion would be nearly meaningless now: the motor thrust itself is at a limit for only 0.01 s, and the command for 0.27 s at take-off.

#### Shared building blocks (candidate owners)
- `Trace.command` (commanded thrust) in `pid-tools.ts` / `page-hit.ts` `sample()`: Ch 9 owner. Useful for Ch 8 `limit` and Ch 9 `noise` too.
- `loopMargin(C, plant, extras)` (crossover, PM) as a shared math helper (`src/math/bode.ts`?): Ch 10 owner. Needed for P3 here and for any Ch 10 drone callback.
- `SPlane` off-edge markers plus true values in `describe()`: shared UI owner. Ch 8/9 s-planes clamp too.
- `SPlane` ghost poles: shared UI owner.
- `Plot` linked-window highlight on hover (`setBands` + focus handlers): shared UI owner.
- Concept-map overlap test and draw-in animation: story owner.
- A multi-seed helper `starsOnSeeds(p, n)` for any noisy mission test: Ch 11, maybe Ch 9.

#### New glossary terms for translators
- *motor lag*: the delay-like smoothing between the thrust asked for and the thrust the propellers deliver; a first-order lag with time constant τm.
- *commanded thrust / asked for* vs *delivered thrust*: the controller's output before and after the motor.
- *clipping*: cutting a command off at the motor's limit (0 N or 20 N).
- *crossover (frequency)*: the wiggle speed at which the loop's gain is exactly 1; where phase margin is read. Use it only inside S1/P3.
- *fast vs calm* (map node): the speed/noise trade-off.
- *standard deviation*: already used; its typical variation around the average. Keep one consistent term per locale.
- *seed / same noise*: avoid "seed" in prose; say "the same random jitter every flight".

#### Risks
- The widget is deterministic at seed 7, so any tweak to `gaussian`/`mulberry32`, `dt` or the RK4 noise hold can flip borderline stars. The chapter's text fix is borderline (29/30). Mitigation: multi-seed tests for every tune named in the prose.
- The P2 formula is 10–20 % high at τf ≤ 0.01 because of the 1 ms noise hold. Keep "about" in all locales and keep the playable's τf minimum ≥ 0.005. The test tolerance is documented.
- Removing `dMeas` touches 10 locales and `JUNE_TUNE`/`Best` (`dOnMeasurement` is stored in the saved best). Keep reading old saves.
- The P3 model needs a small complex-arithmetic bisection inside `plays.ts`. Put it in the shared helper so it isn't duplicated.
- Map re-layout changes every chapter's map (the map is shown on every chapter). That needs screenshots of all 12 chapter maps in en/de/pl.

#### Suggested commit order (this chapter)
1. `test(ch11): pin mission numbers on 30 seeds` (reference, June, fix tunes, chatter vs Kd, toggle no-op).
2. `feat(sim): record commanded thrust in traces` (shared, with tests).
3. `feat(ch11): show asked-for vs delivered thrust; 0 N label; fix label collisions`.
4. `fix(ch11): honest readouts (sentinels, SR pass/fail, true pole values, plural)`.
5. `refactor(ch11): remove the no-op D-from-measurement toggle` (all locales).
6. `feat(ch11): grit bullets with numbers, reasons and callbacks` + `plays.ts` (P1, P3, P5) + S1, all locales.
7. `fix(ch11): suggest Kd ≈ 7 and state the real price in speed` + P2, P4, S2, S3, all locales.
8. `feat(ch11): score hints and linked time windows`.
9. `fix(ch11): re-measure the page ceiling on scroll; label noise-driven page hits`.
10. `feat(map): motor limits, motor lag, fast-vs-calm nodes; overlap test; finale draw-in`.
11. `feat(ch11): quiz q4 (+q5), self-assessment, recap and where-next whys`.
12. `docs: sync the Ch 11 outline pass criteria`.

### Evidence for this phase

*Reviewer notes. Files: `public/locales/en/ch11.json` (317 lines), `src/chapters/ch11/{mission.ts, widgets.ts, page-hit.ts, ch11.css, ch11.test.ts, page-hit.test.ts}`, `src/story/concept-map.ts`, outline `docs/course-plan.md:291–302`.
Checks: `$SCRATCH/checks/ch11-numbers.test.ts` (31 tests, all pass), exploratory logs `ch11-explore.log`, `ch11-explore2.log`, `ch11-seeds.log`, `ch11-rectify.log`.
Run: `cd /Users/micheal/Development/animations && pnpm vitest run --root $SCRATCH/checks ch11-numbers`.

"Reference tune" below always means **Kp 20, Ki 15, Kd 5, τf 0.04 s** (from `ch11.test.ts:6`). Seed 7 is what the widget flies (`mission.ts:19` default, the widget never passes another).*

#### 0. Snapshot

**Driving question:** "Can *you* keep the drone at 2 m through everything?"

**Sections in order**

| id | title | one line |
|---|---|---|
| `briefing` | Mission briefing | June/Mika/Theo set the task. Timeline list (0 s take-off with 0.2 kg package, 6–9 s 1.5 N gust down, 12 s drop, 20 s end). A second list gives the four grit ingredients (motor lag 0.05 s, 2 cm noise, 0–20 N, filtered D with τf). A note says what is still ignored. Then the gated predict card `ch11-drop`. |
| `mission` | Fly the mission | Two paragraphs on the ghost, the nominal s-plane, and what the arrival and calm stars mean. Then the `mission` widget, a "Stuck?" aside, June's calm-air mistake (2 bubbles), Theo's diagnosis, and a paragraph with the fix ("filter about 0.04 s, Kd about 6"). |
| `reflect` | Looking back | One reflection per character, a recap of the whole course (8 items, Ch 0–11), and the full concept map. |
| `final-check` | Explain it to a friend | An intro and a 3-item quiz (Laplace, pole, shower overshoot). |
| `next` | Where to go next | A list of 6 further topics, then the cliffhanger ("It's the phase margin."). |

**Widget `mission`** (`widgets.ts:35–391`)
- Shows: a mission strip (phase text, a 20 s progress track with the gust band and drop tick, 6 mini marks), a `DroneView` (hMax 3 m, sensor dot, free-flying into the page), a height plot (sensor reading in pencil, setpoint dashed green, height blue with ghost, ±5 cm band, red error fill, gust/drop lines in purple), a thrust plot (motor thrust in orange with ghost, 20 N dotted line), a checklist of 6 criteria with measured values, a best-score line, and a small nominal s-plane (σ −40…5, ω ±25) with a pole note.
- Controls: Kp 0–50, Ki 0–50, Kd 0–12 (0.5), τf 0.005–0.2 (0.005), a "D from measurement (no kick)" toggle, "Fly instantly", "June's calm-air tune" (30/15/10/0.005), and the transport (play/pause, reset, step 0.1 s, speed).
- Readouts: rise s, overshoot %, gust cm, recover s, ground touched/clear, calm N. Stars and a gold message go to a live region. The best score is kept in `progress` (`ch11.best`). It emits `mission:gold`.
- Pass limits (`mission.ts:42`): rise ≤ 3 s (staying within ±5 cm until 6 s), overshoot < 10 %, gust deviation < 20 cm (from 6 s to 12 s), recovery < 2 s, never touching the ground after 1 s, thrust standard deviation < 0.5 N over 3–6 s (only while it is hovering on running motors). These are the same numbers the checklist strings show through `criterionVars` (`widgets.ts:47–54`).
- Page physics (`page-hit.ts`): the page above the picture is a stalling ceiling. The headroom is 4.9 m at 1280 px and 6.4 m at 375 px, taken from the comments and tests, not re-measured by me. A hit adds `hitPage` to the status.

**Predict card `ch11-drop`** (briefing block 8, gated): which term brings the drone back to exactly 2 m after the drop? Answer: I. Each option has a why.

**Misconception and mistake:** June's "perfect controller in my head" (huge Kd, tiny filter) is flawless in calm air but chatters and overshoots with noise (mission blocks 4–6). The preset lets the learner fly exactly that tune.

**Quiz:** 3 items (`ch11-q1` why Laplace exists, `ch11-q2` what a pole is, `ch11-q3` why the shower overshot). Each has 3 options with a why for every option. None covers Chapter 11's own ideas: lag, noise, filter, limits, trade-offs.

**Map:** the full map (`renderer.ts:171`, `upTo: 11, highlight: 11`). Ch 11 owns exactly one node, `you` ("YOU, a control engineer"), with edges `robust→you` and `pid→you` (`concept-map.ts:68, 124–125`).

**Cliffhanger:** "…you'll know it's not your fault. **It's the phase margin.**"

**Tests**
- `ch11.test.ts`: the reference tune and (25,20,6,.04) get 6 stars on seeds 1/7/42. The default tune fails rise. June fails calm and overshoot, and (30,15,6,.04) gets 6 stars. June with no noise gets 6 stars. Nominal poles are stable for the reference tune and unstable for Ki = 400. Pole counts are checked. The arrival star needs the height to stay in band. Slider corners stay finite with thrust inside [0, 20].
- `page-hit.test.ts`: with open sky the result equals `runMission`. Good or strong tunes never reach 4.9 m. Weak-Kp tunes hit, stall, crash and stay down. A crash never earns calm. The page never adds stars.

#### 1. Screenshots

All saved in `$SCRATCH/shots/ch11/`. The widget was flown with "Fly instantly" on the default tune (10, 0, 1, 0.02). 18 files.

- `1280-light-full.png`, `1280-dark-full.png`, `375-light-full.png`, `375-dark-full.png`: in full-page captures the dialogue bubbles and paragraphs below the widget are blank. This is the entrance-on-intersection reveal, a capture artefact, not a bug. The predict card shows unanswered options (with `?reveal` the gate is open, so the widget is visible).
- `1280-light-mission-a.png`: the drone picture's thrust label "5.0 N" sits on the dashed target line ("target ─5.0·N─"). In the thrust plot, the "20 N max" label is struck through by its own dotted line. There is no 0 N label, although Theo's explanation is about clipping at 0 N. The checklist shows "6.00 s" for a failed arrival, which is a sentinel (rise defaults to the gust time).
- `1280-light-mission-b.png`: "Back within ± 5 cm … **8.00 s**" is another sentinel (never back = 20 − 12). On the s-plane, the pole at −51.3 is drawn as an ordinary × at the −40 edge on top of the "−40" tick label. The note reads "(1 fast pole(s) off the left edge.)", with an awkward "pole(s)".
- `1280-dark-mission-a.png`: the colour language holds in dark mode (green dashed setpoint, blue height, orange thrust, purple gust/drop, red error fill). There is no contrast problem that I can see.
- `375-light-mission-a.png`: nothing clips at 375 px. The DroneView text ("height: 1.51 m", "target", "5.0 N", axis ticks) shrinks to about 7 px and is hard to read.
- `375-light-mission-b.png`: the sliders go into two columns and stay readable. The checklist value moves onto its own line, which is fine.
- `375-dark-mission-c.png`: the s-plane fills the width. The clamped pole × overlaps the "−40" tick here too.
- `1280-light-map.png`: the full map. Measured with the renderer's own width formula (`concept-map.ts:181`), these ellipses overlap in **en**: derivative/firstorder (58 px, the label shows as "derivative = slop|"), tau/integral (24), integralaction/derivativeaction (24), complex/spin (19), laplace/dtos (10), margins/robust (10), sserror/overshoot (5), spiral/smap (5). In **de** there are 19 overlaps (worst: integralaction/derivativeaction 77 px, derivative/firstorder 63, sserror/overshoot 57), and `guess` and `you` fall off the viewBox. In **pl** there are 16 overlaps (derivative/firstorder 91, phaselag/bode 62). The Finale cluster holds only "YOU". There is no grit node and no limits node. Edges do not animate in.
- `375-dark-map.png`: the map scrolls sideways (min-width 720 px). The finale cluster is off-screen to the right, so on a phone the "YOU" payoff is invisible unless the reader scrolls.

Keyboard/SR probe (one eval in the browser): the tab order through the widget is logical (4 sliders → toggle → 2 buttons → transport → speed radios). There are two concrete SR gaps:
1. Checklist items expose the criterion and value but **not pass/fail**, because the mark is `aria-hidden` (`widgets.ts:170`) and the state lives only in `data-state`.
2. The s-plane description says "Pole: −40.00" for the default tune's real pole at −51.3, because the values are clamped before `sp.set`/`describe()` (`widgets.ts:298–305`).

#### 2. Terms before use

| # | Term / symbol / formula / number | First appears | Status | Note |
|---|---|---|---|---|
| 1 | 2 m target | question; briefing b0 | earned (course-wide) | |
| 2 | 0.2 kg package, 0.7 kg total | briefing b4 item 1 | earned | 0.5 + 0.2 ✓ |
| 3 | gust 1.5 N down, 6–9 s | briefing b4 item 2 | stated | the size is not related to the weight (1.5 N ≈ 22 % of the 6.87 N loaded weight) |
| 4 | package drop at 12 s | b4 item 3 | earned | |
| 5 | "three numbers. Well, four." | briefing b2 | stated | the fourth (τf) appears only in b6, item 4 |
| 6 | motor lag, 0.05 s | b6 item 1 | stated with a reason | no mention that it is a Ch 3 first-order lag (τ = 63 %), and no tie to Ch 10 phase lag |
| 7 | sensor noise ~2 cm, 1000/s | b6 item 2 | stated | no reason why it matters (that only comes in mission b6), and no "Ch 9 warning 2" tie here |
| 8 | 0–20 N, never negative | b6 item 3 | stated | no tie to Ch 8's `limits` section, no reason, and nothing on how much tighter it is with the package (2.9× weight vs 4.1×) |
| 9 | D filtered, τf | b6 item 4 | only stated here | earned in Ch 9 (`warnings`), but not linked back, and "filtered" is never called a first-order lag (Ch 3) |
| 10 | "tilting, sideways wind…" | b7 note | fine | |
| 11 | droop | predict option P why | earned (Ch 2) | |
| 12 | hover thrust | predict why | earned (Ch 2/9) | |
| 13 | 4.9 N vs 6.9 N | predict option I why | stated; verified | 4.905 / 6.867 N (test l.33) |
| 14 | "the pile" (integral) | predict option I | earned (Ch 9) | |
| 15 | ghost | mission b0 | earned | |
| 16 | nominal poles | mission b0 | earned in place | "(a perfect sensor, no package, no limits)" ✓; motor lag and filter *are* included, which the text doesn't say |
| 17 | six stars, gold | mission b0 | stated | the criteria appear only inside the widget |
| 18 | ±5 cm band, "true height" | mission b1 | earned | |
| 19 | standard deviation | mission b1 | earned in place | "typical variation around its average" ✓ |
| 20 | 3–6 s window | mission b1 | stated | no reason given for this window (it is after arrival and before the gust) |
| 21 | pass limits 3 s / 10 % / 20 cm / 2 s / 0.5 N | widget checklist | stated | none has a reason (for example, 20 cm ≈ "a hand's width") |
| 22 | "Chapter 9's playground winners" | mission b3 | used as a pointer | a typical Ch 9 tune (20, 10, 4) gets only 4 stars (τf 0.02) or 5 stars (τf 0.04, rise 3.5 s): see §8 |
| 23 | Kd, "tiniest filter" | mission b4 | earned (Ch 9) | |
| 24 | "Chapter 9, warning 2" | mission b6 | earned | the tie is good but arrives late |
| 25 | clipped at 0 N more than at 20 N → lopsided push | mission b6 | stated (earned in Ch 9 `noise`) | true for the command (57 % vs 23 %); the plotted motor thrust never touches either limit (2.99–10.6 N), so the claim can't be seen on the page |
| 26 | "filter ~0.04 s, Kd ~6 … a hair of speed" | mission b7 | **stated and misleading** | arrival goes from 1.27 s to 2.68 s (more than double), and it fails arrival on 1 of 30 seeds |
| 27 | "speed against noise and against robustness" | mission b7 | stated | robustness (Ch 10) is not tied to motor lag anywhere |
| 28 | e^{st}, Laplace probe, poles blow up | reflect b1 | earned (Ch 5–8) | |
| 29 | "margin from the cliff" | reflect b2 | earned (Ch 10) | |
| 30 | uncanceled poles | recap item 5 | earned (Ch 8) | |
| 31 | phase lag, margins | recap item 7 | earned (Ch 10) | |
| 32 | Fourier transform | q1 option 3 why | stated as an aside | fine |
| 33 | −180°, gain above 1 | q3 option 1 | earned (Ch 10) | |
| 34 | root locus, state space, z-plane, Kalman, Smith predictor, MPC, robust control | next b1 | stated | each has a *what*; only digital, Kalman and Smith/MPC have a *why* |
| 35 | phase margin | cliff | earned (Ch 10) | |
| 36 | "D from measurement (no kick)" | widget toggle | earned (Ch 9 warning 1) | **has no effect in this mission** (§6) |
| 37 | "stability boundary", "fast pole(s) off the left edge" | widget pole note | earned | |

**Where a curious beginner gets stuck**

1. **"Motor lag 0.05 s": so what?** The number comes with a physical reason (propellers spin up) but no consequence. A beginner will not guess that 0.05 s costs the reference tune **25° of phase margin (58.5° → 33.4°)**. Fix: one sentence in the bullet ("a Chapter 3 first-order lag: 63 % of the way in 0.05 s") plus the playable P3 and side trip S1 ("a short lag is almost a delay").
2. **"Every reading is off by 2 cm": why is 2 cm a big deal?** 2 cm sounds tiny. The wall is not the size but the *slope*: D turns σ into about Kd·σ/τf of commanded thrust, which is **40 N** for June's tune, six times the hover thrust. Fix: playable P2 right after June's mistake. It makes Theo's "turns every 2 cm … into a thrust spike" a number the reader can drag.
3. **"Limited motors 0 to 20 N": the Ch 8 link is missing.** With the package the drone weighs 6.87 N, so 20 N is only **2.9×** its weight (Ch 8 said "about four times" for the bare drone). At take-off, Kp 20 asks for 40 N and the command sits at 20 N for about 0.27 s. Fix: one sentence in the bullet plus playable P5.
4. **Theo's "clipped at 0 N far more often than at 20 N" cannot be seen.** The thrust plot shows the lagged motor thrust (2.99–10.6 N for June's tune). The clipping happens to the *command*, which is not drawn. Fix: draw the commanded thrust as a thin, faint orange trace behind the motor thrust, with a 0 N label (§6).
5. **"You give up a hair of speed."** Under the chapter's own arrival star, the suggested fix is more than twice as slow (1.27 s → 2.68 s), and it needs a lucky seed. Fix: suggest Kd ≈ 7 (1.87 s, 30/30 seeds) and say what the price really is: "about half a second of arrival".
6. **"Which term matters most for the drop → I": how long does I take?** The card gives a correct answer but no size for the job. Fix: playable P1: 1.96 N to unlearn, Ki 15 → 0.131 m·s of error → about 2.6 s at 5 cm average error.
7. **The "D from measurement" toggle does nothing.** A curious learner flips it, sees nothing change, and concludes they misunderstood Ch 9. Fix: remove it, or say why it changes nothing (§6).
8. **The six pass limits come without reasons.** Fix: one clause each in the mission b1 paragraph (see 6b).

#### 3. Explanation gaps

**Bridges back that are missing**

- **Ch 3 (τ, first-order lag):** both the motor lag and the D filter *are* Ch 3's first-order lag. That is the most satisfying callback available in the finale, and it isn't made. Proposed bullet text: "**Motor lag:** a propeller can't change speed instantly. Its thrust follows the command like Chapter 3's shower-temperature lag, with τ ≈ 0.05 s: 63 % of the way there after 0.05 s."
- **Ch 8 (`limits`):** the "0 to 20 N" bullet doesn't say "since Chapter 8". It also doesn't mention that the package makes the limit tighter (2.9× the weight).
- **Ch 9 (`warnings`, `noise`):** the filter bullet reintroduces τf as if it were new ("D uses the slope of the filtered sensor reading, with the time constant $\tau_f$ you choose"). It should say "Chapter 9's filter". Theo's "warning 2" comes three blocks later.
- **Ch 10 (phase lag, margins):** motor lag is never linked to phase. The recap says "Delay adds phase lag" (Ch 10) and "Real hardware adds limits, lag and noise" (Ch 11) as two separate facts. The finale is the place to join them: ∠1/(1 + iωτm) = −arctan(ωτm) is literally the Ch 10 formula (`ch10.json` uses `\angle G = -\arctan(\omega\tau) - \omega L`).
- **Ch 2 (P droop) and gust:** the gust's steady effect under P is 1.5/Kp (7.5 cm at Kp 20). The mission's PID gust deviation is 6.8 cm, almost the same, because I has only 3 s to act. That is a nice concrete "why the gust star is about Kp, not Ki" and it isn't said.
- **Ch 9 anti-windup:** the mission runs with `antiWindup: true` (`pid-tools.ts:16`) and the prose never mentions it. That is fine, but "the controller also stops piling while pinned, Chapter 9's anti-windup" would complete the list of real-world grit.

**Skipped steps / derivations**
- Predict option I: "only the integral can hunt down a new constant push". The step "at rest, e = 0 and D = 0, so Ki·∫e must equal the new weight" is implied but not written. One clause would do it.
- Theo's "that's the overshoot": the chain from clipping to average push to overshoot is only asserted here. It is acceptable because Ch 9 `noise` explains it, but add "(Chapter 9 caught this drifting up)".

**Rules of thumb given without reason**
- "lengthen the filter to about 0.04 s and bring Kd down to about 6" (mission b7): no reason for 0.04 (the filter corner at 25 rad/s sits above the ~10 rad/s crossover, so it adds little lag there while cutting the per-sample noise 8× compared with 0.005 s). Kd 6 is not a robust choice (§8).
- "Stuck? Chapter 9's playground winners are a good start" (b3): true in spirit, but the Ch 9 tunes were scored without motor lag. (20, 10, 4) gets 4–5 stars here.

#### 4. Playable-number opportunities

All values verified in `ch11-numbers.test.ts` (line numbers in §8). The play ids go into a new `src/chapters/ch11/plays.ts`, registered like ch04/ch06.

**P1 `drop`: how much the integral must unlearn**
- Sentence (after the predict card, briefing b8, as a new `play` block, shown after the gate; or at the start of `mission`): "When a {scrub|pkg} kg package drops, the hover push must fall by {calc|dN|eff} N. Only the integral can hold that for good: at $K_i$ = {scrub|ki|eff} N/(m·s) it has to pile up {calc|area} m·s of error, which at an average error of {scrub|e} cm takes about {calc|time} s."
- Inputs: pkg 0.05–0.4 step 0.05, initial 0.2 kg. ki 1–50 step 1, initial 15. e 1–20 step 1, initial 5 cm.
- Outputs: dN = pkg·9.81 (2 dp). area = dN/ki (3 dp). time = area/(e/100) (1 dp).
- At the initial values: **1.96 N, 0.131 m·s, 2.6 s**. The sim check (no gust, no noise) finds the integral term moves by exactly 1.962 N and ∫e = 0.131 m·s (test l.174).

**P2 `spike`: what the filter does to the noise on D**
- Sentence (mission section, after Theo's b6): "With $K_d$ = {scrub|kd|eff} N·s/m and a filter of $\tau_f$ = {scrub|tf} s, every 2 cm wobble of the sensor asks the motors for about {calc|spike|eff} N ($K_d\sigma/\tau_f$). Hovering needs only 6.9 N."
- Inputs: kd 0–12 step 0.5, initial 10. tf 0.005–0.2 step 0.005, initial 0.005 s.
- Output: spike = kd·0.02/tf (0 dp above 10, else 1 dp).
- At the initial values: **40 N** (June). At Kd 7 and τf 0.04: **3.5 N**.
- Checked against the sim with the drone parked (Kp = Ki = 0, no limits): the command's standard deviation matches Kd·σ/τf within +2 %/−5 % at τf 0.04. It comes out about 15 % low at τf 0.005, because noise is held for 1 ms steps (test l.226). "About" covers this.

**P3 `lag`: motor lag costs phase margin (Ch 10 tie)**
- Sentence (briefing b6 bullet 1 follow-up, or side trip S1): "Our reference tune's loop crosses gain 1 at about {calc|wc} rad/s. A motor lag of τ = {scrub|tm} s holds that wave back by arctan(ωτ) = {calc|lag}°, so the phase margin drops from 59° to {calc|pm}°."
- Input: tm 0–0.1 step 0.01, initial 0.05 s.
- Outputs: computed from L(iω) = (Kp + Ki/iω + Kd·iω/(1+iωτf)) · 1/(1+iωτm) · 1/(m(iω)² + c·iω) with m 0.5, c 1 and the reference gains. Bisect for |L| = 1, then lag = arctan(wc·tm), pm = 180° + ∠L (wc 1 dp, lag and pm 0 dp).
- At the initial values: **wc 9.8 rad/s, lag 26°, PM 33°**. Table (test l.189): τm 0 → 10.8 rad/s, PM 58.5°. τm 0.02 → 10.6, 46.8°, lag 12.0°. τm 0.1 → 8.54, 20.5°, lag 40.5°.
- Note: "59°" in the sentence is the τm = 0 value rounded.

**P4 `gust`: steady push vs P**
- Sentence (mission section, near the gust criterion): "A steady push of {scrub|F|dis} N against a P gain of {scrub|kp|eff} N/m moves the drone by $F/K_p$ = {calc|dev} cm. The mission's gust lasts only 3 s, so the integral hardly gets a say: the reference tune still dips 6.8 cm."
- Inputs: F 0.5–3 step 0.5, initial 1.5 N. kp 5–50 step 1, initial 20.
- Output: dev = F/kp·100 (1 dp).
- At the initial values: **7.5 cm**. Sim (P + Kd 5, no noise): 15 / 7.5 / 5.0 cm at Kp 10 / 20 / 30 (test l.157). Reference PID in the mission: 6.8 cm (test l.50).
- False-obvious: pure P (Kd 0) with motor lag is barely stable at Kp 20 and does *not* show 1.5/Kp within 20 s (test l.164). That is why the sentence says "(plus a little D)" in the note.

**P5 `limit`: how tight 20 N is with the package**
- Sentence (briefing b6 bullet 3 follow-up): "With the package the drone weighs {calc|w} N, so 20 N is only {calc|ratio}× its weight. At take-off, $K_p$ = {scrub|kp|eff} N/m times the 2 m error asks for {calc|ask} N{calc|clip}."
- Input: kp 1–50 step 1, initial 20.
- Outputs: w = 0.7·9.81 (2 dp), ratio = 20/w (1 dp), ask = 2·kp (0 dp), clip = ask > 20 ? t('clipped') (", and the motors give 20") : "".
- At the initial values: **6.87 N, 2.9×, 40 N, clipped**. The reference tune's command sits at 20 N for 0.27 s during take-off (test l.65).

#### 5. Side trips

**S1 "A short lag is almost a delay"** (callout, after the grit list, briefing b6)
- Proves: a first-order lag τ shifts a wave of frequency ω by arctan(ωτ), which is ≈ ωτ (a pure delay) while ωτ is small. So motor lag eats phase margin exactly like Chapter 10's shower pipe.
- TeX: `\angle \frac{1}{1 + i\omega\tau_m} = -\arctan(\omega\tau_m) \approx -\omega\tau_m \quad(\omega\tau_m \ll 1)`
- Playable: P3.
- Prose: "Theo: 'A motor that needs 0.05 s to spin up… isn't that just a tiny delay?' June: 'Almost! At the loop's crossover, about 10 rad/s, a 0.05 s delay would cost 28°. The lag costs 26°.' Mika: 'So it's Chapter 10 all over again, only smaller.' It is: our reference tune's phase margin falls from 59° to 33° once the motors are real. That's why the finale's winners are gentler than Chapter 9's."
- Verified: 28.2° vs 26.2° at ωc 9.85 (test l.203). PM 58.5 → 33.4 (test l.189). PM drop 25.1°, *not* the 28.4° you'd get at the old crossover (test l.198, a false-obvious case).

**S2 "Same noise every flight"** (small note under the widget)
- Proves: the widget uses one fixed noise sequence (seed 7), so ghost comparisons are fair. What you see changing is your tune, not luck.
- Prose: "The sensor's jitter is random, but it's the *same* random every flight, so when the ghost and the new run differ, you did that. (A real drone gets new noise every day. Good tunes win with any noise: we checked the reference tune on 30 different noise sequences.)"
- Verified: 30/30 seeds give 6 stars for the reference tune (test l.59).

**S3 "Why not just more D?"** (callout after June's mistake)
- Proves the false-obvious case: at a fixed filter, more Kd *raises* the chatter. Thrust standard deviation is 0.22 N at Kd 5, 0.26 at 6, 0.41 at 10 and 0.47 at 12 (τf 0.04). Without noise the same Kd 10 is near silent (< 0.04 N).
- Playable: P2.
- Prose: "June: 'The motors are twitchy, so they need more damping. More D!' Theo tries it. The fuzz gets *worse*: 0.22 N of chatter at $K_d$ = 5, 0.41 N at 10. D doesn't calm noise, it amplifies it. Damping calms *motion*. The noise isn't motion, it's the sensor fibbing."
- Verified: test l.145.

#### 6. Widget polish

**`mission`**

*Correctness/logic*
1. **Dead control: "D from measurement (no kick)."** The setpoint is a constant 2 m from t = 0, and the filter state starts at `setpoint − h0` in error mode (`drone-model.ts:144`). So D on error and D on measurement are identical. The max height difference over the whole mission is 4.9e−15 m (test l.209). The toggle even restarts the flight, which suggests something changed. Options: (a) remove it (Impact M, Size S; drop `dMeas` from 10 locales), or (b) keep it and add a help line: "The target never jumps in this mission, so this switch changes nothing here. It matters when the target steps (Chapter 9, warning 1)." I recommend (a).
2. **Sentinel values shown as measurements.** A failed arrival shows "6.00 s" (`rise` falls back to `MISSION.gust.start`, `mission.ts:91`). Never recovering shows "8.00 s" (`lastOut` = 20 → 8, `mission.ts:92`). Show "not by 6 s" / "not back by 20 s" instead. New strings `crit.neverRise` "not settled by {s} s" and `crit.neverBack` "not back by {s} s".
3. **Clamped poles described as real values.** The SR text says "Pole: −40.00" for a pole at −51.3 (default tune) or −202 (June). Keep the true value for `describe()` and draw an off-edge marker (◁ at the edge) instead of a normal ×. The "pole(s)" wording needs plural forms: `poles.off_one` "(1 fast pole off the left edge.)" and `poles.off_other` "({n} fast poles off the left edge.)".
4. **Checklist state is not exposed to screen readers** (`widgets.ts:170`, mark `aria-hidden`). Add a visually hidden "passed" / "failed" / "not decided yet" to each `li` (new strings `state.pass`, `state.fail`, `state.pending`).
5. **June's tune overshoots, but the stated fix is fragile.** See §8: (30, 15, 6, .04) gets 6 stars on 29 of 30 seeds (seed 5 fails), and at seed 7 its arrival is 2.68 s against the 3 s limit. It also has 4 % overshoot, so it lands outside the ±5 cm band. The widget is deterministic (seed 7), so the page works today, but a change to the noise generator or the dt would break the lesson silently. Change the text to Kd ≈ 7 (30/30 seeds, arrival 1.87 s, calm 0.32 N) and add the multi-seed test.

*Visual*
6. The thrust plot shows only the lagged motor thrust. Add the **commanded thrust** as a thin faint orange line (effort colour, dashed or 40 % opacity) and a "0 N" label, so Theo's "clipped at 0 N far more often than at 20 N" can be seen. Measured for June's tune in 3–6 s: the command sits at 0 N 57 % of the time and at 20 N 23 %, while the motor thrust stays within 2.99–10.6 N (test l.91). Legend: "asked for" / "delivered".
7. The "20 N max" label is drawn through by its own dotted line (1280 and 375). Move it above the line.
8. In the DroneView, the thrust label "5.0 N" collides with the dashed target line whenever the drone hovers near 2 m. Offset the label or give it a paper-coloured halo. At 375 px all DroneView text is about 7 px. The width 240 is scaled down: set a minimum font size, or hide tick labels below 300 px.
9. The s-plane in the mission has no ghost of the previous tune's poles, although the plots have ghosts. Add faint ghost × marks (colour rule: previous run = faint ghost).

*Status lines that could say more* (status `stars`: "{n} of 6 stars. Keep tuning!")
10. Add one hint after the score, keyed to the first failed star (new strings `hint.*`):
   - rise failed with Ki = 0: "It hangs below 2 m: that's droop. Some $K_i$ will fix it."
   - rise failed with Ki > 0: "It hasn't settled by 3 s. More $K_p$ or a little more $K_d$."
   - overshoot: "It overshoots on take-off. More $K_d$, or less $K_i$."
   - gust: "The gust pushes it too far. More $K_p$ stiffens it."
   - recover: "The drop takes too long to undo. That's the integral's job: try more $K_i$."
   - calm: "The motors chatter. Lengthen $\tau_f$ or lower $K_d$."
   - Each hint is backed by a verified case: default tune (Ki 0) fails rise at 1.51 m, June fails calm at 0.64 N, and (30, 15, 10, .04) fails recover at 2.76 s (tests l.215, l.78, l.117).

*Keyboard*
11. The tab order is fine. Slider arrows re-fly instantly (`instant(true)` on change), which is correct: no animation for keyboard steps. The s-plane is display-only, which is fine.

*Linked representations*
12. Hovering or focusing a checklist item could highlight its time window on the plots: 0–6 s arrival, 6–12 s gust, 12–14 s recover, the 3–6 s calm window on the thrust plot. That is cheap with `setBands` and explains "from 3 to 6 s" visually.

*Page physics (`docs/page-physics.md` rules)*
13. Rule 7: the headroom is 4.9 m (desktop) and 6.4 m (phone), from `page-hit.test.ts:6–7`. Good and strong tunes peak at 2.06–2.56 m (the reference tune at 2.09 m, June at 2.56 m), so they never reach it. Weak-Kp tunes do reach it: (5, 20, 0) and (0, 10, 0) per the tests. I also verified that the comment's claim that noise can do it holds: **Kp 5, Ki 0, Kd 12, τf 0.005 climbs to 5.97 m on noise rectification alone, while noise-free it never reaches 2 m** (test l.251). That is a great teaching moment that is currently unlabelled. When the hit happens with a tiny τf, the status could add: "…and it was the sensor noise that lifted it: clipped chatter pushes up more than down."
14. Rule 6: `pageCeiling` re-measures on resize and ResizeObserver only (`page-hit.ts:53–55`), not on **scroll**. Live flights call `aim()` each frame once h > 2.5 m, so they are fine. A finished "Fly instantly" trace is not recomputed when the sticky top bar moves over the content on scroll. Add a debounced scroll listener that calls the same `later()`.
15. Rule 9: the status is composed as score + `hitPage` ✓. Rule 10: under reduced motion `ceilingHeight()` returns null ✓ (per the comment; not re-checked in the browser).

#### 7. Pedagogy checklist

| Item | Status | Note |
|---|---|---|
| Driving question | present | "Can *you* keep the drone at 2 m through everything?" |
| Feel-it interactive first | weak | The widget comes after the briefing and predict, which is fine for a finale. The grit ingredients are read about before they are felt. |
| Gated predict-then-reveal | present | `ch11-drop`, gate true, all whys reasoned and numerically correct (6.87 → 4.91 N). A "how long does I take" follow-up (P1) would complete it. |
| One idea per section | present | |
| Real misconception AND on-page mistake | present, text needs a fix | June's tune is real and flyable. 2 stars verified: fails rise, overshoot 27.9 %, recover, calm 0.64 N. The fix wording ("Kd about 6", "a hair of speed") is fragile or misleading. |
| Recap | present | 8 items. The Ch 11 item should name lag → phase and filter → Ch 3 lag. |
| 2–4 quiz items, why for EVERY option | present (3), with a coverage gap | All whys exist. None tests the finale's new ideas. The outline asks for mission self-assessment plus 3 reflection prompts: the 3 "explain to a friend" items fill that. There is no explicit self-assessment (the star score is implicit). |
| Concept-map nodes | weak | Only `you`. No grit/trade-off node. Ch 8's motor limits are missing everywhere on the map. Overlaps in en/de/pl. No "edges animating in" from the outline. |
| Cliffhanger | present | Warm closing line. |

**Proposed fixes**

- **New quiz item `ch11-q4`** (4 items is still within 2–4):
  - q: "Your friend's drone hovers, but its motors buzz and get hot. The height sensor jitters by 2 cm. What's the first thing to try?"
  - A (correct): "Lengthen the derivative filter or lower $K_d$". Why: "D turns sensor jitter into about $K_d\sigma/\tau_f$ newtons of command: 40 N for $K_d$ = 10 and $\tau_f$ = 0.005 s, only 3.5 N for $K_d$ = 7 and $\tau_f$ = 0.04 s. You give up a little arrival speed."
  - B: "More $K_d$, for more damping". Why: "Damping calms *motion*, not sensor fibs. At $\tau_f$ = 0.04 s the chatter grows from 0.22 N at $K_d$ = 5 to 0.41 N at $K_d$ = 10."
  - C: "Turn off the integral". Why: "I only adds up the error slowly, so it barely passes the jitter on. Without it the drone droops and can't undo a package drop."
  - D: "More $K_p$". Why: "P passes the jitter straight through ($K_p\sigma$), so more P means a bit *more* buzz, not less."
  - Verified: tests l.145, l.226. The C and D claims are qualitative. P's pass-through is Kp·σ = 0.4 N of command at Kp 20, from the formula (Kp + Kd/τf)σ (test l.134).
- **Optional `ch11-q5`** (if replacing q3 is acceptable, since q3 is Ch 10 material):
  - q: "The motors get slower: their lag goes from 0.05 s to 0.1 s. What happens to our reference tune?"
  - A (correct): "Its phase margin shrinks, from about 33° to about 21°, so it gets more wobbly". Why: "A lag holds the wave back by arctan(ωτ), which is Chapter 10's phase lag."
  - B: "Nothing: the lag is shorter than the 20 s mission". Why: "What matters is the lag compared with the loop's wiggle, about 10 rad/s, not the length of the mission."
  - C: "It droops more". Why: "The droop is set by gravity and the gains. A lag changes *timing*, not the final force balance."
  - Verified: test l.189 (33.4° → 20.5°).
- **Self-assessment line** (outline) in `final-check` b0: "First, your mission: how many stars did you earn, and which one was hardest? Say *why* out loud before you read on." This reuses the `best` progress. Optional: render "{n} of 6 stars, best tune …" inline from `progress`.
- **Map:** see 6e.

#### 8. Numerical claims (verified)

Test file: `$SCRATCH/checks/ch11-numbers.test.ts` (31 tests, all pass). Seed 7 unless stated.

| Claim | Expected value | Method (test file + line) | Result |
|---|---|---|---|
| Hover thrust with package "about 6.9 N" | 6.867 N | 0.7·9.81 (l.33) | ✓ |
| Hover thrust after drop "4.9 N" | 4.905 N | 0.5·9.81 (l.33) | ✓ |
| Integral must change by 0.2·g | 1.962 N | (l.33) | ✓ |
| Briefing numbers = code (20 s, 0.05 s, 2 cm, 6–9 s, −1.5 N, 0.2 kg, 12 s, 2 m) | MISSION object | `toMatchObject` (l.38) | ✓ |
| Checklist limits = code (3 s, 10 %, 20 cm, 2 s, 0.5 N, ±5 cm) | LIMITS | (l.38) | ✓ |
| 20 N vs loaded weight | 2.91× (bare 4.08×) | (l.42) | ✓, new sentence |
| Reference tune: arrival | 1.26 s | `evaluate(runMission)` (l.50) | ✓ ≤ 3 |
| Reference: overshoot | 0.17 % | (l.50) | ✓ < 10 |
| Reference: gust deviation | 6.8 cm | (l.50) | ✓ < 20 |
| Reference: recovery | 1.46 s | (l.50) | ✓ < 2 |
| Reference: ground | clear | (l.50) | ✓ |
| Reference: calm (thrust std 3–6 s) | 0.217 N | (l.50) | ✓ < 0.5 |
| Reference: 6 stars on 30 seeds, calm range | 30/30, 0.19–0.27 N | seeds 1–30 (l.59) | ✓ |
| Take-off: command pinned at 20 N | 0.268 s | 1 ms count (l.65) | ✓ |
| Reference nominal poles | −35.3, −3.95 ± 11.3i, −2.74, −1.08 | `missionPoles` (l.70) | ✓ all inside −40 |
| June: stars / overshoot / calm | 2 / 27.9 % / 0.643 N | (l.78) | ✓ "screaming… overshoots too" |
| June "flawless in calm air" (σ = 0) | 6 stars, arrival 1.27 s | (l.86) | ✓ |
| Theo "clipped at 0 N far more often than at 20 N" | command at 0 N 57.2 %, at 20 N 22.6 % of 3–6 s; motor thrust 2.99–10.6 N | end-of-step command samples (l.91) | ✓ for the command; **not visible** on the plotted motor thrust |
| Text fix (30, 15, 6, .04) "6 stars", "a hair of speed" | 6 stars at seed 7; arrival **2.68 s** (vs 1.27 s); overshoot 4.1 %; seed 5 fails arrival (3.01 s) | (l.99) | ✓ stars; ✗ "a hair" |
| Proposed fix (30, 15, 7, .04) | 30/30 seeds; arrival 1.87 s; calm 0.315 N | (l.108) | ✓ |
| False-obvious: Kd 8 is not safer than Kd 7 | (30,15,8,.04) 23/30 seeds (recover fails) | (l.108) | ✓ |
| False-obvious: lengthening only the filter isn't enough | (30,15,10,.04) recover 2.76 s (noise-free 1.22 s) → fails | (l.117) | ✓ |
| Filter vs chatter, Kd 5: motor-thrust std | 0.55 N (τf 0.005) → 0.218 N (0.04) | (l.126) | ✓ |
| Filter vs chatter, Kd 5: command std (clipped) | 7.82 N → 2.80 N | (l.126) | ✓ |
| Unclipped command noise ≈ (Kp + Kd/τf)·σ | 17.3 (τf .005, formula 20.4), 5.16 (.02), 2.82 (.04), 1.62 (.08) N | no limits (l.134) | ✓ within 3 % for τf ≥ 0.04, 16 % at 0.005 |
| False-obvious: more Kd ≠ calmer (τf 0.04) | 0.218 / 0.257 / 0.407 / 0.473 N at Kd 5/6/10/12; noise-free Kd 10 < 0.04 N | (l.145) | ✓ |
| P+D steady gust deviation = 1.5/Kp | 15.0 / 7.5 / 5.0 cm at Kp 10/20/30 | long gust, σ 0 (l.157) | ✓ |
| False-obvious: pure P (no D) doesn't show 1.5/Kp | deviation ≠ 7.5 cm (lightly damped with motor lag) | (l.164) | ✓ |
| P+D after drop: settles higher by 0.2g/Kp | 9.81 cm | (l.169) | ✓ predict option P "different droop" |
| Integral change across drop (no gust, σ 0) | 1.962 N; ∫e = 0.131 m·s | (l.174) | ✓ |
| Same in full mission | 2.08 N (gust residue still unwinding) | (l.181) | ✓ explained |
| Motor-lag sweep (reference tune, nominal) | τm 0: ωc 10.80, PM 58.5°; 0.02: 10.60, 46.8°, lag 12.0°; 0.05: 9.85, 33.4°, lag 26.2°; 0.1: 8.54, 20.5°, lag 40.5° | bisection on \|L(iω)\| (l.189) | ✓ |
| False-obvious: PM drop ≠ arctan at old ωc | drop 25.1° vs 28.4° | (l.198) | ✓ |
| Short lag ≈ delay | ωτ = 28.2° vs arctan 26.2° | (l.203) | ✓ |
| "D from measurement" toggle effect | max \|Δh\| < 1e−9 m (4.9e−15) | (l.209) | ✓ **dead control** |
| Default tune (10, 0, 1, .02) | 3 stars; gust deviation 89.4 cm | (l.215) | ✓ |
| June's fast pole | −202.2 s⁻¹ (off −40) | (l.220) | ✓ |
| P2 playable: D-only command noise ≈ Kd·σ/τf | 3.5 N (Kd 7, τf .04) within +2/−5 %; 40 N (June) comes out 10–20 % low | parked drone (l.226) | ✓ "about" |
| P1 playable values | 1.962 N, 0.1308 m·s, 2.62 s | arithmetic (l.237) | ✓ |
| P5 playable: first command clipped | 20 N (Kp·2 = 40) | (l.242) | ✓ |
| Noise alone lifts a weak-Kp/huge-Kd tune into the page | (5, 0, 12, .005) peak 5.97 m; σ 0 < 2 m | (l.251) | ✓ page-hit.ts comment holds |
| Ch 9-style tune (20, 10, 4) in the mission | 4 stars (τf .02), 5 stars (τf .04, arrival 3.53 s) | `ch11-explore.log` | ✓ "a good start" only |
| (25, 20, 6, .04) as a second reference | 30/30 seeds, arrival 1.13 s, calm 0.27 N | `ch11-seeds.log` | ✓ |

---

---

## Phase 7 — Translations and review (`1.0.x`)

All new prose, play sentences, side trips, status keys and quiz items land in every locale in
the same commit as English (`locales.test.ts` checks structure, maths, `{scrub|…}`/`{calc|…}`
tokens, placeholders and colour markers). Then:

- **Glossary additions per locale**, recorded like the Ch 4/6 table (definition, choice,
  rejected alternatives, source from the `AGENTS.md` table, first chapter). Consolidated list of
  new or newly load-bearing terms (each chapter phase gives the English definition):
  - *Ch 7:* probe (Laplace probe), Laplace transform, linearity ("areas scale and add"),
    integration by parts, partial fractions, cover-up trick, completing the square, starting
    value / starting speed (f(0), f′(0)), "sloshes" (an area that never settles), RK4 ("tiny
    steps with a four-look recipe"), signal.
  - *Ch 8:* transfer function, pole, zero, mirror (conjugate) pair p̄, dominant pole, peak time,
    first push, thrust budget, motor limit / saturation, starting from rest (zero initial
    conditions), rule of thumb, double pole, "reading the map".
  - *Ch 9:* integral action / the pile, integrator time constant (τ_I ≈ Kp/Ki), Routh–Hurwitz
    criterion ("you can't reach the other side without touching the wall"), derivative kick,
    derivative on measurement, derivative filter / τ_f, integrator windup / anti-windup, motors
    pinned, pole–zero (near) cancellation, "asked for" vs "delivered" thrust.
  - *Ch 10:* phase / phase lag (share of a wiggle, degrees), frequency response, Bode plot, gain
    of a system at one speed, smoother (the first-order lag; one term replacing "thermal lag",
    "thermal response", "mixing"), gain margin, phase margin, phase lead, delay margin, hunting,
    logarithmic axis ("the squashed ruler"), robust, the loop symbol chosen to replace `L(s)`.
  - *Ch 11:* motor lag, commanded vs delivered thrust, clipping, crossover (frequency), fast vs
    calm (map node), standard deviation (one term per locale, consistently), "the same random
    jitter every flight" (avoid "seed").
  - *Map nodes:* `limits`, `motorlag`, `tradeoff`, relabelled `bode` ("frequency response /
    Bode plot") in `common.json` for all 10 locales.
- **Already-flagged inconsistencies to settle while here** (from the Ch 4/6 status): zh-CN
  稳定时间 (ch06/08) vs 调节时间 (ch09) for settling time; es "tiempo de establecimiento" vs
  "asentamiento"; de "Modi" vs "Moden"; fr "temps de réponse" vs the widget's "stabilisé".
  Ch 8/9/11 all say "settling", so pick one per locale now.
- **Numbers in play sentences**: every output goes through `fmt()`; decimal commas inside maths
  as `{,}`; `<bdi>`/`dir="ltr"` isolation for numbers followed by units in `ar` (the `valueDir`
  fix from Ch 4/6 applies). Test the ~30 new play sentences in `ar` (RTL), `ja` and `zh-CN`
  (line breaks around inline numbers and units), `de`/`pl` (long words next to scrubbable spans).
- **Status-line variables** (`{g}`, `{T}`, `{p}`, `{req}`, `{j}` …) are new placeholders;
  `locales.test.ts` will require them in every locale.
- **Native-speaker review** (control knowledge) queued for every new string, quiz option and
  glossary choice; `AGENTS.md` names the sources per locale. Machine translation is not final
  verification.

**Testable outcome:** `pnpm test` (incl. `locales.test.ts` and `play.test.ts`), `pnpm a11y`
(every language, en dark), and screenshots of every changed widget and play sentence at
1280/375 × light/dark in `en`, `de` and `ar` (and `ja` for one CJK check).

---

## Risks (cross-chapter)

- **Length.** Ch 7 `solve` (19 blocks) and Ch 8/9 `poles` are already the longest text runs.
  Every added derivation goes into a callout so the main thread stays: idea → widget → mistake
  → fix. Cap side trips at 3–5 sentences; move the longest (Ch 8 "How good is 4/σ?", Ch 10
  "velocity form") to the end of their sections.
- **Numbers that depend on the simulation** (Ch 8 saturated sweet spot 0.72 s, Ch 9 climb times,
  Ch 10 `comfortTime`, Ch 11 star counts): compute them in code, say "about" in prose, and pin
  them in tests with a tolerance. Ch 11 tunes are tested on 30 noise seeds, not seed 7 alone.
- **Cross-chapter numbers must agree.** With the 20 N limit on "from Chapter 8", the Kp = 20
  drone overshoots 74.9 % (not 60.5 %) on a 1 m step; Ch 9 must not quote the unsaturated
  figure. Ch 10's 6.6 s is the position hand; Ch 0's robot hands hunt at 13.8 s; the outline is
  wrong, not the chapter.
- **Renames that touch maths in all locales** (Ch 10's loop symbol, Ch 8's T(s) → G(s), Ch 9's
  ∫ dummy variable): one commit each, `locales.test.ts` compares maths across locales.
- **Removing a control** (Ch 11 `dMeas` toggle) touches 10 locales and saved `best` tunes; keep
  reading old saves.
- **Motion rules.** Autoscale (Ch 7/8) eases on pointer release only and snaps on keyboard;
  the finale map draw-in is off under reduced motion; Ch 8's reduced-motion fix pins the drone.
- **Page physics (rules 1–11).** No new page physics anywhere: Ch 7 has no drone picture and a
  bonk would contradict "formula = sim"; Ch 8/9/11 keep theirs and fix the ground handover
  (Ch 8), the plot range (Ch 9) and scroll re-measure (Ch 11). Rule 7 was measured for every
  widget (see each phase).
- **Play tokens can't live inside `$…$`**; sentences with maths keep the scrubs in prose.
- **The map is on every page**, so its re-layout needs screenshots of all 12 chapter maps in
  `en`, `de`, `pl`.

---

## Order of commits (sketch)

Shared blocks first, then chapters in course order so each chapter can cite the previous one's
new sentences. Each chapter's own detailed order is at the end of its phase.

1. `feat(story): register plays for ch07–ch11; widgets can follow play:<id>` + tests (1a, 1i)
2. `feat(ui): plot label avoidance, custom ticks, autoscale/clamp, distance arrow, non-pole marker` + tests (1b–1d)
3. `feat(ui): s-plane circle, ζ rays, true off-edge values, ghosts, snapping, narrow fonts` + tests (1e)
4. `fix(ui): drone-view target label placement and minimum text size; toggle names via plainText; readout hyphenation` (1f, 1j, 1s)
5. `feat(sim): record commanded thrust in traces; ground handover; multi-seed helper` (1g, 1n, 1p)
6. `feat(story): math block that swaps on a bus event; regime strings in common.json` (1h, 1q)
7. `feat(math): loop margins, critical hand gain, delay margin; region-from-metric contour` (1o, 1m)
8. `feat(map): overlap test, limits/motorlag/tradeoff nodes, relabelled bode, finale draw-in` (1r)
9. Ch 7 commits 1–11 (Phase 2)
10. Ch 8 commits 1–10 (Phase 3)
11. Ch 9 commits 1–11 (Phase 4)
12. Ch 10 commits 1–10 (Phase 5)
13. Ch 11 commits 1–12 (Phase 6)
14. `docs: update control-course-plan.md for chapters 7–11` (criteria, quiz changes, 13.8 s vs 6.6 s, peak-thrust star)
15. `docs: glossary choices and open reviews for chapters 7–11` (Phase 7)

## What's Next

- **Chapter 2's droop sentence** (`4.9/Kp`) and Chapter 0's "3½ s shift" (= L + τ, the slow-wiggle
  lag Ch 10 now derives) are the two remaining places where a stated number wants a `play`.
- **Root locus for real:** Ch 8's playground with a "split on the real axis" mode plus Ch 9's
  `play:cliff` following is one step from "drag the gain and watch the poles move" (the outline's
  first "where next" topic). Consider a Ch 9 side trip that does exactly that with Ki.
- **A Ch 10 → Ch 11 bridge widget:** the drone's own Bode plot with the motor lag on/off, using
  the shared `loopMargins` helper, would let Ch 11's "25° of phase margin" be *seen*.
- **Audit Chapters 0–3 and 5** with the same terms-before-use table; Ch 5 is the source of most
  bridges (spinners, degrees, ×(−1) as a half-turn) that Ch 7 and Ch 10 want to cite.
- **Delight pass** (as done for Ch 4/6): voice share per chapter (Ch 8 `poles` and Ch 9 `poles`
  are long prose runs), one lock-in pop per chapter's "aha" (Ch 7 matched spins → 1/σ; Ch 8
  challenge met; Ch 10 first stable robot shower), and character beats for the new mistakes
  (June's "if 4 is good, 10 is better" in Ch 9; June's −8 ± 8i slide in Ch 8).

---

## Appendix — screenshot index

All under `$SCRATCH/shots/`. Names are `<width>-<theme>[-<lang>]-<widget|full|state>.png`.
The chapter phases cite the ones that justify a finding.

**ch07** (33 files): `1280-dark-derivRule.png`, `1280-dark-explode.png`, `1280-dark-full.png`, `1280-dark-probe.png`, `1280-dark-solve.png`, `1280-dark-table.png`, `1280-dark-unspin.png`, `1280-light-derivRule.png`, `1280-light-explode-close.png`, `1280-light-explode.png`, `1280-light-full.png`, `1280-light-probe-keyboard.png`, `1280-light-probe-sine-s0.png`, `1280-light-probe.png`, `1280-light-solve.png`, `1280-light-table.png`, `1280-light-unspin-matched.png`, `1280-light-unspin.png`, `375-dark-derivRule.png`, `375-dark-explode.png`, `375-dark-full.png`, `375-dark-probe-lower.png`, `375-dark-probe.png`, `375-dark-solve.png`, `375-dark-table.png`, `375-dark-unspin.png`, `375-light-derivRule.png`, `375-light-explode.png`, `375-light-full.png`, `375-light-probe.png`, `375-light-solve.png`, `375-light-table.png`, `375-light-unspin.png`

**ch08** (31 files): `1280-dark-full.png`, `1280-dark-limit.png`, `1280-dark-playground.png`, `1280-dark-recipe.png`, `1280-dark-zero.png`, `1280-light-full.png`, `1280-light-limit-sigma8.png`, `1280-light-limit.png`, `1280-light-playground-rhp-0.9s.png`, `1280-light-playground-rhp-3.5s.png`, `1280-light-playground-rhp-9.5s.png`, `1280-light-playground.png`, `1280-light-recipe.png`, `1280-light-reduced-motion-playground-rhp.png`, `1280-light-zero-near-origin.png`, `1280-light-zero.png`, `375-dark-full.png`, `375-dark-limit.png`, `375-dark-playground.png`, `375-dark-recipe.png`, `375-dark-zero.png`, `375-light-de-full.png`, `375-light-de-limit.png`, `375-light-de-playground.png`, `375-light-de-recipe.png`, `375-light-de-zero.png`, `375-light-full.png`, `375-light-limit.png`, `375-light-playground.png`, `375-light-recipe.png`, `375-light-zero.png`

**ch09** (31 files): `1280-dark-damper.png`, `1280-dark-full.png`, `1280-dark-integral.png`, `1280-dark-kick.png`, `1280-dark-noise.png`, `1280-dark-playground.png`, `1280-dark-poles.png`, `1280-light-damper.png`, `1280-light-full.png`, `1280-light-integral.png`, `1280-light-kick.png`, `1280-light-noise.png`, `1280-light-playground-20-10-4-keyboard.png`, `1280-light-playground-bonk-early.png`, `1280-light-playground-bonk-end.png`, `1280-light-playground.png`, `1280-light-poles.png`, `375-dark-damper.png`, `375-dark-full.png`, `375-dark-integral.png`, `375-dark-kick.png`, `375-dark-noise.png`, `375-dark-playground.png`, `375-dark-poles.png`, `375-light-damper.png`, `375-light-full.png`, `375-light-integral.png`, `375-light-kick.png`, `375-light-noise.png`, `375-light-playground.png`, `375-light-poles.png`

**ch10** (30 files): `1280-dark-bode.png`, `1280-dark-designer.png`, `1280-dark-full.png`, `1280-dark-margins.png`, `1280-dark-phase.png`, `1280-dark-replay.png`, `1280-light-bode-swept.png`, `1280-light-bode.png`, `1280-light-designer-june.png`, `1280-light-designer.png`, `1280-light-full.png`, `1280-light-margins.png`, `1280-light-phase.png`, `1280-light-replay.png`, `375-dark-bode.png`, `375-dark-designer.png`, `375-dark-full.png`, `375-dark-margins.png`, `375-dark-phase.png`, `375-dark-replay.png`, `375-light-bode.png`, `375-light-de-designer-hud.png`, `375-light-de-designer.png`, `375-light-de-margins.png`, `375-light-de-replay.png`, `375-light-designer.png`, `375-light-full.png`, `375-light-margins.png`, `375-light-phase.png`, `375-light-replay.png`

**ch11** (18 files): `1280-dark-full.png`, `1280-dark-map.png`, `1280-dark-mission-a.png`, `1280-dark-mission-b.png`, `1280-light-full.png`, `1280-light-map.png`, `1280-light-mission-a.png`, `1280-light-mission-b.png`, `375-dark-full.png`, `375-dark-map.png`, `375-dark-mission-a.png`, `375-dark-mission-b.png`, `375-dark-mission-c.png`, `375-light-full.png`, `375-light-map.png`, `375-light-mission-a.png`, `375-light-mission-b.png`, `375-light-mission-c.png`
