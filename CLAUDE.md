# Who Keeps the Drone Up? — project guide

An interactive, hand-drawn course that takes a curious beginner from "what is feedback?" to
Laplace transforms, poles and PID control. Vite + TypeScript, no framework. See `README.md`
for layout and `control-course-plan.md` for the pedagogical outline and physical parameters.

## Key inspirations (the quality bar)

- **"Who Is Fourier?" (Transnational College of LEX)** — warmth, learner voice, one driving
  question, tools built only when the story needs them. We borrow the *spirit* only: every
  character, line of text and drawing here is original. Mika, Theo and June discover things
  together; there is no lecturing expert, and every chapter shows a real mistake being fixed.
- **3Blue1Brown** — visual intuition before formalism: concrete → picture → symbol.
- **Bartosz Ciechanowski's interactive essays** — everything explorable and physically grounded,
  linked representations that update together.
- **Pixar-level attention to detail** — the small things (spacing, timing, a blink, a label that
  never collides) are what make it feel alive.

## Non-negotiables

1. **Correct maths and physics.** Simulations use RK4 (`src/sim/`), analytic checks live next to
   them, and every number stated in a chapter's text or quiz is verified by a test in that chapter
   (`src/chapters/chNN/*.test.ts`). If you change a number, change the test and all six languages.
2. **Colour language, everywhere:** setpoint green (dashed), output blue, error red, control effort
   orange, disturbance purple, poles black ×, zeros open ○, previous run = faint ghost. KaTeX macros
   `\sp{} \out{} \err{} \eff{} \dis{}` keep equations in step with plots.
3. **Pedagogy per chapter:** driving question → feel it (interactive) → gated predict-then-reveal →
   one idea per section → a character's misconception and mistake → recap → 2–4 quiz items with a
   "why" for *every* option → concept map → cliffhanger.

## i18n: consistency is a feature

- **No hard-coded visible strings.** All text lives in `public/locales/{lang}/{namespace}.json`
  (`common.json` + one `chNN.json` per chapter). Widgets read `ctx.t('…')` (their
  `widgets.<id>` subtree), shared chrome uses `tc('…')`.
- Languages: **en (source), fr, es, it, de, pl** — listed in `src/core/languages.ts` (endonyms,
  never flags). Files load lazily per language *and* per chapter; the next chapter is prefetched.
  A missing file falls back to English at runtime, but must never ship that way.
- **Every change to English text must be mirrored in all five translations in the same commit.**
  `src/core/locales.test.ts` enforces identical structure, control fields (`t`, `who`, `mood`,
  `id`, `sketch`, `correct`, `gate`, …), maths, `{placeholders}` and colour markers. It must pass.
- Keep each language's glossary consistent (feedback, setpoint, plant, overshoot, droop, pole,
  s-plane — "map of s" before chapter 7 — etc.). Match the voice: playful, short sentences,
  informal address. Prose uses the language's number format (decimal comma outside English);
  inside maths write decimal commas as `{,}` (`tex()` also protects `1,5` automatically).
- Numbers in widgets always go through `fmt()` (locale-aware); never `toFixed()` for visible text.
- `<html lang/dir>` follows the language (hyphenation and screen-reader pronunciation depend on it).

## Accessibility: checked, not assumed

- Target: **WCAG 2.2 AA**, keyboard-first, screen-reader friendly, `prefers-reduced-motion`,
  `prefers-contrast: more` and forced-colours respected.
- **Run the axe-core CLI suite before committing UI changes:**
  - `pnpm a11y --quick` — English, light theme, every page
  - `pnpm a11y` — every page in every language (+ English dark)
  - `pnpm a11y --full` — every language × both themes (168 pages)

  It builds, serves the site and runs `@axe-core/cli` with `?reveal` (opens prediction gates so
  hidden widgets are tested) and `?theme=` / `?lang=`. It needs Chrome plus a matching
  ChromeDriver (`pnpm install` builds chromedriver; set `CHROME_PATH` if Chrome is elsewhere).
  **Zero violations is the bar.** axe finds only part of the problems, so also check by hand:
  tab through every control, use arrow keys on sliders, knobs and s-plane points, and read the
  live-region text.
- Every control has an accessible name (maths-only labels get a plain-text `aria-label` via
  `plainText()`), live regions are throttled, focus is visible, drag interactions have keyboard
  equivalents, and motion is never the only cue.

## Animation, UI and UX craft

- Motion must have a purpose: feedback, state change, explanation, or gentle life (character blink,
  breathe, hello nod). Never animate keyboard-driven steps or high-frequency interactions.
- Use the easing tokens (`--ease-out`, `--ease-in-out`, `--ease-std`); keep UI transitions under
  ~300 ms; press feedback is `scale(0.96)`; never animate from `scale(0)`; transition named
  properties only; entrances use the `translate` property so they compose with layout transforms.
- Friendly text uses **Patrick Hand**; **Caveat** only for large display headings; body text is
  Atkinson Hyperlegible. Canvas text must redraw after `document.fonts.ready`.
- Widgets share one anatomy: title → visual(s) → sliders (`.w-controls`) → readouts + transport
  (`.w-hud`) → status (reserves its height) → help. Labels never collide; stacked plots share a left
  edge; nothing clips at 375 px.
- Characters are theme-proof "stickers" (same colours day and night) with one shared idle loop.
- **Do multiple passes.** Screenshot every changed widget at 1280 px and 375 px, in light and dark
  (and in a long-word language such as German or Polish), look at the images, fix, and look again.
  Parallel agents per chapter work well for big passes; shared components stay with one owner.

## Commands

```sh
pnpm dev           # http://localhost:5173
pnpm test          # maths/physics checks + locale validator
pnpm lint          # oxlint
pnpm build         # static site in dist/
pnpm a11y          # axe-core accessibility suite (see above)
```

Use `agent-browser` with a named session for visual checks (`?lang=de&theme=dark&reveal`).
Commit in small conventional commits (`feat:`, `fix:`, `docs:` …).
