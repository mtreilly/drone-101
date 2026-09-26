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
  private desc: HTMLElement;
  private descTimer = 0;
  /** viewBox units per CSS pixel, so labels and markers keep a readable size in narrow columns */
  private k = 1;

  constructor(host: HTMLElement, public o: SPlaneOptions) {
    this.H = Math.round((W * 2 * o.imMax) / (o.reMax - o.reMin));
    this.svg = s('svg', {
      viewBox: `0 0 ${W} ${this.H}`,
      class: 's-plane',
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
      this.drawSettle();
      this.drawRays();
      this.drawCircle();
    });
    ro.observe(this.svg);
    // guide labels are measured; measure again once the hand-drawn font has arrived
    document.fonts?.ready.then(() => this.drawSettle());
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
      bg.append(
        s('rect', { x: 0, y: 0, width: x0, height: this.H, class: 'region-stable' }),
        s('rect', { x: x0, y: 0, width: W - x0, height: this.H, class: 'region-unstable' }),
        s('text', { x: 8, y: this.H - 10, class: 'region-label stable' }, tc('splane.stable')),
        s('text', { x: W - 8, y: this.H - 10, class: 'region-label unstable', 'text-anchor': 'end' }, tc('splane.unstable')),
      );
    }
    // grid
    const g = s('g', { class: 'grid' });
    const stepRe = gridStep(o.reMax - o.reMin);
    for (let r = Math.ceil(o.reMin / stepRe) * stepRe; r <= o.reMax; r += stepRe) {
      if (Math.abs(r) < 1e-9) continue;
      g.append(s('line', { x1: this.sx(r), x2: this.sx(r), y1: 0, y2: this.H }));
      g.append(s('text', { x: this.sx(r), y: this.sy(0) + 16, 'text-anchor': 'middle', class: 'tick' }, fmtTick(r)));
    }
    const stepIm = gridStep(2 * o.imMax);
    for (let i = Math.ceil(-o.imMax / stepIm) * stepIm; i <= o.imMax; i += stepIm) {
      if (Math.abs(i) < 1e-9) continue;
      g.append(s('line', { x1: 0, x2: W, y1: this.sy(i), y2: this.sy(i) }));
      g.append(s('text', { x: x0 - 5, y: this.sy(i) + 4, 'text-anchor': 'end', class: 'tick' }, `${fmtTick(i)}i`));
    }
    bg.append(g);
    // rough axes
    const rc = rough.svg(this.svg);
    const axisOpts = { stroke: 'currentColor', strokeWidth: 1.5, roughness: 0.8, seed: 3 };
    const ax = s('g', { class: 'axes' });
    ax.append(rc.line(0, this.sy(0), W, this.sy(0), axisOpts), rc.line(x0, 0, x0, this.H, axisOpts));
    ax.append(
      s('text', { x: W - 6, y: this.sy(0) - 8, 'text-anchor': 'end', class: 'axis-label' }, o.reLabel ?? tc('splane.re')),
      s('text', { x: x0 + 8, y: 16, class: 'axis-label' }, o.imLabel ?? tc('splane.im')),
    );
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
  }

  move(id: string, re: number, im: number, notify = false): void {
    const p = this.pts.get(id);
    if (!p) return;
    p.re = clamp(re, this.o.reMin, this.o.reMax);
    p.im = p.realOnly ? 0 : clamp(im, p.mirror ? 0 : -this.o.imMax, this.o.imMax);
    this.place(id);
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
  }

  /**
   * Vertical "settles ≈ 4/σ" lines at re = −σ for each σ > 0. The label drops its words and keeps
   * only the time ("2 s") when it would not fit the lower half of the plane. `[]` removes them.
   */
  setSettleLines(sigmas: number[]): void {
    this.settleState = sigmas.filter((v) => v > 0);
    this.drawSettle();
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
      g.append(s('circle', { r: 8, class: 'o mark' }));
    } else {
      g.append(s('circle', { r: 8, class: 'dot mark' }));
    }
    // off the plane: an arrow at the edge, pointing at where the point really is (its tip on the edge)
    g.append(s('path', { d: 'M0,0L-13,-7.5L-13,7.5Z', class: 'edge' }));
    if (!twin && !ghost) {
      if (p.label) g.append(s('text', { x: 12, y: -12, class: 'pt-label' }, p.label));
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
    }
  }

  private drawSettle(): void {
    this.settleG.replaceChildren();
    const room = (this.H / 2) * 0.9;
    for (const sig of this.settleState) {
      const x = this.sx(-sig);
      const ts = settleRule(sig);
      const v = fmt(ts, Number.isInteger(Math.round(ts * 10) / 10) ? 0 : 1);
      const y = this.sy(-this.o.imMax * 0.52);
      const text = s('text', { class: 'guide-label settle-label', x: x - 4, y, transform: `rotate(-90 ${x - 4} ${y})`, 'text-anchor': 'middle' }, tc('splane.settles', { t: v }));
      this.settleG.append(s('line', { class: 'guide settle', x1: x, x2: x, y1: 0, y2: this.H }), text);
      let len = 0;
      try {
        len = text.getComputedTextLength();
      } catch {
        /* not rendered yet */
      }
      if (len > room) text.textContent = tc('splane.settlesShort', { t: v });
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
