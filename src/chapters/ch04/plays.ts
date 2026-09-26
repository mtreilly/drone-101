import { fmt } from '../../core/i18n';
import type { PlayModel } from '../../story/play';
import { compound, powerChain } from './models';

/** Fewest decimals (up to `max`) that show v exactly; otherwise `max` decimals. */
export function nice(v: number, max = 3): string {
  for (let d = 0; d < max; d++) if (Math.abs(Number(v.toFixed(d)) - v) < 1e-9) return fmt(v, d);
  return fmt(v, max);
}

const exact = (v: number, max = 3) => Math.abs(Number(v.toFixed(max)) - v) < 1e-9;

export const plays: Record<string, PlayModel> = {
  // "Doubling every second, after {n} s you have {2 × 2 × 2 = 8}."
  doubling: {
    inputs: { n: { min: -2, max: 4, step: 0.5, value: 3, unit: 's', format: (v) => nice(v, 1) } },
    outputs: {
      // one output, so the whole little equation stays in reading order in right-to-left text
      chain: ({ n }) => `${powerChain(n)} ${exact(2 ** n) ? '=' : '≈'} ${nice(2 ** n)}`,
    },
  },
  // "With {n} steps of {pct}% each, one second of growth gives {total}."
  compound: {
    inputs: { n: { min: 1, max: 100000, step: 1, value: 4, values: [1, 2, 3, 4, 6, 12, 52, 100, 365, 1000, 100000] } },
    outputs: {
      pct: ({ n }) => nice(100 / n, 3),
      total: ({ n }) => nice(compound(n), 5),
    },
  },
  // "With a = {a} per second, every second multiplies the curve by {ea}."
  rate: {
    inputs: { a: { min: -2, max: 2, step: 0.1, value: 1, unit: '1/s' } },
    outputs: { ea: ({ a }) => nice(Math.exp(a), 3) },
  },
  // "Base {b} is e raised to the power {lnb}."
  base: {
    inputs: { b: { min: 0.2, max: 5, step: 0.1, value: 2, format: (v) => nice(v, 1) } },
    outputs: { lnb: ({ b }) => nice(Math.log(b), 3) },
  },
};
