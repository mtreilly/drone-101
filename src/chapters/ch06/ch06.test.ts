import { roots } from '../../math/poly';
import { overshootFormula, secondOrderSolution } from '../../math/second-order';
import { DRONE, HOVER_THRUST, DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import { MassSpringDamper } from '../../sim/msd-model';
import { sample, secondOrderRoots, settling, within } from './helpers';
import { plays } from './plays';

const { m, c } = DRONE;

describe('chapter 6 numbers', () => {
  it('root formula matches polynomial roots', () => {
    for (const [wn, z] of [[3, 0.3], [3, 1.5], [5, 3]]) {
      const ours = secondOrderRoots(wn, z);
      const ref = roots([1, 2 * z * wn, wn * wn]);
      const key = (r: { re: number; im: number }) => r.re * 1000 + r.im;
      const a = ours.map(key).sort();
      const b = ref.map(key).sort();
      a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));
    }
  });

  it('underdamped roots lie on a circle of radius wn', () => {
    const [r] = secondOrderRoots(4, 0.4);
    expect(Math.hypot(r.re, r.im)).toBeCloseTo(4, 10);
  });

  it('drone with hover feedforward and the spring give identical curves', () => {
    const kp = 20;
    const msd = new MassSpringDamper(m, c, kp, () => 0, -1, 0);
    const drone = new DroneSim(defaultDroneConfig({ pid: { ...P_ONLY(kp), ff: HOVER_THRUST }, h0: 1 }));
    let maxErr = 0;
    for (let i = 0; i < 6000; i++) {
      msd.step();
      drone.step();
      maxErr = Math.max(maxErr, Math.abs(drone.h - 2 - msd.pos));
    }
    expect(maxErr).toBeLessThan(1e-9);
  });

  it('drone zeta values stated in the text', () => {
    const zeta = (kp: number) => c / (2 * Math.sqrt(m * kp));
    expect(zeta(20)).toBeCloseTo(0.158, 3);
    expect(zeta(200)).toBeCloseTo(0.05, 3);
    expect(c * c / (4 * m)).toBeCloseTo(0.5, 10);
    expect(HOVER_THRUST / 0.5).toBeCloseTo(9.81, 2);
    expect(2 * Math.sqrt(m * 20)).toBeCloseTo(6.32, 2);
  });

  it('zeta = 3 is several times slower than zeta = 1 (race widget, wn = 3)', () => {
    const wn = 3;
    const k = m * wn * wn;
    const ts = (z: number) => {
      const d = sample(secondOrderSolution(m, 2 * z * wn * m, k, k, 0, 0), 12, 6000);
      return settling(d.xs, d.ys, 1, 1);
    };
    const ratio3 = ts(3) / ts(1);
    expect(ratio3).toBeGreaterThan(3.5);
    expect(ratio3).toBeLessThan(4.5);
    expect(Number.isNaN(ts(5)) || ts(5) > 9).toBe(true);
  });

  it('slow and fast overdamped modes: 2% times', () => {
    expect(Math.log(50) / 0.2).toBeCloseTo(19.6, 1);
    expect(Math.log(50) / 10).toBeCloseTo(0.39, 2);
  });

  it('ωn, c_crit and ζ as stated in the new prose and plays', () => {
    const t = (k: string) => k;
    // k = 20 N/m, m = 0.5 kg → ωn ≈ 6.32 rad/s, one swing every ≈ 0.99 s
    expect(Math.sqrt(20 / m)).toBeCloseTo(6.32, 2);
    expect((2 * Math.PI) / Math.sqrt(20 / m)).toBeCloseTo(0.99, 2);
    expect(plays.wn.outputs.period({ k: 20 }, t)).toBe('0.99');
    // c_crit = 2√(mk) ≈ 6.32 N·s/m; our drag c = 1 gives ζ ≈ 0.16 (same as the drone at Kp = 20)
    expect(plays.zeta.outputs.ccrit({ c: 1 }, t)).toBe('6.32');
    expect(plays.zeta.outputs.zeta({ c: 1 }, t)).toBe('0.16');
    expect(plays.zeta.outputs.regime({ c: 6.3 }, t, t)).toBe('regime.critical');
    // relabelling: 2ζωn = c/m and ωn² = k/m
    const k = 20;
    const z = c / (2 * Math.sqrt(m * k));
    expect(2 * z * Math.sqrt(k / m)).toBeCloseTo(c / m, 12);
    // the root vanishes exactly at c_crit
    expect((c / m) ** 2 / 4 - k / m).toBeLessThan(0);
    const cc = 2 * Math.sqrt(m * k);
    expect((cc / m) ** 2 / 4 - k / m).toBeCloseTo(0, 10);
    // units check: 20 N/m × 0.5 m = 10 N
    expect(plays.units.outputs.f({ kp: 20, e: 0.5 }, t)).toBe('10.0');
    // quiz: k = 8 N/m, m = 0.5 kg → c_crit = 4; c = 1 gives ζ = 0.25
    expect(2 * Math.sqrt(0.5 * 8)).toBe(4);
    expect(1 / 4).toBe(0.25);
  });

  it('circle, damped frequency and the settling rule of thumb', () => {
    const [r] = secondOrderRoots(3, 0.4);
    expect(r.re).toBeCloseTo(-1.2, 10);
    expect(r.im).toBeCloseTo(2.75, 2);
    expect(plays.circle.outputs.r({ z: 0.4 }, (k) => k)).toBe('3.00');
    for (let zz = 0; zz <= 1; zz += 0.05) {
      const [q] = secondOrderRoots(3, zz);
      expect(Math.hypot(q.re, q.im)).toBeCloseTo(3, 9);
    }
    // ωd = ωn√(1 − ζ²) is the height of the dots
    expect(r.im).toBeCloseTo(3 * Math.sqrt(1 - 0.16), 12);
    expect(Math.log(50)).toBeCloseTo(3.9, 1);
    expect(Math.exp(-4)).toBeCloseTo(0.018, 3);
    expect(plays.settle.outputs.ts({ a: 0.2 }, (k) => k)).toBe('19.56');
  });

  it('ζ = 0.7 overshoots under 5% but gets within 5% well before ζ = 1 (race, ωn = 3)', () => {
    const wn = 3;
    const k = m * wn * wn;
    const run = (z: number) => sample(secondOrderSolution(m, 2 * z * wn * m, k, k, 0, 0), 12, 6000);
    expect(overshootFormula(0.7)).toBeLessThan(5);
    expect(overshootFormula(0.7)).toBeCloseTo(4.6, 1);
    const t7 = within(run(0.7), 0.05);
    const t1 = within(run(1), 0.05);
    expect(t7).toBeLessThan(0.7 * t1);
  });

  it('drone play: Kp = 20 → ζ 0.16, ωn 6.32, droop 0.25 m', () => {
    const t = (key: string) => key;
    expect(plays.drone.outputs.zeta({ kp: 20 }, t)).toBe('0.16');
    expect(plays.drone.outputs.wn({ kp: 20 }, t)).toBe('6.32');
    expect(plays.drone.outputs.droop({ kp: 20 }, t)).toBe('0.25');
  });
});
