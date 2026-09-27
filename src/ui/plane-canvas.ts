import { canvasBidi } from '../core/bidi';
import { h } from '../core/dom';
import { canvasHandFont } from '../core/font';
import { isRtl } from '../core/i18n';
import { onThemeChange } from '../core/theme';
import { color } from './colors';

export type Pt = [number, number];

export type Item =
  | { kind: 'arrow'; from?: Pt; to: Pt; color: string; width?: number; label?: string; dash?: number[] }
  | { kind: 'circle'; r: number; color: string; dash?: number[] }
  | { kind: 'dot'; at: Pt; color: string; r?: number; label?: string; ring?: boolean; labelAt?: 'below' | 'above' | 'right' }
  | { kind: 'path'; pts: Pt[]; color: string; width?: number; dash?: number[]; alpha?: number }
  | { kind: 'line'; from: Pt; to: Pt; color: string; dash?: number[]; width?: number }
  /** an angle marked at the origin, from angle `from` to `to` (radians, anticlockwise positive) */
  | { kind: 'arc'; r: number; from: number; to: number; color: string; label?: string };

/** Square canvas of the complex plane (shared by the chapters that draw arrows: 5, 6 and 8) ("real" across, "sideways" up) for arrows, circles and trails. */
export class PlaneCanvas {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private items: Item[] = [];
  private size = 300;
  private off: () => void;
  private ro: ResizeObserver;

  constructor(
    host: HTMLElement,
    private o: { extent: number; label: string; reLabel: string; imLabel: string; maxWidth?: number; center?: Pt },
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

  /** the view is a square `extent` either side of `center` (the origin unless given) */
  private X = (x: number) => this.size / 2 + ((x - (this.o.center?.[0] ?? 0)) / this.o.extent) * (this.size / 2 - 14);
  private Y = (y: number) => this.size / 2 - ((y - (this.o.center?.[1] ?? 0)) / this.o.extent) * (this.size / 2 - 14);

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
    const [cx, cy] = this.o.center ?? [0, 0];
    const lo = Math.ceil(Math.min(cx, cy) - extent);
    const hi = Math.floor(Math.max(cx, cy) + extent);
    // grid
    ctx.strokeStyle = color('ink3');
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1;
    for (let k = lo; k <= hi; k++) {
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
    ctx.font = canvasHandFont(13);
    ctx.fillStyle = color('ink3');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    // tick numbers read left to right on every page ("−2", never "2−" on a right-to-left page)
    ctx.direction = 'ltr';
    // tick labels sit below the axis; skip ±1 on small planes where the unit circle crosses
    const step = extent > 4 ? 2 : 1;
    for (let k = Math.ceil(cx - extent); k <= cx + extent; k += 1) {
      if (k === 0 || k % step) continue;
      if (extent < 3 && Math.abs(k) === 1) continue;
      ctx.fillText(String(k).replace('-', '−'), this.X(k), this.Y(0) + 5);
    }
    ctx.font = canvasHandFont(15);
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
      } else if (it.kind === 'arc') {
        const R = this.X(it.r) - this.X(0);
        if (Math.abs(it.to - it.from) < 1e-3) continue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // canvas y points down, so an anticlockwise maths angle is a negative canvas angle
        ctx.arc(this.X(0), this.Y(0), R, -it.from, -it.to, it.to > it.from);
        ctx.stroke();
        if (it.label) {
          const mid = (it.from + it.to) / 2;
          labelAt(ctx, it.label, this.X(0) + (R + 8) * Math.cos(mid), this.Y(0) - (R + 8) * Math.sin(mid), Math.cos(mid), -Math.sin(mid), col);
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
export function halo(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: CanvasTextAlign, fill: string): void {
  ctx.save();
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = color('card');
  const run = canvasBidi(ctx, text, isRtl());
  ctx.strokeText(run, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(run, x, y);
  ctx.restore();
}

/** Places a label next to (x, y), pushed away in direction (dx, dy) so it never sits on the mark. */
function labelAt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, dx: number, dy: number, fill: string): void {
  ctx.save();
  ctx.font = canvasHandFont(16);
  ctx.textBaseline = dy > 0.35 ? 'top' : dy < -0.35 ? 'bottom' : 'middle';
  const align: CanvasTextAlign = dx > 0.35 ? 'left' : dx < -0.35 ? 'right' : 'center';
  halo(ctx, text, x, y, align, fill);
  ctx.restore();
}
