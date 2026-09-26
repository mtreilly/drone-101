import { criticalGain } from '../../math/bode';
import { SHOWER, ShowerSim, type ShowerParams, type ShowerPolicy } from '../../sim/shower-model';

/** °C at the head per unit of knob, in steady state */
export const KNOB_GAIN = SHOWER.hot - SHOWER.cold;

export const withDelay = (delay: number): ShowerParams => ({ ...SHOWER, delay });

/**
 * The Chapter 0 "hand" turns the knob at a speed proportional to the error:
 * du/dt = k·e — an integral controller. Open loop: L(s) = 45k·e^(−Ls) / (s(τs + 1)).
 */
export const handLoop = (k: number): { num: number[]; den: number[] } => ({ num: [KNOB_GAIN * k], den: [SHOWER.tau, 1, 0] });

/** PI controller C(s) = kp + ki/s around the shower: L(s) = 45(kp·s + ki)·e^(−Ls) / (s(τs + 1)). */
export const piLoop = (kp: number, ki: number): { num: number[]; den: number[] } => ({ num: [KNOB_GAIN * kp, KNOB_GAIN * ki], den: [SHOWER.tau, 1, 0] });

/**
 * The edge for a hand on the shower (pipe `delay`, smoother `tau`): at the wiggle speed `w` where
 * pipe, smoother (and, for the speed hand, its pile's 90°) lag 180° in all, the hand strength `k`
 * that returns that wiggle at full size, and the hunting period `period` = 2π/w.
 * - `'speed'` (Chapter 0's hand, du/dt = k·e): k in knob per (°C·s); 2.5 s pipe → k 0.0112, 0.457 rad/s, 13.8 s.
 * - `'position'` (u = K·e): K in knob per °C; 2.5 s pipe → K 0.0307, 0.952 rad/s, 6.6 s.
 */
export function criticalHandGain(delay = SHOWER.delay, tau = SHOWER.tau, hand: 'speed' | 'position' = 'speed'): { k: number; w: number; period: number } {
  const { gain, w, period } = criticalGain(hand === 'speed' ? 1 : 0, delay, tau);
  return { k: gain / KNOB_GAIN, w, period };
}

/** What a pure delay's lag of `deg` degrees does to a wiggle (the `phase` widget's status keys). */
export type LagStatus = 'small' | 'middle' | 'flipped' | 'full' | 'over';

/**
 * Near a whole number of wiggles (within 45°): `small` below 300°, `full` above (a whole wiggle late,
 * looks in step again). Within 5° of half a wiggle (180°, 540°…): `flipped`. Otherwise `over` past
 * 360° and `middle` below.
 */
export function lagStatus(deg: number): LagStatus {
  const wrapped = ((deg % 360) + 360) % 360;
  if (wrapped < 45 || wrapped > 315) return deg > 300 ? 'full' : 'small';
  if (Math.abs(wrapped - 180) < 5) return 'flipped';
  return deg > 360 ? 'over' : 'middle';
}

export const handPolicy = (k: number): ShowerPolicy => ({ kind: 'rate', rate: (_t, felt) => k * (SHOWER.target - felt) });

/**
 * PI in velocity form: knob speed is ki·e + kp·(de/dt). Apply the initial P
 * command on the first step so the position matches u_initial + kp·e + ki∫e.
 * The knob itself is clamped; there is no separate integral state to wind up.
 */
export function piPolicy(kp: number, ki: number, dt = 0.005): ShowerPolicy {
  let prev = Number.NaN;
  return {
    kind: 'rate',
    rate: (_t, felt) => {
      if (Number.isNaN(prev)) {
        prev = felt;
        return (kp * (SHOWER.target - felt)) / dt + ki * (SHOWER.target - felt);
      }
      const dT = (felt - prev) / dt;
      prev = felt;
      return -kp * dT + ki * (SHOWER.target - felt);
    },
  };
}

export interface ShowerTrace {
  t: number[];
  T: number[];
  u: number[];
}

export function runShower(policy: ShowerPolicy, T: number, delay = SHOWER.delay, every = 20): ShowerTrace {
  const sim = new ShowerSim(withDelay(delay), policy, 0);
  const tr: ShowerTrace = { t: [0], T: [sim.temp], u: [sim.u] };
  sim.advance(T, () => {
    tr.t.push(sim.t);
    tr.T.push(sim.temp);
    tr.u.push(sim.u);
  }, every);
  return tr;
}

/** Start of the first 10-second stay inside 38 ± 1 °C (NaN if it never happens). */
export function comfortTime(tr: ShowerTrace, hold = 10): number {
  let start = Number.NaN;
  for (let i = 0; i < tr.t.length; i++) {
    const inBand = Math.abs(tr.T[i] - SHOWER.target) <= SHOWER.band;
    if (inBand && Number.isNaN(start)) start = tr.t[i];
    if (!inBand) start = Number.NaN;
    if (!Number.isNaN(start) && tr.t[i] - start >= hold) return start;
  }
  return Number.NaN;
}

/** Average swing period from crossings of 38 °C (NaN if fewer than 3 crossings). */
export function swingPeriod(tr: ShowerTrace): number {
  const cross: number[] = [];
  let prev = 0;
  for (let i = 0; i < tr.t.length; i++) {
    const s = Math.sign(tr.T[i] - SHOWER.target);
    if (s !== 0 && prev !== 0 && s !== prev) cross.push(tr.t[i]);
    if (s !== 0) prev = s;
  }
  if (cross.length < 3) return Number.NaN;
  const halves = cross.slice(1).map((c, i) => c - cross[i]);
  return (2 * halves.reduce((a, b) => a + b, 0)) / halves.length;
}

export interface SineMeasurement {
  w: number;
  /** output swing ÷ input swing (both in °C) */
  gain: number;
  /** output phase relative to input, degrees in (−360, 0] */
  phase: number;
  trace: ShowerTrace;
  /** mixed-water (input) temperature */
  mix: number[];
}

/**
 * Wiggles the knob sinusoidally (±0.15 around half-open), waits for the start-up to die out,
 * then fits a sine at the same frequency to the output (least squares over whole cycles).
 */
export function measureSine(w: number, delay = SHOWER.delay): SineMeasurement {
  const u0 = 0.5;
  const a = 0.15;
  const period = (2 * Math.PI) / w;
  const settle = Math.max(15, 2 * period);
  const cycles = Math.max(2, Math.ceil(10 / period));
  const T = settle + cycles * period;
  const tr = runShower({ kind: 'position', position: (t) => u0 + a * Math.sin(w * t) }, T, delay, 4);
  let sc = 0;
  let cc = 0;
  let n = 0;
  const mean = SHOWER.cold + KNOB_GAIN * u0;
  for (let i = 0; i < tr.t.length; i++) {
    if (tr.t[i] < settle) continue;
    const y = tr.T[i] - mean;
    sc += y * Math.sin(w * tr.t[i]);
    cc += y * Math.cos(w * tr.t[i]);
    n++;
  }
  const B = (2 * sc) / n; // sin component
  const A = (2 * cc) / n; // cos component
  const amp = Math.hypot(A, B);
  let phase = (Math.atan2(A, B) * 180) / Math.PI;
  while (phase > 0) phase -= 360;
  return { w, gain: amp / (a * KNOB_GAIN), phase, trace: tr, mix: tr.u.map((u) => SHOWER.cold + KNOB_GAIN * u) };
}

/** Unwraps a measured phase to the branch closest to a reference (e.g. the previous dot). */
export function unwrapNear(phase: number, ref: number): number {
  let p = phase;
  while (p - ref > 180) p -= 360;
  while (p - ref < -180) p += 360;
  return p;
}
