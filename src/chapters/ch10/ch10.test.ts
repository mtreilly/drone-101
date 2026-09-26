import { loopMargins, sweep } from '../../math/bode';
import { SHOWER } from '../../sim/shower-model';
import { comfortTime, handLoop, handPolicy, measureSine, piLoop, piPolicy, runShower, swingPeriod, unwrapNear } from './shower-tools';

describe('Chapter 10 numbers', () => {
  it('hand (integral) loop: phase crossover 0.457 rad/s, period 13.75 s (shown as 13.8 s), critical k 0.0112', () => {
    const m = loopMargins(handLoop(1), 2.5);
    expect(m.w180).toBeCloseTo(0.4569, 3);
    expect((2 * Math.PI) / m.w180).toBeCloseTo(13.75, 1);
    expect(m.gm).toBeCloseTo(0.01116, 4);
  });

  it('normal hand k=0.008: gain margin ≈1.40, phase margin ≈22°; doubled hand is unstable', () => {
    const m = loopMargins(handLoop(0.008), 2.5);
    expect(m.gm).toBeCloseTo(1.395, 2);
    expect(m.pm).toBeCloseTo(22.4, 0);
    expect(loopMargins(handLoop(0.016), 2.5).gm).toBeLessThan(1);
  });

  it('doubling the delay lowers the critical hand gain to ≈0.0060', () => {
    expect(loopMargins(handLoop(1), 5).gm).toBeCloseTo(0.00604, 4);
  });

  it('position-style (P) hand: ω180 ≈ 0.952 rad/s (period 6.6 s), Kcrit ≈ 0.0307', () => {
    const m = loopMargins({ num: [45], den: [1, 1] }, 2.5);
    expect(m.w180).toBeCloseTo(0.9523, 3);
    expect(m.gm).toBeCloseTo(0.0307, 4);
  });

  it('simulated swing periods: normal hand ≈15.5 s, harder hand ≈11.6 s (limited by the knob)', () => {
    expect(swingPeriod(runShower(handPolicy(0.008), 60))).toBeCloseTo(15.5, 0);
    expect(swingPeriod(runShower(handPolicy(0.016), 60))).toBeCloseTo(11.6, 0);
    expect(comfortTime(runShower(handPolicy(0.008), 60))).toBeNaN();
  });

  it('recommended PI (kp 0.01, ki 0.006): PM ≈ 58°, GM ≈ 2.1, comfortable by ≈9.4 s', () => {
    const m = loopMargins(piLoop(0.01, 0.006), 2.5);
    expect(m.pm).toBeCloseTo(58.3, 0);
    expect(m.gm).toBeCloseTo(2.12, 1);
    const trace = runShower(piPolicy(0.01, 0.006), 40);
    expect(trace.u[1]).toBeGreaterThan(0.23); // initial P action plus a little I
    expect(comfortTime(trace)).toBeCloseTo(9.4, 1);
  });

  it("June's aggressive PI (0.05, 0.05) is unstable", () => {
    expect(loopMargins(piLoop(0.05, 0.05), 2.5).gm).toBeLessThan(1);
    expect(comfortTime(runShower(piPolicy(0.05, 0.05), 40))).toBeNaN();
  });

  it('measured sine response matches the Bode formula', () => {
    for (const w of [0.1, 0.4, 1, 2]) {
      const meas = measureSine(w);
      const [ex] = sweep([1], [SHOWER.tau, 1], SHOWER.delay, [w]);
      expect(meas.gain).toBeCloseTo(ex.mag, 2);
      expect(unwrapNear(meas.phase, ex.phase)).toBeCloseTo(ex.phase, 0);
    }
  });
});
