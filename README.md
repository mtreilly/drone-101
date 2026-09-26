# Who Keeps the Drone Up?

An interactive, hand-drawn course that takes a curious beginner from "what is feedback?"
to Laplace transforms, poles and PID control, told through three learners (Mika, Theo, June),
a shower that won't behave, and a drone that must hover at 2 m.

## Run

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # simulation/maths checks (RK4 vs exact solutions, Laplace table, margins, …)
pnpm lint
pnpm build      # static site in dist/
pnpm a11y       # accessibility checks across chapters and languages
```

## Layout

| Path | What |
|---|---|
| `src/sim/` | RK4 integrator, delay line, drone / shower / mass-spring models |
| `src/math/` | complex numbers, polynomial roots, analytic 2nd-order responses, Laplace probe, Bode & margins, step metrics |
| `src/ui/` | reusable widgets: plot, s-plane, sliders/transport, drone view, shower view, block diagram, mass-spring view |
| `src/story/` | chapter renderer (dialogue, notes, predict cards, quizzes), characters, concept map |
| `src/chapters/chNN/` | each chapter's interactives (+ tests verifying every number in its text) |
| `public/locales/{lang}/` | visible text: `common.json` plus one namespace per chapter |
| `docs/` | course plan, glossary, design notes, open issues and extension plans |

See `docs/` for the pedagogical outline and physical parameters (`docs/course-plan.md`), the glossary and design notes.

The course supports English, French, Spanish, Italian, German, Polish, Brazilian Portuguese,
Japanese, Simplified Chinese, and Modern Standard Arabic. Use the language menu or `?lang=pt-BR`
(with any supported language code) to choose a translation.
