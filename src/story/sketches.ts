import { s } from '../core/dom';

/**
 * Small pencil sketches of response shapes, used as answer options in predict cards
 * ("which curve do you expect?"). Each is a function y(x) on x ∈ [0, 1], y ∈ [0, 1].
 */
const shapes: Record<string, { f: (x: number) => number; target?: number }> = {
  overshoot: { f: (x) => 0.7 * (1 - Math.exp(-6 * x) * (Math.cos(14 * x) + 0.43 * Math.sin(14 * x))), target: 0.7 },
  sluggish: { f: (x) => 0.7 * (1 - Math.exp(-2.5 * x)), target: 0.7 },
  smooth: { f: (x) => 0.7 * (1 - (1 + 8 * x) * Math.exp(-8 * x)), target: 0.7 },
  droop: { f: (x) => 0.45 * (1 - Math.exp(-6 * x) * Math.cos(10 * x)), target: 0.7 },
  'growing-wiggle': { f: (x) => 0.5 + 0.08 * Math.exp(2.8 * x) * Math.sin(22 * x) },
  'decaying-wiggle': { f: (x) => 0.5 + 0.42 * Math.exp(-3.2 * x) * Math.cos(22 * x) },
  'steady-wiggle': { f: (x) => 0.5 + 0.35 * Math.cos(22 * x) },
  'decaying-plain': { f: (x) => 0.1 + 0.8 * Math.exp(-4 * x) },
  'growing-plain': { f: (x) => 0.1 + 0.05 * Math.exp(4.5 * x) },
  flat: { f: () => 0.5 },
  'sink-stop': { f: (x) => 0.75 - 0.25 * (1 - Math.exp(-6 * x)) },
  'sink-crash': { f: (x) => Math.max(0.05, 0.75 - 0.9 * x) },
  'swing-worse': { f: (x) => 0.5 + 0.1 * Math.exp(2.2 * x) * Math.sin(16 * x), target: 0.5 },
  'swing-better': { f: (x) => 0.5 - 0.4 * Math.exp(-4 * x) * Math.cos(12 * x), target: 0.5 },
  'no-change': { f: () => 0.3 },
  'jump-then-stay': { f: (x) => (x < 0.2 ? 0.2 : 0.75) },
  'delay-then-rise': { f: (x) => (x < 0.35 ? 0.2 : 0.2 + 0.55 * (1 - Math.exp(-10 * (x - 0.35)))) },
};

export const hasSketch = (name: string): boolean => name in shapes;

export function sketch(name: string): SVGSVGElement {
  const shape = shapes[name] ?? shapes.flat;
  const W = 150;
  const H = 70;
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = i / 80;
    const y = Math.max(0, Math.min(1, shape.f(x)));
    // tiny deterministic wobble so it looks hand-drawn
    const wob = Math.sin(i * 1.7) * 0.6;
    pts.push(`${(6 + x * (W - 12)).toFixed(1)},${(H - 6 - y * (H - 12) + wob).toFixed(1)}`);
  }
  const svg = s(
    'svg',
    { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', class: 'sketch' },
    s('path', { d: `M6 ${H - 6} H${W - 4} M6 ${H - 6} V4`, stroke: 'var(--ink-3)', 'stroke-width': 1.2, fill: 'none' }),
    shape.target !== undefined
      ? s('line', {
          x1: 6,
          x2: W - 6,
          y1: H - 6 - shape.target * (H - 12),
          y2: H - 6 - shape.target * (H - 12),
          stroke: 'var(--c-setpoint)',
          'stroke-dasharray': '5 4',
          'stroke-width': 1.5,
        })
      : null,
    s('polyline', {
      points: pts.join(' '),
      fill: 'none',
      stroke: 'var(--c-output)',
      'stroke-width': 2.2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  );
  return svg;
}
