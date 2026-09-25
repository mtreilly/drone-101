import rough from 'roughjs';
import { h, s } from '../core/dom';
import { tc } from '../core/i18n';
import { progress } from '../core/progress';

/** Chapter cluster centres (serpentine layout on a 1200×800 sheet). */
const CENTRES: [number, number][] = [
  [150, 120],
  [450, 130],
  [750, 120],
  [1050, 130],
  [1050, 400],
  [750, 400],
  [450, 400],
  [150, 400],
  [150, 670],
  [450, 670],
  [750, 670],
  [1050, 670],
];

/** node id → [chapter, dx, dy] */
const NODES: Record<string, [number, number, number]> = {
  goal: [0, -55, -35],
  delay: [0, 50, 40],
  openloop: [1, -85, -60],
  feedback: [1, 60, -65],
  blockdiagram: [1, -95, 20],
  error: [1, 50, 5],
  plant: [1, -50, 80],
  disturbance: [1, 90, 75],
  kp: [2, 0, -55],
  sserror: [2, -75, 40],
  overshoot: [2, 80, 45],
  derivative: [3, -75, -60],
  firstorder: [3, 70, -50],
  tau: [3, 80, 45],
  integral: [3, -70, 55],
  exponential: [4, -40, -45],
  guess: [4, 45, 50],
  complex: [5, -80, -65],
  spin: [5, 70, -60],
  spiral: [5, -75, 55],
  smap: [5, 75, 60],
  second: [6, -70, -50],
  wnzeta: [6, 75, -40],
  sum: [6, 0, 60],
  laplace: [7, -60, -65],
  dtos: [7, 70, -45],
  table: [7, -75, 50],
  splane: [7, 70, 65],
  tf: [8, -75, -55],
  poles: [8, 65, -55],
  zeros: [8, -70, 55],
  stability: [8, 75, 55],
  integralaction: [9, -80, -60],
  derivativeaction: [9, 75, -45],
  pid: [9, 0, 20],
  noise: [9, 20, 85],
  phaselag: [10, -80, -60],
  bode: [10, 75, -50],
  margins: [10, -70, 55],
  robust: [10, 80, 60],
  you: [11, 0, 0],
};

const EDGES: [string, string][] = [
  ['goal', 'error'],
  ['openloop', 'feedback'],
  ['blockdiagram', 'feedback'],
  ['feedback', 'error'],
  ['plant', 'blockdiagram'],
  ['disturbance', 'feedback'],
  ['error', 'kp'],
  ['kp', 'sserror'],
  ['kp', 'overshoot'],
  ['overshoot', 'derivative'],
  ['derivative', 'firstorder'],
  ['firstorder', 'tau'],
  ['derivative', 'integral'],
  ['firstorder', 'exponential'],
  ['exponential', 'guess'],
  ['guess', 'complex'],
  ['complex', 'spin'],
  ['spin', 'spiral'],
  ['spiral', 'smap'],
  ['smap', 'second'],
  ['overshoot', 'second'],
  ['second', 'wnzeta'],
  ['wnzeta', 'sum'],
  ['sum', 'laplace'],
  ['integral', 'laplace'],
  ['laplace', 'dtos'],
  ['laplace', 'table'],
  ['smap', 'splane'],
  ['laplace', 'splane'],
  ['splane', 'poles'],
  ['dtos', 'tf'],
  ['tf', 'poles'],
  ['tf', 'zeros'],
  ['poles', 'stability'],
  ['sserror', 'integralaction'],
  ['integral', 'integralaction'],
  ['derivative', 'derivativeaction'],
  ['wnzeta', 'derivativeaction'],
  ['integralaction', 'pid'],
  ['derivativeaction', 'pid'],
  ['pid', 'noise'],
  ['delay', 'phaselag'],
  ['spin', 'bode'],
  ['phaselag', 'bode'],
  ['bode', 'margins'],
  ['margins', 'robust'],
  ['stability', 'robust'],
  ['pid', 'robust'],
  ['robust', 'you'],
  ['pid', 'you'],
];

const pos = (id: string): [number, number] => {
  const [ch, dx, dy] = NODES[id];
  return [CENTRES[ch][0] + dx, CENTRES[ch][1] + dy];
};

export interface MapOptions {
  /** chapters ≤ upTo are revealed (plus any completed ones) */
  upTo: number;
  highlight?: number;
  compact?: boolean;
}

/** The growing concept map. Nodes link back to the chapter that introduced them. */
export function conceptMap(o: MapOptions): HTMLElement {
  const done = new Set(progress.get().completed);
  const revealed = (ch: number) => ch <= o.upTo || done.has(ch);
  const svg = s('svg', {
    viewBox: '-50 -40 1300 870',
    class: 'concept-map',
    role: 'group',
    'aria-label': tc('map.aria'),
  });
  const rc = rough.svg(svg);
  const edges = s('g', { class: 'edges' });
  const nodes = s('g', { class: 'nodes' });
  EDGES.forEach(([a, b], i) => {
    const ra = revealed(NODES[a][0]);
    const rb = revealed(NODES[b][0]);
    const [x1, y1] = pos(a);
    const [x2, y2] = pos(b);
    // a gentle bow keeps long links from reading as a tangle of straight wires
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const bow = Math.min(40, len * 0.12) * (i % 2 ? 1 : -1);
    const cx = mx - ((y2 - y1) / (len || 1)) * bow;
    const cy = my + ((x2 - x1) / (len || 1)) * bow;
    const line = rc.path(`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, { stroke: 'currentColor', strokeWidth: 1.2, roughness: 0.9, seed: i + 1 });
    line.setAttribute('class', ra && rb ? 'edge' : 'edge hidden-edge');
    line.dataset.a = a;
    line.dataset.b = b;
    edges.append(line);
  });
  // chapter labels
  CENTRES.forEach(([cx, cy], ch) => {
    nodes.append(s('text', { x: cx, y: cy - 108, class: `ch-label${revealed(ch) ? '' : ' faded'}`, 'text-anchor': 'middle' }, tc(`chapters.${ch}.short`)));
  });
  const listItems: string[] = [];
  for (const id of Object.keys(NODES)) {
    const [ch] = NODES[id];
    const [x, y] = pos(id);
    const show = revealed(ch);
    const label = show ? tc(`map.nodes.${id}`) : '?';
    const w = Math.max(64, label.length * 9.6 + 30);
    const hi = o.highlight === ch;
    const g = s('a', { href: `#/ch/${ch}`, 'data-id': id, class: `node${show ? '' : ' locked'}${hi ? ' new' : ''}`, 'aria-label': show ? `${label} — ${tc(`chapters.${ch}.title`)}` : tc('map.locked') });
    g.append(
      rc.ellipse(x, y, w, 44, {
        stroke: 'currentColor',
        strokeWidth: hi ? 2.2 : 1.4,
        roughness: 1.2,
        fill: hi ? 'var(--c-highlight)' : 'var(--card)',
        fillStyle: 'solid',
        seed: id.length * 7 + ch,
        strokeLineDash: show ? undefined : [4, 4],
      }),
      s('text', { x, y: y + 6, 'text-anchor': 'middle' }, label),
    );
    nodes.append(g);
    if (show) listItems.push(label);
  }
  svg.append(edges, nodes);
  // hovering or focusing an idea lights up what it connects to
  const light = (id: string | null) => {
    svg.classList.toggle('focus-mode', !!id);
    const linked = new Set<string>(id ? [id] : []);
    edges.querySelectorAll<SVGElement>('.edge').forEach((e) => {
      const on = !!id && (e.dataset.a === id || e.dataset.b === id);
      e.classList.toggle('hot', on);
      if (on) {
        linked.add(e.dataset.a!);
        linked.add(e.dataset.b!);
      }
    });
    nodes.querySelectorAll<SVGElement>('.node').forEach((n) => n.classList.toggle('hot', linked.has(n.dataset.id ?? '')));
  };
  nodes.querySelectorAll<SVGElement>('.node:not(.locked)').forEach((n) => {
    n.addEventListener('pointerenter', () => light(n.dataset.id ?? null));
    n.addEventListener('pointerleave', () => light(null));
    n.addEventListener('focus', () => light(n.dataset.id ?? null));
    n.addEventListener('blur', () => light(null));
  });
  const textList = h('p', { class: 'visually-hidden' }, `${tc('map.listIntro')} ${listItems.join(', ')}.`);
  return h('div', { class: `concept-map-wrap${o.compact ? ' compact' : ''}` }, h('div', { class: 'concept-map-scroll' }, svg), textList);
}
