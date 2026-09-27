import { abs, c, sub } from '../../math/complex';
import { I, rotateBy, shadow, spiralPoint, squareWavePartial, tinyTurns, twinSum } from './models';

describe('Chapters 5–6 numbers', () => {
  it('Chapter 5 quiz: at ω = π rad/s a full turn (2π) takes 2 s, and one second is half a turn', () => {
    const w = Math.PI;
    expect((2 * Math.PI) / w).toBeCloseTo(2, 12);
    // after 1 s the spinner points the other way: e^{iπ} = −1
    expect(abs(sub(spiralPoint(0, w, 1), c(-1)))).toBeLessThan(1e-12);
    expect(abs(sub(spiralPoint(0, w, 2), c(1)))).toBeLessThan(1e-12);
  });

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

describe('5b: measuring turns and building e^(iθ) from tiny turns', () => {
  it('a radian is about 57°, a full turn 2π ≈ 6.28 radians, and one radian is about a sixth of a turn', () => {
    expect((180 / Math.PI)).toBeCloseTo(57.3, 1);
    expect(2 * Math.PI).toBeCloseTo(6.28, 2);
    expect(1 / (2 * Math.PI)).toBeCloseTo(1 / 6, 1);
  });

  it('the sine trails the cosine by a quarter turn; at half a turn the shadows are −1 and 0', () => {
    for (const th of [0.3, 1, 2.5]) expect(Math.sin(th)).toBeCloseTo(Math.cos(th - Math.PI / 2), 12);
    expect(Math.cos(Math.PI)).toBeCloseTo(-1, 12);
    expect(Math.sin(Math.PI)).toBeCloseTo(0, 12);
  });

  it("2 rad/s is one turn every π ≈ 3.14 s", () => {
    expect((2 * Math.PI) / 2).toBeCloseTo(3.14, 2);
  });

  it('(1 + iθ/n)ⁿ lands on the circle at angle θ as n grows; one giant step is far off', () => {
    const one = tinyTurns(2, 1)[1];
    expect(abs(one)).toBeCloseTo(Math.sqrt(5), 12);
    for (const theta of [0.5, 2, 3]) {
      const z = tinyTurns(theta, 5000)[5000];
      expect(abs(z)).toBeCloseTo(1, 2);
      expect(Math.atan2(z.im, z.re)).toBeCloseTo(theta, 3);
      // each step turns by about θ/n
      const [a, b] = tinyTurns(theta, 60);
      expect(Math.atan2(b.im, b.re) - Math.atan2(a.im, a.re)).toBeCloseTo(theta / 60, 3);
    }
    // the length creeps down towards 1 as n grows
    const lens = [1, 4, 16, 64].map((n) => abs(tinyTurns(2, n)[n]));
    lens.slice(1).forEach((l, i) => expect(l).toBeLessThan(lens[i]));
  });
});
