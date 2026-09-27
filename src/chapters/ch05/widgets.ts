import { h, prefersReducedMotion } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { type C, abs, arg, c, mul } from '../../math/complex';
import type { WidgetFactory } from '../../story/types';
import { readout, slider, transport } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { type Item, type Pt, PlaneCanvas } from '../../ui/plane-canvas';
import '../ch03/polish.css';
import { spiralPoint, tinyTurns } from './models';

const fmtC = (z: C): string => {
  const re = Math.abs(z.re) < 1e-9 ? 0 : z.re;
  const im = Math.abs(z.im) < 1e-9 ? 0 : z.im;
  if (im === 0) return fmt(re, Number.isInteger(re) ? 0 : 2);
  const imTxt = `${Math.abs(im) === 1 ? '' : fmt(Math.abs(im), Number.isInteger(im) ? 0 : 2)}i`;
  if (re === 0) return `${im < 0 ? '−' : ''}${imTxt}`;
  return `${fmt(re, Number.isInteger(re) ? 0 : 2)} ${im < 0 ? '−' : '+'} ${imTxt}`;
};

/** 5a: multiplication as rotation; i is a quarter turn. */
const rotate: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let z = c(3);
  let history: string[] = ['3'];
  let anim = 0;
  const plane = new PlaneCanvas(host, { extent: 7, label: t('aria'), reLabel: t('re'), imLabel: t('im') });
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const hist = h('div', { class: 'trail', role: 'group', 'aria-label': t('trail') });
  const renderTrail = () =>
    hist.replaceChildren(
      ...history.flatMap((v, i) => [
        i ? h('span', { class: 'sep', 'aria-hidden': 'true' }, '→') : null,
        h('span', { class: 'chip' }, v),
      ]).filter(Boolean) as HTMLElement[],
    );
  const draw = (w: C, trail: Pt[] = []) => {
    plane.draw([
      { kind: 'circle', r: abs(w), color: 'ink3' },
      { kind: 'path', pts: trail, color: 'eff', width: 2, dash: [4, 4] },
      { kind: 'arrow', to: [w.re, w.im], color: 'out', width: 3.5, label: fmtC(w) },
    ]);
  };
  const apply = (k: C, key: string) => {
    cancelAnimationFrame(anim);
    const from = z;
    const to = mul(z, k);
    z = to;
    history.push(fmtC(to));
    if (history.length > 7) history = history.slice(-7);
    renderTrail();
    status.textContent = t(`explain.${key}`);
    const a0 = arg(from);
    let da = arg(k);
    if (key === 'neg') da = Math.PI;
    const r0 = abs(from);
    const r1 = abs(to);
    if (prefersReducedMotion()) {
      draw(to);
      return;
    }
    const start = performance.now();
    const trail: Pt[] = [];
    const step = (now: number) => {
      const f = Math.min(1, (now - start) / 650);
      // ease-in-out (0.77, 0, 0.175, 1)-like: decisive start, soft landing
      const e = f < 0.5 ? 4 * f * f * f : 1 - (-2 * f + 2) ** 3 / 2;
      const a = a0 + da * e;
      const r = r0 + (r1 - r0) * e;
      const w = c(r * Math.cos(a), r * Math.sin(a));
      trail.push([w.re, w.im]);
      draw(w, trail);
      if (f < 1) anim = requestAnimationFrame(step);
      else draw(to);
    };
    anim = requestAnimationFrame(step);
  };
  const btn = (label: string, k: C, key: string) => {
    const b = h('button', { class: 'btn small', type: 'button', dir: 'ltr' }, label);
    b.addEventListener('click', () => {
      if (abs(mul(z, k)) > 6.5 || abs(mul(z, k)) < 0.2) {
        status.textContent = t('tooBig');
        return;
      }
      apply(k, key);
    });
    return b;
  };
  const reset = h('button', { class: 'btn small', type: 'button' }, tc('transport.reset'));
  reset.addEventListener('click', () => {
    cancelAnimationFrame(anim);
    z = c(3);
    history = ['3'];
    renderTrail();
    status.textContent = t('start');
    draw(z);
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(
    h('div', { class: 'w-row', style: { justifyContent: 'center', marginTop: '12px' } }, btn('× 2', c(2), 'two'), btn('× ½', c(0.5), 'half'), btn('× (−1)', c(-1), 'neg'), btn('× i', c(0, 1), 'i'), reset),
    hist,
    status,
  );
  renderTrail();
  status.textContent = t('start');
  draw(z);
  return () => {
    cancelAnimationFrame(anim);
    plane.destroy();
  };
};

/** 5b: a spinner; its velocity is always a quarter turn from its position; its shadow is a cosine. */
const spinner: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let w = 1.5;
  let time = 0;
  const WIN = 10;
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  const plane = new PlaneCanvas(left, { extent: 1.6, label: t('aria'), reLabel: t('re'), imLabel: t('im') });
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: WIN },
    y: { label: t('shadowAxis'), min: -1.3, max: 1.3 },
    series: [{ id: 'sh', color: 'out', label: t('shadow'), ghost: true }],
    height: 220,
    label: t('plotAria'),
  }, ctx.onCleanup);
  const draw = () => {
    const z = spiralPoint(0, w, time);
    const vScale = 0.35;
    const items: Item[] = [
      { kind: 'circle', r: 1, color: 'ink3' },
      { kind: 'arrow', to: [z.re, z.im], color: 'out', width: 3, label: t('position') },
      { kind: 'arrow', from: [z.re, z.im], to: [z.re - z.im * w * vScale, z.im + z.re * w * vScale], color: 'ink', width: 2.5, label: t('velocity') },
      { kind: 'line', from: [z.re, z.im], to: [z.re, 0], color: 'ink3', dash: [3, 3], width: 1.2 },
      { kind: 'dot', at: [z.re, 0], color: 'out', r: 6 },
    ];
    plane.draw(items);
  };
  let filled = false;
  const loop = new Loop((dt) => {
    if (filled) {
      filled = false;
      time = 0;
      plot.clear(false);
    }
    time += dt;
    if (time > WIN) {
      time = 0;
      plot.clear();
    }
    plot.push('sh', time, Math.cos(w * time));
    draw();
  }, host);
  const reset = () => {
    loop.pause();
    time = 0;
    plot.clear();
    if (!Loop.autoplay) {
      plot.fn('sh', (x) => Math.cos(w * x));
      filled = true;
    }
    draw();
  };
  const sl = slider({
    label: t('omega'),
    min: 0.5,
    max: 3,
    step: 0.1,
    value: w,
    unit: 'rad/s',
    onInput: (v) => {
      w = v;
      time = 0;
      plot.clear();
      if (!loop.playing) {
        plot.fn('sh', (x) => Math.cos(w * x));
        filled = true;
      }
      draw();
    },
  });
  right.append(h('div', { class: 'w-controls' }, sl.el), transport({ loop, onReset: reset, onStep: () => ((time += 0.1), plot.push('sh', time, Math.cos(w * time)), draw()) }));
  host.append(h('p', { class: 'w-help' }, t('help')));
  reset();
  if (Loop.autoplay) {
    plot.clear(false);
    loop.play();
  }
  return () => {
    loop.destroy();
    plane.destroy();
  };
};

/** 5b′: measuring turns. A radian is the angle whose arc is one radius; cos and sin are the shadows. */
const turns: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let theta = 1;
  const TWO_PI = 2 * Math.PI;
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  const plane = new PlaneCanvas(left, { extent: 1.5, label: t('aria'), reLabel: t('re'), imLabel: t('im') });
  const plot = new Plot(right, {
    x: { label: t('thetaAxis'), min: 0, max: TWO_PI },
    y: { label: t('shadowAxis'), min: -1.2, max: 1.2 },
    series: [
      { id: 'cos', color: 'out', label: t('cos') },
      { id: 'sin', color: 'ink2', label: t('sin'), dash: [5, 4], width: 2 },
    ],
    height: 220,
    label: t('plotAria'),
  }, ctx.onCleanup);
  plot.setLines([
    { kind: 'v', at: Math.PI, color: 'ink3', dash: [3, 4], width: 1.2, label: 'π' },
    { kind: 'v', at: TWO_PI, color: 'ink3', dash: [3, 4], width: 1.2, label: '2π' },
  ]);
  const rRad = readout(t('readRad'), 'out');
  const rTurn = readout(t('readTurns'));
  const rDeg = readout(t('readDeg'));
  const rCos = readout(t('readCos'), 'out');
  const rSin = readout(t('readSin'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const say = () => {
    const near = (v: number) => Math.abs(theta - v) < 0.03;
    const key = near(1) ? 'oneRadian' : near(Math.PI) ? 'half' : near(TWO_PI) ? 'full' : 'any';
    const text = t(key, { r: fmt(theta, 2), d: fmt((theta * 180) / Math.PI, 0) });
    if (status.textContent !== text) status.textContent = text;
  };
  const draw = () => {
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    plane.draw([
      { kind: 'circle', r: 1, color: 'ink3' },
      // the arc's length in radii is in the readouts and the status line, clear of the arrow
      { kind: 'arc', r: 1, from: 0, to: theta, color: 'eff' },
      { kind: 'line', from: [x, y], to: [x, 0], color: 'out', dash: [3, 3], width: 1.4 },
      { kind: 'line', from: [x, y], to: [0, y], color: 'ink2', dash: [3, 3], width: 1.4 },
      { kind: 'dot', at: [x, 0], color: 'out', r: 5 },
      { kind: 'dot', at: [0, y], color: 'ink2', r: 5 },
      { kind: 'arrow', to: [x, y], color: 'ink', width: 3 },
    ]);
    const xs: number[] = [];
    for (let k = 0; k <= 200; k++) xs.push((theta * k) / 200);
    plot.set('cos', xs, xs.map(Math.cos));
    plot.set('sin', xs, xs.map(Math.sin));
    plot.setCursor(theta);
    rRad.set(fmt(theta, 2));
    rTurn.set(fmt(theta / TWO_PI, 2));
    rDeg.set(`${fmt((theta * 180) / Math.PI, 0)}°`);
    rCos.set(fmt(x, 2));
    rSin.set(fmt(y, 2));
    plot.describe(t('describe', { r: fmt(theta, 2), c: fmt(x, 2), s: fmt(y, 2) }));
  };
  const sl = slider({ label: t('theta'), min: 0, max: TWO_PI, step: 0.01, value: theta, format: (v) => `${fmt(v, 2)} ${t('radUnit')}`, onInput: (v) => ((theta = v), draw()), onSettle: say });
  right.append(h('div', { class: 'readouts' }, rRad.el, rTurn.el, rDeg.el, rCos.el, rSin.el), status);
  host.append(h('div', { class: 'w-controls' }, sl.el), h('p', { class: 'w-help' }, t('help')));
  draw();
  say();
  return () => plane.destroy();
};

/** 5b″: e^(iθ) built from n tiny sideways nudges, the Chapter 4 way. */
const tiny: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let n = 4;
  let theta = 2;
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  const plane = new PlaneCanvas(left, { extent: 2.3, label: t('aria'), reLabel: t('re'), imLabel: t('im') });
  const rLen = readout(t('readLen'), 'out');
  const rAng = readout(t('readAng'), 'out');
  const rGoal = readout(t('readGoal'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const say = () => {
    const z = tinyTurns(theta, n)[n];
    const text = t(n === 1 ? 'one' : 'many', { n: String(n), len: fmt(Math.hypot(z.re, z.im), 2), ang: fmt(Math.atan2(z.im, z.re), 2), th: fmt(theta, 2) });
    if (status.textContent !== text) status.textContent = text;
  };
  const draw = () => {
    const pts = tinyTurns(theta, n);
    const z = pts[n];
    plane.draw([
      { kind: 'circle', r: 1, color: 'ink3' },
      // the target sits on the rim; its short label goes inside the circle, clear of the path
      { kind: 'dot', at: [Math.cos(theta), Math.sin(theta)], color: 'sp', r: 7, ring: true, label: 'θ', labelAt: 'below' },
      { kind: 'path', pts: pts.map((p) => [p.re, p.im] as [number, number]), color: 'eff', width: 2 },
      ...pts.slice(1, -1).map((p) => ({ kind: 'dot' as const, at: [p.re, p.im] as [number, number], color: 'eff', r: n > 30 ? 1.5 : 3 })),
      { kind: 'arrow', to: [z.re, z.im], color: 'out', width: 3 },
    ]);
    rLen.set(fmt(Math.hypot(z.re, z.im), 2));
    rAng.set(`${fmt(Math.atan2(z.im, z.re), 2)} ${t('radUnit')}`);
    rGoal.set(`${fmt(theta, 2)} ${t('radUnit')}`);
  };
  const sN = slider({ label: t('n'), min: 1, max: 60, step: 1, value: n, onInput: (v) => ((n = v), draw()), onSettle: say });
  const sT = slider({ label: t('theta'), min: 0.2, max: 3, step: 0.1, value: theta, format: (v) => `${fmt(v, 1)} ${t('radUnit')}`, onInput: (v) => ((theta = v), draw()), onSettle: say });
  right.append(h('div', { class: 'readouts' }, rLen.el, rAng.el, rGoal.el), status);
  host.append(h('div', { class: 'w-controls' }, sN.el, sT.el), h('p', { class: 'w-help' }, t('help')));
  draw();
  say();
  return () => plane.destroy();
};

export const widgets: Record<string, WidgetFactory> = { rotate, turns, tiny, spinner };
