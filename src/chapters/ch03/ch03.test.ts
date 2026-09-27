import { DRONE, HOVER_THRUST } from '../../sim/drone-model';
import { COFFEE, coffeeExact, coffeeSteps, cumulativeArea, droneRun, slopeOf, tankExact } from './models';

describe('Chapter 3 numbers', () => {
  it('coffee after one time constant is ≈ 45.75 °C (63% of the gap closed)', () => {
    expect(coffeeExact(COFFEE.tau)).toBeCloseTo(45.75, 2);
    const closed = (COFFEE.start - coffeeExact(COFFEE.tau)) / (COFFEE.start - COFFEE.room);
    expect(closed).toBeCloseTo(0.632, 3);
  });

  it('after 2τ 86% and after 3τ 95% of the gap is closed', () => {
    const f = (k: number) => 1 - (coffeeExact(k * COFFEE.tau) - COFFEE.room) / (COFFEE.start - COFFEE.room);
    expect(f(2)).toBeCloseTo(0.865, 3);
    expect(f(3)).toBeCloseTo(0.95, 2);
    expect(tankExact(5, 5) / 1.2).toBeCloseTo(0.632, 3);
  });

  it('small hand steps approach the smooth curve', () => {
    const steps = coffeeSteps(100, 0.1);
    expect(steps[100]).toBeCloseTo(coffeeExact(10), 0);
  });

  it('Δt between τ and 2τ overshoots below room and swings, but shrinks', () => {
    const s = coffeeSteps(6, 15);
    expect(s[1]).toBeLessThan(COFFEE.room);
    expect(s[2]).toBeGreaterThan(COFFEE.room);
    expect(Math.abs(s[6] - COFFEE.room)).toBeLessThan(Math.abs(s[1] - COFFEE.room));
  });

  it('Δt > 2τ makes the swings grow', () => {
    const s = coffeeSteps(6, 25);
    expect(Math.abs(s[6] - COFFEE.room)).toBeGreaterThan(Math.abs(s[1] - COFFEE.room));
  });

  it('area under the drone speed curve equals the height gained', () => {
    const run = droneRun(6);
    const area = cumulativeArea(run.t, run.v);
    const last = run.t.length - 1;
    expect(area[last]).toBeCloseTo(run.h[last] - run.h[0], 2);
    // highest point of the overshoot has (almost) zero speed
    const iMax = run.h.indexOf(Math.max(...run.h));
    expect(Math.abs(run.v[iMax])).toBeLessThan(0.25); // one 10 ms sample at −40 m/s² acceleration
  });
});

describe('Chapter 3 foundations', () => {
  it('τ is the time to arrive at the starting speed: one step of Δt = τ lands exactly on room temperature', () => {
    const startSpeed = (COFFEE.start - COFFEE.room) / COFFEE.tau;
    expect(COFFEE.start - startSpeed * COFFEE.tau).toBe(COFFEE.room);
    expect(coffeeSteps(1, COFFEE.tau)[1]).toBe(COFFEE.room);
  });

  it('at the top of the bump the speed is zero but the acceleration is clearly negative', () => {
    const run = droneRun(4);
    const acc = slopeOf(run.t, run.v);
    const iTop = run.h.indexOf(Math.max(...run.h));
    expect(Math.abs(run.v[iTop])).toBeLessThan(0.25);
    expect(acc[iTop]).toBeLessThan(-10);
  });

  it("the acceleration follows Chapter 1's equation: 0.5 a = T − 4.9 − 1.0 v", () => {
    const run = droneRun(4);
    const acc = slopeOf(run.t, run.v);
    // Chapter 2's drone has no free hover thrust: T = Kp × error. Away from the take-off jump, the
    // numerical slope of the speed is the model's acceleration
    for (const k of [80, 150, 260]) {
      const T = 20 * (2 - run.h[k]);
      expect(acc[k]).toBeCloseTo((T - HOVER_THRUST - DRONE.c * run.v[k]) / DRONE.m, 0);
    }
  });
});
