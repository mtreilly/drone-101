import { fmt, tc } from '../../core/i18n';
import { DRONE, HOVER_THRUST as MG } from '../../sim/drone-model';
import type { PlayModel } from '../../story/play';
import { kiLimit } from './pid-tools';
import { regime, zetaPD } from './status';

const { m } = DRONE;
/** the chapter's P gain, N/m */
const KP = 20;
/** the D gain in the kick and noise widgets, N·s/m */
const KD = 4;
/** sensor noise σ in the noise widget, m */
const SIGMA = 0.02;

/** filter times shown with as few decimals as they need: 0.005, 0.01, 0.1 */
const seconds = (v: number): string => fmt(v, v < 0.01 ? 3 : v < 0.1 ? 2 : 1);

/** Models behind Chapter 9's playable sentences (`{ t: 'play', id }` blocks); pure maths, tested in Node. */
export const plays: Record<string, PlayModel> = {
  // "Stuck 24.5 cm low … With Ki = {ki} that adds {rate} N of push per second, enough for the whole
  // 4.9 N after {tau} s … after {tau} s about 63 %; after about {ts} s, 98 %."
  // Capped at Ki = 12: above that the fast pair interferes and τ ≈ Kp/Ki drifts.
  pile: {
    inputs: { ki: { min: 2, max: 12, step: 1, value: 10, unit: 'N/(m·s)' } },
    outputs: {
      rate: ({ ki }) => fmt((ki * MG) / KP, 2),
      tau: ({ ki }) => fmt(KP / ki, 1),
      ts: ({ ki }) => fmt((4 * KP) / ki, 1),
    },
  },
  // "With Ki = {ki} the net red area must add up to exactly mg/Ki = {area} m·s."
  area: {
    inputs: { ki: { min: 2, max: 40, step: 1, value: 10, unit: 'N/(m·s)' } },
    outputs: { area: ({ ki }) => fmt(MG / ki, 2) },
  },
  // "With Kp = 20 and Kd = {kd}: drag {damp} N·s/m, ζ = (c+Kd)/(2√(m Kp)) = {zeta}: {regime}."
  zeta: {
    inputs: { kd: { min: 0, max: 10, step: 0.5, value: 4, unit: 'N·s/m' } },
    outputs: {
      damp: ({ kd }) => fmt(DRONE.c + kd, 1),
      zeta: ({ kd }) => fmt(zetaPD(KP, kd), 2),
      regime: ({ kd }, _t, common = tc) => common(`regime.${regime(zetaPD(KP, kd))}`),
    },
  },
  // "With Kp = {kp} and Kd = {kd}, Ki must stay below (c+Kd)Kp/m = {lim}. At the edge: ω = √(Kp/m)
  // = {w} rad/s, one swing every {T} s." The poles widget follows it (play:cliff).
  cliff: {
    inputs: {
      kp: { min: 2, max: 40, step: 1, value: KP, unit: 'N/m' },
      kd: { min: 0, max: 10, step: 0.5, value: 0, unit: 'N·s/m' },
    },
    outputs: {
      lim: ({ kp, kd }) => fmt(kiLimit(kp, kd), 0),
      w: ({ kp }) => fmt(Math.sqrt(kp / m), 2),
      T: ({ kp }) => fmt((2 * Math.PI) / Math.sqrt(kp / m), 2),
    },
  },
  // "A jump of {dr} m through a {tf} s filter looks like {slope} m/s; with Kd = 4 the D term asks for
  // roughly {spike} N."
  kick: {
    inputs: {
      dr: { min: 0.1, max: 1, step: 0.1, value: 0.5, unit: 'm' },
      tf: { min: 0.005, max: 0.05, step: 0.005, value: 0.01, values: [0.005, 0.01, 0.02, 0.05], unit: 's', format: seconds },
    },
    outputs: {
      slope: ({ dr, tf }) => fmt(dr / tf, 0),
      spike: ({ dr, tf }) => fmt((KD * dr) / tf, 0),
    },
  },
  // "Through a filter of τf = {tf} s, Kd = 4 turns σ = 2 cm into about Kd σ/τf = {d} N of jitter."
  jitter: {
    inputs: { tf: { min: 0.005, max: 0.2, step: 0.005, value: 0.1, values: [0.005, 0.01, 0.02, 0.05, 0.1, 0.2], unit: 's', format: seconds } },
    outputs: { d: ({ tf }) => fmt((KD * SIGMA) / tf, 1) },
  },
};
