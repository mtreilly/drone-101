# Page-aware physics: the page is part of the world

When a simulated object overshoots its picture, it does not vanish behind the frame edge: it flies
out over the page, runs into real content (paragraphs, bubbles, headings, other cards, the sticky
top bar) and the page reacts. The first example is Chapter 1's open-loop widget: the drone climbs
out of its picture, bonks the paragraph above, its motors stall, and it tumbles back down through
its own picture and crashes on the grass.

Before changing or adding one, read the chapters that already do it (search the chapter folders for
the ceiling/page-hit helpers) and the shared page-geometry and drone modules they import. Names
below describe what exists today; check the code for the current ones (good search terms:
`ceiling`, `pageSolids`, `onCeiling`).

## Rules

1. **One object, never a copy.** The drawing inside the widget is the thing that leaves the frame
   (its SVG gets `overflow: visible`; its wrapper is positioned and stacked above the page but
   under the sticky top bar; the moving group gets `pointer-events: none`). No hand-off to a clone.
2. **A contact is a real event in the model.** It goes into the simulation, so the plots, readouts
   and status keep telling the truth. Never let the picture and the numbers disagree. The only
   visual-only freedom is for dimensions the model does not have (the 1-D drone's tumble angle and
   sideways drift), and those ease back to zero before anything the model can see happens
   (landing, crash).
3. **The event must teach.** Choose the model's response for the chapter's idea: in Chapter 1 the
   stall and crash show that an open-loop plan can't notice a ceiling either. Explain it in the
   widget's status line (a new string in every supported locale). Nothing in the prose may be
   contradicted by the new outcome.
4. **Page geometry comes from the shared page-physics module, never per chapter.** It decides what
   counts as solid (text, bubbles, prediction cards and their options, other cards, pictures and
   the top bar; never the object's own picture or what contains it; inside its own card only other
   pictures, such as an s-plane stacked above it on a phone, never its own title or labels). It
   provides a swept hit test (so a fast object can't tunnel through), a wobble for the thing that
   was hit (individual `translate`/`rotate`, so it composes with layout transforms) and a
   hand-drawn impact burst (positioned with `translate`, not `transform`). Everything is in
   document pixels and re-measured each frame, and nothing animates layout properties.
5. **Once per run.** Detect contacts only while rising and outside the picture, and arm again when
   the object is back on the ground or reset. A reset or navigating away mid-flight must leave
   nothing behind.
6. **Precomputed traces** (players that replay arrays instead of stepping a live sim) can't react
   mid-flight. Measure the ceiling first (how many metres of open page are above the picture), pass
   it to the sim as a parameter and recompute the trace, so the replay already contains the hit.
   Re-measure after scroll as well as resize (debounced): the sticky top bar is solid too, so the
   ceiling moves as the page scrolls. Keep an unchanged replay going; restart only if the flight so
   far would differ.
7. **Only where the physics really gets there.** Before adding it, measure how many metres of open
   page sit above the picture (at 1280 px and 375 px) and compare with what the model can actually
   reach. If the model never gets there, leave the widget alone: never fake a bonk by changing
   scales or ranges. (Example: Chapter 2's P control peaks well below the page above it, so it has
   none.)
8. **Formula-driven widgets** (which play an analytic response rather than a sim) hand over at the
   hit to the same drone sim, started from the hit height and speed and stalled; the plot is re-set
   to the real path (formula up to the hit, then the fall). Once the drone is down it stays down
   until the replay restarts or the input changes: an analytic curve must never resurrect a crashed
   drone.
9. **Keep status lines true in every layout.** Whether a hit happens depends on the page layout, so
   compose the message from the current verdict plus the hit sentence rather than a fixed text that
   assumes why it flew off.
10. **Reduced motion turns it off completely:** the object stays pinned and clipped at its
    picture's edge, and the readout still shows the true value.
11. **Test it:** a sim test for the event (what happens after it, until reset), unit tests for any
    geometry helper, and a recorded check (`agent-browser record start …`, then look at frames) at
    1280 px and 375 px, light and dark: a real bonk, reset mid-flight, navigate away mid-flight, and
    reduced motion.

## Shared building blocks

These have one owner: change them only with tests, never per chapter.

- **The drone sim's ceiling hit**, which takes a `stall` choice. Stall: the motors cut out and it
  falls (open loop, unstable poles). No stall: a bump the motors survive, so feedback can recover.
  The sim records when the hit happened.
- **A ceiling in the drone config** (height + stall), so the sim hits it by itself for traces
  computed ahead.
- **The drone view's ceiling-height measurement:** the metres at which this drone would touch the
  page, from the live layout, matching where the view registers the hit. Re-measure and recompute
  on resize.
- **A bump response in the drone view**: a short knock instead of the tumble, for the no-stall
  case.
- **A free-flying drone view with a hit callback.** Live-sim widgets call the sim's ceiling hit
  from it and show a ceiling status. Formula widgets switch to the fall sim and show the verdict
  plus the page-hit sentence.
