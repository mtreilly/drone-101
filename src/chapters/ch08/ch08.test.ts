import { roots } from '../../math/poly';
import { stepMetrics } from '../../math/metrics';
import { DRONE, DroneSim, HOVER_THRUST, defaultDroneConfig } from '../../sim/drone-model';
import { RK4 } from '../../sim/integrator';
import { gainsFromPoles, noZeroResponse, overshootOf, settleOf, stepFromPoles, zeroResponse, zetaOf } from './poles';

const pd = (kp: number, kd: number) => ({ kp, ki: 0, kd, ff: HOVER_THRUST, dTau: 0, dOnMeasurement: true, antiWindup: false });

describe('chapter 8', () => {
  it('gains from poles put the closed-loop roots exactly there', () => {
    for (const [re, im] of [[-2, 4], [-1, 6.245], [0.5, 2], [-6, 1]]) {
      const { kp, kd } = gainsFromPoles(re, im);
      const r = roots([DRONE.m, DRONE.c + kd, kp]);
      expect(r[1].re).toBeCloseTo(re, 9);
      expect(Math.abs(r[1].im)).toBeCloseTo(im, 9);
    }
    // the Chapter 2 drone (Kp = 20, no Kd) lives at −1 ± 6.245i
    expect(gainsFromPoles(-1, Math.sqrt(39)).kp).toBeCloseTo(20, 9);
    expect(gainsFromPoles(-1, Math.sqrt(39)).kd).toBeCloseTo(0, 9);
  });

  it('simulated PD drone matches the pole-based formula', () => {
    for (const [re, im, T] of [[-2, 4, 4], [-3, 0.5, 4], [0.3, 3, 1.5]]) {
      const { kp, kd } = gainsFromPoles(re, im);
      const sim = new DroneSim(defaultDroneConfig({ pid: pd(kp, kd), h0: 1 }));
      const f = stepFromPoles(re, im);
      let err = 0;
      sim.advance(T, () => (err = Math.max(err, Math.abs(sim.h - f(sim.t)) / Math.max(1, Math.abs(f(sim.t))))), 1);
      expect(err).toBeLessThan(1e-6);
    }
  });

  it('overshoot from the pole angle matches the measured response', () => {
    const t = Array.from({ length: 8001 }, (_, i) => i * 0.001);
    for (const [re, im] of [[-2, 4], [-1, 3], [-3, 2]]) {
      const f = stepFromPoles(re, im);
      const m = stepMetrics(t, t.map(f), 1, 2);
      expect(m.overshoot).toBeCloseTo(overshootOf(re, im), 1);
    }
    expect(overshootOf(-2, 4)).toBeCloseTo(20.8, 1);
  });

  it('settling ≈ 4/σ is a fair rule of thumb for 0.3 ≤ ζ ≤ 0.8', () => {
    const t = Array.from({ length: 20001 }, (_, i) => i * 0.001);
    for (const [re, im] of [[-2, 4], [-1, 3], [-2, 2], [-1.5, 1.2]]) {
      const zeta = zetaOf(re, im);
      expect(zeta).toBeGreaterThan(0.29);
      expect(zeta).toBeLessThan(0.81);
      const m = stepMetrics(t, t.map(stepFromPoles(re, im)), 1, 2);
      const ratio = m.settlingTime / settleOf(re);
      expect(ratio).toBeGreaterThan(0.6);
      expect(ratio).toBeLessThan(1.15);
    }
  });

  it('zero formula matches a direct simulation of (1 − s/z)·13/(s²+4s+13)', () => {
    for (const z of [-0.8, -3, -10]) {
      // controllable canonical form: x1' = x2, x2' = −13x1 − 4x2 + u, y = 13(x1 − x2/z)
      const rk = new RK4(2, (_t, x, dx) => {
        dx[0] = x[1];
        dx[1] = -13 * x[0] - 4 * x[1] + 1;
      });
      const x = new Float64Array(2);
      const f = zeroResponse(z);
      let err = 0;
      for (let i = 1; i <= 4000; i++) {
        rk.step((i - 1) * 0.001, x, 0.001);
        err = Math.max(err, Math.abs(13 * (x[0] - x[1] / z) - f(i * 0.001)));
      }
      expect(err).toBeLessThan(1e-8);
    }
    // a zero near the origin adds overshoot
    const t = Array.from({ length: 6001 }, (_, i) => i * 0.001);
    const os = (g: (t: number) => number) => stepMetrics(t, t.map(g), 0, 1).overshoot;
    expect(os(zeroResponse(-0.8))).toBeGreaterThan(os(zeroResponse(-3)));
    expect(os(zeroResponse(-3))).toBeGreaterThan(os(noZeroResponse));
  });

  it('far-left poles need thrust beyond the 20 N motor limit', () => {
    const { kp, kd } = gainsFromPoles(-8, 8);
    const ideal = new DroneSim(defaultDroneConfig({ pid: pd(kp, kd), h0: 1 }));
    expect(ideal.thrust).toBeGreaterThan(60);
    const real = new DroneSim(defaultDroneConfig({ params: { ...DRONE, saturate: true }, pid: pd(kp, kd), h0: 1 }));
    let maxT = 0;
    let minT = Infinity;
    real.advance(4, () => {
      maxT = Math.max(maxT, real.thrust);
      minT = Math.min(minT, real.thrust);
    }, 1);
    expect(maxT).toBe(20);
    expect(minT).toBe(0);
  });
});

describe('chapter 8 limit widget claim', () => {
  it('saturated far-left poles overshoot more than gentle unsaturated poles', () => {
    const os = (sig: number) => {
      const { kp, kd } = gainsFromPoles(-sig, sig);
      const sim = new DroneSim(defaultDroneConfig({ params: { ...DRONE, saturate: true }, pid: pd(kp, kd), h0: 1 }));
      const t: number[] = [];
      const y: number[] = [];
      sim.advance(3, () => (t.push(sim.t), y.push(sim.h)), 10);
      return stepMetrics(t, y, 1, 2).overshoot;
    };
    expect(os(2)).toBeLessThan(6);
    expect(os(8)).toBeGreaterThan(os(2) + 2);
  });
});
