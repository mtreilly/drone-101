/** Small deterministic PRNG so every run with the same seed is identical. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `n` consecutive noise seeds starting at `first` (1, 2, … 30 by default). Any claim about a noisy run
 * is checked on many seeds, never on the one the widget happens to use.
 */
export const seeds = (n = 30, first = 1): number[] => Array.from({ length: n }, (_, i) => first + i);

/** Standard normal sample via Box–Muller. */
export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
