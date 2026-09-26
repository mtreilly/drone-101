/**
 * Pure geometry for `Plot`: label placement, text fitting, ticks, autoscale, off-frame clamping
 * and easing. No DOM here, so every rule can be unit-tested in Node (`plot-layout.test.ts`).
 * All coordinates are canvas pixels (y grows downwards) unless a name says "data".
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** A candidate place for a label: its box and how the text is aligned inside it. */
export interface Spot {
  rect: Rect;
  align: 'left' | 'right' | 'center';
}

/** What a label must stay clear of. */
export interface Obstacles {
  /** the drawable frame; a label that leaves it is heavily penalised */
  bounds: Rect;
  /** other labels, marker shapes, arrow heads … */
  boxes: Rect[];
  /** series (and straight lines) the label should not sit on, in pixels */
  polys: Pt[][];
}

export const overlapArea = (a: Rect, b: Rect): number => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
};

export const inflate = (r: Rect, d: number): Rect => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d });

/** Area of `r` that lies outside `bounds`. */
export const outsideArea = (r: Rect, bounds: Rect): number => Math.max(0, r.w * r.h - overlapArea(r, bounds));

/** Liang–Barsky: does the segment a→b touch the rectangle? */
export function segmentHitsRect(a: Pt, b: Pt, r: Rect): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, a.x - r.x],
    [dx, r.x + r.w - a.x],
    [-dy, a.y - r.y],
    [dy, r.y + r.h - a.y],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
  }
  return true;
}

/** Number of polyline segments that touch `r` (non-finite points break the line). */
export function polylineHits(poly: Pt[], r: Rect): number {
  let n = 0;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1];
    const b = poly[i];
    if (!Number.isFinite(a.x + a.y + b.x + b.y)) continue;
    if (segmentHitsRect(a, b, r)) n++;
  }
  return n;
}

/**
 * Penalty of a spot: 0 means free. Leaving the frame costs most (clipped text is lost), then
 * covering other labels (text on text is unreadable), then crossing a line (each segment that
 * touches counts, so a wiggly series weighs more than one straight guide line).
 */
export function spotScore(s: Spot, o: Obstacles, pad = 2): number {
  const r = inflate(s.rect, pad);
  // clipped text is lost text: any part outside the frame outweighs every other cost
  let score = outsideArea(s.rect, o.bounds) * 1e4;
  for (const b of o.boxes) score += overlapArea(r, b) * 20;
  for (const p of o.polys) score += polylineHits(p, r) * 400;
  return score;
}

/**
 * Picks the first free spot in preference order; if none is free, the least bad one. The
 * order is fixed, so a label only moves when something really lands on its place.
 */
export function chooseSpot(spots: Spot[], o: Obstacles): number {
  if (!spots.length) return -1;
  let best = 0;
  let bestScore = Infinity;
  for (let i = 0; i < spots.length; i++) {
    const s = spotScore(spots[i], o);
    if (s < 1e-6) return i; // free (allowing for rounding)
    if (s < bestScore - 1e-9) {
      best = i;
      bestScore = s;
    }
  }
  return best;
}

const box = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/**
 * Candidate spots for a horizontal line's label at pixel height `Y` between `x0` and `x1`.
 * The default (end, above) matches the old placement exactly: right-aligned 4 px from the end,
 * its bottom 2 px above the line.
 */
export function hLineSpots(Y: number, x0: number, x1: number, w: number, h: number, at: 'start' | 'end' | 'middle' = 'end', side: 'above' | 'below' = 'above', gap = 2): Spot[] {
  const above = Y - gap - h;
  const below = Y + gap + 1;
  const ys = side === 'above' ? [above, below] : [below, above];
  const xsFor = (a: 'start' | 'end' | 'middle'): Spot['align'] => (a === 'start' ? 'left' : a === 'end' ? 'right' : 'center');
  const xOf = (a: 'start' | 'end' | 'middle') => (a === 'start' ? x0 + 6 : a === 'end' ? x1 - 4 - w : (x0 + x1 - w) / 2);
  const order: ('start' | 'end' | 'middle')[] = at === 'start' ? ['start', 'end', 'middle'] : at === 'middle' ? ['middle', 'end', 'start'] : ['end', 'start', 'middle'];
  const out: Spot[] = [];
  for (const a of order) for (const y of ys) out.push({ rect: box(xOf(a), y, w, h), align: xsFor(a) });
  return out;
}

/**
 * Candidate spots for a vertical line's label at pixel x `X`, between `yTop` and `yBottom`.
 * Default: at the top, to the right of the line with a 6 px gap (so the first letter is never
 * struck through by the line).
 */
export function vLineSpots(X: number, yTop: number, yBottom: number, w: number, h: number, at: 'start' | 'end' | 'middle' = 'end', side: 'right' | 'left' = 'right', gap = 6): Spot[] {
  const right: Spot['align'] = 'left';
  const left: Spot['align'] = 'right';
  const sides: [number, Spot['align']][] = side === 'right' ? [[X + gap, right], [X - gap - w, left]] : [[X - gap - w, left], [X + gap, right]];
  const top = yTop - 1;
  const bottom = yBottom - h - 3;
  const mid = (yTop + yBottom - h) / 2;
  const ys = at === 'start' ? [bottom, top, mid] : at === 'middle' ? [mid, top, bottom] : [top, bottom, mid];
  const out: Spot[] = [];
  for (const y of ys) for (const [x, align] of sides) out.push({ rect: box(x, y, w, h), align });
  return out;
}

/**
 * Candidate spots around a point (a marker): NE first (NW when the point is near the right
 * edge, as before), then the other corners, then the sides.
 */
export function pointSpots(X: number, Y: number, w: number, h: number, preferLeft = false, r = 8): Spot[] {
  const ne: Spot = { rect: box(X + r, Y - 6 - h, w, h), align: 'left' };
  const nw: Spot = { rect: box(X - r - w, Y - 6 - h, w, h), align: 'right' };
  const se: Spot = { rect: box(X + r, Y + 6, w, h), align: 'left' };
  const sw: Spot = { rect: box(X - r - w, Y + 6, w, h), align: 'right' };
  const e: Spot = { rect: box(X + r + 2, Y - h / 2, w, h), align: 'left' };
  const wv: Spot = { rect: box(X - r - 2 - w, Y - h / 2, w, h), align: 'right' };
  const n: Spot = { rect: box(X - w / 2, Y - r - 4 - h, w, h), align: 'center' };
  const s: Spot = { rect: box(X - w / 2, Y + r + 4, w, h), align: 'center' };
  return preferLeft ? [nw, ne, sw, se, wv, e, n, s] : [ne, nw, se, sw, e, wv, n, s];
}

/** Spots beside the middle of a distance arrow (vertical: right/left; horizontal: above/below). */
export function arrowSpots(a: Pt, b: Pt, w: number, h: number, prefer: 'right' | 'left' | 'above' | 'below' = 'right'): Spot[] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const vertical = Math.abs(b.y - a.y) >= Math.abs(b.x - a.x);
  if (vertical) {
    const r: Spot = { rect: box(mx + 7, my - h / 2, w, h), align: 'left' };
    const l: Spot = { rect: box(mx - 7 - w, my - h / 2, w, h), align: 'right' };
    const top = Math.min(a.y, b.y);
    const bot = Math.max(a.y, b.y);
    // beside an end, clear of the guide lines the ends usually sit on (short arrows)
    const rt: Spot = { rect: box(mx + 7, top - 3 - h, w, h), align: 'left' };
    const rb: Spot = { rect: box(mx + 7, bot + 3, w, h), align: 'left' };
    const lt: Spot = { rect: box(mx - 7 - w, top - 3 - h, w, h), align: 'right' };
    const lb: Spot = { rect: box(mx - 7 - w, bot + 3, w, h), align: 'right' };
    const t: Spot = { rect: box(mx - w / 2, top - 6 - h, w, h), align: 'center' };
    const bo: Spot = { rect: box(mx - w / 2, bot + 6, w, h), align: 'center' };
    return prefer === 'left' ? [l, r, lt, lb, rt, rb, t, bo] : [r, l, rt, rb, lt, lb, t, bo];
  }
  const up: Spot = { rect: box(mx - w / 2, my - 5 - h, w, h), align: 'center' };
  const dn: Spot = { rect: box(mx - w / 2, my + 5, w, h), align: 'center' };
  return prefer === 'below' ? [dn, up] : [up, dn];
}

/**
 * Fits a label into `maxW` pixels: the preferred size if it fits, else shrink one pixel at a
 * time down to `minPx`, else wrap at spaces at `minPx` (a single long word stays whole).
 */
export function fitLabel(text: string, maxW: number, measure: (s: string, px: number) => number, maxPx = 15, minPx = MIN_LABEL_PX): { px: number; lines: string[] } {
  for (let px = maxPx; px >= minPx; px--) if (measure(text, px) <= maxW) return { px, lines: [text] };
  const words = text.split(/(?<=\s)/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur + w;
    if (cur && measure(next.trimEnd(), minPx) > maxW) {
      lines.push(cur.trimEnd());
      cur = w;
    } else cur = next;
  }
  if (cur.trim()) lines.push(cur.trimEnd());
  return { px: minPx, lines };
}

/** Smallest text a plot label may shrink to before it wraps (phones, long German words). */
export const MIN_LABEL_PX = 12;

// ---------- ticks ----------

export function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

/** Log-axis ticks at `steps` × 10^k (e.g. [1, 2, 5] for 0.1, 0.2, 0.5, 1, 2, 5 …). */
export function logTicks(min: number, max: number, steps: number[] = [1]): number[] {
  const out: number[] = [];
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    for (const s of steps) {
      const v = Number((s * 10 ** e).toPrecision(12));
      if (v >= min * 0.999 && v <= max * 1.001) out.push(v);
    }
  }
  return out.sort((a, b) => a - b);
}

/**
 * Adds `extra` ticks (e.g. a 20 N motor limit) to automatic ones, dropping any automatic tick
 * closer than `minGap` pixels to an extra one so labels never overlap.
 */
export function mergeTicks(auto: number[], extra: number[], toPx: (v: number) => number, minGap: number): number[] {
  const keep = auto.filter((a) => extra.every((e) => Math.abs(toPx(a) - toPx(e)) >= minGap));
  return [...new Set([...keep, ...extra])].sort((a, b) => a - b);
}

/** Decimal places needed to show a tick value exactly (0.05 → 2, 0.2 → 1, 5 → 0). */
export function tickDigits(v: number, max = 6): number {
  for (let d = 0; d < max; d++) if (Math.abs(Math.round(v * 10 ** d) / 10 ** d - v) <= Math.abs(v) * 1e-9) return d;
  return max;
}

// ---------- autoscale ----------

const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Smallest "round" number ≥ v (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10^k); negatives mirror. */
export function niceCeil(v: number): number {
  if (v === 0 || !Number.isFinite(v)) return v;
  if (v < 0) return -niceFloorAbs(-v);
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const n of NICE) if (n * mag >= v * (1 - 1e-12)) return Number((n * mag).toPrecision(12));
  return 10 * mag;
}
function niceFloorAbs(v: number): number {
  const mag = 10 ** Math.floor(Math.log10(v));
  for (let i = NICE.length - 1; i >= 0; i--) if (NICE[i] * mag <= v * (1 + 1e-12)) return Number((NICE[i] * mag).toPrecision(12));
  return mag;
}

export interface AutoOpts {
  /** grow/shrink the top end */
  max?: boolean;
  /** grow/shrink the bottom end */
  min?: boolean;
  /** extra room beyond the data, as a share of the span (default 0.1) */
  headroom?: number;
  /** never go past these (defaults: 10 base spans beyond the base range) */
  capMax?: number;
  capMin?: number;
}

/**
 * The range an auto-scaled axis should show. The base range is a floor (it never shrinks
 * below it); it grows to fit the data plus headroom, rounded to a nice number, and keeps its
 * current end while that still fits and is not more than ~1.6× too big (so it doesn't twitch).
 */
export function autoRange(base: [number, number], cur: [number, number], data: [number, number] | null, o: AutoOpts): [number, number] {
  const [b0, b1] = base;
  const span = b1 - b0;
  const head = o.headroom ?? 0.1;
  const capMax = o.capMax ?? b1 + 10 * span;
  const capMin = o.capMin ?? b0 - 10 * span;
  let lo = b0;
  let hi = b1;
  if (data) {
    const [d0, d1] = data;
    if (o.max && d1 > b1) {
      const need = Math.min(capMax, d1 + (d1 - Math.min(b0, d0)) * head);
      const ideal = Math.min(capMax, Math.max(b1, niceCeil(need - b0) + b0));
      hi = cur[1] >= need && cur[1] <= Math.max(b1, b0 + (ideal - b0) * 1.6) ? Math.min(cur[1], capMax) : ideal;
    }
    if (o.min && d0 < b0) {
      const need = Math.max(capMin, d0 - (Math.max(b1, d1) - d0) * head);
      const ideal = Math.max(capMin, Math.min(b0, b1 - niceCeil(b1 - need)));
      lo = cur[0] <= need && cur[0] >= Math.min(b0, b1 - (b1 - ideal) * 1.6) ? Math.max(cur[0], capMin) : ideal;
    }
  }
  return [lo, hi];
}

/** Finite min/max of several number lists (null if there is nothing finite). */
export function extent(...lists: ArrayLike<number>[]): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const l of lists)
    for (let i = 0; i < l.length; i++) {
      const v = l[i];
      if (!Number.isFinite(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  return lo <= hi ? [lo, hi] : null;
}

// ---------- easing ----------

export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/** Eases an axis range from one span to another over `ms` (time comes from the caller). */
export class RangeTween {
  constructor(
    readonly from: [number, number],
    readonly to: [number, number],
    readonly start: number,
    readonly ms = 260,
  ) {}
  at(now: number): [number, number] {
    const f = this.ms <= 0 ? 1 : easeOutCubic(Math.min(1, Math.max(0, (now - this.start) / this.ms)));
    return [this.from[0] + (this.to[0] - this.from[0]) * f, this.from[1] + (this.to[1] - this.from[1]) * f];
  }
  done(now: number): boolean {
    return now - this.start >= this.ms;
  }
}

// ---------- off-frame ----------

/**
 * Pulls a point back inside `r` (inset by `inset`) and says which way it really lies, so the
 * plot can draw it at the edge with an arrow pointing to where it went.
 */
export function clampToRect(p: Pt, r: Rect, inset = 7): { x: number; y: number; out: boolean; dx: number; dy: number } {
  const x = Math.min(r.x + r.w - inset, Math.max(r.x + inset, p.x));
  const y = Math.min(r.y + r.h - inset, Math.max(r.y + inset, p.y));
  const inside = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const dx = p.x - x;
  const dy = p.y - y;
  const len = Math.hypot(dx, dy) || 1;
  return { x, y, out: !inside, dx: inside ? 0 : dx / len, dy: inside ? 0 : dy / len };
}

/** Runs of samples above `hi` or below `lo` (data units), with the index of each run's extreme. */
export function offFrameRuns(ys: ArrayLike<number>, lo: number, hi: number): { from: number; to: number; side: 'above' | 'below'; peak: number }[] {
  const out: { from: number; to: number; side: 'above' | 'below'; peak: number }[] = [];
  let cur: { from: number; to: number; side: 'above' | 'below'; peak: number } | null = null;
  for (let i = 0; i < ys.length; i++) {
    const v = ys[i];
    const side = v > hi ? 'above' : v < lo ? 'below' : null;
    if (side && cur && cur.side === side) {
      cur.to = i;
      if (side === 'above' ? v > ys[cur.peak] : v < ys[cur.peak]) cur.peak = i;
    } else {
      if (cur) out.push(cur);
      cur = side ? { from: i, to: i, side, peak: i } : null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ---------- droop band ----------

/** The droop band between where a response settles and where it was asked to go. */
export function droopBand(target: number, settle: number): { lo: number; hi: number; droop: number } {
  return { lo: Math.min(target, settle), hi: Math.max(target, settle), droop: target - settle };
}
