import rough from 'roughjs';
import { h, prefersReducedMotion } from '../core/dom';
import { canvasHandFont } from '../core/font';
import { fmt } from '../core/i18n';
import { onThemeChange } from '../core/theme';
import { type ColorKey, color, withAlpha } from './colors';
import {
  type Obstacles,
  type Pt,
  type Rect,
  type Spot,
  RangeTween,
  arrowSpots,
  autoRange,
  chooseSpot,
  clampToRect,
  droopBand,
  extent,
  fitLabel,
  hLineSpots,
  logTicks,
  mergeTicks,
  niceTicks,
  offFrameRuns,
  pointSpots,
  tickDigits,
  vLineSpots,
  MIN_LABEL_PX,
} from './plot-layout';

export interface Axis {
  label: string;
  min: number;
  max: number;
  /** explicit tick positions (otherwise "nice" ticks) */
  ticks?: number[];
  /** ticks added to the automatic ones (e.g. a 20 N motor limit); close automatic ticks make room */
  extraTicks?: number[];
  /** log axes: tick multipliers per decade, e.g. [1, 2, 5] (default [1]) */
  logSteps?: number[];
  /** custom tick text (default: `fmt()` with sensible digits) */
  tickFormat?: (v: number) => string;
  digits?: number;
  /** logarithmic axis (for Bode plots) */
  log?: boolean;
  /**
   * Grow the top end to fit the data (series, markers, arrows, droop), never below `max`.
   * A number caps how far it may grow. Eases after a pointer drag ends, snaps after keyboard
   * input and under reduced motion. Linear axes only.
   */
  autoMax?: boolean | number;
  /** Same for the bottom end (a number is the lowest it may go). */
  autoMin?: boolean | number;
  /** room beyond the data when auto-scaling, as a share of the span (default 0.1) */
  headroom?: number;
}

export interface SeriesDef {
  id: string;
  /** a colour key, or `key@alpha` for a faint line drawn behind the others (e.g. `eff@0.45`) */
  color: ColorKey | string;
  width?: number;
  dash?: number[];
  /** accessible/legend name */
  label?: string;
  /** keep a faint ghost of the previous run */
  ghost?: boolean;
  /** draw as dots instead of a line */
  dots?: boolean;
  /** draw an arrowhead at the frame edge where the series leaves it (y only) */
  offArrows?: boolean;
  /** text next to that arrow, from the run's extreme value (e.g. `(v) => `↑ ${fmt(v, 1)} m``) */
  offLabel?: (v: number) => string;
}

/** Which series a label must stay off: ids, or every series. */
export type Avoid = string[] | 'all';

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
  /**
   * Series that labels on this plot must not sit on. Marker and arrow labels avoid every
   * series unless told otherwise; line and droop labels avoid none unless told (on a live plot
   * a line label would jump as the curve grows under it).
   */
  avoid?: Avoid;
}

interface Series extends SeriesDef {
  xs: number[];
  ys: number[];
  gx: number[] | null;
  gy: number[] | null;
}

export interface Line {
  kind: 'h' | 'v';
  at: number;
  color: ColorKey | string;
  dash?: number[];
  label?: string;
  width?: number;
  /** where along the line the label prefers to sit: 'end' (right/top, default), 'start', 'middle' */
  labelAt?: 'start' | 'end' | 'middle';
  /** which side of the line: 'above'/'below' for h lines, 'right'/'left' for v lines */
  labelSide?: 'above' | 'below' | 'right' | 'left';
  /** series this label must not sit on */
  avoid?: Avoid;
}

export interface Band {
  kind: 'h' | 'v';
  from: number;
  to: number;
  color: string;
  /**
   * Text in the band's top-left corner. On a v band it shrinks to fit the band's width
   * (down to 12 px) and is left out when the band is still too narrow for it.
   */
  label?: string;
  /** 'start' (default): left/top corner; 'center': centred in the band */
  labelAt?: 'start' | 'center';
}

export interface Marker {
  x: number;
  y: number;
  color: ColorKey | string;
  label?: string;
  /**
   * `cross` and `ring` are the pole × and zero ○ of the colour language: use them only for
   * poles and zeros. For a target, limit or "final total" use `diamond` or `flag`.
   */
  shape?: 'dot' | 'ring' | 'cross' | 'diamond' | 'flag';
  /** series this label must not sit on (default: every series; `[]` for none) */
  avoid?: Avoid;
  /** when the point leaves the frame, pin it to the edge with an arrow pointing to it */
  clamp?: boolean;
  /** label to show while clamped (e.g. "→ 10"); defaults to `label` */
  offLabel?: string;
}

/** A dimension arrow: the distance between two values, e.g. a gain or phase margin. */
export interface DistanceArrow {
  /** 'v' (default): vertical at x = `at`, from y = `from` to y = `to`; 'h': horizontal at y = `at` */
  kind?: 'v' | 'h';
  at: number;
  from: number;
  to: number;
  color: ColorKey | string;
  label?: string;
  /** preferred label side: 'right'/'left' for vertical arrows, 'above'/'below' for horizontal */
  labelSide?: 'right' | 'left' | 'above' | 'below';
  /** series the label must not sit on (default: every series) */
  avoid?: Avoid;
  width?: number;
}

/** "Settles here" line plus the droop band up to the target (one look for every chapter). */
export interface Droop {
  target: number;
  /** where the response settles */
  settle: number;
  /** x where the band starts (default: the left edge) */
  from?: number;
  label?: string;
  /** shade the red band between settle and target (default true) */
  band?: boolean;
  /** label colour (default the output blue, like the line) */
  labelColor?: ColorKey | string;
  labelAt?: 'start' | 'end' | 'middle';
  labelSide?: 'above' | 'below';
  avoid?: Avoid;
}

const PAD = { l: 54, r: 14, t: 14, b: 42 };
const LABEL_PX = 15;

// ---------- input modality (shared by all plots) ----------
// Auto-scaling eases after a pointer drag ends, snaps after keyboard input.
const input = { down: false, keyAt: -Infinity, wired: false, waiters: new Set<() => void>() };
function wireInput(): void {
  if (input.wired || typeof document === 'undefined') return;
  input.wired = true;
  const o = { capture: true, passive: true };
  document.addEventListener('pointerdown', () => (input.down = true), o);
  const up = () => {
    if (!input.down) return;
    input.down = false;
    const w = [...input.waiters];
    input.waiters.clear();
    w.forEach((f) => f());
  };
  document.addEventListener('pointerup', up, o);
  document.addEventListener('pointercancel', up, o);
  window.addEventListener('blur', up);
  document.addEventListener('keydown', () => (input.keyAt = performance.now()), o);
}
const recentKey = (): boolean => performance.now() - input.keyAt < 900;

interface LabelJob {
  text: string;
  color: string;
  spots: (w: number, h: number) => Spot[];
  maxW: number;
  avoid: Avoid | undefined;
  /** straight lines to stay off (own line excluded) */
  lines: Line[];
}

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
  private arrows: DistanceArrow[] = [];
  private droop: Droop | null = null;
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
  /** the ranges the caller asked for (auto-scaling never shows less) */
  private base: { x: [number, number]; y: [number, number] };
  private tween: { x: RangeTween | null; y: RangeTween | null } = { x: null, y: null };
  private drawn = false;
  private waiter = () => this.invalidate(true);
  /** extra draw callback in data coordinates, e.g. tangent lines or shaded areas */
  overlay: ((ctx: CanvasRenderingContext2D, px: (x: number) => number, py: (y: number) => number) => void) | null = null;

  constructor(host: HTMLElement, public opts: PlotOptions) {
    this.baseH = opts.height ?? 220;
    this.hgt = this.baseH;
    this.base = { x: [opts.x.min, opts.x.max], y: [opts.y.min, opts.y.max] };
    this.canvas = h('canvas', { role: 'img', 'aria-label': opts.label });
    this.axesLayer = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.desc = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
    const legend = opts.legend === false ? null : this.buildLegend();
    this.el = h('figure', { class: 'plot' }, legend, this.canvas, this.desc);
    host.append(this.el);
    for (const s of opts.series) this.series.set(s.id, { ...s, xs: [], ys: [], gx: null, gy: null });
    if (opts.x.autoMax || opts.x.autoMin || opts.y.autoMax || opts.y.autoMin) wireInput();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.el);
    this.disposers.push(() => ro.disconnect());
    this.disposers.push(onThemeChange(() => this.invalidate(true)));
    this.disposers.push(() => input.waiters.delete(this.waiter));
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
              borderTop: `3px ${s.dash ? 'dashed' : 'solid'} ${swatchColor(s.color)}`,
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
  /** Distance arrows (e.g. gain and phase margins); they count for auto-scaling. */
  setArrows(arrows: DistanceArrow[]): void {
    this.arrows = arrows;
    this.invalidate();
  }
  /** The droop band and "settles here" line; `null` removes it. Kept apart from `setLines`. */
  setDroop(d: Droop | null): void {
    this.droop = d;
    this.invalidate();
  }
  setCursor(x: number | null): void {
    this.cursorX = x;
    this.invalidate();
  }

  /** Sets the x range (and the base range auto-scaling starts from), without easing. */
  setX(min: number, max: number): void {
    this.opts.x.min = min;
    this.opts.x.max = max;
    this.base.x = [min, max];
    this.tween.x = null;
    this.invalidate(true);
  }
  setY(min: number, max: number): void {
    this.opts.y.min = min;
    this.opts.y.max = max;
    this.base.y = [min, max];
    this.tween.y = null;
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

  // ---------- auto-scaling ----------
  /** Data extent that auto-scaling must keep in frame, per axis. */
  private dataExtent(axis: 'x' | 'y'): [number, number] | null {
    const lists: number[][] = [];
    for (const s of this.series.values()) lists.push(axis === 'x' ? s.xs : s.ys);
    const pts: number[] = [];
    for (const m of this.markers) pts.push(axis === 'x' ? m.x : m.y);
    for (const a of this.arrows) {
      const vertical = (a.kind ?? 'v') === 'v';
      if ((axis === 'y') === vertical) pts.push(a.from, a.to);
      else pts.push(a.at);
    }
    if (this.droop && axis === 'y') pts.push(this.droop.target, this.droop.settle);
    lists.push(pts);
    return extent(...lists);
  }

  /** Moves auto-scaled axes towards their target range. Returns true while still easing. */
  private stepAuto(now: number): boolean {
    let easing = false;
    for (const axis of ['x', 'y'] as const) {
      const a = this.opts[axis];
      if (a.log || !(a.autoMax || a.autoMin)) continue;
      const tw = this.tween[axis];
      const dest: [number, number] = tw ? tw.to : [a.min, a.max];
      const target = autoRange(this.base[axis], dest, this.dataExtent(axis), {
        max: !!a.autoMax,
        min: !!a.autoMin,
        headroom: a.headroom,
        capMax: typeof a.autoMax === 'number' ? a.autoMax : undefined,
        capMin: typeof a.autoMin === 'number' ? a.autoMin : undefined,
      });
      const same = Math.abs(target[0] - dest[0]) < 1e-9 && Math.abs(target[1] - dest[1]) < 1e-9;
      if (!same) {
        if (!this.drawn || prefersReducedMotion() || recentKey()) {
          this.tween[axis] = null;
          [a.min, a.max] = target;
          this.axesDirty = true;
        } else if (input.down) {
          // hold still while a finger or mouse is dragging; ease once it lets go
          input.waiters.add(this.waiter);
        } else this.tween[axis] = new RangeTween([a.min, a.max], target, now);
      }
      const t = this.tween[axis];
      if (t) {
        [a.min, a.max] = t.at(now);
        this.axesDirty = true;
        if (t.done(now)) this.tween[axis] = null;
        else easing = true;
      }
    }
    return easing;
  }

  // ---------- rendering ----------
  private ticks(axis: Axis, lenPx: number, perTick: number, toPx: (v: number) => number, minGap: number): number[] {
    if (axis.ticks) return axis.ticks;
    const auto = axis.log ? logTicks(axis.min, axis.max, axis.logSteps) : niceTicks(axis.min, axis.max, Math.max(3, Math.floor(lenPx / perTick)));
    const extra = (axis.extraTicks ?? []).filter((v) => v >= Math.min(axis.min, axis.max) && v <= Math.max(axis.min, axis.max));
    return extra.length ? mergeTicks(auto, extra, toPx, minGap) : auto;
  }

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
    ctx.font = canvasHandFont(14);
    ctx.fillStyle = color('ink2');
    const xt = this.ticks(x, x1 - x0, 70, this.px, 40);
    const yt = this.ticks(y, y0 - y1, 40, this.py, 20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const t of xt) {
      const X = this.px(t);
      if (X < x0 - 0.5 || X > x1 + 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(X, y0);
      ctx.lineTo(X, y1);
      ctx.stroke();
      ctx.fillText(tickLabel(t, x), X, y0 + 6);
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
      ctx.fillText(tickLabel(t, y), x0 - 7, Y);
    }
    // sketchy axes
    const opts = { stroke: ink, strokeWidth: 1.4, roughness: 0.9, bowing: 0.6, seed: 7 };
    const zeroY = !y.log && y.min < 0 && y.max > 0 ? this.py(0) : y0;
    rc.line(x0, zeroY, x1 + 4, zeroY, opts);
    rc.line(x0, y0 + 2, x0, y1 - 4, opts);
    // labels
    ctx.fillStyle = color('ink2');
    ctx.font = canvasHandFont(15);
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

  /** The inner data frame in pixels. */
  private frame(): Rect {
    return { x: PAD.l, y: PAD.t, w: this.w - PAD.l - PAD.r, h: this.hgt - PAD.t - PAD.b };
  }

  private render(): void {
    this.raf = 0;
    if (!this.dirty) return;
    this.dirty = false;
    const easing = this.stepAuto(performance.now());
    if (this.axesDirty) this.drawAxes();
    const dpr = this.canvas.width / this.w;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.axesLayer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    const clip: Rect = { x: PAD.l, y: PAD.t - 6, w: this.w - PAD.l - PAD.r + 6, h: this.hgt - PAD.t - PAD.b + 12 };
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
    const fr = this.frame();

    // label boxes placed so far, and fixed things labels must stay clear of
    const boxes: Rect[] = [];

    for (const b of this.bands) {
      ctx.fillStyle = bandColor(b.color);
      if (b.kind === 'h') {
        const a = this.py(b.to);
        ctx.fillRect(PAD.l, a, fr.w, this.py(b.from) - a);
      } else {
        const a = this.px(b.from);
        ctx.fillRect(a, PAD.t, this.px(b.to) - a, fr.h);
      }
      if (b.label) {
        let px = 14;
        const measure = (t: string, p: number) => {
          ctx.font = canvasHandFont(p);
          return ctx.measureText(t).width;
        };
        let tw = measure(b.label, px);
        let left = PAD.l;
        let right = this.w - PAD.r;
        if (b.kind === 'v') {
          left = Math.max(PAD.l, Math.min(this.px(b.from), this.px(b.to)));
          right = Math.min(this.w - PAD.r, Math.max(this.px(b.from), this.px(b.to)));
          while (tw > right - left - 8 && px > MIN_LABEL_PX) tw = measure(b.label, --px);
        }
        if (b.kind === 'h' || tw <= right - left - 8) {
          ctx.fillStyle = color('ink3');
          ctx.font = canvasHandFont(px);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          const bx = b.labelAt === 'center' ? (left + right - tw) / 2 : left + 4;
          const by = b.kind === 'h' ? this.py(b.to) - 1 : b.labelAt === 'center' ? PAD.t + fr.h / 2 + px / 2 : PAD.t + 14;
          ctx.fillText(b.label, bx, by);
          boxes.push({ x: bx, y: by - px, w: tw, h: px });
        }
      }
    }

    const dr = this.droop;
    if (dr && dr.band !== false) {
      const { lo, hi } = droopBand(dr.target, dr.settle);
      const xa = Math.max(PAD.l, this.px(dr.from ?? this.opts.x.min));
      ctx.fillStyle = withAlpha(color('err'), 0.13);
      ctx.fillRect(xa, this.py(hi), this.w - PAD.r - xa, this.py(lo) - this.py(hi));
    }

    const fb = this.opts.fillBetween;
    if (fb) this.fillBetween(fb[0], fb[1], color(fb[2]));

    const allLines: Line[] = [...this.lines];
    if (dr) allLines.push({ kind: 'h', at: dr.settle, color: 'out', dash: [2, 4] });
    for (const l of allLines) {
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
    }

    // ghosts first
    for (const s of this.series.values()) {
      if (!s.gx || !s.gy) continue;
      ctx.globalAlpha = 0.3;
      this.stroke(s.gx, s.gy, seriesColor(s.color), s.width ?? 2.2, [4, 4]);
      ctx.globalAlpha = 1;
    }
    for (const s of this.series.values()) {
      if (s.dots) this.dots(s.xs, s.ys, seriesColor(s.color));
      else this.stroke(s.xs, s.ys, seriesColor(s.color), s.width ?? 2.4, s.dash ?? []);
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

    const jobs: LabelJob[] = [];
    const maxW = fr.w - 8;

    // series that leave the frame: an arrowhead at the edge (and the extreme value)
    for (const s of this.series.values()) {
      if (!s.offArrows || s.xs.length < 2) continue;
      const lo = Math.min(this.opts.y.min, this.opts.y.max);
      const hi = Math.max(this.opts.y.min, this.opts.y.max);
      offFrameRuns(s.ys, lo, hi)
        .slice(0, 3)
        .forEach((run) => {
          const X = this.px(s.xs[run.from]);
          if (X < fr.x - 1 || X > fr.x + fr.w + 1) return;
          const up = run.side === 'above';
          const Y = up ? fr.y + 1 : fr.y + fr.h - 1;
          ctx.fillStyle = color(s.color);
          arrowHead(ctx, X, Y, 0, up ? -1 : 1, 9);
          boxes.push({ x: X - 6, y: up ? Y : Y - 10, w: 12, h: 10 });
          if (s.offLabel) {
            const Yl = up ? Y + 12 : Y - 12;
            jobs.push({ text: s.offLabel(s.ys[run.peak]), color: color(s.color), spots: (w, h) => pointSpots(X, Yl + (up ? h + 6 : -6), w, h, X > this.w - 90), maxW: maxW * 0.6, avoid: undefined, lines: this.lines });
          }
        });
    }

    // distance arrows
    for (const a of this.arrows) {
      const vertical = (a.kind ?? 'v') === 'v';
      const A: Pt = vertical ? { x: this.px(a.at), y: this.py(a.from) } : { x: this.px(a.from), y: this.py(a.at) };
      const B: Pt = vertical ? { x: this.px(a.at), y: this.py(a.to) } : { x: this.px(a.to), y: this.py(a.at) };
      if (!Number.isFinite(A.x + A.y + B.x + B.y)) continue;
      const c = color(a.color);
      drawDistanceArrow(ctx, A, B, c, a.width ?? 1.6);
      boxes.push({ x: Math.min(A.x, B.x) - 5, y: Math.min(A.y, B.y) - 5, w: Math.abs(B.x - A.x) + 10, h: Math.abs(B.y - A.y) + 10 });
      if (a.label) jobs.push({ text: a.label, color: c, spots: (w, h) => arrowSpots(A, B, w, h, a.labelSide), maxW: maxW * 0.6, avoid: a.avoid ?? this.opts.avoid ?? 'all', lines: allLines });
    }

    // markers (shapes now, labels with the others)
    for (const m of this.markers) {
      let X = this.px(m.x);
      let Y = this.py(m.y);
      if (!Number.isFinite(X + Y)) continue;
      const c = color(m.color);
      let text = m.label;
      if (m.clamp) {
        const cl = clampToRect({ x: X, y: Y }, fr, 16);
        if (cl.out) {
          X = cl.x;
          Y = cl.y;
          text = m.offLabel ?? m.label;
          ctx.strokeStyle = ctx.fillStyle = c;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(X + cl.dx * 8, Y + cl.dy * 8);
          ctx.lineTo(X + cl.dx * 13, Y + cl.dy * 13);
          ctx.stroke();
          arrowHead(ctx, X + cl.dx * 16, Y + cl.dy * 16, cl.dx, cl.dy, 7);
        }
      }
      drawMarker(ctx, m.shape ?? 'dot', X, Y, c);
      const top = m.shape === 'flag' ? Y - 16 : Y - 6;
      boxes.push({ x: X - 6, y: top, w: m.shape === 'flag' ? 18 : 12, h: Y + 6 - top });
      if (text) {
        const ay = m.shape === 'flag' ? Y - 12 : Y;
        const ax = m.shape === 'flag' ? X + 6 : X;
        jobs.push({ text, color: c, spots: (w, h) => pointSpots(ax, ay, w, h, X > this.w - 90), maxW: maxW * 0.7, avoid: m.avoid ?? this.opts.avoid ?? 'all', lines: allLines });
      }
    }

    // line labels go first so marker and arrow labels step around them
    const lineJobs: LabelJob[] = [];
    for (const [i, l] of allLines.entries()) {
      const isDroop = dr && i === allLines.length - 1;
      const text = isDroop ? dr.label : l.label;
      if (!text) continue;
      const at = isDroop ? dr.labelAt : l.labelAt;
      const side = isDroop ? dr.labelSide : l.labelSide;
      const others = allLines.filter((o) => o !== l);
      const c = color(isDroop ? (dr.labelColor ?? 'out') : l.color);
      const avoid = isDroop ? dr.avoid : l.avoid;
      if (l.kind === 'h') {
        const Y = this.py(l.at);
        const s = side === 'below' ? 'below' : 'above';
        lineJobs.push({ text, color: c, spots: (w, h) => hLineSpots(Y, PAD.l, this.w - PAD.r, w, h, at, s), maxW, avoid, lines: others });
      } else {
        const X = this.px(l.at);
        const s = side === 'left' ? 'left' : 'right';
        lineJobs.push({ text, color: c, spots: (w, h) => vLineSpots(X, PAD.t, this.hgt - PAD.b, w, h, at, s), maxW, avoid, lines: others });
      }
    }
    this.placeLabels([...lineJobs, ...jobs], boxes, clip);

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
    this.drawn = true;
    if (easing) this.invalidate();
  }

  /** Pixel polylines of the series a label must avoid (current run and ghost). */
  private polys(avoid: Avoid | undefined, cache: Map<string, Pt[][]>): Pt[][] {
    if (!avoid) return [];
    const out: Pt[][] = [];
    for (const s of this.series.values()) {
      if (avoid !== 'all' && !avoid.includes(s.id)) continue;
      let p = cache.get(s.id);
      if (!p) {
        p = [this.toPx(s.xs, s.ys, s.dots)];
        if (s.gx && s.gy) p.push(this.toPx(s.gx, s.gy, s.dots));
        cache.set(s.id, p);
      }
      out.push(...p);
    }
    return out;
  }

  private toPx(xs: number[], ys: number[], dots?: boolean): Pt[] {
    const lim = this.hgt * 4;
    const at = (i: number): Pt => {
      const Y = this.py(ys[i]);
      return { x: this.px(xs[i]), y: Number.isFinite(Y) ? Math.max(-lim, Math.min(lim, Y)) : NaN };
    };
    const pts: Pt[] = [];
    if (dots) {
      // each dot is a tiny segment; NaN breaks the line between dots
      for (let i = 0; i < xs.length; i++) {
        const p = at(i);
        pts.push({ x: p.x - 4, y: p.y }, { x: p.x + 4, y: p.y }, { x: NaN, y: NaN });
      }
      return pts;
    }
    const step = Math.max(1, Math.ceil(xs.length / 300));
    for (let i = 0; i < xs.length; i += step) pts.push(at(i));
    if (xs.length > 1 && (xs.length - 1) % step) pts.push(at(xs.length - 1));
    return pts;
  }

  private linePoly(l: Line): Pt[] {
    return l.kind === 'h'
      ? [
          { x: PAD.l, y: this.py(l.at) },
          { x: this.w - PAD.r, y: this.py(l.at) },
        ]
      : [
          { x: this.px(l.at), y: PAD.t },
          { x: this.px(l.at), y: this.hgt - PAD.b },
        ];
  }

  private placeLabels(jobs: LabelJob[], boxes: Rect[], bounds: Rect): void {
    const ctx = this.ctx;
    const cache = new Map<string, Pt[][]>();
    const measure = (s: string, px: number) => {
      ctx.font = canvasHandFont(px);
      return ctx.measureText(s).width;
    };
    const halo = color('card');
    for (const j of jobs) {
      const fit = fitLabel(j.text, j.maxW, measure, LABEL_PX);
      const lh = Math.round(fit.px * 1.1);
      const w = Math.max(...fit.lines.map((l) => measure(l, fit.px)));
      const hgt = fit.px + lh * (fit.lines.length - 1);
      const spots = j.spots(w, hgt);
      const polys = [...this.polys(j.avoid ?? this.opts.avoid, cache), ...j.lines.map((l) => this.linePoly(l))];
      const o: Obstacles = { bounds, boxes, polys };
      const s = spots[chooseSpot(spots, o)];
      boxes.push(s.rect);
      ctx.font = canvasHandFont(fit.px);
      ctx.textAlign = s.align;
      ctx.textBaseline = 'top';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = halo;
      ctx.lineWidth = 3;
      ctx.fillStyle = j.color;
      const x = s.align === 'left' ? s.rect.x : s.align === 'right' ? s.rect.x + s.rect.w : s.rect.x + s.rect.w / 2;
      fit.lines.forEach((line, k) => {
        const y = s.rect.y + k * lh;
        ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
      });
    }
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

function drawMarker(ctx: CanvasRenderingContext2D, shape: NonNullable<Marker['shape']>, X: number, Y: number, c: string): void {
  ctx.strokeStyle = ctx.fillStyle = c;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (shape === 'cross') {
    ctx.moveTo(X - 5, Y - 5);
    ctx.lineTo(X + 5, Y + 5);
    ctx.moveTo(X + 5, Y - 5);
    ctx.lineTo(X - 5, Y + 5);
    ctx.stroke();
  } else if (shape === 'diamond') {
    ctx.moveTo(X, Y - 6.5);
    ctx.lineTo(X + 6.5, Y);
    ctx.lineTo(X, Y + 6.5);
    ctx.lineTo(X - 6.5, Y);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'flag') {
    ctx.lineCap = 'round';
    ctx.moveTo(X, Y);
    ctx.lineTo(X, Y - 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X, Y - 16);
    ctx.lineTo(X + 11, Y - 12.5);
    ctx.lineTo(X, Y - 9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X, Y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(X, Y, 5, 0, Math.PI * 2);
    if (shape === 'ring') ctx.stroke();
    else ctx.fill();
  }
}

/** Filled arrowhead with its tip at (x, y), pointing along (dx, dy). */
function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, size: number): void {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = x - ux * size;
  const by = y - uy * size;
  const hw = size * 0.55;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(bx - uy * hw, by + ux * hw);
  ctx.lineTo(bx + uy * hw, by - ux * hw);
  ctx.closePath();
  ctx.fill();
}

/** Double-headed dimension arrow from A to B; short ones get their heads outside, pointing in. */
function drawDistanceArrow(ctx: CanvasRenderingContext2D, A: Pt, B: Pt, c: string, width: number): void {
  const len = Math.hypot(B.x - A.x, B.y - A.y);
  if (len < 0.5) return;
  const ux = (B.x - A.x) / len;
  const uy = (B.y - A.y) / len;
  const head = 7;
  ctx.strokeStyle = ctx.fillStyle = c;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  if (len >= 2 * head + 4) {
    ctx.moveTo(A.x + ux * head, A.y + uy * head);
    ctx.lineTo(B.x - ux * head, B.y - uy * head);
    ctx.stroke();
    arrowHead(ctx, A.x, A.y, -ux, -uy, head);
    arrowHead(ctx, B.x, B.y, ux, uy, head);
  } else {
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.moveTo(A.x - ux * (head + 6), A.y - uy * (head + 6));
    ctx.lineTo(A.x - ux * head, A.y - uy * head);
    ctx.moveTo(B.x + ux * (head + 6), B.y + uy * (head + 6));
    ctx.lineTo(B.x + ux * head, B.y + uy * head);
    ctx.stroke();
    arrowHead(ctx, A.x, A.y, ux, uy, head);
    arrowHead(ctx, B.x, B.y, -ux, -uy, head);
  }
}

/** Band colours may be literal CSS or `key@alpha` (e.g. `sp@0.16`), resolved per theme. */
function bandColor(c: string): string {
  const m = /^(\w+)@([\d.]+)$/.exec(c);
  return m ? withAlpha(color(m[1]), Number(m[2])) : c;
}

/** A series colour: a key (resolved per theme), `key@alpha` for a faint series, or literal CSS. */
function seriesColor(c: string): string {
  const m = /^(\w+)@([\d.]+)$/.exec(c);
  return m ? withAlpha(color(m[1]), Number(m[2])) : color(c);
}

/** CSS for a legend swatch: a colour key, `key@alpha` (a faint series) or a literal colour. */
function swatchColor(c: string): string {
  if (c.startsWith('#')) return c;
  const m = /^(\w+)@([\d.]+)$/.exec(c);
  return m ? `color-mix(in srgb, var(--${cssName(m[1])}) ${Math.round(Number(m[2]) * 100)}%, transparent)` : `var(--${cssName(c)})`;
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

function tickLabel(v: number, axis: Axis): string {
  if (axis.tickFormat) return axis.tickFormat(v);
  if (axis.log) return fmt(v, tickDigits(v));
  if (axis.digits !== undefined) return fmt(v, axis.digits);
  const d = Math.abs(v) >= 10 || Number.isInteger(v) ? 0 : Math.abs(v) >= 1 ? 1 : 2;
  return fmt(v, d);
}
