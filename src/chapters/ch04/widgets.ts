import { h } from '../../core/dom';
import { fmt } from '../../core/i18n';
import type { WidgetFactory } from '../../story/types';
import { color } from '../../ui/colors';
import { readout, segmented, slider, toggle } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { MsdView } from '../../ui/msd-view';
import { Plot } from '../../ui/plot';
import { coffeeSteps } from '../ch03/models';
import { dragX } from '../ch03/plot-drag';
import { canvasHandFont } from '../../core/font';
import { withAlpha } from '../../ui/colors';
import { BASES, coffeeGuess, compound, compoundSteps, measuredSlope, stepRate, stepRise } from './models';
import { nice } from './plays';

type Ctx = CanvasRenderingContext2D;

/** A small "click" of the readout when the learner's answer locks in. */
function lockIn(el: HTMLElement, on: boolean): void {
  el.classList.remove('locked');
  if (!on) return;
  void el.offsetWidth;
  el.classList.add('locked');
}
type Px = (v: number) => number;

/** Draws a short tangent line and a dot at (t, f(t)). */
function tangentOverlay(f: (t: number) => number, t: number, halfWidth: number) {
  return (c: Ctx, px: Px, py: Px) => {
    const y = f(t);
    const m = measuredSlope(f, t);
    c.strokeStyle = color('ink');
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(px(t - halfWidth), py(y - m * halfWidth));
    c.lineTo(px(t + halfWidth), py(y + m * halfWidth));
    c.stroke();
    c.fillStyle = color('out');
    c.beginPath();
    c.arc(px(t), py(y), 5, 0, Math.PI * 2);
    c.fill();
  };
}

/** Step sizes for the doubling ladder: whole seconds down to "tiny". */
const LADDER_DT = ['1', '0.5', '0.25', '0.00390625'] as const;

/**
 * 2ᵗ as a ladder of bars. Splitting each step fills in the smooth curve, and wherever the
 * magnifier looks, a step rises by the same fraction of its own height.
 */
const ladder: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const T0 = -1;
  const T1 = 4;
  let dt = 1;
  let at = 1;
  const plot = new Plot(host, {
    x: { label: t('xAxis'), min: T0, max: T1 },
    y: { label: t('yAxis'), min: 0, max: 16 },
    series: [{ id: 'f', color: 'out', label: t('curve'), width: 2 }],
    height: 260,
    label: t('aria'),
    legend: false,
  });
  const rMul = readout(t('readMul'), 'out');
  const rRise = readout(t('readRise'));
  const rRate = readout(t('readRate'));
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const snap = (x: number) => Math.min(T1 - dt, Math.max(T0, T0 + Math.round((x - T0) / dt) * dt));
  const draw = () => {
    const tiny = dt < 0.1;
    if (tiny) plot.fn('f', (x) => 2 ** x);
    else plot.set('f', [], []);
    const blue = color('out');
    const ink = color('ink');
    plot.overlay = (c, px, py) => {
      const n = Math.round((T1 - T0) / dt);
      const gap = tiny ? 0 : Math.min(6, (px(dt) - px(0)) * 0.18);
      if (tiny) {
        // hundreds of slivers: one filled shape under the curve reads the same and draws cleanly
        c.fillStyle = withAlpha(blue, 0.2);
        c.beginPath();
        c.moveTo(px(T0), py(0));
        for (let k = 0; k <= 200; k++) c.lineTo(px(T0 + ((T1 - T0) * k) / 200), py(2 ** (T0 + ((T1 - T0) * k) / 200)));
        c.lineTo(px(T1), py(0));
        c.fill();
      }
      for (let k = 0; k < n; k++) {
        const x = T0 + k * dt;
        const y = 2 ** x;
        const hot = Math.abs(x - at) < 1e-9 || Math.abs(x - (at + dt)) < 1e-9;
        if (tiny && !hot) continue;
        const x0 = px(x) + gap / 2;
        const w = Math.max(tiny ? 3 : 1, px(x + dt) - px(x) - gap);
        c.fillStyle = withAlpha(blue, hot ? 0.55 : 0.16);
        c.fillRect(x0, py(y), w, py(0) - py(y));
        if (!tiny || hot) {
          c.strokeStyle = blue;
          c.lineWidth = hot ? 2 : 1.2;
          c.strokeRect(x0, py(y), w, py(0) - py(y));
        }
      }
      // the rise from this step to the next, as a bracket on the taller bar
      if (dt >= 0.25) {
        const y0 = 2 ** at;
        const y1 = 2 ** (at + dt);
        const xr = px(at + dt) + gap / 2;
        c.strokeStyle = ink;
        c.lineWidth = 1.6;
        c.setLineDash([3, 3]);
        c.beginPath();
        c.moveTo(px(at) + gap / 2, py(y0));
        c.lineTo(px(at + dt + dt) - gap / 2, py(y0));
        c.stroke();
        c.setLineDash([]);
        const bx = xr + (px(at + dt + dt) - px(at + dt)) / 2;
        c.beginPath();
        c.moveTo(bx, py(y0));
        c.lineTo(bx, py(y1));
        c.moveTo(bx - 4, py(y1) + 6);
        c.lineTo(bx, py(y1));
        c.lineTo(bx + 4, py(y1) + 6);
        c.stroke();
        const label = t('riseLabel', { pct: nice(stepRise(2, dt) * 100, 1) });
        c.font = canvasHandFont(15);
        c.fillStyle = ink;
        const tw = c.measureText(label).width;
        // keep the label on the plot: right of the arrow unless it would run off the edge
        const right = bx + 8 + tw < px(T1);
        c.textAlign = right ? 'left' : 'right';
        c.fillText(label, right ? bx + 8 : bx - 8, (py(y0) + py(y1)) / 2 + 5);
      }
    };
    plot.setCursor(null);
    plot.invalidate();
    const mul = 2 ** dt;
    rMul.set(`× ${nice(mul, 3)}`);
    rRise.set(t('pct', { v: nice(stepRise(2, dt) * 100, 1) }));
    rRate.set(fmt(stepRate(2, dt), 3), tiny ? 'good' : '');
    const msg = t('status', { pct: nice(stepRise(2, dt) * 100, 1), r: fmt(stepRate(2, dt), 3) });
    if (status.textContent !== msg) status.textContent = msg;
    plot.describe(t('describe', { t: fmt(at, 2), h: nice(2 ** at, 3), m: nice(mul, 3), pct: nice(stepRise(2, dt) * 100, 1) }));
  };
  const seg = segmented(
    t('step'),
    LADDER_DT.map((v) => ({ value: v, label: v === '0.00390625' ? t('tiny') : `${fmt(Number(v), v === '1' ? 0 : v === '0.5' ? 1 : 2)} s` })),
    '1',
    (v) => {
      dt = Number(v);
      at = snap(at);
      sl.value = at;
      draw();
    },
  );
  const sl = slider({
    label: t('look'),
    min: T0,
    max: T1 - 0.25,
    step: 0.25,
    value: at,
    unit: 's',
    digits: 2,
    onInput: (v) => {
      at = snap(v);
      draw();
    },
  });
  dragX(plot, (x) => {
    at = snap(x - dt / 2);
    sl.value = at;
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')), seg.el);
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rMul.el, rRise.el, rRate.el)), status, h('p', { class: 'w-help' }, t('help')));
  draw();
};

const COMPOUND_N = ['1', '2', '4', '12', '100', '1000'] as const;

/** Grow (or shrink) 100% per second in n steps: the total levels off at e (or 1/e). */
const compoundWidget: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let n = 1;
  let r: 1 | -1 = 1;
  let smooth = false;
  const plot = new Plot(host, {
    x: { label: t('xAxis'), min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] },
    y: { label: t('yAxis'), min: 0, max: 3 },
    series: [
      { id: 'smooth', color: 'out', label: t('smooth'), width: 2 },
      { id: 'steps', color: 'pencil', label: t('steps'), width: 2.4, ghost: true },
      { id: 'dots', color: 'pencil', dots: true },
    ],
    height: 250,
    label: t('aria'),
  });
  const rEach = readout(t('readEach'));
  const rTotal = readout(t('readTotal'), 'out');
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const draw = () => {
    const st = compoundSteps(n, r);
    plot.set('steps', st.t, st.y);
    plot.set('dots', n <= 12 ? st.t : [], n <= 12 ? st.y : []);
    if (smooth) plot.fn('smooth', (x) => Math.exp(r * x));
    else plot.set('smooth', [], []);
    plot.setY(0, r > 0 ? 3 : 1.05);
    plot.setLines(r > 0 ? [{ kind: 'h', at: Math.E, color: 'ink3', dash: [5, 4], width: 1.4, label: t('eLine') }] : [{ kind: 'h', at: Math.exp(-1), color: 'ink3', dash: [5, 4], width: 1.4, label: t('invLine') }]);
    const total = compound(n, r);
    rEach.set(`× ${nice(1 + r / n, 5)}`);
    rTotal.set(nice(total, 5), Math.abs(total - Math.exp(r)) / Math.exp(r) < 0.001 ? 'good' : '');
    let msg: string;
    if (r > 0) msg = n === 1 ? t('growOne') : t('grow', { n: fmt(n, 0), v: nice(total, 5), gap: nice(Math.E - total, 4) });
    else msg = n === 1 ? t('shrinkOne') : t('shrink', { n: fmt(n, 0), v: nice(total, 5), pct: nice((1 - total) * 100, 1) });
    status.textContent = msg;
    plot.describe(msg);
    plot.invalidate();
  };
  const segN = segmented(
    t('n'),
    COMPOUND_N.map((v) => ({ value: v, label: fmt(Number(v), 0) })),
    '1',
    (v) => {
      n = Number(v);
      plot.clear();
      draw();
    },
  );
  const segR = segmented(
    t('mode'),
    [
      { value: 'grow', label: t('growMode') },
      { value: 'shrink', label: t('shrinkMode') },
    ],
    'grow',
    (v) => {
      r = v === 'grow' ? 1 : -1;
      plot.clearGhosts();
      draw();
    },
  );
  const tg = toggle(t('showSmooth'), false, (v) => {
    smooth = v;
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')), segR.el);
  host.append(h('div', { class: 'w-controls' }, segN.el, tg.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rEach.el, rTotal.el)), status, h('p', { class: 'w-help' }, t('help')));
  draw();
};

/** Which base keeps "slope ÷ height" equal to exactly 1? */
const bases: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let b: number = 2;
  let cur = 1;
  let showSlope = false;
  const plot = new Plot(host, {
    x: { label: t('xAxis'), min: -1, max: 2 },
    y: { label: t('yAxis'), min: 0, max: 10 },
    series: [
      { id: 'f', color: 'out', label: t('curve') },
      { id: 'd', color: 'ink', label: t('slopeCurve'), dash: [6, 4], width: 2 },
    ],
    height: 240,
    label: t('aria'),
  });
  const rH = readout(t('readHeight'), 'out');
  const rS = readout(t('readSlope'));
  const rR = readout(t('readRatio'));
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const draw = () => {
    const f = (x: number) => b ** x;
    plot.fn('f', f);
    if (showSlope) plot.fn('d', (x) => measuredSlope(f, x));
    else plot.set('d', [], []);
    plot.overlay = tangentOverlay(f, cur, 0.5);
    plot.setCursor(cur);
    plot.invalidate();
    const s = measuredSlope(f, cur);
    rH.set(fmt(f(cur), 3));
    rS.set(fmt(s, 3));
    rR.set(fmt(s / f(cur), 3), Math.abs(s / f(cur) - 1) < 1e-4 ? 'good' : '');
    const msg = b === Math.E ? t('statusE') : t('statusOther', { r: fmt(Math.log(b), 3) });
    if (status.textContent !== msg) status.textContent = msg;
    plot.describe(t('describe', { b: fmt(b, 3), t: fmt(cur, 2), r: fmt(s / f(cur), 3) }));
  };
  const seg = segmented(
    t('base'),
    BASES.map((v) => ({ value: String(v), label: v === Math.E ? 'e ≈ 2.718' : fmt(v, v === 1.5 ? 1 : 0) })),
    String(b),
    (v) => {
      b = Number(v);
      draw();
      lockIn(rR.el, b === Math.E);
    },
  );
  const sl = slider({
    label: t('cursor'),
    min: -1,
    max: 2,
    step: 0.01,
    value: cur,
    onInput: (v) => {
      cur = v;
      draw();
    },
  });
  dragX(plot, (x) => {
    cur = x;
    sl.value = x;
    draw();
  });
  const tg = toggle(t('showSlope'), false, (v) => {
    showSlope = v;
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')), seg.el);
  host.append(h('div', { class: 'w-controls' }, sl.el, tg.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rH.el, rS.el, rR.el)), status, h('p', { class: 'w-help' }, t('help')));
  draw();
};

/** e^(at): slope = a × height, for any a. */
const expA: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let a = 1;
  let cur = 1;
  const plot = new Plot(host, {
    x: { label: t('xAxis'), min: 0, max: 2 },
    y: { label: t('yAxis'), min: -4, max: 8 },
    series: [
      { id: 'f', color: 'out', label: t('curve'), ghost: true },
      { id: 'd', color: 'ink', label: t('slopeCurve'), dash: [6, 4], width: 2 },
    ],
    height: 240,
    label: t('aria'),
  });
  plot.setLines([{ kind: 'h', at: 0, color: 'ink3', dash: [2, 3], width: 1 }]);
  const rR = readout(t('readRatio'));
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const draw = () => {
    const f = (x: number) => Math.exp(a * x);
    plot.fn('f', f);
    plot.fn('d', (x) => measuredSlope(f, x));
    plot.overlay = tangentOverlay(f, cur, 0.3);
    plot.setCursor(cur);
    plot.invalidate();
    const r = measuredSlope(f, cur) / f(cur);
    rR.set(fmt(r, 2));
    const msg = a > 0.001 ? t('grow') : a < -0.001 ? t('shrink') : t('flat');
    if (status.textContent !== msg) status.textContent = msg;
    plot.describe(t('describe', { a: fmt(a, 1), r: fmt(r, 2) }));
  };
  const sa = slider({
    label: t('a'),
    min: -2,
    max: 2,
    step: 0.1,
    value: a,
    unit: '1/s',
    onInput: (v) => {
      a = v;
      draw();
    },
  });
  // keep the previous curve as a ghost once per gesture (a drag, or a burst of key presses)
  let ghostArmed = true;
  const ghost = () => {
    if (!ghostArmed) return;
    ghostArmed = false;
    plot.clear();
    draw();
  };
  sa.input.addEventListener('pointerdown', ghost);
  sa.input.addEventListener('keydown', (ev) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(ev.key)) ghost();
  });
  sa.input.addEventListener('change', () => (ghostArmed = true));
  const sc = slider({
    label: t('cursor'),
    min: 0,
    max: 2,
    step: 0.01,
    value: cur,
    unit: 's',
    onInput: (v) => {
      cur = v;
      draw();
    },
  });
  dragX(plot, (x) => {
    cur = x;
    sc.value = x;
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(h('div', { class: 'w-controls' }, sa.el, sc.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rR.el)), status, h('p', { class: 'w-help' }, t('help')));
  draw();
};

/** Guess T = 20 + 70·e^(a·t) and tune a until it obeys the cooling rule. */
const guess: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let a = -0.3;
  const probe = 5;
  const truth = coffeeSteps(600, 0.1); // Chapter 3's tiny hand steps, every 0.1 min
  const tt = truth.map((_, i) => i * 0.1);
  const plot = new Plot(host, {
    x: { label: t('xAxis'), min: 0, max: 60 },
    y: { label: t('yAxis'), min: 0, max: 100 },
    series: [
      { id: 'g', color: 'out', label: t('guess'), ghost: true },
      { id: 'rule', color: 'pencil', label: t('rule'), width: 2.4, dash: [2, 5] },
    ],
    height: 240,
    label: t('aria'),
  });
  plot.set('rule', tt, truth);
  plot.setLines([
    { kind: 'h', at: 20, color: 'sp', label: t('room') },
    { kind: 'v', at: probe, color: 'ink3', dash: [3, 4], width: 1, label: t('probe') },
  ]);
  const rG = readout(t('readGuess'), 'out');
  const rRule = readout(t('readRule'));
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  let wasOk = false;
  const draw = () => {
    const g = coffeeGuess(a);
    plot.fn('g', g);
    const slopeGuess = measuredSlope(g, probe);
    const slopeRule = -(g(probe) - 20) / 10;
    rRule.set(`${fmt(slopeRule, 2)} °C/min`);
    const ok = Math.abs(a + 0.1) < 0.0026;
    rG.set(`${fmt(slopeGuess, 2)} °C/min`, ok ? 'good' : '');
    status.textContent = ok ? t('match') : a < -0.1 ? t('tooFast') : t('tooSlow');
    status.className = `w-status steady${ok ? ' good' : ''}`;
    if (ok && !wasOk) lockIn(rG.el, true);
    wasOk = ok;
    plot.describe(status.textContent ?? '');
  };
  const sl = slider({
    label: t('a'),
    min: -0.5,
    max: 0,
    step: 0.005,
    value: a,
    digits: 3,
    unit: '1/min',
    onInput: (v) => {
      a = v;
      draw();
    },
  });
  sl.input.addEventListener('change', () => {
    plot.clear();
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rG.el, rRule.el)), status);
  draw();
};

/** The spring: which real a has a² = −k/m? None. */
const square: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const kOverM = 4;
  let a = 1;
  const grid = h('div', { class: 'w-grid side-r' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  const plot = new Plot(left, {
    x: { label: t('xAxis'), min: -3, max: 3 },
    y: { label: t('yAxis'), min: -6, max: 9 },
    series: [{ id: 'sq', color: 'out', label: t('square') }],
    height: 240,
    label: t('aria'),
  });
  plot.fn('sq', (x) => x * x);
  plot.setLines([
    { kind: 'h', at: -kOverM, color: 'sp', label: t('need') },
    { kind: 'h', at: 0, color: 'ink3', dash: [2, 3], width: 1 },
  ]);
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const draw = () => {
    plot.setMarkers([{ x: a, y: a * a, color: 'out' }]);
    status.textContent = t('status', { a: fmt(a, 2), sq: fmt(a * a, 2), gap: fmt(a * a + kOverM, 2) });
  };
  const sl = slider({
    label: t('a'),
    min: -3,
    max: 3,
    step: 0.05,
    value: a,
    onInput: (v) => {
      a = v;
      draw();
    },
  });
  left.append(h('div', { class: 'w-controls' }, sl.el), status);
  right.append(h('p', { class: 'w-help' }, t('springCaption')));
  const view = new MsdView(right, t('springAria'), 55, false);
  let time = 0;
  const loop = new Loop((dt) => {
    time += dt;
    view.update(Math.cos(Math.sqrt(kOverM) * time), null);
  }, host);
  view.update(1, null);
  if (Loop.autoplay) loop.play();
  const btn = h('button', { class: 'btn small', type: 'button' });
  const syncBtn = (playing: boolean) => (btn.textContent = playing ? t('pauseSpring') : t('playSpring'));
  loop.onChange(syncBtn);
  syncBtn(loop.playing);
  btn.addEventListener('click', () => loop.toggle());
  right.append(h('div', { class: 'w-row', style: { justifyContent: 'center' } }, btn));
  draw();
  return () => loop.destroy();
};

export const widgets: Record<string, WidgetFactory> = { ladder, compound: compoundWidget, bases, expA, guess, square };
