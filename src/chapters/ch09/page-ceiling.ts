import { DroneSim, type DroneConfig } from '../../sim/drone-model';
import type { Trace } from './pid-tools';

export interface CeilingTrace extends Trace {
  /** when the drone first touched the ceiling, s; null if it never did */
  hitAt: number | null;
  /** separate contacts (touching, dropping away, touching again) */
  hits: number;
}

/**
 * `runDrone` with the page above the picture as a ceiling at `ceiling` metres (null: nothing
 * overhead, the trace is exactly `runDrone`'s). The motors survive the bump (`stall: false`) and
 * the controller carries on. A feedback drone can climb back up to it, and the page is still
 * there then, so every contact is a bump, not just the first (the sim's `cfg.ceiling` handles the
 * first one; later ones call `hitCeiling` again the same way).
 */
export function runUnderCeiling(cfg: DroneConfig, T: number, ceiling: number | null, every = 10): CeilingTrace {
  const sim = new DroneSim({ ...cfg, ceiling: ceiling === null ? undefined : { h: ceiling, stall: false } });
  const tr: CeilingTrace = { t: [], h: [], thrust: [], integral: [], r: [], wind: [], pkg: [], measured: [], crashed: false, hitAt: null, hits: 0 };
  const sample = () => {
    tr.t.push(sim.t);
    tr.h.push(sim.h);
    tr.thrust.push(sim.thrust);
    tr.integral.push(sim.integral);
    tr.r.push(cfg.setpoint(sim.t));
    tr.wind.push(cfg.wind(sim.t));
    tr.pkg.push(cfg.extraMass(sim.t));
    tr.measured.push(sim.measured);
  };
  sample();
  const n = Math.round(T / sim.dt);
  let touching = false;
  for (let i = 1; i <= n; i++) {
    const first = sim.ceilingAt === null;
    sim.step();
    if (ceiling !== null) {
      let contact = first && sim.ceilingAt !== null;
      if (!first && sim.h >= ceiling && sim.v > 0) {
        sim.x[0] = ceiling;
        sim.hitCeiling({ stall: false });
        contact = true;
      }
      // a new contact once it has dropped clearly away (1 cm) from the ceiling
      if (contact && !touching) tr.hits++;
      if (contact) touching = true;
      else if (sim.h < ceiling - 0.01) touching = false;
    }
    if (i % every === 0) sample();
  }
  tr.hitAt = sim.ceilingAt;
  tr.crashed = sim.crashed;
  return tr;
}

/** Heights closer than this (m) count as the same ceiling: no recompute for sub-pixel layout jitter. */
const SAME = 0.01;

export const sameCeiling = (a: number | null, b: number | null): boolean => (a === null || b === null ? a === b : Math.abs(a - b) < SAME);

/**
 * Calls `onChange(h)` when the measured ceiling (`view.ceilingHeight()`) changes: after the page's
 * layout settles from a resize, fonts loading, a prediction gate opening… (debounced). Returns
 * the cleanup.
 */
export function watchCeiling(view: { ceilingHeight(): number | null }, current: () => number | null, onChange: (h: number | null) => void, wait = 250): () => void {
  let timer = 0;
  let live = true;
  const check = () => {
    if (!live) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const h = view.ceilingHeight();
      if (!sameCeiling(h, current())) onChange(h);
    }, wait);
  };
  const ro = new ResizeObserver(check);
  ro.observe(document.documentElement);
  addEventListener('resize', check);
  void document.fonts?.ready.then(check);
  return () => {
    live = false;
    clearTimeout(timer);
    ro.disconnect();
    removeEventListener('resize', check);
  };
}
