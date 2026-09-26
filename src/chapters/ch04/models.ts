/** Slope measured numerically with a tiny symmetric step (what our tangent "ruler" reads). */
export const measuredSlope = (f: (t: number) => number, t: number, h = 1e-5): number => (f(t + h) - f(t - h)) / (2 * h);

export const BASES = [1.5, 2, Math.E, 3] as const;

/** The coffee guess T(t) = room + gap·e^(a·t). */
export const coffeeGuess = (a: number, room = 20, gap = 70) => (t: number): number => room + gap * Math.exp(a * t);

/** How far the guess is from obeying dT/dt = −(T − room)/τ at time t (°C/min). */
export function ruleMismatch(a: number, t: number, tau = 10, room = 20): number {
  const g = coffeeGuess(a, room);
  return measuredSlope(g, t) - -(g(t) - room) / tau;
}

/** One second of growth at rate r (per second) done in n equal steps: (1 + r/n)ⁿ. */
export const compound = (n: number, r = 1): number => (1 + r / n) ** n;

/** The staircase for `compound`: the pile at every step boundary, from 1 at t = 0 to t = 1. */
export function compoundSteps(n: number, r = 1): { t: number[]; y: number[] } {
  const t = [0];
  const y = [1];
  for (let k = 1; k <= n; k++) {
    t.push(k / n);
    y.push(y[k - 1] * (1 + r / n));
  }
  return { t, y };
}

/** Over a step of Δt, bᵗ rises by the same fraction of its height everywhere: b^Δt − 1. */
export const stepRise = (b: number, dt: number): number => b ** dt - 1;

/** That fraction per second, (b^Δt − 1)/Δt. It closes in on ln b as Δt shrinks. */
export const stepRate = (b: number, dt: number): number => stepRise(b, dt) / dt;

/**
 * 2ⁿ written out for n a multiple of ½: "2 × 2 × 2", "2 × √2", "1", "1 ÷ 2 ÷ 2".
 * Language-neutral maths, so it needs no translation.
 */
export function powerChain(n: number): string {
  const k = Math.abs(n);
  const whole = Math.floor(k + 1e-9);
  const parts: string[] = Array.from({ length: whole }, () => '2');
  if (k - whole > 0.25) parts.push('√2');
  if (!parts.length) return '1';
  return n > 0 ? parts.join(' × ') : `1 ÷ ${parts.join(' ÷ ')}`;
}
