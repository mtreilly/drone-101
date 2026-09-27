import { color, withAlpha } from '../../ui/colors';
import type { Plot } from '../../ui/plot';

/** How far in time the probe plots run (s). */
export const PROBE_T = 8;

/** Draws the product f·e^(−st) and shades its area up to `upTo` on a Plot overlay. */
export function shadeOverlay(plot: Plot, fn: () => ((t: number) => number) | null, upTo: () => number): void {
  plot.overlay = (ctx, px, py) => {
    const g = fn();
    if (!g) return;
    const tEnd = upTo();
    const pos = withAlpha(color('ink3'), 0.32);
    const neg = withAlpha(color('ink3'), 0.14);
    const n = 240;
    for (const sign of [1, -1]) {
      ctx.fillStyle = sign > 0 ? pos : neg;
      ctx.beginPath();
      ctx.moveTo(px(0), py(0));
      for (let i = 0; i <= n; i++) {
        const t = (tEnd * i) / n;
        const v = g(t);
        ctx.lineTo(px(t), py(sign > 0 ? Math.max(0, v) : Math.min(0, v)));
      }
      ctx.lineTo(px(tEnd), py(0));
      ctx.closePath();
      ctx.fill();
    }
  };
}
