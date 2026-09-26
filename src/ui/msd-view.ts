import rough from 'roughjs';
import { h, s } from '../core/dom';

/**
 * A mass hanging from a ceiling on a spring with a damper beside it.
 * `update(x)` moves the mass; x is displacement in metres (positive = up),
 * drawn at `pxPerM` pixels per metre around the rest position.
 */
export class MsdView {
  readonly el: HTMLElement;
  private spring: SVGPathElement;
  private rod: SVGLineElement;
  private mass: SVGGElement;
  private setLine: SVGLineElement;
  private arrows: { g: SVGGElement; shaft: SVGLineElement; head: SVGPathElement }[] = [];
  private massTop = 190;

  constructor(
    host: HTMLElement,
    label: string,
    private pxPerM = 60,
    damper = true,
  ) {
    const svg = s('svg', { viewBox: '0 0 200 300', class: 'view msd-view', role: 'img', 'aria-label': label });
    const rc = rough.svg(svg);
    const ink = 'currentColor';
    svg.append(rc.line(20, 20, 180, 20, { stroke: ink, strokeWidth: 2.5, seed: 1 }));
    for (let x = 24; x < 180; x += 12) svg.append(s('line', { x1: x, y1: 20, x2: x + 8, y2: 10, stroke: 'var(--ink-3)' }));
    this.spring = s('path', { fill: 'none', stroke: ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
    // damper: cylinder fixed to ceiling, rod attached to mass
    const damperG = s('g');
    damperG.append(s('line', { x1: 135, y1: 20, x2: 135, y2: 70, stroke: ink, 'stroke-width': 2 }));
    damperG.append(rc.rectangle(125, 70, 20, 60, { stroke: ink, strokeWidth: 1.8, fill: 'var(--paper-3)', fillStyle: 'solid', seed: 3 }));
    svg.append(damperG);
    this.rod = s('line', { x1: 135, x2: 135, stroke: ink, 'stroke-width': 3 });
    if (!damper) {
      damperG.style.display = 'none';
      this.rod.style.display = 'none';
    }
    this.mass = s('g');
    this.mass.append(rc.rectangle(55, 0, 100, 44, { stroke: ink, strokeWidth: 2.2, fill: 'var(--card)', fillStyle: 'solid', seed: 4 }), s('text', { x: 105, y: 29, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700 }, 'm'));
    this.setLine = s('line', { x1: 20, x2: 190, stroke: 'var(--c-setpoint)', 'stroke-width': 2, 'stroke-dasharray': '6 5' });
    svg.append(this.setLine, this.spring, this.rod, this.mass);
    // optional force arrows (see `forces`): spring pull on the left, damper push on the right
    for (const [x, stroke] of [
      [36, 'var(--c-effort)'],
      [174, 'var(--ink-2)'],
    ] as const) {
      const g = s('g', { class: 'msd-force', style: 'display:none' });
      const shaft = s('line', { x1: x, x2: x, stroke, 'stroke-width': 3, 'stroke-linecap': 'round' });
      const head = s('path', { fill: stroke, stroke: 'none' });
      g.append(shaft, head);
      svg.append(g);
      this.arrows.push({ g, shaft, head });
    }
    this.el = h('div', { style: { maxWidth: '220px', margin: '0 auto' } }, svg);
    host.append(this.el);
    this.update(0);
  }

  /**
   * Shows the spring force and the damper force on the mass as arrows (newtons, up = positive),
   * starting at the middle of the mass. Call after `update`; pass null to hide them.
   */
  forces(spring: number | null, damper = 0, pxPerN = 3): void {
    [spring, damper].forEach((f, i) => {
      const a = this.arrows[i];
      if (spring === null || f === null || Math.abs(f) * pxPerN < 3) {
        a.g.style.display = 'none';
        return;
      }
      a.g.style.display = '';
      const x = Number(a.shaft.getAttribute('x1'));
      const y0 = this.massTop + 22;
      const len = Math.min(95, Math.abs(f) * pxPerN);
      const dir = f > 0 ? -1 : 1;
      const tip = Math.max(4, Math.min(296, y0 + dir * len));
      a.shaft.setAttribute('y1', String(y0));
      a.shaft.setAttribute('y2', String(tip - dir * 7));
      a.head.setAttribute('d', `M${x - 6} ${tip - dir * 9} L${x} ${tip} L${x + 6} ${tip - dir * 9} Z`);
    });
  }

  update(x: number, setpoint: number | null = 0): void {
    const rest = 190;
    const top = Math.max(60, Math.min(250, rest - x * this.pxPerM));
    this.mass.setAttribute('transform', `translate(0, ${top})`);
    this.massTop = top;
    const coils = 10;
    const x0 = 80;
    let d = `M${x0} 20 L${x0} 32`;
    const len = top - 44;
    for (let i = 0; i < coils; i++) {
      const y = 32 + ((i + 0.5) / coils) * len;
      d += ` L${x0 + (i % 2 ? -12 : 12)} ${y}`;
    }
    d += ` L${x0} ${top - 12} L${x0} ${top}`;
    this.spring.setAttribute('d', d);
    this.rod.setAttribute('y1', String(Math.min(top, 100)));
    this.rod.setAttribute('y2', String(top));
    if (setpoint === null) this.setLine.style.display = 'none';
    else {
      this.setLine.style.display = '';
      const y = rest - setpoint * this.pxPerM + 22;
      this.setLine.setAttribute('y1', String(y));
      this.setLine.setAttribute('y2', String(y));
    }
  }
}
