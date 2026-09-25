import { BASES, measuredSlope, ruleMismatch } from './models';

describe('Chapter 4 numbers', () => {
  it('slope ÷ height of b^t is the same everywhere and equals ln b', () => {
    for (const b of BASES) {
      for (const t of [-1, 0, 0.7, 2]) {
        const f = (x: number) => b ** x;
        expect(measuredSlope(f, t) / f(t)).toBeCloseTo(Math.log(b), 6);
      }
    }
    expect(Math.log(Math.E)).toBe(1);
    expect(Math.log(2)).toBeCloseTo(0.693, 3);
  });

  it('slope of slope of e^(2t) is 4e^(2t)', () => {
    const f = (t: number) => Math.exp(2 * t);
    const d1 = (t: number) => measuredSlope(f, t, 1e-4);
    expect(measuredSlope(d1, 0.5, 1e-4) / f(0.5)).toBeCloseTo(4, 3);
  });

  it('the coffee guess obeys the rule only for a = −1/τ', () => {
    expect(Math.abs(ruleMismatch(-0.1, 5))).toBeLessThan(1e-6);
    expect(Math.abs(ruleMismatch(-0.2, 5))).toBeGreaterThan(1);
  });

  it('x = e^(−3t) satisfies x″ + 3x′ = 0', () => {
    const x = (t: number) => Math.exp(-3 * t);
    const dx = (t: number) => measuredSlope(x, t, 1e-4);
    const ddx = measuredSlope(dx, 0.4, 1e-4);
    expect(ddx + 3 * dx(0.4)).toBeCloseTo(0, 4);
  });
});
