import rough from 'roughjs';
import { h, s, prefersReducedMotion } from '../core/dom';
import { inLtrBox } from '../core/bidi';
import { fmt, tc, unitLabel } from '../core/i18n';
import { ceilingHit, docBox, impactBurst, pageSolids, wobble, type Box } from './page-physics';

export interface DroneViewOptions {
  hMax?: number;
  width?: number;
  showThrust?: boolean;
  showScale?: boolean;
  /** show a noisy "sensor reading" marker */
  showSensor?: boolean;
  /**
   * Let the drone fly out of the top of its picture into the page. If it runs into page content,
   * this is called so the simulation can react (e.g. `DroneSim.hitCeiling`). Off with reduced motion.
   */
  onCeiling?: () => void;
  /**
   * How the drawing reacts to a hit: `stall` (default) tumbles, for motors that stall and a fall;
   * `bump` is a short knock for a drone whose motors keep running (`hitCeiling({ stall: false })`).
   * Widgets that replay precomputed traces pass `ceilingHeight()` into the sim instead of reacting
   * in `onCeiling` (then a no-op): the trace already contains the hit, the view only shows it.
   */
  ceilingResponse?: 'stall' | 'bump';
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
const CX = 135;
/** the drone's own drawing (props, arms, legs) in view units, relative to its group origin */
const ART = { x: CX - 62, y: -16, w: 124, h: 34 };
/** smallest on-screen text size (CSS px), however small the picture is drawn */
const MIN_TEXT_PX = 11;
/** the drawing's parts that labels must not cover, relative to the drone group: props, arm and posts, body and legs */
export const DRONE_PARTS: Box[] = [
  { x: CX - 63, y: -15, w: 42, h: 10 },
  { x: CX + 21, y: -15, w: 42, h: 10 },
  { x: CX - 44, y: -9, w: 88, h: 11 },
  { x: CX - 20, y: -11, w: 40, h: 29 },
];
/** the hanging package, when there is one */
const PACKAGE: Box = { x: CX - 14, y: 8, w: 28, h: 40 };

/** the height readout's corner */
const READOUT: Box = { x: W * 0.35, y: 0, w: W * 0.65, h: 24 };

/** The drone drawing's parts for the group placed at view y `gy`. */
export const droneBoxes = (gy: number, pkg = false): Box[] => (pkg ? [...DRONE_PARTS, PACKAGE] : DRONE_PARTS).map((p) => ({ ...p, y: p.y + gy }));

/**
 * Where the "target" label may go, in order: above the line on the left, below it, the same on the
 * right, and last a little further from the line on the left (for a drone hovering just under it,
 * as a drooping P controller does). Boxes run from the cap height to just under the baseline.
 */
export function targetSpots(lineY: number, w: number, fs: number): Box[] {
  const box = (x: number, base: number): Box => ({ x, y: base - fs * 0.75, w, h: fs * 0.95 });
  const above = lineY - 6;
  const below = lineY + 4 + fs * 0.75;
  return [box(54, above), box(54, below), box(W - 6 - w, above), box(W - 6 - w, below), box(54, above - fs * 0.9), box(54, below + fs * 0.9)];
}

/** Do two boxes overlap (with a margin)? */
export const overlaps = (a: Box, b: Box, m = 0): boolean => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;

/**
 * Picks a label spot, with hysteresis so a label doesn't jump about while the drone wobbles: go back
 * to the first (usual) spot once it is clear by `back`; otherwise keep the current spot while it is
 * free (only among the first `sticky` spots; later ones are last resorts); otherwise take the first
 * free one; if none is free, stay put.
 */
export function pickSpot(cands: (Box | null)[], obstacles: Box[], current: number, margin = 2, back = 10, sticky = 4): number {
  const free = (i: number, m = margin) => {
    const c = cands[i];
    return !!c && !obstacles.some((o) => overlaps(c, o, m));
  };
  if (current !== 0 && free(0, back)) return 0;
  if (current >= 0 && current < Math.min(sticky, cands.length) && free(current)) return current;
  for (let i = 0; i < cands.length; i++) if (free(i)) return i;
  return current >= 0 && current < cands.length && cands[current] ? current : cands.findIndex((c) => !!c);
}

/** Rough width of hand-written text in view units (the font's average glyph is about half an em). */
export const estWidth = (text: string, size: number): number =>
  [...text].reduce((w, ch) => w + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.52), 0) * size;

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
  private targetLabel: SVGTextElement;
  /** texts and their design size, lifted to MIN_TEXT_PX on screen when the picture is small */
  private texts: [SVGTextElement, number][] = [];
  /** view units per CSS pixel */
  private u = 1;
  private targetW = 0;
  private targetSpot = 0;
  private thrustSpot = 0;
  private last: DroneState | null = null;
  private desc: HTMLElement;
  private hMax: number;
  private lastDesc = 0;
  /** free flight: the drone may leave its picture and collide with the page */
  private free: boolean;
  private prevGy: number | null = null;
  private lastT = 0;
  /** tumble after a knock: sideways drift (px) and rotation (deg), purely visual since the model is vertical only */
  private tumble = { on: false, hit: false, bump: false, dx: 0, vx: 0, angle: 0, spin: 0 };

  constructor(host: HTMLElement, private o: DroneViewOptions = {}) {
    this.hMax = o.hMax ?? 3;
    this.free = !!o.onCeiling && !prefersReducedMotion();
    // Physical x coordinates and text anchors stay left-to-right even in Arabic UI.
    this.svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: `view drone-view${this.free ? ' free' : ''}`, direction: 'ltr', role: 'img', 'aria-label': tc('drone.aria') });
    const rc = rough.svg(this.svg);
    const ink = 'currentColor';
    // scale
    const scale = s('g', { class: 'scale' });
    if (o.showScale !== false) {
      for (let m = 0; m <= this.hMax; m += 0.5) {
        const y = this.y(m);
        const major = Number.isInteger(m);
        scale.append(s('line', { x1: 38, x2: major ? 50 : 45, y1: y, y2: y, stroke: 'var(--ink-3)', 'stroke-width': 1.2 }));
        if (major) scale.append(this.text(s('text', { x: 33, y: y + 5, 'text-anchor': 'end', 'font-size': 15, fill: 'var(--ink-3)' }, inLtrBox(`${m} ${unitLabel('m')}`)), 15));
      }
      scale.append(s('line', { x1: 38, x2: 38, y1: this.y(this.hMax), y2: GROUND, stroke: 'var(--ink-3)', 'stroke-width': 1.2 }));
    }
    // ground
    const ground = s('g', { class: 'ground' });
    ground.append(rc.line(0, GROUND, W, GROUND, { stroke: ink, strokeWidth: 2, roughness: 1.2, seed: 2 }));
    ground.append(rc.rectangle(0, GROUND + 2, W, H - GROUND, { stroke: 'none', fill: 'var(--paper-3)', fillStyle: 'hachure', hachureGap: 7, hachureAngle: 60, seed: 3 }));
    // setpoint
    this.setLine = s('g', { class: 'setpoint' });
    this.targetLabel = this.text(s('text', { x: 54, y: -6, 'font-size': 16, fill: 'var(--c-setpoint)' }, tc('drone.target')), 16);
    this.setLine.append(s('line', { x1: 52, x2: W - 6, y1: 0, y2: 0, stroke: 'var(--c-setpoint)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }), this.targetLabel);
    // drone
    this.drone = s('g', { class: 'drone' });
    const cx = CX;
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
    this.thrustLabel = this.text(s('text', { 'font-size': 16, fill: 'var(--c-effort)', x: cx - 9, 'text-anchor': 'end' }), 16);
    this.pkgG = s('g', { class: 'package' });
    this.pkgG.append(
      s('line', { x1: cx, x2: cx, y1: 10, y2: 26, stroke: ink, 'stroke-width': 1.5 }),
      rc.rectangle(cx - 12, 26, 24, 20, { stroke: ink, fill: '#c9a26b', fillStyle: 'solid', strokeWidth: 1.6, seed: 11 }),
      rc.line(cx - 12, 36, cx + 12, 36, { stroke: ink, strokeWidth: 1, seed: 12 }),
    );
    this.drone.append(this.thrustArrow, this.thrustLabel, this.pkgG, body);
    this.sensor = s('circle', { r: 4, cx: 60, fill: 'none', stroke: 'var(--c-output)', 'stroke-width': 2, 'stroke-dasharray': '2 2', opacity: 0 });
    this.windG = s('g', { class: 'wind' });
    this.crash = s('text', { x: W / 2 + 10, y: GROUND - 120, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 700, fill: 'var(--c-error)', opacity: 0 }, tc('drone.crash'));
    this.readout = this.text(s('text', { x: W - 6, y: 18, 'text-anchor': 'end', 'font-size': 17, fill: 'var(--c-output)', 'font-weight': 700 }), 17);
    this.svg.append(scale, ground, this.setLine, this.windG, this.drone, this.sensor, this.crash, this.readout);
    this.desc = h('p', { class: 'visually-hidden', 'aria-live': 'off' });
    this.el = h('div', { class: `drone-wrap${this.free ? ' free' : ''}`, style: { maxWidth: `${o.width ?? 300}px`, margin: '0 auto' } }, this.svg, this.desc);
    host.append(this.el);
    new ResizeObserver(() => this.resize()).observe(this.svg);
    document.fonts?.ready.then(() => (this.targetW = 0));
    this.update({ h: 0, r: 2, thrust: 0 });
  }

  private text(el: SVGTextElement, size: number): SVGTextElement {
    this.texts.push([el, size]);
    return el;
  }

  /** Lifts small text back to a readable size when the picture is drawn narrow (phones, side columns). */
  private resize(): void {
    const w = this.svg.clientWidth;
    if (!w) return;
    const u = W / w;
    if (Math.abs(u - this.u) < 0.01) return;
    this.u = u;
    for (const [el, size] of this.texts) el.setAttribute('font-size', this.fontSize(size).toFixed(1));
    this.targetW = 0;
    if (this.last) this.update(this.last);
  }

  private fontSize(size: number): number {
    return Math.max(size, MIN_TEXT_PX * this.u);
  }

  y(m: number): number {
    return GROUND - 10 - (m / this.hMax) * (GROUND - 10 - TOP);
  }

  update(st: DroneState): void {
    // a free drone is drawn at its true height even above the picture; otherwise it is pinned at the top
    const hClamped = Math.max(-0.1, this.free ? st.h : Math.min(this.hMax + 0.3, st.h));
    const gy = this.y(hClamped) - 6;
    const outside = this.free && gy + ART.y < 0;
    if (this.free) this.fly(gy, st.h);
    const tb = this.tumble;
    const k = this.svg.getBoundingClientRect().width / W || 1;
    this.drone.setAttribute('transform', tb.on ? `translate(${tb.dx / k}, ${gy}) rotate(${tb.angle}, ${CX}, 0)` : `translate(0, ${gy})`);
    if (st.r === null || st.r === undefined) this.setLine.style.display = 'none';
    else {
      this.setLine.style.display = '';
      this.setLine.setAttribute('transform', `translate(0, ${this.y(st.r)})`);
    }
    this.last = st;
    const T = st.thrust ?? 0;
    let thrustBox: Box[] = [];
    // out over the page the arrow and its label would draw over the text; the thrust plot still shows it
    if (this.o.showThrust !== false && Math.abs(T) > 0.05 && !outside) {
      const len = Math.max(-60, Math.min(90, T * 3.2));
      const x = 135;
      const y0 = -14;
      const y1 = y0 - len;
      const dir = len > 0 ? 1 : -1;
      this.thrustArrow.setAttribute('d', `M${x} ${y0} L${x} ${y1} M${x - 6} ${y1 + 8 * dir} L${x} ${y1} L${x + 6} ${y1 + 8 * dir}`);
      this.thrustLabel.textContent = inLtrBox(`${fmt(T, 1)} ${unitLabel('N')}`);
      this.placeThrustLabel(gy, y0, y1, st.r);
      this.thrustArrow.style.display = this.thrustLabel.style.display = '';
      thrustBox = this.thrustBoxes(gy, y0, y1);
    } else {
      this.thrustArrow.style.display = this.thrustLabel.style.display = 'none';
    }
    if (st.r !== null && st.r !== undefined) this.placeTargetLabel(gy, this.y(st.r), outside, thrustBox, st);
    this.svg.classList.toggle('spinning', T > 0.05 && !prefersReducedMotion());
    this.pkgG.style.display = (st.pkg ?? 0) > 0 ? '' : 'none';
    // near the ground the package rests on the grass instead of hanging through it
    const hangRoom = GROUND - (this.y(hClamped) - 6);
    this.pkgG.setAttribute('transform', hangRoom < 52 ? `translate(-50, ${hangRoom - 50})` : '');
    this.drawWind(st.wind ?? 0, this.y(hClamped));
    this.crash.setAttribute('opacity', st.crashed ? '1' : '0');
    this.readout.textContent = inLtrBox(`${tc('drone.height')}: ${fmt(Math.max(0, st.h), 2)} ${unitLabel('m')}`);
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

  /** The thrust arrow and its label, in view units, for the drone group at `gy`. */
  private thrustBoxes(gy: number, y0: number, y1: number): Box[] {
    const lb = this.thrustLabelBox(gy, this.thrustSpot, y0, y1, this.fontSize(16));
    return [{ x: CX - 7, y: gy + Math.min(y0, y1), w: 14, h: Math.abs(y1 - y0) }, ...(lb ? [lb] : [])];
  }

  /**
   * Spots for the thrust label: beside the arrow tip (left, right), beside its middle, then one line
   * further past the tip (a short arrow's tip sits right on a target line the drone hovers at).
   */
  private thrustLabelBox(gy: number, i: number, y0: number, y1: number, fs: number): Box | null {
    const w = estWidth(this.thrustLabel.textContent ?? '', fs);
    const up = y1 < y0;
    // baselines: just past the tip (as it always was), or level with the arrow's middle
    const tip = up ? y1 - 4 : y1 + 16;
    const mid = (y0 + y1) / 2 + fs * 0.35;
    const past = up ? tip - fs * 1.1 : tip + fs * 1.1;
    const base = i < 2 ? tip : i < 4 ? mid : past;
    if (i > 5) return null;
    const right = i % 2 === 1;
    return { x: right ? CX + 9 : CX - 9 - w, y: gy + base - fs * 0.8, w, h: fs };
  }

  /** Keeps the thrust label off the dashed target line and the height readout. */
  private placeThrustLabel(gy: number, y0: number, y1: number, r: number | null | undefined): void {
    const fs = this.fontSize(16);
    const cands = [0, 1, 2, 3, 4, 5].map((i) => this.thrustLabelBox(gy, i, y0, y1, fs));
    const obstacles: Box[] = [{ x: 0, y: 0, w: W, h: 24 }, ...droneBoxes(gy)];
    // the dashed target line, with room for its "target" label above it on the left
    if (r !== null && r !== undefined) obstacles.push({ x: 52, y: this.y(r) - 1.5, w: W - 58, h: 3 }, { x: 52, y: this.y(r) - 6 - fs, w: (this.targetW || estWidth(this.targetLabel.textContent ?? '', fs)) + 4, h: fs + 4 });
    this.thrustSpot = pickSpot(cands, obstacles, this.thrustSpot);
    const c = cands[this.thrustSpot]!;
    const right = this.thrustSpot % 2 === 1;
    this.thrustLabel.setAttribute('x', String(right ? CX + 9 : CX - 9));
    this.thrustLabel.setAttribute('text-anchor', right ? 'start' : 'end');
    this.thrustLabel.setAttribute('y', (c.y - gy + fs * 0.8).toFixed(1));
  }

  /**
   * Puts "target" where the drone, its thrust label and the height readout don't cover it: above
   * the line on the left, else below it, else on the right.
   */
  private placeTargetLabel(gy: number, lineY: number, outside: boolean, thrust: Box[], st: DroneState): void {
    const fs = this.fontSize(16);
    if (!this.targetW) {
      try {
        this.targetW = this.targetLabel.getBBox().width;
      } catch {
        /* not rendered */
      }
      if (!this.targetW) this.targetW = estWidth(this.targetLabel.textContent ?? '', fs);
    }
    const cands = targetSpots(lineY, this.targetW, fs);
    const obstacles: Box[] = [...thrust, READOUT];
    // out over the page the drone is not in its picture, so it can't cover the label
    if (!outside) obstacles.push(...droneBoxes(gy, (st.pkg ?? 0) > 0));
    if (this.o.showSensor && st.measured !== undefined) obstacles.push({ x: 54, y: this.y(st.measured) - 12, w: 12, h: 12 });
    this.targetSpot = pickSpot(cands, obstacles, this.targetSpot);
    const c = cands[this.targetSpot];
    const right = this.targetSpot === 2 || this.targetSpot === 3;
    this.targetLabel.setAttribute('x', String(right ? W - 6 : 54));
    this.targetLabel.setAttribute('text-anchor', right ? 'end' : 'start');
    this.targetLabel.setAttribute('y', (c.y - lineY + fs * 0.75).toFixed(1));
  }

  /** The drone's drawing as a document-space box, for the group placed at view y `gy`. */
  private box(gy: number): Box {
    const r = docBox(this.svg.getBoundingClientRect());
    const k = r.w / W;
    return { x: r.x + ART.x * k + this.tumble.dx, y: r.y + (gy + ART.y) * k, w: ART.w * k, h: ART.h * k };
  }

  /**
   * Metres above the ground at which this drone would touch the page above its picture, from the
   * current layout; null if nothing is overhead or the drone can't leave its picture (reduced
   * motion, no `onCeiling`). Pass it to `DroneConfig.ceiling` for precomputed traces.
   */
  ceilingHeight(): number | null {
    if (!this.free) return null;
    const r = docBox(this.svg.getBoundingClientRect());
    const k = r.w / W;
    if (!k) return null;
    const probe = this.box(this.y(this.hMax) - 6);
    const hs = pageSolids(this.el, probe)
      .filter((sd) => probe.x < sd.x + sd.w && probe.x + probe.w > sd.x && sd.y + sd.h <= probe.y + 1)
      // 1 px of overlap, so the view registers the contact the sim reports
      .map((sd) => this.hFromY((sd.y + sd.h - 1 - r.y) / k - ART.y));
    return hs.length ? Math.min(...hs) : null;
  }

  /** Height (m) for a drone group placed at view y `gy` (the inverse of `y(h) - 6`). */
  private hFromY(gy: number): number {
    return ((GROUND - 10 - (gy + 6)) / (GROUND - 10 - TOP)) * this.hMax;
  }

  /** Collisions with the page above the picture, and the tumble after a knock. */
  private fly(gy: number, h: number): void {
    const now = performance.now();
    const dt = this.lastT ? Math.min(1 / 30, (now - this.lastT) / 1000) : 1 / 60;
    this.lastT = now;
    const tb = this.tumble;
    const prev = this.prevGy;
    this.prevGy = gy;
    if (h <= 0.001) {
      // on the ground (landed, crashed or reset): upright, and ready for the next flight
      Object.assign(tb, { on: false, hit: false, bump: false, dx: 0, vx: 0, angle: 0, spin: 0 });
      return;
    }
    if (tb.on && tb.bump) {
      // a knock the motors survive: tip over a little and settle straight away; once it is back in
      // its picture it can climb out and knock again (feedback keeps flying)
      tb.angle *= Math.exp(-5 * dt);
      if (gy + ART.y >= 0) tb.hit = false;
    } else if (tb.on) {
      if (gy + ART.y < 0) {
        tb.dx += tb.vx * dt;
        tb.vx *= Math.max(0, 1 - 1.5 * dt);
        tb.angle += tb.spin * dt;
      } else {
        // back inside its picture: straighten out over the spot it will land on
        const e = 1 - Math.exp(-7 * dt);
        const upright = Math.round(tb.angle / 360) * 360;
        tb.dx += (0 - tb.dx) * e;
        tb.angle += (upright - tb.angle) * e;
      }
    }
    const rising = prev !== null && gy < prev;
    if (tb.hit || !rising || gy + ART.y >= 0) return;
    const now_ = this.box(gy);
    const before = this.box(prev);
    // 3 px: the sim reports a contact for one sample, and this frame may land just after it
    const hit = ceilingHit(now_, before.y, now_.y, pageSolids(this.el, now_), 3);
    if (!hit) return;
    const speed = (before.y - now_.y) / dt;
    const side = Math.random() < 0.5 ? -1 : 1;
    if (this.o.ceilingResponse === 'bump') Object.assign(tb, { on: true, hit: true, bump: true, angle: side * 16 });
    else Object.assign(tb, { on: true, hit: true, vx: side * (50 + Math.random() * 70), spin: side * (300 + Math.random() * 250) });
    if (hit.el) wobble(hit.el, Math.max(400, speed * 1.6));
    impactBurst(now_.x + now_.w / 2, hit.y + hit.h);
    this.o.onCeiling?.();
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
