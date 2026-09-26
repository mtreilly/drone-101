import { fmt } from '../../core/i18n';
import { loopMargins } from '../../math/bode';
import { SHOWER } from '../../sim/shower-model';
import type { PlayModel } from '../../story/play';
import { criticalHandGain, KNOB_GAIN, piLoop } from './shower-tools';

const DEG = 180 / Math.PI;
const { delay: PIPE, tau: TAU } = SHOWER;
/** the smoother's lag at ω, in degrees (never past 90°) */
const smootherLag = (w: number): number => Math.atan(w * TAU) * DEG;
/** the pipe's lag at ω, in degrees (no limit) */
const pipeLag = (w: number): number => w * PIPE * DEG;
/** the position hand's edge: 0.0307 knob per °C at 0.952 rad/s */
const P_EDGE = criticalHandGain(PIPE, TAU, 'position');

/** "Upside down" when within 3° of 180°. */
export const flipVerdict = (total: number): 'before' | 'flip' | 'past' => (Math.abs(total - 180) < 3 ? 'flip' : total < 180 ? 'before' : 'past');

/** A loop that returns a swing `g` times as big: within 2 % of 1 is the edge. */
export const swingVerdict = (g: number): 'dies' | 'edge' | 'grows' => (g < 0.98 ? 'dies' : g > 1.02 ? 'grows' : 'edge');

/** Models behind Chapter 10's playable sentences (`{ t: 'play', id }` blocks); pure maths, tested in Node. */
export const plays: Record<string, PlayModel> = {
  // "A {L} s delay on a wiggle that repeats every {T} s covers {frac} of a wiggle, so the output trails by {deg}°, or {rad} radians."
  delaylag: {
    inputs: {
      L: { min: 0.5, max: 5, step: 0.5, value: 2.5, digits: 1, unit: 's' },
      T: { min: 2, max: 30, step: 0.5, value: 10, digits: 1, unit: 's' },
    },
    outputs: {
      frac: ({ L, T }) => fmt(L / T, 2),
      deg: ({ L, T }) => fmt((360 * L) / T, 0),
      rad: ({ L, T }) => fmt((2 * Math.PI * L) / T, 2),
    },
  },
  // "At ω = {w} rad/s, the smoother (τ = 1 s) keeps {g} of the wiggle and lags it by {lag}°."
  smoother: {
    inputs: { w: { min: 0.05, max: 5, step: 0.05, value: 1, unit: 'rad/s' } },
    outputs: {
      g: ({ w }) => fmt(1 / Math.hypot(1, w * TAU), 2),
      lag: ({ w }) => fmt(smootherLag(w), 0),
    },
  },
  // "At ω = {w} rad/s the pipe lags {pipe}° and the smoother {lag}°: {total}° in all. {verdict}"
  total: {
    inputs: { w: { min: 0.1, max: 2, step: 0.01, value: 0.5, unit: 'rad/s' } },
    outputs: {
      pipe: ({ w }) => fmt(pipeLag(w), 0),
      lag: ({ w }) => fmt(smootherLag(w), 0),
      total: ({ w }) => fmt(pipeLag(w) + smootherLag(w), 0),
      verdict: ({ w }, t) => t(flipVerdict(pipeLag(w) + smootherLag(w))),
    },
  },
  // "At ω = {w} rad/s the hand's pile lags 90°, the smoother {lag}°, the pipe {pipe}°: {total}° in all. There the normal hand's loop returns a swing {g} times as big."
  handloop: {
    inputs: { w: { min: 0.2, max: 0.8, step: 0.01, value: 0.3, unit: 'rad/s' } },
    outputs: {
      lag: ({ w }) => fmt(smootherLag(w), 0),
      pipe: ({ w }) => fmt(pipeLag(w), 0),
      total: ({ w }) => fmt(90 + smootherLag(w) + pipeLag(w), 0),
      g: ({ w }) => fmt((KNOB_GAIN * 0.008) / (w * Math.hypot(1, w * TAU)), 2),
    },
  },
  // "A position hand with K = {K} knob per °C: at the −180° speed (0.95 rad/s) its loop returns a swing {g} times as big. {verdict}"
  pgain: {
    inputs: { K: { min: 0.005, max: 0.05, step: 0.001, value: 0.02, digits: 3 } },
    outputs: {
      g: ({ K }) => fmt(K / P_EDGE.k, 2),
      verdict: ({ K }, t) => t(swingVerdict(K / P_EDGE.k)),
    },
  },
  // "With a {L} s pipe, the speed hand's edge is k = {k} %/(°C·s), and at the edge it swings every {T} s."
  double: {
    inputs: { L: { min: 1, max: 5, step: 0.5, value: 2.5, values: [1, 1.5, 2, 2.5, 3, 4, 5], digits: 1, unit: 's' } },
    outputs: {
      k: ({ L }) => fmt(criticalHandGain(L).k * 100, 2),
      T: ({ L }) => fmt(criticalHandGain(L).period, 1),
    },
  },
  // "With Kp = {kp} %/°C and Ki = {ki} %/(°C·s), {verdict}"
  delaymargin: {
    inputs: {
      kp: { min: 0, max: 3, step: 0.1, value: 1, unit: '%/°C' },
      ki: { min: 0.1, max: 1.5, step: 0.05, value: 0.6, unit: '%/(°C·s)' },
    },
    outputs: {
      verdict: ({ kp, ki }, t) => {
        const m = loopMargins(piLoop(kp / 100, ki / 100), PIPE);
        if (!(m.gm > 1) || !(m.pm > 0)) return t('none');
        return t('margin', { pm: fmt(m.pm, 0), wc: fmt(m.wc, 2), dm: fmt(m.dm, 1) });
      },
    },
  },
};
