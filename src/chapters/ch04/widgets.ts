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
import { BASES, coffeeGuess, measuredSlope } from './models';

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

export const widgets: Record<string, WidgetFactory> = { bases, expA, guess, square };
