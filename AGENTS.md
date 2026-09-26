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

1. **Correct maths and physics.** The drone uses RK4; the shower uses an exact update for its
   first-order thermal lag (`src/sim/`). Analytic checks live next to
   them, and every number stated in a chapter's text or quiz is verified by a test in that chapter
   (`src/chapters/chNN/*.test.ts`). If you change a number, change the test and every supported locale.
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
- Current languages: **en (source), fr, es, it, de, pl, pt-BR, ja, zh-CN, ar** (Modern Standard
  Arabic). List supported locales in `src/core/languages.ts` (endonyms,
  never flags). Files load lazily per language *and* per chapter; the next chapter is prefetched.
  A missing file falls back to English at runtime, but must never ship that way.
- **Every change to English text must be mirrored in every supported translation in the same commit.**
  `src/core/locales.test.ts` enforces identical structure, control fields (`t`, `who`, `mood`,
  `id`, `sketch`, `correct`, `gate`, …), maths, `{placeholders}` and colour markers. It must pass.
- Keep each language's glossary consistent (feedback, setpoint, plant, overshoot, droop, pole,
  s-plane — "map of s" before chapter 7 — etc.). Match the voice: playful, short sentences,
  natural address for that language. Format prose numbers according to the locale, not a blanket
  "decimal comma outside English" rule; inside maths write decimal commas as `{,}` (`tex()` also
  protects `1,5` automatically).
- Numbers in widgets always go through `fmt()` (locale-aware); never `toFixed()` for visible text.
- `<html lang/dir>` follows the language (hyphenation and screen-reader pronunciation depend on it).

### Translation sources and term verification

Translate the **concept**, then choose the local term. For each important term, record its English
definition, target-language choice, rejected alternatives, supporting sources, first chapter, and
any note needed for student-friendly wording. Check ambiguous terms such as *plant*, *setpoint*,
*overshoot*, *pole*, *zero*, *gain*, *droop*, *phase margin*, *feedback*, and *control effort* against
a control-engineering teaching source in the target language. A general dictionary can confirm
spelling or usage; it cannot settle the engineering meaning. Aviation authorities are for aircraft
names, not control theory. Sources support original prose; do not copy their explanations.

| Locale | Control/measurement terminology | Aviation terminology | Language and layout |
| --- | --- | --- | --- |
| `en` | [MIT Feedback Control Systems notes](https://ocw.mit.edu/courses/16-30-feedback-control-systems-fall-2010/pages/lecture-notes/); [NIST SI guide](https://www.nist.gov/publications/guide-use-international-system-units-si) for units | [FAA UAS definition](https://www.faa.gov/faq/what-unmanned-aircraft-system-uas) | [Microsoft English writing guide](https://learn.microsoft.com/en-us/style-guide/welcome/) for clear UI/documentation prose |
| `fr` | [ENAC automatic-control course](https://recherche.enac.fr/~thierry.miquel/wp-content/uploads/2021/01/poly-iessa-2020-TempsContinu.pdf); [FranceTerme](https://www.culture.fr/franceterme) where an entry covers the concept | [French civil-aviation drone glossary](https://www.ecologie.gouv.fr/sites/default/files/documents/Guide_categorie_Ouverte.pdf) | [Académie française dictionary](https://www.dictionnaire-academie.fr/) for spelling and usage |
| `es` | [UPM control notes](https://www.robolabo.etsit.upm.es/asignaturas/seco/apuntes/2015-2019/introSECO.pdf) | [AESA UAS/drone material](https://www.seguridadaerea.gob.es/es/ambitos/drones/operaciones-uas-drones) | [RAE/ASALE Diccionario panhispánico de dudas](https://www.rae.es/dpd/) for cross-regional usage and orthography; avoid accidental Spain-only colloquialisms |
| `it` | [Politecnico di Milano Automatica material](https://rocco.faculty.polimi.it/FDA/auto.html) | [ENAC UAS material](https://www.enac.gov.it/sicurezza-aerea/droni/operatori-di-droni-uas) | [Treccani Vocabolario](https://www.treccani.it/vocabolario/) and [Accademia della Crusca language advice](https://accademiadellacrusca.it/it/consulenza) |
| `de` | [TU Dresden system-theory notes](https://dmz2.itml.et.tu-dresden.de/itml/teachings/courses/systemtheorie/systemtheorie/systh_heft.pdf) | [German air-navigation drone material](https://www.dfs.de/homepage/de/drohnenflug/verkehrsmanagement-fuer-drohnen/) | [official German spelling rules](https://www.rechtschreibrat.com/regeln-und-woerterverzeichnis/) and [Duden](https://www.duden.de/woerterbuch) for usage |
| `pl` | [Warsaw University of Technology control exercises](https://ztmir.meil.pw.edu.pl/web/content/download/9138/44768/file/Praca%20domowa%20PAS2_seria1_2022.pdf); [AGH control lab](https://home.agh.edu.pl/~tst/cw/ZK.pdf) | [Polish Civil Aviation Authority drone material](https://ulc.gov.pl/drony/informacje-ogolne) | [Polish Language Council spelling/punctuation rules](https://rjp.pan.pl/zasady-pisowni-i-interpunkcji-polskiej-2/) and [PAN dictionary](https://wsjp.pl/) for usage; apply the rules effective from 2026 |
| `pt-BR` | [USP control notes](https://sites.poli.usp.br/d/PME2472/LR.pdf); [Inmetro metrology vocabulary](https://www.gov.br/inmetro/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos-em-metrologia/vim_2012.pdf) | [ANAC drone material](https://www.gov.br/anac/pt-br/assuntos/drones/projetos-autorizados) | [Brazilian Academy of Letters VOLP](https://www.academia.org.br/nossa-lingua/busca-no-vocabul%C3%A1rio) for spelling; use Brazilian, not European, Portuguese |
| `ja` | [Osaka Metropolitan University control lectures](https://www.ct.omu.ac.jp/pect-lab/lecture/control_engineering_1/); [IEEJ electrical terminology](https://www.iee.jp/jec/) where relevant | [MLIT unmanned-aircraft material](https://www.mlit.go.jp/koku/koku_tk10_000003.html) | [W3C Japanese layout requirements](https://www.w3.org/TR/jlreq/) for punctuation and line breaks |
| `zh-CN` | [national science terminology database](https://www.termonline.cn/about); [Southeast University control syllabus](https://ee.seu.edu.cn/2015/1214/c13622a137753/page.htm) | [CAAC unmanned-aircraft terminology](https://www.caac.gov.cn/XXGK/XXGK/FLFG/202401/t20240115_222642.html); use for names, not operational advice | [GB/T 15834 punctuation](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=22EA6D162E4110E752259661E1A0D0A8); [W3C Chinese layout requirements](https://www.w3.org/International/clreq/); use simplified characters and mainland usage |
| `ar` | [ALECSO Arabterm/unified dictionaries](https://arabization.codict.ma/pub/dictionaries) for candidates; corroborate with Arabic-language engineering teaching material, e.g. [Benha University](https://feng.bu.edu.eg/images/PDF/bylaws21-ar.pdf) | [ICAO Arabic aviation material](https://www.icao.int/ar/news/icao-enhances-global-aviation-safety-and-security-framework) | [W3C Arabic layout requirements](https://www.w3.org/TR/alreq/) for RTL, numbers, and mixed-script text; write accessible Modern Standard Arabic, not a regional dialect |

For all locales, [Microsoft localization style guides](https://learn.microsoft.com/en-us/globalization/reference/microsoft-style-guides) help with UI conventions, and [Unicode CLDR](https://cldr.unicode.org/index/charts) helps check number formats. Neither replaces control-engineering sources. Prefer a native-language control course when an official terminology bank and normal classroom usage disagree; document the choice. Have a native speaker with control/engineering knowledge review the glossary, chapter prose, graph labels, and every quiz answer and explanation. Machine translation and bilingual dictionaries may suggest candidates, but are not final verification.

When adding a locale, verify locale-file structure, maths, placeholders, colour markers, numerical
claims and quiz semantics. Check fonts for script coverage and readable canvas labels. Test narrow
screens and screen readers. For `ar`, test RTL layout and isolation of LTR formulas, units, symbols
and chart axes; use logical CSS spacing and keep physical-coordinate SVG drawings in LTR direction
so text anchors stay on the intended side. Isolate mixed Arabic labels and Latin units when their
visual order matters. Agree on numeral style with an Arabic reviewer rather than assuming one style
for all Arabic readers. For `ja` and `zh-CN`, inspect line breaks, punctuation, and CJK glyph coverage.

## Accessibility: checked, not assumed

- Target: **WCAG 2.2 AA**, keyboard-first, screen-reader friendly, `prefers-reduced-motion`,
  `prefers-contrast: more` and forced-colours respected.
- **Run the axe-core CLI suite before committing UI changes:**
  - `pnpm a11y --quick` — English, light theme, every page
  - `pnpm a11y` — every page in every language (+ English dark)
  - `pnpm a11y --full` — every language × both themes (280 pages)

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
- Friendly Latin-script text uses **Patrick Hand**; **Caveat** only for large display headings;
  Latin body text is Atkinson Hyperlegible. Japanese, Simplified Chinese and Arabic use their
  matching Noto Sans fonts, including canvas labels via `src/core/font.ts`. Canvas text must
  redraw after `document.fonts.ready`.
- Widgets share one anatomy: title → visual(s) → sliders (`.w-controls`) → readouts + transport
  (`.w-hud`) → status (reserves its height) → help. Labels never collide; stacked plots share a left
  edge; nothing clips at 375 px.
- Characters are theme-proof "stickers" (same colours day and night) with one shared idle loop.
- **Do multiple passes.** Screenshot every changed widget at 1280 px and 375 px, in light and dark
  (and in a long-word language such as German or Polish), look at the images, fix, and look again.
  Parallel agents per chapter work well for big passes; shared components stay with one owner.

## Page-aware physics: the page is part of the world

When a simulated object overshoots its picture, it does not vanish behind the frame edge: it flies
out over the page, runs into real content (paragraphs, bubbles, headings, other cards, the sticky
top bar) and the page reacts. First built for Chapter 1's open-loop widget (`schedule`): the drone
climbs out of its picture, bonks the paragraph above, its motors stall, and it tumbles back down
through its own picture and crashes on the grass. Rules for adding this to other interactives:

1. **One object, never a copy.** The drawing inside the widget is the thing that leaves the frame
   (its SVG gets `overflow: visible`; its wrapper `position: relative; z-index: 40`, under the top
   bar's 50; the moving group gets `pointer-events: none`). No hand-off to a clone.
2. **A contact is a real event in the model.** It goes into the simulation (e.g.
   `DroneSim.hitCeiling()`), so the plots, readouts and status keep telling the truth. Never let
   the picture and the numbers disagree. The only visual-only freedom is for dimensions the model
   does not have (the 1-D drone's tumble angle and sideways drift), and those ease back to zero
   before anything the model can see happens (landing, crash).
3. **The event must teach.** Choose the model's response for the chapter's idea: in Chapter 1 the
   stall and crash show that an open-loop plan can't notice a ceiling either. Explain it in the
   widget's status line (a new string in every supported locale). Nothing in the prose may be
   contradicted by the new outcome.
4. **Page geometry comes from `src/ui/page-physics.ts`:** `pageSolids()` (what counts as solid:
   `SOLID_SELECTOR` (text, bubbles, prediction cards and their options, other cards, pictures)
   and the top bar; never the object's own picture or what contains it; inside its own card only
   other pictures such as an s-plane stacked above it on a phone, never its own title or labels),
   `ceilingHit()` (swept test, so a fast object can't tunnel through), `wobble()` (the thing that
   was hit jolts, using individual `translate`/`rotate` so it composes with layout transforms) and
   `impactBurst()` (hand-drawn strokes, positioned with `translate`, not `transform`). Everything is
   in document pixels and re-measured each frame, and nothing animates layout properties.
5. **Once per run.** Detect contacts only while rising and outside the picture, arm again when the
   object is back on the ground or reset. A reset or navigating away mid-flight must leave nothing
   behind.
6. **Precomputed traces** (players that replay arrays instead of stepping a live sim) can't react
   mid-flight. Measure the ceiling first (how many metres of open page are above the picture), pass
   it to the sim as a parameter and recompute the trace, so the replay already contains the hit.
   Re-measure after scroll as well as resize (debounced): the sticky top bar is solid too, so the
   ceiling moves as the page scrolls. Keep an unchanged replay going; restart only if the flight
   so far would differ (see `src/chapters/ch09/page-ceiling.ts`).
7. **Only where the physics really gets there.** Before adding it, measure how many metres of open
   page sit above the picture (at 1280 px and 375 px) and compare with what the model can actually
   reach. Chapter 2's P control peaks at 3.4 m and the page is ~7.6 m away, so it was left alone
   rather than faking a bonk by changing scales or ranges.
8. **Formula-driven widgets** (Chapter 8's pole playground plays an analytic response) hand over
   at the hit to the same `DroneSim`, started from the hit height and speed and stalled
   (`src/chapters/ch08/fall.ts`); the plot is re-set to the real path (formula up to the hit, then
   the fall). Once the drone is down it stays down until the replay restarts or the input changes:
   an analytic curve must never resurrect a crashed drone.
9. **Keep status lines true in every layout:** whether a hit happens depends on the page layout, so
   compose the message from the current verdict plus the hit sentence rather than a fixed text that
   assumes why it flew off.
10. **Reduced motion turns it off completely:** the object stays pinned and clipped at its
   picture's edge as before, and the readout still shows the true value.
11. **Test it:** a sim test for the event (what happens after it, until reset), unit tests for any
   geometry helper, and a recorded check (`agent-browser record start …`, then look at frames) at
   1280 px and 375 px, light and dark: a real bonk, reset mid-flight, navigate away mid-flight, and
   reduced motion.

How it is wired: `new DroneView(host, { onCeiling })` makes the drone free-flying and calls
`onCeiling` on a hit. Chapter 1 (live sim, via `droneRig({ onCeiling })`) calls `sim.hitCeiling()`
and shows `status.ceiling` instead of `status.crash`. Chapter 8 (formula) switches to `fallSim()`
and shows the verdict plus `verdict.hitPage`.

Shared building blocks (one owner: change them only with tests, never per chapter):
- `DroneSim.hitCeiling({ stall })`: `stall: true` motors stall and it falls (open loop, unstable
  poles); `stall: false` a bump the motors survive, so feedback can recover. `ceilingAt` records when.
- `DroneConfig.ceiling = { h, stall }`: the sim hits the ceiling by itself, for traces computed ahead.
- `DroneView.ceilingHeight()`: metres at which this drone would touch the page, from the live layout
  (verified to match where the view registers the hit). Re-measure and recompute on resize.
- `DroneView({ ceilingResponse: 'bump' })`: a short knock instead of the tumble, for `stall: false`.

## Lessons from past passes

Hard-won habits from extending chapters. They apply to any chapter, whatever the code looks like.

**Story and pedagogy**
- **Measure the voice, don't trust the feel.** Count what share of a chapter's blocks are dialogue
  and compare with its neighbours (roughly a quarter to a third). Adding explanations quietly turns
  a chapter into a lecture; when the share drops, give the new material back to Mika, Theo and June.
- **Compute a claim before you word it.** The obvious sentence is often only half true: ζ = 0.7 is
  *not* faster than ζ = 1 to the 2 % band, only to 5 %. Run the numbers first, write the sentence
  that is true, and pin it with a test, including the case where the tempting version fails.
- **Build before you measure.** When a concept can be reached two ways (e built from tiny steps,
  then found again by measuring slopes), put the construction first. Two routes meeting at the same
  number is the "whoa" moment; a measurement followed by an explanation is not.
- **Dialogue must survive interaction.** A character line that quotes a value the reader can change
  is only true at the default. Tie it to the starting value or phrase it so it stays true.
- **Every new section needs a character beat and a small moment**, not only correct prose: a
  mistake, a doubt, a callback, a joke that lands on the widget's result.

**Right-to-left and mixed scripts**
- **A little equation must stay one text run.** Splitting "2 × 2 × 2" and "= 8" into separate live
  pieces reorders them in Arabic. Keep a whole expression in one isolated left-to-right run.
- **Automatic direction fails on text with no letters.** "× 2" or "100%" has no strong
  characters, so it takes the page's direction and flips. Choose the direction from the content
  (Arabic letters → right-to-left, otherwise left-to-right).

**Translations with parallel agents**
- One agent per locale, one shared written brief, and the locale validator for that language as
  the finish line works well. If agents are interrupted, check which files already pass before
  relaunching, and give the rest "already done, keep consistent with it" instructions.
- **Check grammatical gender against earlier chapters.** The cast's grammatical gender differs by
  language (Mika is masculine in Italian and Arabic, feminine in Polish). Grep earlier chapters in
  that language, or choose gender-neutral phrasing.
- **Read the translators' reports, not just the test result.** They surface real inconsistencies
  (two terms for one concept across chapters, a label that disagrees with the prose). Fix them or
  record them for native review.

**Checking**
- **Screenshots find what tests cannot:** clipped curves, a hint touching the line above, a stray
  label, a legend swatch separated from its word. Always look at 375 px, one right-to-left language
  and one long-word language, in light and dark, and look again after fixing.
- **Pass URLs to axe as separate arguments.** A single string of space-separated URLs is tested as
  one page and reports a false "0 violations".
- **Keep every commit green.** Plan the commit order up front so shared building blocks land (with
  their tests passing) before the chapter content and its translations.

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
