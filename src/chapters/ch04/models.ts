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
