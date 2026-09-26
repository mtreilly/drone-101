# Open issues

Known gaps between `AGENTS.md` and the code, and reviews that still need people. Remove an entry
in the commit that fixes it; re-check an entry before relying on it, since the code may have moved on.

## Rules not yet met by the code

- **Canvas text does not redraw after web fonts load.** Nothing listens to `document.fonts.ready`
  (or `loadingdone`), and the canvas font helper caches the resolved font family per language.
  The first paint of a canvas label can use a fallback font until something else redraws it. Fix
  in shared code: redraw registered canvases once fonts are ready.
- **No `prefers-contrast: more` or `forced-colors` styles.** Only `prefers-reduced-motion` is
  handled. Needed at least: visible borders on cards, sliders and knobs; system colours for focus
  rings; plot lines and the colour language (setpoint, output, error, effort, disturbance) still
  distinguishable by dash pattern or marker, not colour alone.
- **Live regions are not throttled everywhere.** Plots only write their description when the text
  changes; the s-plane description is rewritten on every update. Check every `aria-live` region
  while dragging and holding an arrow key, and throttle any that chatter.
- **Chapter 0 has no number tests.** Its text states numbers (38 °C, 2.5 s pipe delay, the ~3½ s
  apparent lag, the patient hand's ~51 % knob, quiz timings) that are only indirectly covered by
  the shared sim tests. Add a chapter test that pins each one.

## Documentation drift

- `docs/course-plan.md` still has outline details that the built chapters changed (Chapter 10's
  callback periods, Chapter 11's mission criteria and others). `docs/plans/ch07-11-extension.md`
  lists them; update the outline as each is settled.

## Reviews owed (people, not code)

- Native-speaker review, by someone with control/engineering knowledge, of every locale's
  glossary, prose, graph labels and quiz explanations. Open points raised by translators are in
  `docs/glossary.md` under "Open terminology questions".
- A cast sheet settling each character's grammatical gender (or neutral phrasing) per language.
- An Arabic reviewer's decision on numeral style.
