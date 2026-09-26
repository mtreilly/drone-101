import rough from 'roughjs';
import { h, prefersReducedMotion, s } from '../core/dom';
import { tc } from '../core/i18n';
import { progress } from '../core/progress';
import { CENTRES, CH_LABEL_DY, EDGES, labelLines, labelText, LINE_STEP, NODES, nodePos, nodeSize, VIEWBOX } from './map-layout';

export interface MapOptions {
  /** chapters ≤ upTo are revealed (plus any completed ones) */
  upTo: number;
  highlight?: number;
  compact?: boolean;
}

/** The last chapter: its map is the whole course, and its links draw in once. */
const FINALE = CENTRES.length - 1;
/** Whole draw-in under 1.2 s: each link takes DRAW ms, starting a few ms after the previous one. */
const DRAW = 320;
const DRAW_TOTAL = 1150;

/** The growing concept map. Nodes link back to the chapter that introduced them. */
export function conceptMap(o: MapOptions): HTMLElement {
  const done = new Set(progress.get().completed);
  const revealed = (ch: number) => ch <= o.upTo || done.has(ch);
  const svg = s('svg', {
    viewBox: VIEWBOX.join(' '),
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
    const [x1, y1] = nodePos(a);
    const [x2, y2] = nodePos(b);
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
    nodes.append(s('text', { x: cx, y: cy + CH_LABEL_DY, class: `ch-label${revealed(ch) ? '' : ' faded'}`, 'text-anchor': 'middle' }, tc(`chapters.${ch}.short`)));
  });
  const listItems: string[] = [];
  for (const id of Object.keys(NODES)) {
    const [ch] = NODES[id];
    const [x, y] = nodePos(id);
    const show = revealed(ch);
    const label = show ? tc(`map.nodes.${id}`) : '?';
    const { w, h: ht } = nodeSize(label);
    const lines = labelLines(label);
    const plain = labelText(label);
    const hi = o.highlight === ch;
    const g = s('a', { href: `#/ch/${ch}`, 'data-id': id, class: `node${show ? '' : ' locked'}${hi ? ' new' : ''}`, 'aria-label': show ? `${plain} — ${tc(`chapters.${ch}.title`)}` : tc('map.locked') });
    // the lines sit centred on the node; a one-line label keeps its baseline 6 px below the centre
    const text = s('text', { x, y: y + 6 - ((lines.length - 1) * LINE_STEP) / 2, 'text-anchor': 'middle' });
    lines.forEach((line, i) => text.append(s('tspan', { x, dy: i ? LINE_STEP : 0 }, line)));
    g.append(
      rc.ellipse(x, y, w, ht, {
        stroke: 'currentColor',
        strokeWidth: hi ? 2.2 : 1.4,
        roughness: 1.2,
        fill: hi ? 'var(--c-highlight)' : 'var(--card)',
        fillStyle: 'solid',
        seed: id.length * 7 + ch,
        strokeLineDash: show ? undefined : [4, 4],
      }),
      text,
    );
    nodes.append(g);
    if (show) listItems.push(plain);
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
  const scroller = h('div', { class: 'concept-map-scroll' }, svg);
  const wrap = h('div', { class: `concept-map-wrap${o.compact ? ' compact' : ''}` }, scroller, textList);
  if (o.highlight !== undefined) whenPlaced(wrap, () => scrollToCluster(scroller, svg, o.highlight!));
  if (o.highlight === FINALE && !prefersReducedMotion()) drawIn(wrap, edges);
  return wrap;
}

/** Runs `fn` once the element is in the page and laid out. */
function whenPlaced(el: HTMLElement, fn: () => void): void {
  let tries = 0;
  const tick = () => {
    if (el.isConnected && el.clientWidth > 0) fn();
    else if (++tries < 120) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * On a narrow screen the map scrolls sideways: start with this chapter's cluster in view
 * (for the finale, "YOU"). Works the same in right-to-left pages, since it moves by the offset.
 */
function scrollToCluster(scroller: HTMLElement, svg: SVGSVGElement, ch: number): void {
  if (scroller.scrollWidth <= scroller.clientWidth + 1) return;
  const [vx, , vw] = VIEWBOX;
  const box = svg.getBoundingClientRect();
  const target = box.left + ((CENTRES[ch][0] - vx) / vw) * box.width;
  const view = scroller.getBoundingClientRect();
  scroller.scrollLeft += target - (view.left + view.width / 2);
}

/**
 * The finale: the links draw themselves in, chapter by chapter, once, when the map comes into
 * view, to show the course joining up. Never under reduced motion (the map is then static).
 */
function drawIn(wrap: HTMLElement, edges: SVGGElement): void {
  if (typeof IntersectionObserver === 'undefined') return;
  const lines = [...edges.querySelectorAll<SVGGElement>('.edge')];
  // order: by the later chapter of the two ends, so the map grows as the course did
  const order = lines
    .map((g, i) => ({ g, i, ch: Math.max(NODES[g.dataset.a!][0], NODES[g.dataset.b!][0]) }))
    .sort((p, q) => p.ch - q.ch || p.i - q.i)
    .map((x) => x.g);
  const stagger = Math.min(15, (DRAW_TOTAL - DRAW) / Math.max(1, order.length - 1));
  const paths = order.map((g) => [...g.querySelectorAll<SVGPathElement>('path')]);
  wrap.classList.add('drawing');
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const ease = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim() || 'ease-out';
      paths.forEach((ps, k) =>
        ps.forEach((p) => {
          const len = p.getTotalLength();
          p.style.strokeDasharray = `${len}`;
          const anim = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: DRAW, delay: k * stagger, easing: ease, fill: 'backwards' });
          anim.onfinish = () => (p.style.strokeDasharray = '');
        }),
      );
      wrap.classList.remove('drawing');
    },
    { threshold: 0.25 },
  );
  io.observe(wrap);
}
