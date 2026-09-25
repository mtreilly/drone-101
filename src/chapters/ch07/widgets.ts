import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { tex } from '../../core/rich-text';
import { c as cx } from '../../math/complex';
import { laplaceReal, table as T } from '../../math/laplace';
import { DRONE, DroneSim, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import type { WidgetFactory } from '../../story/types';
import './ch07.css';
import { color, withAlpha } from '../../ui/colors';
import { readout, segmented, slider, toggle } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { prefersReducedMotion } from '../../core/dom';
import { Plot } from '../../ui/plot';
import { iconButton, mark, onInteractStart, sample } from '../ch06/helpers';
import { DRAW_T, dampedCos, derivativeRule, fromFunction, fromPoints, solveDrone, unspinIntegral, unspinLimit } from './tools';

type Sig = { f: (t: number) => number; F: (s: number) => number; a: number; yMin: number; yMax: number };

/** Signals used by the probe. `a` = the abscissa of convergence (area is finite only for s > a). */
const SIGNALS: Record<string, Sig> = {
  step: { f: () => 1, F: (s) => 1 / s, a: 0, yMin: -0.2, yMax: 1.6 },
  decay: { f: (t) => Math.exp(-t), F: (s) => 1 / (s + 1), a: -1, yMin: -0.2, yMax: 1.6 },
  grow: { f: (t) => Math.exp(0.5 * t), F: (s) => 1 / (s - 0.5), a: 0.5, yMin: -0.2, yMax: 4 },
  wiggle: { f: (t) => Math.sin(2 * t), F: (s) => 2 / (s * s + 4), a: 0, yMin: -1.3, yMax: 1.6 },
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
      { id: 'probe', color: 'ink3', label: t('probe'), dash: [6, 4], width: 1.8 },
      { id: 'prod', color: 'ink', label: t('product'), width: 2.6 },
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
    if (trace.xs.length >= 5) showFormula.disabled = false;
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
    rTotal.set(Number.isFinite(tot) ? fmt(tot, 3) : '∞');
    status.textContent = Number.isFinite(tot) ? t('finite', { s: fmt(s, 2), F: fmt(tot, 3) }) : t('infinite');
    fplot.setLines([{ kind: 'v', at: s, color: 'ink3', dash: [2, 3] }]);
    plot.describe(t('describe', { s: fmt(s, 2), A: Number.isFinite(tot) ? fmt(tot, 3) : '∞' }));
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
  sl.input.addEventListener('change', () => addTrace());
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
    series: [{ id: 'F', color: 'ink', label: '1/(s − a)' }],
    height: 220,
    label: t('fAria'),
  });
  const rF = readout('F(s)');
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
    F.setLines([{ kind: 'v', at: a, color: 'ink', dash: [5, 4], label: t('lives', { a: fmt(a, 2) }) }]);
    const val = s > a ? 1 / (s - a) : Infinity;
    F.setMarkers(Number.isFinite(val) && val < 6 ? [{ x: s, y: val, color: 'ink', label: `s = ${fmt(s, 2)}` }] : []);
    rF.set(Number.isFinite(val) ? fmt(val, 2) : '∞');
    status.textContent = s <= a ? t('never') : s - a < 0.3 ? t('close') : t('calm');
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
  const plot = new Plot(pbox, {
    x: { label: t('re'), min: -1, max: 4.5 },
    y: { label: t('im'), min: -2, max: 2 },
    series: [{ id: 'path', color: 'ink', label: t('path'), width: 3.6 }],
    height: 460,
    label: t('plotAria'),
  });
  const rMag = readout(t('mag'));
  const rSpin = readout(t('spin'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
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
      { x: L.re, y: L.im, color: 'ink', shape: 'cross', label: t('limit') },
      { x: cur.re, y: cur.im, color: 'ink', shape: 'dot' },
    ]);
    const mag = Math.hypot(L.re, L.im);
    rMag.set(fmt(mag, 2));
    const rel = W0 - om;
    rSpin.set(`${fmt(rel, 2)} rad/s`);
    status.textContent = Math.abs(rel) < 0.05 ? t('matched', { m: fmt(mag, 1) }) : t('spinning');
    plot.describe(status.textContent);
  };
  const loop = new Loop((dt) => {
    tNow = Math.min(T1, tNow + dt * 3);
    draw();
    if (tNow >= T1) loop.pause();
  }, host);
  const restart = () => {
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
      { id: 'rhs', color: 'eff', label: t('rhs'), dash: [6, 5], width: 2 },
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
    sp.setY(lo - pad, hi + pad);
    sp.set('lhs', ss, L);
    sp.set('rhs', ss, R);
    sp.setLines([{ kind: 'v', at: s, color: 'ink3', dash: [2, 3] }]);
    const r = derivativeRule(d, s);
    rL.set(fmt(r.lhs, 3));
    rR.set(fmt(r.rhs, 3));
    const ok = Math.abs(r.lhs - r.rhs) < 0.01;
    status.textContent = ok ? t('match', { s: fmt(s, 2) }) : t('nomatch');
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
  const steps = h('div', { class: 'derivation' });
  const rNum = readout(t('numeric'));
  const rFor = readout(t('formulaVal'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  right.append(h('div', { class: 'readouts' }, rNum.el, rFor.el), status);
  const render = () => {
    tbody.replaceChildren();
    rows.forEach((_, i) => {
      const done = derived.has(i);
      const btn = h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(i === cur) }, done ? t('show') : t('derive'));
      btn.addEventListener('click', () => {
        derived.add(i);
        cur = i;
        render();
        update();
      });
      tbody.append(
        h(
          'tr',
          { class: i === cur ? 'current' : '' },
          h('td', { html: tex(t(`rows.${i}.f`)) }),
          h('td', { html: done ? tex(t(`rows.${i}.F`)) : '<span aria-label="' + t('unknown') + '">?</span>' }),
          h('td', null, btn),
        ),
      );
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
    rFor.set(fmt(form, 4), Math.abs(num - form) < 1e-3 ? 'good' : 'bad');
    const ex = extra[cur];
    status.textContent = ex ? t('twinCheck', { n: fmt(laplaceReal(ex.f, s, Math.min(200, 40 / (s - r.a)), 20000), 4), f: fmt(ex.F(s), 4) }) : t('agree');
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
  let ic = false;
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
    rGap.set(`${fmt(gap, gap < 0.01 ? 6 : 2)} m`, gap < 1e-3 ? 'good' : 'bad');
    rZero.set(`${fmt(ys[0], 2)} / ${fmt(f[0], 2)} m`);
    const num = ic ? `${fmt(DRONE.m * h0, 2)}s^2 + ${fmt(DRONE.c * h0, 2)}s + ${fmt(kp * 2 - DRONE.m * DRONE.g, 3)}` : `${fmt(kp * 2 - DRONE.m * DRONE.g, 3)}`;
    eqH.innerHTML = tex(
      `\\begin{aligned} \\out{H}(s) &= \\frac{${num}}{s\\,(${fmt(DRONE.m, 1)}s^2 + s + \\eff{${fmt(kp, 0)}})} \\\\[4pt] &= \\frac{${fmt(sol.A, 3)}}{s} + \\frac{${fmt(sol.B, 3)}\\,s ${sol.C >= 0 ? '+' : '-'} ${fmt(Math.abs(sol.C), 3)}}{${fmt(DRONE.m, 1)}s^2 + s + \\eff{${fmt(kp, 0)}}} \\end{aligned}`,
      true,
    );
    const osc = `e^{-t}\\big(${fmt(sol.K1, 3)}\\cos ${fmt(sol.wd, 2)}t ${sol.K2 >= 0 ? '+' : '-'} ${fmt(Math.abs(sol.K2), 3)}\\sin ${fmt(sol.wd, 2)}t\\big)`;
    // on narrow screens the solution breaks onto two aligned lines instead of scrolling sideways
    eqT.innerHTML = tex(
      host.clientWidth < 560 ? `\\begin{aligned} \\out{h}(t) &= ${fmt(sol.A, 3)} \\\\ &\\quad + ${osc} \\end{aligned}` : `\\out{h}(t) = ${fmt(sol.A, 3)} + ${osc}`,
      true,
    );
    status.textContent = gap < 1e-3 ? t('match') : ic ? t('odd') : t('mismatch', { h: fmt(h0, 1) });
    status.className = `w-status${gap < 1e-3 ? ' good' : ' bad'}`;
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
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rGap.el, rZero.el)),
    status,
  );
  update();
  return () => cancelAnimationFrame(morphing);
};

export const widgets: Record<string, WidgetFactory> = { probe, explode, unspin, derivRule, table: tableW, solve };
