import { abs, c, sub } from '../../math/complex';
import { I, rotateBy, shadow, spiralPoint, squareWavePartial, twinSum } from './models';

describe('Chapter 5 numbers', () => {
  it('two quarter turns are a half turn: i·i·3 = −3', () => {
    const z = rotateBy(rotateBy(c(3), I), I);
    expect(abs(sub(z, c(-3)))).toBeLessThan(1e-12);
  });

  it('the spinner stays on the circle and its velocity is iω × position', () => {
    const w = 1.7;
    for (const t of [0, 0.4, 2]) {
      const z = spiralPoint(0, w, t);
      expect(abs(z)).toBeCloseTo(1, 12);
      const h = 1e-6;
      const v = sub(spiralPoint(0, w, t + h), spiralPoint(0, w, t - h));
      const vel = c(v.re / (2 * h), v.im / (2 * h));
      const expected = rotateBy(z, c(0, w));
      expect(abs(sub(vel, expected))).toBeLessThan(1e-6);
    }
  });

  it('shadow of e^(st) is e^(σt)·cos(ωt)', () => {
    for (const [s, w, t] of [
      [-0.5, 3, 1.3],
      [0.4, 2, 0.7],
      [-1, 0, 2],
    ]) {
      expect(spiralPoint(s, w, t).re).toBeCloseTo(shadow(s, w, t), 12);
    }
  });

  it('a spinner plus its twin is purely real and equals 2cos(ωt)', () => {
    for (const t of [0.1, 1, 2.5]) {
      const z = twinSum(2, t);
      expect(z.im).toBeCloseTo(0, 12);
      expect(z.re).toBeCloseTo(2 * Math.cos(2 * t), 12);
    }
  });

  it('spring: a = ±i·√(k/m) satisfies a² = −k/m', () => {
    const a = c(0, 2);
    const sq = rotateBy(a, a);
    expect(sq.re).toBeCloseTo(-4, 12);
    expect(sq.im).toBeCloseTo(0, 12);
  });

  it('spinning pieces build a square wave (overshooting by ~9% of the jump height near each jump)', () => {
    expect(squareWavePartial(Math.PI / 2, 200)).toBeCloseTo(1, 2);
    let peak = 0;
    for (let t = 0; t < 0.5; t += 0.0005) peak = Math.max(peak, squareWavePartial(t, 50));
    // jump from −1 to +1 is 2 tall; 9% of 2 ≈ 0.18 above the flat top
    expect(peak).toBeGreaterThan(1.17);
    expect(peak).toBeLessThan(1.19);
  });
});
