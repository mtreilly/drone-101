import { COFFEE, coffeeExact, coffeeSteps, cumulativeArea, droneRun, tankExact } from './models';

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
