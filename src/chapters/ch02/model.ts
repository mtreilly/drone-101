import { stepMetrics } from '../../math/metrics';
import { droneP, overshootFormula } from '../../math/second-order';
import { DRONE, DroneSim, HOVER_THRUST, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';

export const TARGET = 2;
export const RUN = 10;

/** Proportional gain at which 2·Kp just equals the weight: below it the drone never leaves the ground. */
export const LIFTOFF_KP = HOVER_THRUST / TARGET;

export interface PRun {
  kp: number;
  t: number[];
  h: number[];
  T: number[];
  tookOff: boolean;
  final: number;
  peak: number;
  /** % above the final hover height */
  overshoot: number;
  droop: number;
}

/** Simulates the P-controlled drone taking off to 2 m (no hover thrust), sampled every 10 ms. */
export function runP(kp: number, seconds = RUN): PRun {
  const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp) }));
  const t = [0];
  const h = [0];
  const T = [sim.thrust];
  let tookOff = false;
  sim.advance(seconds, () => {
    t.push(sim.t);
    h.push(sim.h);
    T.push(sim.thrust);
    if (sim.h > 1e-4) tookOff = true;
  });
  if (!tookOff) return { kp, t, h, T, tookOff, final: 0, peak: 0, overshoot: NaN, droop: TARGET };
  const final = TARGET - HOVER_THRUST / kp;
  const m = stepMetrics(t, h, 0, final);
  const peak = Math.max(...h);
  return { kp, t, h, T, tookOff, final, peak, overshoot: m.overshoot, droop: TARGET - final };
}

/** Steady-state droop mg/Kp (the drone sits on the ground if that exceeds 2 m). */
export const droopOf = (kp: number): number => (kp <= LIFTOFF_KP ? TARGET : HOVER_THRUST / kp);

/** Percent overshoot above the final hover height, from the damping ratio ζ = c / (2√(m·Kp)). */
export const overshootOf = (kp: number): number => (kp <= LIFTOFF_KP ? NaN : overshootFormula(droneP(DRONE.m, DRONE.c, kp).zeta));

/** Kp needed for droop below `d` metres, and the largest Kp keeping overshoot below `os` percent. */
export function challengeBounds(d = 0.2, os = 30): { droopNeedsAbove: number; overshootNeedsBelow: number } {
  const droopNeedsAbove = HOVER_THRUST / d;
  // overshoot = os  ⇔  ζ = −ln(os/100)/√(π² + ln²(os/100));  Kp = c²/(4 m ζ²)
  const L = Math.log(os / 100);
  const zeta = -L / Math.sqrt(Math.PI ** 2 + L * L);
  const overshootNeedsBelow = (DRONE.c * DRONE.c) / (4 * DRONE.m * zeta * zeta);
  return { droopNeedsAbove, overshootNeedsBelow };
}
