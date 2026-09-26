import type { TF } from '../../math/bode';
import { roots } from '../../math/poly';
import type { C } from '../../math/complex';
import { stepMetrics } from '../../math/metrics';
import { DRONE, DroneSim, defaultDroneConfig, type DroneConfig, type PID } from '../../sim/drone-model';

/** Drone with realistic motor limits (0–20 N), used from Chapter 9 on. */
export const LIMITED = { ...DRONE, saturate: true };

export const pid = (kp: number, ki: number, kd: number, over: Partial<PID> = {}): PID => ({
  kp,
  ki,
  kd,
  ff: 0,
  dTau: 0,
  dOnMeasurement: true,
  antiWindup: true,
  ...over,
});

export interface Trace {
  t: number[];
  h: number[];
  /** thrust the propellers deliver (after the clip and the motor lag), N */
  thrust: number[];
  /**
   * what the motors are told: the controller's request clipped to the motor limits (0–20 N with
   * `LIMITED`), before the motor lag. Chapter 11's "asked for" line; equals `request` without limits.
   */
  command: number[];
  /** what the controller asked for, unclipped (can be 400 N or negative), N. Chapter 9's "D asks for". */
  request: number[];
  integral: number[];
  r: number[];
  wind: number[];
  pkg: number[];
  measured: number[];
  crashed: boolean;
  /** when it crashed, s, if the runner records it (the view shows the crash from then on) */
  crashAt?: number | null;
}

/** A trace with nothing in it yet (fill it with `sampleTrace`). */
export const emptyTrace = (): Trace => ({ t: [], h: [], thrust: [], command: [], request: [], integral: [], r: [], wind: [], pkg: [], measured: [], crashed: false });

/** Appends the sim's current state to `tr` (every trace in the course is sampled the same way). */
export function sampleTrace(sim: DroneSim, tr: Trace): void {
  const { cfg } = sim;
  tr.t.push(sim.t);
  tr.h.push(sim.h);
  tr.thrust.push(sim.thrust);
  tr.command.push(sim.command);
  tr.request.push(sim.request);
  tr.integral.push(sim.integral);
  tr.r.push(cfg.setpoint(sim.t));
  tr.wind.push(cfg.wind(sim.t));
  tr.pkg.push(cfg.extraMass(sim.t));
  tr.measured.push(sim.measured);
}

/** Runs a drone configuration for `T` seconds and samples every `every` ms. */
export function runDrone(cfg: DroneConfig, T: number, every = 10): Trace {
  const sim = new DroneSim(cfg);
  const tr = emptyTrace();
  const sample = () => sampleTrace(sim, tr);
  sample();
  sim.advance(T, sample, every);
  tr.crashed = sim.crashed;
  return tr;
}

/** Take-off from the ground to 2 m with a PID and motor limits. */
export const takeoff = (p: PID, over: Partial<DroneConfig> = {}): DroneConfig =>
  defaultDroneConfig({ params: LIMITED, pid: p, ...over });

/** The drone as a transfer function from thrust change to height change: 1/(m s² + c s). */
export const dronePlant = (m = DRONE.m, c = DRONE.c): TF => ({ num: [1], den: [m, c, 0] });

/**
 * Closed-loop characteristic polynomial of the drone (1/(m s² + c s)) with an ideal PID:
 * m s³ + (c + Kd) s² + Kp s + Ki.
 */
export const pidCharPoly = (kp: number, ki: number, kd: number, m = DRONE.m, c = DRONE.c): number[] => [m, c + kd, kp, ki];

export const pidPoles = (kp: number, ki: number, kd: number, m = DRONE.m, c = DRONE.c): C[] => {
  const p = pidCharPoly(kp, ki, kd, m, c);
  // With no I term, the controller has no integrator: cancel the common s factor.
  return roots(ki === 0 ? p.slice(0, 3) : p);
};

/** Routh–Hurwitz for the cubic: stable iff all coefficients > 0 and (c+Kd)·Kp > m·Ki. */
export const kiLimit = (kp: number, kd: number, m = DRONE.m, c = DRONE.c): number => ((c + kd) * kp) / m;

export interface Score {
  overshoot: number;
  settling: number;
  sse: number;
  peakThrust: number;
  /** seconds spent pinned at a motor limit */
  saturated: number;
}

export function scoreTrace(tr: Trace, r = 2, y0 = 0, band = 0.02): Score {
  const m = stepMetrics(tr.t, tr.h, y0, r, band);
  let sat = 0;
  const dt = tr.t[1] - tr.t[0];
  for (const T of tr.thrust) if (T >= LIMITED.tMax - 1e-9 || T <= LIMITED.tMin + 1e-9) sat += dt;
  return {
    overshoot: m.overshoot,
    settling: m.settlingTime,
    sse: Math.abs(m.steadyStateError),
    peakThrust: Math.max(...tr.thrust),
    saturated: sat,
  };
}

/** Playground targets (Chapter 9d). */
export const TARGETS = { overshoot: 5, settling: 1.5, sse: 0.01, saturated: 0.2 };

export function stars(s: Score): { overshoot: boolean; settling: boolean; sse: boolean; saturated: boolean } {
  return {
    overshoot: s.overshoot < TARGETS.overshoot,
    settling: Number.isFinite(s.settling) && s.settling < TARGETS.settling,
    sse: s.sse < TARGETS.sse,
    saturated: s.saturated < TARGETS.saturated,
  };
}

const MG = DRONE.m * DRONE.g;

/** Runs a step of the setpoint from `r0` to `r1` at t = 1 s, starting in hover equilibrium. */
export function hoverStep(p: PID, r0: number, r1: number, T: number, noiseStd = 0, seed = 3): Trace {
  const cfg = defaultDroneConfig({ params: LIMITED, pid: p, setpoint: (t) => (t < 1 ? r0 : r1), h0: r0, noiseStd, seed });
  const sim = new DroneSim(cfg);
  if (p.ki > 0) {
    // start in equilibrium: the integral already holds the hover thrust
    sim.x[2] = MG / p.ki;
  } else {
    sim.x[0] = r0 - MG / Math.max(p.kp, 1e-9);
  }
  // derivative filter starts settled on its input (the error, or the measurement)
  sim.x[3] = p.dOnMeasurement ? sim.x[0] : r0 - sim.x[0];
  sim.x[4] = MG;
  sim.sync();
  const tr = emptyTrace();
  const sample = () => sampleTrace(sim, tr);
  sample();
  sim.advance(T, sample, 10);
  return tr;
}
