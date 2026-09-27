import { fmt } from '../../core/i18n';
import { DRONE } from '../../sim/drone-model';
import type { PlayModel } from '../../story/play';
import { solveDrone } from '../ch08/tools';

/** The solve widget's drone: target 2 m, released at rest from `h0`. */
const droneSolve = (kp: number, h0: number) => solveDrone({ m: DRONE.m, c: DRONE.c, g: DRONE.g, kp, r: 2, h0, v0: 0 });
const kp = { min: 5, max: 60, step: 1, value: 20, unit: 'N/m' };

/** Models behind Chapter 9's playable sentences (`{ t: 'play', id }` blocks); pure maths, tested in Node. */
export const plays: Record<string, PlayModel> = {
  // "With a = {a} and s = {s}: the slope's area is {lhs}, and s·F − f(0) = {rhs}. Same number."
  ruleExp: {
    inputs: {
      a: { min: -2, max: 0, step: 0.5, value: -1, unit: '1/s' },
      s: { min: 0.5, max: 3, step: 0.5, value: 1, unit: '1/s' },
    },
    outputs: {
      lhs: ({ a, s }) => fmt(a / (s - a), 3),
      // one output, so "0.500 − 1 = −0.500" stays in reading order in right-to-left text
      rhs: ({ a, s }) => `${fmt(s / (s - a), 3)} − 1 = ${fmt(s / (s - a) - 1, 3)}`,
    },
  },
  // "Take {k} times e^{−rt} with r = {r}, probed at s = {s}: its area is k ÷ (s + r) = {eq}."
  scale: {
    inputs: {
      k: { min: 1, max: 5, step: 1, value: 3 },
      r: { min: 0, max: 4, step: 0.5, value: 2, unit: '1/s' },
      s: { min: 0.5, max: 3, step: 0.5, value: 1, unit: '1/s' },
    },
    outputs: {
      // the whole little sum in one output keeps its reading order in right-to-left text
      eq: ({ k, r, s }) => `${fmt(k, 0)} ÷ (${fmt(s, 1)} + ${fmt(r, 1)}) = ${fmt(k / (s + r), 3)}`,
    },
  },
  // "With Kp = {kp} N/m, ωd² = {wd2}, so the bottom is zero at s = {roots}."
  square: {
    inputs: { kp },
    outputs: {
      wd2: (v) => fmt(droneSolve(v.kp, 0).wd ** 2, 0),
      roots: (v) => {
        const { sigma, wd } = droneSolve(v.kp, 0);
        return `−${fmt(sigma, 0)} ± ${fmt(wd, 2)}i`;
      },
    },
  },
  // "With Kp = {kp} N/m from a {h0} m ledge: A = {A} m, so the drone settles {droop} m below the 2 m target. …
  //  The rest is e^{−t} × ({wiggle}), a wiggle that fades away."
  residues: {
    inputs: { kp, h0: { min: 0, max: 3, step: 0.1, value: 1, unit: 'm' } },
    outputs: {
      A: (v) => fmt(droneSolve(v.kp, v.h0).A, 3),
      droop: (v) => fmt(2 - droneSolve(v.kp, v.h0).A, 3),
      // one output, so the little sum keeps its reading order in right-to-left text
      wiggle: (v) => {
        const { K1, K2, wd } = droneSolve(v.kp, v.h0);
        const w = fmt(wd, 2);
        return `${fmt(K1, 3)} cos ${w}t ${K2 < 0 ? '−' : '+'} ${fmt(Math.abs(K2), 3)} sin ${w}t`;
      },
    },
  },
};
