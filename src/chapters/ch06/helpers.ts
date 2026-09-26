import { type C, c } from '../../math/complex';
import { h, s as svgEl } from '../../core/dom';
import { fmt } from '../../core/i18n';
import { plainText } from '../../core/rich-text';
import { ICON } from '../../ui/controls';
import type { SPlane } from '../../ui/s-plane';
import './ch06.css';

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

/** Time after which a step response stays within `band` (a fraction) of the target 1. */
export function within(d: { xs: number[]; ys: number[] }, band: number): number {
  for (let i = d.ys.length - 1; i >= 0; i--) if (Math.abs(d.ys[i] - 1) > band) return d.xs[Math.min(d.xs.length - 1, i + 1)];
  return 0;
}

/** Marks a widget host so the chapter 6–8 polish styles apply only to these widgets. */
export const mark = (host: HTMLElement): void => host.classList.add('p68');

/** Small hand-lettered caption above a panel or view. */
export const caption = (text: string): HTMLElement => h('p', { class: 'w-cap' }, text);

/** Button with a leading icon (ICON.play etc.) and a text label. */
export function iconButton(icon: keyof typeof ICON, label: string, extraClass = ''): HTMLButtonElement {
  const b = h('button', { class: `btn small ${extraClass}`.trim(), type: 'button' });
  setIconLabel(b, icon, label);
  return b;
}

export function setIconLabel(b: HTMLButtonElement, icon: keyof typeof ICON, label: string): void {
  b.innerHTML = `${ICON[icon]}<span>${label.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]!)}</span>`;
}

/** A row of equations that sit side by side on wide screens and stack on narrow ones. */
export function eqRow(...blocks: HTMLElement[]): HTMLElement {
  return h('div', { class: 'eq-row' }, blocks);
}

/**
 * Keeps a display point inside the visible map. Returns the clamped value and whether it
 * had to be pulled in (the maths still uses the true value).
 */
export function clampToPlane(plane: SPlane, re: number, im: number): { re: number; im: number; off: boolean } {
  const { reMin, reMax, imMax } = plane.o;
  const pad = (reMax - reMin) * 0.02;
  const cr = Math.min(reMax - pad, Math.max(reMin + pad, re));
  const ci = Math.min(imMax - pad, Math.max(-imMax + pad, im));
  return { re: cr, im: ci, off: cr !== re || ci !== im };
}

/** A text label in a plane's decoration layer, positioned in s-coordinates with a pixel offset. */
export function planeLabel(plane: SPlane, cls = 'pt-note'): (text: string, re: number, im: number, dx?: number, dy?: number, anchor?: string) => void {
  const el = svgEl('text', { class: cls });
  plane.deco.append(el);
  return (text, re, im, dx = 0, dy = 0, anchor = 'middle') => {
    el.textContent = text;
    el.setAttribute('x', String(plane.sx(re) + dx));
    el.setAttribute('y', String(plane.sy(im) + dy));
    el.setAttribute('text-anchor', anchor);
    el.style.display = text ? '' : 'none';
  };
}

/** Gives radio options whose visible label is pure maths a plain-text accessible name. */
export function nameMathOptions(root: HTMLElement): void {
  root.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
    const label = root.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
    if (label?.querySelector('.katex')) input.setAttribute('aria-label', plainText(label));
  });
}
