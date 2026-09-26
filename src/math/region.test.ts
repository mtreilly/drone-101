import { stepMetrics } from './metrics';
import { inRegion, regionFromMetric, regionPath, type Pt } from './region';
import { secondOrderSolution } from './second-order';

/** signed area (shoelace): positive for counter-clockwise rings */
const area = (r: readonly Pt[]) => r.reduce((a, [x, y], i) => a + (x * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * y), 0) / 2;
const gridPoints = (x: [number, number], y: [number, number], step: number): Pt[] => {
  const out: Pt[] = [];
  const nx = Math.round((x[1] - x[0]) / step);
  const ny = Math.round((y[1] - y[0]) / step);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) out.push([x[0] + i * step, y[0] + j * step]);
  return out;
};

describe('regionFromMetric: the outline of where a judgement holds', () => {
  it('a disc: one counter-clockwise ring, area π, and every grid point on the right side', () => {
    const disc = (x: number, y: number) => x * x + y * y < 1;
    const g = { x: [-2, 2] as [number, number], y: [-2, 2] as [number, number], step: 0.1 };
    const rings = regionFromMetric(disc, g);
    expect(rings).toHaveLength(1);
    expect(area(rings[0])).toBeGreaterThan(0);
    // boundary points are bisected onto the circle, so the polygon is a fine inscribed polygon
    expect(area(rings[0])).toBeCloseTo(Math.PI, 1);
    for (const [x, y] of rings[0]) expect(Math.hypot(x, y)).toBeCloseTo(1, 2);
    for (const [x, y] of gridPoints(g.x, g.y, g.step)) expect(inRegion(rings, x, y)).toBe(disc(x, y));
  });

  it('a ring with a hole, and two islands: separate rings, even-odd inside test', () => {
    const annulus = (x: number, y: number) => {
      const r = Math.hypot(x, y);
      return r > 0.55 && r < 1.25;
    };
    const g = { x: [-2, 2] as [number, number], y: [-2, 2] as [number, number], step: 0.1 };
    const rings = regionFromMetric(annulus, g);
    expect(rings).toHaveLength(2);
    // outer ring counter-clockwise, the hole clockwise
    expect(rings.map(area).sort((a, b) => a - b)[0]).toBeLessThan(0);
    expect(rings.reduce((a, r) => a + area(r), 0)).toBeCloseTo(Math.PI * (1.25 ** 2 - 0.55 ** 2), 1);
    for (const [x, y] of gridPoints(g.x, g.y, g.step)) expect(inRegion(rings, x, y)).toBe(annulus(x, y));
    const islands = regionFromMetric((x, y) => Math.hypot(x - 1, y) < 0.4 || Math.hypot(x + 1, y) < 0.4, g);
    expect(islands).toHaveLength(2);
    expect(inRegion(islands, 0, 0)).toBe(false);
  });

  it('a region that runs off the grid is clipped to the grid rectangle', () => {
    const rings = regionFromMetric((x) => x < 0.33, { x: [-1, 1], y: [-1, 1], step: 0.1 });
    expect(rings).toHaveLength(1);
    expect(area(rings[0])).toBeCloseTo(1.33 * 2, 2);
    const xs = rings[0].map((p) => p[0]);
    expect(Math.min(...xs)).toBe(-1);
    expect(Math.max(...xs)).toBeCloseTo(0.33, 2);
    expect(regionFromMetric(() => false, { x: [0, 1], y: [0, 1], step: 0.5 })).toEqual([]);
  });

  it('regionPath draws closed sub-paths in pixels', () => {
    const d = regionPath([[[0, 0], [1, 0], [1, 1]]], (x) => 10 * x, (y) => 100 - 10 * y);
    expect(d).toBe('M0.0,100.0L10.0,100.0L10.0,90.0Z');
  });
});

describe("Chapter 8's challenge zone, judged by the measured step response", () => {
  // the playground: poles −σ ± iω, a 1 m → 2 m step, 400 intervals over 6 s, "OS < 10 % and settles (2 %) in < 2 s"
  const t = Array.from({ length: 401 }, (_, i) => (6 * i) / 400);
  const metrics = (re: number, im: number) => {
    const k = re * re + im * im;
    const f = secondOrderSolution(1, -2 * re, Math.max(k, 1e-6), 2 * Math.max(k, 1e-6), 1, 0);
    return stepMetrics(t, t.map(f), 1, 2);
  };
  const passes = (re: number, im: number) => {
    if (re >= -0.02) return false;
    const m = metrics(re, im);
    return m.overshoot < 10 && m.settlingTime < 2;
  };
  const grid = { x: [-10, 0] as [number, number], y: [-8, 8] as [number, number], step: 0.1 };
  const zone = regionFromMetric(passes, grid);

  it('agrees with stepMetrics at every grid point', () => {
    let inside = 0;
    for (const [x, y] of gridPoints(grid.x, grid.y, grid.step)) {
      if (x === grid.x[0] || x === grid.x[1] || y === grid.y[0] || y === grid.y[1]) continue;
      const judged = passes(x, y);
      expect(inRegion(zone, x, y)).toBe(judged);
      if (judged) inside++;
    }
    expect(inside).toBeGreaterThan(1000);
  });

  it('the review cases: (−2.1, 0) settles in 2.79 s, outside; −1.6 ± 1.2i settles in 1.89 s with 1.5 %, inside', () => {
    expect(metrics(-2.1, 0).settlingTime).toBeCloseTo(2.79, 1);
    expect(inRegion(zone, -2.1, 0)).toBe(false);
    const m = metrics(-1.6, 1.2);
    expect(m.settlingTime).toBeCloseTo(1.89, 1);
    expect(m.overshoot).toBeCloseTo(1.5, 0);
    expect(inRegion(zone, -1.6, 1.2)).toBe(true);
    expect(inRegion(zone, -1.6, -1.2)).toBe(true);
    // the rule-of-thumb zone (σ > 2, ζ > 0.591) would have said the opposite for both
  });

  it('is symmetric about the real axis (mirror pairs), and nothing right of the axis is in it', () => {
    for (const [x, y] of [[-3, 2], [-5, 4.4], [-8, 1], [-2.5, 0.7]] as Pt[]) expect(inRegion(zone, x, y)).toBe(inRegion(zone, x, -y));
    for (const ring of zone) for (const [x] of ring) expect(x).toBeLessThan(0);
  });
});
