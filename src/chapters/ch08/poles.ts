import { secondOrderSolution } from '../../math/second-order';
import { DRONE } from '../../sim/drone-model';

const { m, c } = DRONE;

/**
 * Closed loop of the drone with hover feedforward + PD:  m h'' + (c + Kd) h' + Kp h = Kp r.
 * Poles at re ± i·im  ⇔  m(s − p)(s − p̄) = m s² − 2m·re·s + m(re² + im²), so
 *   Kp = m(re² + im²),   c + Kd = −2m·re.
 */
export function gainsFromPoles(re: number, im: number): { kp: number; kd: number; damping: number } {
  const kp = m * (re * re + im * im);
  const damping = -2 * m * re;
  return { kp, kd: damping - c, damping };
}

export const zetaOf = (re: number, im: number): number => {
  const r = Math.hypot(re, im);
  return r === 0 ? 1 : -re / r;
};

/** Standard overshoot estimate from the pole angle (valid for a pole pair without zeros). */
export const overshootOf = (re: number, im: number): number => {
  const z = zetaOf(re, im);
  if (z >= 1) return 0;
  if (z <= 0) return Infinity;
  return 100 * Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z));
};

/** Rule-of-thumb 2% settling time ≈ 4/σ (σ = distance of the poles left of the axis). */
export const settleOf = (re: number): number => (re < 0 ? 4 / -re : Infinity);

/** Height after a step from h0 to r, with poles at re ± i·im (exact linear response). */
export function stepFromPoles(re: number, im: number, h0 = 1, r = 2): (t: number) => number {
  const { kp, damping } = gainsFromPoles(re, im);
  return secondOrderSolution(m, damping, Math.max(kp, 1e-6), Math.max(kp, 1e-6) * r, h0, 0);
}

/**
 * Response of T(s) = (1 − s/z)·13/(s² + 4s + 13) to a unit step (poles −2 ± 3i, DC gain 1):
 *   y = y0 − (1/z)·y0',  y0 = unit step response,  y0' = (13/3)e^{−2t} sin 3t.
 */
export function zeroResponse(z: number): (t: number) => number {
  const y0 = secondOrderSolution(1, 4, 13, 13, 0, 0);
  return (t) => y0(t) - (1 / z) * (13 / 3) * Math.exp(-2 * t) * Math.sin(3 * t);
}

export const noZeroResponse = secondOrderSolution(1, 4, 13, 13, 0, 0);
