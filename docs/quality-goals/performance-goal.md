Make the product feel fast and remain efficient under realistic usage without
sacrificing clarity or maintainability for theoretical optimisation.

Start from user-visible behaviour.

Identify where users actually wait:

- initial loading;
- navigation;
- interaction latency;
- data fetching;
- rendering;
- large lists;
- expensive calculations;
- uploads and downloads;
- images and media;
- repeated network requests;
- server processing;
- background work.

Measure or inspect before optimising where practical.

Distinguish between:

1. performance problems users can perceive;
2. scalability problems likely to emerge under realistic growth;
3. technically inefficient code whose optimisation would provide no meaningful
   benefit.

Prioritise the first two.

Look especially for structural causes:

- unnecessary sequential operations that could safely happen concurrently;
- repeated work;
- duplicate requests;
- avoidable re-renders;
- unnecessarily large payloads;
- loading code or data before it is needed;
- expensive work on critical interaction paths;
- missing caching where data is safely reusable;
- unbounded lists or queries;
- algorithms whose behaviour changes badly with realistic data sizes.

Prefer removing work over making unnecessary work faster.

Prefer architectural fixes over micro-optimisation when the architecture is the
problem.

But do not introduce caching, memoisation, concurrency or abstraction merely
because it appears more sophisticated.

Every performance mechanism creates complexity and potentially stale state,
race conditions or harder debugging.

Delete optimisations that no longer provide measurable value.

Preserve simple code where the difference is immaterial.

The desired result is not the highest possible benchmark score.

The desired result is:

> Important user interactions happen quickly and predictably, and the system
> has no obvious performance cliffs under realistic usage.

Where performance trade-offs are intentional, make them understandable.
