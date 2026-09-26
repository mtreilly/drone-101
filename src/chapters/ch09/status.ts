import { DRONE } from '../../sim/drone-model';
import { kiLimit, type Trace } from './pid-tools';

/**
 * Which status line each Chapter 9 widget shows. Pure, so the tests can check that no line gives
 * advice the simulation disproves (the review found three that did).
 */

/** largest |h − 2| after `from` seconds: how much it is still swinging */
export const lateSwing = (tr: Pick<Trace, 't' | 'h'>, from = 8, r = 2): number => {
  let mx = 0;
  for (let i = 0; i < tr.t.length; i++) if (tr.t[i] > from) mx = Math.max(mx, Math.abs(tr.h[i] - r));
  return mx;
};

export type IntegralStatus = 'none' | 'slow' | 'ringing' | 'gone' | 'unstable';

/** The integral widget (Kp = 20, no D): stable-but-ringing drones are not "slow". */
export function integralStatus(ki: number, tr: Pick<Trace, 't' | 'h'>, kp = 20): IntegralStatus {
  const lim = kiLimit(kp, 0);
  if (ki === 0) return 'none';
  if (ki >= lim) return 'unstable';
  if (ki > 0.5 * lim && lateSwing(tr) > 0.01) return 'ringing';
  return Math.abs(2 - tr.h[tr.h.length - 1]) < 0.01 ? 'gone' : 'slow';
}

/** Damping that makes the P-and-D pair exactly critical: 2√(m Kp) − c (5.32 N·s/m at Kp = 20). */
export const kdCritical = (kp: number, m = DRONE.m, c = DRONE.c): number => 2 * Math.sqrt(m * kp) - c;

/** Chapter 6's damping ratio with D added to the drag: (c + Kd)/(2√(m Kp)). */
export const zetaPD = (kp: number, kd: number, m = DRONE.m, c = DRONE.c): number => (c + kd) / (2 * Math.sqrt(m * kp));

/** Chapter 6's regime of a damping ratio (same rule as ch06/helpers, without pulling in its styles). */
export const regime = (zeta: number): 'under' | 'critical' | 'over' => (Math.abs(zeta - 1) < 0.005 ? 'critical' : zeta < 1 ? 'under' : 'over');

export type DamperStatus = 'unstable' | 'bigPile' | 'tooMuch' | 'calm' | 'bouncy';

/**
 * The damper widget. `os` is the overshoot (%) at `kd`, `osLess` at `kd − 0.5` (one notch less):
 * past critical damping, more D makes the slow pile overshoot *more*, so "add more Kd" would be wrong.
 */
export function damperStatus(ki: number, kd: number, os: number, osLess: number, kp = 20): DamperStatus {
  if (ki >= kiLimit(kp, kd)) return 'unstable';
  // Mika's pile is too big for any D: it never gets below about 24 %
  if (ki >= 50) return 'bigPile';
  if (kd > kdCritical(kp) && os > osLess) return 'tooMuch';
  return os < 5 ? 'calm' : 'bouncy';
}

/** standard deviation */
export const sd = (xs: number[]): number => {
  const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / xs.length);
};

/** thrust jitter (N) above which we call the motors "chattering" */
export const NOISY = 1.5;

export type NoiseStatus = 'off' | 'chatter' | 'calm' | 'noD';

export function noiseStatus(on: boolean, kd: number, jitter: number): NoiseStatus {
  if (!on) return 'off';
  if (jitter >= NOISY) return 'chatter';
  return kd === 0 ? 'noD' : 'calm';
}
