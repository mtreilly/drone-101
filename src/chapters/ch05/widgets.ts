import { h, prefersReducedMotion } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { type C, abs, arg, c, mul } from '../../math/complex';
import type { WidgetFactory } from '../../story/types';
import { readout, slider, toggle, transport } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { SPlane } from '../../ui/s-plane';
import { type Item, type Pt, PlaneCanvas, SpiralCanvas } from './canvases';
import '../ch03/polish.css';
import { shadow, spiralDuration, spiralPoint, squareWave, squareWavePartial } from './models';

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
  });
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

/** 5c: a spinner plus its mirror twin always lands on the real axis. */
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
  });
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

/** 5d: the map of s. Drag s, watch e^(st) spiral and its shadow. */
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
  });
  const spiral = new SpiralCanvas(right, { aria: t('spiralAria'), time: t('time'), re: t('reShort'), im: t('imShort'), shadow: t('shadow') });
  const plot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: 8 },
    y: { label: t('shadowAxis'), min: -3, max: 3 },
    series: [{ id: 'sh', color: 'out', label: t('shadow'), ghost: true }],
    height: 170,
    label: t('plotAria'),
  });
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

/** 5e: adding spinning pieces builds a square wave. */
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
  });
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

export const widgets: Record<string, WidgetFactory> = { rotate, spinner, twins, smap, fourier };
