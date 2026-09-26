# State and decision ownership

| Decision/state | Owner | Lifecycle and consumers |
| --- | --- | --- |
| Current mounted chapter and pending navigation | `core/app.ts` | One route; request identity prevents obsolete async mounts; owns cleanup callbacks and prefetch timer |
| Widget resource registration | `story/renderer.ts`, `WidgetCtx.onCleanup` in `story/types.ts` | Factories register Plot/DroneView/SPlane at allocation; route disposes them; factory return handles local loops and bus listeners |
| Physical trajectory and contact | `sim/drone-model.ts`, `sim/shower-model.ts`, `sim/msd-model.ts` | Model state; widgets choose lesson policies; pictures must consume the same result |
| Numeric representation and analytics | `math/` | Pure computations; lesson-specific score/tuning logic remains in its chapter |
| Plot axes, series, labels, draw scheduling | `ui/plot.ts`, `ui/plot-layout.ts` | Plot instance; theme/input subscriptions, resize observation and font-ready redraw end with the instance |
| Prediction/quiz completion | `story/renderer.ts` + `core/progress.ts` | Renderer owns lesson transitions; progress owns persistence and subscriptions |
| Saved shower run | Chapter 0, exported from `ch00/saved-run.ts` | Chapter 10 consumes the earlier learner run; stable value/type contract shared without importing earlier UI |
| Translation/request cache and language preference | `core/i18n.ts` | Language commits after resources arrive; only latest requested switch may commit; in-flight requests retry after failure |
| Script font rules / canvas font resolution | `core/font-styles.ts`, `core/font.ts`, `tokens.css` | Rules loaded per script; canvas resolves tokens per language; fonts-ready invalidation remains necessary |
| Theme | `core/theme.ts` | Document preference plus OS; theme listeners must unsubscribe |
| Page solids and collision geometry | `ui/page-physics.ts` | DOM geometry; lesson-specific trace ceiling response in ch09/ch11; observers belong to widgets |

Previous duplicated ownership was implicit: each factory remembered a subset of resource teardown. The route now offers registration without moving chapter state into a global store. Progress exposes mutable state; current consumers read it and use explicit mutation methods. Treat that as an observed convention, not a proven immutable boundary.
