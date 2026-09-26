import { CRASH_SPEED, DroneSim, defaultDroneConfig } from '../../sim/drone-model';

/**
 * What happens after the drone hits the page above its picture: it starts from the height and
 * vertical speed it had at the hit, the motors stall (`DroneSim.hitCeiling`), and it falls until it
 * lands or crashes. The same model as every other drone in the course.
 */
export function fallSim(h: number, v: number): DroneSim {
  const sim = new DroneSim(defaultDroneConfig({ mode: 'open', openThrust: () => 0, h0: h, v0: v }));
  sim.hitCeiling();
  return sim;
}

/** The whole fall sampled every `every` seconds (for the plot), from the hit until it is on the ground. */
export function fallTrace(h: number, v: number, every = 0.01): { t: number[]; h: number[]; crashed: boolean } {
  const sim = fallSim(h, v);
  const t = [0];
  const hs = [sim.h];
  const n = Math.round(every / sim.dt);
  while (!sim.landed && sim.t < 20) {
    for (let i = 0; i < n && !sim.landed; i++) sim.step();
    t.push(sim.t);
    hs.push(sim.h);
  }
  return { t, h: hs, crashed: sim.crashed };
}

export interface GroundCut {
  /** the sample times, with the exact touchdown time inserted */
  t: number[];
  /** the heights: the formula up to touchdown, then 0 (it stays down) */
  h: number[];
  /** touchdown time, s; null if it never comes down to the ground */
  at: number | null;
  /** vertical speed at touchdown, m/s (negative = down); 0 if it never lands */
  v: number;
  /** landed faster than the sim's crash speed (`CRASH_SPEED`), like every other drone in the course */
  crashed: boolean;
}

/**
 * The ground as a real event for a formula-driven drone (Chapter 8's playground): the plot shows the
 * formula until the height first comes down to 0 m (after it was airborne), then 0 for the rest of the
 * trace, never an analytic curve under the grass. Same stay-down rule as a page hit: the drone is down
 * from `at` on until the replay restarts or the input changes. With the formula `f`, the touchdown time
 * and speed are exact (bisection, central difference); without it they come from the samples.
 */
export function groundCut(tr: { t: readonly number[]; h: readonly number[] }, f?: (t: number) => number): GroundCut {
  const n = tr.t.length;
  let i = 1;
  while (i < n && !(tr.h[i] <= 0 && tr.h[i - 1] > 0)) i++;
  if (i >= n) return { t: [...tr.t], h: [...tr.h], at: null, v: 0, crashed: false };
  let a = tr.t[i - 1];
  let b = tr.t[i];
  let at: number;
  let v: number;
  if (f) {
    for (let k = 0; k < 60; k++) {
      const mid = (a + b) / 2;
      if (f(mid) > 0) a = mid;
      else b = mid;
    }
    at = b;
    const dt = 1e-5;
    v = (f(at + dt) - f(at - dt)) / (2 * dt);
  } else {
    const h0 = tr.h[i - 1];
    const h1 = tr.h[i];
    at = a + ((b - a) * h0) / (h0 - h1);
    v = (h1 - h0) / (b - a);
  }
  const t = tr.t.slice(0, i);
  const h = tr.h.slice(0, i);
  t.push(at);
  h.push(0);
  for (let k = i; k < n; k++) {
    if (tr.t[k] <= at) continue;
    t.push(tr.t[k]);
    h.push(0);
  }
  return { t, h, at, v, crashed: v < -CRASH_SPEED };
}
