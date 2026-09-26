# Performance investigation — 2026-09-26

Goal: important interactions stay quick and predictable under realistic use, with no obvious growth cliff. This document records the completed targeted investigation, changes, validation and intentional limits. It does not claim field Core Web Vitals or exhaustive testing of every possible interaction.

## User waits and scope

This static course has startup, chapter navigation, language switching, local simulation/replay and slider/drag interaction. Network work is static locale/font/module loading plus analytics. There are no uploads, server processing, unbounded API queries or product lists; the TOC is twelve chapters. Chapter data and run durations are finite. Adding locales should grow selectable assets, not eager startup payload. Visiting more chapters should not grow retained observers and theme subscribers.

Inspected production build, app/i18n/progress, renderer/plays, shared plot/loop/views, simulation/math boundaries, representative ch00/ch01/ch05/ch08–11 orchestration and recent extension history. This is a targeted system review, not an exhaustive audit of every line.

## Measurements and changes

Chrome DevTools on local Vite production preview, Chrome 154, 2026-09-26. Decoded bytes are uncompressed body size, not transfer size. These are lab observations; no field CWV data was available. Repeatable trends matter more than one timing.

| Check | Before | After | Interpretation |
| --- | --- | --- | --- |
| English home stylesheet | 521,758 bytes | 76,110 bytes on final English home | Script-specific unicode-range rules no longer shipped eagerly for English |
| Initial built JS | 343.71 kB (107.77 kB gzip) | 338.13 kB (105.44 kB gzip) | Smaller initial graph; not the main claimed improvement |
| Active resize observations after ch0→1→8→9→10→11→home | 50 | 0 | Detached resources now release their observation; instrumentation counts observe/disconnect calls, not heap bytes |
| Canvas clears after home-page theme toggle on same journey | 72 | 0 | Retained chapter plots no longer redraw after leaving |
| Home trace, default CPU/network | LCP 174 ms, CLS 0 | LCP 173 ms, CLS 0 | Essentially unchanged; no benchmark-score optimisation warranted |
| ch11 direct load, 375×812, 4× CPU, Fast 4G | LCP 2,008 ms; CLS 0.1569 | LCP 2,143 ms; CLS 0.00 | Reserved loading height removed the footer shift; no faster-LCP claim |

Changes: route resource registration and late-result guard; language commits only after explicit-code resources resolve and only for the latest request; cancellable route-owned next-chapter warm-up; per-script font-style imports. Preserve existing locale request deduplication, module caching, offscreen loop sleep, draw coalescing and analytical physics tests.

## Validation ledger

- Unit tests: 615 passed on the final implementation before test pruning; 602 passed after deleting 13 duplicate, obsolete or trivial checks. Includes language request races, deduplication and retry. These do not prove browser navigation races or all widget lifecycle behaviour.
- Lint: passed final implementation.
- Production build: passed with split font styles and explicit cleanup registration.
- axe CLI: quick and full CLI attempts failed before page checks. System Chrome 154 and ChromeDriver 141 differ; matching Chrome for Testing also exits with a Crashpad Mach bootstrap error. `agent-browser doctor` independently confirmed browser launch failure. The working DevTools browser ran axe 4.13 with the same WCAG/best-practice tags, `?reveal` and 2-second settling delay: **280 distinct cases**, 14 routes × 10 languages × 2 themes, **zero violations**. An additional 20 language/theme cases checked Chapter 11 after its final interaction change: zero violations. This is browser axe evidence, not a successful CLI run. Results are saved in `scratch/quality/axe-full.json` and `axe-mission-final.json`.
- Browser resource check: two passes across all twelve chapters retained exactly the same per-chapter observer counts (3, 6, 5, 6, 6, 9, 9, 9, 9, 19, 10, 5) and returned home to zero. A ch01 locale response delayed 700 ms, followed by ch02 navigation after 60 ms, left ch02 mounted and returned home to zero. Chapter 5 switched en→ar→ja→zh-CN→de→en at nine resize observations throughout, then home returned to zero.
- Visual checks: whole-widget screenshots cover all 50 widget hosts in German, 375/1280 px, light/dark (200 captures). Additional Arabic checks cover ch00/ch07/ch11 at 375 px in both themes, and ch11 at 1280 px; Japanese/Chinese mission checks cover both themes at 375 px. The images and montages are in `scratch/quality/`. Captures use the requested width and a viewport height large enough to fit the whole widget, preserving its responsive width; the topbar is temporarily hidden only for unobstructed capture. Earlier element-UID screenshots were miscropped by the connector and were replaced by viewport captures cropped to the measured widget rectangle. Reviewed complete images show readable controls, plots and labels; intentional diagram scrolling remains inside its container. Arabic/CJK fonts and LTR physical coordinates/formulas remain intact.
- Keyboard checks: native arrow keys adjust range controls with visible focus. A complete Tab pass through the mission reached all four gain inputs, both tuning actions, transport, speed group and six criteria; each retained visible focus, and all four gain inputs accepted arrow changes. The shower knob accepts End and starts a real recorded run. An s-plane pole moved from −1.00 ± 6.24i to −0.90 ± 6.20i, then Shift+Up to −0.90 ± 6.70i; its description announced once after each settled change. Replay Step works from native Enter. Mission native keyboard scores matched previews; pointer release restarted the live flight. With reduced-motion reporting overridden before startup, it showed the completed result with Play (no autoplay), and an arrow adjustment kept all criteria decided; this checks the JavaScript policy, not OS-level media emulation. Live simulation status remains separated from milestone announcements; the changing shower readout is not itself a live region. These checks complement axe; they are not a complete assistive-technology audit.
- Startup: final home at 1280×900, default CPU/network, measured LCP 173 ms/CLS 0, versus baseline 174 ms/0. Its only stylesheet decoded to 76,110 bytes; no Japanese/Chinese/Arabic style modules were requested. The font critical chain was 152 ms, with no estimated render-blocking savings. Existing Latin font delivery was retained. The loading region reserves 100svh. Repeated ch11 trace at 375×812, 4× CPU/Fast 4G: LCP 2,143 ms, CLS 0.00 (previous 2,008 ms/0.1569). Only the targeted shift improvement is claimed.
- Mission interaction: at 4× CPU, baseline Kp input took 31–47 ms and change took 27–30 ms. Committing the already computed preview reduced synthetic change to 6–7 ms and native arrow-key change to about 8 ms; native input took 38–52 ms. Scores matched before/after commit. Pointer release still starts live replay. These are synchronous handler diagnostics, not field INP. Changed page geometry still forces recomputation.
- Chapter 9: native playground arrow previews took 22–26 ms at 4× CPU; change was 0–0.1 ms. Integral replay Step with a full preview (including its extra integral series) took 1–7 ms over four native Enter activations. Finite prefix slicing was retained: no latency evidence justified more replay/cache state.
- Saved-run continuity: a real keyboard-controlled Chapter 0 run saved 486 samples through Reset. Chapter 10 displayed “This is your own run from Chapter 0” and preserved the exact stored arrays. Fresh Chapter 10 requests included the saved-run contract chunk and excluded Chapter 0’s widget chunk.

## Intentional trade-offs

Render the lesson as one coherent article; do not virtualise small text blocks or defer linked widgets before checking bus/gate ordering. Maintain canvas fonts-ready redraw, colour semantics and physical contacts. Keep precise pure models in Node tests. Locale and module caches are bounded by a twelve-chapter, ten-language course, so adding eviction would add stale/reload behaviour without current evidence of benefit. Do not add simulation memoisation or worker messaging until measured critical-path work justifies their state and cancellation complexity.

The next actions are also maintained in `.gravity/`; resolved architectural findings retain their before/after evidence there.

## Rechecking

Use a production preview on an unused port, with `?reveal`, explicit `?lang=`/`?theme=` and the chapter route. Record startup with reload before interacting. Keep default desktop and throttled mobile scenarios separate. For resource checks, instrument observation/disconnection before startup and compare a repeated route journey with home; instrumentation is not a heap-size measurement. For input timing, measure around actual browser input/change dispatch, and also verify the linked score/plot and pointer/reduced-motion policies.

The browser audit and screenshot artifacts are local ignored QA output; the measurements, scope and interpretation above are the persistent record. No physics, chapter claims or visible text changed. Production deployment/network conditions and field latency remain outside this local review.
