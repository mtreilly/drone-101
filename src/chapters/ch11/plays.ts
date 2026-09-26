import { fmt } from '../../core/i18n';
import { DRONE } from '../../sim/drone-model';
import type { PlayModel } from '../../story/play';
import { pid } from '../ch09/pid-tools';
import { MISSION, missionMargins } from './mission';

/** Loaded weight: the drone plus its package, N. */
const LOADED = (DRONE.m + MISSION.pkgMass) * DRONE.g;

/** A tune that earns six stars on every noise seed (the S1 side trip keeps its numbers secret). */
export const SIX_STAR = pid(20, 15, 5, { dTau: 0.04 });

/** Models behind Chapter 11's playable sentences (`{ t: 'play', id }` blocks); pure maths, tested in Node. */
export const plays: Record<string, PlayModel> = {
  // "With the package the drone weighs {w} N, so 20 N is only {ratio}× its weight. At take-off, Kp = {kp} N/m
  //  times the 2 m error asks for {ask} N{clip}."
  limit: {
    inputs: { kp: { min: 1, max: 50, step: 1, value: 20, unit: 'N/m' } },
    outputs: {
      w: () => fmt(LOADED, 2),
      ratio: () => fmt(DRONE.tMax / LOADED, 1),
      ask: ({ kp }) => fmt(kp * MISSION.setpoint, 0),
      clip: ({ kp }, t) => (kp * MISSION.setpoint > DRONE.tMax ? t('clipped') : ''),
    },
  },
  // "That six-star tune's loop gain is 1 at about {wc} rad/s. A motor lag of τm = {tm} s holds that wiggle back
  //  by {lag}°, so the phase margin drops from 59° to {pm}°."
  lag: {
    inputs: { tm: { min: 0, max: 0.1, step: 0.01, value: MISSION.motorTau, unit: 's' } },
    outputs: {
      wc: ({ tm }) => fmt(missionMargins(SIX_STAR, tm).wc, 1),
      lag: ({ tm }) => fmt(missionMargins(SIX_STAR, tm).lag, 0),
      pm: ({ tm }) => fmt(missionMargins(SIX_STAR, tm).pm, 0),
    },
  },
  // "When a {pkg} kg package drops, the hover push must fall by {dN} N. … at Ki = {ki} N/(m·s) it has to pile
  //  up {area} m·s of error, which at an average error of {e} cm takes about {time} s."
  drop: {
    inputs: {
      pkg: { min: 0.05, max: 0.4, step: 0.05, value: MISSION.pkgMass, unit: 'kg' },
      ki: { min: 1, max: 50, step: 1, value: 15, unit: 'N/(m·s)' },
      e: { min: 1, max: 20, step: 1, value: 5, unit: 'cm' },
    },
    outputs: {
      dN: ({ pkg }) => fmt(pkg * DRONE.g, 2),
      area: ({ pkg, ki }) => fmt((pkg * DRONE.g) / ki, 3),
      time: ({ pkg, ki, e }) => fmt((pkg * DRONE.g) / ki / (e / 100), 1),
    },
  },
  // "With Kd = {kd} N·s/m and a filter of τf = {tf} s, every 2 cm wobble of the sensor asks the motors for about
  //  {spike} N (Kd·σ/τf)." The 1 ms noise hold makes the sim about 15 % lower at τf 0.005 ("about").
  spike: {
    inputs: {
      kd: { min: 0, max: 12, step: 0.5, value: 10, unit: 'N·s/m' },
      tf: { min: 0.005, max: 0.2, step: 0.005, value: 0.005, digits: 3, unit: 's' },
    },
    outputs: {
      spike: ({ kd, tf }) => {
        const s = (kd * MISSION.noiseStd) / tf;
        return fmt(s, s >= 10 ? 0 : 1);
      },
    },
  },
  // "A steady push of {F} N against a P gain of Kp = {kp} N/m moves the drone by F/Kp = {dev} cm, once a little
  //  D has let it settle."
  gust: {
    inputs: {
      F: { min: 0.5, max: 3, step: 0.5, value: -MISSION.gust.force, unit: 'N' },
      kp: { min: 5, max: 50, step: 1, value: 20, unit: 'N/m' },
    },
    outputs: { dev: ({ F, kp }) => fmt((F / kp) * 100, 1) },
  },
};
