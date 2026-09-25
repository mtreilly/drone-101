import rough from 'roughjs';
import { h, s, clamp, prefersReducedMotion } from '../core/dom';
import { fmt } from '../core/i18n';
import { tempColor } from './colors';

export interface ShowerViewOptions {
  /** accessible labels */
  labels: { aria: string; knob: string; cold: string; hot: string; pipe: string; head: string; thermo: string };
  /** knob moves → callback (u in 0..1). If absent, knob is display-only. */
  onKnob?: (u: number) => void;
  target?: number;
  band?: number;
}

const W = 420;
const H = 300;
const KNOB = { x: 70, y: 230, r: 34 };
const PIPE: [number, number][] = [
  [70, 190],
  [70, 70],
  [120, 40],
  [300, 40],
  [330, 60],
];
const HEAD = { x: 330, y: 70 };
const THERMO = { x: 395, top: 80, bottom: 260 };
const TMIN = 15;
const TMAX = 60;

/**
 * The shower: a knob (the learner's control), a long pipe whose water carries the
 * temperature history (the delay you can *see*), a shower head, and a thermometer.
 */
export class ShowerView {
  readonly el: HTMLElement;
  readonly knob: SVGGElement;
  private svg: SVGSVGElement;
  private pointer: SVGGElement;
  private segs: SVGPathElement[] = [];
  private drops: SVGGElement;
  private mercury: SVGRectElement;
  private tempText: SVGTextElement;
  private u = 0;
  private dropPhase = 0;
  private enabled = true;

  constructor(host: HTMLElement, private o: ShowerViewOptions) {
    const L = o.labels;
    this.svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'view shower-view', role: 'group', 'aria-label': L.aria });
    const rc = rough.svg(this.svg);
    const ink = 'currentColor';
    // wall tiles
    const tiles = s('g', { opacity: 0.16 });
    for (let x = 150; x < 370; x += 44) for (let y = 80; y < 290; y += 44) tiles.append(s('rect', { x, y, width: 44, height: 44, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 0.8 }));
    // pipe outline
    const pipeD = PIPE.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    const pipeOutline = s('path', { d: pipeD, fill: 'none', stroke: ink, 'stroke-width': 17, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const pipeInner = s('g', { class: 'pipe-water' });
    // split pipe into equal-length segments
    const N = 30;
    const pts = resample(PIPE, N + 1);
    for (let i = 0; i < N; i++) {
      const seg = s('path', { d: `M${pts[i][0]} ${pts[i][1]} L${pts[i + 1][0]} ${pts[i + 1][1]}`, stroke: tempColor(15), 'stroke-width': 11, 'stroke-linecap': 'round', fill: 'none' });
      this.segs.push(seg);
      pipeInner.append(seg);
    }
    const pipeLabel = s('text', { x: 210, y: 26, 'text-anchor': 'middle', 'font-size': 17, fill: 'var(--ink-2)' }, L.pipe);
    // head
    const head = s('g');
    head.append(rc.path(`M${HEAD.x - 26} ${HEAD.y} L${HEAD.x + 26} ${HEAD.y} L${HEAD.x + 16} ${HEAD.y - 14} L${HEAD.x - 16} ${HEAD.y - 14} Z`, { stroke: ink, strokeWidth: 2, fill: 'var(--card)', fillStyle: 'solid', seed: 4 }));
    this.drops = s('g', { class: 'drops' });
    // thermometer
    const th = s('g');
    th.append(
      rc.rectangle(THERMO.x - 9, THERMO.top - 6, 18, THERMO.bottom - THERMO.top + 12, { stroke: ink, strokeWidth: 1.8, fill: 'var(--card)', fillStyle: 'solid', seed: 9 }),
      rc.circle(THERMO.x, THERMO.bottom + 16, 26, { stroke: ink, strokeWidth: 1.8, fill: 'var(--c-output)', fillStyle: 'solid', seed: 10 }),
    );
    this.mercury = s('rect', { x: THERMO.x - 4, width: 8, fill: 'var(--c-output)', rx: 3 });
    const tgt = o.target ?? 38;
    const band = o.band ?? 1;
    const ty = (t: number) => THERMO.bottom - ((t - TMIN) / (TMAX - TMIN)) * (THERMO.bottom - THERMO.top);
    th.append(
      s('rect', { x: THERMO.x - 14, y: ty(tgt + band), width: 28, height: ty(tgt - band) - ty(tgt + band), fill: 'var(--c-setpoint)', opacity: 0.25 }),
      s('line', { x1: THERMO.x - 16, x2: THERMO.x + 16, y1: ty(tgt), y2: ty(tgt), stroke: 'var(--c-setpoint)', 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
      s('text', { x: THERMO.x - 18, y: ty(tgt) + 5, 'text-anchor': 'end', 'font-size': 15, fill: 'var(--c-setpoint)', 'font-weight': 700 }, `${tgt}°`),
    );
    th.append(this.mercury);
    this.tempText = s('text', { x: THERMO.x, y: THERMO.top - 14, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: 'var(--c-output)' });
    // knob
    this.knob = s('g', { class: 'knob', transform: `translate(${KNOB.x},${KNOB.y})` });
    const dial = s('g');
    dial.append(
      rc.circle(0, 0, KNOB.r * 2 + 16, { stroke: 'var(--ink-3)', strokeWidth: 1, roughness: 0.6, seed: 12 }),
      s('text', { x: -KNOB.r - 12, y: 26, 'font-size': 22, fill: tempColor(15), 'text-anchor': 'end' }, L.cold),
      s('text', { x: KNOB.r + 12, y: 26, 'font-size': 22, fill: tempColor(60) }, L.hot),
    );
    this.pointer = s('g');
    this.pointer.append(
      rc.circle(0, 0, KNOB.r * 2, { stroke: 'var(--c-effort)', strokeWidth: 3, fill: 'var(--card)', fillStyle: 'solid', roughness: 0.7, seed: 13 }),
      s('line', { x1: 0, y1: -6, x2: 0, y2: -KNOB.r + 6, stroke: 'var(--c-effort)', 'stroke-width': 5, 'stroke-linecap': 'round' }),
      s('circle', { r: 5, fill: 'var(--c-effort)' }),
    );
    this.knob.append(dial, this.pointer, s('circle', { r: KNOB.r + 14, fill: 'transparent', class: 'knob-hit' }));
    this.svg.append(tiles, pipeOutline, pipeInner, pipeLabel, head, this.drops, th, this.tempText, this.knob);
    this.el = h('div', { class: 'shower-wrap' }, this.svg);
    host.append(this.el);
    if (o.onKnob) this.makeInteractive(L.knob);
    this.setKnob(0);
    this.update({ u: 0, pipe: Array.from({ length: N }, () => 15), temp: 15 });
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.knob.style.opacity = on ? '1' : '0.7';
    this.knob.setAttribute('aria-disabled', String(!on));
  }

  private makeInteractive(label: string): void {
    const k = this.knob;
    k.setAttribute('tabindex', '0');
    k.setAttribute('role', 'slider');
    k.setAttribute('aria-label', label);
    k.setAttribute('aria-valuemin', '0');
    k.setAttribute('aria-valuemax', '100');
    k.style.cursor = 'grab';
    k.style.touchAction = 'none';
    const fromPointer = (ev: PointerEvent) => {
      const pt = this.svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const m = this.svg.getScreenCTM();
      if (!m) return;
      const p = pt.matrixTransform(m.inverse());
      // angle from straight up, clockwise; knob spans −135°…+135°
      let ang = (Math.atan2(p.x - KNOB.x, -(p.y - KNOB.y)) * 180) / Math.PI;
      ang = clamp(ang, -135, 135);
      this.emit((ang + 135) / 270);
    };
    k.addEventListener('pointerdown', (ev) => {
      if (!this.enabled) return;
      k.setPointerCapture(ev.pointerId);
      fromPointer(ev);
      const move = (e: PointerEvent) => fromPointer(e);
      const up = () => {
        k.removeEventListener('pointermove', move);
        k.removeEventListener('pointerup', up);
      };
      k.addEventListener('pointermove', move);
      k.addEventListener('pointerup', up);
    });
    k.addEventListener('keydown', (ev) => {
      if (!this.enabled) return;
      const step: Record<string, number> = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02, PageUp: 0.1, PageDown: -0.1 };
      if (ev.key in step) {
        ev.preventDefault();
        this.emit(this.u + step[ev.key]);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        this.emit(0);
      } else if (ev.key === 'End') {
        ev.preventDefault();
        this.emit(1);
      }
    });
  }

  private emit(u: number): void {
    const v = clamp(u, 0, 1);
    this.setKnob(v);
    this.o.onKnob?.(v);
  }

  setKnob(u: number): void {
    this.u = u;
    this.pointer.setAttribute('transform', `rotate(${-135 + 270 * u})`);
    if (!this.o.onKnob) return;
    this.knob.setAttribute('aria-valuenow', String(Math.round(u * 100)));
    this.knob.setAttribute('aria-valuetext', `${Math.round(u * 100)}% ${this.o.labels.hot}`);
  }

  /** @param pipe temperatures from valve → head */
  update(st: { u: number; pipe: number[]; temp: number }, dt = 0): void {
    if (Math.abs(st.u - this.u) > 1e-6) this.setKnob(st.u);
    const n = this.segs.length;
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i / (n - 1)) * (st.pipe.length - 1));
      this.segs[i].setAttribute('stroke', tempColor(st.pipe[idx]));
    }
    const t = clamp(st.temp, TMIN, TMAX);
    const top = THERMO.bottom - ((t - TMIN) / (TMAX - TMIN)) * (THERMO.bottom - THERMO.top);
    this.mercury.setAttribute('y', String(top));
    this.mercury.setAttribute('height', String(THERMO.bottom + 8 - top));
    this.tempText.textContent = `${fmt(st.temp, 1)} °C`;
    this.drawDrops(st.temp, dt);
  }

  private drawDrops(temp: number, dt: number): void {
    if (!prefersReducedMotion()) this.dropPhase = (this.dropPhase + dt * 2.2) % 1;
    const c = tempColor(temp);
    if (!this.drops.childElementCount) {
      for (let i = 0; i < 18; i++) this.drops.append(s('line', { 'stroke-width': 3, 'stroke-linecap': 'round' }));
    }
    const kids = this.drops.children;
    for (let i = 0; i < kids.length; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const f = (this.dropPhase + row / 3) % 1;
      const x = HEAD.x - 20 + col * 8 + (col - 2.5) * f * 10;
      const y = HEAD.y + 6 + f * 190;
      const el = kids[i] as SVGLineElement;
      el.setAttribute('x1', String(x));
      el.setAttribute('x2', String(x + (col - 2.5) * 0.8));
      el.setAttribute('y1', String(y));
      el.setAttribute('y2', String(y + 9));
      el.setAttribute('stroke', c);
      el.setAttribute('opacity', String(0.85 - f * 0.5));
    }
  }
}

function resample(poly: [number, number][], n: number): [number, number][] {
  const lens = [0];
  for (let i = 1; i < poly.length; i++) lens.push(lens[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const total = lens[lens.length - 1];
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const d = (k / (n - 1)) * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < d) i++;
    const f = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
    out.push([poly[i - 1][0] + f * (poly[i][0] - poly[i - 1][0]), poly[i - 1][1] + f * (poly[i][1] - poly[i - 1][1])]);
  }
  return out;
}
