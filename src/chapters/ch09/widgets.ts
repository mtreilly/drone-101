import './ch09.css';
import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { DRONE } from '../../sim/drone-model';
import type { WidgetCtx, WidgetFactory } from '../../story/types';
import { readout, segmented, slider, toggle } from '../../ui/controls';
import { color, withAlpha } from '../../ui/colors';
import { Plot } from '../../ui/plot';
import { SPlane } from '../../ui/s-plane';
import { runUnderCeiling, watchCeiling } from './page-ceiling';
import { LIMITED, TARGETS, hoverStep, kiLimit, pid, pidPoles, runDrone, scoreTrace, stars, takeoff } from './pid-tools';
import { starRow } from './stars';
import { TracePlayer } from './trace-player';

/** controls row, then HUD (readouts left, transport right), then status and help */
function layout(host: HTMLElement, player: TracePlayer | null, parts: { controls: HTMLElement[]; readouts: HTMLElement[]; status: HTMLElement; help?: HTMLElement; extra?: HTMLElement[] }): void {
  host.classList.add('pid-widget');
  host.append(h('div', { class: `w-controls${parts.controls.length > 2 ? ' compact' : ''}` }, parts.controls));
  if (parts.extra) host.append(...parts.extra);
  host.append(h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, parts.readouts), player ? player.transportEl : null), parts.status);
  if (parts.help) host.append(parts.help);
}


const playerLabels = (_ctx?: WidgetCtx) => ({
  heightLabel: tc('drone.height'),
  thrustLabel: tc('drone.thrust'),
});

/** 9a: the integral term piles up past error until it holds the drone up by itself. */
const integral: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const KP = 20;
  let ki = 0;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const player = new TracePlayer(host, {
    ...playerLabels(ctx),
    duration: 12,
    gravityLabel: t('gravity'),
    extra: [{ id: 'iterm', color: 'eff', label: t('iterm'), dash: [3, 3], values: (tr) => tr.integral.map((v) => ki * v) }],
  });
  const rDroop = readout(t('readout.droop'), 'err');
  const rPile = readout(t('readout.pile'), 'eff');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = (preview = false) => {
    const tr = runDrone(takeoff(pid(KP, ki, 0)), 12);
    if (preview) player.show(tr);
    else player.load(tr);
    const end = tr.h[tr.h.length - 1];
    const droop = 2 - end;
    rDroop.set(`${fmt(droop * 100, 1)} cm`, Math.abs(droop) < 0.01 ? 'good' : '');
    rPile.set(`${fmt(ki * tr.integral[tr.integral.length - 1], 2)} N`);
    const lim = kiLimit(KP, 0);
    status.textContent = ki === 0 ? t('status.none') : ki >= lim ? t('status.unstable', { lim: fmt(lim, 0) }) : Math.abs(droop) < 0.01 ? t('status.gone') : t('status.slow');
    status.className = `w-status${ki >= lim ? ' bad' : Math.abs(droop) < 0.01 ? ' good' : ''}`;
    player.hPlot.describe(t('describe', { ki: fmt(ki, 0), droop: fmt(droop * 100, 1) }));
  };
  const sl = slider({ label: t('slider'), min: 0, max: 60, step: 1, value: ki, unit: 'N/(m·s)', color: 'eff', onInput: (v) => { ki = v; run(true); } });
  player.bind(sl.input);
  layout(host, player, { controls: [sl.el], readouts: [rDroop.el, rPile.el], status });
  run();
  return () => player.destroy();
};

/** 9b: the derivative term as a virtual damper. */
const damper: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const KP = 20;
  let kd = 0;
  let bigKi = false;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const player = new TracePlayer(host, { ...playerLabels(ctx), duration: 10 });
  const rDamp = readout(t('readout.damping'), 'eff');
  const rOs = readout(t('readout.overshoot'), 'out');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = (preview = false) => {
    const ki = bigKi ? 50 : 10;
    const tr = runDrone(takeoff(pid(KP, ki, kd)), 10);
    if (preview) player.show(tr);
    else player.load(tr);
    const s = scoreTrace(tr);
    rDamp.set(`${fmt(DRONE.c + kd, 1)} N·s/m`);
    rOs.set(`${fmt(s.overshoot, 0)} %`, s.overshoot < 5 ? 'good' : '');
    const stable = ki < kiLimit(KP, kd);
    status.textContent = !stable ? t('status.unstable') : s.overshoot < 5 ? t('status.calm') : t('status.bouncy');
    status.className = `w-status${!stable ? ' bad' : s.overshoot < 5 ? ' good' : ''}`;
  };
  const sl = slider({ label: t('slider'), min: 0, max: 10, step: 0.5, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { kd = v; run(true); } });
  player.bind(sl.input);
  const tg = toggle(t('bigKi'), bigKi, (v) => { bigKi = v; run(); });
  layout(host, player, { controls: [sl.el, tg.el], readouts: [rDamp.el, rOs.el], status });
  const off = ctx.bus.on('damper:mika', () => { tg.input.checked = true; bigKi = true; run(); });
  run();
  return () => {
    off();
    player.destroy();
  };
};

function clampPole(re: number, im: number, o: { reMin: number; reMax: number; imMax: number }): [number, number, boolean] {
  const cr = Math.max(o.reMin, Math.min(o.reMax, re));
  const ci = Math.max(-o.imMax, Math.min(o.imMax, im));
  return [cr, ci, cr !== re || ci !== im];
}

/** 9c: every gain moves the three closed-loop poles. */
const poles: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kp = 20;
  let ki = 10;
  let kd = 2;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const range = { reMin: -16, reMax: 4, imMax: 10 };
  const sp = new SPlane(left, { ...range, label: t('splane'), regions: true, maxWidth: 420, reLabel: t('reShort'), imLabel: t('imShort') });
  const trail: SVGCircleElement[] = [];
  const map = new Plot(right, {
    x: { label: t('map.x'), min: 0, max: 10 },
    y: { label: t('map.y'), min: 0, max: 200 },
    series: [{ id: 'edge', color: 'bad', label: t('map.edge'), dash: [6, 4] }],
    height: 200,
    label: t('map.aria'),
  });
  const step = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: 8 },
    y: { label: tc('plots.height'), min: 1.2, max: 2.8 },
    series: [
      { id: 'r', color: 'sp', dash: [6, 5], width: 1.8 },
      { id: 'h', color: 'out', label: tc('drone.height'), ghost: true },
    ],
    height: 170,
    label: t('stepAria'),
  });
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const update = () => {
    const ps = pidPoles(kp, ki, kd);
    const lim = kiLimit(kp, kd);
    const pts = ps.map((p, i) => {
      const [re, im, off] = clampPole(p.re, p.im, range);
      return { id: `p${i}`, re, im, kind: 'pole' as const, label: off ? t('offmap') : undefined };
    });
    // faint trail of where the poles have been
    for (const p of pts) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(sp.sx(p.re)));
      c.setAttribute('cy', String(sp.sy(p.im)));
      c.setAttribute('r', '2.5');
      c.setAttribute('fill', 'var(--ink-3)');
      c.setAttribute('opacity', '0.35');
      sp.deco.append(c);
      trail.push(c);
    }
    while (trail.length > 90) trail.shift()!.remove();
    sp.set(pts);
    sp.describe();
    map.fn('edge', (x) => ((DRONE.c + x) * kp) / DRONE.m);
    map.overlay = (c, px, py) => {
      const edge = (x: number) => py(Math.min(200, ((DRONE.c + x) * kp) / DRONE.m));
      // below the edge: stable (green tint); above: unstable (red tint)
      for (const [fill, top] of [[withAlpha(color('good'), 0.14), 0], [withAlpha(color('bad'), 0.12), 200]] as const) {
        c.fillStyle = fill;
        c.beginPath();
        c.moveTo(px(0), py(top));
        for (let x = 0; x <= 10; x += 0.25) c.lineTo(px(x), edge(x));
        c.lineTo(px(10), py(top));
        c.closePath();
        c.fill();
      }
    };
    map.setMarkers([{ x: kd, y: Math.min(ki, 200), color: ki < lim ? 'good' : 'bad', label: t('map.you') }]);
    step.clear();
    const tr = hoverStep(pid(kp, ki, kd), 1.5, 2, 8);
    step.set('h', tr.t, tr.h);
    step.set('r', tr.t, tr.r);
    const worst = Math.max(...ps.map((p) => p.re));
    status.textContent = ki >= lim ? t('status.unstable', { lim: fmt(lim, 0) }) : t('status.stable', { lim: fmt(lim, 0), s: fmt(worst, 2) });
    status.className = `w-status${ki >= lim ? ' bad' : ''}`;
    step.describe(status.textContent);
  };
  const sKp = slider({ label: t('kp'), min: 2, max: 40, step: 1, value: kp, unit: 'N/m', color: 'eff', onInput: (v) => { kp = v; update(); } });
  const sKi = slider({ label: t('ki'), min: 0, max: 200, step: 2, value: ki, unit: 'N/(m·s)', color: 'eff', onInput: (v) => { ki = v; update(); } });
  const sKd = slider({ label: t('kd'), min: 0, max: 10, step: 0.25, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { kd = v; update(); } });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls compact' }, sKp.el, sKi.el, sKd.el), status, h('p', { class: 'w-help' }, t('help')));
  update();
};

/** 9d: tuning playground with a scoreboard. */
const playground: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kp = 20;
  let ki = 0;
  let kd = 0;
  let aw = true;
  host.append(h('p', { class: 'w-title' }, t('title')));
  // windup can throw it out of its picture into the page above; the motors survive the bump (page-ceiling.ts)
  const player = new TracePlayer(host, { ...playerLabels(ctx), duration: 6, pageCeiling: true });
  const rOs = readout(t('readout.overshoot'), 'out');
  const rTs = readout(t('readout.settling'), 'out');
  const rSse = readout(t('readout.sse'), 'err');
  const rSat = readout(t('readout.saturated'), 'eff');
  const starsEl = h('p', { class: 'w-status score-line', 'aria-live': 'polite' });
  const row = starRow(4, (n) => t('starsAria', { n }));
  const starsText = h('span');
  starsEl.append(row.el, starsText);
  // metres of open page above the picture (null: none, or reduced motion); the trace already contains the hit
  let ceiling: number | null = null;
  let hitAt: number | null = null;
  let verdict = '';
  let hitLine = '';
  let hitShown: boolean | null = null;
  // the hit sentence (and a mark on the height plot) appear when the replay gets to the hit
  const showHit = (on: boolean) => {
    if (on === hitShown) return;
    hitShown = on;
    starsText.textContent = on ? `${verdict} ${hitLine}` : verdict;
    player.hPlot.setLines(on && hitAt !== null ? [{ kind: 'v', at: hitAt, color: 'ink3', dash: [2, 4], label: t('hit.mark') }] : []);
  };
  player.onFrame = (tt) => showHit(hitAt !== null && tt >= hitAt);
  const run = (preview = false) => {
    ceiling = player.view.ceilingHeight();
    const tr = runUnderCeiling(takeoff(pid(kp, ki, kd, { antiWindup: aw })), 15, ceiling);
    const s = scoreTrace(tr);
    const st = stars(s);
    rOs.set(`${fmt(s.overshoot, 1)} %`, st.overshoot ? 'good' : 'bad');
    rTs.set(Number.isFinite(s.settling) ? `${fmt(s.settling, 2)} s` : t('never'), st.settling ? 'good' : 'bad');
    rSse.set(`${fmt(s.sse * 100, 1)} cm`, st.sse ? 'good' : 'bad');
    rSat.set(`${fmt(s.saturated, 2)} s`, st.saturated ? 'good' : 'bad');
    const n = Object.values(st).filter(Boolean).length;
    row.set(Object.values(st));
    verdict = n === 4 ? t('allStars') : t('someStars', { n });
    // only a hit the replay shows (its first 6 s) gets a sentence
    hitAt = tr.hitAt !== null && tr.hitAt <= 6 ? tr.hitAt : null;
    hitLine = t(Number.isFinite(s.settling) ? 'hit.back' : 'hit.wild');
    hitShown = null;
    showHit(false);
    starsEl.className = `w-status score-line${n === 4 ? ' good' : ''}`;
    const show = { ...tr, t: tr.t.slice(0, 601), h: tr.h.slice(0, 601), thrust: tr.thrust.slice(0, 601), r: tr.r.slice(0, 601) };
    if (preview) player.show(show);
    else player.load(show);
  };
  const sKp = slider({ label: t('kp'), min: 0, max: 40, step: 1, value: kp, unit: 'N/m', color: 'eff', onInput: (v) => { kp = v; run(true); } });
  const sKi = slider({ label: t('ki'), min: 0, max: 60, step: 1, value: ki, unit: 'N/(m·s)', color: 'eff', onInput: (v) => { ki = v; run(true); } });
  const sKd = slider({ label: t('kd'), min: 0, max: 10, step: 0.5, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { kd = v; run(true); } });
  for (const sl of [sKp, sKi, sKd]) player.bind(sl.input);
  const tg = toggle(t('antiWindup'), aw, (v) => { aw = v; run(); });
  layout(host, player, {
    controls: [sKp.el, sKi.el, sKd.el],
    extra: [h('div', { class: 'w-row' }, tg.el)],
    readouts: [rOs.el, rTs.el, rSse.el, rSat.el],
    status: starsEl,
    help: h('p', { class: 'w-help' }, t('targets', { os: TARGETS.overshoot, ts: TARGETS.settling, sat: TARGETS.saturated })),
  });
  run();
  // the layout moved (resize, fonts, a gate opening): measure the page again and recompute the flight
  const unwatch = watchCeiling(player.view, () => ceiling, () => run());
  return () => {
    unwatch();
    player.destroy();
  };
};

/** 9e (i): derivative kick when the setpoint jumps. */
const kick: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let mode: 'error' | 'measurement' = 'error';
  host.append(h('p', { class: 'w-title' }, t('title')));
  const player = new TracePlayer(host, { ...playerLabels(ctx), duration: 5, heightRange: [0.5, 2.8] });
  const rPeak = readout(t('peak'), 'eff');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = () => {
    const tr = hoverStep(pid(15, 8, 4, { dTau: 0.01, dOnMeasurement: mode === 'measurement' }), 1, 2, 5);
    player.load(tr);
    const peak = Math.max(...tr.thrust);
    rPeak.set(`${fmt(peak, 1)} N`, peak >= LIMITED.tMax - 1e-6 ? 'bad' : 'good');
    status.textContent = t(`status.${mode}`);
  };
  const seg = segmented(t('mode'), [
    { value: 'error', label: t('onError') },
    { value: 'measurement', label: t('onMeasurement') },
  ], mode, (v) => { mode = v; run(); });
  layout(host, player, { controls: [seg.el], readouts: [rPeak.el], status });
  run();
  return () => player.destroy();
};

/** thrust jitter (N) above which we call the motors "chattering" */
export const NOISY = 1.5;

/** 9e (ii): sensor noise gets amplified by the derivative. */
const noise: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let on = true;
  let tau = 0.005;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const player = new TracePlayer(host, { ...playerLabels(ctx), duration: 5, heightRange: [1, 2.6], showMeasured: true, measuredLabel: t('measured') });
  const rJit = readout(t('jitter'), 'eff');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = (preview = false) => {
    const tr = hoverStep(pid(15, 8, 4, { dTau: tau }), 2, 2, 5, on ? 0.02 : 0);
    if (preview) player.show(tr);
    else player.load(tr);
    const xs = tr.thrust.slice(50);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    rJit.set(`± ${fmt(sd, 2)} N`, sd < NOISY ? 'good' : 'bad');
    status.textContent = !on ? t('status.off') : sd >= NOISY ? t('status.chatter') : t('status.calm');
    status.className = `w-status${on && sd >= NOISY ? ' bad' : ''}`;
  };
  const tg = toggle(t('toggle'), on, (v) => { on = v; run(); });
  const sl = slider({ label: t('filter'), min: 0.005, max: 0.2, step: 0.005, value: tau, unit: 's', digits: 3, color: 'eff', onInput: (v) => { tau = v; run(true); } });
  player.bind(sl.input);
  layout(host, player, { controls: [sl.el, tg.el], readouts: [rJit.el], status });
  run();
  return () => player.destroy();
};

export const widgets: Record<string, WidgetFactory> = { integral, damper, poles, playground, kick, noise };
