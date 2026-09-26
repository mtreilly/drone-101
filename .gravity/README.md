# Architecture through attention

Reviewed 2026-09-26 against the working source, both quality briefs, recent chapter-extension history and the production build. This is architectural context, not a quality score. Recheck observations when their named owners change.

The natural unit is a **chapter**: original narrative in ten locale files, widget factories, pure lesson models, playable-sentence models and numerical claim tests. `chapters/registry.ts` is the lazy loading boundary. Shared `sim/` and `math/` express physics independently of the DOM; `ui/` draws and controls it; `story/` interprets narrative blocks. `core/app.ts` owns the shell and one mounted route.

The main centres of gravity are the chapter renderer's content contract, Plot's drawing/label layout, DroneSim's progressively introduced physical constraints, and the app's navigation lifecycle. Their concentration mostly represents real shared concepts. Do not split the plot algorithm by arbitrary size or turn widgets into a generic lesson engine.

The most expensive friction found was missing resource ownership: widget factories stopped loops but retained plot theme subscribers and resize observers. Navigation now provides `WidgetCtx.onCleanup`; resources register as they are created. A completed async route must still own the current navigation before it mounts. See [the lifecycle simplification](grace/chapter-resource-ownership.md).

The other measured changes remove obsolete async mounts, eager script font rules, a loading-footer shift, a saved-run dependency on earlier widgets, and a duplicate mission calculation. [Resolved history](findings/resolved.md) records evidence; [accepted trade-offs](findings/accepted.md) explain why bounded replay work remains simple.

Read [the actual system](map/system.md), [ownership](map/ownership.md), [dependencies](map/dependencies.md) and [seven change traces](traces/representative-changes.md) before proposing a reorganisation. [Accepted irregularities](findings/accepted.md) and [necessary complexity](necessity/physics-and-localisation.md) protect product meaning from superficial cleanups. [Performance evidence](../docs/quality-goals/performance-review.md) distinguishes measurements from open hypotheses.

Next actions, when extending the course:

1. Register new observers/subscriptions with their chapter owner; repeat the navigation-to-home check when introducing a resource type.
2. When adding a chapter or locale, check the a11y route/language list against the registry. Derive that list from the registry if this duplication starts causing omissions.
3. Reprofile actual devices when replay durations, sampling or extra series grow; optimise transformations only if linked feedback visibly lags.

No premature generalisation was found worth removing. The missing stable concepts were chapter-resource ownership and the saved shower-run contract; both now have explicit homes. Necessary difficulty remains in progressive physical constraints, real page contacts, multilingual semantics and typography. Keep local teaching orchestration, the coherent plot algorithm and the original translations; do not replace them with a universal lesson framework or arbitrary file-size refactors.

Maintain this directory when ownership, findings or intentional trade-offs change. Preserve resolved history rather than rewriting it as if it never happened.
