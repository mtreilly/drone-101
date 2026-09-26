import { fmt, type T } from '../../core/i18n';
import { stepMetrics } from '../../math/metrics';
import { HOVER_THRUST } from '../../sim/drone-model';
import type { PlayModel } from '../../story/play';
import { budgetRadius, gainsFromPoles, zeroResponse } from './poles';

/** A pole pair −σ ± ωi, as in the playground: σ shown as a positive number after the printed "−". */
const sig = { min: 0.2, max: 8, step: 0.1, value: 2, digits: 1 };
const w = { min: 0, max: 8, step: 0.1, value: 4, digits: 1 };

/** Overshoot (%) of a zero at −z with the zero widget's poles −2 ± 3i, measured on a fine grid. */
export function zeroOvershoot(z: number): number {
  const t = Array.from({ length: 6001 }, (_, i) => i * 0.001);
  const f = zeroResponse(-z);
  return stepMetrics(t, t.map(f), 0, 1).overshoot;
}

/** Share left of a decaying mode e^{−a t}, as the dominant-pole sentence prints it. */
const left = (v: number, t: T) =>
  v < 0.01 ? t('almostNothing') : t('pct', { v: fmt(v, v < 1 ? 2 : 0) });

/** Models behind Chapter 8's playable sentences (`{ t: 'play', id }` blocks); pure maths, tested in Node. */
export const plays: Record<string, PlayModel> = {
  // "Poles at −{sig} ± {w}i: … settles in about {ts} s. One wiggle takes {period} s. The first peak … at {tp} s … overshoot of {os}."
  poleRead: {
    inputs: { sig, w },
    outputs: {
      ts: (v) => fmt(4 / v.sig, 1),
      period: (v, t) => (v.w === 0 ? t('noWiggle') : fmt((2 * Math.PI) / v.w, 2)),
      tp: (v, t) => (v.w === 0 ? t('never') : fmt(Math.PI / v.w, 2)),
      os: (v, t) => (v.w === 0 ? t('noOvershoot') : t('pct', { v: fmt(100 * Math.exp((-Math.PI * v.sig) / v.w), 0) })),
    },
  },
  // "To put the poles at −{sig} ± {w}i, the controller needs Kp = m(σ²+ω²) = {kp} N/m and c + Kd = 2mσ = {damp} N·s/m, so Kd = {kd} N·s/m. {note}"
  gains: {
    inputs: { sig, w },
    outputs: {
      kp: (v) => fmt(gainsFromPoles(-v.sig, v.w).kp, 1),
      damp: (v) => fmt(gainsFromPoles(-v.sig, v.w).damping, 2),
      kd: (v) => fmt(gainsFromPoles(-v.sig, v.w).kd, 2),
      note: (v, t) => (gainsFromPoles(-v.sig, v.w).kd < -1e-9 ? t('negKd') : ''),
    },
  },
  // "Real poles at −0.2 and −5. After {t} s, the fast motion e^{−5t} has {fast} of its start left, and the slow one e^{−0.2t} still has {slow}."
  dominant: {
    inputs: { time: { min: 0, max: 10, step: 1, value: 1, values: [0, 0.25, 0.5, 1, 2, 5, 10], unit: 's', format: (v) => fmt(v, v % 1 ? 2 : 0) } },
    outputs: {
      fast: (v, t) => left(100 * Math.exp(-5 * v.time), t),
      slow: (v, t) => left(100 * Math.exp(-0.2 * v.time), t),
    },
  },
  // "With the poles at {sig} that's {sum} N: {verdict}." — the little sum stays one text run (4.9 + Kp = peak)
  push: {
    inputs: { sig: { min: 1, max: 8, step: 0.5, value: 4, format: (v) => `−${fmt(v, 1)} ± ${fmt(v, 1)}i` } },
    outputs: {
      sum: (v) => {
        const kp = gainsFromPoles(-v.sig, v.sig).kp;
        return `${fmt(HOVER_THRUST, 1)} + ${fmt(kp, 1)} = ${fmt(HOVER_THRUST + kp, 1)}`;
      },
      verdict: (v, t) => {
        const p = HOVER_THRUST + gainsFromPoles(-v.sig, v.sig).kp;
        return t(p <= 20 ? 'canDo' : p <= 25 ? 'justOver' : 'farBeyond');
      },
    },
  },
  // "For a {dr} m step, the first push stays under 20 N only if the poles sit within {r} of 0, in any direction."
  budget: {
    inputs: { dr: { min: 0.25, max: 2, step: 0.25, value: 1, values: [0.25, 0.5, 1, 2], unit: 'm', format: (v) => fmt(v, v % 1 ? 2 : 0) } },
    outputs: { r: (v) => fmt(budgetRadius(v.dr), 2) },
  },
  // "With the zero at −{z}, the output is the no-zero curve plus {gain} × its slope, and it overshoots by {os} (12% without the zero)."
  zeroKick: {
    inputs: { z: { min: 0.3, max: 12, step: 0.1, value: 3, values: [0.3, 0.5, 1, 2, 3, 5, 8, 12], format: (v) => fmt(v, v % 1 ? 1 : 0) } },
    outputs: {
      gain: (v) => fmt(1 / v.z, 2),
      os: (v, t) => t('pct', { v: fmt(zeroOvershoot(v.z), 0) }),
    },
  },
};
