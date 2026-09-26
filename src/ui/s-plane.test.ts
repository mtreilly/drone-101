import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadNamespace } from '../core/i18n';
import { describePoint, formatS, overshootOf, placement, positionsOf, settleRule, snapNearest, snapStep } from './s-plane';

beforeAll(async () => {
  // serve the English locale from disk, as the dev server would
  vi.stubGlobal('fetch', async (url: string) => {
    const path = join(__dirname, '../../public', url.replace(/^.*?locales\//, 'locales/'));
    return { ok: true, json: async () => JSON.parse(readFileSync(path, 'utf8')) };
  });
  await loadNamespace('common', 'en');
  vi.unstubAllGlobals();
});

const range = { reMin: -40, reMax: 5, imMax: 25 };

describe('SPlane placement: off-edge points keep their true value', () => {
  it('leaves points inside the plane where they are', () => {
    expect(placement(-3, 2, range)).toEqual({ re: -3, im: 2, off: false, angle: 0 });
    // exactly on the edge is still on the map
    expect(placement(-40, 0, range).off).toBe(false);
  });

  it('pins a fast pole to the left edge with an arrow pointing left', () => {
    const p = placement(-51.3, 0, range);
    expect(p).toMatchObject({ re: -40, im: 0, off: true });
    expect(Math.abs(p.angle)).toBeCloseTo(180, 6);
  });

  it('points up for a pole above the top, down for its twin below', () => {
    expect(placement(-2, 30, range)).toMatchObject({ re: -2, im: 25, off: true, angle: -90 });
    expect(placement(-2, -30, range)).toMatchObject({ re: -2, im: -25, off: true, angle: 90 });
  });

  it('points diagonally out of a corner', () => {
    const p = placement(-60, 45, range);
    expect(p).toMatchObject({ re: -40, im: 25, off: true });
    expect(p.angle).toBeCloseTo(-135, 6);
  });
});

describe('SPlane describe(): true values', () => {
  it('reports the real pole, not the edge it is drawn at (Chapter 11 default tune)', () => {
    expect(describePoint({ kind: 'pole', re: -51.3, im: 0 }, range)).toBe('Pole: −51.30 (off the map)');
    expect(describePoint({ kind: 'pole', re: -202, im: 0 }, range)).toBe('Pole: −202.00 (off the map)');
    expect(describePoint({ kind: 'pole', re: -3, im: 4, mirror: true }, range)).toBe('Pole: −3.00 ± 4.00i');
  });

  it('notices a mirror twin off the bottom edge, and a double pole', () => {
    expect(describePoint({ kind: 'pole', re: -3, im: 30, mirror: true }, range)).toBe('Pole: −3.00 ± 30.00i (off the map)');
    expect(describePoint({ kind: 'zero', re: -0.5, im: 0, label: 'PI zero' }, range)).toBe('PI zero: −0.50');
    expect(describePoint({ kind: 'pole', re: -2.2, im: 0, mirror: true }, range)).toBe('Pole: \u2066−2.20\u2069 (double)');
  });
});

describe('SPlane keyboard snapping', () => {
  it('lands on the next grid line in the direction of travel first', () => {
    // Chapter 8's default pole: ω = √39 ≈ 6.245
    expect(snapStep(Math.sqrt(39), -0.1, 0.1)).toBe(6.2);
    expect(snapStep(Math.sqrt(39), 0.1, 0.1)).toBe(6.3);
    expect(snapStep(6.2, -0.1, 0.1)).toBe(6.1);
    expect(snapStep(6.2, 0.1, 0.1)).toBe(6.3);
  });

  it('keeps shift steps on the grid too', () => {
    expect(snapStep(Math.sqrt(39), -0.5, 0.1)).toBe(5.8);
    expect(snapStep(-1, -0.5, 0.1)).toBe(-1.5);
  });

  it('tidies the axis the key does not move', () => {
    expect(snapNearest(Math.sqrt(39), 0.1)).toBe(6.2);
    expect(snapNearest(3.05, 0.1)).toBe(3.1);
    expect(snapNearest(-0.04, 0.1)).toBe(0);
  });

  it('does not drift by floating-point error over many presses', () => {
    let v = 0;
    for (let i = 0; i < 37; i++) v = snapStep(v, 0.1, 0.1);
    expect(v).toBe(3.7);
  });
});

describe('SPlane values and wording', () => {
  it('lists a mirror pair as two positions, a real one as one', () => {
    expect(positionsOf({ re: -1, im: 2, mirror: true })).toEqual([
      { re: -1, im: 2 },
      { re: -1, im: -2 },
    ]);
    expect(positionsOf({ re: -2.2, im: 0, mirror: true })).toEqual([{ re: -2.2, im: 0 }]);
  });

  it('formats pairs, single points and a double pole', () => {
    expect(formatS(-1.5, 3, true)).toBe('−1.50 ± 3.00i');
    expect(formatS(-1.5, -3)).toBe('−1.50 − 3.00i');
    expect(formatS(-2.2, 0)).toBe('−2.20');
    // a mirror pair on the real axis is a double pole; the value stays one isolated LTR run
    const d = formatS(-2.2, 0, true);
    expect(d).toContain('⁦−2.20⁩');
    expect(d).not.toBe('−2.20');
    expect(formatS(-51.3, 0, false, 1)).toBe('−51.3');
  });

  it('labels rays with the overshoot a ζ gives (Chapter 8: 53 %, 16 %, 5 %)', () => {
    expect(overshootOf(0.2)).toBeCloseTo(52.66, 2);
    expect(overshootOf(0.5)).toBeCloseTo(16.3, 1);
    expect(overshootOf(0.7)).toBeCloseTo(4.6, 1);
    expect(Math.round(overshootOf(0.2))).toBe(53);
    expect(Math.round(overshootOf(0.5))).toBe(16);
    expect(Math.round(overshootOf(0.7))).toBe(5);
    expect(overshootOf(1)).toBe(0);
  });

  it('uses the 4/σ settling rule for its lines', () => {
    expect([1, 2, 4].map(settleRule)).toEqual([4, 2, 1]);
  });
});
