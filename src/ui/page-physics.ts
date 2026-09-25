import { s } from '../core/dom';

/**
 * The page as part of the world: a drawing that flies out of its frame can run into real page
 * content (paragraphs, bubbles, the sticky top bar). This module only finds those contacts and
 * makes the page react; what a contact does to the object is up to its simulation.
 *
 * All geometry is in document pixels so it is independent of scrolling.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Solid extends Box {
  el?: Element;
}

/**
 * Nearest solid underside crossed while a box's top moves up from `y0` to `y1` (y1 < y0), if any.
 * `tol` (px) also counts arriving within that distance of it: a sim stops at the contact for a
 * single sample and a screen frame can land just after it, already dropping away.
 */
export function ceilingHit(box: Box, y0: number, y1: number, solids: Solid[], tol = 0): Solid | null {
  let hit: Solid | null = null;
  for (const sd of solids) {
    if (box.x >= sd.x + sd.w || box.x + box.w <= sd.x) continue;
    const bottom = sd.y + sd.h;
    if (y0 >= bottom - 0.5 && y1 < bottom + tol && (!hit || bottom > hit.y + hit.h)) hit = sd;
  }
  return hit;
}

/**
 * Page elements something can bump into. Running text counts: the point is that the page is
 * physical, and a drone parked in front of a paragraph would hide it.
 */
const SOLID_SELECTOR =
  'main :is(p, h1, h2, h3, li, .bubble, .math-block, .avatar, .widget-frame, .card, .option, .recap, svg.view, .s-plane, canvas)';
/** Inside the object's own card only other pictures are solid (an s-plane stacked above it on a phone), not its labels. */
const OWN_CARD_SOLID = 'svg.view, .s-plane, canvas';

export function docBox(r: DOMRect): Box {
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
}

/**
 * Solids near `near`. `self` is the moving object's own picture: it, everything inside it and
 * everything containing it (its grid, its card) are not obstacles, and neither are its own card's
 * labels (title, status, help). Other pictures in its card, and everything outside it, are.
 */
export function pageSolids(self: Element, near: Box, reach = innerHeight * 1.5): Solid[] {
  const ownCard = self.closest('.widget-frame');
  const out: Solid[] = [];
  const bar = document.querySelector('.topbar');
  if (bar) out.push({ ...docBox(bar.getBoundingClientRect()), el: bar });
  else out.push({ x: -1e5, y: scrollY - 40, w: 2e5, h: 40 });
  for (const el of document.querySelectorAll(SOLID_SELECTOR)) {
    if (el.contains(self) || self.contains(el)) continue;
    if (ownCard?.contains(el) && !el.matches(OWN_CARD_SOLID)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const b = docBox(r);
    if (b.y + b.h < near.y - reach || b.y > near.y + near.h + reach) continue;
    out.push({ ...b, el });
  }
  return out;
}

/** A small springy jolt upwards on something that got hit (individual `translate`/`rotate` compose with existing transforms). */
export function wobble(el: Element, strength: number): void {
  if (!(el instanceof HTMLElement || el instanceof SVGSVGElement) || !el.animate) return;
  const a = -Math.min(7, 2 + strength / 250);
  const r = (Math.random() - 0.5) * Math.min(1.2, strength / 900);
  el.animate(
    [
      { translate: '0 0', rotate: '0deg' },
      { translate: `0 ${a}px`, rotate: `${r}deg` },
      { translate: `0 ${-a * 0.45}px`, rotate: `${-r * 0.5}deg` },
      { translate: `0 ${a * 0.18}px`, rotate: '0deg' },
      { translate: '0 0', rotate: '0deg' },
    ],
    { duration: 520, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  );
}

/** A few hand-drawn impact strokes fanning out under the point `(x, y)` (document pixels), fading out. */
export function impactBurst(x: number, y: number): void {
  const g = s('svg', { width: 70, height: 30, viewBox: '-35 -4 70 30', class: 'page-impact', 'aria-hidden': 'true', focusable: 'false' });
  for (const [dx, dy] of [
    [-1, 0.25],
    [-0.55, 0.8],
    [0.55, 0.8],
    [1, 0.25],
  ]) {
    g.append(s('line', { x1: dx * 9, y1: dy * 9, x2: dx * 26, y2: dy * 26, stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
  }
  // `translate`, not `transform`: the animated `scale` is applied outside `transform` and would scale the page offset
  g.style.translate = `${x - 35}px ${y - 4}px`;
  document.body.append(g);
  const anim = g.animate([{ opacity: 1, scale: '0.6' }, { opacity: 1, scale: '1', offset: 0.3 }, { opacity: 0, scale: '1.1' }], { duration: 480, easing: 'ease-out' });
  anim.onfinish = () => g.remove();
}
