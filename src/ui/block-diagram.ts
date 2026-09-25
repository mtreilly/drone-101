import rough from 'roughjs';
import { h, s } from '../core/dom';
import { setRich } from '../core/rich-text';

export interface DBlock {
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  kind?: 'box' | 'sum';
  /** colour key for the box outline */
  color?: string;
}

export interface DArrow {
  id: string;
  points: [number, number][];
  label?: string;
  labelAt?: [number, number];
  color?: string;
  /** sign at the arrowhead for summing junctions */
  sign?: '+' | '−';
}

export interface DiagramSpec {
  width: number;
  height: number;
  blocks: DBlock[];
  arrows: DArrow[];
  label: string;
  /** optional text description for screen readers */
  description?: string;
}

const COLOR_VAR: Record<string, string> = {
  sp: 'var(--c-setpoint)',
  out: 'var(--c-output)',
  err: 'var(--c-error)',
  eff: 'var(--c-effort)',
  dis: 'var(--c-disturb)',
};

/** Hand-drawn block diagram whose parts can be highlighted in sync with a simulation. */
export class BlockDiagram {
  readonly el: HTMLElement;
  private parts = new Map<string, SVGGElement>();

  constructor(host: HTMLElement, spec: DiagramSpec) {
    const svg = s('svg', { viewBox: `0 0 ${spec.width} ${spec.height}`, class: 'block-diagram', role: 'img', 'aria-label': spec.label });
    const rc = rough.svg(svg);
    let seed = 1;
    for (const a of spec.arrows) {
      const g = s('g', { class: 'blk arrow' });
      const col = a.color ? COLOR_VAR[a.color] ?? a.color : 'currentColor';
      const opts = { stroke: col, strokeWidth: 2.2, roughness: 0.7, seed: seed++ };
      for (let i = 1; i < a.points.length; i++) g.append(rc.line(a.points[i - 1][0], a.points[i - 1][1], a.points[i][0], a.points[i][1], opts));
      const [x2, y2] = a.points[a.points.length - 1];
      const [x1, y1] = a.points[a.points.length - 2];
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const hx = (d: number, off: number) => x2 - 12 * Math.cos(ang + off) * d;
      const hy = (d: number, off: number) => y2 - 12 * Math.sin(ang + off) * d;
      g.append(s('path', { d: `M${hx(1, 0.45)} ${hy(1, 0.45)} L${x2} ${y2} L${hx(1, -0.45)} ${hy(1, -0.45)}`, fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
      if (a.label) {
        const [lx, ly] = a.labelAt ?? [(a.points[0][0] + x2) / 2, (a.points[0][1] + y2) / 2 - 8];
        g.append(s('text', { x: lx, y: ly, 'text-anchor': 'middle', class: 'sig-label', fill: col }, a.label));
      }
      if (a.sign) g.append(s('text', { x: x2 - 16 * Math.cos(ang) + 10, y: y2 - 16 * Math.sin(ang) + (Math.abs(Math.sin(ang)) > 0.5 ? 0 : -8), class: 'sig-label', 'font-weight': 700 }, a.sign));
      this.parts.set(a.id, g);
      svg.append(g);
    }
    for (const b of spec.blocks) {
      const g = s('g', { class: 'blk box' });
      const col = b.color ? COLOR_VAR[b.color] ?? b.color : 'currentColor';
      if (b.kind === 'sum') {
        g.append(rc.circle(b.x, b.y, 30, { stroke: col, strokeWidth: 2, fill: 'var(--card)', fillStyle: 'solid', seed: seed++ }));
        g.append(s('text', { x: b.x, y: b.y + 7, 'text-anchor': 'middle' }, b.label || 'Σ'));
      } else {
        const w = b.w ?? 120;
        const hh = b.h ?? 52;
        g.append(rc.rectangle(b.x - w / 2, b.y - hh / 2, w, hh, { stroke: col, strokeWidth: 2, fill: 'var(--card)', fillStyle: 'solid', roughness: 1, seed: seed++ }));
        const lines = b.label.split('\n');
        lines.forEach((ln, i) => g.append(s('text', { x: b.x, y: b.y + 7 + (i - (lines.length - 1) / 2) * 22, 'text-anchor': 'middle' }, ln)));
      }
      this.parts.set(b.id, g);
      svg.append(g);
    }
    this.el = h('figure', { class: 'diagram', style: { margin: 0 } }, svg);
    if (spec.description) this.el.append(setRich(h('figcaption', { class: 'visually-hidden' }), spec.description));
    host.append(this.el);
  }

  /** Highlights the given parts; with `dimOthers`, fades everything else. */
  highlight(ids: string[], dimOthers = false): void {
    const set = new Set(ids);
    for (const [id, g] of this.parts) {
      g.classList.toggle('lit', set.has(id));
      g.classList.toggle('dim', dimOthers && !set.has(id));
    }
  }

  /** Shows or hides parts (used to "draw" the loop step by step). */
  show(ids: string[], visible: boolean): void {
    for (const id of ids) {
      const g = this.parts.get(id);
      if (g) g.style.display = visible ? '' : 'none';
    }
  }
}
