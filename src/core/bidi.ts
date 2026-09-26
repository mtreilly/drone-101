/**
 * Right-to-left text with little left-to-right pieces of maths in it.
 *
 * In an Arabic sentence the Unicode bidi algorithm reorders anything without strong letters:
 * "$K_p$ = 20" shows as "20 = Kp", "−2.0 ± 4.0i" loses its minus to the far side, "× 1.40" turns
 * into "1.40 ×". `markRuns()` finds each such little expression and wraps it in one
 * left-to-right isolate, so the locale files never need invisible direction marks.
 *
 * A run is a stretch without right-to-left letters made of operands (numbers, Latin or Greek
 * symbols, formulas, playable numbers) joined by operators, or one operand carrying a sign or a
 * unit symbol ("−0.2", "×10", "{calc|deg}°"). A lone plain number or word is left alone: the
 * bidi algorithm already gets those right.
 */

/** Numbers with units or operators read left to right; a value written in right-to-left words keeps the page direction. */
export const valueDir = (v: string): 'ltr' | 'rtl' => (/[\u0590-\u08ff]/.test(v) ? 'rtl' : 'ltr');

/** Invisible direction marks (isolates, embeddings, LRM/RLM/ALM), stripped before runs are found again. */
export const BIDI_MARKS = /[\u2066-\u2069\u202A-\u202E\u200E\u200F\u061C]/g;

// placeholders (private use area) for things that count as one operand or must not be touched
const ATOM_PH = 0xe100; // formulas and playable numbers: one operand each
const WALL_PH = 0xe400; // markup that must stay intact ({out| openers, link targets): ends a run

// an operand: a number ("4.0i"), a formula or playable number, or a symbol, maybe applied ("f(0)", "$G$(s)")
const CALL = String.raw`(?:\([^()\s]{1,12}\))?`;
const ATOM = String.raw`(?:(?:\d+(?:[.,]\d+)*|[½¼¾])[A-Za-zα-ωϑϕ]*|(?:[\uE100-\uE3FF][A-Za-zα-ωϑϕ]*|[A-Za-zα-ωΑ-Ωϑϕ][A-Za-z0-9α-ωϑϕ′]*)${CALL})`;
const SP = String.raw`[ \u00a0\u2009\u202f\u2060]`;
const PREFIX = String.raw`[−\-+±∓×÷√~≈<>≤≥(|∠°]`;
const SUFFIX = String.raw`[°%′″)|!×²³]`;
const OPERAND = String.raw`(?:${PREFIX}${SP}?)*${ATOM}${SUFFIX}*(?:${SP}%(?![\p{L}\p{N}]))?`;
const OP = String.raw`(?:${SP}?[=≈≠<>≤≥×÷±∓+−\-/·⋅–→]${SP}?|,${SP}|${SP})`;
const RUN = new RegExp(String.raw`(?<![A-Za-zα-ωΑ-Ω0-9\uE100-\uE3FF])${OPERAND}(?:${OP}${OPERAND})*`, 'gu');

/**
 * The longest start of `run` whose brackets and bars pair up inside it, so a pair is never split
 * across the isolate's edge ("(τ = 1" becomes "τ = 1"; "−180° (0.95" becomes "−180°").
 */
const closer = (s: string): number => {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) return i;
  }
  return -1;
};

function balanced(run: string): string {
  let s = run;
  // brackets around the whole run stay outside it: the page mirrors a pair correctly
  while (s.startsWith('(') && s.endsWith(')') && closer(s) === s.length - 1) s = s.slice(1, -1).trim();
  if (s.startsWith('(') && !s.endsWith(')')) s = s.slice(1).trimStart();
  const open: number[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') open.push(i);
    else if (s[i] === ')') {
      if (!open.length) return s.slice(0, i).trimEnd();
      open.pop();
    }
  }
  if (open.length) s = s.slice(0, open[0]).trimEnd();
  const bars = [...s].reduce((n, c) => n + (c === '|' ? 1 : 0), 0);
  if (bars % 2) s = s.startsWith('|') ? s.slice(1).trimStart() : s.slice(0, s.lastIndexOf('|')).trimEnd();
  return s;
}

const BARE = new RegExp(String.raw`^${ATOM}$`, 'u');

export interface RunMarks {
  open: string;
  close: string;
}

/**
 * Wraps every little left-to-right expression in `open` … `close`. Formulas `$…$`, playable
 * numbers `{scrub|…}` / `{calc|…}`, colour openers `{out|` and link targets `](#…)` are protected,
 * so the markers never land inside markup.
 */
export function markRuns(src: string, marks: RunMarks): string {
  const atoms: string[] = [];
  const walls: string[] = [];
  let s = src.replace(BIDI_MARKS, '');
  s = s.replace(/\$[^$]+\$|\{(?:scrub|calc)\|\w+(?:\|\w+)?\}/g, (m) => String.fromCharCode(ATOM_PH + atoms.push(m) - 1));
  s = s.replace(/\{(?:sp|out|err|eff|dis)\||\]\(#[^)\s]*\)/g, (m) => String.fromCharCode(WALL_PH + walls.push(m) - 1));
  // a run cut short by an unpaired bracket leaves a tail that may hold another run
  const mark = (text: string): string =>
    text.replace(RUN, (m) => {
      const core = balanced(m.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, ''));
      const at = m.indexOf(core);
      if (!core || at < 0) return m;
      const tail = mark(m.slice(at + core.length));
      // a lone formula, playable number, number or symbol already reads the right way
      if (BARE.test(core)) return m.slice(0, at + core.length) + tail;
      return `${m.slice(0, at)}${marks.open}${core}${marks.close}${tail}`;
    });
  s = mark(s);
  return s.replace(/[\uE100-\uE7FF]/g, (c) => {
    const code = c.charCodeAt(0);
    return code >= WALL_PH ? walls[code - WALL_PH] : atoms[code - ATOM_PH];
  });
}

/** Unicode isolates for plain text (status lines, labels, canvas text): LRI … PDI. */
export const LTR_ISOLATE: RunMarks = { open: '\u2066', close: '\u2069' };

/** Plain text with every little expression isolated left to right (for right-to-left pages). */
export const isolateRuns = (s: string): string => markRuns(s, LTR_ISOLATE);

/**
 * Text inside a drawing that is laid out left to right (SVG pictures keep physical coordinates):
 * a label in right-to-left words becomes one right-to-left isolate, so "الارتفاع: 2.06 م" keeps
 * its colon after the word and its unit after the number.
 */
export const inLtrBox = (s: string): string => (valueDir(s) === 'rtl' ? `\u2067${isolateRuns(s)}\u2069` : s);

/**
 * Canvas text: a label in Arabic words is laid out right to left with its little expressions
 * isolated; a label without right-to-left letters ("−180°", "× 1.40") stays left to right.
 */
export function canvasBidi(ctx: CanvasRenderingContext2D, s: string, rtlPage: boolean): string {
  ctx.direction = valueDir(s);
  return rtlPage ? isolateRuns(s) : s;
}

/**
 * A short label (plot legend key, caption) on a right-to-left page: each stretch without Arabic
 * letters that holds Latin symbols, such as "f(t)·e^(−st)", becomes one left-to-right isolate.
 */
export const isolateLatin = (s: string): string =>
  s.replace(BIDI_MARKS, '').replace(/[^\s\u0590-\u08ff](?:[^\u0590-\u08ff]*[^\s\u0590-\u08ff])?/g, (m) => (/[A-Za-z]/.test(m) ? `\u2066${m}\u2069` : m));
