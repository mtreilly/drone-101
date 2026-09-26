import type { C } from '../../math/complex';
import { stepMetrics } from '../../math/metrics';
import { hoverStep, pid, runDrone, takeoff, type Trace } from './pid-tools';
import { sd } from './status';

/**
 * The flights behind Chapter 9's widgets, shared by the widgets and the tests so that every
 * number a widget shows is the number a test pins.
 */

/** integral widget: take-off with Kp = 20 and no D, 12 s */
export const integralRun = (ki: number): Trace => runDrone(takeoff(pid(20, ki, 0)), 12);

/** damper widget: take-off with Kp = 20, 10 s */
export const damperRun = (ki: number, kd: number): Trace => runDrone(takeoff(pid(20, ki, kd)), 10);

/** kick widget: the setpoint jumps from 1 m to 1.5 m at this time (s) */
export const KICK_AT = 1;
export const KICK_FROM = 1;
export const KICK_TO = 1.5;

/** kick widget: hover at 1 m, jump to 1.5 m at t = 1 s, PID 15/8/4 with a 10 ms derivative filter */
export const kickRun = (mode: 'error' | 'measurement'): Trace =>
  hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: mode === 'measurement' }), KICK_FROM, KICK_TO, 5);

/** noise widget: sensor noise σ (m) per 1 ms reading */
export const NOISE_SD = 0.02;

/** noise widget: hover at 2 m with Kp = 15, Ki = 8 and a filtered D on the measurement */
export const noiseRun = (kd: number, tau: number, on = true): Trace => hoverStep(pid(15, 8, kd, { dTau: tau }), 2, 2, 5, on ? NOISE_SD : 0);

/** thrust jitter (standard deviation, N) after the first half second */
export const jitterOf = (tr: Trace): number => sd(tr.thrust.slice(50));

/** mean height (m) over the last 2 s: clipping at 0 N can lift the average */
export const meanHeight = (tr: Trace): number => {
  const hs = tr.h.slice(300);
  return hs.reduce((a, b) => a + b, 0) / hs.length;
};

/** poles widget: step from hover at 1.5 m to 2 m at t = 1 s, real 20 N motors */
export const polesStep = (kp: number, ki: number, kd: number, T = 8): Trace => hoverStep(pid(kp, ki, kd), 1.5, 2, T);

/** Overshoot (%) and 2 % settling time (s, from the step at t = 1) of a poles-widget step. */
export function stepOf(tr: Trace): { overshoot: number; settling: number } {
  const t: number[] = [];
  const h: number[] = [];
  for (let i = 0; i < tr.t.length; i++) {
    if (tr.t[i] < 1) continue;
    t.push(tr.t[i] - 1);
    h.push(tr.h[i]);
  }
  const m = stepMetrics(t, h, 1.5, 2);
  return { overshoot: m.overshoot, settling: m.settlingTime };
}

/** The zero the I term brings to the setpoint response: −Ki/Kp (none without I). D on the measurement adds no zero. */
export const piZero = (kp: number, ki: number): number | null => (ki > 0 && kp > 0 ? -ki / kp : null);

/** The pole closest to the vertical axis (the "slowest" by Chapter 8's 4/|σ| rule). */
export const slowestPole = (ps: C[]): C => ps.reduce((a, b) => (b.re > a.re ? b : a));

/** A real pole this close to the zero barely shows in the step (they nearly cancel). */
export const nearlyCancels = (p: C, zero: number | null, tol = 0.2): boolean => zero !== null && Math.abs(p.im) < 1e-9 && Math.abs(p.re - zero) < tol;

/**
 * Top of the playground's height plot: 3 m, or enough for a flight that goes higher (a windup
 * flight, or a bump into the page): the next half metre above its peak + 20 cm.
 */
export const heightTop = (h: number[]): number => {
  const peak = Math.max(...h);
  return peak > 2.9 ? Math.max(3, Math.ceil((peak + 0.2) * 2) / 2) : 3;
};
