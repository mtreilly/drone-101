import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { c } from '../../math/complex';
import type { WidgetFactory } from '../../story/types';
import { readout, slider, toggle, transport } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { SPlane } from '../../ui/s-plane';
import { type Item, PlaneCanvas } from '../../ui/plane-canvas';
import { SpiralCanvas } from './canvases';
import '../ch03/polish.css';
import { shadow, spiralDuration, spiralPoint, squareWave, squareWavePartial } from '../ch05/models';

/** 6a: a spinner plus its mirror twin always lands on the real axis. */
const twins: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const w = 1.2;
  let time = 0;
  let twin = false;
  const WIN = 10;
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  const plane = new PlaneCanvas(left, { extent: 2.3, label: t('aria'), reLabel: t('re'), imLabel: t('im') });
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: WIN },
    y: { label: t('axis'), min: -2.3, max: 2.3 },
    series: [
      { id: 're', color: 'out', label: t('realPart') },
      { id: 'im', color: 'ink2', label: t('sidePart'), dash: [5, 4], width: 2 },
    ],
    height: 220,
    label: t('plotAria'),
  }, ctx.onCleanup);
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const draw = () => {
    const a = spiralPoint(0, w, time);
    const b = spiralPoint(0, -w, time);
    const items: Item[] = [
      { kind: 'circle', r: 1, color: 'ink3' },
      { kind: 'arrow', to: [a.re, a.im], color: 'out', width: 3, label: t('spinnerLabel') },
    ];
    const sum = twin ? c(a.re + b.re, a.im + b.im) : a;
    if (twin) items.push({ kind: 'arrow', from: [a.re, a.im], to: [sum.re, sum.im], color: 'eff', width: 3, label: t('twinLabel') });
    // alone, the sum *is* the spinner tip, so only label it once the twin joins
    items.push({ kind: 'dot', at: [sum.re, sum.im], color: 'ink', r: 6, ring: true, label: twin ? t('sum') : undefined, labelAt: 'below' });
    plane.draw(items);
    const msg = twin ? t('withTwin') : t('alone');
    if (status.textContent !== msg) status.textContent = msg;
  };
  const sample = () => {
    const a = spiralPoint(0, w, time);
    const b = spiralPoint(0, -w, time);
    const sum = twin ? c(a.re + b.re, a.im + b.im) : a;
    plot.push('re', time, sum.re);
    plot.push('im', time, sum.im);
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
      plot.clear(false);
    }
    sample();
    draw();
  }, host);
  const fill = () => {
    plot.clear(false);
    for (let k = 0; k <= 400; k++) {
      const tt = (k / 400) * WIN;
      const a = spiralPoint(0, w, tt);
      const b = spiralPoint(0, -w, tt);
      plot.push('re', tt, twin ? a.re + b.re : a.re);
      plot.push('im', tt, twin ? a.im + b.im : a.im);
    }
    filled = true;
  };
  const tg = toggle(t('toggle'), false, (v) => {
    twin = v;
    time = 0;
    plot.clear(false);
    if (!loop.playing) fill();
    draw();
  });
  right.append(tg.el, transport({ loop, onReset: () => (loop.pause(), (time = 0), fill(), draw()), onStep: () => ((time += 0.1), sample(), draw()) }), status);
  if (Loop.autoplay) loop.play();
  else fill();
  draw();
  return () => {
    loop.destroy();
    plane.destroy();
  };
};

/** 6b: the map of s. Drag s, watch e^(st) spiral and its shadow. */
const smap: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let sigma = -0.3;
  let omega = 2;
  let mirror = false;
  let time = 0;
  const grid = h('div', { class: 'smap-grid' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  // a wide, short map so it fits beside (or just above) the spiral on a phone
  const plane = new SPlane(left, {
    reMin: -4,
    reMax: 1.5,
    imMax: 3.2,
    label: t('mapAria'),
    reLabel: t('re'),
    imLabel: t('im'),
    regions: false,
    step: 0.1,
    onChange: (p) => {
      sigma = Math.round(p.re * 100) / 100;
      omega = Math.round(p.im * 100) / 100;
      restart();
    },
  }, ctx.onCleanup);
  const spiral = new SpiralCanvas(right, { aria: t('spiralAria'), time: t('time'), re: t('reShort'), im: t('imShort'), shadow: t('shadow') });
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: 8 },
    y: { label: t('shadowAxis'), min: -3, max: 3 },
    series: [{ id: 'sh', color: 'out', label: t('shadow'), ghost: true }],
    height: 170,
    label: t('plotAria'),
  }, ctx.onCleanup);
  const rS = readout(t('readS'));
  const rTurns = readout(t('readTurns'));
  const rSize = readout(t('readSize'));
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const place = (rebuild = false) => {
    // the twin marker is created with the point, so rebuild it when the mirror toggles
    if (rebuild) plane.set([]);
    plane.set([{ id: 's', re: sigma, im: omega, kind: 'point', color: 'output', draggable: true, label: 's', mirror }]);
  };

  const curves = (upTo: number) => {
    const n = 300;
    const main: [number, number, number][] = [];
    const twinPts: [number, number, number][] = [];
    const wall: [number, number, number][] = [];
    for (let k = 0; k <= n; k++) {
      const tt = (k / n) * upTo;
      const z = spiralPoint(sigma, omega, tt);
      main.push([tt, z.re, z.im]);
      twinPts.push([tt, z.re, -z.im]);
      wall.push([tt, z.re, 0]);
    }
    const list = [
      { pts: wall, color: 'out', width: 2.2, alpha: 0.9 },
      { pts: main, color: 'ink', width: 2 },
    ];
    if (mirror) list.push({ pts: twinPts, color: 'eff', width: 1.6, alpha: 0.7 });
    return list;
  };
  const tMaxFor = () => spiralDuration(sigma);
  const drawAll = (upTo: number, dot: boolean) => {
    const z = spiralPoint(sigma, omega, upTo);
    spiral.draw(curves(upTo), 8, dot ? [upTo, z.re, z.im] : undefined);
  };
  const describe = () => {
    const turns = Math.abs(omega) / (2 * Math.PI);
    rS.set(`${fmt(sigma, 2)} ${omega < 0 ? '−' : '+'} ${fmt(Math.abs(omega), 2)}i`);
    rTurns.set(`${fmt(turns, 2)} /s`);
    rSize.set(`× ${fmt(Math.exp(sigma), 2)} /s`);
    const grow = sigma > 0.02 ? t('grows') : sigma < -0.02 ? t('shrinks') : t('steady');
    const spin = Math.abs(omega) < 0.02 ? t('noSpin') : t('spins', { n: fmt(turns, 2) });
    const text = `${spin} ${grow}`;
    if (status.textContent !== text) status.textContent = text;
    plot.describe(text);
  };
  const restart = () => {
    time = 0;
    plot.clear();
    const T = tMaxFor();
    if (!loop.playing) {
      plot.fn('sh', (x) => (x <= T ? shadow(sigma, omega, x) : NaN));
      filled = true;
      drawAll(T, false);
    }
    describe();
  };
  let filled = false;
  const loop = new Loop((dt) => {
    const T = tMaxFor();
    if (filled) {
      filled = false;
      time = 0;
      plot.clear(false);
    }
    time += dt;
    if (time > T) {
      time = 0;
      plot.clear(false);
    }
    plot.push('sh', time, shadow(sigma, omega, time));
    drawAll(time, true);
  }, host);
  const tg = toggle(t('mirror'), false, (v) => {
    mirror = v;
    place(true);
    if (!loop.playing) drawAll(tMaxFor(), false);
  });
  left.append(h('div', { style: { marginTop: '8px' } }, tg.el));
  host.append(
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rS.el, rTurns.el, rSize.el), transport({ loop, onReset: () => (loop.pause(), restart()), onStep: () => ((time += 0.1), plot.push('sh', time, shadow(sigma, omega, time)), drawAll(time, true)) })),
    status,
    h('p', { class: 'w-help' }, t('help')),
  );
  place();
  const off = ctx.bus.on('predict:ch5-shadow', () => {
    sigma = -0.5;
    omega = 3;
    place();
    restart();
    if (Loop.autoplay) loop.play();
  });
  restart();
  if (Loop.autoplay) loop.play();
  return () => {
    off();
    loop.destroy();
    spiral.destroy();
  };
};

/** 6c: adding spinning pieces builds a square wave. */
const fourier: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let n = 1;
  const plot = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: 4 * Math.PI },
    y: { label: t('axis'), min: -1.5, max: 1.5 },
    series: [
      { id: 'target', color: 'sp', label: t('target'), dash: [6, 5], width: 2 },
      { id: 'sum', color: 'out', label: t('sum'), ghost: true },
    ],
    height: 220,
    label: t('aria'),
  }, ctx.onCleanup);
  plot.fn('target', squareWave, 800);
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const draw = () => {
    plot.fn('sum', (x) => squareWavePartial(x, n), 800);
    status.textContent = n === 1 ? t('statusOne') : t('status', { n, f: 2 * n - 1 });
    plot.describe(status.textContent);
  };
  const sl = slider({
    label: t('pieces'),
    min: 1,
    max: 30,
    step: 1,
    value: n,
    onInput: (v) => {
      n = v;
      draw();
    },
  });
  sl.input.addEventListener('change', () => {
    plot.clear();
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(h('div', { class: 'w-controls' }, sl.el), status);
  draw();
};

export const widgets: Record<string, WidgetFactory> = { twins, smap, fourier };
