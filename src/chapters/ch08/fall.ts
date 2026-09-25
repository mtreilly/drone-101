import { DroneSim, defaultDroneConfig } from '../../sim/drone-model';

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
