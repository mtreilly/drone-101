import { type C } from '../../math/complex';
import { roots } from '../../math/poly';
import { DRONE, HOVER_THRUST } from '../../sim/drone-model';

/**
 * The drone as a state (Δh, v) under PD control with the hover thrust handled:
 * d/dt (Δh, v) = A (Δh, v), A = [[0, 1], [−Kp/m, −(c + Kd)/m]]. Pure maths for the state-plane
 * section of Chapter 11.
 */
export function stateMatrix(kp: number, kd: number, m = DRONE.m, c = DRONE.c): [[number, number], [number, number]] {
  return [
    [0, 1],
    [-kp / m, -(c + kd) / m],
  ];
}

/** det(sI − A) = s² + ((c + Kd)/m) s + Kp/m: its roots are the eigenvalues of A, the poles. */
export const eigenvalues = (kp: number, kd: number, m = DRONE.m, c = DRONE.c): C[] => roots([1, (c + kd) / m, kp / m]);

/** The state's path from (Δh0, v0), by RK4 (a 2 × 2 linear rule, so small steps are exact enough). */
export function statePath(kp: number, kd: number, T: number, dh0 = -1, v0 = 0, dt = 0.002): { t: number[]; dh: number[]; v: number[] } {
  const [[a, b], [c2, d]] = stateMatrix(kp, kd);
  const f = (x: number, y: number): [number, number] => [a * x + b * y, c2 * x + d * y];
  const out = { t: [0], dh: [dh0], v: [v0] };
  let [x, y] = [dh0, v0];
  for (let k = 1; k * dt <= T + 1e-9; k++) {
    const [k1x, k1y] = f(x, y);
    const [k2x, k2y] = f(x + (dt / 2) * k1x, y + (dt / 2) * k1y);
    const [k3x, k3y] = f(x + (dt / 2) * k2x, y + (dt / 2) * k2y);
    const [k4x, k4y] = f(x + dt * k3x, y + dt * k3y);
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    out.t.push(k * dt);
    out.dh.push(x);
    out.v.push(y);
  }
  return out;
}

/** Propeller thrust T = k w², with k set so the drone hovers at w0 (rad/s). */
export const HOVER_SPIN = 700;
export const PROP_K = HOVER_THRUST / HOVER_SPIN ** 2;
/** Extra thrust for Δw more spin: the true curve, and its tangent at the hover. */
export const extraThrust = (dw: number): number => PROP_K * ((HOVER_SPIN + dw) ** 2 - HOVER_SPIN ** 2);
export const tangentThrust = (dw: number): number => 2 * PROP_K * HOVER_SPIN * dw;
