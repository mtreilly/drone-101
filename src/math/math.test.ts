import { c, abs, sub } from './complex';
import { roots, fromRoots } from './poly';
import { laplaceNumeric, table } from './laplace';
import { margins, sweep } from './bode';
import { stepMetrics } from './metrics';
import { stepResponse, overshootFormula } from './second-order';
import { ShowerSim, SHOWER } from '../sim/shower-model';

describe('polynomial roots', () => {
  it('finds complex conjugate quadratic roots', () => {
    const r = roots([1, 2, 10]);
    expect(r[0].re).toBeCloseTo(-1, 12);
    expect(r[1].im).toBeCloseTo(3, 12);
  });
  it('cubic PID polynomial round trips', () => {
    const rs = [c(-1, 2), c(-1, -2), c(-4)];
    const p = fromRoots(rs);
    const found = roots(p);
    for (const r of rs) expect(Math.min(...found.map((f) => abs(sub(f, r))))).toBeLessThan(1e-9);
  });
});

describe('Laplace transform: numerical probe vs the derived table', () => {
  const cases: [string, (t: number) => number, (s: ReturnType<typeof c>) => ReturnType<typeof c>][] = [
    ['step', () => 1, table.step],
    ['exp(-2t)', (t) => Math.exp(-2 * t), table.exp(-2)],
    ['sin(3t)', (t) => Math.sin(3 * t), table.sin(3)],
    ['cos(3t)', (t) => Math.cos(3 * t), table.cos(3)],
    ['e^-t sin 4t', (t) => Math.exp(-t) * Math.sin(4 * t), table.dampedSin(1, 4)],
  ];
  it.each(cases)('%s', (_n, f, F) => {
    for (const s of [c(0.8), c(2), c(1.5, 2), c(3, -1)]) {
      const num = laplaceNumeric(f, s, 60, 30000);
      const ex = F(s);
      expect(abs(sub(num, ex)) / abs(ex)).toBeLessThan(1e-4);
    }
  });

  it('derivative rule L{f′} = sF(s) − f(0) on an arbitrary smooth signal', () => {
    const f = (t: number) => 1.3 + Math.exp(-0.7 * t) * Math.cos(2 * t) - 0.4 * Math.exp(-3 * t);
    const df = (t: number) =>
      Math.exp(-0.7 * t) * (-0.7 * Math.cos(2 * t) - 2 * Math.sin(2 * t)) + 1.2 * Math.exp(-3 * t);
    for (const s of [c(0.5), c(1.2, 0.8), c(4)]) {
      const lhs = laplaceNumeric(df, s, 80, 40000);
      const F = laplaceNumeric(f, s, 80, 40000);
      const rhs = { re: s.re * F.re - s.im * F.im - f(0), im: s.re * F.im + s.im * F.re };
      expect(abs(sub(lhs, rhs))).toBeLessThan(1e-5);
    }
  });
});

describe('step metrics', () => {
  it('overshoot of sampled response matches the formula', () => {
    const f = stepResponse(4, 0.3);
    const t = Array.from({ length: 10001 }, (_, i) => i * 0.001);
    const m = stepMetrics(t, t.map(f), 0, 1);
    expect(m.overshoot).toBeCloseTo(overshootFormula(0.3), 2);
    expect(m.settlingTime).toBeGreaterThan(2.5);
    expect(m.settlingTime).toBeLessThan(4);
  });
});

describe('shower frequency response and margins', () => {
  const num = [45];
  const den = [SHOWER.tau, 1];
  it('phase crossover near 0.952 rad/s, critical P gain ≈ 0.0307', () => {
    const m = margins(num, den, SHOWER.delay);
    expect(m.w180).toBeCloseTo(0.9523, 3);
    expect(1 / (45 / Math.hypot(1, m.w180))).toBeCloseTo(0.03069, 4);
    expect(m.gm).toBeCloseTo(1 / (45 / Math.hypot(1, m.w180)), 6);
  });

  it('sweep phase includes delay lag exactly', () => {
    const [p] = sweep(num, den, SHOWER.delay, [2]);
    expect(p.phase).toBeCloseTo((-Math.atan(2) - 2 * 2.5) * (180 / Math.PI), 6);
  });

  it('simulated sine through the shower matches |G| and phase', () => {
    const w = 0.6;
    const sim = new ShowerSim(SHOWER, { kind: 'position', position: (t) => 0.5 + 0.2 * Math.sin(w * t) }, 0.5);
    let maxT = -Infinity;
    let tMax = 0;
    sim.advance(60, () => {
      if (sim.t > 60 - (2 * Math.PI) / w && sim.temp > maxT) {
        maxT = sim.temp;
        tMax = sim.t;
      }
    }, 1);
    const g = 45 / Math.hypot(1, w);
    expect(maxT - (15 + 45 * 0.5)).toBeCloseTo(0.2 * g, 1);
    // peak of input sin occurs at w t = pi/2 + 2 pi n; output lags by phi
    const phi = Math.atan(w) + w * SHOWER.delay;
    const lag = (((w * tMax - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    expect(lag).toBeCloseTo(phi, 1);
  });
});
