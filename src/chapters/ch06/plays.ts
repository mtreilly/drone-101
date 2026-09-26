import { fmt } from '../../core/i18n';
import { DRONE, HOVER_THRUST } from '../../sim/drone-model';
import type { PlayModel } from '../../story/play';
import { regime, secondOrderRoots } from './helpers';

const { m, c } = DRONE;
/** The spring used in the ωn and ζ sentences: k = 20 N/m, like the default gain. */
const K = 20;

const kp = { min: 2, max: 60, step: 1, value: 20, unit: 'N/m' };

export const plays: Record<string, PlayModel> = {
  // "At Kp = {kp} N/m, a drone {e} m too low gets {f} N of extra thrust."
  units: {
    inputs: { kp, e: { min: 0.1, max: 2, step: 0.1, value: 0.5, unit: 'm' } },
    outputs: { f: (v) => fmt(v.kp * v.e, 1) },
  },
  // "With k = {k} N/m and m = 0.5 kg: ωn ≈ {wn} rad/s, one full swing every {period} s."
  wn: {
    inputs: { k: { ...kp, value: K } },
    outputs: {
      wn: ({ k }) => fmt(Math.sqrt(k / m), 2),
      period: ({ k }) => fmt((2 * Math.PI) / Math.sqrt(k / m), 2),
    },
  },
  // "With c = {c} N·s/m on the k = 20 N/m spring, c_crit = {ccrit}, so ζ = {zeta}: {regime}."
  zeta: {
    inputs: { c: { min: 0.2, max: 12, step: 0.1, value: 1, unit: 'N·s/m' } },
    outputs: {
      ccrit: () => fmt(2 * Math.sqrt(m * K), 2),
      zeta: ({ c: cc }) => fmt(cc / (2 * Math.sqrt(m * K)), 2),
      regime: ({ c: cc }, t) => t(`regime.${regime(cc / (2 * Math.sqrt(m * K)))}`),
    },
  },
  // "With ωn = 3 and ζ = {z}, the dots sit at {roots}: distance {r} from 0."
  circle: {
    inputs: { z: { min: 0, max: 1, step: 0.05, value: 0.4 } },
    outputs: {
      roots: ({ z }) => {
        const [r] = secondOrderRoots(3, z);
        return Math.abs(r.im) < 1e-9 ? fmt(r.re, 2) : `${fmt(r.re, 2)} ± ${fmt(Math.abs(r.im), 2)}i`;
      },
      r: ({ z }) => {
        const [r] = secondOrderRoots(3, z);
        return fmt(Math.hypot(r.re, r.im), 2);
      },
    },
  },
  // "A mode that shrinks at a = {a} per second is within 2% after about {ts} s."
  settle: {
    inputs: { a: { min: 0.1, max: 10, step: 0.1, value: 1, unit: '1/s' } },
    outputs: { ts: ({ a }) => fmt(Math.log(50) / a, 2) },
  },
  // "Kp = {kp} N/m: ζ = {zeta}, ωn = {wn} rad/s, droop {droop} m."
  drone: {
    inputs: { kp },
    outputs: {
      zeta: (v) => fmt(c / (2 * Math.sqrt(m * v.kp)), 2),
      wn: (v) => fmt(Math.sqrt(v.kp / m), 2),
      droop: (v) => fmt(HOVER_THRUST / v.kp, 2),
    },
  },
};
