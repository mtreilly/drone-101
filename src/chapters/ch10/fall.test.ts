import { CRASH_SPEED, DRONE } from '../../sim/drone-model';
import { fallTrace, groundCut } from './fall';
import { stepFromPoles } from './poles';

describe('falling after the drone hits the page', () => {
  it('stops dead at the hit, then falls and crashes', () => {
    const tr = fallTrace(5, 6);
    expect(tr.h[0]).toBe(5);
    // it never rises above where it hit
    expect(Math.max(...tr.h)).toBeLessThanOrEqual(5);
    expect(tr.h.at(-1)).toBe(0);
    expect(tr.crashed).toBe(true);
  });

  it('takes as long as an unpowered drone with drag needs to fall that far', () => {
    // with linear drag, h(t) = h0 − (g m/c)·t + (g m²/c²)(1 − e^(−c t/m)) from rest
    const { m, g, c } = DRONE;
    const h0 = 5;
    const hAt = (t: number) => h0 - ((g * m) / c) * t + ((g * m * m) / (c * c)) * (1 - Math.exp((-c * t) / m));
    let lo = 0;
    let hi = 10;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (hAt(mid) > 0) lo = mid;
      else hi = mid;
    }
    const tr = fallTrace(h0, 0);
    expect(tr.t.at(-1)!).toBeCloseTo(lo, 1);
  });
});

describe('the ground as a real event for the formula (groundCut)', () => {
  // the playground's plot: 400 intervals over 6 s
  const T1 = 6;
  const sampled = (f: (t: number) => number) => {
    const t = Array.from({ length: 401 }, (_, i) => (T1 * i) / 400);
    return { t, h: t.map(f) };
  };

  it('0.6 ± 3i: the formula dives below the grass at 1.756 s; the plot is cut there and stays at 0', () => {
    const f = stepFromPoles(0.6, 3);
    const tr = sampled(f);
    const cut = groundCut(tr, f);
    expect(cut.at).toBeCloseTo(1.756, 3);
    expect(f(cut.at!)).toBeCloseTo(0, 9);
    // up to touchdown the plot is the formula; from then on the drone is down
    const k = cut.t.indexOf(cut.at!);
    expect(k).toBeGreaterThan(0);
    for (let i = 0; i < k; i++) expect(cut.h[i]).toBe(f(cut.t[i]));
    expect(cut.h.slice(k).every((h) => h === 0)).toBe(true);
    expect(Math.min(...cut.h)).toBe(0);
    // the same time axis, one exact point added, still ending at T1
    expect(cut.t).toHaveLength(tr.t.length + 1);
    expect(cut.t.at(-1)).toBe(T1);
    // it comes down fast: a crash, by the sim's own rule
    expect(cut.v).toBeLessThan(-CRASH_SPEED);
    expect(cut.crashed).toBe(true);
  });

  it('without the formula the samples give nearly the same touchdown', () => {
    const f = stepFromPoles(0.6, 3);
    const exact = groundCut(sampled(f), f);
    const approx = groundCut(sampled(f));
    expect(Math.abs(approx.at! - exact.at!)).toBeLessThan(0.005);
    expect(approx.crashed).toBe(true);
  });

  it('stable poles never touch the ground: nothing changes', () => {
    for (const [re, im] of [[-1, Math.sqrt(39)], [-2, 4], [-0.15, 8], [-3, 0]]) {
      const tr = sampled(stepFromPoles(re, im));
      const cut = groundCut(tr, stepFromPoles(re, im));
      expect(cut.at).toBeNull();
      expect(cut.h).toEqual(tr.h);
      expect(cut.crashed).toBe(false);
    }
  });

  it('only a landing counts: starting on the ground is not a touchdown', () => {
    const cut = groundCut({ t: [0, 1, 2, 3], h: [0, 1, 0.5, -0.5] });
    expect(cut.at).toBeCloseTo(2.5, 9);
    expect(cut.h).toEqual([0, 1, 0.5, 0, 0]);
    expect(cut.t).toEqual([0, 1, 2, 2.5, 3]);
    // a gentle touchdown (0.5 m/s) is a landing, not a crash
    expect(groundCut({ t: [0, 1, 2], h: [1, 0.5, 0] }).crashed).toBe(false);
  });
});
