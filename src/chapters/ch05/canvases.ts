import { h } from '../../core/dom';
import { canvasHandFont } from '../../core/font';
import { onThemeChange } from '../../core/theme';
import { color } from '../../ui/colors';
import { halo } from '../../ui/plane-canvas';

/**
 * Oblique 3-D view of e^(st): time runs to the right, the real part is up,
 * the "sideways" (imaginary) part goes into the page. The shadow on the back wall
 * (imaginary part squashed to zero) is the real signal we'd measure.
 */
export class SpiralCanvas {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private w = 400;
  private hgt = 230;
  private off: () => void;
  private ro: ResizeObserver;
  private last: { curves: { pts: [number, number, number][]; color: string; width: number; alpha?: number }[]; dot?: [number, number, number]; tMax: number } | null = null;

  constructor(host: HTMLElement, private labels: { aria: string; time: string; re: string; im: string; shadow: string }) {
    this.canvas = h('canvas', { role: 'img', 'aria-label': labels.aria });
    this.el = h('div', { style: { width: '100%' } }, this.canvas);
    host.append(this.el);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    this.off = onThemeChange(() => this.render());
    document.fonts?.ready.then(() => this.render());
    this.resize();
  }

  destroy(): void {
    this.ro.disconnect();
    this.off();
  }

  private resize(): void {
    const w = Math.max(220, Math.floor(this.el.clientWidth || 400));
    this.w = w;
    this.hgt = Math.round(Math.min(260, Math.max(180, w * 0.5)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(this.hgt * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${this.hgt}px`;
    this.render();
  }

  /** amplitude that fills the view (1 for circles, up to 3 for growing spirals) */
  private amp = 1;

  /** (t, re, im) → screen, oblique projection: "sideways" recedes up and to the right. */
  private proj(t: number, re: number, im: number, tMax: number): [number, number] {
    const left = 36;
    const right = this.w - 16;
    const unit = (this.hgt / 2 - 24) / this.amp;
    const depth = Math.min(0.9, (this.w * 0.2) / (this.hgt / 2)) * unit;
    const x = left + (t / tMax) * (right - left - depth * this.amp * 0.8) + im * depth * 0.75;
    const y = this.hgt / 2 - re * unit * 0.8 - im * depth * 0.4;
    return [x, y];
  }

  draw(curves: { pts: [number, number, number][]; color: string; width: number; alpha?: number }[], tMax: number, dot?: [number, number, number]): void {
    this.last = { curves, tMax, dot };
    let m = 1;
    for (const cv of curves) for (const [, re, im] of cv.pts) m = Math.max(m, Math.hypot(re, im));
    this.amp = Math.min(3, m);
    this.render();
  }

  private render(): void {
    const ctx = this.canvas.getContext('2d')!;
    const dpr = this.canvas.width / this.w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.hgt);
    if (!this.last) return;
    const { curves, tMax, dot } = this.last;
    const P = (t: number, re: number, im: number) => this.proj(t, re, im, tMax);
    ctx.strokeStyle = color('ink');
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    let [x, y] = P(0, 0, 0);
    ctx.moveTo(x, y);
    [x, y] = P(tMax, 0, 0);
    ctx.lineTo(x, y);
    const A = this.amp * 1.15;
    [x, y] = P(0, -A, 0);
    ctx.moveTo(x, y);
    [x, y] = P(0, A, 0);
    ctx.lineTo(x, y);
    [x, y] = P(0, 0, -A);
    ctx.moveTo(x, y);
    [x, y] = P(0, 0, A);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.font = canvasHandFont(15);
    const ink2 = color('ink2');
    [x, y] = P(tMax, 0, 0);
    halo(ctx, this.labels.time, x, y + 18, 'right', ink2);
    [x, y] = P(0, A, 0);
    halo(ctx, this.labels.re, x + 6, y + 12, 'left', ink2);
    [x, y] = P(0, 0, A);
    halo(ctx, this.labels.im, x + 6, y - 4, 'left', ink2);
    for (const cv of curves) {
      ctx.strokeStyle = color(cv.color);
      ctx.globalAlpha = cv.alpha ?? 1;
      ctx.lineWidth = cv.width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      cv.pts.forEach(([t, re, im], i) => {
        const [px, py] = P(t, Math.max(-3.2, Math.min(3.2, re)), Math.max(-3.2, Math.min(3.2, im)));
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (dot) {
      const [px, py] = P(dot[0], dot[1], dot[2]);
      const [sx, sy] = P(dot[0], dot[1], 0);
      ctx.strokeStyle = color('ink3');
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color('ink');
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color('out');
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
