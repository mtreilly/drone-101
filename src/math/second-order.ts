/**
 * Exact solution of m·x'' + c·x' + k·x = F (constant F, k > 0) with x(0) = x0, x'(0) = v0.
 * Handles under-, critically- and over-damped cases. Used to check the simulations
 * and to draw "the formula" next to "the sim" in Chapter 7.
 */
export function secondOrderSolution(
  m: number,
  c: number,
  k: number,
  F: number,
  x0: number,
  v0: number,
): (t: number) => number {
  const xp = F / k;
  const A = x0 - xp;
  const sigma = c / (2 * m);
  const disc = sigma * sigma - k / m;
  const tol = 1e-12 * Math.max(1, k / m);
  if (disc < -tol) {
    const wd = Math.sqrt(-disc);
    const B = (v0 + sigma * A) / wd;
    return (t) => xp + Math.exp(-sigma * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  }
  if (disc > tol) {
    const sq = Math.sqrt(disc);
    const r1 = -sigma + sq;
    const r2 = -sigma - sq;
    const C1 = (v0 - r2 * A) / (r1 - r2);
    const C2 = A - C1;
    return (t) => xp + C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
  }
  const B = v0 + sigma * A;
  return (t) => xp + (A + B * t) * Math.exp(-sigma * t);
}

/** Unit step response of ωn²/(s² + 2ζωn·s + ωn²) from rest. */
export const stepResponse = (wn: number, zeta: number): ((t: number) => number) =>
  secondOrderSolution(1, 2 * zeta * wn, wn * wn, wn * wn, 0, 0);

/** Percent overshoot of an underdamped standard second-order step response. */
export const overshootFormula = (zeta: number): number =>
  zeta >= 1 ? 0 : 100 * Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));

/** Drone under P control: natural frequency and damping ratio. */
export function droneP(m: number, c: number, kp: number): { wn: number; zeta: number } {
  const wn = Math.sqrt(kp / m);
  return { wn, zeta: c / (2 * Math.sqrt(m * kp)) };
}
