import { type StepMetrics, stepMetrics } from '../../math/metrics';
import { type Pt, regionFromMetric } from '../../math/region';
import { secondOrderSolution } from '../../math/second-order';
import { DRONE, HOVER_THRUST } from '../../sim/drone-model';
import { groundCut } from './fall';

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
 * Response of G(s) = (1 − s/z)·13/(s² + 4s + 13) to a unit step (poles −2 ± 3i, DC gain 1):
 *   y = y0 − (1/z)·y0',  y0 = unit step response,  y0' = (13/3)e^{−2t} sin 3t.
 */
export function zeroResponse(z: number): (t: number) => number {
  const y0 = secondOrderSolution(1, 4, 13, 13, 0, 0);
  return (t) => y0(t) - (1 / z) * (13 / 3) * Math.exp(-2 * t) * Math.sin(3 * t);
}

export const noZeroResponse = secondOrderSolution(1, 4, 13, 13, 0, 0);

/** |G(iω)| of the recipe drone G(s) = Kp/(m s² + c s + Kp): how much a steady wave of speed ω is scaled (Kp = 20 → 1.104 at ω = 2). */
export const recipeGain = (w: number, kp = 20): number => kp / Math.hypot(kp - m * w * w, c * w);

/** Slope of the no-zero response, y0' = (13/3)e^{−2t} sin 3t: the part a zero at z adds (× 1/|z|). */
export const noZeroSlope = (t: number): number => (13 / 3) * Math.exp(-2 * t) * Math.sin(3 * t);

/** The playground's replay: 6 s of step response, sampled 400 times (what the plot, the readouts and the challenge judge). */
export const PLAY_T = 6;
export const PLAY_N = 400;

/** Which half of the map a pair sits in, with a little dead band around the axis. */
export const verdictOf = (re: number): 'stable' | 'unstable' | 'marginal' => (re < -0.02 ? 'stable' : re > 0.02 ? 'unstable' : 'marginal');

const samples = (f: (t: number) => number): { t: number[]; h: number[] } => {
  const t: number[] = [];
  const h: number[] = [];
  for (let i = 0; i <= PLAY_N; i++) {
    const x = (PLAY_T * i) / PLAY_N;
    t.push(x);
    h.push(f(x));
  }
  return { t, h };
};

/** The playground's measured metrics of the step response (1 → 2 m) for poles re ± i·im, on the plotted samples. */
export function measuredMetrics(re: number, im: number): StepMetrics {
  const s = samples(stepFromPoles(re, im));
  return stepMetrics(s.t, s.h, 1, 2);
}

/** The mini-challenge: overshoot under 10 % and settled within 2 s, judged on the real (measured) response. */
export const CHALLENGE = { os: 10, ts: 2 };
export function challengeOk(re: number, im: number): boolean {
  if (verdictOf(re) !== 'stable') return false;
  const mm = measuredMetrics(re, im);
  return mm.overshoot < CHALLENGE.os && mm.settlingTime < CHALLENGE.ts;
}

/**
 * The challenge zone on the playground's map (σ from −10 to 0, ω from −8 to 8), drawn from the very
 * judgement the status uses, so the picture never says "in" while the status says "not yet". The
 * judgement is the same for a pole and its mirror twin, so it is worked out once per |ω|.
 */
export function challengeZone(step = 0.1): Pt[][] {
  const memo = new Map<string, boolean>();
  const inside = (x: number, y: number) => {
    const key = `${x.toFixed(6)},${Math.abs(y).toFixed(6)}`;
    let v = memo.get(key);
    if (v === undefined) memo.set(key, (v = challengeOk(x, Math.abs(y))));
    return v;
  };
  return regionFromMetric(inside, { x: [-10, 0], y: [-8, 8], step });
}

/** First push of a step of `dr` metres: at t = 0⁺ the error is the whole step and nothing moves yet, so thrust = mg + Kp·Δr = mg + m|p|²·Δr. */
export const firstPush = (re: number, im: number, dr = 1): number => HOVER_THRUST + gainsFromPoles(re, im).kp * dr;

/** Radius of the 20 N "thrust budget" circle for a step of `dr` metres: |p| ≤ √((20 − mg)/(m·Δr)). */
export const budgetRadius = (dr = 1, tMax = 20): number => Math.sqrt((tMax - HOVER_THRUST) / (m * dr));

export interface PlaygroundTrace {
  f: (t: number) => number;
  /** plotted samples: the formula up to the first touchdown, then 0 (see `groundCut`) */
  xs: number[];
  ys: number[];
  /** touchdown time, s, or null if it never comes down */
  at: number | null;
  crashed: boolean;
}

/** The playground's replay for poles re ± i·im, with the ground as a real event. */
export function playgroundTrace(re: number, im: number): PlaygroundTrace {
  const f = stepFromPoles(re, im);
  const cut = groundCut(samples(f), f);
  return { f, xs: cut.t, ys: cut.h, at: cut.at, crashed: cut.crashed };
}

/** What the drone picture shows at time t of a replay: the formula, or down on the ground from the touchdown on. */
export function stateAt(tr: PlaygroundTrace, t: number, re: number, im: number): { h: number; v: number; thrust: number; crashed: boolean } {
  if (tr.at !== null && t >= tr.at) return { h: 0, v: 0, thrust: 0, crashed: tr.crashed };
  const h = tr.f(t);
  const v = (tr.f(t + 1e-4) - tr.f(Math.max(0, t - 1e-4))) / (t > 0 ? 2e-4 : 1e-4);
  const { kp, kd } = gainsFromPoles(re, im);
  return { h, v, thrust: HOVER_THRUST + kp * (2 - h) - kd * v, crashed: false };
}
