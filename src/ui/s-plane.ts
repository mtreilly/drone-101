import rough from 'roughjs';
import { h, s, clamp } from '../core/dom';
import { fmt, tc } from '../core/i18n';

export interface SPoint {
  id: string;
  /** true value; a point outside the plane is drawn as an arrow at the edge, `describe()` keeps the value */
  re: number;
  im: number;
  kind: 'pole' | 'zero' | 'point';
  /** draw (and move) the mirror-image twin at re − i·im */
  mirror?: boolean;
  draggable?: boolean;
  label?: string;
  /** colour key override for 'point' kind */
  color?: string;
  /** keep the point on the real axis */
  realOnly?: boolean;
}

/** A faint copy of an earlier point (previous run = faint ghost). */
export type SGhost = Pick<SPoint, 're' | 'im' | 'kind' | 'mirror' | 'color'>;

export interface SPlaneOptions {
  reMin: number;
  reMax: number;
  imMax: number;
  label: string;
  /** shade left (stable) and right (unstable) half-planes with captions */
  regions?: boolean;
  /** axis names */
  reLabel?: string;
  imLabel?: string;
  onChange?: (p: SPoint) => void;
  /** keyboard step in s-units; arrow keys snap to this grid (default 0.1) */
  step?: number;
  /** optional max width in px */
  maxWidth?: number;
  /** write the true value next to an off-edge arrow (default true) */
  offValues?: boolean;
}

const W = 400;
const EPS = 1e-9;

/** An axis-aligned box in viewBox units. */
export interface LabelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Two boxes overlap (with `pad` units of breathing room). */
export const overlaps = (a: LabelBox, b: LabelBox, pad = 1): boolean =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

const area = (a: LabelBox, b: LabelBox, pad: number): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + pad) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + pad);

/**
 * The first candidate that touches none of the obstacles; when every spot touches something, the
 * one that covers the least.
 */
export function firstFree<C>(cands: C[], box: (c: C) => LabelBox | null, obstacles: LabelBox[], inside?: LabelBox): C {
  let best = cands[0];
  let bestCost = Infinity;
  for (const c of cands) {
    const b = box(c);
    if (!b) continue;
    const out = inside && (b.x < inside.x || b.y < inside.y || b.x + b.w > inside.x + inside.w || b.y + b.h > inside.y + inside.h);
    const hit = obstacles.filter((o) => overlaps(b, o, 3));
    if (!out && !hit.length) return c;
    const cost = (out ? 1e6 : 0) + hit.reduce((sum, o) => sum + area(b, o, 3), 0);
    if (cost < bestCost) (bestCost = cost), (best = c);
  }
  return best;
}

const bbox = (el: SVGGraphicsElement): LabelBox | null => {
  try {
    const b = el.getBBox();
    return b.width || b.height ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
  } catch {
    return null;
  }
};

/** Where a point is drawn: inside the plane, or pinned to the edge with the direction it left by. */
export interface Placement {
  re: number;
  im: number;
  off: boolean;
  /** screen angle (degrees, SVG y down) from the drawn spot towards the true point */
  angle: number;
}

/** Clamps a true value to the plane; off-edge points get the direction to point an arrow in. */
export function placement(re: number, im: number, o: Pick<SPlaneOptions, 'reMin' | 'reMax' | 'imMax'>): Placement {
  const cr = clamp(re, o.reMin, o.reMax);
  const ci = clamp(im, -o.imMax, o.imMax);
  const off = Math.abs(cr - re) > EPS || Math.abs(ci - im) > EPS;
  // pixels are square (the height is set from the ranges), so the s-plane angle is the screen angle with y flipped
  const angle = off ? (Math.atan2(-(im - ci), re - cr) * 180) / Math.PI : 0;
  return { re: cr, im: ci, off, angle };
}

/**
 * One arrow-key move on a `step` grid: from an off-grid value the first press lands on the next grid
 * line in that direction (6.245 ↓ → 6.2, not 6.145), after that it moves whole steps.
 */
export function snapStep(v: number, delta: number, step: number): number {
  if (!delta) return snapNearest(v, step);
  const q = (v + delta) / step;
  const r = Math.round(q * 1e6) / 1e6;
  return tidy((delta > 0 ? Math.floor(r) : Math.ceil(r)) * step);
}

/** Nearest grid value (the axis an arrow key does not move is tidied too). */
export const snapNearest = (v: number, step: number): number => tidy(Math.round(Math.round((v / step) * 1e6) / 1e6) * step);

const tidy = (v: number): number => Math.round(v * 1e9) / 1e9 || 0;

/** Every marker a point puts on the plane (the twin too): the true positions. */
export function positionsOf(p: Pick<SPoint, 're' | 'im' | 'mirror'>): { re: number; im: number }[] {
  return p.mirror && Math.abs(p.im) > EPS ? [{ re: p.re, im: p.im }, { re: p.re, im: -p.im }] : [{ re: p.re, im: p.im }];
}

/** Overshoot (%) of a standard second-order step for damping ratio ζ (0 for ζ ≥ 1). */
export const overshootOf = (zeta: number): number => (zeta >= 1 ? 0 : 100 * Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)));

/** The 2 % settling rule of thumb for a pole at −σ: about 4/σ seconds. */
export const settleRule = (sigma: number): number => 4 / sigma;

/** What a screen reader hears for a point: its name and true value, and whether it is off the map. */
export function describePoint(p: Pick<SPoint, 're' | 'im' | 'kind' | 'mirror' | 'label'>, o: Pick<SPlaneOptions, 'reMin' | 'reMax' | 'imMax'>): string {
  const name = p.label ?? tc(`splane.${p.kind}`);
  const v = formatS(p.re, p.im, !!p.mirror);
  const off = positionsOf(p).some((q) => placement(q.re, q.im, o).off);
  return `${name}: ${off ? tc('splane.offMap', { v }) : v}`;
}

/** The s-plane: draggable poles/zeros/points with keyboard support and live description. */
export class SPlane {
  readonly el: HTMLElement;
  readonly svg: SVGSVGElement;
  private H: number;
  private pts = new Map<string, SPoint>();
  private nodes = new Map<string, { main: SVGGElement; twin: SVGGElement | null }>();
  private layer: SVGGElement;
  private ghostLayer: SVGGElement;
  private ghosts: SGhost[] = [];
  /** decoration layer under the points (trails, notes); chapters draw here */
  readonly deco: SVGGElement;
  /** built-in guides (ωn circle, ζ rays, settling lines), clipped to the plane, over `deco` */
  private guides: SVGGElement;
  private circleG: SVGGElement;
  private raysG: SVGGElement;
  private settleG: SVGGElement;
  private circleState: { r: number; label?: string; at?: number } | null = null;
  private raysState: number[] = [];
  private settleState: number[] = [];
  /** labels the layout pass moves out of each other's way */
  private settleLabels: { text: SVGTextElement; x: number; full: string; short: string }[] = [];
  private rayLabels: { text: SVGTextElement; top: boolean; py: number; n: number }[] = [];
  private fixedLabels: SVGTextElement[] = [];
  private tickLabels: SVGTextElement[] = [];
  private regionLabels: { el: SVGTextElement; text: string; from: number; to: number; anchor: number }[] = [];
  private desc: HTMLElement;
  private descTimer = 0;
  /** viewBox units per CSS pixel, so labels and markers keep a readable size in narrow columns */
  private k = 1;

  constructor(host: HTMLElement, public o: SPlaneOptions) {
    this.H = Math.round((W * 2 * o.imMax) / (o.reMax - o.reMin));
    // physical coordinates: text anchors stay left-to-right even in Arabic UI (as in DroneView)
    this.svg = s('svg', {
      viewBox: `0 0 ${W} ${this.H}`,
      class: 's-plane',
      direction: 'ltr',
      role: 'group',
      'aria-label': o.label,
    });
    this.deco = s('g', { class: 'deco' });
    const clipId = `sp-clip-${Math.random().toString(36).slice(2, 8)}`;
    this.guides = s('g', { class: 'guides', 'clip-path': `url(#${clipId})` });
    this.circleG = s('g', { class: 'guide-circle' });
    this.raysG = s('g', { class: 'guide-rays' });
    this.settleG = s('g', { class: 'guide-settle' });
    this.guides.append(this.settleG, this.raysG, this.circleG);
    this.ghostLayer = s('g', { class: 'ghosts', 'aria-hidden': 'true' });
    this.layer = s('g', { class: 'points' });
    this.desc = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
    this.svg.append(s('defs', null, s('clipPath', { id: clipId }, s('rect', { x: 0, y: 0, width: W, height: this.H }))));
    this.drawBackground();
    this.svg.append(this.deco, this.guides, this.ghostLayer, this.layer);
    this.el = h('div', { class: 's-plane-wrap', style: o.maxWidth ? { maxWidth: `${o.maxWidth}px` } : undefined }, this.svg, this.desc);
    host.append(this.el);
    let lastW = 0;
    const ro = new ResizeObserver(() => {
      const w = this.svg.clientWidth || W;
      if (Math.abs(w - lastW) < 0.5) return;
      lastW = w;
      // --u: viewBox units per CSS pixel, for label size floors in CSS
      this.svg.style.setProperty('--u', (W / w).toFixed(3));
      const k = Math.min(1.8, Math.max(1, (W / w) * 0.75));
      if (Math.abs(k - this.k) >= 0.02) {
        this.k = k;
        this.svg.style.setProperty('--k', k.toFixed(3));
        for (const id of this.pts.keys()) this.place(id);
        this.layoutOffValues();
        this.drawGhosts();
      }
      // label lengths change with the font floor
      this.fitRegionLabels();
      this.drawSettle();
      this.drawRays();
      this.drawCircle();
      this.layoutLabels();
    });
    ro.observe(this.svg);
    // guide labels are measured; measure again once the hand-drawn font has arrived
    document.fonts?.ready.then(() => {
      this.fitRegionLabels();
      this.layoutLabels();
    });
  }

  sx = (re: number): number => ((re - this.o.reMin) / (this.o.reMax - this.o.reMin)) * W;
  sy = (im: number): number => this.H / 2 - (im / this.o.imMax) * (this.H / 2);
  private inv(x: number, y: number): [number, number] {
    return [this.o.reMin + (x / W) * (this.o.reMax - this.o.reMin), ((this.H / 2 - y) / (this.H / 2)) * this.o.imMax];
  }

  private drawBackground(): void {
    const { o } = this;
    const bg = s('g', { class: 'bg' });
    const x0 = this.sx(0);
    if (o.regions) {
      const stable = s('text', { x: 8, y: this.H - 10, class: 'region-label stable' }, tc('splane.stable'));
      const unstable = s('text', { x: W - 8, y: this.H - 10, class: 'region-label unstable', 'text-anchor': 'end' }, tc('splane.unstable'));
      bg.append(
        s('rect', { x: 0, y: 0, width: x0, height: this.H, class: 'region-stable' }),
        s('rect', { x: x0, y: 0, width: W - x0, height: this.H, class: 'region-unstable' }),
        stable,
        unstable,
      );
      // each caption stays inside its own half, clear of the ω axis
      this.regionLabels = [
        { el: stable, text: tc('splane.stable'), from: 8, to: x0 - 8, anchor: 8 },
        { el: unstable, text: tc('splane.unstable'), from: x0 + 8, to: W - 8, anchor: W - 8 },
      ];
      this.fixedLabels.push(stable, unstable);
    }
    // grid
    const g = s('g', { class: 'grid' });
    const stepRe = gridStep(o.reMax - o.reMin);
    for (let r = Math.ceil(o.reMin / stepRe) * stepRe; r <= o.reMax; r += stepRe) {
      if (Math.abs(r) < 1e-9) continue;
      g.append(s('line', { x1: this.sx(r), x2: this.sx(r), y1: 0, y2: this.H }));
      const tick = s('text', { x: this.sx(r), y: this.sy(0) + 16, 'text-anchor': 'middle', class: 'tick' }, fmtTick(r));
      this.tickLabels.push(tick);
      g.append(tick);
    }
    const stepIm = gridStep(2 * o.imMax);
    for (let i = Math.ceil(-o.imMax / stepIm) * stepIm; i <= o.imMax; i += stepIm) {
      if (Math.abs(i) < 1e-9) continue;
      g.append(s('line', { x1: 0, x2: W, y1: this.sy(i), y2: this.sy(i) }));
      const tick = s('text', { x: x0 - 5, y: this.sy(i) + 4, 'text-anchor': 'end', class: 'tick' }, `${fmtTick(i)}i`);
      this.tickLabels.push(tick);
      g.append(tick);
    }
    bg.append(g);
    // rough axes
    const rc = rough.svg(this.svg);
    const axisOpts = { stroke: 'currentColor', strokeWidth: 1.5, roughness: 0.8, seed: 3 };
    const ax = s('g', { class: 'axes' });
    ax.append(rc.line(0, this.sy(0), W, this.sy(0), axisOpts), rc.line(x0, 0, x0, this.H, axisOpts));
    const reText = s('text', { x: W - 6, y: this.sy(0) - 8, 'text-anchor': 'end', class: 'axis-label' }, o.reLabel ?? tc('splane.re'));
    const imText = s('text', { x: x0 + 8, y: 16, class: 'axis-label' }, o.imLabel ?? tc('splane.im'));
    ax.append(reText, imText);
    this.fixedLabels.push(reText, imText);
    bg.append(ax);
    this.svg.append(bg);
  }

  get(id: string): SPoint | undefined {
    return this.pts.get(id);
  }

  all(): SPoint[] {
    return [...this.pts.values()];
  }

  /** Points (true values) that sit outside the plane and are drawn as edge arrows. */
  offEdge(): SPoint[] {
    return this.all().filter((p) => positionsOf(p).some((q) => placement(q.re, q.im, this.o).off));
  }

  /** Adds or updates points. Pass true values: off-edge ones are pinned to the edge with an arrow. */
  set(points: SPoint[]): void {
    const keep = new Set(points.map((p) => p.id));
    for (const [id, n] of this.nodes) {
      if (!keep.has(id)) {
        n.main.remove();
        n.twin?.remove();
        this.nodes.delete(id);
        this.pts.delete(id);
      }
    }
    for (const p of points) {
      const old = this.pts.get(p.id);
      const merged = { ...old, ...p };
      // twin/kind/drag changes need a fresh marker
      if (old && (!!old.mirror !== !!merged.mirror || old.kind !== merged.kind || !!old.draggable !== !!merged.draggable)) {
        const n = this.nodes.get(p.id);
        n?.main.remove();
        n?.twin?.remove();
        this.nodes.delete(p.id);
      }
      this.pts.set(p.id, merged);
      if (!this.nodes.has(p.id)) this.create(merged);
      this.place(p.id);
    }
    this.layoutOffValues();
    this.layoutLabels();
  }

  move(id: string, re: number, im: number, notify = false): void {
    const p = this.pts.get(id);
    if (!p) return;
    p.re = clamp(re, this.o.reMin, this.o.reMax);
    p.im = p.realOnly ? 0 : clamp(im, p.mirror ? 0 : -this.o.imMax, this.o.imMax);
    this.place(id);
    this.layoutLabels();
    if (notify) {
      this.o.onChange?.(p);
      this.describe();
    }
  }

  /** Keeps the current points as faint ghosts (call before setting the next run's points). */
  ghost(): void {
    this.setGhosts(this.all().map(({ re, im, kind, mirror, color }) => ({ re, im, kind, mirror, color })));
  }

  /** Faint, non-interactive markers of an earlier run; `[]` clears them. */
  setGhosts(ghosts: SGhost[]): void {
    this.ghosts = ghosts.map((g) => ({ ...g }));
    this.drawGhosts();
  }

  /**
   * A dashed circle of radius `r` around the origin: every point on it has the same ωn = |s|
   * (Chapter 6). `label` sits just left of the ω axis, under the circle, or just outside the circle
   * at angle `at` (degrees, counter-clockwise from +σ; e.g. 200 keeps it clear of a pole pair that
   * rides the circle). `null` hides it.
   */
  setCircle(r: number | null, label?: string, at?: number): void {
    this.circleState = r && r > 0 ? { r, label, at } : null;
    this.drawCircle();
  }

  /**
   * Constant-damping rays (both halves) from the origin for each ζ in (0, 1], each labelled
   * "ζ = 0.2" over its overshoot "53%" where it leaves the plane. `[]` removes them.
   */
  setRays(zetas: number[]): void {
    this.raysState = zetas.filter((z) => z > 0 && z <= 1);
    this.drawRays();
    this.layoutLabels();
  }

  /**
   * Vertical "settles ≈ 4/σ" lines at re = −σ for each σ > 0. The label drops its words and keeps
   * only the time ("2 s") when it would not fit the lower half of the plane. `[]` removes them.
   */
  setSettleLines(sigmas: number[]): void {
    this.settleState = sigmas.filter((v) => v > 0);
    this.drawSettle();
    this.layoutLabels();
  }

  private create(p: SPoint): void {
    const main = this.marker(p);
    const twin = p.mirror ? this.marker(p, true) : null;
    this.layer.append(main);
    if (twin) this.layer.append(twin);
    this.nodes.set(p.id, { main, twin });
    if (p.draggable) this.makeDraggable(p.id, main, twin);
  }

  private marker(p: Pick<SPoint, 'kind' | 'color' | 'draggable' | 'label'>, twin = false, ghost = false): SVGGElement {
    const g = s('g', { class: `pt pt-${p.kind}${p.draggable ? ' draggable' : ''}${twin ? ' twin' : ''}${ghost ? ' ghost' : ''}` });
    if (p.color) g.style.color = `var(--c-${p.color})`;
    if (!ghost) g.append(s('circle', { r: 22, class: 'hit' }));
    if (p.kind === 'pole') {
      g.append(s('path', { d: 'M-8,-8L8,8M8,-8L-8,8', class: 'x mark' }));
    } else if (p.kind === 'zero') {
      // a touch larger than a pole's ×, so a pole sitting on a zero still shows inside it
      g.append(s('circle', { r: 10, class: 'o mark' }));
    } else {
      g.append(s('circle', { r: 8, class: 'dot mark' }));
    }
    // off the plane: an arrow at the edge, pointing at where the point really is (its tip on the edge)
    g.append(s('path', { d: 'M0,0L-13,-7.5L-13,7.5Z', class: 'edge' }));
    if (!twin && !ghost) {
      // always there, so a label can be given later (place() fills it)
      g.append(s('text', { x: 12, y: -12, class: 'pt-label' }, p.label ?? ''));
      g.append(s('text', { class: 'off-value' }));
    }
    return g;
  }

  /** Positions a marker group at a true value (pinned to the edge if outside). */
  private put(g: SVGGElement, re: number, im: number): Placement {
    const pl = placement(re, im, this.o);
    const sc = this.k === 1 ? '' : ` scale(${this.k.toFixed(3)})`;
    g.setAttribute('transform', `translate(${this.sx(pl.re)},${this.sy(pl.im)})${sc}`);
    g.classList.toggle('off', pl.off);
    const edge = g.querySelector('.edge');
    if (edge && pl.off) edge.setAttribute('transform', `rotate(${pl.angle.toFixed(1)})`);
    return pl;
  }

  private place(id: string): void {
    const p = this.pts.get(id)!;
    const n = this.nodes.get(id)!;
    this.put(n.main, p.re, p.im);
    if (n.twin) this.put(n.twin, p.re, -p.im);
    if (p.draggable) n.main.setAttribute('aria-label', this.pointText(p));
    const lbl = n.main.querySelector('.pt-label');
    if (lbl && lbl.textContent !== (p.label ?? '')) lbl.textContent = p.label ?? '';
    if (n.twin) n.twin.style.display = Math.abs(p.im) < 1e-9 ? 'none' : '';
  }

  /**
   * Writes the true value beside each off-edge arrow, inside the plane. Arrows that land on the same
   * spot (two fast poles far off the left edge) share one label: "−51.3 · −202.0".
   */
  private layoutOffValues(): void {
    const groups = new Map<string, { text: SVGTextElement; pl: Placement; v: string }[]>();
    for (const [id, n] of this.nodes) {
      const text = n.main.querySelector<SVGTextElement>('.off-value');
      if (!text) continue;
      text.textContent = '';
      const p = this.pts.get(id)!;
      const pl = placement(p.re, p.im, this.o);
      if (!pl.off || this.o.offValues === false) continue;
      const key = `${Math.round(this.sx(pl.re) / 16)}:${Math.round(this.sy(pl.im) / 16)}`;
      const list = groups.get(key) ?? [];
      list.push({ text, pl, v: formatS(p.re, p.im, !!p.mirror, 1) });
      groups.set(key, list);
    }
    for (const list of groups.values()) {
      const { text, pl } = list[0];
      text.textContent = list.map((e) => e.v).join(' · ');
      const a = (pl.angle * Math.PI) / 180;
      if (Math.abs(Math.cos(a)) >= 0.5) {
        // off a side: beside the arrow's tail, just above it
        const left = Math.cos(a) < 0;
        text.setAttribute('x', String(left ? 17 : -17));
        text.setAttribute('y', '-9');
        text.setAttribute('text-anchor', left ? 'start' : 'end');
      } else {
        // off the top or bottom: beside the arrow, on the side away from the ω axis and its ticks
        const x = this.sx(pl.re);
        const x0 = this.sx(0);
        const toLeft = x < x0 ? x > W * 0.3 : x > W * 0.7;
        text.setAttribute('x', toLeft ? '-11' : '11');
        text.setAttribute('y', String(Math.sin(a) < 0 ? 17 : -9));
        text.setAttribute('text-anchor', toLeft ? 'end' : 'start');
      }
    }
  }

  private drawGhosts(): void {
    this.ghostLayer.replaceChildren();
    for (const g of this.ghosts) {
      for (const [i, q] of positionsOf(g).entries()) {
        const m = this.marker(g, i > 0, true);
        this.put(m, q.re, q.im);
        this.ghostLayer.append(m);
      }
    }
  }

  private drawCircle(): void {
    this.circleG.replaceChildren();
    const c = this.circleState;
    if (!c) return;
    const r = this.sx(c.r) - this.sx(0);
    this.circleG.append(s('circle', { class: 'guide', cx: this.sx(0), cy: this.sy(0), r }));
    if (!c.label) return;
    if (c.at === undefined) {
      // under the circle's lowest point, just left of the ω axis (inside the plane if the circle is taller)
      const y = this.sy(-Math.min(c.r, this.o.imMax * 0.92)) + 18 * this.k;
      this.circleG.append(s('text', { class: 'guide-label circle-label', x: this.sx(0) - 6, y: Math.min(y, this.H - 4), 'text-anchor': 'end' }, c.label));
      return;
    }
    // just outside the circle at the chosen angle, anchored away from it
    const a = (c.at * Math.PI) / 180;
    const pad = 5 * this.k;
    const x = this.sx(c.r * Math.cos(a)) + pad * Math.cos(a);
    const y = this.sy(c.r * Math.sin(a)) - pad * Math.sin(a);
    const anchor = Math.cos(a) < -0.3 ? 'end' : Math.cos(a) > 0.3 ? 'start' : 'middle';
    const text = s('text', { class: 'guide-label circle-label', x, y, 'text-anchor': anchor }, c.label);
    // below the centre line the label hangs under the point, above it sits on top
    text.setAttribute('dy', Math.sin(a) < 0 ? '0.9em' : '0');
    this.circleG.append(text);
  }

  private drawRays(): void {
    this.raysG.replaceChildren();
    this.rayLabels = [];
    const { o } = this;
    const m = 0.02 * (o.reMax - o.reMin);
    for (const z of this.raysState) {
      const th = Math.acos(z);
      const c = Math.cos(th);
      const sn = Math.sin(th);
      const far = 2 * Math.hypot(o.reMax - o.reMin, o.imMax);
      for (const sg of [1, -1]) {
        this.raysG.append(s('line', { class: 'guide ray', x1: this.sx(0), y1: this.sy(0), x2: this.sx(-far * c), y2: this.sy(sg * far * sn) }));
      }
      if (o.reMin >= 0) continue;
      // where the upper ray leaves the plane (top edge or left edge)
      const tTop = sn > EPS ? (o.imMax - m) / sn : Infinity;
      const tLeft = c > EPS ? (-o.reMin - m) / c : Infinity;
      const t = Math.min(tTop, tLeft);
      const px = this.sx(-t * c);
      const py = this.sy(t * sn);
      const lines = [tc('splane.rayZeta', { z: fmt(z, zetaDigits(z)) })];
      if (z < 1) lines.push(tc('splane.rayOs', { os: fmt(overshootOf(z), 0) }));
      const top = tTop <= tLeft;
      const text = s('text', { class: 'guide-label ray-label', 'text-anchor': top ? 'end' : 'start' });
      lines.forEach((line, i) => {
        const x = top ? px - 4 : px + 4;
        // at the top edge the label hangs under the exit point; at the left edge it sits above the ray
        const dy = top ? (i === 0 ? '0.9em' : '1.05em') : i === 0 ? `${-0.4 - 1.05 * (lines.length - 1)}em` : '1.05em';
        text.append(s('tspan', { x, dy }, line));
      });
      text.setAttribute('y', String(py));
      this.raysG.append(text);
      this.rayLabels.push({ text, top, py, n: lines.length });
    }
  }

  private drawSettle(): void {
    this.settleG.replaceChildren();
    this.settleLabels = [];
    for (const sig of this.settleState) {
      const x = this.sx(-sig);
      const ts = settleRule(sig);
      const v = fmt(ts, Number.isInteger(Math.round(ts * 10) / 10) ? 0 : 1);
      const full = tc('splane.settles', { t: v });
      const text = s('text', { class: 'guide-label settle-label', 'text-anchor': 'middle' }, full);
      this.settleG.append(s('line', { class: 'guide settle', x1: x, x2: x, y1: 0, y2: this.H }), text);
      this.settleLabels.push({ text, x, full, short: tc('splane.settlesShort', { t: v }) });
      this.putSettle(this.settleLabels[this.settleLabels.length - 1], -0.52, false, false);
    }
  }

  /** Writes a settling-line label along its line: at `at` × imMax, left or right of the line. */
  private putSettle(l: { text: SVGTextElement; x: number; full: string; short: string }, at: number, right: boolean, short: boolean): LabelBox | null {
    const txt = short ? l.short : l.full;
    if (l.text.textContent !== txt) l.text.textContent = txt;
    const y = this.sy(this.o.imMax * at);
    const b0 = bbox(l.text);
    // rotated −90°, the glyphs' tops face left: on the right of the line the text moves one line height over
    const lineH = b0?.h ?? 15 * this.k;
    const cx = right ? l.x + 4 + lineH * 0.8 : l.x - 4;
    l.text.setAttribute('x', String(cx));
    l.text.setAttribute('y', String(y));
    l.text.setAttribute('transform', `rotate(-90 ${cx} ${y})`);
    const b = bbox(l.text);
    if (!b) return null;
    // the box after the rotation about (cx, y)
    return { x: cx + (b.y - y), y: y - (b.x + b.w - cx), w: b.h, h: b.w };
  }

  /** Point in viewBox units of a marker group's local spot. */
  private markerBoxes(skip?: string): LabelBox[] {
    const out: LabelBox[] = [];
    const r = 11 * this.k;
    for (const [id, p] of this.pts) {
      if (id === skip) continue;
      for (const q of positionsOf(p)) {
        const pl = placement(q.re, q.im, this.o);
        out.push({ x: this.sx(pl.re) - r, y: this.sy(pl.im) - r, w: 2 * r, h: 2 * r });
      }
    }
    return out;
  }

  /**
   * Keeps labels off the markers and off each other: settling-line labels slide to the other half
   * or side of their line (or drop their words), ζ labels step aside along the edge or move to the
   * lower edge, and a point's own label picks the free corner around it.
   */
  private layoutLabels(): void {
    if (!this.svg.isConnected) return;
    const frame: LabelBox = { x: 0, y: 0, w: W, h: this.H };
    const fixed = this.fixedLabels.map(bbox).filter((b): b is LabelBox => !!b);
    const markers = this.markerBoxes();
    const ticks = this.tickLabels.map(bbox).filter((b): b is LabelBox => !!b);
    const placed: LabelBox[] = [];
    const room = this.H * 0.45;

    for (const l of this.settleLabels) {
      type C = [number, boolean, boolean];
      const spots: C[] = [];
      for (const short of [false, true])
        for (const right of [false, true]) for (const at of [-0.52, 0.52, -0.3, 0.3]) spots.push([at, right, short]);
      const fits = (c: C) => {
        const b = this.putSettle(l, ...c);
        return b && b.h <= room ? b : null;
      };
      const pick = firstFree(spots, fits, [...markers, ...fixed, ...placed], frame);
      const b = this.putSettle(l, ...pick);
      if (b) placed.push(b);
    }

    for (const l of this.rayLabels) {
      const b0 = bbox(l.text);
      if (!b0) continue;
      const blocker = [...markers, ...placed].find((m) => overlaps(b0, m));
      type C = { dx: number; dy: number; mirror: boolean };
      const shift = blocker ? (l.top ? blocker.x - 3 - (b0.x + b0.w) : blocker.y - 3 - (b0.y + b0.h)) : 0;
      const spots: C[] = [
        { dx: 0, dy: 0, mirror: false },
        { dx: l.top ? shift : 0, dy: l.top ? 0 : shift, mirror: false },
        { dx: 0, dy: 0, mirror: true },
      ];
      const apply = (c: C) => {
        const base = c.mirror ? this.H - l.py : l.py;
        l.text.setAttribute('y', String(base + c.dy));
        l.text.setAttribute('transform', c.dx ? `translate(${c.dx} 0)` : '');
        const tspans = [...l.text.querySelectorAll('tspan')];
        tspans.forEach((t, i) => {
          // mirrored to the lower edge the label stands on it instead of hanging from it (and the reverse)
          const hang = l.top !== c.mirror;
          t.setAttribute('dy', hang ? (i === 0 ? '0.9em' : '1.05em') : i === 0 ? `${-0.4 - 1.05 * (l.n - 1)}em` : '1.05em');
        });
        const b = bbox(l.text);
        return b ? { ...b, x: b.x + c.dx } : null;
      };
      const pick = firstFree(spots, apply, [...markers, ...fixed, ...placed], frame);
      const b = apply(pick);
      if (b) placed.push(b);
    }

    for (const [id, n] of this.nodes) {
      const lbl = n.main.querySelector<SVGTextElement>('.pt-label');
      const p = this.pts.get(id)!;
      if (!lbl || !p.label) continue;
      const pl = placement(p.re, p.im, this.o);
      const tx = this.sx(pl.re);
      const ty = this.sy(pl.im);
      const others = this.markerBoxes(id);
      const spots: [number, number, 'start' | 'end'][] = [
        [12, -12, 'start'],
        [-12, -12, 'end'],
        [12, 24, 'start'],
        [-12, 24, 'end'],
      ];
      const apply = ([x, y, anchor]: [number, number, 'start' | 'end']) => {
        lbl.setAttribute('x', String(x));
        lbl.setAttribute('y', String(y));
        lbl.setAttribute('text-anchor', anchor);
        const b = bbox(lbl);
        return b ? { x: tx + b.x * this.k, y: ty + b.y * this.k, w: b.w * this.k, h: b.h * this.k } : null;
      };
      const pick = firstFree(spots, apply, [...others, ...fixed, ...ticks, ...placed], frame);
      const b = apply(pick);
      if (b) placed.push(b);
    }
  }

  /**
   * Region captions ("settles down", "blows up") must fit their half of the plane: a caption too wide
   * for it breaks onto two lines at a space, and a single long word is narrowed to fit.
   */
  private fitRegionLabels(): void {
    for (const r of this.regionLabels) {
      const { el } = r;
      el.replaceChildren(r.text);
      el.removeAttribute('textLength');
      el.removeAttribute('lengthAdjust');
      const avail = r.to - r.from;
      let len = 0;
      try {
        len = el.getComputedTextLength();
      } catch {
        continue;
      }
      if (!len || len <= avail) continue;
      const words = r.text.split(' ');
      if (words.length > 1) {
        // the split that makes the longer line shortest
        let best = 1;
        let bestW = Infinity;
        for (let i = 1; i < words.length; i++) {
          const w = Math.max(words.slice(0, i).join(' ').length, words.slice(i).join(' ').length);
          if (w < bestW) (bestW = w), (best = i);
        }
        el.replaceChildren(
          s('tspan', { x: r.anchor, dy: '-1.1em' }, words.slice(0, best).join(' ')),
          s('tspan', { x: r.anchor, dy: '1.1em' }, words.slice(best).join(' ')),
        );
        const b = bbox(el);
        if (b && b.w <= avail) continue;
        el.replaceChildren(r.text);
      }
      el.setAttribute('textLength', String(avail));
      el.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
  }

  private pointText(p: SPoint): string {
    return describePoint(p, this.o);
  }

  /** Announce every point (true values) once the reader pauses, not on every drag frame or held arrow key. */
  describe(): void {
    clearTimeout(this.descTimer);
    this.descTimer = window.setTimeout(() => {
      const text = this.all()
        .map((p) => this.pointText(p))
        .join('; ');
      if (this.desc.textContent !== text) this.desc.textContent = text;
    }, 500);
  }

  private makeDraggable(id: string, main: SVGGElement, twin: SVGGElement | null): void {
    const p = () => this.pts.get(id)!;
    main.setAttribute('tabindex', '0');
    main.setAttribute('role', 'button');
    main.setAttribute('aria-roledescription', tc('splane.draggable'));
    const toS = (ev: PointerEvent): [number, number] => {
      const pt = this.svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const m = this.svg.getScreenCTM();
      if (!m) return [p().re, p().im];
      const loc = pt.matrixTransform(m.inverse());
      return this.inv(loc.x, loc.y);
    };
    const start = (g: SVGGElement, isTwin: boolean) => (ev: PointerEvent) => {
      ev.preventDefault();
      g.setPointerCapture(ev.pointerId);
      main.classList.add('dragging');
      const moveH = (e: PointerEvent) => {
        const [re, im] = toS(e);
        this.move(id, re, isTwin ? -im : im, true);
      };
      const up = () => {
        main.classList.remove('dragging');
        g.removeEventListener('pointermove', moveH);
        g.removeEventListener('pointerup', up);
        g.removeEventListener('pointercancel', up);
      };
      g.addEventListener('pointermove', moveH);
      g.addEventListener('pointerup', up);
      g.addEventListener('pointercancel', up);
    };
    main.addEventListener('pointerdown', start(main, false));
    twin?.addEventListener('pointerdown', start(twin, true));
    main.addEventListener('keydown', (ev) => {
      const base = this.o.step ?? 0.1;
      const st = base * (ev.shiftKey ? 5 : 1);
      const q = p();
      const { reMin, reMax, imMax } = this.o;
      let re: number;
      let im: number;
      switch (ev.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          re = snapStep(q.re, ev.key === 'ArrowLeft' ? -st : st, base);
          im = snapNearest(q.im, base);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          re = snapNearest(q.re, base);
          im = snapStep(q.im, ev.key === 'ArrowDown' ? -st : st, base);
          break;
        case 'Home':
          re = reMin;
          im = q.im;
          break;
        case 'End':
          re = reMax;
          im = q.im;
          break;
        default:
          return;
      }
      ev.preventDefault();
      // stay on the grid at the edges too
      this.move(id, clamp(re, reMin, reMax), clamp(im, -imMax, imMax), true);
    });
  }
}

function gridStep(span: number): number {
  const raw = span / 8;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

const fmtTick = (v: number): string => fmt(v, Number.isInteger(v) ? 0 : 1);

const zetaDigits = (z: number): number => (Math.abs(z * 10 - Math.round(z * 10)) < 1e-9 ? (Number.isInteger(z) ? 0 : 1) : 2);

/**
 * "−1.50 ± 3.00i" style formatting. A mirror pair that sits on the real axis is a double pole:
 * "−2.20 (double)".
 */
export function formatS(re: number, im: number, pair = false, digits = 2): string {
  const r = fmt(re, digits);
  if (Math.abs(im) < 1e-9) return pair ? tc('splane.double', { v: `⁦${r}⁩` }) : r;
  const sign = pair ? '±' : im >= 0 ? '+' : '−';
  return `${r} ${sign} ${fmt(Math.abs(im), digits)}i`;
}
