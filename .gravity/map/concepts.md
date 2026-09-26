# Important concepts

| Concept | Meaning/home/owner | Dependents and assessment |
| --- | --- | --- |
| Chapter | `chapters/chNN`, registry, locale namespace | App and renderer; stable product boundary, healthy local variation |
| Narrative block | `story/types.ts`, interpreted by renderer | All locale files; stable course grammar with legitimate wide change amplification |
| WidgetFactory / WidgetCtx | Mount local interactive with namespace translators, bus and disposal registration | Chapter widgets; small stable interface, avoid consumer-specific feature flags |
| Bus event | Chapter-local connection between a prediction, formula and interactive | Renderer/plays/widgets; string event contracts need co-change tracing, not an app-global event bus |
| DroneSim / PID / DroneConfig | Physical flight and feedback policy in `sim/drone-model.ts` | Many chapters and tests; useful centre of gravity because later lessons introduce actual model constraints |
| Trace / score / TracePlayer | Sampled trajectory, performance verdict, timed replay in ch09 | ch09 and ch11; stable enough to reuse but ownership remains in the chapter that introduced it |
| Plot | Coloured scientific series, axis ranges, annotations and readable labels | Most interactives; difficult coherent rendering concept, not a god domain |
| SavedShowerRun | Earlier learner's knob/temperature trace | ch00 and ch10; stable shared contract now rooted in ch00/saved-run.ts |
| Progress | Learner continuity in `core/progress.ts` | App, renderer and a few chapter saves; bounded course data, guard storage failure |
| Locale + bidi run | Terminology, original prose and mixed-script numerical order | Every representation; inherently cross-cutting, centralise formatting rather than patching translations |
| Page contact | One drawn object collides with actual page geometry | DroneView/page-physics, lesson model/trace adapters; physics and DOM geometry have different owners and must agree |

No general-purpose controller/service/plugin layer is latent here. Pure maths, physical state, chapter-specific teaching policy and shared representations are the concepts already present in the product.
