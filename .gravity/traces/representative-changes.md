# Representative changes

Counts describe likely source/document units, excluding generated assets; they are navigation aids, not quality metrics. Locale updates legitimately dominate many changes.

| Change | Likely files/areas | Concepts and propagation | Assessment |
| --- | --- | --- | --- |
| Add a chapter | Registry, chNN widgets/models/tests/CSS, 10 namespace files, 10 common TOCs, a11y routes, plan/glossary | Chapter index, namespace, lesson grammar, widgets, quiz semantics, claim tests | Broad but mostly legitimate; a11y duplicates chapter/language lists and is easy to forget |
| Change a stated settling-time claim | Lesson model/test + 10 locales + terminology if new | Exact metric/band matters; changing prose alone can contradict simulation | Healthy co-change rooted in chapter; do not infer a universal settling definition |
| Add a plot annotation | Plot/plot-layout + geometry tests + widget + labels in 10 locales if visible | Scientific geometry, colour, text collision and keyboard description | Shared rendering changes have real course-wide consequences; visual matrix needed |
| Fix Arabic number/unit reversal | core/bidi + tests, sometimes rendering call site | One isolated run across DOM/canvas/equation | Central fix prevents per-locale invisible marks; necessary cross-cutting behaviour |
| Change a drone physical constraint | sim/drone-model + analytic checks + affected chapter models/claim tests/prose | Saturation, motor lag, contacts, PID and replay must agree | Shared physical concept; legitimate impact, preserve earlier idealised lesson configuration |
| Reuse learner shower run in ch10 | ch00 saved-run contract, ch10 replay, progress serialization | Key, sampled temperature/knob/time data, fallback robot run | Two consumers need one contract; widget-entry export caused accidental coupling; now extracted into ch00/saved-run.ts |
| Navigate away during pending chapter load | app route lifecycle + renderer mount/disposal + resource constructors | Request identity, mount timing, observer/theme/loop lifetime | Prior implicit ownership crossed every factory; registration reduces forgotten cleanup while retaining local models |

History inspected: recent ch07–11 extension, RTL centralisation and responsive table fixes. These changes support keeping chapter models local while centralising genuinely repeated bidi/geometry rules. They do not justify a new framework layer.
