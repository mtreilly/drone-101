import type { Plot } from '../../ui/plot';

/**
 * Lets the learner drag a time cursor directly on a (linear-x) plot.
 * Calls `onX` with the data x under the pointer. Keyboard users use the paired slider.
 */
export function dragX(plot: Plot, onX: (x: number) => void): void {
  const canvas = plot.el.querySelector('canvas');
  if (!canvas) return;
  canvas.style.cursor = 'ew-resize';
  canvas.style.touchAction = 'none';
  const toX = (ev: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const { min, max } = plot.opts.x;
    const a = plot.px(min);
    const b = plot.px(max);
    const f = (ev.clientX - r.left - a) / (b - a);
    return Math.min(max, Math.max(min, min + f * (max - min)));
  };
  let dragging = false;
  canvas.addEventListener('pointerdown', (ev) => {
    dragging = true;
    canvas.setPointerCapture(ev.pointerId);
    onX(toX(ev));
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (dragging) onX(toX(ev));
  });
  const end = () => (dragging = false);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

/** Index of the sample nearest to x in a uniformly sampled array. */
export const nearest = (xs: number[], x: number): number => {
  const dt = xs[1] - xs[0];
  return Math.max(0, Math.min(xs.length - 1, Math.round((x - xs[0]) / dt)));
};
