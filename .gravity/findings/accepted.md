# Accepted irregularities

## A-001 — Large plotting and label-placement algorithms

Status: Accepted. Confidence: High.

Plot and plot-layout concentrate axis layout, collision avoidance, ghosts, scientific annotations and responsive font floors. Tests exercise label geometry independently. Splitting by file size would force readers to follow a single drawing algorithm through unrelated modules. Keep numerical geometry testable and preserve the coherent draw path. Reconsider if independently changing representations introduce repeated consumer-specific branches.

## A-002 — Similar chapter widgets stay local

Status: Accepted. Confidence: High.

A shower, ideal analytic response, live drone and precomputed mission all use sliders/plots but have different lesson events, progression and restart rules. Stable controls, plotting and integration are shared already. Keep exploratory orchestration local; a universal lesson widget would hide pedagogical differences behind flags. Revisit after repeated real changes prove a missing stable concept.

## A-003 — Ten locale files change with English prose

Status: Accepted. Confidence: High.

This amplification protects terminology, quiz semantics and mathematical truth. It is a product requirement, not accidental duplication. Do not replace original translations with runtime machine translation or weaken the validator to reduce file count.

## A-004 — Chapter 9 remains the home of PID replay tools

Status: Accepted. Confidence: Medium.

Chapter 11 reuses the flight trace/score/ceiling vocabulary introduced there. The reuse has a domain reason; move it only when another independent consumer needs a clear stable domain boundary. Do not relocate all helpers into `utils/` merely to erase cross-chapter imports.

## A-005 — Bounded replay prefixes remain simple

Status: Accepted. Confidence: Medium.

`ch09/trace-player.ts` slices prefixes and some extra-series callbacks transform a full trace. Current lesson durations and sampling are finite. At 4× CPU throttling, native Chapter 9 playground arrow-key previews took 22–26 ms synchronously; full-prefix integral replay Step activation took 1–7 ms (four trials). These are local diagnostics, not field INP or a proof for every device. No perceptible cliff was established that would justify workers, a new cache or more replay state. Keep the straightforward representation.

Reconsider if durations/sample counts grow, extra series become substantially more expensive, or sustained device measurements show visible lag. Mission input's duplicate commit calculation was a separate demonstrated problem and was removed (F-006).
