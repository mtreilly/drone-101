import { BASES, compound, compoundSteps, measuredSlope, powerChain, ruleMismatch, stepRate, stepRise } from './models';
import { plays } from './plays';

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

  it('the doubling ladder: powers stated in the text', () => {
    expect(2 ** 0).toBe(1);
    expect(2 ** -1).toBe(0.5);
    expect(2 ** 0.5).toBeCloseTo(1.41, 2);
    expect(1.41 * 1.41).toBeCloseTo(2, 1);
    expect(powerChain(3)).toBe('2 × 2 × 2');
    expect(powerChain(2.5)).toBe('2 × 2 × √2');
    expect(powerChain(0)).toBe('1');
    expect(powerChain(-2)).toBe('1 ÷ 2 ÷ 2');
    expect(powerChain(-0.5)).toBe('1 ÷ √2');
  });

  it('a step of 2ᵗ rises by the same fraction of its height wherever it starts', () => {
    for (const dt of [1, 0.5, 0.25]) {
      for (const t of [-1, 0, 1.5, 3]) expect((2 ** (t + dt) - 2 ** t) / 2 ** t).toBeCloseTo(stepRise(2, dt), 12);
    }
    expect(stepRise(2, 0.5) * 100).toBeCloseTo(41.4, 1);
    // rise ÷ height per second closes in on ln 2 ≈ 0.693 ("about 0.69" at the tiny step)
    expect(stepRate(2, 1)).toBe(1);
    expect(stepRate(2, 1 / 256)).toBeCloseTo(0.694, 3);
    expect(Math.log(2)).toBeCloseTo(0.693, 3);
  });

  it('growing 100% per second in tiny steps levels off at e; shrinking at 1/e', () => {
    expect(compound(1)).toBe(2);
    expect(compound(2)).toBe(2.25);
    expect(compound(4)).toBeCloseTo(2.44, 2);
    expect(compound(1000)).toBeCloseTo(2.717, 3);
    expect(compound(1e6)).toBeLessThan(Math.E);
    expect(compound(1e6)).toBeGreaterThan(2.718);
    for (let n = 1; n < 5000; n *= 2) expect(compound(n)).toBeLessThan(Math.E);
    expect(Math.E).toBeCloseTo(2.71828, 5);
    expect(compound(1, -1)).toBe(0);
    expect(compound(1e6, -1)).toBeCloseTo(0.368, 3);
    expect(1 - Math.exp(-1)).toBeCloseTo(0.632, 3);
    const st = compoundSteps(4);
    expect(st.y[4]).toBeCloseTo(compound(4), 12);
    expect(st.t[4]).toBe(1);
  });

  it('every base is a power of e; e^a is the per-second multiplier', () => {
    expect(Math.exp(0.693)).toBeCloseTo(2, 2);
    expect(plays.base.outputs.lnb({ b: 2 }, (k) => k)).toBe('0.693');
    expect(plays.rate.outputs.ea({ a: 1 }, (k) => k)).toBe('2.718');
    expect(plays.doubling.outputs.chain({ n: 3 }, (k) => k)).toBe('2 × 2 × 2 = 8');
    expect(plays.doubling.outputs.chain({ n: 0.5 }, (k) => k)).toBe('√2 ≈ 1.414');
    expect(plays.doubling.outputs.chain({ n: -1 }, (k) => k)).toBe('1 ÷ 2 = 0.5');
    expect(plays.compound.outputs.total({ n: 100000 }, (k) => k)).toBe('2.71827');
  });
});
