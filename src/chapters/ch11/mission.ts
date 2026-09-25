import { polymul } from '../../math/poly';
import { roots } from '../../math/poly';
import type { C } from '../../math/complex';
import { DRONE, defaultDroneConfig, type DroneConfig, type PID } from '../../sim/drone-model';
import { runDrone, type Trace } from '../ch09/pid-tools';

/** The finale's "real-world grit". */
export const MISSION = {
  duration: 20,
  motorTau: 0.05,
  noiseStd: 0.02,
  gust: { start: 6, end: 9, force: -1.5 },
  pkgMass: 0.2,
  dropAt: 12,
  setpoint: 2,
};

export const missionParams = { ...DRONE, saturate: true, motorTau: MISSION.motorTau };

export function missionConfig(p: PID, seed = 7): DroneConfig {
  return defaultDroneConfig({
    params: missionParams,
    pid: p,
    setpoint: () => MISSION.setpoint,
    wind: (t) => (t >= MISSION.gust.start && t < MISSION.gust.end ? MISSION.gust.force : 0),
    extraMass: (t) => (t < MISSION.dropAt ? MISSION.pkgMass : 0),
    noiseStd: MISSION.noiseStd,
    seed,
  });
}

export const runMission = (p: PID, seed = 7): Trace => runDrone(missionConfig(p, seed), MISSION.duration, 10);

/** A mission trace; `stalledAt` is when the motors stalled after hitting what is above the picture (see page-hit.ts). */
export type MissionTrace = Trace & { stalledAt?: number | null };

export type CriterionId = 'rise' | 'overshoot' | 'gust' | 'recover' | 'ground' | 'calm';

/** Pass limits: settled rise ≤ 3 s, overshoot < 10 %, gust deviation < 20 cm, recovery < 2 s, thrust variation < 0.5 N. */
export const LIMITS = { rise: 3, overshoot: 10, gust: 0.2, recover: 2, calm: 0.5, band: 0.05 };
export const CRITERIA: CriterionId[] = ['rise', 'overshoot', 'gust', 'recover', 'ground', 'calm'];

export interface MissionResult {
  /** first time after which height stays within ±5 cm until the gust, s */
  rise: number;
  /** percent overshoot before the gust */
  overshoot: number;
  /** worst deviation from 2 m from gust onset until package drop, m */
  gust: number;
  /** time after the drop until it stays within ±5 cm, s */
  recover: number;
  /** touched the ground after take-off */
  ground: boolean;
  /** thrust variation (standard deviation) during t ∈ [3, 6), N; NaN if it wasn't hovering on running motors */
  calm: number;
  pass: Record<CriterionId, boolean>;
  stars: number;
}

/**
 * Evaluates a mission trace (true height, not the noisy measurement).
 * Partial traces are evaluated as far as they go; unmet criteria count as fails.
 */
export function evaluate(tr: MissionTrace): MissionResult {
  const r = MISSION.setpoint;
  let lastRiseOut = -1;
  let peak = 0;
  let gust = 0;
  // a stall (hit what is above the picture) is a certain fall, even if the mission ends before it lands
  let ground = tr.crashed || tr.stalledAt != null;
  let lastOut = MISSION.dropAt;
  const calmT: number[] = [];
  // "motors calm in hover" needs a hover: in the air on running motors for the whole window
  // (a stalled or grounded drone has perfectly steady thrust, 0 N, and must not earn the star)
  let hovering = true;
  const end = tr.t[tr.t.length - 1] ?? 0;
  for (let i = 0; i < tr.t.length; i++) {
    const t = tr.t[i];
    const h = tr.h[i];
    if (t < MISSION.gust.start && Math.abs(h - r) > LIMITS.band) lastRiseOut = i;
    if (t < MISSION.gust.start) peak = Math.max(peak, h);
    if (t >= MISSION.gust.start && t < MISSION.dropAt) gust = Math.max(gust, Math.abs(h - r));
    if (t > 1 && h <= 1e-6) ground = true;
    if (t >= MISSION.dropAt && Math.abs(h - r) > LIMITS.band) lastOut = t;
    if (t >= 3 && t < 6) {
      calmT.push(tr.thrust[i]);
      if (h <= 1e-6 || (tr.stalledAt != null && t >= tr.stalledAt)) hovering = false;
    }
  }
  const overshoot = Math.max(0, ((peak - r) / r) * 100);
  const rise = end >= MISSION.gust.start ? (tr.t[lastRiseOut + 1] ?? MISSION.gust.start) : NaN;
  const recover = end >= MISSION.duration - 0.02 ? lastOut - MISSION.dropAt : NaN;
  const mean = calmT.reduce((a, b) => a + b, 0) / Math.max(1, calmT.length);
  const calm = calmT.length && hovering ? Math.sqrt(calmT.reduce((a, b) => a + (b - mean) ** 2, 0) / calmT.length) : NaN;
  const pass: Record<CriterionId, boolean> = {
    rise: Number.isFinite(rise) && rise <= LIMITS.rise,
    overshoot: end >= MISSION.gust.start && overshoot < LIMITS.overshoot,
    gust: end >= MISSION.dropAt && gust < LIMITS.gust,
    recover: recover < LIMITS.recover,
    ground: !ground && end > 1,
    calm: calm < LIMITS.calm,
  };
  return { rise, overshoot, gust, recover, ground, calm, pass, stars: Object.values(pass).filter(Boolean).length };
}

/**
 * Nominal closed-loop poles (no noise, no limits, no package) with motor lag and a
 * filtered derivative: C(s) = Kp + Ki/s + Kd·s/(τf·s + 1), motor 1/(τm·s + 1), drone 1/(m s² + c s).
 */
export function missionPoles(p: PID, m = DRONE.m, c = DRONE.c): C[] {
  const tf = p.dTau;
  const den = polymul([1, 0], polymul([tf, 1], polymul([MISSION.motorTau, 1], [m, c, 0])));
  const num = addPoly(addPoly(scalePoly([tf, 1, 0], p.kp), scalePoly([tf, 1], p.ki)), scalePoly([1, 0, 0], p.kd));
  const ch = addPoly(den, num);
  // With Ki = 0, the controller's 1/s representation introduced one common
  // factor of s. Cancel exactly that factor; any other pole at zero is physical.
  return roots(p.ki === 0 ? ch.slice(0, -1) : ch);
}

function scalePoly(p: number[], k: number): number[] {
  return p.map((x) => x * k);
}

function addPoly(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const out: number[] = Array.from({ length: n }, () => 0);
  a.forEach((x, i) => (out[n - a.length + i] += x));
  b.forEach((x, i) => (out[n - b.length + i] += x));
  return out;
}
