import { hoverStep, kiLimit, pid, pidPoles, runDrone, scoreTrace, stars, takeoff } from './pid-tools';


const growth = (kp: number, ki: number, kd: number) => {
  const tr = hoverStep(pid(kp, ki, kd), 1.95, 2, 40);
  const dev = (a: number, b: number) => Math.max(...tr.h.filter((_, i) => tr.t[i] >= a && tr.t[i] < b).map((h) => Math.abs(h - 2)));
  return dev(30, 40) / dev(5, 15);
};

describe('Chapter 9 claims', () => {
  it('Routh edge values quoted in the text', () => {
    expect(kiLimit(20, 0)).toBeCloseTo(40);
    expect(kiLimit(20, 4)).toBeCloseTo(200);
    expect(kiLimit(20, 0.5)).toBeCloseTo(60);
    expect(kiLimit(10, 1)).toBeCloseTo(40);
  });

  it('poles agree with the Routh test', () => {
    for (const [kp, ki, kd] of [[20, 39, 0], [20, 41, 0], [10, 39, 1], [10, 41, 1], [30, 100, 2], [5, 3, 0.2]]) {
      const stable = pidPoles(kp, ki, kd).every((p) => p.re < 0);
      expect(stable).toBe(ki < kiLimit(kp, kd));
    }
  });

  it('simulation agrees: Kp=20, Kd=0 settles below Ki=40 and grows above', () => {
    expect(growth(20, 36, 0)).toBeLessThan(1);
    expect(growth(20, 44, 0)).toBeGreaterThan(1);
  });

  it("Mika's Ki=50 never settles; D restores stability; calm needs smaller Ki", () => {
    const wild = runDrone(takeoff(pid(20, 50, 0)), 30);
    const late = Math.max(...wild.h.filter((_, i) => wild.t[i] > 20).map((h) => Math.abs(h - 2)));
    expect(late).toBeGreaterThan(0.2); // a permanent ±28 cm yo-yo, limited by the motors
    expect(late).toBeLessThan(0.35);
    const rescued = runDrone(takeoff(pid(20, 50, 0.5)), 30);
    expect(Math.max(...rescued.h.filter((_, i) => rescued.t[i] > 25).map((h) => Math.abs(h - 2)))).toBeLessThan(0.01);
    expect(scoreTrace(runDrone(takeoff(pid(20, 50, 4)), 12)).overshoot).toBeGreaterThan(20);
    for (const kd of [3, 4, 5]) expect(scoreTrace(runDrone(takeoff(pid(20, 10, kd)), 12)).overshoot).toBeLessThan(5);
  });

  it('a modest Ki removes the droop within 12 s', () => {
    const tr = runDrone(takeoff(pid(20, 10, 0)), 12);
    expect(Math.abs(2 - tr.h[tr.h.length - 1])).toBeLessThan(0.01);
    const p = runDrone(takeoff(pid(20, 0, 0)), 12);
    expect(2 - p.h[p.h.length - 1]).toBeCloseTo(0.245, 2);
  });

  it('playground: P-only fails, 20/10/4 earns all stars', () => {
    const bad = stars(scoreTrace(runDrone(takeoff(pid(20, 0, 0)), 15)));
    expect(Object.values(bad).every(Boolean)).toBe(false);
    const good = stars(scoreTrace(runDrone(takeoff(pid(20, 10, 4)), 15)));
    expect(Object.values(good).every(Boolean)).toBe(true);
  });

  it('derivative kick saturates on error but not on measurement', () => {
    const onErr = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: false }), 1, 2, 5);
    const onMeas = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: true }), 1, 2, 5);
    expect(Math.max(...onErr.thrust)).toBeCloseTo(20, 6);
    expect(Math.max(...onMeas.thrust)).toBeLessThan(20);
  });

  it('noise: short filter chatters, long filter is calm', () => {
    const jitter = (tau: number, noise: number) => {
      const xs = hoverStep(pid(15, 8, 4, { dTau: tau }), 2, 2, 5, noise).thrust.slice(50);
      const m = xs.reduce((a, b) => a + b, 0) / xs.length;
      return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
    };
    expect(jitter(0.005, 0.02)).toBeGreaterThan(1.5);
    expect(jitter(0.1, 0.02)).toBeLessThan(1.5);
    expect(jitter(0.005, 0)).toBeLessThan(0.01);
  });
});
