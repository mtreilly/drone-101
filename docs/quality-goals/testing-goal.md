Create the smallest testing system that gives strong confidence that important
behaviour works and remains working.

Tests are not intrinsically valuable.

Confidence is valuable.

Treat every test as code that must be maintained, understood and executed.

A test should justify its continued existence.

Review the system in terms of risks and behavioural guarantees rather than
aiming for maximum test count or coverage percentage.

Prioritise tests around:

- important user journeys;
- business rules where mistakes are costly;
- complex transformations or algorithms;
- security and permission boundaries;
- historically fragile behaviour;
- integrations whose contracts can fail;
- regressions that would otherwise be difficult to detect.

Prefer testing observable behaviour over implementation details.

Avoid tests whose primary effect is to freeze the current internal structure.

Do not duplicate confidence unnecessarily.

For every existing or proposed test ask:

> What plausible regression does this catch that would otherwise escape?

If the answer is unclear, question whether the test should exist.

Actively identify tests that can be removed.

Good candidates for deletion include tests that:

- duplicate stronger tests elsewhere;
- verify behaviour already guaranteed structurally or by the type system;
- test framework behaviour rather than application behaviour;
- test trivial getters, setters or wiring;
- assert implementation details;
- repeat the same behavioural guarantee at several layers without additional
  value;
- cover code that no longer carries meaningful risk;
- are so brittle that normal refactoring requires constant rewriting;
- consume significant CI time for extremely little additional confidence.

Where one higher-level test safely subsumes several lower-level tests, consider
deleting the redundant tests.

Where a narrow unit test gives clearer fault localisation than an expensive
integration test, keep the narrow test.

Do not mechanically prefer unit, integration or end-to-end tests.

Choose the cheapest level capable of establishing the required confidence.

Use structural guarantees where they are stronger than tests:

- type systems;
- schemas;
- database constraints;
- exhaustive matching;
- compiler checks;
- lint rules;
- generated interfaces;
- framework invariants.

Do not write runtime tests proving things the compiler already proves unless an
important runtime boundary remains.

Be particularly cautious with end-to-end tests.

They are valuable for a small number of important journeys but become expensive
and slow when used as exhaustive coverage.

A healthy test suite should be fast enough that developers are willing to run
it frequently.

Track tests that disproportionately contribute to CI duration, flakiness or
maintenance effort.

Treat reducing test runtime and deleting unnecessary tests as legitimate
improvements.

When fixing a bug, do not automatically add a regression test.

First ask whether:

- the bug exposes a reusable behavioural invariant worth protecting;
- an existing test can be strengthened;
- a structural change can make the bug impossible;
- the failure was incidental enough that a permanent test would add little
  value.

The desired result is not:

> Every line has a test.

It is:

> Important behaviour is difficult to accidentally break, failures are detected
> close to their cause, and the test suite remains small, understandable and
> fast enough to be routinely trusted.

When reviewing the suite, explicitly recommend:

- tests to add;
- tests to strengthen;
- tests to merge;
- tests to move to another level;
- tests to delete;
- behaviours better guaranteed structurally rather than through tests.

Prefer fewer strong guarantees over many weak assertions.
