# Who Keeps the Drone Up? — project guide

An interactive, hand-drawn course that takes a curious beginner from "what is feedback?" to
Laplace transforms, poles and PID control. Vite + TypeScript, no framework. `README.md` gives a
rough map of the source; the code is the truth, so look before assuming a file or name still exists.

All other documentation lives in `docs/`:

- `docs/course-plan.md`: pedagogical outline and physical parameters, chapter by chapter.
- `docs/glossary.md`: per-locale terminology choices (read before translating anything).
- `docs/page-physics.md`: rules for objects that fly out of their picture onto the page.
- `docs/plans/`: phased plans for past and current extensions (historical once built).
- `docs/software-quality-goal.md`: brief for architecture/software-quality reviews.

New plans go in `docs/plans/{feature}.md`; new standing documentation goes in `docs/`.

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

1. **Correct maths and physics.** Simulations use an integrator that suits the model (RK4 for the
   drone and mass-spring, an exact update for the shower's first-order lag), with analytic checks
   in their tests. Every number stated in a chapter's text or quiz is verified by a test in that
   chapter's folder. If you change a number, change the test and every supported locale.
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
  Arabic). Supported locales are listed in one language registry in `src/core/` (endonyms,
  never flags). Files load lazily per language *and* per chapter; the next chapter is prefetched.
  A missing file falls back to English at runtime, but must never ship that way.
- **Every change to English text must be mirrored in every supported translation in the same commit.**
  The locale validator test enforces identical structure, control fields (block type, speaker,
  mood, ids, sketches, correct answers, gates, …), maths, `{placeholders}` and colour markers. It
  must pass.
- Keep each language's terms consistent with `docs/glossary.md` (feedback, setpoint, plant,
  overshoot, droop, pole, s-plane — "map of s" before chapter 7 — etc.) and add every new term
  there in the same commit as the translation. Match the voice: playful, short sentences,
  natural address for that language. Format prose numbers according to the locale, not a blanket
  "decimal comma outside English" rule; inside maths write decimal commas as `{,}` (`tex()` also
  protects `1,5` automatically).
- Numbers in widgets always go through `fmt()` (locale-aware); never `toFixed()` for visible text.
- `<html lang/dir>` follows the language (hyphenation and screen-reader pronunciation depend on it).

### Translation sources and term verification

Translate the **concept**, then choose the local term. For each important term, record in
`docs/glossary.md` its English definition, target-language choice, rejected alternatives,
supporting sources, first chapter, and any note needed for student-friendly wording. Check
ambiguous terms such as *plant*, *setpoint*, *overshoot*, *pole*, *zero*, *gain*, *droop*,
*phase margin*, *feedback*, and *control effort* against a control-engineering teaching source
in the target language. A general dictionary can confirm spelling or usage; it cannot settle the
engineering meaning. Aviation authorities are for aircraft names, not control theory. Sources support original prose; do not copy their explanations.

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
  - `pnpm a11y --full` — every language × both themes

  It builds, serves the site and runs `@axe-core/cli` with `?reveal` (opens prediction gates so
  hidden widgets are tested) and `?theme=` / `?lang=`. It needs Chrome plus a matching
  ChromeDriver (`pnpm install` builds chromedriver; set `CHROME_PATH` if Chrome is elsewhere).
  When adding a page or route, add it to the suite's route list.
  **Zero violations is the bar.** axe finds only part of the problems, so also check by hand:
  tab through every control, use arrow keys on sliders, knobs and s-plane points, and read the
  live-region text.
- Every control has an accessible name (maths-only labels get a plain-text `aria-label` from the
  shared maths-to-plain-text helper), live regions only update when their text changes and never
  on every animation frame, focus is visible, drag interactions have keyboard equivalents, and
  motion is never the only cue.

## Animation, UI and UX craft

- Motion must have a purpose: feedback, state change, explanation, or gentle life (character blink,
  breathe, hello nod). Never animate keyboard-driven steps or high-frequency interactions.
- Use the easing tokens (`--ease-out`, `--ease-in-out`, `--ease-std`); keep UI transitions under
  ~300 ms; press feedback is `scale(0.96)`; never animate from `scale(0)`; transition named
  properties only; entrances use the `translate` property so they compose with layout transforms.
- Fonts come from the tokens (`--font-body`, `--font-hand`, `--font-display`), never hard-coded
  families. In Latin scripts: **Patrick Hand** (`--font-hand`) for the hand-written voice
  (dialogue, notes, sketch and canvas labels); **Caveat** (`--font-display`) only for large
  display headings; **Atkinson Hyperlegible** (`--font-body`) for body text. Japanese, Simplified
  Chinese and Arabic map all three to their Noto Sans font. Canvas labels use the shared canvas
  font helper, and canvas text must redraw once web fonts have loaded (`document.fonts.ready`).
- Widgets share one anatomy: title → visual(s) → sliders (`.w-controls`) → readouts + transport
  (`.w-hud`) → status (reserves its height) → help. Labels never collide; stacked plots share a left
  edge; nothing clips at 375 px.
- Characters are theme-proof "stickers" (same colours day and night) with one shared idle loop.
- **Do multiple passes.** Screenshot every changed widget at 1280 px and 375 px, in light and dark
  (and in a long-word language such as German or Polish), look at the images, fix, and look again.
  Parallel agents per chapter work well for big passes; shared components stay with one owner.

## Page-aware physics

When a simulated object overshoots its picture it flies out over the page, hits real content and
the page reacts (Chapter 1's drone bonks the paragraph above and crashes). Read
`docs/page-physics.md` before adding or changing this anywhere. The short version: one object,
never a copy; every contact is a real event in the model, so numbers and picture agree; the event
must teach the chapter's idea; add it only where the model really reaches the page; reduced motion
turns it off; shared geometry and sim pieces have one owner.

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
- **Keep every commit green.** Plan the commit order up front: shared building blocks land first
  (with their tests passing), then each piece of chapter content lands with its English text,
  every translation, its glossary entries and its number tests together.

## Commands

```sh
pnpm dev           # http://localhost:5173
pnpm test          # maths/physics checks + locale validator
pnpm lint          # oxlint
pnpm fmt           # oxfmt
pnpm build         # static site in dist/
pnpm a11y          # axe-core accessibility suite (see above)
```

Use `agent-browser` with a named session for visual checks (`?lang=de&theme=dark&reveal`).
Commit in small conventional commits (`feat:`, `fix:`, `docs:` …).
