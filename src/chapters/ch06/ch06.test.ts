import { roots } from '../../math/poly';
import { secondOrderSolution } from '../../math/second-order';
import { DRONE, HOVER_THRUST, DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import { MassSpringDamper } from '../../sim/msd-model';
import { sample, secondOrderRoots, settling } from './helpers';

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
});
