import { type StepMetrics, stepMetrics } from '../../math/metrics';
import { DRONE, DroneSim, HOVER_THRUST, defaultDroneConfig, type PID } from '../../sim/drone-model';
import { gainsFromPoles } from './poles';

/** PD with hover feedforward, derivative on the measured speed (so the recipe has no zero). */
export const pd = (kp: number, kd: number): PID => ({ kp, ki: 0, kd, ff: HOVER_THRUST, dTau: 0, dOnMeasurement: true, antiWindup: false });

/** The limit widget's window and its slider (poles −σ ± σi on the 45° line). */
export const LIMIT_T = 3;
export const SIGMAS = Array.from({ length: 15 }, (_, i) => 1 + i * 0.5);

export interface LimitRun {
  xs: number[];
  hs: number[];
  th: number[];
  m: StepMetrics;
}

/** A 1 m step (1 → 2 m) of the drone with poles −σ ± σi, with or without the 0–20 N motor limit. */
export function limitRun(sig: number, sat: boolean, T = LIMIT_T, every = 10): LimitRun {
  const { kp, kd } = gainsFromPoles(-sig, sig);
  const sim = new DroneSim(defaultDroneConfig({ params: { ...DRONE, saturate: sat }, pid: pd(kp, kd), h0: 1 }));
  const xs = [0];
  const hs = [sim.h];
  const th = [sim.thrust];
  sim.advance(T, () => {
    xs.push(sim.t);
    hs.push(sim.h);
    th.push(sim.thrust);
  }, every);
  return { xs, hs, th, m: stepMetrics(xs, hs, 1, 2) };
}

let best: { sig: number; ts: number } | null = null;

/** The best real (motor-limited) settling time anywhere on the slider, and where: "further left" stops paying there. */
export function bestRealSettling(): { sig: number; ts: number } {
  if (best) return best;
  let b = { sig: NaN, ts: Infinity };
  for (const s of SIGMAS) {
    const ts = limitRun(s, true).m.settlingTime;
    if (ts < b.ts) b = { sig: s, ts };
  }
  best = b;
  return b;
}
