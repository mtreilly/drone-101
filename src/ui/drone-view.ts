import rough from 'roughjs';
import { h, s, prefersReducedMotion } from '../core/dom';
import { fmt, tc } from '../core/i18n';

export interface DroneViewOptions {
  hMax?: number;
  width?: number;
  showThrust?: boolean;
  showScale?: boolean;
  /** show a noisy "sensor reading" marker */
  showSensor?: boolean;
}

export interface DroneState {
  h: number;
  r?: number | null;
  thrust?: number;
  wind?: number;
  pkg?: number;
  crashed?: boolean;
  measured?: number;
}

const W = 240;
const H = 340;
const GROUND = 305;
const TOP = 25;

/** Side view of the drone. Drawn once with Rough.js; updates only move things. */
export class DroneView {
  readonly el: HTMLElement;
  private svg: SVGSVGElement;
  private drone: SVGGElement;
  private thrustArrow: SVGPathElement;
  private thrustLabel: SVGTextElement;
  private setLine: SVGGElement;
  private windG: SVGGElement;
  private pkgG: SVGGElement;
  private crash: SVGTextElement;
  private readout: SVGTextElement;
  private sensor: SVGCircleElement;
  private desc: HTMLElement;
  private hMax: number;
  private lastDesc = 0;

  constructor(host: HTMLElement, private o: DroneViewOptions = {}) {
    this.hMax = o.hMax ?? 3;
    this.svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'view drone-view', role: 'img', 'aria-label': tc('drone.aria') });
    const rc = rough.svg(this.svg);
    const ink = 'currentColor';
    // scale
    const scale = s('g', { class: 'scale' });
    if (o.showScale !== false) {
      for (let m = 0; m <= this.hMax; m += 0.5) {
        const y = this.y(m);
        const major = Number.isInteger(m);
        scale.append(s('line', { x1: 22, x2: major ? 34 : 29, y1: y, y2: y, stroke: 'var(--ink-3)', 'stroke-width': 1.2 }));
        if (major) scale.append(s('text', { x: 18, y: y + 5, 'text-anchor': 'end', 'font-size': 16, fill: 'var(--ink-3)' }, `${m} m`));
      }
      scale.append(s('line', { x1: 22, x2: 22, y1: this.y(this.hMax), y2: GROUND, stroke: 'var(--ink-3)', 'stroke-width': 1.2 }));
    }
    // ground
    const ground = s('g', { class: 'ground' });
    ground.append(rc.line(0, GROUND, W, GROUND, { stroke: ink, strokeWidth: 2, roughness: 1.2, seed: 2 }));
    ground.append(rc.rectangle(0, GROUND + 2, W, H - GROUND, { stroke: 'none', fill: 'var(--paper-3)', fillStyle: 'hachure', hachureGap: 7, hachureAngle: 60, seed: 3 }));
    // setpoint
    this.setLine = s('g', { class: 'setpoint' });
    this.setLine.append(
      s('line', { x1: 36, x2: W - 6, y1: 0, y2: 0, stroke: 'var(--c-setpoint)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }),
      s('text', { x: W - 8, y: -6, 'text-anchor': 'end', 'font-size': 17, fill: 'var(--c-setpoint)', 'font-weight': 700 }, tc('drone.target')),
    );
    // drone
    this.drone = s('g', { class: 'drone' });
    const cx = 135;
    const body = s('g');
    body.append(rc.line(cx - 42, 0, cx + 42, 0, { stroke: ink, strokeWidth: 3, roughness: 0.6, seed: 5 }));
    body.append(rc.rectangle(cx - 18, -9, 36, 16, { stroke: ink, strokeWidth: 2, fill: 'var(--card)', fillStyle: 'solid', roughness: 0.9, seed: 6 }));
    body.append(rc.line(cx - 42, 0, cx - 42, -8, { stroke: ink, strokeWidth: 2, seed: 7 }), rc.line(cx + 42, 0, cx + 42, -8, { stroke: ink, strokeWidth: 2, seed: 8 }));
    body.append(rc.line(cx - 12, 8, cx - 18, 16, { stroke: ink, strokeWidth: 2, seed: 9 }), rc.line(cx + 12, 8, cx + 18, 16, { stroke: ink, strokeWidth: 2, seed: 10 }));
    body.append(s('circle', { cx: cx + 8, cy: -1, r: 3, fill: 'var(--c-output)' }));
    for (const px of [cx - 42, cx + 42]) {
      const prop = rc.ellipse(px, -10, 38, 6, { stroke: ink, strokeWidth: 1.5, fill: 'var(--paper-3)', fillStyle: 'solid', roughness: 0.6, seed: px });
      prop.classList.add('propeller');
      body.append(prop);
    }
    this.thrustArrow = s('path', { fill: 'none', stroke: 'var(--c-effort)', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    this.thrustLabel = s('text', { 'font-size': 16, fill: 'var(--c-effort)', 'font-weight': 700, x: cx + 8 });
    this.pkgG = s('g', { class: 'package' });
    this.pkgG.append(
      s('line', { x1: cx, x2: cx, y1: 10, y2: 26, stroke: ink, 'stroke-width': 1.5 }),
      rc.rectangle(cx - 12, 26, 24, 20, { stroke: ink, fill: '#c9a26b', fillStyle: 'solid', strokeWidth: 1.6, seed: 11 }),
      rc.line(cx - 12, 36, cx + 12, 36, { stroke: ink, strokeWidth: 1, seed: 12 }),
    );
    this.drone.append(this.thrustArrow, this.thrustLabel, this.pkgG, body);
    this.sensor = s('circle', { r: 4, cx: 60, fill: 'none', stroke: 'var(--c-output)', 'stroke-width': 2, 'stroke-dasharray': '2 2', opacity: 0 });
    this.windG = s('g', { class: 'wind' });
    this.crash = s('text', { x: W / 2 + 10, y: GROUND - 60, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 700, fill: 'var(--c-error)', opacity: 0 }, tc('drone.crash'));
    this.readout = s('text', { x: 40, y: 22, 'font-size': 18, fill: 'var(--c-output)', 'font-weight': 700 });
    this.svg.append(scale, ground, this.setLine, this.windG, this.drone, this.sensor, this.crash, this.readout);
    this.desc = h('p', { class: 'visually-hidden', 'aria-live': 'off' });
    this.el = h('div', { class: 'drone-wrap', style: { maxWidth: `${o.width ?? 300}px`, margin: '0 auto' } }, this.svg, this.desc);
    host.append(this.el);
    this.update({ h: 0, r: 2, thrust: 0 });
  }

  y(m: number): number {
    return GROUND - 10 - (m / this.hMax) * (GROUND - 10 - TOP);
  }

  update(st: DroneState): void {
    const hClamped = Math.max(-0.1, Math.min(this.hMax + 0.3, st.h));
    this.drone.setAttribute('transform', `translate(0, ${this.y(hClamped) - 6})`);
    if (st.r === null || st.r === undefined) this.setLine.style.display = 'none';
    else {
      this.setLine.style.display = '';
      this.setLine.setAttribute('transform', `translate(0, ${this.y(st.r)})`);
    }
    const T = st.thrust ?? 0;
    if (this.o.showThrust !== false && Math.abs(T) > 0.05) {
      const len = Math.max(-60, Math.min(90, T * 3.2));
      const x = 135;
      const y0 = -14;
      const y1 = y0 - len;
      const dir = len > 0 ? 1 : -1;
      this.thrustArrow.setAttribute('d', `M${x} ${y0} L${x} ${y1} M${x - 6} ${y1 + 8 * dir} L${x} ${y1} L${x + 6} ${y1 + 8 * dir}`);
      this.thrustLabel.setAttribute('y', String(y1 - 4 * dir + (dir < 0 ? 12 : 0)));
      this.thrustLabel.textContent = `${fmt(T, 1)} N`;
      this.thrustArrow.style.display = this.thrustLabel.style.display = '';
    } else {
      this.thrustArrow.style.display = this.thrustLabel.style.display = 'none';
    }
    this.svg.classList.toggle('spinning', T > 0.05 && !prefersReducedMotion());
    this.pkgG.style.display = (st.pkg ?? 0) > 0 ? '' : 'none';
    this.drawWind(st.wind ?? 0, this.y(hClamped));
    this.crash.setAttribute('opacity', st.crashed ? '1' : '0');
    this.readout.textContent = `${tc('drone.height')}: ${fmt(Math.max(0, st.h), 2)} m`;
    if (this.o.showSensor && st.measured !== undefined) {
      this.sensor.setAttribute('opacity', '1');
      this.sensor.setAttribute('cy', String(this.y(st.measured) - 6));
    }
    const now = performance.now();
    if (now - this.lastDesc > 1500) {
      this.lastDesc = now;
      this.desc.textContent = tc('drone.describe', { h: fmt(Math.max(0, st.h), 2), r: st.r != null ? fmt(st.r, 1) : '—', T: fmt(T, 1) });
    }
  }

  private windKey = '';
  private drawWind(w: number, yDrone: number): void {
    const key = Math.abs(w) < 0.05 ? '' : `${Math.sign(w)}:${Math.round(yDrone / 4)}`;
    if (key === this.windKey) return;
    this.windKey = key;
    this.windG.replaceChildren();
    if (!key) return;
    const dir = w > 0 ? -1 : 1; // positive force = up = negative y
    for (const x of [70, 200]) {
      const yc = yDrone - 10;
      const y0 = yc - 22 * dir;
      const y1 = yc + 22 * dir;
      this.windG.append(
        s('path', {
          d: `M${x} ${y0} q 6 ${11 * dir} 0 ${22 * dir} q -6 ${11 * dir} 0 ${22 * dir} M${x - 6} ${y1 - 8 * dir} L${x} ${y1} L${x + 6} ${y1 - 8 * dir}`,
          fill: 'none',
          stroke: 'var(--c-disturb)',
          'stroke-width': 2.5,
          'stroke-linecap': 'round',
        }),
      );
    }
    this.windG.append(s('text', { x: 200, y: yDrone - 44, 'text-anchor': 'middle', 'font-size': 16, fill: 'var(--c-disturb)', 'font-weight': 700 }, tc('drone.wind')));
  }
}
