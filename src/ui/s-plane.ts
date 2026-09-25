import rough from 'roughjs';
import { h, s, clamp } from '../core/dom';
import { fmt, tc } from '../core/i18n';

export interface SPoint {
  id: string;
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
  /** keyboard step in s-units */
  step?: number;
  /** optional max width in px */
  maxWidth?: number;
}

const W = 400;

/** The s-plane: draggable poles/zeros/points with keyboard support and live description. */
export class SPlane {
  readonly el: HTMLElement;
  readonly svg: SVGSVGElement;
  private H: number;
  private pts = new Map<string, SPoint>();
  private nodes = new Map<string, { main: SVGGElement; twin: SVGGElement | null }>();
  private layer: SVGGElement;
  /** decoration layer under the points (guides, trails) */
  readonly deco: SVGGElement;
  private desc: HTMLElement;
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
    this.layer = s('g', { class: 'points' });
    this.desc = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
    this.drawBackground();
    this.svg.append(this.deco, this.layer);
    this.el = h('div', { class: 's-plane-wrap', style: o.maxWidth ? { maxWidth: `${o.maxWidth}px` } : undefined }, this.svg, this.desc);
    host.append(this.el);
    const ro = new ResizeObserver(() => {
      const w = this.svg.clientWidth || W;
      const k = Math.min(1.8, Math.max(1, (W / w) * 0.75));
      if (Math.abs(k - this.k) < 0.02) return;
      this.k = k;
      this.svg.style.setProperty('--k', k.toFixed(3));
      for (const id of this.pts.keys()) this.place(id);
    });
    ro.observe(this.svg);
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

  /** Adds or updates points. */
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

  private create(p: SPoint): void {
    const main = this.marker(p);
    const twin = p.mirror ? this.marker(p, true) : null;
    this.layer.append(main);
    if (twin) this.layer.append(twin);
    this.nodes.set(p.id, { main, twin });
    if (p.draggable) this.makeDraggable(p.id, main, twin);
  }

  private marker(p: SPoint, twin = false): SVGGElement {
    const g = s('g', { class: `pt pt-${p.kind}${p.draggable ? ' draggable' : ''}${twin ? ' twin' : ''}` });
    if (p.color) g.style.color = `var(--c-${p.color})`;
    g.append(s('circle', { r: 22, class: 'hit' }));
    if (p.kind === 'pole') {
      g.append(s('path', { d: 'M-8,-8L8,8M8,-8L-8,8', class: 'x' }));
    } else if (p.kind === 'zero') {
      g.append(s('circle', { r: 8, class: 'o' }));
    } else {
      g.append(s('circle', { r: 8, class: 'dot' }));
    }
    if (p.label && !twin) g.append(s('text', { x: 12, y: -12, class: 'pt-label' }, p.label));
    return g;
  }

  private place(id: string): void {
    const p = this.pts.get(id)!;
    const n = this.nodes.get(id)!;
    const sc = this.k === 1 ? '' : ` scale(${this.k.toFixed(3)})`;
    n.main.setAttribute('transform', `translate(${this.sx(p.re)},${this.sy(p.im)})${sc}`);
    n.twin?.setAttribute('transform', `translate(${this.sx(p.re)},${this.sy(-p.im)})${sc}`);
    if (p.draggable) n.main.setAttribute('aria-label', this.pointText(p));
    if (n.twin) n.twin.style.display = Math.abs(p.im) < 1e-9 ? 'none' : '';
  }

  private pointText(p: SPoint): string {
    const name = p.label ?? tc(`splane.${p.kind}`);
    return `${name}: ${formatS(p.re, p.im, !!p.mirror)}`;
  }

  describe(): void {
    this.desc.textContent = this.all()
      .map((p) => this.pointText(p))
      .join('; ');
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
      const st = (this.o.step ?? 0.1) * (ev.shiftKey ? 5 : 1);
      const q = p();
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-st, 0],
        ArrowRight: [st, 0],
        ArrowUp: [0, st],
        ArrowDown: [0, -st],
      };
      const d = map[ev.key];
      if (!d) return;
      ev.preventDefault();
      this.move(id, round(q.re + d[0]), round(q.im + d[1]), true);
    });
  }
}

const round = (v: number): number => Math.round(v * 1000) / 1000;

function gridStep(span: number): number {
  const raw = span / 8;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

const fmtTick = (v: number): string => fmt(v, Number.isInteger(v) ? 0 : 1);

/** "−1.50 ± 3.00i" style formatting. */
export function formatS(re: number, im: number, pair = false): string {
  const r = fmt(re, 2);
  if (Math.abs(im) < 1e-9) return r;
  const sign = pair ? '±' : im >= 0 ? '+' : '−';
  return `${r} ${sign} ${fmt(Math.abs(im), 2)}i`;
}
