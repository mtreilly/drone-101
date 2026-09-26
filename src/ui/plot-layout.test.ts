import { describe, expect, it } from 'vitest';
import {
  type Obstacles,
  type Pt,
  RangeTween,
  arrowSpots,
  autoRange,
  chooseSpot,
  clampToRect,
  droopBand,
  extent,
  fitLabel,
  hLineSpots,
  logTicks,
  mergeTicks,
  niceCeil,
  offFrameRuns,
  overlapArea,
  pointSpots,
  polylineHits,
  segmentHitsRect,
  spotScore,
  tickDigits,
  vLineSpots,
} from './plot-layout';

const frame = { x: 54, y: 14, w: 400, h: 200 };
const free = (extra: Partial<Obstacles> = {}): Obstacles => ({ bounds: frame, boxes: [], polys: [], ...extra });
/** 8 px per character at 15 px, scaled with the font size */
const measure = (s: string, px: number) => s.length * 8 * (px / 15);

describe('geometry primitives', () => {
  it('overlap area and segment/rect hits', () => {
    expect(overlapArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(25);
    expect(overlapArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(0);
    const r = { x: 10, y: 10, w: 10, h: 10 };
    expect(segmentHitsRect({ x: 0, y: 15 }, { x: 30, y: 15 }, r)).toBe(true);
    expect(segmentHitsRect({ x: 0, y: 0 }, { x: 30, y: 5 }, r)).toBe(false);
    expect(segmentHitsRect({ x: 0, y: 0 }, { x: 30, y: 30 }, r)).toBe(true); // diagonal through
    expect(segmentHitsRect({ x: 12, y: 12 }, { x: 13, y: 13 }, r)).toBe(true); // inside
    expect(polylineHits([{ x: 0, y: 15 }, { x: 30, y: 15 }, { x: NaN, y: NaN }, { x: 15, y: 0 }], r)).toBe(1);
  });
});

describe('label placement (1b)', () => {
  it('an h-line label with nothing in the way sits where it always did: end, 2 px above', () => {
    const spots = hLineSpots(100, 54, 454, 80, 15);
    const i = chooseSpot(spots, free());
    expect(i).toBe(0);
    expect(spots[i].rect).toEqual({ x: 454 - 4 - 80, y: 100 - 2 - 15, w: 80, h: 15 });
    expect(spots[i].align).toBe('right');
  });

  it('steps off a series that runs through it (Ch 8 "motors can\'t pull down" on the thrust curve)', () => {
    // the orange thrust curve hugs the 0 line just above it across the whole plot
    const thrust: Pt[] = Array.from({ length: 50 }, (_, k) => ({ x: 54 + k * 8, y: 100 - 6 }));
    const spots = hLineSpots(100, 54, 454, 200, 15, 'start', 'below');
    const i = chooseSpot(spots, free({ polys: [thrust] }));
    expect(spots[i].rect.y).toBeGreaterThan(100); // below the line, clear of the curve
    expect(spots[i].align).toBe('left'); // labelAt: 'start'
    expect(polylineHits(thrust, spots[i].rect)).toBe(0);
  });

  it("labelAt: 'start' prefers the left end; the default prefers the right end", () => {
    expect(hLineSpots(100, 54, 454, 50, 15, 'start')[0].rect.x).toBe(60);
    expect(hLineSpots(100, 54, 454, 50, 15)[0].rect.x).toBe(454 - 4 - 50);
  });

  it('a v-line label keeps a 6 px gap so its first letter is never struck (Ch 7 explode)', () => {
    const s = vLineSpots(200, 14, 214, 120, 15)[0];
    expect(s.rect.x).toBe(206);
    expect(segmentHitsRect({ x: 200, y: 14 }, { x: 200, y: 214 }, s.rect)).toBe(false);
  });

  it('marker labels step around line labels (Ch 10 margins: "gain at −180°" vs "gain = 1")', () => {
    const lineLabel = hLineSpots(100, 54, 454, 60, 15)[0].rect; // right end, above the line
    // the marker sits just left of that label, on the line
    const spots = pointSpots(360, 100, 90, 15);
    expect(spotScore(spots[0], free({ boxes: [lineLabel] }))).toBeGreaterThan(0); // NE would collide
    const i = chooseSpot(spots, free({ boxes: [lineLabel] }));
    expect(overlapArea(spots[i].rect, lineLabel)).toBe(0);
  });

  it('a spot inside the frame is free despite floating-point rounding (Ch 11 "gust")', () => {
    const spots = vLineSpots(239.1, 14, 146, 23.609970092773438, 15);
    const o = free({ bounds: { x: 54, y: 8, w: 623, h: 146 } });
    expect(spotScore(spots[0], o)).toBe(0);
    expect(chooseSpot(spots, o)).toBe(0);
  });

  it('a crowded label stays inside the frame rather than dodge a curve by leaving it (Ch 7 unspin)', () => {
    // a spiral right next to the left edge: every spot around the point crosses it
    const spiral: Pt[] = Array.from({ length: 120 }, (_, k) => ({ x: 70 + 14 * Math.cos(k / 6) * (1 - k / 130), y: 60 + 14 * Math.sin(k / 6) * (1 - k / 130) }));
    const spots = pointSpots(70, 60, 60, 15);
    const r = spots[chooseSpot(spots, free({ polys: [spiral] }))].rect;
    expect(r.x).toBeGreaterThanOrEqual(frame.x);
  });

  it('labels never leave the frame when a free spot exists', () => {
    const spots = pointSpots(450, 20, 90, 15, true);
    const i = chooseSpot(spots, free());
    const r = spots[i].rect;
    expect(r.x).toBeGreaterThanOrEqual(frame.x);
    expect(r.y).toBeGreaterThanOrEqual(frame.y);
    expect(r.x + r.w).toBeLessThanOrEqual(frame.x + frame.w);
  });

  it('goes back to its preferred spot once the obstacle leaves', () => {
    const spots = hLineSpots(100, 54, 454, 60, 15);
    expect(chooseSpot(spots, free({ boxes: [spots[0].rect] }))).not.toBe(0);
    expect(chooseSpot(spots, free())).toBe(0);
  });

  it('distance-arrow labels sit beside the middle of the arrow', () => {
    const [r] = arrowSpots({ x: 200, y: 50 }, { x: 200, y: 150 }, 40, 15);
    expect(r.rect.x).toBeGreaterThan(200);
    expect(r.rect.y + r.rect.h / 2).toBeCloseTo(100);
    const [l] = arrowSpots({ x: 200, y: 50 }, { x: 200, y: 150 }, 40, 15, 'left');
    expect(l.rect.x + l.rect.w).toBeLessThan(200);
  });
});

describe('label fitting (minimum size, then wrap)', () => {
  it('keeps 15 px when it fits, shrinks towards 12 px, then wraps at spaces', () => {
    expect(fitLabel('target', 200, measure)).toEqual({ px: 15, lines: ['target'] });
    const txt = 'Motoren können nicht nach unten ziehen'; // 38 chars: 304 px at 15 px
    const shrunk = fitLabel(txt, 260, measure);
    expect(shrunk.lines).toHaveLength(1);
    expect(shrunk.px).toBeLessThan(15);
    expect(shrunk.px).toBeGreaterThanOrEqual(12);
    const wrapped = fitLabel(txt, 150, measure);
    expect(wrapped.px).toBe(12);
    expect(wrapped.lines.length).toBeGreaterThan(1);
    expect(wrapped.lines.join(' ')).toBe(txt);
    for (const l of wrapped.lines) expect(measure(l, 12)).toBeLessThanOrEqual(150);
  });
  it('never splits a single long word', () => {
    expect(fitLabel('Regelabweichungsband', 50, measure).lines).toEqual(['Regelabweichungsband']);
  });
});

describe('ticks', () => {
  it('log ticks at 1-2-5 per decade (Ch 10 Bode axes)', () => {
    expect(logTicks(0.05, 3)).toEqual([0.1, 1]);
    expect(logTicks(0.05, 3, [1, 2, 5])).toEqual([0.05, 0.1, 0.2, 0.5, 1, 2]);
  });
  it('extra ticks join the automatic ones and push close ones away (Ch 8 limit: 20 N)', () => {
    const toPx = (v: number) => 200 - v * 1.5; // 1.5 px per newton
    expect(mergeTicks([-40, 0, 40, 80], [20], toPx, 20)).toEqual([-40, 0, 20, 40, 80]);
    expect(mergeTicks([0, 25, 50], [20], toPx, 20)).toEqual([0, 20, 50]);
  });
  it('tick digits show a value exactly', () => {
    expect(tickDigits(5)).toBe(0);
    expect(tickDigits(0.2)).toBe(1);
    expect(tickDigits(0.05)).toBe(2);
    expect(tickDigits(0.025)).toBe(3);
  });
});

describe('autoscale (1c)', () => {
  it('niceCeil rounds up to a round number', () => {
    expect(niceCeil(3.3)).toBe(4);
    expect(niceCeil(11)).toBe(12);
    expect(niceCeil(0.051)).toBe(0.06);
    expect(niceCeil(2)).toBe(2);
  });

  it('never shows less than the base range', () => {
    expect(autoRange([0, 3], [0, 3], [0, 2], { max: true })).toEqual([0, 3]);
    expect(autoRange([0, 3], [0, 6], null, { max: true })).toEqual([0, 3]);
  });

  it('keeps the limit in frame: Ch 7 unspin at σ = 0.05 heads to 20', () => {
    const [lo, hi] = autoRange([-1, 4.5], [-1, 4.5], [-0.5, 20], { max: true });
    expect(lo).toBe(-1);
    expect(hi).toBeGreaterThanOrEqual(20 * 1.05);
    expect(hi).toBeLessThanOrEqual(20 * 1.5);
  });

  it('Ch 8 zero near the origin: a 6.69 peak fits a 0–2.5 plot', () => {
    const [, hi] = autoRange([0, 2.5], [0, 2.5], [0, 6.688], { max: true });
    expect(hi).toBeGreaterThan(6.688);
  });

  it('Ch 9 bump flight: a 3.9 m peak fits a 0–3 m plot', () => {
    const [, hi] = autoRange([0, 3], [0, 3], [0, 3.9], { max: true });
    expect(hi).toBeGreaterThan(3.9);
    expect(hi).toBeLessThanOrEqual(5);
  });

  it('grows the bottom too when asked, and respects caps', () => {
    const [lo] = autoRange([0, 1], [0, 1], [-2, 1], { min: true });
    expect(lo).toBeLessThan(-2);
    expect(autoRange([0, 1], [0, 1], [0, 1e9], { max: true, capMax: 50 })[1]).toBe(50);
    // default cap: ten base spans past the base range
    expect(autoRange([0, 1], [0, 1], [0, 1e9], { max: true })[1]).toBe(11);
  });

  it('does not twitch: keeps its current end while it still fits and is not far too big', () => {
    const cur: [number, number] = [0, 8];
    expect(autoRange([0, 3], cur, [0, 6.5], { max: true })).toEqual([0, 8]);
    // much smaller data: shrink back
    expect(autoRange([0, 3], [0, 40], [0, 4], { max: true })[1]).toBeLessThan(10);
  });

  it('extent ignores non-finite values', () => {
    expect(extent([1, NaN, 3], [Infinity, -2])).toEqual([-2, 3]);
    expect(extent([NaN])).toBeNull();
  });

  it('eases with ease-out and lands exactly', () => {
    const tw = new RangeTween([0, 3], [0, 8], 1000, 200);
    expect(tw.at(1000)).toEqual([0, 3]);
    const mid = tw.at(1100)[1];
    expect(mid).toBeGreaterThan(3 + 5 * 0.5); // ease-out: past halfway at half time
    expect(tw.at(1200)).toEqual([0, 8]);
    expect(tw.done(1200)).toBe(true);
    expect(new RangeTween([0, 3], [0, 8], 0, 0).at(0)).toEqual([0, 8]); // snap
  });
});

describe('off-frame points (clamp and arrow)', () => {
  it('pins an off-frame point to the edge and points at it', () => {
    const c = clampToRect({ x: 200, y: -300 }, frame, 16);
    expect(c.out).toBe(true);
    expect(c.y).toBe(frame.y + 16);
    expect(c.x).toBe(200);
    expect(c.dy).toBeCloseTo(-1);
    const inside = clampToRect({ x: 200, y: 100 }, frame);
    expect(inside.out).toBe(false);
    expect([inside.x, inside.y, inside.dx, inside.dy]).toEqual([200, 100, 0, 0]);
  });
  it('finds runs of a series above and below the frame with their extremes', () => {
    const ys = [0, 1, 3, 5, 4, 1, -1, -3, -2, 0];
    expect(offFrameRuns(ys, -1.5, 2.5)).toEqual([
      { from: 2, to: 4, side: 'above', peak: 3 },
      { from: 7, to: 8, side: 'below', peak: 7 },
    ]);
  });
});

describe('droop band (1l)', () => {
  it('spans settle → target whichever is higher; droop is target − settle', () => {
    expect(droopBand(2, 1.755)).toEqual({ lo: 1.755, hi: 2, droop: 2 - 1.755 });
    expect(droopBand(1, 1.2).droop).toBeCloseTo(-0.2);
  });
});
