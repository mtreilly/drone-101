import { c, abs, sub } from '../../math/complex';
import { laplaceNumeric, laplaceReal, table } from '../../math/laplace';
import { DRONE, DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import { dampedCos, derivativeRule, fromFunction, fromPoints, solveDrone, unspinIntegral, unspinLimit } from './tools';

const P = (kp: number, h0: number) => ({ m: DRONE.m, c: DRONE.c, g: DRONE.g, kp, r: 2, h0, v0: 0 });

describe('chapter 7', () => {
  it('table rows used in the widgets match the numerical probe', () => {
    for (const s of [0.5, 1.5, 3]) {
      expect(laplaceReal(() => 1, s, 80, 40000)).toBeCloseTo(1 / s, 4);
      expect(laplaceReal((t) => Math.exp(-t), s, 60, 30000)).toBeCloseTo(1 / (s + 1), 5);
      expect(laplaceReal((t) => Math.exp(0.5 * t), s + 0.6, 200, 80000)).toBeCloseTo(1 / (s + 0.1), 3);
      expect(laplaceReal((t) => Math.sin(2 * t), s, 60, 30000)).toBeCloseTo(2 / (s * s + 4), 4);
      const dc = dampedCos(0.5, 2)(c(s));
      expect(laplaceNumeric((t) => Math.exp(-0.5 * t) * Math.cos(2 * t), c(s), 60, 30000).re).toBeCloseTo(dc.re, 5);
      expect(abs(sub(table.dampedSin(0.5, 2)(c(s)), laplaceNumeric((t) => Math.exp(-0.5 * t) * Math.sin(2 * t), c(s), 60, 30000)))).toBeLessThan(1e-5);
    }
  });

  it('partial-fraction solution matches the RK4 drone from a 1 m ledge', () => {
    for (const [kp, h0] of [[20, 1], [5, 3], [60, 0.5], [12, 0]]) {
      const sol = solveDrone(P(kp, h0));
      const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp), h0 }));
      let maxErr = 0;
      sim.advance(6, () => (maxErr = Math.max(maxErr, Math.abs(sim.h - sol.f(sim.t)))), 1);
      expect(maxErr).toBeLessThan(1e-6);
    }
  });

  it('forgetting the h(0) terms starts the formula at 0 instead of h0', () => {
    const wrong = solveDrone(P(20, 1), false);
    expect(wrong.f(0)).toBeCloseTo(0, 12);
    expect(solveDrone(P(20, 1)).f(0)).toBeCloseTo(1, 12);
  });

  it('partial fraction pieces recombine to the full H(s)', () => {
    const p = P(20, 1);
    const { A, B, C } = solveDrone(p);
    for (const s of [0.7, 2, 5]) {
      const D = p.m * s * s + p.c * s + p.kp;
      const full = (p.m * p.h0 * s * s + p.c * p.h0 * s + (p.kp * p.r - p.m * p.g)) / (s * D);
      expect(A / s + (B * s + C) / D).toBeCloseTo(full, 12);
    }
    expect(A).toBeCloseTo(2 - (0.5 * 9.81) / 20, 12);
  });

  it('unspinning: running integral converges to 1/(s - i w0), grows ~t when matched', () => {
    const s = c(0.4, 1);
    const lim = unspinLimit(2, s);
    const far = unspinIntegral(2, s, 80);
    expect(abs(sub(far, lim))).toBeLessThan(1e-9);
    const num = laplaceNumeric((t) => Math.cos(2 * t), s, 80, 40000);
    const numI = laplaceNumeric((t) => Math.sin(2 * t), s, 80, 40000);
    // ∫ e^{i2t} e^{-st} = L{cos} + i L{sin}
    expect(num.re - numI.im).toBeCloseTo(lim.re, 5);
    expect(unspinIntegral(2, c(0, 2), 5).re).toBeCloseTo(5, 9);
    expect(abs(unspinLimit(2, c(0.1, 2)))).toBeCloseTo(10, 9);
  });

  it('derivative rule holds for drawn signals', () => {
    const smoothFn = fromFunction((t) => 1 + 0.8 * Math.exp(-0.6 * t) * Math.cos(1.8 * t));
    const wiggly = fromPoints([
      { x: 0, y: 0.2 },
      { x: 1.3, y: 1.9 },
      { x: 2.1, y: -0.4 },
      { x: 4.5, y: 1.1 },
      { x: 6, y: 0.5 },
      { x: 7.4, y: 1.4 },
    ]);
    for (const d of [smoothFn, wiggly]) {
      for (const s of [0.3, 1, 2.5]) {
        const r = derivativeRule(d, s);
        expect(Math.abs(r.lhs - r.rhs)).toBeLessThan(5e-3);
      }
    }
  });
});
