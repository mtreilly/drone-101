import { h } from '../../core/dom';
import { onThemeChange } from '../../core/theme';
import { color } from '../../ui/colors';

export type Pt = [number, number];

export type Item =
  | { kind: 'arrow'; from?: Pt; to: Pt; color: string; width?: number; label?: string; dash?: number[] }
  | { kind: 'circle'; r: number; color: string; dash?: number[] }
  | { kind: 'dot'; at: Pt; color: string; r?: number; label?: string; ring?: boolean; labelAt?: 'below' | 'above' | 'right' }
  | { kind: 'path'; pts: Pt[]; color: string; width?: number; dash?: number[]; alpha?: number }
  | { kind: 'line'; from: Pt; to: Pt; color: string; dash?: number[]; width?: number };

/** Square canvas of the complex plane ("real" across, "sideways" up) for arrows, circles and trails. */
export class PlaneCanvas {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private items: Item[] = [];
  private size = 300;
  private off: () => void;
  private ro: ResizeObserver;

  constructor(
    host: HTMLElement,
    private o: { extent: number; label: string; reLabel: string; imLabel: string; maxWidth?: number },
  ) {
    this.canvas = h('canvas', { role: 'img', 'aria-label': o.label });
    this.el = h('div', { style: { maxWidth: `${o.maxWidth ?? 340}px`, margin: '0 auto', width: '100%' } }, this.canvas);
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
    const w = Math.max(160, Math.floor(this.el.clientWidth || 300));
    this.size = w;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(w * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${w}px`;
    this.render();
  }

  private X = (x: number) => this.size / 2 + (x / this.o.extent) * (this.size / 2 - 14);
  private Y = (y: number) => this.size / 2 - (y / this.o.extent) * (this.size / 2 - 14);

  draw(items: Item[]): void {
    this.items = items;
    this.render();
  }

  private render(): void {
    const ctx = this.canvas.getContext('2d')!;
    const dpr = this.canvas.width / this.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.size, this.size);
    const { extent } = this.o;
    // grid
    ctx.strokeStyle = color('ink3');
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1;
    for (let k = -Math.floor(extent); k <= extent; k++) {
      if (k === 0) continue;
      ctx.beginPath();
      ctx.moveTo(this.X(k), 0);
      ctx.lineTo(this.X(k), this.size);
      ctx.moveTo(0, this.Y(k));
      ctx.lineTo(this.size, this.Y(k));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color('ink');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, this.Y(0));
    ctx.lineTo(this.size - 4, this.Y(0));
    ctx.moveTo(this.X(0), 4);
    ctx.lineTo(this.X(0), this.size - 4);
    ctx.stroke();
    ctx.font = '13px "Patrick Hand", cursive';
    ctx.fillStyle = color('ink3');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    // tick labels sit below the axis; skip ±1 on small planes where the unit circle crosses
    const step = extent > 4 ? 2 : 1;
    for (let k = -Math.floor(extent); k <= extent; k += 1) {
      if (k === 0 || k % step) continue;
      if (extent < 3 && Math.abs(k) === 1) continue;
      ctx.fillText(String(k).replace('-', '−'), this.X(k), this.Y(0) + 5);
    }
    ctx.font = '15px "Patrick Hand", cursive';
    ctx.textBaseline = 'alphabetic';
    halo(ctx, this.o.reLabel, this.size - 6, this.Y(0) - 8, 'right', color('ink2'));
    halo(ctx, this.o.imLabel, this.X(0) + 7, 16, 'left', color('ink2'));

    for (const it of this.items) {
      const col = color(it.color);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.setLineDash([]);
      if (it.kind === 'circle') {
        ctx.lineWidth = 1.5;
        ctx.setLineDash(it.dash ?? [4, 4]);
        ctx.beginPath();
        ctx.arc(this.X(0), this.Y(0), this.X(it.r) - this.X(0), 0, Math.PI * 2);
        ctx.stroke();
      } else if (it.kind === 'path' || it.kind === 'line') {
        const pts = it.kind === 'line' ? [it.from, it.to] : it.pts;
        if (pts.length < 2) continue;
        ctx.globalAlpha = it.kind === 'path' ? (it.alpha ?? 1) : 1;
        ctx.lineWidth = it.width ?? 2;
        ctx.setLineDash(it.dash ?? []);
        ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(this.X(x), this.Y(y)) : ctx.moveTo(this.X(x), this.Y(y))));
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (it.kind === 'dot') {
        ctx.beginPath();
        ctx.arc(this.X(it.at[0]), this.Y(it.at[1]), it.r ?? 5, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        if (it.ring) ctx.stroke();
        else ctx.fill();
        if (it.label) {
          const X = this.X(it.at[0]);
          const Y = this.Y(it.at[1]);
          const r = (it.r ?? 5) + 5;
          if (it.labelAt === 'below') labelAt(ctx, it.label, X, Y + r, 0, 1, col);
          else if (it.labelAt === 'above') labelAt(ctx, it.label, X, Y - r, 0, -1, col);
          else labelAt(ctx, it.label, X + r, Y - r, 1, -1, col);
        }
      } else if (it.kind === 'arrow') {
        const [x0, y0] = it.from ?? [0, 0];
        const [x1, y1] = it.to;
        const X0 = this.X(x0);
        const Y0 = this.Y(y0);
        const X1 = this.X(x1);
        const Y1 = this.Y(y1);
        ctx.lineWidth = it.width ?? 3;
        ctx.lineCap = 'round';
        ctx.setLineDash(it.dash ?? []);
        ctx.beginPath();
        ctx.moveTo(X0, Y0);
        ctx.lineTo(X1, Y1);
        ctx.stroke();
        ctx.setLineDash([]);
        const len = Math.hypot(X1 - X0, Y1 - Y0);
        if (len > 4) {
          const a = Math.atan2(Y1 - Y0, X1 - X0);
          const hs = Math.min(11, len * 0.5);
          ctx.beginPath();
          ctx.moveTo(X1 - hs * Math.cos(a - 0.45), Y1 - hs * Math.sin(a - 0.45));
          ctx.lineTo(X1, Y1);
          ctx.lineTo(X1 - hs * Math.cos(a + 0.45), Y1 - hs * Math.sin(a + 0.45));
          ctx.stroke();
        }
        if (it.label && len > 1) {
          // put the label just beyond the arrow tip, in the arrow's own direction
          const dx = (X1 - X0) / len;
          const dy = (Y1 - Y0) / len;
          labelAt(ctx, it.label, X1 + dx * 10, Y1 + dy * 10, dx, dy, col);
        }
      }
    }
  }
}

/** Text with a paper-coloured halo so it stays readable over grid lines and curves. */
function halo(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: CanvasTextAlign, fill: string): void {
  ctx.save();
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = color('card');
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Places a label next to (x, y), pushed away in direction (dx, dy) so it never sits on the mark. */
function labelAt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, dx: number, dy: number, fill: string): void {
  ctx.save();
  ctx.font = '16px "Patrick Hand", cursive';
  ctx.textBaseline = dy > 0.35 ? 'top' : dy < -0.35 ? 'bottom' : 'middle';
  const align: CanvasTextAlign = dx > 0.35 ? 'left' : dx < -0.35 ? 'right' : 'center';
  halo(ctx, text, x, y, align, fill);
  ctx.restore();
}

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
    ctx.font = '15px "Patrick Hand", cursive';
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
