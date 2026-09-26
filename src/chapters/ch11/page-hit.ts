import { DroneSim, type DroneConfig, type PID } from '../../sim/drone-model';
import { watchCeiling } from '../ch09/page-ceiling';
import { emptyTrace, sampleTrace } from '../ch09/pid-tools';
import { MISSION, missionConfig, type MissionTrace } from './mission';

/**
 * The page above the mission picture is a real ceiling. Only weak-Kp tunes (integral-driven swings, or
 * a big Kd on a tiny filter that rectifies the sensor noise) climb that far: about 4.9 m of headroom at
 * 1280 px, 6.4 m at 375 px. Hitting it at that speed is a prop strike, so the motors stall and the drone
 * falls: a mission failure the checklist already has ("never touch the ground after take-off").
 */
export const withCeiling = (cfg: DroneConfig, h: number | null): DroneConfig => (h === null ? cfg : { ...cfg, ceiling: { h, stall: true } });

/**
 * The whole mission under a ceiling (`null` = open sky), sampled every 10 ms exactly like `runDrone`
 * (so the live flight and "Fly instantly" match), plus the finished sim (`ceilingAt` says whether it hit).
 */
export function flyMission(p: PID, ceiling: number | null, seed = 7): { tr: MissionTrace; sim: DroneSim } {
  const sim = new DroneSim(withCeiling(missionConfig(p, seed), ceiling));
  const tr: MissionTrace = emptyTrace();
  sampleTrace(sim, tr);
  sim.advance(MISSION.duration, () => sampleTrace(sim, tr), 10);
  tr.crashed = sim.crashed;
  if (sim.stalled) tr.stalledAt = sim.ceilingAt;
  return { tr, sim };
}

/**
 * Metres of open page above the drone's picture. `measure()` reads it now; after that it is re-measured
 * when the layout settles (debounced `wait` ms) from a scroll (the sticky top bar is solid and moves over
 * the content), a resize, content above opening up or fonts loading. `onChange` gets the old value, and
 * only when the height really changed (more than 1 cm), so an unchanged replay is never restarted.
 * `h` is `null` under reduced motion or with nothing overhead.
 */
export function pageCeiling(view: { ceilingHeight(): number | null }, onChange: (old: number | null) => void, wait = 200): { measure: () => number | null; readonly h: number | null; destroy: () => void } {
  let h: number | null = null;
  const measure = () => (h = view.ceilingHeight());
  const destroy = watchCeiling(
    view,
    () => h,
    (next) => {
      const old = h;
      h = next;
      onChange(old);
    },
    wait,
  );
  return {
    measure,
    get h() {
      return h;
    },
    destroy,
  };
}
