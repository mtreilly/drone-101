import { seeds } from '../../sim/random';
import { pid } from '../ch09/pid-tools';
import { evaluate, runMission, starsOnSeeds } from './mission';

const REF = pid(20, 15, 5, { dTau: 0.04 });
const JUNE = pid(30, 15, 10, { dTau: 0.005 });

describe('noisy claims are checked on many seeds (starsOnSeeds)', () => {
  it('seeds are 1…n', () => {
    expect(seeds()).toHaveLength(30);
    expect(seeds(3)).toEqual([1, 2, 3]);
    expect(seeds(2, 7)).toEqual([7, 8]);
  });

  it('the reference tune earns six stars on all 30 seeds, calm between 0.19 and 0.27 N', () => {
    const s = starsOnSeeds(REF);
    expect(s.seeds).toEqual(seeds(30));
    expect(s.gold).toBe(30);
    expect(s.minStars).toBe(6);
    expect(s.misses).toEqual([]);
    expect(s.range.calm[0]).toBeGreaterThan(0.19);
    expect(s.range.calm[1]).toBeLessThan(0.27);
    // seed 7 is the widget's own flight
    expect(s.results[6]).toEqual(evaluate(runMission(REF, 7)));
  });

  it('(30, 15, 7, τf 0.04) holds on every seed; Kd 8 is not safer (23/30, the drop); Kd 6 misses once (seed 5, arrival)', () => {
    expect(starsOnSeeds(pid(30, 15, 7, { dTau: 0.04 })).gold).toBe(30);
    const kd8 = starsOnSeeds(pid(30, 15, 8, { dTau: 0.04 }));
    expect(kd8.gold).toBe(23);
    expect(kd8.misses.every((m) => m.failed.join() === 'recover')).toBe(true);
    expect(kd8.passes.recover).toBe(23);
    const kd6 = starsOnSeeds(pid(30, 15, 6, { dTau: 0.04 }));
    expect(kd6.gold).toBe(29);
    expect(kd6.misses).toEqual([{ seed: 5, failed: ['rise'] }]);
  });

  it("June's tune fails on every seed, and is flawless with a perfect sensor", () => {
    const noisy = starsOnSeeds(JUNE);
    expect(noisy.maxStars).toBe(3);
    // it overshoots 22–28 % and never settles, whatever the jitter…
    expect(noisy.passes.overshoot).toBe(0);
    expect(noisy.passes.rise).toBe(0);
    expect(noisy.range.overshoot[0]).toBeGreaterThan(21);
    // …but "the motors buzz" is only nearly always true: 2 of 30 seeds scrape under 0.5 N (0.48, 0.50)
    expect(noisy.passes.calm).toBe(2);
    expect(noisy.range.calm[0]).toBeGreaterThan(0.48);
    const calm = starsOnSeeds(JUNE, 3, { noiseStd: 0 });
    expect(calm.gold).toBe(3);
    // no noise: every seed flies the same mission
    expect(calm.range.rise[0]).toBe(calm.range.rise[1]);
    expect(calm.range.rise[0]).toBeCloseTo(1.27, 2);
  });
});

describe('asked for vs delivered (Trace.command)', () => {
  it("June's command sits at 0 N more than half of 3–6 s and at 20 N less than a third; the lagged motors never touch either limit", () => {
    const tr = runMission(JUNE);
    expect(tr.command.every((c) => c >= 0 && c <= 20)).toBe(true);
    const win = tr.t.map((_, i) => i).filter((i) => tr.t[i] >= 3 && tr.t[i] < 6);
    const at0 = win.filter((i) => tr.command[i] <= 1e-9).length / win.length;
    const at20 = win.filter((i) => tr.command[i] >= 20 - 1e-9).length / win.length;
    // the 1 ms count in the review: 57 % and 23 %
    expect(at0).toBeGreaterThan(0.5);
    expect(at0).toBeCloseTo(0.57, 1);
    expect(at20).toBeLessThan(0.3);
    expect(at20).toBeCloseTo(0.23, 1);
    const motor = tr.thrust.slice(100);
    expect(Math.min(...motor)).toBeGreaterThan(2.9);
    expect(Math.max(...motor)).toBeLessThan(10.7);
  });

  it('take-off: the reference tune asks for 40 N and the command is pinned at 20 N for about 0.27 s', () => {
    const tr = runMission(REF);
    expect(tr.request[0]).toBeCloseTo(40, 6);
    expect(tr.command[0]).toBe(20);
    const pinned = tr.t.filter((t, i) => t < 3 && tr.command[i] >= 20 - 1e-9).length * 0.01;
    expect(pinned).toBeCloseTo(0.27, 1);
  });
});
