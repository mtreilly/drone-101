import { fmt } from '../../core/i18n';
import type { PlayModel } from '../../story/play';

/** Enough decimals that a small leftover never reads as a flat 0.000. */
const small = (v: number) => fmt(v, Math.abs(v) >= 0.01 ? 3 : 5);

/** Models behind Chapter 8's playable sentences (`{ t: 'play', id }` blocks); pure maths, tested in Node. */
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
};
