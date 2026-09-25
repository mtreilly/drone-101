import rough from 'roughjs';
import { h } from '../core/dom';
import { fmt } from '../core/i18n';
import { onThemeChange } from '../core/theme';
import { type ColorKey, color, withAlpha } from './colors';

export interface Axis {
  label: string;
  min: number;
  max: number;
  /** explicit tick positions (otherwise "nice" ticks) */
  ticks?: number[];
  digits?: number;
  /** logarithmic axis (for Bode plots) */
  log?: boolean;
}

export interface SeriesDef {
  id: string;
  color: ColorKey | string;
  width?: number;
  dash?: number[];
  /** accessible/legend name */
  label?: string;
  /** keep a faint ghost of the previous run */
  ghost?: boolean;
  /** draw as dots instead of a line */
  dots?: boolean;
}

export interface PlotOptions {
  x: Axis;
  y: Axis;
  series: SeriesDef[];
  /** CSS height in px (width follows the container) */
  height?: number;
  /** accessible name of the figure */
  label: string;
  /** shade between two series (e.g. the error between setpoint and output) */
  fillBetween?: [string, string, ColorKey | string];
  legend?: boolean;
}

interface Series extends SeriesDef {
  xs: number[];
  ys: number[];
  gx: number[] | null;
  gy: number[] | null;
}

interface Line {
  kind: 'h' | 'v';
  at: number;
  color: ColorKey | string;
  dash?: number[];
  label?: string;
  width?: number;
}

interface Band {
  kind: 'h' | 'v';
  from: number;
  to: number;
  color: string;
  label?: string;
}

export interface Marker {
  x: number;
  y: number;
  color: ColorKey | string;
  label?: string;
  shape?: 'dot' | 'ring' | 'cross';
}

const PAD = { l: 54, r: 14, t: 14, b: 42 };

/** Canvas time/xy plot with sketchy axes, live data, ghost traces and a pencil "guess" layer. */
export class Plot {
  readonly el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private axesLayer: HTMLCanvasElement;
  private series = new Map<string, Series>();
  private lines: Line[] = [];
  private bands: Band[] = [];
  private markers: Marker[] = [];
  private cursorX: number | null = null;
  private guess: { x: number; y: number }[] = [];
  private sketching = false;
  private onSketch: ((pts: { x: number; y: number }[]) => void) | null = null;
  private w = 300;
  private hgt: number;
  /** requested height; narrow screens get a slightly shorter plot so controls stay in view */
  private baseH: number;
  private dirty = true;
  private axesDirty = true;
  private raf = 0;
  private desc: HTMLElement;
  private disposers: (() => void)[] = [];
  /** extra draw callback in data coordinates, e.g. tangent lines or shaded areas */
  overlay: ((ctx: CanvasRenderingContext2D, px: (x: number) => number, py: (y: number) => number) => void) | null = null;

  constructor(host: HTMLElement, public opts: PlotOptions) {
    this.baseH = opts.height ?? 220;
    this.hgt = this.baseH;
    this.canvas = h('canvas', { role: 'img', 'aria-label': opts.label });
    this.axesLayer = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.desc = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
    const legend = opts.legend === false ? null : this.buildLegend();
    this.el = h('figure', { class: 'plot' }, legend, this.canvas, this.desc);
    host.append(this.el);
    for (const s of opts.series) this.series.set(s.id, { ...s, xs: [], ys: [], gx: null, gy: null });
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.el);
    this.disposers.push(() => ro.disconnect());
    this.disposers.push(onThemeChange(() => this.invalidate(true)));
    // canvas text is rasterised immediately, so redraw once the web fonts arrive
    document.fonts?.ready.then(() => this.invalidate(true));
    this.resize();
  }

  private buildLegend(): HTMLElement | null {
    const items = this.opts.series.filter((s) => s.label);
    if (!items.length) return null;
    return h(
      'figcaption',
      { class: 'plot-legend' },
      items.map((s) =>
        h(
          'span',
          { class: 'plot-legend-item' },
          h('i', {
            style: {
              borderTop: `3px ${s.dash ? 'dashed' : 'solid'} ${s.color.startsWith('#') ? s.color : `var(--${cssName(s.color)})`}`,
            },
          }),
          s.label,
        ),
      ),
    );
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.disposers.forEach((d) => d());
    this.el.remove();
  }

  private resize(): void {
    const w = Math.max(200, Math.floor(this.el.clientWidth));
    if (w === this.w && this.canvas.width) return;
    this.w = w;
    this.hgt = w < 480 ? Math.max(140, Math.round(this.baseH * 0.78)) : this.baseH;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [this.canvas, this.axesLayer]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(this.hgt * dpr);
    }
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${this.hgt}px`;
    this.invalidate(true);
  }

  setHeight(px: number): void {
    this.baseH = px;
    this.w = 0;
    this.resize();
  }

  /** Requests a redraw on the next frame. */
  invalidate(axes = false): void {
    if (axes) this.axesDirty = true;
    this.dirty = true;
    if (!this.raf) this.raf = requestAnimationFrame(() => this.render());
  }

  // ---------- coordinate transforms ----------
  px = (x: number): number => {
    const { min, max, log } = this.opts.x;
    const f = log ? (Math.log10(x) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) : (x - min) / (max - min);
    return PAD.l + f * (this.w - PAD.l - PAD.r);
  };
  py = (y: number): number => {
    const { min, max, log } = this.opts.y;
    const f = log ? (Math.log10(y) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) : (y - min) / (max - min);
    return this.hgt - PAD.b - f * (this.hgt - PAD.t - PAD.b);
  };
  private ix = (px: number): number => {
    const { min, max, log } = this.opts.x;
    const f = (px - PAD.l) / (this.w - PAD.l - PAD.r);
    return log ? 10 ** (Math.log10(min) + f * (Math.log10(max) - Math.log10(min))) : min + f * (max - min);
  };
  private iy = (py: number): number => {
    const { min, max } = this.opts.y;
    const f = (this.hgt - PAD.b - py) / (this.hgt - PAD.t - PAD.b);
    return min + f * (max - min);
  };

  // ---------- data API ----------
  set(id: string, xs: ArrayLike<number>, ys: ArrayLike<number>): void {
    const s = this.series.get(id);
    if (!s) return;
    s.xs = Array.from(xs);
    s.ys = Array.from(ys);
    this.invalidate();
  }

  push(id: string, x: number, y: number): void {
    const s = this.series.get(id);
    if (!s) return;
    s.xs.push(x);
    s.ys.push(y);
    this.invalidate();
  }

  /** Samples a function across the x range. */
  fn(id: string, f: (x: number) => number, n = 400): void {
    const { min, max, log } = this.opts.x;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= n; i++) {
      const x = log ? 10 ** (Math.log10(min) + ((Math.log10(max) - Math.log10(min)) * i) / n) : min + ((max - min) * i) / n;
      xs.push(x);
      ys.push(f(x));
    }
    this.set(id, xs, ys);
  }

  last(id: string): { x: number; y: number } | null {
    const s = this.series.get(id);
    if (!s || !s.xs.length) return null;
    return { x: s.xs[s.xs.length - 1], y: s.ys[s.ys.length - 1] };
  }

  data(id: string): { xs: number[]; ys: number[] } {
    const s = this.series.get(id);
    return { xs: s?.xs ?? [], ys: s?.ys ?? [] };
  }

  /** Copies current data of ghost-enabled series into their ghost, then clears them. */
  clear(keepGhost = true): void {
    for (const s of this.series.values()) {
      if (keepGhost && s.ghost && s.xs.length > 1) {
        s.gx = s.xs;
        s.gy = s.ys;
      }
      s.xs = [];
      s.ys = [];
    }
    this.invalidate();
  }

  clearGhosts(): void {
    for (const s of this.series.values()) s.gx = s.gy = null;
    this.invalidate();
  }

  setLines(lines: Line[]): void {
    this.lines = lines;
    this.invalidate();
  }
  setBands(bands: Band[]): void {
    this.bands = bands;
    this.invalidate();
  }
  setMarkers(markers: Marker[]): void {
    this.markers = markers;
    this.invalidate();
  }
  setCursor(x: number | null): void {
    this.cursorX = x;
    this.invalidate();
  }

  setX(min: number, max: number): void {
    this.opts.x.min = min;
    this.opts.x.max = max;
    this.invalidate(true);
  }
  setY(min: number, max: number): void {
    this.opts.y.min = min;
    this.opts.y.max = max;
    this.invalidate(true);
  }

  describe(text: string): void {
    if (this.desc.textContent !== text) this.desc.textContent = text;
  }

  // ---------- pencil guess ----------
  /** Lets the learner sketch a guess with pointer/touch. Calls back on every stroke end. */
  enableSketch(cb: (pts: { x: number; y: number }[]) => void): void {
    this.onSketch = cb;
    this.canvas.classList.add('sketchable');
    const toData = (ev: PointerEvent) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: this.ix(ev.clientX - r.left), y: this.iy(ev.clientY - r.top) };
    };
    this.canvas.addEventListener('pointerdown', (ev) => {
      if (!this.onSketch) return;
      this.sketching = true;
      this.canvas.setPointerCapture(ev.pointerId);
      this.guess = [toData(ev)];
      this.invalidate();
    });
    this.canvas.addEventListener('pointermove', (ev) => {
      if (!this.sketching) return;
      const p = toData(ev);
      const lastP = this.guess[this.guess.length - 1];
      if (p.x > lastP.x) this.guess.push(p);
      this.invalidate();
    });
    const end = () => {
      if (!this.sketching) return;
      this.sketching = false;
      this.onSketch?.(this.guess);
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
  }

  disableSketch(): void {
    this.onSketch = null;
    this.canvas.classList.remove('sketchable');
  }

  setGuess(pts: { x: number; y: number }[]): void {
    this.guess = pts;
    this.invalidate();
  }

  // ---------- rendering ----------
  private drawAxes(): void {
    const dpr = this.axesLayer.width / this.w;
    const ctx = this.axesLayer.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.hgt);
    const ink = color('ink');
    const ink3 = color('ink3');
    const rc = rough.canvas(this.axesLayer);
    const x0 = PAD.l;
    const x1 = this.w - PAD.r;
    const y0 = this.hgt - PAD.b;
    const y1 = PAD.t;
    const { x, y } = this.opts;
    // grid
    ctx.strokeStyle = withAlpha(ink3.startsWith('#') ? ink3 : '#7c746a', 0.18);
    ctx.lineWidth = 1;
    ctx.font = '14px "Patrick Hand", cursive';
    ctx.fillStyle = color('ink2');
    const xt = x.ticks ?? (x.log ? logTicks(x.min, x.max) : niceTicks(x.min, x.max, Math.max(3, Math.floor((x1 - x0) / 70))));
    const yt = y.ticks ?? (y.log ? logTicks(y.min, y.max) : niceTicks(y.min, y.max, Math.max(3, Math.floor((y0 - y1) / 40))));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const t of xt) {
      const X = this.px(t);
      if (X < x0 - 0.5 || X > x1 + 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(X, y0);
      ctx.lineTo(X, y1);
      ctx.stroke();
      ctx.fillText(tickLabel(t, x.digits, x.log), X, y0 + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const t of yt) {
      const Y = this.py(t);
      if (Y > y0 + 0.5 || Y < y1 - 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(x0, Y);
      ctx.lineTo(x1, Y);
      ctx.stroke();
      ctx.fillText(tickLabel(t, y.digits, y.log), x0 - 7, Y);
    }
    // sketchy axes
    const opts = { stroke: ink, strokeWidth: 1.4, roughness: 0.9, bowing: 0.6, seed: 7 };
    const zeroY = !y.log && y.min < 0 && y.max > 0 ? this.py(0) : y0;
    rc.line(x0, zeroY, x1 + 4, zeroY, opts);
    rc.line(x0, y0 + 2, x0, y1 - 4, opts);
    // labels
    ctx.fillStyle = color('ink2');
    ctx.font = '15px "Patrick Hand", cursive';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(x.label, x1, this.hgt - 4);
    ctx.save();
    ctx.translate(13, (y0 + y1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(y.label, 0, 0);
    ctx.restore();
    this.axesDirty = false;
  }

  private render(): void {
    this.raf = 0;
    if (!this.dirty) return;
    this.dirty = false;
    if (this.axesDirty) this.drawAxes();
    const dpr = this.canvas.width / this.w;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.axesLayer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD.l, PAD.t - 6, this.w - PAD.l - PAD.r + 6, this.hgt - PAD.t - PAD.b + 12);
    ctx.clip();

    for (const b of this.bands) {
      ctx.fillStyle = b.color;
      if (b.kind === 'h') {
        const a = this.py(b.to);
        ctx.fillRect(PAD.l, a, this.w - PAD.l - PAD.r, this.py(b.from) - a);
      } else {
        const a = this.px(b.from);
        ctx.fillRect(a, PAD.t, this.px(b.to) - a, this.hgt - PAD.t - PAD.b);
      }
      if (b.label) {
        ctx.fillStyle = color('ink3');
        ctx.font = '14px "Patrick Hand", cursive';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        if (b.kind === 'h') ctx.fillText(b.label, PAD.l + 4, this.py(b.to) - 1);
        else ctx.fillText(b.label, Math.max(PAD.l, this.px(b.from)) + 4, PAD.t + 14);
      }
    }

    const fb = this.opts.fillBetween;
    if (fb) this.fillBetween(fb[0], fb[1], color(fb[2]));

    for (const l of this.lines) {
      ctx.strokeStyle = color(l.color);
      ctx.lineWidth = l.width ?? 1.6;
      ctx.setLineDash(l.dash ?? [6, 5]);
      ctx.beginPath();
      if (l.kind === 'h') {
        ctx.moveTo(PAD.l, this.py(l.at));
        ctx.lineTo(this.w - PAD.r, this.py(l.at));
      } else {
        ctx.moveTo(this.px(l.at), PAD.t);
        ctx.lineTo(this.px(l.at), this.hgt - PAD.b);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (l.label) {
        ctx.fillStyle = color(l.color);
        ctx.font = '15px "Patrick Hand", cursive';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        if (l.kind === 'h') ctx.fillText(l.label, this.w - PAD.r - 4, this.py(l.at) - 2);
        else {
          ctx.textAlign = 'left';
          ctx.fillText(l.label, this.px(l.at) + 4, PAD.t + 14);
        }
      }
    }

    // ghosts first
    for (const s of this.series.values()) {
      if (!s.gx || !s.gy) continue;
      ctx.globalAlpha = 0.3;
      this.stroke(s.gx, s.gy, color(s.color), s.width ?? 2.2, [4, 4]);
      ctx.globalAlpha = 1;
    }
    for (const s of this.series.values()) {
      if (s.dots) this.dots(s.xs, s.ys, color(s.color));
      else this.stroke(s.xs, s.ys, color(s.color), s.width ?? 2.4, s.dash ?? []);
    }

    if (this.overlay) this.overlay(ctx, this.px, this.py);

    if (this.guess.length > 1) {
      ctx.strokeStyle = color('pencil');
      ctx.lineWidth = 2.5;
      ctx.setLineDash([2, 4]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      this.guess.forEach((p, i) => (i ? ctx.lineTo(this.px(p.x), this.py(p.y)) : ctx.moveTo(this.px(p.x), this.py(p.y))));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const m of this.markers) {
      const X = this.px(m.x);
      const Y = this.py(m.y);
      ctx.strokeStyle = ctx.fillStyle = color(m.color);
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (m.shape === 'cross') {
        ctx.moveTo(X - 5, Y - 5);
        ctx.lineTo(X + 5, Y + 5);
        ctx.moveTo(X + 5, Y - 5);
        ctx.lineTo(X - 5, Y + 5);
        ctx.stroke();
      } else {
        ctx.arc(X, Y, 5, 0, Math.PI * 2);
        if (m.shape === 'ring') ctx.stroke();
        else ctx.fill();
      }
      if (m.label) {
        ctx.font = '15px "Patrick Hand", cursive';
        ctx.textAlign = X > this.w - 90 ? 'right' : 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(m.label, X + (X > this.w - 90 ? -8 : 8), Y - 6);
      }
    }

    if (this.cursorX !== null) {
      ctx.strokeStyle = color('ink3');
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.px(this.cursorX), PAD.t);
      ctx.lineTo(this.px(this.cursorX), this.hgt - PAD.b);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  private stroke(xs: number[], ys: number[], c: string, width: number, dash: number[]): void {
    if (xs.length < 2) return;
    const ctx = this.ctx;
    ctx.strokeStyle = c;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.beginPath();
    let pen = false;
    const lim = this.hgt * 4;
    for (let i = 0; i < xs.length; i++) {
      const X = this.px(xs[i]);
      let Y = this.py(ys[i]);
      if (!Number.isFinite(Y)) {
        pen = false;
        continue;
      }
      Y = Math.max(-lim, Math.min(lim, Y));
      if (pen) ctx.lineTo(X, Y);
      else ctx.moveTo(X, Y);
      pen = true;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private dots(xs: number[], ys: number[], c: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = c;
    for (let i = 0; i < xs.length; i++) {
      ctx.beginPath();
      ctx.arc(this.px(xs[i]), this.py(ys[i]), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private fillBetween(a: string, b: string, c: string): void {
    const sa = this.series.get(a);
    const sb = this.series.get(b);
    if (!sa || !sb || sa.xs.length < 2 || sb.xs.length < 2) return;
    const n = Math.min(sa.xs.length, sb.xs.length);
    const ctx = this.ctx;
    ctx.fillStyle = withAlpha(c, 0.13);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const X = this.px(sa.xs[i]);
      const Y = this.py(sa.ys[i]);
      if (i) ctx.lineTo(X, Y);
      else ctx.moveTo(X, Y);
    }
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(this.px(sb.xs[i]), this.py(sb.ys[i]));
    ctx.closePath();
    ctx.fill();
  }
}

function cssName(k: string): string {
  const map: Record<string, string> = {
    sp: 'c-setpoint',
    out: 'c-output',
    err: 'c-error',
    eff: 'c-effort',
    dis: 'c-disturb',
    ink: 'ink',
    ink2: 'ink-2',
    ink3: 'ink-3',
    pencil: 'pencil',
    pole: 'c-pole',
    good: 'c-good',
    bad: 'c-bad',
  };
  return map[k] ?? 'ink';
}

export function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

function logTicks(min: number, max: number): number[] {
  const out: number[] = [];
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
    const v = 10 ** e;
    if (v >= min * 0.999 && v <= max * 1.001) out.push(v);
  }
  return out;
}

function tickLabel(v: number, digits?: number, log?: boolean): string {
  if (log) return v >= 1 ? String(v) : v.toString();
  if (digits !== undefined) return fmt(v, digits);
  const d = Math.abs(v) >= 10 || Number.isInteger(v) ? 0 : Math.abs(v) >= 1 ? 1 : 2;
  return fmt(v, d);
}
