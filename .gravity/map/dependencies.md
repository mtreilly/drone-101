# Important directions

- App → chapter registry → lazy widget/play modules; app → story renderer and common concept map.
- Story renderer → typed content, progress, rich text, characters, sketches, plays; chapter factories are injected, not imported by the renderer.
- Chapter widgets → own lesson models + pure sim/math + shared UI/core formatting.
- Shared UI → pure geometry/math and core formatting/theme/dom; sim/math do not import chapter UI.
- Pure sim → integrator/delay/random; math → mathematical primitives. Model tests run in Node.

Cross-chapter reuse found in source:

- ch02 → ch01 `droneRig`: the same flight display; accepted for now.
- ch04 → ch03 `coffeeSteps` and `dragX`: continuity and a shared drag action.
- ch07/ch08 → ch06 `helpers`: small representation actions; watch for unrelated additions.
- ch11 → ch09 `pid-tools`, `stars`, `page-ceiling`: shared flight domain and ceiling observation, with a different mission adapter.
- ch10 → ch00 `hands` and `saved-run` for saved-run key/type; ch10 → ch09 stylesheet. The saved-run contract was extracted from the widget entry point to remove an accidental UI dependency.

These directions are source-level observations, not a claim that every import was exhaustively cycle-checked. Chapter reuse reflects narrative progression in many cases; count dependencies only to locate forces. The missing resource lifecycle was more consequential than module size.
