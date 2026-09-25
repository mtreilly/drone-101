import { DRONE } from '../../sim/drone-model';
import { fallTrace } from './fall';

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
