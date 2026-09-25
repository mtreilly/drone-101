import { DroneSim, type DroneConfig, type PID } from '../../sim/drone-model';
import type { DroneView } from '../../ui/drone-view';
import type { Trace } from '../ch09/pid-tools';
import { MISSION, missionConfig } from './mission';

/**
 * The page above the mission picture is a real ceiling. Only weak-Kp tunes (integral-driven swings, or
 * a big Kd on a tiny filter that rectifies the sensor noise) climb that far: about 4.9 m of headroom at
 * 1280 px, 6.4 m at 375 px. Hitting it at that speed is a prop strike, so the motors stall and the drone
 * falls: a mission failure the checklist already has ("never touch the ground after take-off").
 */
export const withCeiling = (cfg: DroneConfig, h: number | null): DroneConfig => (h === null ? cfg : { ...cfg, ceiling: { h, stall: true } });

/** Samples a mission sim exactly like `runDrone` (every 10 ms), so the live flight and "Fly instantly" match. */
export function sample(sim: DroneSim, tr: Trace): void {
  tr.t.push(sim.t);
  tr.h.push(sim.h);
  tr.thrust.push(sim.thrust);
  tr.integral.push(sim.integral);
  tr.r.push(sim.cfg.setpoint(sim.t));
  tr.wind.push(sim.cfg.wind(sim.t));
  tr.pkg.push(sim.cfg.extraMass(sim.t));
  tr.measured.push(sim.measured);
}

/** The whole mission under a ceiling (`null` = open sky), plus the finished sim (`ceilingAt` says whether it hit). */
export function flyMission(p: PID, ceiling: number | null, seed = 7): { tr: Trace; sim: DroneSim } {
  const sim = new DroneSim(withCeiling(missionConfig(p, seed), ceiling));
  const tr: Trace = { t: [], h: [], thrust: [], integral: [], r: [], wind: [], pkg: [], measured: [], crashed: false };
  sample(sim, tr);
  sim.advance(MISSION.duration, () => sample(sim, tr), 10);
  tr.crashed = sim.crashed;
  return { tr, sim };
}

/**
 * Metres of open page above the drone's picture, re-measured after the layout settles (resize, content
 * above opening up). `null` under reduced motion or with nothing overhead. `onChange` gets the old value.
 */
export function pageCeiling(view: DroneView, onChange: (old: number | null) => void, wait = 200): { measure: () => number | null; readonly h: number | null; destroy: () => void } {
  let h: number | null = null;
  let timer = 0;
  const measure = () => (h = view.ceilingHeight());
  const later = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const old = h;
      measure();
      if ((old === null) !== (h === null) || (old !== null && h !== null && Math.abs(old - h) > 0.01)) onChange(old);
    }, wait);
  };
  addEventListener('resize', later);
  const ro = new ResizeObserver(later);
  ro.observe(document.body);
  return {
    measure,
    get h() {
      return h;
    },
    destroy: () => {
      clearTimeout(timer);
      removeEventListener('resize', later);
      ro.disconnect();
    },
  };
}
