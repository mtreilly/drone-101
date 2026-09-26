Make the product meaningfully usable by people with different physical, sensory
and cognitive abilities, using the simplest changes that improve real
accessibility.

Do not optimise for mechanically satisfying an accessibility checklist.
Standards such as WCAG are evidence and useful constraints, not substitutes for
understanding how the product is actually used.

Review the relevant feature or application and identify places where a person
may be unable to perceive, understand, navigate or operate it.

Pay particular attention to:

- keyboard-only use and sensible focus movement;
- screen-reader semantics and whether the interface communicates the same
  structure that a sighted user perceives;
- accessible names, labels, descriptions and error messages;
- forms, validation and recovery from mistakes;
- contrast and information conveyed only through colour;
- zoom, text scaling, responsive layouts and large text;
- pointer target size and interactions requiring unusual precision;
- reduced motion and unnecessarily distracting animation;
- loading, success, failure and dynamic state announcements;
- modals, menus, popovers and other temporary UI;
- cognitive load, unclear wording and unnecessarily complicated interactions.

Consider the actual interaction rather than only inspecting markup.

Prefer native HTML and platform behaviour where possible.

Do not add ARIA where correct native semantics already exist.

Do not introduce accessibility abstractions that make the code substantially
harder to understand unless they solve a recurring problem.

Distinguish between:

1. genuine accessibility barriers;
2. worthwhile improvements;
3. theoretical compliance issues with little practical impact.

Fix genuine barriers first.

Where automated tooling reports a problem, verify that it represents a real
issue before changing the implementation.

Where appropriate, test the important paths using keyboard navigation and the
accessibility tree rather than relying entirely on static analysis.

The desired result is not "zero accessibility warnings".

The desired result is:

> A user with reasonable assistive needs can understand and operate the product
> without encountering avoidable barriers.

Document significant remaining limitations rather than hiding them behind
superficial fixes.
