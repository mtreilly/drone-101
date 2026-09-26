# Preserve chapter boundaries and small lifetime ownership

Date: 2026-09-26

The lessons share physics and representations, but differ in predictions, errors, recovery and narrative sequencing. Keep model/policy/widget code rooted in each chapter. Share proven mathematics, integrators, plots, controls and page geometry. Do not introduce a generic lesson controller or plugin framework.

Route identity and cleanup registration are small necessary runtime boundaries. They do not imply moving simulation state into the app. Font-style loading belongs beside localisation; do not scatter script checks across widgets.

Revisit chapter helpers when multiple independent consumers evolve together, when a value-only consumer imports a mount entry point, or when lifecycle/browser measurements reveal growing retained work. Base a move on the constrained change, not on import count or file length.
