import type { Plot } from '../../ui/plot';
import './polish.css';

/**
 * Lets the learner scrub a time cursor by dragging anywhere on a (linear-x) plot.
 * Horizontal drags scrub; vertical swipes still scroll the page on touch screens.
 * Updates are coalesced to one per animation frame. Keyboard users use the paired slider.
 */
export function dragX(plot: Plot, onX: (x: number) => void): void {
  const canvas = plot.el.querySelector('canvas');
  if (!canvas) return;
  canvas.classList.add('scrub');
  canvas.style.touchAction = 'pan-y';
  const toX = (clientX: number) => {
    const r = canvas.getBoundingClientRect();
    const { min, max } = plot.opts.x;
    const a = plot.px(min);
    const b = plot.px(max);
    const f = (clientX - r.left - a) / (b - a);
    return Math.min(max, Math.max(min, min + f * (max - min)));
  };
  let pointer: number | null = null;
  let pending: number | null = null;
  let raf = 0;
  const flush = () => {
    raf = 0;
    if (pending !== null) onX(toX(pending));
    pending = null;
  };
  const queue = (clientX: number) => {
    pending = clientX;
    if (!raf) raf = requestAnimationFrame(flush);
  };
  canvas.addEventListener('pointerdown', (ev) => {
    if (pointer !== null || ev.button > 0) return; // ignore extra fingers mid-drag
    pointer = ev.pointerId;
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch {
      /* synthetic or already-released pointer */
    }
    canvas.classList.add('scrubbing');
    onX(toX(ev.clientX));
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerId === pointer) queue(ev.clientX);
  });
  const end = (ev: PointerEvent) => {
    if (ev.pointerId !== pointer) return;
    pointer = null;
    canvas.classList.remove('scrubbing');
    if (raf) {
      cancelAnimationFrame(raf);
      flush();
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

/** Index of the sample nearest to x in a uniformly sampled array. */
export const nearest = (xs: number[], x: number): number => {
  const dt = xs[1] - xs[0];
  return Math.max(0, Math.min(xs.length - 1, Math.round((x - xs[0]) / dt)));
};
