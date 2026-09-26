import { type C, c } from '../../math/complex';

/** e^(−σt)·cos(ωt) ↔ (s+σ)/((s+σ)² + ω²), the twin of the damped-sine row. */
export const dampedCos = (sigma: number, w: number) => (s: C): C => {
  const a = c(s.re + sigma, s.im);
  const den = c(a.re * a.re - a.im * a.im + w * w, 2 * a.re * a.im);
  const d = den.re * den.re + den.im * den.im;
  return { re: (a.re * den.re + a.im * den.im) / d, im: (a.im * den.re - a.re * den.im) / d };
};

export interface DroneSolveParams {
  m: number;
  c: number;
  g: number;
  kp: number;
  r: number;
  h0: number;
  v0: number;
}

/**
 * Laplace solution of the P-controlled drone  m·h'' + c·h' = Kp(r − h) − m·g  with h(0) = h0, h'(0) = v0:
 *   H(s) = [m·h0·s² + (m·v0 + c·h0)·s + (Kp·r − m·g)] / (s·(m s² + c s + Kp))
 *        = A/s + (B s + C)/(m s² + c s + Kp)
 * With `includeIC = false` the h(0), h'(0) terms are (wrongly) dropped, which is the group's first attempt.
 * Requires the underdamped case Kp/m > (c/2m)².
 */
export function solveDrone(p: DroneSolveParams, includeIC = true) {
  const h0 = includeIC ? p.h0 : 0;
  const v0 = includeIC ? p.v0 : 0;
  const A = (p.kp * p.r - p.m * p.g) / p.kp;
  const B = p.m * (h0 - A);
  const Cc = p.m * v0 + p.c * (h0 - A);
  const sigma = p.c / (2 * p.m);
  const wd = Math.sqrt(p.kp / p.m - sigma * sigma);
  // (B s + C)/(m((s+σ)² + ωd²)) = K1 (s+σ)/(…) + K2 ωd/(…)
  const K1 = B / p.m;
  const K2 = (Cc - B * sigma) / (p.m * wd);
  const f = (t: number) => A + Math.exp(-sigma * t) * (K1 * Math.cos(wd * t) + K2 * Math.sin(wd * t));
  return { A, B, C: Cc, sigma, wd, K1, K2, f };
}

/** Running integral I(t) = ∫₀ᵗ e^{(iω₀ − s)τ} dτ for a spinner e^{iω₀t} probed by e^{−st}. */
export function unspinIntegral(w0: number, s: C, t: number): C {
  const k = c(-s.re, w0 - s.im); // exponent rate
  const e = Math.exp(k.re * t);
  const num = c(e * Math.cos(k.im * t) - 1, e * Math.sin(k.im * t));
  const d = k.re * k.re + k.im * k.im;
  if (d < 1e-12) return c(t, 0);
  return { re: (num.re * k.re + num.im * k.im) / d, im: (num.im * k.re - num.re * k.im) / d };
}

/** Limit of unspinIntegral as t → ∞ (for Re s > 0): 1/(s − iω₀). */
export function unspinLimit(w0: number, s: C): C {
  const d = c(s.re, s.im - w0);
  const m = d.re * d.re + d.im * d.im;
  return { re: d.re / m, im: -d.im / m };
}

/** Bounding box of the running total from 0 to `T1` together with its limit: what the unspin frame must show. */
export function unspinExtent(w0: number, s: C, T1: number, n = 200): { x: [number, number]; y: [number, number] } {
  const L = unspinLimit(w0, s);
  const x: [number, number] = [L.re, L.re];
  const y: [number, number] = [L.im, L.im];
  for (let i = 0; i <= n; i++) {
    const I = unspinIntegral(w0, s, (T1 * i) / n);
    x[0] = Math.min(x[0], I.re);
    x[1] = Math.max(x[1], I.re);
    y[0] = Math.min(y[0], I.im);
    y[1] = Math.max(y[1], I.im);
  }
  return { x, y };
}

export const DRAW_T = 8;
const N = 400;
const DT = DRAW_T / N;

/** A hand-drawn signal on [0, 8] s, resampled, smoothed, and held flat after the last point. */
export interface Drawn {
  xs: number[];
  f: number[];
  df: number[];
}

export function fromPoints(pts: { x: number; y: number }[]): Drawn {
  const sorted = [...pts].sort((a, b) => a.x - b.x);
  const xs = Array.from({ length: N + 1 }, (_, i) => i * DT);
  let f = xs.map((x) => interp(sorted, x));
  for (let pass = 0; pass < 3; pass++) f = smooth(f, 6);
  return withDerivative(xs, f);
}

export function fromFunction(fn: (t: number) => number): Drawn {
  const xs = Array.from({ length: N + 1 }, (_, i) => i * DT);
  return withDerivative(xs, xs.map(fn));
}

function withDerivative(xs: number[], f: number[]): Drawn {
  const n = f.length;
  const df = f.map((_, i) => {
    if (i === 0) return (f[1] - f[0]) / DT;
    if (i === n - 1) return (f[n - 1] - f[n - 2]) / DT;
    return (f[i + 1] - f[i - 1]) / (2 * DT);
  });
  return { xs, f, df };
}

function interp(pts: { x: number; y: number }[], x: number): number {
  if (!pts.length) return 0;
  if (x <= pts[0].x) return pts[0].y;
  const last = pts[pts.length - 1];
  if (x >= last.x) return last.y;
  let i = 1;
  while (pts[i].x < x) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const f = (x - a.x) / (b.x - a.x || 1);
  return a.y + f * (b.y - a.y);
}

function smooth(v: number[], w: number): number[] {
  return v.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(v.length - 1, i + w); j++) {
      s += v[j];
      n++;
    }
    return s / n;
  });
}

/** ∫₀^8 g(t)e^{−st}dt by the trapezoid rule on the drawing grid. */
function trap(xs: number[], g: number[], s: number): number {
  let acc = 0;
  for (let i = 1; i < xs.length; i++) {
    acc += 0.5 * DT * (g[i - 1] * Math.exp(-s * xs[i - 1]) + g[i] * Math.exp(-s * xs[i]));
  }
  return acc;
}

/** Both sides of the derivative rule for a drawn signal (flat after 8 s, so f′ = 0 there). */
export function derivativeRule(d: Drawn, s: number): { lhs: number; rhs: number; F: number } {
  const tail = d.f[d.f.length - 1];
  const F = trap(d.xs, d.f, s) + (tail * Math.exp(-s * DRAW_T)) / s;
  const lhs = trap(d.xs, d.df, s);
  return { lhs, rhs: s * F - d.f[0], F };
}

/**
 * How many of the traced s values are at least `gap` apart (sorted, greedy). The probe's
 * "reveal the formula" unlocks on 5 spread-out measurements, not on 5 neighbouring arrow presses.
 */
export function spreadCount(xs: readonly number[], gap = 0.25): number {
  const sorted = [...xs].sort((a, b) => a - b);
  let n = 0;
  let last = -Infinity;
  for (const x of sorted) {
    if (x - last >= gap - 1e-9) {
      n++;
      last = x;
    }
  }
  return n;
}
