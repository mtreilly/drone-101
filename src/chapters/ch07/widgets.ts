import { h, uid } from '../../core/dom';
import { canvasHandFont } from '../../core/font';
import { fmt, tc, unitLabel } from '../../core/i18n';
import { tex } from '../../core/rich-text';
import { c as cx } from '../../math/complex';
import { laplaceReal, table as T } from '../../math/laplace';
import { DRONE, DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import type { WidgetFactory } from '../../story/types';
import './ch07.css';
import { color, withAlpha } from '../../ui/colors';
import { onSettle, readout, segmented, slider, toggle } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { prefersReducedMotion } from '../../core/dom';
import { Plot } from '../../ui/plot';
import { niceTicks } from '../../ui/plot-layout';
import { iconButton, mark, nameMathOptions, onInteractStart, sample } from '../ch06/helpers';
import { DRAW_T, dampedCos, derivativeRule, fromFunction, fromPoints, solveDrone, spreadCount, unspinExtent, unspinIntegral, unspinLimit } from './tools';

/** `osc`: the signal swings both ways, so for s ≤ a its area sloshes back and forth instead of running off. */
type Sig = { f: (t: number) => number; F: (s: number) => number; a: number; yMin: number; yMax: number; osc?: boolean };

/** Signals used by the probe. `a` = the abscissa of convergence (area is finite only for s > a). */
const SIGNALS: Record<string, Sig> = {
  step: { f: () => 1, F: (s) => 1 / s, a: 0, yMin: -0.2, yMax: 1.6 },
  decay: { f: (t) => Math.exp(-t), F: (s) => 1 / (s + 1), a: -1, yMin: -0.2, yMax: 1.6 },
  grow: { f: (t) => Math.exp(0.5 * t), F: (s) => 1 / (s - 0.5), a: 0.5, yMin: -0.2, yMax: 4 },
  wiggle: { f: (t) => Math.sin(2 * t), F: (s) => 2 / (s * s + 4), a: 0, yMin: -1.3, yMax: 1.6, osc: true },
};

const PROBE_T = 8;

/** Draws the product f·e^(−st) and shades its area up to `upTo` on a Plot overlay. */
function shadeOverlay(plot: Plot, fn: () => ((t: number) => number) | null, upTo: () => number): void {
  plot.overlay = (ctx, px, py) => {
    const g = fn();
    if (!g) return;
    const tEnd = upTo();
    const pos = withAlpha(color('ink3'), 0.32);
    const neg = withAlpha(color('ink3'), 0.14);
    const n = 240;
    for (const sign of [1, -1]) {
      ctx.fillStyle = sign > 0 ? pos : neg;
      ctx.beginPath();
      ctx.moveTo(px(0), py(0));
      for (let i = 0; i <= n; i++) {
        const t = (tEnd * i) / n;
        const v = g(t);
        ctx.lineTo(px(t), py(sign > 0 ? Math.max(0, v) : Math.min(0, v)));
      }
      ctx.lineTo(px(tEnd), py(0));
      ctx.closePath();
      ctx.fill();
    }
  };
}

function runningAreaAt(g: (t: number) => number, tEnd: number): number {
  const n = Math.max(20, Math.round(tEnd * 60));
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const a = (tEnd * (i - 1)) / n;
    const b = (tEnd * i) / n;
    acc += ((b - a) * (g(a) + g(b))) / 2;
  }
  return acc;
}

/** 7a — the probe: multiply by e^(−st), measure the area, trace F(s). */
const probe: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let key = 'step';
  let s = 1;
  let tc0 = PROBE_T;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const seg = segmented(
    t('signal'),
    Object.keys(SIGNALS).map((k) => ({ value: k, label: t(`sig.${k}`) })),
    key,
    (v) => {
      key = v;
      trace.xs = [];
      trace.ys = [];
      fplot.set('trace', [], []);
      restart();
    },
  );
  nameMathOptions(seg.el);
  host.append(seg.el);
  const grid = h('div', { class: 'w-grid two' });
  const a = h('div');
  const b = h('div');
  grid.append(a, b);
  host.append(grid);
  const plot = new Plot(a, {
    x: { label: tc('plots.time'), min: 0, max: PROBE_T },
    y: { label: '', min: -0.2, max: 1.6 },
    series: [
      { id: 'f', color: 'out', label: t('f') },
      { id: 'prod', color: 'ink', label: t('product'), width: 2.6 },
      // drawn on top: for the step the probe and the product are the same curve
      { id: 'probe', color: 'ink3', label: t('probe'), dash: [6, 4], width: 1.8 },
    ],
    height: 240,
    label: t('plotAria'),
  });
  const fplot = new Plot(b, {
    x: { label: 's', min: -1, max: 4 },
    y: { label: 'F(s)', min: 0, max: 4 },
    series: [
      { id: 'formula', color: 'ink3', label: t('formula'), dash: [4, 4], width: 1.6 },
      { id: 'trace', color: 'ink', label: t('traced'), dots: true },
    ],
    height: 240,
    label: t('fAria'),
  });
  const trace = { xs: [] as number[], ys: [] as number[] };
  const rArea = readout(t('area'));
  const rTotal = readout(t('total'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const product = () => {
    const sig = SIGNALS[key];
    return (tt: number) => sig.f(tt) * Math.exp(-s * tt);
  };
  shadeOverlay(plot, product, () => tc0);
  const total = (): number => {
    const sig = SIGNALS[key];
    if (s <= sig.a + 1e-9) return Infinity;
    // long enough window for the integrand to die out
    const T1 = Math.min(400, 30 / (s - sig.a));
    return laplaceReal(sig.f, s, T1, 20000);
  };
  const addTrace = () => {
    const v = total();
    if (!Number.isFinite(v) || v > 4) return;
    const i = trace.xs.findIndex((x) => Math.abs(x - s) < 0.02);
    if (i >= 0) trace.ys[i] = v;
    else {
      trace.xs.push(s);
      trace.ys.push(v);
    }
    fplot.set('trace', trace.xs, trace.ys);
    if (spreadCount(trace.xs) >= 5) showFormula.disabled = false;
  };
  const draw = () => {
    const sig = SIGNALS[key];
    plot.setY(sig.yMin, sig.yMax);
    const d = sample(sig.f, PROBE_T, 300);
    plot.set('f', d.xs, d.ys);
    const p = sample((tt) => Math.exp(-s * tt), PROBE_T, 300);
    plot.set('probe', p.xs, p.ys);
    const q = sample(product(), PROBE_T, 300);
    plot.set('prod', q.xs, q.ys);
    rArea.set(fmt(runningAreaAt(product(), tc0), 3));
    const tot = total();
    const fin = Number.isFinite(tot);
    // an oscillating signal has no single answer at s ≤ a: its area sloshes, it doesn't run off
    const none = sig.osc ? '—' : '∞';
    rTotal.set(fin ? fmt(tot, 3) : none);
    const rest = fin ? tot - runningAreaAt(product(), PROBE_T) : 0;
    status.textContent = fin
      ? t('finite', { s: fmt(s, 2), F: fmt(tot, 3) }) + (Math.abs(rest) >= 0.0005 ? ` ${t('window', { rest: fmt(rest, 3) })}` : '')
      : sig.osc
        ? t('sloshes')
        : t('infinite');
    fplot.setLines([{ kind: 'v', at: s, color: 'ink3', dash: [2, 3] }]);
    fplot.setBands(sig.a > -1 ? [{ kind: 'v', from: -1, to: sig.a, color: withAlpha(color('ink3'), 0.12), label: t('noArea') }] : []);
    fplot.setMarkers(fin ? [{ x: s, y: tot, color: 'ink', shape: 'diamond', clamp: true, offLabel: `↑ ${fmt(tot, 2)}` }] : []);
    plot.describe(t('describe', { s: fmt(s, 2), A: fin ? fmt(tot, 3) : none }));
  };
  const loop = new Loop((dt) => {
    tc0 = Math.min(PROBE_T, tc0 + dt * 3);
    plot.setCursor(tc0 < PROBE_T ? tc0 : null);
    plot.invalidate();
    rArea.set(fmt(runningAreaAt(product(), tc0), 3));
    if (tc0 >= PROBE_T) {
      loop.pause();
      addTrace();
    }
  }, host);
  const restart = () => {
    draw();
    if (Loop.autoplay) {
      tc0 = 0;
      loop.play();
    } else {
      tc0 = PROBE_T;
      plot.invalidate();
      addTrace();
    }
  };
  const sl = slider({
    label: t('s'),
    min: -1,
    max: 4,
    step: 0.05,
    value: s,
    onInput: (v) => {
      s = v;
      tc0 = PROBE_T;
      loop.pause();
      plot.setCursor(null);
      draw();
    },
  });
  // one dot per deliberate choice: on release, or after a pause in arrow presses (not one per key)
  const offSettle = onSettle(sl.input, () => addTrace());
  const sweep = iconButton('play', t('sweep'));
  sweep.addEventListener('click', () => {
    tc0 = 0;
    loop.play();
  });
  const showFormula = h('button', { class: 'btn small', type: 'button', disabled: true }, t('showFormula'));
  showFormula.addEventListener('click', () => {
    const sig = SIGNALS[key];
    const xs: number[] = [];
    const ys: number[] = [];
    for (let v = sig.a + 0.01; v <= 4; v += 0.01) {
      xs.push(v);
      ys.push(sig.F(v));
    }
    fplot.set('formula', xs, ys);
  });
  host.append(
    h('div', { class: 'w-controls' }, sl.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rArea.el, rTotal.el), h('div', { class: 'w-row' }, sweep, showFormula)),
    status,
    h('p', { class: 'w-help' }, t('help')),
  );
  restart();
  const off = ctx.bus.on('predict:ch7-step', () => {
    key = 'step';
    seg.set('step');
    restart();
  });
  return () => {
    off();
    offSettle();
    loop.destroy();
  };
};

/** 7b — the transform of e^(at) explodes as s approaches a. */
const explode: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let a = -0.5;
  let s = 1.5;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const prod = new Plot(left, {
    x: { label: tc('plots.time'), min: 0, max: 10 },
    y: { label: '', min: 0, max: 1.3 },
    series: [{ id: 'p', color: 'ink', label: t('product') }],
    height: 220,
    label: t('prodAria'),
  });
  shadeOverlay(prod, () => (tt) => Math.exp((a - s) * tt), () => 10);
  const F = new Plot(right, {
    x: { label: 's', min: -2.5, max: 4 },
    y: { label: 'F(s)', min: 0, max: 6 },
    series: [{ id: 'F', color: 'ink', label: t('curve') }],
    height: 220,
    label: t('fAria'),
  });
  const rF = readout(t('readF'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const eq = h('div', { class: 'math-block' });
  const update = () => {
    const d = sample((tt) => Math.exp((a - s) * tt), 10, 300);
    prod.set('p', d.xs, d.ys);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let v = a + 0.005; v <= 4; v += 0.01) {
      xs.push(v);
      ys.push(1 / (v - a));
    }
    F.set('F', xs, ys);
    F.setBands([{ kind: 'v', from: -2.5, to: a, color: withAlpha(color('ink3'), 0.12), label: t('noArea') }]);
    // the curve hugs the line's right side all the way up, so its short label sits in the band on the left
    F.setLines([{ kind: 'v', at: a, color: 'ink', dash: [5, 4], label: `a = ${fmt(a, 2)}`, labelSide: 'left', labelAt: 'middle', avoid: ['F'] }]);
    const val = s > a ? 1 / (s - a) : Infinity;
    // near a the value leaves the frame: pin it to the top edge with an arrow and the number
    F.setMarkers(Number.isFinite(val) ? [{ x: s, y: val, color: 'ink', label: `s = ${fmt(s, 2)}`, clamp: true, offLabel: `↑ ${fmt(val, 2)}` }] : []);
    rF.set(Number.isFinite(val) ? fmt(val, 2) : '∞');
    // the product plot stops at 10 s; say how much of the area is still to come beyond it
    const later = Number.isFinite(val) ? Math.exp(-10 * (s - a)) : 0;
    const main = s <= a ? t('never') : s - a < 0.3 ? t('close', { F: fmt(val, 2) }) : t('calm');
    status.textContent = later >= 0.01 ? `${main} ${t('window', { pct: fmt(100 * later, 0) })}` : main;
    eq.innerHTML = tex(`\\int_0^\\infty e^{${fmt(a, 2)}t}\\,e^{-st}\\,dt = \\frac{1}{s - (${fmt(a, 2)})} ${Number.isFinite(val) ? `= ${fmt(val, 2)}` : '\\to \\infty'}`, true);
    F.describe(status.textContent);
  };
  const sa = slider({ label: t('a'), min: -2, max: 1, step: 0.05, value: a, color: 'out', onInput: (v) => ((a = v), update()) });
  const ss = slider({ label: t('s'), min: -2.5, max: 4, step: 0.05, value: s, onInput: (v) => ((s = v), update()) });
  host.append(eq, h('div', { class: 'w-controls' }, sa.el, ss.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rF.el)), status);
  update();
};

/** 7b (part 2) — a complex s can unspin a spinning signal. */
const unspin: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  const W0 = 2;
  let sig = 0.4;
  let om = 0.5;
  let tNow = 0;
  const T1 = 25;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid side-r' });
  const pbox = h('div', { style: { maxWidth: '540px', width: '100%', margin: '0 auto' } });
  const side = h('div');
  grid.append(pbox, side);
  host.append(grid);
  // the frame grows to fit the whole run and its final total (up to 1/σ = 20 when the spins match),
  // snapping after keyboard steps and easing after a drag; `extent` is an invisible stand-in for it
  const plot = new Plot(pbox, {
    x: { label: t('re'), min: -0.5, max: 1.5, autoMin: -24, autoMax: 24 },
    y: { label: t('im'), min: -1, max: 1, autoMin: -24, autoMax: 24 },
    series: [
      { id: 'path', color: 'ink', label: t('path'), width: 3.6 },
      { id: 'extent', color: 'transparent', width: 0 },
    ],
    height: 360,
    label: t('plotAria'),
  });
  // each quarter second of area is one arrow, laid head to tail along the path (Chapter 5's arrows)
  const PIECE = 0.25;
  plot.overlay = (g, px, py) => {
    const s = cx(sig, om);
    const n = Math.floor(tNow / PIECE + 1e-9);
    g.strokeStyle = color('ink');
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.setLineDash([]);
    let prev = unspinIntegral(W0, s, 0);
    for (let k = 1; k <= n; k++) {
      const cur = unspinIntegral(W0, s, k * PIECE);
      const x0 = px(prev.re);
      const y0 = py(prev.im);
      const x1 = px(cur.re);
      const y1 = py(cur.im);
      prev = cur;
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 6) continue;
      const ux = (x1 - x0) / len;
      const uy = (y1 - y0) / len;
      const hd = Math.min(7, len * 0.6);
      g.beginPath();
      g.moveTo(x1 - hd * ux + hd * 0.6 * uy, y1 - hd * uy - hd * 0.6 * ux);
      g.lineTo(x1, y1);
      g.lineTo(x1 - hd * ux - hd * 0.6 * uy, y1 - hd * uy + hd * 0.6 * ux);
      g.stroke();
    }
    labelOutside(g, px, py, s);
  };
  // When the spiral winds round its final total, every corner next to the diamond is on the path,
  // so the label moves out beside the spiral with a short arrow pointing in at the diamond. The
  // frame always holds the starting range [−0.5, 1.5], so the room measured against it is real.
  let outside = false;
  const labelOutside = (g: CanvasRenderingContext2D, px: (x: number) => number, py: (y: number) => number, s: ReturnType<typeof cx>) => {
    const L = unspinLimit(W0, s);
    const e = unspinExtent(W0, s, T1);
    const X = px(L.re);
    const Y = py(L.im);
    const l = px(e.x[0]);
    const r = px(e.x[1]);
    const M = 14;
    const wraps = X - l > M && r - X > M && Y - py(e.y[1]) > M && py(e.y[0]) - Y > M;
    const text = t('limit');
    g.font = canvasHandFont(15);
    const need = g.measureText(text).width + 30;
    const roomL = l - px(-0.5);
    const roomR = px(1.5) - r;
    const side = !wraps || Math.max(roomL, roomR) < need ? 0 : roomL >= roomR ? -1 : 1;
    if ((side !== 0) !== outside) {
      outside = side !== 0;
      requestAnimationFrame(draw);
    }
    if (!side) return;
    const edge = side < 0 ? l - 5 : r + 5;
    const tail = edge + side * 14;
    g.strokeStyle = g.fillStyle = color('ink');
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(tail, Y);
    g.lineTo(edge, Y);
    g.moveTo(edge + side * 6, Y - 4);
    g.lineTo(edge, Y);
    g.lineTo(edge + side * 6, Y + 4);
    g.stroke();
    g.textAlign = side < 0 ? 'right' : 'left';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.strokeStyle = color('card');
    g.lineWidth = 3;
    g.strokeText(text, tail + side * 4, Y);
    g.fillText(text, tail + side * 4, Y);
  };
  const rMag = readout(t('mag'));
  const rSpin = readout(t('spin'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  let said = '';
  const fit = () => {
    // the whole run to T1 plus the final total, so the frame is settled before the path is drawn
    const e = unspinExtent(W0, cx(sig, om), T1);
    plot.set('extent', e.x, e.y);
  };
  const draw = () => {
    const s = cx(sig, om);
    const xs: number[] = [];
    const ys: number[] = [];
    const n = 500;
    for (let i = 0; i <= n; i++) {
      const I = unspinIntegral(W0, s, (tNow * i) / n);
      xs.push(I.re);
      ys.push(I.im);
    }
    plot.set('path', xs, ys);
    const L = unspinLimit(W0, s);
    const cur = unspinIntegral(W0, s, tNow);
    plot.setMarkers([
      // not a pole: × and ○ are kept for poles and zeros (Chapter 8)
      { x: L.re, y: L.im, color: 'ink', shape: 'diamond', label: outside ? undefined : t('limit'), clamp: true, avoid: ['path'] },
      { x: cur.re, y: cur.im, color: 'ink', shape: 'dot' },
    ]);
    const mag = Math.hypot(L.re, L.im);
    rMag.set(fmt(mag, 2));
    const rel = W0 - om;
    rSpin.set(`${fmt(rel, 2)} ${unitLabel('rad/s')}`);
    const text = Math.abs(rel) < 0.05 ? t('matched', { m: fmt(mag, 1) }) : t('spinning');
    // drawn every frame while it runs; the live region only hears about real changes
    if (text !== said) {
      said = text;
      status.textContent = text;
      plot.describe(text);
    }
  };
  const loop = new Loop((dt) => {
    tNow = Math.min(T1, tNow + dt * 3);
    draw();
    if (tNow >= T1) loop.pause();
  }, host);
  const restart = () => {
    fit();
    if (Loop.autoplay) {
      tNow = 0;
      loop.play();
    } else {
      tNow = T1;
      draw();
    }
  };
  const ss = slider({ label: t('sigma'), min: 0.05, max: 2, step: 0.05, value: sig, onInput: (v) => ((sig = v), restart()) });
  const so = slider({ label: t('omega'), min: 0, max: 4, step: 0.05, value: om, onInput: (v) => ((om = v), restart()) });
  const again = iconButton('play', t('again'));
  again.addEventListener('click', () => {
    tNow = 0;
    loop.play();
  });
  side.append(
    h('div', { style: { display: 'grid', gap: '10px' } }, ss.el, so.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rMag.el, rSpin.el), again),
    status,
  );
  restart();
  return () => loop.destroy();
};

/** 7c — test the derivative rule on a signal the learner draws. */
const derivRule: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let d = fromFunction((tt) => 1 + 0.8 * Math.exp(-0.6 * tt) * Math.cos(1.8 * tt));
  let s = 1;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const fp = new Plot(left, {
    x: { label: tc('plots.time'), min: 0, max: DRAW_T },
    y: { label: '', min: -1.5, max: 2.5 },
    series: [
      { id: 'f', color: 'out', label: t('f') },
      { id: 'df', color: 'ink2', label: t('df'), width: 1.6, dash: [3, 3] },
    ],
    height: 250,
    label: t('plotAria'),
  });
  const sp = new Plot(right, {
    x: { label: 's', min: 0.2, max: 3 },
    y: { label: '', min: -2, max: 2 },
    series: [
      { id: 'lhs', color: 'ink', label: t('lhs'), width: 3.2 },
      // neutral ink: orange is kept for control effort
      { id: 'rhs', color: 'ink2', label: t('rhs'), dash: [6, 5], width: 2 },
    ],
    height: 250,
    label: t('sAria'),
  });
  const rL = readout(t('lhsShort'));
  const rR = readout(t('rhsShort'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const update = () => {
    fp.set('f', d.xs, d.f);
    fp.set('df', d.xs, d.df);
    const ss: number[] = [];
    const L: number[] = [];
    const R: number[] = [];
    for (let v = 0.2; v <= 3.001; v += 0.05) {
      const r = derivativeRule(d, v);
      ss.push(v);
      L.push(r.lhs);
      R.push(r.rhs);
    }
    const lo = Math.min(...L, ...R);
    const hi = Math.max(...L, ...R);
    const pad = Math.max(0.2, (hi - lo) * 0.15);
    // at least three labelled ticks, even on a phone
    sp.opts.y.ticks = niceTicks(lo - pad, hi + pad, 4);
    sp.setY(lo - pad, hi + pad);
    sp.set('lhs', ss, L);
    sp.set('rhs', ss, R);
    sp.setLines([{ kind: 'v', at: s, color: 'ink3', dash: [2, 3] }]);
    const r = derivativeRule(d, s);
    rL.set(fmt(r.lhs, 3));
    rR.set(fmt(r.rhs, 3));
    const ok = Math.abs(r.lhs - r.rhs) < 0.01;
    status.textContent = ok ? t('match', { s: fmt(s, 2), v: fmt(r.lhs, 3) }) : t('nomatch');
    status.className = `w-status${ok ? ' good' : ''}`;
    fp.describe(t('describe', { l: fmt(r.lhs, 3), r: fmt(r.rhs, 3) }));
  };
  const sl = slider({ label: t('s'), min: 0.2, max: 3, step: 0.05, value: s, onInput: (v) => ((s = v), update()) });
  const presets = [
    (tt: number) => 1 + 0.8 * Math.exp(-0.6 * tt) * Math.cos(1.8 * tt),
    (tt: number) => (tt < 2 ? 0.1 : 1.5) + 0.3 * Math.sin(3 * tt),
    (tt: number) => 2 * Math.exp(-0.4 * tt) - 0.5,
  ];
  const hint = h('p', { class: 'w-help', 'aria-live': 'polite' }, t('help'));
  let drawing = false;
  const drawBtn = h('button', { class: 'btn small primary', type: 'button', 'aria-pressed': 'false' }, t('draw'));
  const setDrawing = (on: boolean) => {
    drawing = on;
    drawBtn.setAttribute('aria-pressed', String(on));
    drawBtn.textContent = on ? t('stopDraw') : t('draw');
    fp.el.classList.toggle('drawing', on);
    if (on) {
      hint.textContent = t('drawing');
      fp.enableSketch((pts) => {
        if (pts.length < 5 || pts[pts.length - 1].x - pts[0].x < 3) {
          hint.textContent = t('tooShort');
          return;
        }
        d = fromPoints(pts.map((p) => ({ x: Math.max(0, Math.min(DRAW_T, p.x)), y: Math.max(-1.5, Math.min(2.5, p.y)) })));
        fp.setGuess(pts);
        seg.set('none');
        hint.textContent = t('drawn');
        update();
      });
    } else {
      fp.disableSketch();
      hint.textContent = t('help');
    }
  };
  drawBtn.addEventListener('click', () => setDrawing(!drawing));
  const seg = segmented(
    t('presetLabel'),
    presets.map((_, i) => ({ value: String(i), label: t(`presets.${i}`) })),
    '0',
    (v) => {
      setDrawing(false);
      fp.setGuess([]);
      d = fromFunction(presets[Number(v)]);
      update();
    },
  );
  const eq = h('div', { class: 'math-block', html: tex('\\underbrace{\\int_0^\\infty f\'(t)\\,e^{-st}\\,dt}_{\\text{' + t('lhsShort') + '}} \\;\\overset{?}{=}\\; \\underbrace{s\\,F(s) - f(0)}_{\\text{' + t('rhsBrace') + '}}', true) });
  host.append(
    eq,
    h('div', { class: 'w-controls' }, sl.el),
    h('div', { class: 'w-controls draw-row' }, seg.el, drawBtn),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rL.el, rR.el)),
    status,
    hint,
  );
  update();
};

/** 7d — derive the table one row at a time, each row checked against the probe. */
const tableW: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  const rows = [
    { f: () => 1, F: (s: number) => T.step(cx(s)).re, a: 0 },
    { f: (tt: number) => Math.exp(-tt), F: (s: number) => T.exp(-1)(cx(s)).re, a: -1 },
    { f: (tt: number) => Math.sin(2 * tt), F: (s: number) => T.sin(2)(cx(s)).re, a: 0 },
    { f: (tt: number) => Math.exp(-0.5 * tt) * Math.sin(2 * tt), F: (s: number) => T.dampedSin(0.5, 2)(cx(s)).re, a: -0.5 },
  ];
  const extra = [null, null, { f: (tt: number) => Math.cos(2 * tt), F: (s: number) => T.cos(2)(cx(s)).re }, { f: (tt: number) => Math.exp(-0.5 * tt) * Math.cos(2 * tt), F: (s: number) => dampedCos(0.5, 2)(cx(s)).re }];
  const derived = new Set<number>([0]);
  let cur = 0;
  let shownRow = -1;
  let s = 1;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const tbody = h('tbody');
  const tableEl = h('table', { class: 'ltable' }, h('caption', { class: 'visually-hidden' }, t('caption')), h('thead', null, h('tr', null, h('th', { scope: 'col' }, t('colSignal')), h('th', { scope: 'col' }, t('colF')), h('th', { scope: 'col' }, h('span', { class: 'visually-hidden' }, t('colCheck'))))), tbody);
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  left.append(tableEl);
  host.append(grid);
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: PROBE_T },
    y: { label: '', min: -1.2, max: 1.4 },
    series: [
      { id: 'f', color: 'out', label: t('f') },
      { id: 'prod', color: 'ink', label: t('product'), width: 2.4 },
    ],
    height: 220,
    label: t('plotAria'),
  });
  shadeOverlay(plot, () => (tt) => rows[cur].f(tt) * Math.exp(-s * tt), () => PROBE_T);
  const steps = h('div', { class: 'derivation', id: uid('derivation') });
  const rNum = readout(t('numeric'));
  const rFor = readout(t('formulaVal'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  right.append(h('div', { class: 'readouts' }, rNum.el, rFor.el), status);
  const render = (focusRow = -1) => {
    tbody.replaceChildren();
    rows.forEach((_, i) => {
      const done = derived.has(i);
      // not a toggle: the button opens that row's derivation below, and marks the row being shown
      const btn = h('button', { class: 'btn small', type: 'button', 'aria-current': i === cur ? 'true' : undefined, 'aria-controls': steps.id }, done ? t('show') : t('derive'));
      btn.addEventListener('click', () => {
        derived.add(i);
        cur = i;
        render(i);
        update();
      });
      const F = done ? h('td', { html: tex(t(`rows.${i}.F`)) }) : h('td', null, h('span', { 'aria-hidden': 'true' }, '?'), h('span', { class: 'visually-hidden' }, t('unknown')));
      tbody.append(h('tr', { class: i === cur ? 'current' : '' }, h('td', { html: tex(t(`rows.${i}.f`)) }), F, h('td', null, btn)));
      // the row is re-drawn, so keep keyboard focus on the button that was pressed
      if (i === focusRow) btn.focus();
    });
  };
  const update = () => {
    const r = rows[cur];
    const d = sample(r.f, PROBE_T, 300);
    plot.set('f', d.xs, d.ys);
    const q = sample((tt) => r.f(tt) * Math.exp(-s * tt), PROBE_T, 300);
    plot.set('prod', q.xs, q.ys);
    const num = laplaceReal(r.f, s, Math.min(200, 40 / (s - r.a)), 20000);
    const form = r.F(s);
    rNum.set(fmt(num, 4));
    const ok = Math.abs(num - form) < 1e-3;
    rFor.set(fmt(form, 4), ok ? 'good' : 'bad');
    const ex = extra[cur];
    // the words follow the same test as the readout's colour
    status.textContent = !ok ? t('differ') : ex ? t('twinCheck', { n: fmt(laplaceReal(ex.f, s, Math.min(200, 40 / (s - r.a)), 20000), 4), f: fmt(ex.F(s), 4) }) : t('agree');
    const list = (t(`rows.${cur}.steps`) || '').split('||');
    if (shownRow !== cur) {
      shownRow = cur;
      steps.replaceChildren(h('p', { class: 'w-subtitle' }, t('how')), ...list.map((st) => h('div', { class: 'math-block', html: tex(st, true) })));
    }
    plot.describe(t('describe', { n: fmt(num, 4), f: fmt(form, 4) }));
  };
  const sl = slider({ label: t('s'), min: 0.2, max: 3, step: 0.05, value: s, onInput: (v) => ((s = v), update()) });
  host.append(h('div', { class: 'w-controls' }, sl.el), steps);
  render();
  update();
};

/** 7e — solve the drone with the transform and compare with the simulation. */
const solve: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let kp = 20;
  let h0 = 1;
  // ?reveal shows the page's swap maths in their fixed form, so the widget starts fixed too
  let ic = new URLSearchParams(location.search).has('reveal');
  const T1 = 6;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const plot = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: 0, max: 3.6 },
    series: [
      { id: 'sim', color: 'out', label: t('sim'), width: 4, ghost: true },
      { id: 'formula', color: 'ink', label: t('formula'), dash: [7, 5], width: 2 },
    ],
    height: 260,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 2, color: 'sp', label: t('target') }]);
  const eqH = h('div', { class: 'math-block' });
  const eqT = h('div', { class: 'math-block' });
  const rGap = readout(t('gap'));
  const rZero = readout(t('atZero'));
  const rSettle = readout(t('settle'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  // when the h(0) fix is switched on/off the formula curve glides onto its new shape
  let shownF: number[] = [];
  let morphing = 0;
  let animateNext = false;
  const morphFormula = (xs: number[], f: number[]) => {
    cancelAnimationFrame(morphing);
    const from = shownF.length === f.length ? shownF : f;
    if (!animateNext || prefersReducedMotion() || from === f) {
      shownF = f;
      plot.set('formula', xs, f);
      return;
    }
    animateNext = false;
    const t0 = performance.now();
    const DUR = 520;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / DUR);
      const e = 1 - Math.pow(1 - k, 3);
      shownF = f.map((v, i) => from[i] + (v - from[i]) * e);
      plot.set('formula', xs, shownF);
      if (k < 1) morphing = requestAnimationFrame(step);
    };
    morphing = requestAnimationFrame(step);
  };
  const update = () => {
    const p = { m: DRONE.m, c: DRONE.c, g: DRONE.g, kp, r: 2, h0, v0: 0 };
    const sol = solveDrone(p, ic);
    const sim = new DroneSim(defaultDroneConfig({ pid: P_ONLY(kp), h0 }));
    const xs = [0];
    const ys = [sim.h];
    sim.advance(T1, () => {
      xs.push(sim.t);
      ys.push(sim.h);
    }, 10);
    plot.set('sim', xs, ys);
    const f = xs.map(sol.f);
    morphFormula(xs, f);
    let gap = 0;
    xs.forEach((_, i) => (gap = Math.max(gap, Math.abs(ys[i] - f[i]))));
    rGap.set(`${fmt(gap, gap < 0.01 ? 6 : 2)} ${unitLabel('m')}`, gap < 1e-3 ? 'good' : 'bad');
    rZero.set(`${fmt(ys[0], 2)} / ${fmt(f[0], 2)} ${unitLabel('m')}`);
    // Chapter 2's look: dotted blue "settles here" line at A, red droop band up to the target
    const droop = 2 - sol.A;
    plot.setDroop({ target: 2, settle: sol.A, label: t('droop', { d: fmt(droop, 3) }), labelAt: 'end', labelSide: 'below', avoid: ['sim', 'formula'] });
    rSettle.set(`${fmt(sol.A, 3)} ${unitLabel('m')}`);
    // numerator terms that are zero (from the ground, or with the fix switched off) are left out
    const terms = ic ? [DRONE.m * h0 !== 0 ? `${fmt(DRONE.m * h0, 2)}s^2` : '', DRONE.c * h0 !== 0 ? `${fmt(DRONE.c * h0, 2)}s` : ''].filter(Boolean) : [];
    const num = [...terms, fmt(kp * 2 - DRONE.m * DRONE.g, 3)].join(' + ');
    eqH.innerHTML = tex(
      `\\begin{aligned} \\out{H}(s) &= \\frac{${num}}{s\\,(${fmt(DRONE.m, 1)}s^2 + s + \\eff{${fmt(kp, 0)}})} \\\\[4pt] &= \\frac{${fmt(sol.A, 3)}}{s} + \\frac{${fmt(sol.B, 3)}\\,s ${sol.C >= 0 ? '+' : '-'} ${fmt(Math.abs(sol.C), 3)}}{${fmt(DRONE.m, 1)}s^2 + s + \\eff{${fmt(kp, 0)}}} \\end{aligned}`,
      true,
    );
    const decay = sol.sigma === 1 ? '-t' : `-${fmt(sol.sigma, 2)}t`;
    const osc = `e^{${decay}}\\big(${fmt(sol.K1, 3)}\\cos ${fmt(sol.wd, 2)}t ${sol.K2 >= 0 ? '+' : '-'} ${fmt(Math.abs(sol.K2), 3)}\\sin ${fmt(sol.wd, 2)}t\\big)`;
    // on narrow screens the solution breaks onto two aligned lines instead of scrolling sideways
    eqT.innerHTML = tex(
      host.clientWidth < 560 ? `\\begin{aligned} \\out{h}(t) &= ${fmt(sol.A, 3)} \\\\ &\\quad + ${osc} \\end{aligned}` : `\\out{h}(t) = ${fmt(sol.A, 3)} + ${osc}`,
      true,
    );
    // from the ground the forgotten terms are zero, so the mistake hides: say so rather than "perfect"
    const text = gap < 1e-3 ? (ic ? `${t('match')} ${t('fixed')}` : t('hidden')) : ic ? t('odd') : t('mismatch', { h: fmt(h0, 1) });
    status.textContent = text;
    status.className = `w-status${gap < 1e-3 && ic ? ' good' : gap < 1e-3 ? '' : ' bad'}`;
    plot.describe(status.textContent);
  };
  const sk = slider({ label: t('kp'), min: 5, max: 60, step: 1, value: kp, unit: 'N/m', color: 'eff', onInput: (v) => ((kp = v), update()) });
  const sh = slider({ label: t('h0'), min: 0, max: 3, step: 0.1, value: h0, unit: 'm', color: 'out', onInput: (v) => ((h0 = v), update()) });
  onInteractStart(sk.input, () => plot.clear(true));
  onInteractStart(sh.input, () => plot.clear(true));
  const tg = toggle(t('toggle'), ic, (v) => {
    ic = v;
    animateNext = true;
    ctx.bus.emit('ch7:ic', v);
    update();
  });
  host.append(
    eqH,
    eqT,
    h('div', { class: 'w-row fix-row' }, tg.el),
    h('div', { class: 'w-controls' }, sk.el, sh.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rGap.el, rZero.el, rSettle.el)),
    status,
    h('p', { class: 'w-help' }, t('rk4')),
  );
  update();
  return () => cancelAnimationFrame(morphing);
};

export const widgets: Record<string, WidgetFactory> = { probe, explode, unspin, derivRule, table: tableW, solve };
