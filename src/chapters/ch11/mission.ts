import { loopMargins, pidTF, type LoopMargins } from '../../math/bode';
import { polymul } from '../../math/poly';
import { roots } from '../../math/poly';
import type { C } from '../../math/complex';
import { DRONE, defaultDroneConfig, type DroneConfig, type PID } from '../../sim/drone-model';
import { seeds } from '../../sim/random';
import { dronePlant, runDrone, type Trace } from '../ch09/pid-tools';

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

/** June's "perfect in calm air" tune: flawless with a perfect sensor, chattering with a real one. */
export const JUNE_TUNE = { kp: 30, ki: 15, kd: 10, dTau: 0.005 };

/** Pass limits: settled rise ≤ 3 s, overshoot < 10 %, gust deviation < 20 cm, recovery < 2 s, thrust variation < 0.5 N. */
export const LIMITS = { rise: 3, overshoot: 10, gust: 0.2, recover: 2, calm: 0.5, band: 0.05 };
export const CRITERIA: CriterionId[] = ['rise', 'overshoot', 'gust', 'recover', 'ground', 'calm'];

/** The time window each checklist item judges, s (linked to the plots on hover and focus). */
export const WINDOWS: Record<CriterionId, [number, number]> = {
  rise: [0, MISSION.gust.start],
  overshoot: [0, MISSION.gust.start],
  gust: [MISSION.gust.start, MISSION.dropAt],
  recover: [MISSION.dropAt, MISSION.dropAt + LIMITS.recover],
  ground: [1, MISSION.duration],
  calm: [3, 6],
};

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
 * `rise` falls back to the gust time when the height never settled in the band before the gust, and
 * `recover` to the end of the mission when it never got back: those are verdicts, not measurements,
 * and the checklist says so instead of showing "6.00 s" / "8.00 s".
 */
export const neverSettled = (r: MissionResult): boolean => r.rise >= MISSION.gust.start - 0.005;
export const neverBack = (r: MissionResult): boolean => r.recover >= MISSION.duration - MISSION.dropAt - 0.005;

/** Roughly how many newtons of command D makes from the sensor's jitter: Kd·σ/τf (play P2, about 15 % high at τf 0.005). */
export const dSpike = (p: Pick<PID, 'kd' | 'dTau'>): number => (p.kd * MISSION.noiseStd) / Math.max(p.dTau, 1e-3);

export type Hint = 'ground' | 'noise' | 'droop' | 'overshoot' | 'rise' | 'gust' | 'recover' | 'swing';

/**
 * One tip after the score, for the failure to fix first: the ground, then chatter that comes from
 * the sensor (it spoils every other star), then take-off (droop, overshoot, a slow climb), the gust,
 * the drop, and a thrust that is still swinging. `null` with six stars.
 */
export function hintFor(r: MissionResult, p: Pick<PID, 'ki' | 'kd' | 'dTau'>): Hint | null {
  const f = r.pass;
  if (!f.ground) return 'ground';
  if (!f.calm && dSpike(p) > 5) return 'noise';
  if (!f.rise && p.ki === 0) return 'droop';
  if (!f.overshoot) return 'overshoot';
  if (!f.rise) return 'rise';
  if (!f.gust) return 'gust';
  if (!f.recover) return 'recover';
  if (!f.calm) return 'swing';
  return null;
}

/**
 * A page hit that the sensor noise caused: a big Kd on a tiny filter rectifies the jitter (the clip
 * at 0 N cuts off the downward spikes), which lifts a weak-Kp tune far above its target.
 */
export const noiseLifted = (p: Pick<PID, 'kd' | 'dTau'>): boolean => p.dTau <= 0.01 && p.kd >= 8;

/** Measured values of a mission that `starsOnSeeds` reports the spread of. */
export type MissionMetric = 'rise' | 'overshoot' | 'gust' | 'recover' | 'calm';
const METRICS: MissionMetric[] = ['rise', 'overshoot', 'gust', 'recover', 'calm'];

export interface SeedSummary {
  /** the noise seeds flown */
  seeds: number[];
  /** one evaluation per seed, in the same order */
  results: MissionResult[];
  /** how many seeds earned all six stars */
  gold: number;
  /** the fewest / most stars on any seed */
  minStars: number;
  maxStars: number;
  /** per criterion: on how many seeds it passed */
  passes: Record<CriterionId, number>;
  /** the seeds that missed a star, and which criteria they failed */
  misses: { seed: number; failed: CriterionId[] }[];
  /** per measured value: [smallest, largest] over the seeds (NaN values, e.g. "never settled", are skipped) */
  range: Record<MissionMetric, [number, number]>;
}

/**
 * Flies the mission once per noise seed (1…n) and summarises it, for any claim about a noisy tune
 * ("gets 6 stars", "arrives in about 1.9 s", "chatters less"): the widget always uses seed 7, but a
 * sentence in the prose must hold for any jitter. `over` changes the config (e.g. `{ noiseStd: 0 }`).
 */
export function starsOnSeeds(p: PID, n = 30, over: Partial<DroneConfig> = {}): SeedSummary {
  const list = seeds(n);
  const results = list.map((seed) => evaluate(runDrone({ ...missionConfig(p, seed), ...over }, MISSION.duration, 10)));
  const passes = Object.fromEntries(CRITERIA.map((c) => [c, results.filter((r) => r.pass[c]).length])) as Record<CriterionId, number>;
  const range = Object.fromEntries(
    METRICS.map((k) => {
      const xs = results.map((r) => r[k]).filter((x) => !Number.isNaN(x));
      return [k, xs.length ? [Math.min(...xs), Math.max(...xs)] : [NaN, NaN]];
    }),
  ) as Record<MissionMetric, [number, number]>;
  const stars = results.map((r) => r.stars);
  return {
    seeds: list,
    results,
    gold: stars.filter((s) => s === 6).length,
    minStars: Math.min(...stars),
    maxStars: Math.max(...stars),
    passes,
    misses: results.flatMap((r, i) => (r.stars === 6 ? [] : [{ seed: list[i], failed: CRITERIA.filter((c) => !r.pass[c]) }])),
    range,
  };
}

/**
 * The mission loop's margins, nominal like `missionPoles` (no noise, limits or package): PID with the
 * filtered D, motor lag `tm`, drone 1/(m s² + c s). Adds `lag`, what the motor lag alone costs at the
 * crossover, arctan(wc·tm) in degrees. Reference tune: tm 0 → wc 10.8 rad/s, PM 58.5°; tm 0.05 →
 * wc 9.85 rad/s, lag 26.2°, PM 33.4°.
 */
export function missionMargins(p: PID, tm = MISSION.motorTau, m = DRONE.m, c = DRONE.c): LoopMargins & { lag: number } {
  const lm = loopMargins(pidTF(p.kp, p.ki, p.kd, p.dTau), dronePlant(m, c), { lags: tm > 0 ? [tm] : [] });
  return { ...lm, lag: (Math.atan(lm.wc * tm) * 180) / Math.PI };
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
