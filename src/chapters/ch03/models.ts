import { DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';

/** Coffee cooling: dT/dt = −(T − room)/τ (Newton's law of cooling, simplified). */
export const COFFEE = { start: 90, room: 20, tau: 10 };

export const coffeeExact = (t: number, tau = COFFEE.tau, start = COFFEE.start, room = COFFEE.room): number =>
  room + (start - room) * Math.exp(-t / tau);

/**
 * One hand-built step: move forward Δt at the current slope.
 * The gap to room temperature gets multiplied by (1 − Δt/τ) every step, so
 * Δt > τ flips the sign (overshoots below the room) and Δt > 2τ makes it grow.
 */
export function coffeeStep(T: number, dt: number, tau = COFFEE.tau, room = COFFEE.room): number {
  const slope = -(T - room) / tau;
  return T + slope * dt;
}

export function coffeeSteps(n: number, dt: number, tau = COFFEE.tau): number[] {
  const out = [COFFEE.start];
  for (let i = 0; i < n; i++) out.push(coffeeStep(out[out.length - 1], dt, tau));
  return out;
}

/** Tank filling towards full: dh/dt = (full − h)/τ. */
export const tankExact = (t: number, tau: number, full = 1.2): number => full * (1 - Math.exp(-t / tau));

export interface DroneRun {
  t: number[];
  h: number[];
  v: number[];
}

/** The Chapter 2 drone take-off under P control (Kp = 20 N/m), sampled every 10 ms. */
export function droneRun(seconds = 6): DroneRun {
  const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(20) }));
  const run: DroneRun = { t: [0], h: [sim.h], v: [sim.v] };
  sim.advance(seconds, () => {
    run.t.push(sim.t);
    run.h.push(sim.h);
    run.v.push(sim.v);
  });
  return run;
}

/** Running trapezoidal area under samples ys(xs). */
export function cumulativeArea(xs: number[], ys: number[]): number[] {
  const out = [0];
  for (let i = 1; i < xs.length; i++) out.push(out[i - 1] + 0.5 * (xs[i] - xs[i - 1]) * (ys[i] + ys[i - 1]));
  return out;
}
