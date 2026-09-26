import './ch09.css';
import { h } from '../../core/dom';
import { setRich } from '../../core/rich-text';
import { fmt, tc } from '../../core/i18n';
import { DRONE } from '../../sim/drone-model';
import type { WidgetCtx, WidgetFactory } from '../../story/types';
import { readout, segmented, slider, toggle } from '../../ui/controls';
import { color, withAlpha } from '../../ui/colors';
import { Plot } from '../../ui/plot';
import { SPlane, type SPoint } from '../../ui/s-plane';
import { followPlay } from '../../story/play';
import { runUnderCeiling, stayDown, watchCeiling } from './page-ceiling';
import { LIMITED, TARGETS, kiLimit, pid, pidPoles, scoreTrace, stars, takeoff } from './pid-tools';
import { KICK_AT, NOISE_SD, heightTop, damperRun, integralRun, jitterOf, kickRun, meanHeight, nearlyCancels, noiseRun, piZero, polesStep, slowestPole, stepOf } from './scenarios';
import { NOISY, damperStatus, integralStatus, noiseStatus, zetaPD } from './status';
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


/** "$K_p$" alone would be announced as "K_p": give the three gain sliders plain names */
function nameGains(ctx: WidgetCtx, sliders: { input: HTMLInputElement }[]): void {
  sliders.forEach((s, i) => s.input.setAttribute('aria-label', ctx.tch(`widgets.gains.${['kp', 'ki', 'kd'][i]}`)));
}

const playerLabels = (_ctx?: WidgetCtx) => ({
  heightLabel: tc('drone.height'),
  thrustLabel: tc('drone.thrust'),
});

/** 9a: the integral term piles up past error until it holds the drone up by itself. */
const integral: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const KP = 20;
  // starts where the droop is gone, so the orange pile is visible climbing to the weight
  let ki = 10;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const player = new TracePlayer(host, {
    ...playerLabels(ctx),
    duration: 12,
    gravityLabel: t('gravity'),
    extra: [{ id: 'iterm', color: 'eff', label: t('iterm'), dash: [3, 3], values: (tr) => tr.integral.map((v) => ki * v) }],
  });
  const rDroop = readout(t('readout.droop'), 'err');
  const rPile = readout(t('readout.pile'), 'eff');
  const rArea = readout(t('readout.area'), 'err');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = (preview = false) => {
    const tr = integralRun(ki);
    if (preview) player.show(tr);
    else player.load(tr);
    const end = tr.h[tr.h.length - 1];
    const droop = 2 - end;
    rDroop.set(`${fmt(droop * 100, 1)} cm`, Math.abs(droop) < 0.01 ? 'good' : '');
    rPile.set(`${fmt(ki * tr.integral[tr.integral.length - 1], 2)} N`);
    rArea.set(`${fmt(tr.integral[tr.integral.length - 1], 2)} m·s`);
    const lim = kiLimit(KP, 0);
    const st = integralStatus(ki, tr, KP);
    status.textContent = t(`status.${st}`, { lim: fmt(lim, 0) });
    status.className = `w-status${st === 'unstable' ? ' bad' : st === 'gone' ? ' good' : ''}`;
    player.hPlot.describe(t('describe', { ki: fmt(ki, 0), droop: fmt(droop * 100, 1) }));
  };
  const sl = slider({ label: t('slider'), min: 0, max: 60, step: 1, value: ki, unit: 'N/(m·s)', color: 'eff', onInput: (v) => { ki = v; run(true); } });
  sl.input.setAttribute('aria-label', ctx.tch('widgets.gains.ki'));
  player.bind(sl.input);
  layout(host, player, { controls: [sl.el], readouts: [rDroop.el, rPile.el, rArea.el], status });
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
  const rZeta = readout(t('readout.zeta'), 'eff');
  const rOs = readout(t('readout.overshoot'), 'out');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = (preview = false) => {
    const ki = bigKi ? 50 : 10;
    const tr = damperRun(ki, kd);
    if (preview) player.show(tr);
    else player.load(tr);
    const s = scoreTrace(tr);
    // one notch less D: did this notch make the overshoot worse?
    const less = kd > 0 ? scoreTrace(damperRun(ki, kd - 0.5)).overshoot : s.overshoot;
    rDamp.set(`${fmt(DRONE.c + kd, 1)} N·s/m`);
    const z = zetaPD(KP, kd);
    rZeta.set(fmt(z, 2));
    rOs.set(`${fmt(s.overshoot, 0)} %`, s.overshoot < 5 ? 'good' : '');
    const st = damperStatus(ki, kd, s.overshoot, less, KP);
    status.textContent = t(`status.${st}`, { os: fmt(s.overshoot, 0) });
    status.className = `w-status${st === 'unstable' ? ' bad' : st === 'calm' ? ' good' : ''}`;
  };
  const sl = slider({ label: t('slider'), min: 0, max: 10, step: 0.5, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { kd = v; run(true); } });
  sl.input.setAttribute('aria-label', ctx.tch('widgets.gains.kd'));
  player.bind(sl.input);
  const tg = toggle(t('bigKi'), bigKi, (v) => { bigKi = v; run(); });
  tg.input.setAttribute('aria-label', t('bigKiName'));
  layout(host, player, { controls: [sl.el, tg.el], readouts: [rDamp.el, rZeta.el, rOs.el], status });
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
  const rOs = readout(t('readout.overshoot'), 'out');
  const rTs = readout(t('readout.settling'), 'out');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const update = () => {
    const ps = pidPoles(kp, ki, kd);
    const lim = kiLimit(kp, kd);
    // true values: the s-plane itself turns far-away poles into edge arrows with their value
    const pts: SPoint[] = ps.map((p, i) => ({ id: `p${i}`, re: p.re, im: p.im, kind: 'pole' }));
    // the I term brings a zero at −Ki/Kp (D works on the measurement, so it adds none)
    const zero = piZero(kp, ki);
    if (zero !== null) pts.push({ id: 'z', re: zero, im: 0, kind: 'zero', label: t('zero') });
    // faint trail of where the poles have been
    for (const p of ps) {
      const [re, im] = clampPole(p.re, p.im, range);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(sp.sx(re)));
      c.setAttribute('cy', String(sp.sy(im)));
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
    const tr = polesStep(kp, ki, kd, 15);
    const shown = tr.t.findIndex((x) => x > 8);
    step.set('h', tr.t.slice(0, shown), tr.h.slice(0, shown));
    step.set('r', tr.t.slice(0, shown), tr.r.slice(0, shown));
    const stable = ki < lim;
    const m = stepOf(tr);
    rOs.set(stable ? `${fmt(m.overshoot, 1)} %` : '—');
    rTs.set(stable && Number.isFinite(m.settling) ? `${fmt(m.settling, 2)} s` : t('never'));
    const worst = slowestPole(ps);
    let text = stable ? t('status.stable', { lim: fmt(lim, 0), s: fmt(worst.re, 2) }) : t('status.unstable', { lim: fmt(lim, 0) });
    if (stable && nearlyCancels(worst, zero)) text += ` ${t('status.cancel', { z: fmt(zero!, 2) })}`;
    status.textContent = text;
    status.className = `w-status${stable ? '' : ' bad'}`;
    step.describe(text);
  };
  const sKp = slider({ label: t('kp'), min: 2, max: 40, step: 1, value: kp, unit: 'N/m', color: 'eff', onInput: (v) => { kp = v; update(); } });
  const sKi = slider({ label: t('ki'), min: 0, max: 200, step: 2, value: ki, unit: 'N/(m·s)', color: 'eff', onInput: (v) => { ki = v; update(); } });
  const sKd = slider({ label: t('kd'), min: 0, max: 10, step: 0.25, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { kd = v; update(); } });
  nameGains(ctx, [sKp, sKi, sKd]);
  host.classList.add('pid-widget', 'pid-poles');
  host.append(
    h('div', { class: 'w-controls compact' }, sKp.el, sKi.el, sKd.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rOs.el, rTs.el)),
    status,
    setRich(h('p', { class: 'w-help' }), t('help')),
  );
  // the "cliff" sentence moves Kp and Kd here: a linked representation
  const off = followPlay(ctx.bus, 'cliff', (v) => {
    kp = v.kp;
    kd = v.kd;
    sKp.value = kp;
    sKd.value = kd;
    update();
  });
  update();
  return off;
};

/** the playground replays the first 6 s of the 15 s it scores */
const REPLAY = 6;

/** 9d: tuning playground with a scoreboard. */
const playground: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kp = 20;
  let ki = 0;
  let kd = 0;
  let aw = true;
  host.append(h('p', { class: 'w-title' }, t('title')));
  // windup can throw it out of its picture into the page above; the motors survive the bump (page-ceiling.ts)
  const player = new TracePlayer(host, { ...playerLabels(ctx), duration: REPLAY, pageCeiling: true });
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
  // a crash (landing faster than 1.5 m/s): the drone stays down from then on (docs/page-physics.md rule 8)
  let crashAt: number | null = null;
  let crashLine = '';
  let shown: string | null = null;
  // the hit and crash sentences (and a mark on the height plot) appear when the replay gets to them;
  // a crash after the 6 s replay (the stars look at 15 s) is told when the replay ends
  const showEvents = (tt: number) => {
    const hitOn = hitAt !== null && tt >= hitAt;
    const crashOn = crashAt !== null && tt >= Math.min(crashAt, REPLAY - 1e-6);
    const key = `${hitOn}${crashOn}`;
    if (key === shown) return;
    shown = key;
    starsText.textContent = [verdict, hitOn ? hitLine : '', crashOn ? crashLine : ''].filter(Boolean).join(' ');
    player.hPlot.setLines(hitOn && hitAt !== null ? [{ kind: 'v', at: hitAt, color: 'ink3', dash: [2, 4], label: t('hit.mark') }] : []);
  };
  player.onFrame = (tt) => showEvents(tt);
  /** `relayout`: the page moved, so the ceiling did; keep the replay going if the flight so far is unchanged */
  const run = (mode: 'load' | 'preview' | 'relayout' = 'load') => {
    const oldHit = hitAt;
    ceiling = player.view.ceilingHeight();
    const tr = stayDown(runUnderCeiling(takeoff(pid(kp, ki, kd, { antiWindup: aw })), 15, ceiling));
    const s = scoreTrace(tr);
    const st = stars(s);
    rOs.set(`${fmt(s.overshoot, 1)} %`, st.overshoot ? 'good' : 'bad');
    // a P-only drone does settle, just 24.5 cm low: say why it never gets inside the 2 % band
    rTs.set(Number.isFinite(s.settling) ? `${fmt(s.settling, 2)} s` : t(s.sse > 0.02 * 2 && tr.crashAt === null ? 'neverDroop' : 'never'), st.settling ? 'good' : 'bad');
    rSse.set(`${fmt(s.sse * 100, 1)} cm`, st.sse ? 'good' : 'bad');
    rSat.set(`${fmt(s.saturated, 2)} s`, st.saturated ? 'good' : 'bad');
    const n = Object.values(st).filter(Boolean).length;
    row.set(Object.values(st));
    verdict = n === 4 ? t('allStars') : t('someStars', { n });
    // only a hit the replay shows (its first 6 s) gets a sentence
    hitAt = tr.hitAt !== null && tr.hitAt <= REPLAY ? tr.hitAt : null;
    hitLine = t(Number.isFinite(s.settling) ? 'hit.back' : 'hit.wild');
    crashAt = tr.crashAt;
    crashLine = crashAt === null ? '' : t('crash', { t: fmt(crashAt, 1) });
    shown = null;
    showEvents(0);
    starsEl.className = `w-status score-line${n === 4 ? ' good' : ''}`;
    const n6 = Math.round(REPLAY * 100) + 1;
    const show = { ...tr, t: tr.t.slice(0, n6), h: tr.h.slice(0, n6), thrust: tr.thrust.slice(0, n6), r: tr.r.slice(0, n6) };
    // a windup flight (and a bump into the page) goes well above 3 m: grow the height plot so the peak stays on it
    player.hPlot.setY(0, heightTop(show.h));
    // before either hit, the old and the new flight are the same
    const same = player.playhead < Math.min(oldHit ?? Infinity, hitAt ?? Infinity);
    if (mode === 'preview') player.show(show);
    else if (mode === 'relayout' && (same || !player.loop.playing)) player.swap(show);
    else player.load(show);
  };
  const sKp = slider({ label: t('kp'), min: 0, max: 40, step: 1, value: kp, unit: 'N/m', color: 'eff', onInput: (v) => { kp = v; run('preview'); } });
  const sKi = slider({ label: t('ki'), min: 0, max: 60, step: 1, value: ki, unit: 'N/(m·s)', color: 'eff', onInput: (v) => { ki = v; run('preview'); } });
  const sKd = slider({ label: t('kd'), min: 0, max: 10, step: 0.5, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { kd = v; run('preview'); } });
  nameGains(ctx, [sKp, sKi, sKd]);
  for (const sl of [sKp, sKi, sKd]) player.bind(sl.input);
  const tg = toggle(t('antiWindup'), aw, (v) => { aw = v; run(); });
  layout(host, player, {
    controls: [sKp.el, sKi.el, sKd.el],
    extra: [h('div', { class: 'w-row' }, tg.el)],
    readouts: [rOs.el, rTs.el, rSse.el, rSat.el],
    status: starsEl,
    help: h('p', { class: 'w-help' }, t('targets', { os: fmt(TARGETS.overshoot, 0), ts: fmt(TARGETS.settling, 1), sat: fmt(TARGETS.saturated, 1) })),
  });
  run();
  // the page moved (scroll brings the sticky top bar closer, resize, fonts, a gate opening): measure again, recompute
  const unwatch = watchCeiling(player.view, () => ceiling, () => run('relayout'));
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
  const player = new TracePlayer(host, { ...playerLabels(ctx), duration: 5, heightRange: [0.5, 2] });
  const rAsk = readout(t('asked'), 'eff');
  const rPeak = readout(t('peak'), 'eff');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  // the "kick!" tag appears on the thrust plot when the replay reaches the jump
  let tagged: boolean | null = null;
  const tag = (on: boolean) => {
    if (on === tagged) return;
    tagged = on;
    player.tPlot.setMarkers(on ? [{ x: KICK_AT, y: LIMITED.tMax, color: 'err', shape: 'flag', label: t('kickMark') }] : []);
  };
  player.onFrame = (tt) => tag(mode === 'error' && tt >= KICK_AT);
  const run = () => {
    const tr = kickRun(mode);
    tagged = null;
    tag(false);
    player.load(tr);
    const ask = Math.max(...tr.request);
    const peak = Math.max(...tr.thrust);
    rAsk.set(`${fmt(ask, 0)} N`, ask > LIMITED.tMax ? 'bad' : 'good');
    rPeak.set(`${fmt(peak, 1)} N`, peak >= LIMITED.tMax - 1e-6 ? 'bad' : 'good');
    status.textContent = t(`status.${mode}`, { req: fmt(ask, 0) });
    status.className = `w-status${mode === 'error' ? ' bad' : ' good'}`;
  };
  const seg = segmented(t('mode'), [
    { value: 'error', label: t('onError') },
    { value: 'measurement', label: t('onMeasurement') },
  ], mode, (v) => { mode = v; run(); });
  layout(host, player, { controls: [seg.el], readouts: [rAsk.el, rPeak.el], status });
  run();
  return () => player.destroy();
};

/** 9e (ii): sensor noise gets amplified by the derivative. */
const noise: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let on = true;
  let tau = 0.005;
  let kd = 4;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const player = new TracePlayer(host, { ...playerLabels(ctx), duration: 5, heightRange: [1, 2.6], showMeasured: true, measuredLabel: t('measured') });
  const rJit = readout(t('jitter'), 'eff');
  const rMean = readout(t('mean'), 'out');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const run = (preview = false) => {
    const tr = noiseRun(kd, tau, on);
    const mean = meanHeight(tr);
    rMean.set(`${fmt(mean, 2)} m`, Math.abs(mean - 2) < 0.02 ? 'good' : 'bad');
    if (preview) player.show(tr);
    else player.load(tr);
    const sd = jitterOf(tr);
    rJit.set(`± ${fmt(sd, 2)} N`, sd < NOISY ? 'good' : 'bad');
    const st = noiseStatus(on, kd, sd);
    status.textContent = t(`status.${st}`, { j: fmt(sd, 1), p: fmt(15 * NOISE_SD, 1), tau: fmt(tau, 3) });
    status.className = `w-status${st === 'chatter' ? ' bad' : ''}`;
  };
  const tg = toggle(t('toggle'), on, (v) => { on = v; run(); });
  const sl = slider({ label: t('filter'), min: 0.005, max: 0.2, step: 0.005, value: tau, unit: 's', digits: 3, color: 'eff', onInput: (v) => { tau = v; run(true); } });
  sl.input.setAttribute('aria-label', t('filterName'));
  const sKd = slider({ label: t('kd'), min: 0, max: 8, step: 0.5, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { kd = v; run(true); } });
  sKd.input.setAttribute('aria-label', ctx.tch('widgets.gains.kd'));
  for (const s of [sl, sKd]) player.bind(s.input);
  host.classList.add('pid-noise');
  layout(host, player, {
    controls: [sl.el, sKd.el, tg.el],
    readouts: [rJit.el, rMean.el],
    status,
    help: setRich(h('p', { class: 'w-help' }), t('help')),
  });
  run();
  return () => player.destroy();
};

export const widgets: Record<string, WidgetFactory> = { integral, damper, poles, playground, kick, noise };
