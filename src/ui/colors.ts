import { cssVar } from '../core/dom';

/** Semantic colour keys of the course's colour language. */
export type ColorKey = 'sp' | 'out' | 'err' | 'eff' | 'dis' | 'ink' | 'ink2' | 'ink3' | 'pencil' | 'paper' | 'card' | 'pole' | 'good' | 'bad';

const VARS: Record<ColorKey, string> = {
  sp: '--c-setpoint',
  out: '--c-output',
  err: '--c-error',
  eff: '--c-effort',
  dis: '--c-disturb',
  ink: '--ink',
  ink2: '--ink-2',
  ink3: '--ink-3',
  pencil: '--pencil',
  paper: '--paper',
  card: '--card',
  pole: '--c-pole',
  good: '--c-good',
  bad: '--c-bad',
};

/** Resolves a colour key (or passes through a literal CSS colour). */
export function color(key: ColorKey | string): string {
  return key in VARS ? cssVar(VARS[key as ColorKey]) : key;
}

/** Same colour with alpha, for canvas fills. Works for #rrggbb values. */
export function withAlpha(c: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return c;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * Colour for a water temperature (cold blue → neutral → hot red), used only for the water
 * itself. Deliberately avoids green, which means "setpoint" everywhere else.
 */
export function tempColor(t: number): string {
  const f = Math.min(1, Math.max(0, (t - 15) / 45));
  const stops: [number, number, number][] = [
    [52, 120, 230],
    [200, 190, 175],
    [225, 60, 45],
  ];
  const k = f < 0.5 ? 0 : 1;
  const g = f < 0.5 ? f / 0.5 : (f - 0.5) / 0.5;
  const [a, b] = [stops[k], stops[k + 1]];
  const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * g);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}
