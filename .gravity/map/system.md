# Existing system

The static Vite + TypeScript application has home, concept-map and twelve hash-routed chapters. There is no backend or framework component tree. Vercel analytics is the only injected external service. Static locale JSON, fonts and lazy chapter modules are the fetch paths; uploads, server processing and large server queries are absent.

Startup resolves theme and language, loads common text and the selected script's font rules concurrently, builds the shell, then routes. Chapters load text, widget code and optional play models concurrently. Locale requests share an in-flight promise and settled cache; dynamic imports use the module loader cache. Only the active language's namespaces are fetched, with English fallback for unavailable files. The validator prevents intentionally shipping that fallback.

`story/renderer.ts` builds one article from typed blocks. Prediction gates hide following blocks and open through a chapter-local bus; saved predictions reopen them. Factories mount in a microtask after DOM insertion. Widget resource disposal belongs to the route; a factory's returned cleanup remains supported for its own simulation/event wiring. Late navigation results are discarded before rendering. Next-chapter warm-up is idle work cancelled when the route leaves.

Physics state lives in widget closures and model instances. Playable sentence models are pure calculations plus explicitly linked bus events. Progress alone is durable: visited/completed chapters, prediction choices, quiz answers, per-widget saved values and reading position in guarded localStorage. Theme/language are separate preferences. Locale changes rebuild chrome and chapter in place.

`Loop` caps elapsed simulation time and sleeps outside the viewport; Plot coalesces drawing through animation frames and caches axes. Real-time simulations use suitable integrators; advanced PID lessons often compute a whole trace and replay it using a chapter-local player. Page contacts are model events, with shared page geometry and lesson-specific responses.

The large Plot and plot-layout modules have a coherent responsibility: draw linked scientific representations legibly on narrow screens. Character art, narrative schemas, bilingual number isolation and progressive physics are shared because their meaning is course-wide, not because every chapter should be symmetrical.
