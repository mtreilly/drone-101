import { type C, c } from '../../math/complex';
import { fmt } from '../../core/i18n';

/** Calls `fn` once at the start of each slider interaction (pointer press or a fresh key press). Used to snapshot ghosts. */
export function onInteractStart(el: HTMLElement, fn: () => void): void {
  let lastKey = 0;
  el.addEventListener('pointerdown', fn);
  el.addEventListener('keydown', () => {
    const now = performance.now();
    if (now - lastKey > 700) fn();
    lastKey = now;
  });
}

/** Samples f on [0, t1] with n intervals. */
export function sample(f: (t: number) => number, t1: number, n = 400): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (t1 * i) / n;
    xs.push(t);
    ys.push(f(t));
  }
  return { xs, ys };
}

/** Roots of s² + 2ζωn·s + ωn²: s = −ζωn ± ωn√(ζ² − 1). */
export function secondOrderRoots(wn: number, zeta: number): [C, C] {
  const re = -zeta * wn;
  const d = zeta * zeta - 1;
  if (d < 0) {
    const im = wn * Math.sqrt(-d);
    return [c(re, im), c(re, -im)];
  }
  const sq = wn * Math.sqrt(d);
  return [c(re + sq), c(re - sq)];
}

/** "−1.00 + 6.24i" */
export function fmtC(z: C, digits = 2): string {
  if (Math.abs(z.im) < 1e-9) return fmt(z.re, digits);
  return `${fmt(z.re, digits)} ${z.im >= 0 ? '+' : '−'} ${fmt(Math.abs(z.im), digits)}i`;
}

/** Regime of a damping ratio. */
export const regime = (zeta: number): 'under' | 'critical' | 'over' =>
  Math.abs(zeta - 1) < 0.005 ? 'critical' : zeta < 1 ? 'under' : 'over';

/** 2% settling time from samples (NaN if it never settles within the window). */
export function settling(xs: number[], ys: number[], target: number, size: number): number {
  const tol = 0.02 * Math.abs(size);
  for (let i = ys.length - 1; i >= 0; i--) {
    if (Math.abs(ys[i] - target) > tol) return i === ys.length - 1 ? NaN : xs[i + 1];
  }
  return 0;
}

/** Readout labels are upper-cased by the shared CSS, which mangles Greek letters; keep them as written. */
export function keepCase(el: HTMLElement): HTMLElement {
  const l = el.querySelector<HTMLElement>('.readout-label');
  if (l) l.style.textTransform = 'none';
  return el;
}
