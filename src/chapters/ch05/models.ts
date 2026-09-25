import { type C, add, c, expC, mul } from '../../math/complex';

/** e^(s·t) for complex s = σ + iω: a point that spins at ω rad/s while its size changes as e^(σt). */
export const spiralPoint = (sigma: number, omega: number, t: number): C => expC(c(sigma * t, omega * t));

/** The shadow on the real axis: e^(σt)·cos(ωt). */
export const shadow = (sigma: number, omega: number, t: number): number => Math.exp(sigma * t) * Math.cos(omega * t);

/** A spinner plus its mirror-image twin: e^(iωt) + e^(−iωt) = 2cos(ωt) (purely real). */
export const twinSum = (omega: number, t: number): C => add(expC(c(0, omega * t)), expC(c(0, -omega * t)));

/** Multiplying by i is a quarter turn. */
export const I = c(0, 1);
export const rotateBy = (z: C, k: C): C => mul(z, k);

/**
 * Partial sum of the square wave built from spinning pieces (only odd harmonics):
 *   (4/π)·Σ sin((2k−1)t)/(2k−1),  k = 1..n
 */
export function squareWavePartial(t: number, n: number): number {
  let s = 0;
  for (let k = 1; k <= n; k++) {
    const m = 2 * k - 1;
    s += Math.sin(m * t) / m;
  }
  return (4 / Math.PI) * s;
}

export const squareWave = (t: number): number => {
  const r = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return r < Math.PI ? 1 : -1;
};

/** How long to draw a spiral before it grows beyond `limit` (for plots). */
export const spiralDuration = (sigma: number, max = 8, limit = 3): number => (sigma > 0 ? Math.min(max, Math.log(limit) / sigma) : max);
