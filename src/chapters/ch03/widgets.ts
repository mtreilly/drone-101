import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import type { WidgetFactory } from '../../story/types';
import { color, withAlpha } from '../../ui/colors';
import { readout, segmented, slider, toggle, transport } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { COFFEE, coffeeExact, coffeeStep, cumulativeArea, droneRun, slopeOf, tankExact } from './models';
import { dragX, nearest } from './plot-drag';

const range = (ys: number[], pad = 0.15): [number, number] => {
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const p = (hi - lo) * pad;
  return [lo - p, hi + p];
};

/** 3a: slope of the height curve = speed, traced point by point with a tangent line. */
const tangent: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const run = droneRun(4);
  const T = run.t[run.t.length - 1];
  const iPeak = run.h.indexOf(Math.max(...run.h));
  const top = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: T },
    y: { label: tc('plots.height'), min: 0, max: 3.2 },
    series: [{ id: 'h', color: 'out', label: t('height') }],
    height: 210,
    label: t('ariaTop'),
  }, ctx.onCleanup);
  top.set('h', run.t, run.h);
  top.setLines([{ kind: 'h', at: 2, color: 'sp', label: t('target') }]);
  top.setMarkers([{ x: run.t[iPeak], y: run.h[iPeak], color: 'ink2', shape: 'ring', label: t('peak') }]);
  const [vlo, vhi] = range(run.v);
  const bottom = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: T },
    y: { label: t('speedAxis'), min: vlo, max: vhi },
    series: [{ id: 'v', color: 'ink', label: t('speed'), width: 2.4 }],
    height: 180,
    label: t('ariaBottom'),
  }, ctx.onCleanup);
  bottom.setLines([{ kind: 'h', at: 0, color: 'ink3', dash: [2, 3], width: 1 }]);
  const traced: boolean[] = Array.from({ length: run.t.length }, () => false);
  let lastIdx = 0;
  let cursor = 0;
  const rSlope = readout(t('readSlope'));
  const rHeight = readout(t('readHeight'), 'out');
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });

  const drawTraced = () => {
    bottom.set(
      'v',
      run.t,
      run.v.map((v, i) => (traced[i] ? v : NaN)),
    );
  };
  const setCursor = (x: number, fromSlider = false) => {
    cursor = x;
    const i = nearest(run.t, x);
    const [a, b] = i > lastIdx ? [lastIdx, i] : [i, lastIdx];
    for (let k = a; k <= b; k++) traced[k] = true;
    lastIdx = i;
    const hh = run.h[i];
    const v = run.v[i];
    top.overlay = (c, px, py) => {
      const w = 0.7;
      c.strokeStyle = color('ink');
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px(run.t[i] - w), py(hh - v * w));
      c.lineTo(px(run.t[i] + w), py(hh + v * w));
      c.stroke();
      c.fillStyle = color('out');
      c.beginPath();
      c.arc(px(run.t[i]), py(hh), 5, 0, Math.PI * 2);
      c.fill();
    };
    top.setCursor(run.t[i]);
    bottom.setCursor(run.t[i]);
    bottom.setMarkers([{ x: run.t[i], y: v, color: 'ink', label: `${fmt(v, 2)} m/s` }]);
    top.invalidate();
    drawTraced();
    rSlope.set(`${fmt(v, 2)} m/s`);
    rHeight.set(`${fmt(hh, 2)} m`);
    const msg = Math.abs(v) < 0.3 ? (i > 20 ? t('flat') : t('atStart')) : v > 0 ? t('rising') : t('falling');
    if (status.textContent !== msg) status.textContent = msg;
    if (!fromSlider) sl.value = run.t[i];
    top.describe(t('describe', { t: fmt(run.t[i], 2), h: fmt(hh, 2), v: fmt(v, 2) }));
  };
  const sl = slider({ label: t('cursor'), min: 0, max: T, step: 0.01, value: 0, unit: 's', onInput: (v) => setCursor(v, true) });
  dragX(top, setCursor);
  dragX(bottom, setCursor);
  const loop = new Loop((dt) => {
    const nx = Math.min(T, cursor + dt * 0.8);
    setCursor(nx);
    if (nx >= T) loop.pause();
  }, host);
  const sweep = h('button', { class: 'btn small primary', type: 'button' }, t('sweep'));
  loop.onChange((playing) => (sweep.textContent = playing ? t('pause') : t('sweep')));
  sweep.addEventListener('click', () => {
    if (!loop.playing && cursor >= T - 0.01) setCursor(0);
    loop.toggle();
  });
  const clear = h('button', { class: 'btn small', type: 'button' }, t('clear'));
  clear.addEventListener('click', () => {
    loop.pause();
    traced.fill(false);
    lastIdx = 0;
    setCursor(0);
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(
    h('div', { class: 'w-controls' }, sl.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rHeight.el, rSlope.el), h('div', { class: 'w-row' }, sweep, clear)),
    status,
    h('p', { class: 'w-help' }, t('help')),
  );
  setCursor(0);
  return () => loop.destroy();
};

/** 3b: build the coffee curve by hand with steps of size Δt. */
const coffee: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const tau = COFFEE.tau;
  let dt = 5;
  let pts: { t: number; T: number }[] = [{ t: 0, T: COFFEE.start }];
  const plot = new Plot(host, {
    x: { label: t('timeAxis'), min: 0, max: 120 },
    y: { label: tc('plots.temp'), min: -60, max: 130 },
    series: [
      { id: 'exact', color: 'out', label: t('exact'), width: 2 },
      { id: 'hand', color: 'pencil', label: t('hand'), width: 2.2, ghost: true },
      { id: 'dots', color: 'pencil', dots: true },
    ],
    height: 260,
    label: t('aria'),
  }, ctx.onCleanup);
  plot.setLines([{ kind: 'h', at: COFFEE.room, color: 'sp', label: t('room') }]);
  let showExact = false;
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const b1 = h('button', { class: 'btn primary small', type: 'button' }, t('step1'));
  const b10 = h('button', { class: 'btn small', type: 'button' }, t('step10'));
  const bAll = h('button', { class: 'btn small', type: 'button' }, t('stepAll'));
  const bR = h('button', { class: 'btn small', type: 'button' }, t('restart'));
  const draw = () => {
    plot.set(
      'hand',
      pts.map((p) => p.t),
      pts.map((p) => p.T),
    );
    plot.set(
      'dots',
      pts.map((p) => p.t),
      pts.map((p) => p.T),
    );
    if (showExact) plot.fn('exact', (x) => coffeeExact(x));
    else plot.set('exact', [], []);
    const cur = pts[pts.length - 1];
    const slope = -(cur.T - COFFEE.room) / tau;
    plot.overlay = (c, px, py) => {
      // preview of the next step: follow the current slope for Δt
      c.strokeStyle = color('eff');
      c.lineWidth = 2;
      c.setLineDash([5, 4]);
      c.beginPath();
      c.moveTo(px(cur.t), py(cur.T));
      c.lineTo(px(cur.t + dt), py(cur.T + slope * dt));
      c.stroke();
      c.setLineDash([]);
    };
    plot.invalidate();
    const n = pts.length - 1;
    const prevGap = n > 0 ? Math.abs(pts[n - 1].T - COFFEE.room) : Infinity;
    const gap = Math.abs(cur.T - COFFEE.room);
    let msg = n === 0 ? t('status.start', { r: fmt(slope, 1) }) : t('status.step', { n, t: fmt(cur.t, 1), T: fmt(cur.T, 1), r: fmt(slope, 1) });
    let cls = 'w-status';
    const dipped = pts.some((p) => p.T < COFFEE.room - 0.5);
    if (dipped && cur.T >= COFFEE.room - 0.5) msg += ` ${t('status.dipped')}`;
    if (cur.T < COFFEE.room - 0.5) {
      msg = t('status.frozen', { T: fmt(cur.T, 1) });
      cls += ' bad';
    }
    if (dipped && gap > prevGap) {
      msg += ` ${t('status.growing')}`;
      cls = 'w-status bad';
    }
    status.textContent = msg;
    status.className = `${cls} steady`;
    plot.describe(msg);
    const full = cur.t + dt > 120 + 1e-9;
    [b1, b10, bAll].forEach((b) => (b.disabled = full));
  };
  const step = (k = 1) => {
    for (let i = 0; i < k; i++) {
      const cur = pts[pts.length - 1];
      if (cur.t + dt > 120 + 1e-9) break;
      pts.push({ t: cur.t + dt, T: coffeeStep(cur.T, dt, tau) });
    }
    draw();
  };
  const restart = () => {
    plot.clear();
    pts = [{ t: 0, T: COFFEE.start }];
    draw();
  };
  const sl = slider({
    label: t('dt'),
    min: 0.5,
    max: 25,
    step: 0.5,
    value: dt,
    unit: 'min',
    color: 'eff',
    hint: t('dtHint'),
    onInput: (v) => {
      dt = v;
      restart();
    },
  });
  b1.addEventListener('click', () => step(1));
  b10.addEventListener('click', () => step(10));
  bAll.addEventListener('click', () => step(1000));
  bR.addEventListener('click', restart);
  const tg = toggle(t('showExact'), false, (v) => {
    showExact = v;
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(h('div', { class: 'w-controls' }, sl.el, tg.el), h('div', { class: 'w-row', style: { marginTop: '14px' } }, b1, b10, bAll, bR), status, h('p', { class: 'w-help' }, t('help')));
  draw();
};

/** 3b: the time constant as a ruler, for coffee and for a filling tank. */
const ruler: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kind: 'coffee' | 'tank' = 'coffee';
  let tau = 10;
  const plot = new Plot(host, {
    x: { label: t('timeAxis'), min: 0, max: 60 },
    y: { label: tc('plots.temp'), min: 0, max: 100 },
    series: [
      // τ, picture first: the starting speed kept up reaches the end in exactly one τ
      { id: 'start', color: 'ink2', label: t('startLine'), dash: [6, 4], width: 1.6 },
      { id: 'y', color: 'out', label: t('curve'), ghost: true },
    ],
    height: 240,
    label: t('aria'),
  }, ctx.onCleanup);
  const r63 = readout(t('read1'), 'out');
  const r86 = readout(t('read2'), 'out');
  const draw = () => {
    const coffeeMode = kind === 'coffee';
    const f = coffeeMode ? (x: number) => coffeeExact(x, tau) : (x: number) => tankExact(x, tau);
    const end = coffeeMode ? COFFEE.room : 1.2;
    plot.opts.y.label = coffeeMode ? tc('plots.temp') : t('levelAxis');
    if (coffeeMode) plot.setY(0, 100);
    else plot.setY(0, 1.4);
    plot.fn('y', f);
    plot.set('start', [0, tau], [f(0), end]);
    plot.setLines([
      { kind: 'h', at: end, color: 'sp', label: coffeeMode ? t('room') : t('full') },
      ...[1, 2, 3].map((k) => ({ kind: 'v' as const, at: k * tau, color: 'ink3', dash: [3, 4], width: 1.2, label: `${k}τ` })),
    ]);
    const pct = [63, 86, 95];
    plot.setMarkers([1, 2, 3].filter((k) => k * tau <= 60).map((k) => ({ x: k * tau, y: f(k * tau), color: 'out', label: `${pct[k - 1]}%` })));
    const unit = coffeeMode ? '°C' : 'm';
    r63.set(`${fmt(f(tau), coffeeMode ? 1 : 2)} ${unit}`);
    r86.set(`${fmt(f(2 * tau), coffeeMode ? 1 : 2)} ${unit}`);
    plot.describe(t('describe', { tau: fmt(tau, 1) }));
  };
  const seg = segmented(
    t('which'),
    [
      { value: 'coffee', label: t('coffee') },
      { value: 'tank', label: t('tank') },
    ],
    kind,
    (v) => {
      kind = v;
      plot.clearGhosts();
      draw();
    },
  );
  const sl = slider({
    label: t('tau'),
    min: 2,
    max: 20,
    step: 0.5,
    value: tau,
    unit: 'min',
    onInput: (v) => {
      tau = v;
      draw();
    },
  });
  sl.input.addEventListener('change', () => {
    plot.clear();
    draw();
  });
  host.prepend(h('p', { class: 'w-title' }, t('title')), seg.el);
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, r63.el, r86.el)));
  draw();
};

/** 3c: accumulating area under the speed curve rebuilds the height curve. */
const area: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const run = droneRun(4);
  const T = run.t[run.t.length - 1];
  const acc = cumulativeArea(run.t, run.v);
  const [vlo, vhi] = range(run.v);
  const top = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: T },
    y: { label: t('speedAxis'), min: vlo, max: vhi },
    series: [{ id: 'v', color: 'ink', label: t('speed') }],
    height: 190,
    label: t('ariaTop'),
  }, ctx.onCleanup);
  top.set('v', run.t, run.v);
  top.setLines([{ kind: 'h', at: 0, color: 'ink3', dash: [2, 3], width: 1 }]);
  const bottom = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: T },
    y: { label: tc('plots.height'), min: 0, max: 3.2 },
    series: [
      { id: 'true', color: 'ink3', label: t('trueHeight'), dash: [4, 4], width: 1.4 },
      { id: 'acc', color: 'out', label: t('accHeight') },
    ],
    height: 190,
    label: t('ariaBottom'),
  }, ctx.onCleanup);
  bottom.set('true', run.t, run.h);
  let cursor = 0;
  const rA = readout(t('readArea'), 'out');
  const status = h('p', { class: 'w-status steady', 'aria-live': 'polite' });
  const setCursor = (x: number, fromSlider = false) => {
    cursor = x;
    const i = nearest(run.t, x);
    top.overlay = (c, px, py) => {
      const blue = color('out');
      const grey = color('ink3');
      for (let k = 1; k <= i; k++) {
        const v = 0.5 * (run.v[k] + run.v[k - 1]);
        c.fillStyle = v >= 0 ? withAlpha(blue.startsWith('#') ? blue : '#1f5fbf', 0.3) : withAlpha(grey.startsWith('#') ? grey : '#7c746a', 0.35);
        const x0 = px(run.t[k - 1]);
        const x1 = px(run.t[k]);
        c.fillRect(x0, Math.min(py(0), py(v)), x1 - x0 + 0.5, Math.abs(py(v) - py(0)));
      }
    };
    top.setCursor(run.t[i]);
    top.invalidate();
    bottom.set('acc', run.t.slice(0, i + 1), acc.slice(0, i + 1));
    bottom.setCursor(run.t[i]);
    rA.set(`${fmt(acc[i], 2)} m`);
    const msg = run.v[i] < 0 ? t('negative') : i > 0 ? t('positive') : t('start');
    if (status.textContent !== msg) status.textContent = msg;
    if (!fromSlider) sl.value = run.t[i];
    bottom.describe(t('describe', { t: fmt(run.t[i], 2), a: fmt(acc[i], 2) }));
  };
  const sl = slider({ label: t('cursor'), min: 0, max: T, step: 0.01, value: 0, unit: 's', onInput: (v) => setCursor(v, true) });
  dragX(top, setCursor);
  const loop = new Loop((dt) => {
    const nx = Math.min(T, cursor + dt * 0.8);
    setCursor(nx);
    if (nx >= T) loop.pause();
  }, host);
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(
    h('div', { class: 'w-controls' }, sl.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rA.el), transport({ loop, onReset: () => (loop.pause(), setCursor(0)), onStep: () => setCursor(Math.min(T, cursor + 0.1)) })),
    status,
    h('p', { class: 'w-help' }, t('help')),
  );
  setCursor(0);
  return () => loop.destroy();
};

/** 3d: the slope of the slope. Height, speed and acceleration share one time cursor. */
const slopes: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const run = droneRun(4);
  const acc = slopeOf(run.t, run.v);
  const T = run.t[run.t.length - 1];
  const make = (label: string, ys: number[], color: string, name: string, aria: string, height: number) => {
    const [lo, hi] = range(ys);
    const p = new Plot(host, {
      x: { label: tc('plots.time'), min: 0, max: T },
      y: { label, min: lo, max: hi },
      series: [{ id: 'y', color, label: name, width: 2.4 }],
      height,
      label: aria,
    }, ctx.onCleanup);
    p.set('y', run.t, ys);
    return p;
  };
  host.append(h('p', { class: 'w-title' }, t('title')));
  const pH = make(tc('plots.height'), run.h, 'out', t('height'), t('ariaH'), 170);
  pH.setLines([{ kind: 'h', at: 2, color: 'sp', label: t('target') }]);
  const pV = make(t('speedAxis'), run.v, 'ink', t('speed'), t('ariaV'), 150);
  const pA = make(t('accAxis'), acc, 'ink2', t('acc'), t('ariaA'), 150);
  for (const p of [pV, pA]) p.setLines([{ kind: 'h', at: 0, color: 'ink3', dash: [2, 3], width: 1 }]);
  const rH = readout(t('readH'), 'out');
  const rV = readout(t('readV'));
  const rA = readout(t('readA'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  let cursor = 0;
  const tangentOn = (p: Plot, ys: number[], slopes: number[], i: number, col: string) => {
    p.overlay = (c, px, py) => {
      const w = 0.6;
      c.strokeStyle = color('ink');
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px(run.t[i] - w), py(ys[i] - slopes[i] * w));
      c.lineTo(px(run.t[i] + w), py(ys[i] + slopes[i] * w));
      c.stroke();
      c.fillStyle = color(col);
      c.beginPath();
      c.arc(px(run.t[i]), py(ys[i]), 5, 0, Math.PI * 2);
      c.fill();
    };
    p.invalidate();
  };
  const setCursor = (x: number, fromSlider = false) => {
    cursor = x;
    const i = nearest(run.t, x);
    const [hh, v, a] = [run.h[i], run.v[i], acc[i]];
    tangentOn(pH, run.h, run.v, i, 'out');
    tangentOn(pV, run.v, acc, i, 'ink');
    for (const p of [pH, pV, pA]) p.setCursor(run.t[i]);
    pA.setMarkers([{ x: run.t[i], y: a, color: 'ink2', label: `${fmt(a, 1)} m/s²` }]);
    rH.set(`${fmt(hh, 2)} m`);
    rV.set(`${fmt(v, 2)} m/s`);
    rA.set(`${fmt(a, 1)} m/s²`);
    const key = Math.abs(v) < 0.3 && i > 20 ? 'top' : a > 0.5 ? 'up' : a < -0.5 ? 'down' : 'steady';
    const msg = t(key, { a: fmt(a, 1) });
    if (status.textContent !== msg) status.textContent = msg;
    if (!fromSlider) sl.value = run.t[i];
    pH.describe(t('describe', { t: fmt(run.t[i], 2), h: fmt(hh, 2), v: fmt(v, 2), a: fmt(a, 1) }));
  };
  const sl = slider({ label: t('cursor'), min: 0, max: T, step: 0.01, value: 0, unit: 's', onInput: (v) => setCursor(v, true) });
  for (const p of [pH, pV, pA]) dragX(p, setCursor);
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rH.el, rV.el, rA.el)), status, h('p', { class: 'w-help' }, t('help')));
  setCursor(cursor);
};

export const widgets: Record<string, WidgetFactory> = { tangent, coffee, ruler, area, slopes };
