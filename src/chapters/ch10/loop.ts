import { type C, abs, add, arg, c, div } from '../../math/complex';
import { DRONE } from '../../sim/drone-model';

/**
 * One lap round the P-controlled drone's loop, for a steady wiggle s = iω:
 * C(iω)·P(iω) = Kp / (m(iω)² + c·iω). Pure maths for the "Closing the loop" section.
 */
export function lap(kp: number, w: number, m = DRONE.m, cd = DRONE.c): C {
  return div(c(kp), c(-m * w * w, cd * w));
}

/** Angle of a lap in degrees (−90° for slow wiggles, towards −180° for fast ones). */
export const lapAngle = (kp: number, w: number): number => (arg(lap(kp, w)) * 180) / Math.PI;

/** How far a lap lands from −1: |1 + C·P|. At zero the loop would feed itself for ever. */
export const toCliff = (kp: number, w: number): number => abs(add(c(1), lap(kp, w)));

/** Wiggle speeds on the slider, rad/s. */
export const LOOP_W = { min: 0.5, max: 30 };

/** The closest the lap gets to −1 over every wiggle speed, and the speed where it does. */
export function closest(kp: number): { d: number; w: number } {
  let best = { d: Infinity, w: 0 };
  for (let w = 0.05; w < 400; w *= 1.001) {
    const d = toCliff(kp, w);
    if (d < best.d) best = { d, w };
  }
  return best;
}

/** The closed loop's damping ratio under P control, ζ = c / (2√(m·Kp)) (Chapter 7). */
export const loopZeta = (kp: number, m = DRONE.m, cd = DRONE.c): number => cd / (2 * Math.sqrt(m * kp));

/** Points of the lap's curve for every wiggle speed, trimmed to a square `extent` either side of `center`. */
export function lapCurve(kp: number, extent: number, center: [number, number] = [0, 0]): [number, number][] {
  const pts: [number, number][] = [];
  for (let w = 0.05; w < 400; w *= 1.02) {
    const z = lap(kp, w);
    if (Math.abs(z.re - center[0]) < extent * 1.4 && Math.abs(z.im - center[1]) < extent * 1.4) pts.push([z.re, z.im]);
  }
  return pts;
}
