import { type C, add, c, expC, mul, scale } from './complex';

/**
 * Numerical Laplace transform F(s) = ∫₀^T f(t)·e^(−s·t) dt by composite Simpson's rule.
 * `T` should be long enough that the integrand has died out (returns NaN-free finite
 * numbers even when it hasn't — the course shows that as "the area never settles").
 */
export function laplaceNumeric(f: (t: number) => number, s: C, T = 40, n = 8000): C {
  const h = T / n;
  let acc = c(0);
  for (let i = 0; i <= n; i++) {
    const t = i * h;
    const w = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
    const probe = expC(c(-s.re * t, -s.im * t));
    acc = add(acc, scale(probe, w * f(t)));
  }
  return scale(acc, h / 3);
}

/** Real-s version, returns a number. */
export const laplaceReal = (f: (t: number) => number, s: number, T = 40, n = 8000): number =>
  laplaceNumeric(f, c(s), T, n).re;

/** Running area ∫₀^t f·e^(−s·τ) dτ for animation (trapezoidal), real s. */
export function runningArea(f: (t: number) => number, s: number, T: number, n: number): Float64Array {
  const out = new Float64Array(n + 1);
  const h = T / n;
  let prev = f(0);
  for (let i = 1; i <= n; i++) {
    const t = i * h;
    const cur = f(t) * Math.exp(-s * t);
    out[i] = out[i - 1] + 0.5 * h * (prev + cur);
    prev = cur;
  }
  return out;
}

/** The table the group derives in Chapter 7 (valid to the right of the rightmost pole). */
export const table = {
  step: (s: C): C => div1(c(1), s),
  exp: (a: number) => (s: C): C => div1(c(1), c(s.re - a, s.im)),
  sin: (w: number) => (s: C): C => div1(c(w), add(mul(s, s), c(w * w))),
  cos: (w: number) => (s: C): C => div1(s, add(mul(s, s), c(w * w))),
  dampedSin: (sigma: number, w: number) => (s: C): C => {
    const sp = c(s.re + sigma, s.im);
    return div1(c(w), add(mul(sp, sp), c(w * w)));
  },
};

function div1(a: C, b: C): C {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}
