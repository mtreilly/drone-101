/**
 * Layout of the concept map: pure data and geometry (no DOM), shared by the renderer
 * (`concept-map.ts`) and its overlap test, so the test measures exactly what is drawn.
 */

/** Chapter cluster centres (serpentine layout on a 1200×930 sheet; rows 320 apart leave room for 2-line bubbles). */
export const CENTRES: [number, number][] = [
  [150, 120],
  [450, 130],
  [750, 120],
  [1050, 130],
  [1050, 440],
  [750, 440],
  [450, 440],
  [150, 440],
  [150, 760],
  [450, 760],
  [750, 760],
  [1050, 760],
];

/** node id → [chapter, dx, dy] from the chapter's centre */
export const NODES: Record<string, [number, number, number]> = {
  goal: [0, -55, -35],
  delay: [0, 50, 40],
  openloop: [1, 5, -62],
  feedback: [1, 60, 50],
  blockdiagram: [1, -55, 0],
  error: [1, -55, 95],
  plant: [1, 65, 135],
  disturbance: [1, -65, 155],
  kp: [2, -5, -60],
  sserror: [2, -60, 15],
  overshoot: [2, 50, 70],
  derivative: [3, -55, -60],
  firstorder: [3, 50, 0],
  tau: [3, 50, 85],
  integral: [3, -40, 145],
  power: [4, -60, -60],
  euler: [4, 45, -10],
  exponential: [4, -75, 35],
  guess: [4, 40, 90],
  complex: [5, -50, -62],
  spin: [5, 40, 0],
  spiral: [5, -50, 65],
  smap: [5, 55, 130],
  second: [6, -50, -50],
  wnzeta: [6, 80, -15],
  critical: [6, -50, 30],
  mode: [6, 90, 55],
  sum: [6, -45, 130],
  laplace: [7, -50, -70],
  dtos: [7, 70, -25],
  table: [7, -40, 50],
  splane: [7, 50, 95],
  tf: [8, -35, 20],
  poles: [8, 95, -25],
  limits: [8, -30, -60],
  zeros: [8, -70, 105],
  stability: [8, 65, 75],
  integralaction: [9, -45, -60],
  derivativeaction: [9, 55, 0],
  pid: [9, -35, 70],
  noise: [9, 30, 135],
  phaselag: [10, -45, -60],
  bode: [10, 40, 20],
  margins: [10, -45, 105],
  robust: [10, 85, 150],
  motorlag: [11, -50, -60],
  you: [11, 10, 15],
  tradeoff: [11, 40, 115],
};

export const EDGES: [string, string][] = [
  ['goal', 'error'],
  ['openloop', 'feedback'],
  ['blockdiagram', 'feedback'],
  ['feedback', 'error'],
  ['plant', 'blockdiagram'],
  ['disturbance', 'feedback'],
  ['error', 'kp'],
  ['kp', 'sserror'],
  ['kp', 'overshoot'],
  ['overshoot', 'derivative'],
  ['derivative', 'firstorder'],
  ['firstorder', 'tau'],
  ['derivative', 'integral'],
  ['firstorder', 'euler'],
  ['power', 'exponential'],
  ['euler', 'exponential'],
  ['exponential', 'guess'],
  ['guess', 'complex'],
  ['complex', 'spin'],
  ['spin', 'spiral'],
  ['spiral', 'smap'],
  ['smap', 'second'],
  ['overshoot', 'second'],
  ['second', 'wnzeta'],
  ['wnzeta', 'critical'],
  ['wnzeta', 'sum'],
  ['mode', 'sum'],
  ['sum', 'laplace'],
  ['integral', 'laplace'],
  // Ch 5's spinners are what the probe "unspins"
  ['spin', 'laplace'],
  ['laplace', 'dtos'],
  // Ch 4's sticky note ("in Chapter 7 this grows up")
  ['guess', 'dtos'],
  ['laplace', 'table'],
  ['smap', 'splane'],
  ['laplace', 'splane'],
  ['splane', 'poles'],
  ['dtos', 'tf'],
  ['tf', 'poles'],
  ['tf', 'zeros'],
  // a pole is a mode's s; its angle and distance are ζ and ωn
  ['mode', 'poles'],
  ['wnzeta', 'poles'],
  ['poles', 'stability'],
  // far-left poles ask for thrust the motors don't have
  ['stability', 'limits'],
  ['sserror', 'integralaction'],
  ['integral', 'integralaction'],
  // pinned motors wind the integral up
  ['limits', 'integralaction'],
  ['derivative', 'derivativeaction'],
  ['wnzeta', 'derivativeaction'],
  // the Kd that makes the drone critically damped
  ['critical', 'derivativeaction'],
  ['integralaction', 'pid'],
  ['derivativeaction', 'pid'],
  ['pid', 'noise'],
  // the derivative filter is a first-order lag
  ['firstorder', 'noise'],
  ['delay', 'phaselag'],
  ['spin', 'bode'],
  ['phaselag', 'bode'],
  ['bode', 'margins'],
  ['margins', 'robust'],
  ['stability', 'robust'],
  ['pid', 'robust'],
  // the motors are a first-order lag too, and it costs phase
  ['firstorder', 'motorlag'],
  ['motorlag', 'phaselag'],
  ['limits', 'tradeoff'],
  ['noise', 'tradeoff'],
  ['margins', 'tradeoff'],
  ['robust', 'you'],
  ['pid', 'you'],
  ['tradeoff', 'you'],
];

/** The SVG viewBox: x, y, width, height. */
export const VIEWBOX = [-50, -40, 1300, 1000] as const;

/** Node label font size (px in viewBox units, `.concept-map text`) and line step for 2-line labels. */
export const NODE_FONT = 19;
export const LINE_STEP = 21;
/** Chapter labels (`.concept-map .ch-label`): font size and baseline offset from the centre. */
export const CH_FONT = 22;
export const CH_LABEL_DY = -108;

/** Full-width characters (CJK, kana, full-width punctuation) are about one em wide. */
const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

/**
 * Estimated width of one line of text: 0.505 em per ordinary character (generous for
 * Patrick Hand and Noto Sans Arabic, measured ≈ 0.38–0.45 em), 1.08 em per full-width one
 * (Noto Sans JP/SC, 1 em, plus room for the ellipse to curve round the ends).
 */
export function textWidth(line: string, font = NODE_FONT): number {
  let w = 0;
  for (const ch of line) w += WIDE.test(ch) ? 1.08 : 0.505;
  return w * font;
}

/** A label wider than this (px) wraps. */
export const WRAP_AT = 168;

/** Break opportunities: after a space (dropped), or, if asked, after "-" or "/" (kept). */
const pieces = (label: string, hyphens: boolean): string[] => (label.match(hyphens ? /[^ /-]*(?:[/-]+| +|$)/g : /[^ ]*(?: +|$)/g) ?? []).filter(Boolean);
const lineOf = (ps: string[]): string => ps.join('').trimEnd();
const lineCost = (ps: string[], last: boolean): number => textWidth(lineOf(ps)) + (!last && /[/-]$/.test(lineOf(ps)) ? 14 : 0);

/** Best split of `ps` into `k` lines: the one whose widest line is narrowest. */
function balanced(ps: string[], k: number): { lines: string[][]; cost: number } {
  if (k === 1 || ps.length < k) return { lines: [ps], cost: lineCost(ps, true) };
  let best = { lines: [ps], cost: Infinity };
  for (let i = 1; i <= ps.length - (k - 1); i++) {
    const rest = balanced(ps.slice(i), k - 1);
    const cost = Math.max(lineCost(ps.slice(0, i), false), rest.cost);
    if (cost < best.cost) best = { lines: [ps.slice(0, i), ...rest.lines], cost };
  }
  return best;
}

/**
 * A label's lines. A translator may break a label with "\n" (needed where words have no spaces,
 * as in Japanese and Chinese); otherwise a long label wraps at spaces (or after "-" and "/"),
 * into as few and as even lines as possible, at most three.
 */
export function labelLines(label: string): string[] {
  if (label.includes('\n')) return label.split('\n');
  if (textWidth(label) <= WRAP_AT) return [label];
  // spaces first; "-" and "/" only when spaces can't do it; two lines if a little over is enough
  for (const hyphens of [false, true]) {
    const ps = pieces(label, hyphens);
    for (const k of [2, 3]) {
      const pick = balanced(ps, k);
      if (pick.cost <= WRAP_AT + (k === 2 ? 20 : 0)) return pick.lines.map(lineOf);
    }
  }
  const ps = pieces(label, true);
  return balanced(ps, 3).lines.map(lineOf);
}

/** A label as one line of plain text (for screen readers). */
export const labelText = (label: string): string => label.replace(/\s*\n\s*/g, ' ');

/** The node's ellipse (full width and height) for a label, as drawn. */
export function nodeSize(label: string): { w: number; h: number } {
  const lines = labelLines(label);
  const widest = Math.max(...lines.map((l) => textWidth(l)));
  return { w: Math.max(64, widest + 30), h: 44 + LINE_STEP * (lines.length - 1) };
}

export const nodePos = (id: string): [number, number] => {
  const [ch, dx, dy] = NODES[id];
  return [CENTRES[ch][0] + dx, CENTRES[ch][1] + dy];
};

/* ---------- geometry for the layout test ---------- */

interface Ellipse {
  x: number;
  y: number;
  a: number;
  b: number;
}
interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const inEllipse = (e: Ellipse, x: number, y: number): number => ((x - e.x) / e.a) ** 2 + ((y - e.y) / e.b) ** 2;
const ellipsePoints = (e: Ellipse, n = 180): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 2 * Math.PI;
    return [e.x + e.a * Math.cos(t), e.y + e.b * Math.sin(t)];
  });
const rectPoints = (r: Rect, n = 40): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const x = r.x0 + (r.x1 - r.x0) * f;
    const y = r.y0 + (r.y1 - r.y0) * f;
    pts.push([x, r.y0], [x, r.y1], [r.x0, y], [r.x1, y]);
  }
  return pts;
};
const inRect = (r: Rect, x: number, y: number) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** How far (px) the two ellipses overlap along the line between them; 0 when apart. */
export function ellipseOverlap(p: Ellipse, q: Ellipse): number {
  let depth = 0;
  for (const [e, f] of [
    [p, q],
    [q, p],
  ]) {
    for (const [x, y] of ellipsePoints(e)) {
      const k = inEllipse(f, x, y);
      if (k < 1) depth = Math.max(depth, (1 - Math.sqrt(k)) * Math.min(f.a, f.b));
    }
  }
  return depth;
}

function ellipseHitsRect(e: Ellipse, r: Rect): boolean {
  return ellipsePoints(e).some(([x, y]) => inRect(r, x, y)) || rectPoints(r).some(([x, y]) => inEllipse(e, x, y) < 1);
}

/** Hand-drawn strokes wobble a few px; this much clear paper must stay between two shapes. */
export const MAP_GAP = 6;

/**
 * Everything wrong with the map for one language: overlapping bubbles, bubbles or chapter labels
 * outside the viewBox, chapter labels touching each other or a bubble, edges to unknown nodes.
 * `node(id)` and `chapter(n)` return the visible labels.
 */
export function mapProblems(node: (id: string) => string, chapter: (n: number) => string): string[] {
  const problems: string[] = [];
  const m = MAP_GAP / 2;
  const [vx, vy, vw, vh] = VIEWBOX;
  const shapes = Object.keys(NODES).map((id) => {
    const [x, y] = nodePos(id);
    const { w, h } = nodeSize(node(id));
    return { id, e: { x, y, a: w / 2 + m, b: h / 2 + m } };
  });
  for (const { id, e } of shapes) {
    if (e.x - e.a < vx || e.x + e.a > vx + vw || e.y - e.b < vy || e.y + e.b > vy + vh) problems.push(`${id} leaves the viewBox`);
  }
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const d = ellipseOverlap(shapes[i].e, shapes[j].e);
      if (d > 0) problems.push(`${shapes[i].id}/${shapes[j].id} overlap ${d.toFixed(1)} px`);
    }
  }
  const labels = CENTRES.map(([cx, cy], n) => {
    const w = textWidth(chapter(n), CH_FONT);
    const base = cy + CH_LABEL_DY;
    return { n, r: { x0: cx - w / 2 - m, x1: cx + w / 2 + m, y0: base - CH_FONT * 0.85 - m, y1: base + CH_FONT * 0.25 + m } };
  });
  for (const { n, r } of labels) {
    if (r.x0 < vx || r.x1 > vx + vw || r.y0 < vy) problems.push(`chapter ${n} label leaves the viewBox`);
    for (const o of labels) if (o.n > n && r.x0 < o.r.x1 && o.r.x0 < r.x1 && r.y0 < o.r.y1 && o.r.y0 < r.y1) problems.push(`chapter labels ${n}/${o.n} touch`);
    for (const { id, e } of shapes) if (ellipseHitsRect(e, r)) problems.push(`${id} touches chapter ${n} label`);
  }
  for (const [a, b] of EDGES) if (!NODES[a] || !NODES[b]) problems.push(`edge ${a}→${b} has an unknown end`);
  return problems;
}
