/**
 * The course's prerequisite graph: every idea, the section that builds it, and the ideas it needs.
 * `concepts.test.ts` reads the English chapters in order and checks that no idea is leaned on
 * before its section, that its section really builds it, and that it is used again later.
 * Pure data: no DOM, no i18n. Planned in `docs/plans/maths-explanations.md` (Phase 1).
 */

/** A section of a chapter, by its `id` in `public/locales/en/chNN.json`. */
export interface Where {
  ch: number;
  section: string;
}

export interface Concept {
  /** the section that builds the idea (the idea may be used from its first block on) */
  builtIn: Where;
  /** ideas that must be built at or before `builtIn` */
  prereqs: string[];
  /** concept-map node that stands for this idea, if any (`src/story/map-layout.ts`) */
  node?: string;
  /** English text that shows the idea is being used; the first hit may not come before `builtIn` */
  uses?: RegExp[];
  /** only look for `uses` inside maths (`$…$`, `tex`, `alt`), where an apostrophe is a prime */
  mathOnly?: boolean;
  /** English text that must appear inside `builtIn`: proof that the section really builds it */
  defines?: RegExp;
  /** sections that may mention the idea before it is built (a labelled promise, not a use) */
  previews?: Where[];
  /** the idea is not expected to come back in a later chapter */
  once?: boolean;
}

const at = (ch: number, section: string): Where => ({ ch, section });

export const CONCEPTS: Record<string, Concept> = {
  // Chapter 0
  goal: { builtIn: at(0, "hook"), prereqs: [], node: "goal" },
  delay: { builtIn: at(0, "broken"), prereqs: [], node: "delay" },
  // Chapter 1
  openloop: { builtIn: at(1, "plan"), prereqs: ["goal"], node: "openloop" },
  feedback: { builtIn: at(1, "package"), prereqs: ["openloop"], node: "feedback" },
  error: { builtIn: at(1, "package"), prereqs: ["goal"], node: "error" },
  blockdiagram: { builtIn: at(1, "diagram"), prereqs: ["feedback"], node: "blockdiagram" },
  plant: { builtIn: at(1, "diagram"), prereqs: ["blockdiagram"], node: "plant" },
  disturbance: { builtIn: at(1, "package"), prereqs: [], node: "disturbance" },
  // Chapter 2
  kp: { builtIn: at(2, "push"), prereqs: ["feedback", "error"], node: "kp" },
  sserror: { builtIn: at(2, "push"), prereqs: ["kp"], node: "sserror" },
  overshoot: { builtIn: at(2, "more"), prereqs: ["kp"], node: "overshoot" },
  // Chapter 3
  derivative: {
    builtIn: at(3, "slope"),
    prereqs: [],
    node: "derivative",
    uses: [/\\dot\{/, /\\frac\{d/],
    // Chapter 1 shows the drone's equation and promises its dots for Chapter 3
    previews: [at(1, "meet")],
  },
  deltaNotation: {
    builtIn: at(3, "slope"),
    prereqs: [],
    uses: [/\\Delta/],
    mathOnly: true,
    defines: /\\Delta[^$]*\$[^.]*(change in|“change in”)/i,
  },
  firstorder: { builtIn: at(3, "rule"), prereqs: ["derivative"], node: "firstorder" },
  tau: {
    builtIn: at(3, "rule"),
    prereqs: ["firstorder"],
    node: "tau",
    uses: [/63 ?%/],
    // τ is the time to close the gap at today's speed; 63% is what it really closes
    defines: /at (today's|its starting|the starting) speed/i,
  },
  integral: { builtIn: at(3, "area"), prereqs: ["derivative"], node: "integral", uses: [/\\int/] },
  acceleration: {
    builtIn: at(3, "slopes"),
    prereqs: ["derivative"],
    uses: [/\\ddot\{/, /d\^2/, /second derivative/i, /slope of (the|a) slope/i],
    previews: [at(1, "meet")],
    defines: /slope of (the|a) slope/i,
  },
  primeNotation: {
    builtIn: at(3, "slopes"),
    prereqs: ["acceleration"],
    uses: [/[a-z]'/],
    mathOnly: true,
    defines: /h''/,
  },
  // Chapter 4
  power: { builtIn: at(4, "ladder"), prereqs: [], node: "power" },
  // the coffee rule with Δt = τ/n is (1 − 1/n)ⁿ after one τ: two routes to the same 1/e
  euler: {
    builtIn: at(4, "tiny"),
    prereqs: ["power", "tau"],
    node: "euler",
    defines: /\\tau ?\/ ?n/,
  },
  exponential: { builtIn: at(4, "stretch"), prereqs: ["euler", "derivative"], node: "exponential" },
  guess: { builtIn: at(4, "guess"), prereqs: ["exponential", "firstorder"], node: "guess" },
  // Chapter 5
  complex: { builtIn: at(5, "arrows"), prereqs: [], node: "complex" },
  radian: {
    builtIn: at(5, "turns"),
    prereqs: ["complex"],
    uses: [/radian/i, /\\pi/],
    defines: /arc/i,
  },
  trig: {
    builtIn: at(5, "turns"),
    prereqs: ["radian"],
    uses: [/\\cos/, /\\sin/, /cosine/i, /\bsine\b/i],
    defines: /shadow/i,
  },
  spin: {
    builtIn: at(5, "spin"),
    prereqs: ["complex", "exponential", "radian", "trig"],
    node: "spin",
    uses: [/e\^\{i/],
    // e^{iθ} is built from tiny sideways steps, the Chapter 4 way, before Euler's formula
    defines: /\(1 ?\+ ?\\frac\{i/,
  },
  spiral: { builtIn: at(5, "map"), prereqs: ["spin"], node: "spiral" },
  smap: { builtIn: at(5, "map"), prereqs: ["spiral"], node: "smap" },
  // Chapter 6
  second: { builtIn: at(6, "spring"), prereqs: ["acceleration", "guess"], node: "second" },
  wnzeta: {
    builtIn: at(6, "knobs"),
    prereqs: ["second", "smap"],
    node: "wnzeta",
    uses: [/\\zeta/],
  },
  critical: { builtIn: at(6, "knobs"), prereqs: ["wnzeta"], node: "critical" },
  mode: { builtIn: at(6, "knobs"), prereqs: ["spiral"], node: "mode" },
  sum: { builtIn: at(6, "knobs"), prereqs: ["mode"], node: "sum" },
  arrows: {
    builtIn: at(6, "arrows"),
    prereqs: ["complex", "trig"],
    uses: [/arctan/, /\\angle/, /\|G/, /conjugate/i],
    defines: /arctan/,
  },
  // Chapter 7
  laplace: {
    builtIn: at(7, "probe"),
    prereqs: ["integral", "spiral"],
    node: "laplace",
    uses: [/e\^\{-st\}/],
  },
  splane: { builtIn: at(7, "explode"), prereqs: ["laplace", "smap"], node: "splane" },
  dtos: { builtIn: at(7, "rule"), prereqs: ["laplace", "primeNotation"], node: "dtos" },
  table: { builtIn: at(7, "table"), prereqs: ["dtos", "arrows"], node: "table" },
  partialFractions: {
    builtIn: at(7, "pieces"),
    prereqs: ["table"],
    uses: [/partial fraction/i, /cover-up/i],
    defines: /one unknown/i,
  },
  // Chapter 8
  tf: { builtIn: at(8, "recipe"), prereqs: ["table"], node: "tf" },
  poles: { builtIn: at(8, "poles"), prereqs: ["tf", "partialFractions", "mode"], node: "poles" },
  stability: { builtIn: at(8, "poles"), prereqs: ["poles"], node: "stability" },
  zeros: { builtIn: at(8, "zeros"), prereqs: ["poles"], node: "zeros" },
  limits: { builtIn: at(8, "limits"), prereqs: ["poles"], node: "limits" },
  closedLoop: {
    builtIn: at(8, 'loop'),
    prereqs: ['tf', 'blockdiagram'],
    node: 'closedloop',
    uses: [/1 ?\+ ?C\(s\)/, /1 ?\+ ?C\\,P/],
    defines: /\\frac\{C\\,P\}\{1 \+ C\\,P\}/,
  },
  // Chapter 9
  integralaction: {
    builtIn: at(9, "integral"),
    prereqs: ["integral", "sserror"],
    node: "integralaction",
  },
  derivativeaction: {
    builtIn: at(9, "derivative"),
    prereqs: ["derivative", "wnzeta"],
    node: "derivativeaction",
  },
  pid: {
    builtIn: at(9, "poles"),
    prereqs: ["integralaction", "derivativeaction", "closedLoop"],
    node: "pid",
  },
  noise: { builtIn: at(9, "warnings"), prereqs: ["derivativeaction"], node: "noise" },
  // Chapter 10
  phaselag: { builtIn: at(10, "lag"), prereqs: ["delay", "spin"], node: "phaselag" },
  delayTf: {
    builtIn: at(10, "lag"),
    prereqs: ["laplace", "phaselag"],
    uses: [/e\^\{-Ls\}/, /e\^\{-sL\}/],
    // derived with the probe, not argued from one line of the map
    defines: /e\^\{-sL\}\s*\\?,?\s*F\(s\)/,
    once: true,
  },
  bode: { builtIn: at(10, "bode"), prereqs: ["arrows", "phaselag"], node: "bode" },
  logScale: {
    builtIn: at(10, "bode"),
    prereqs: ["power"],
    uses: [/logarithmic/i, /log scale/i, /\bdB\b/],
    defines: /multipl\w* [^.]*becomes? add/i,
    once: true,
  },
  margins: { builtIn: at(10, "margins"), prereqs: ["bode", "closedLoop"], node: "margins" },
  robust: { builtIn: at(10, "design"), prereqs: ["margins"], node: "robust" },
  // Chapter 11
  motorlag: { builtIn: at(11, "briefing"), prereqs: ["firstorder", "margins"], node: "motorlag" },
  tradeoff: { builtIn: at(11, "reflect"), prereqs: ["pid", "noise"], node: "tradeoff" },
  you: { builtIn: at(11, "reflect"), prereqs: ["tradeoff"], node: "you" },
};

/**
 * Gaps the course still has, each with the phase of `docs/plans/maths-explanations.md` that
 * closes it. The test fails if a listed gap has quietly been fixed, so the list stays honest.
 */
export const KNOWN_GAPS: Record<string, string> = {
  deltaNotation: 'Phase 4: Δ is used in Chapter 3 before it is read as "change in"',
  tau: "Phase 4: τ is defined by the 63%, not by the starting speed",
  acceleration: "Phase 4: the slope of a slope is used in Chapter 4 before it is built",
  primeNotation: "Phase 4: x' and x'' appear in Chapter 4 quizzes without an introduction",
  euler: "Phase 4: (1 − 1/n)ⁿ is not tied back to the coffee rule",
  radian: "Phase 5: radians and π are asserted, not built",
  trig: "Phase 5: cosine and sine are never defined",
  spin: "Phase 5: e^{iθ} is quoted before it is built",
  partialFractions: "Phase 6: partial fractions are used without their reasons",
  logScale:
    "Phase 7: log axes are explained as fitting a range, not as multiplying becoming adding",
};
