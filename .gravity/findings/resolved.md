# Resolved findings

## F-001 — Chapter resources outlived navigation

Classification: Ambiguous ownership. Confidence: High. Area: widget lifecycle.

Factories returned loop cleanup but never disposed most Plot instances. Plot's theme subscribers retained canvases/series, while DroneView and SPlane observations lacked public teardown. Production browser instrumentation after ch0→ch1→ch8→ch9→ch10→ch11→home measured 50 remaining resize observations and 72 canvas clears on a home theme toggle.

Changed: route provides `WidgetCtx.onCleanup`; factories and shared rig register Plot/DroneView/SPlane; TracePlayer disposes both plots and its view. Destruction is idempotent for the newly owned resources; late font callbacks are guarded where they would draw. SPlane cancels its pending description timer. The same browser journey returned 0 observations and 0 canvas clears. This matches the expected bounded lifetime; two complete passes through all twelve chapters remained bounded, and five script/language switches on Chapter 5 held at nine observations before home returned to zero.

## F-002 — Async navigation and language commits could finish out of order

Classification: Temporal coupling. Confidence: High. Area: navigation/localisation.

An older chapter load could replace a newer route and append resources to shared cleanup state. A language request changed global language before its resources arrived and a failed earlier switch could restore stale language.

Changed: each route owns its cleanup list and must retain its request identity before rendering. Language resources load against explicit code; only the latest request commits document/preference language. Returning to the current language supersedes pending requests. Unit tests cover reordered completion, superseded failure, cancellation and request sharing/retry. Idle prefetch is cancelled with the route. A browser check delayed Chapter 1’s locale response 700 ms and navigated to Chapter 2 after 60 ms; Chapter 2 remained mounted and home retained no observations.

## F-003 — All script font rules shipped in initial CSS

Classification: Accidental complexity/performance. Confidence: High. Area: startup.

Japanese and Chinese unicode-range rules, plus Arabic, were imported eagerly even for English. Browser decoded CSS was 521,758 bytes on the home baseline. Fonts themselves were correctly selected by unicode range, so this was rule payload, not evidence that all font binaries downloaded.

Changed: three font-style modules load for the chosen script before rendering and switching language. English home CSS measured 76,110 bytes in the final home trace (an earlier navigation check measured 85,307 including a warmed chapter stylesheet). Built initial JS also decreased from 343.71 to 338.13 kB. Arabic, Japanese and Chinese starts/switches were checked for font selection, readable canvas/SVG labels and narrow layout; the full language/theme axe matrix also passed.

## F-004 — Loading article shifted the footer

The short loading paragraph placed the footer inside the initial viewport. `.loading` now reserves one small viewport block size. A repeat of the ch11 375 px, 4× CPU/Fast 4G trace reported CLS 0.00 (previous 0.1569). LCP was 2,143 ms versus 2,008 ms; this is not evidence of faster startup, only that the targeted movement disappeared. The resource-touched widgets were also inspected in the responsive screenshot matrix recorded in the performance review.

## F-005 — Saved shower contract imported widgets

Moved `SHOWER_RUN_KEY` and `SavedShowerRun` into `chapters/ch00/saved-run.ts`. Both chapters import the same contract without importing Chapter 0's widget entry point. Storage key/data shape remain identical. Source and production build confirm the dependency removal; An actual keyboard-controlled Chapter 0 run saved 486 samples; Chapter 10 identified it as the learner’s run without changing its data. A fresh Chapter 10 document requested the shared saved-run chunk but not Chapter 0 widgets.

## F-006 — Mission keyboard commit flew the preview twice

Classification: Repeated critical-path work. Confidence: High. Area: Chapter 11 mission.

The range input handler already computed the entire flight for immediate preview; native change then computed the same 20-second flight again. At 4× CPU, baseline input handlers took 31–47 ms and change handlers 27–30 ms.

Changed: a completed uncommitted preview with unchanged measured page ceiling is committed by saving its existing score and marking it fresh for the next ghost. Pointer release still starts its live flight; a changed ceiling or unavailable preview still recomputes. On the rebuilt page, synthetic change took 6–7 ms; native arrow changes took about 8 ms with identical scores. Native pointer release still restarted the live phase. No new simulation cache or alternate physics was introduced. The remaining one-flight computation is bounded and intentionally preserves immediate linked feedback; see accepted A-005 and the performance evidence.
