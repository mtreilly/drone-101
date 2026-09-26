import { fmt } from '../../core/i18n';
import { DRONE } from '../../sim/drone-model';
import type { PlayModel } from '../../story/play';
import { solveDrone } from './tools';

/** Enough decimals that a small leftover never reads as a flat 0.000. */
const small = (v: number) => fmt(v, Math.abs(v) >= 0.01 ? 3 : 5);

/** The solve widget's drone: target 2 m, released at rest from `h0`. */
const droneSolve = (kp: number, h0: number) => solveDrone({ m: DRONE.m, c: DRONE.c, g: DRONE.g, kp, r: 2, h0, v0: 0 });
const kp = { min: 5, max: 60, step: 1, value: 20, unit: 'N/m' };

/** Models behind Chapter 7's playable sentences (`{ t: 'play', id }` blocks); pure maths, tested in Node. */
export const plays: Record<string, PlayModel> = {
  // "Probe the step at s = {s}: the area is 1 ÷ {s} = {F}. Double s and the area halves."
  stepArea: {
    inputs: { s: { min: 0.25, max: 4, step: 0.25, value: 2 } },
    outputs: {
      s: ({ s }) => fmt(s, 2),
      F: ({ s }) => fmt(1 / s, 3),
    },
  },
  // "Stop adding the area of e^{−t} at t = {T} s and you already have {A}. Everything after that adds only {left}."
  longArea: {
    inputs: { T: { min: 0.5, max: 10, step: 0.5, value: 3, unit: 's' } },
    outputs: {
      A: ({ T }) => fmt(1 - Math.exp(-T), 3),
      left: ({ T }) => small(Math.exp(-T)),
    },
  },
  // "Signal e^{at} with a = {a}, probe s = {s}: the product fades at s − a = {gap} per second, so its area is {F}{verdict}"
  scream: {
    inputs: {
      a: { min: -2, max: 1, step: 0.1, value: 0.5, unit: '1/s' },
      s: { min: -1, max: 3, step: 0.05, value: 1, unit: '1/s' },
    },
    outputs: {
      gap: ({ a, s }) => fmt(s - a, 2),
      F: ({ a, s }) => (s - a > 1e-9 ? fmt(1 / (s - a), 2) : '∞'),
      verdict: ({ a, s }, t) => t(s - a <= 1e-9 ? 'none' : s - a < 0.3 - 1e-9 ? 'loud' : 'calm'),
    },
  },
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
