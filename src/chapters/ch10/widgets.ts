import '../ch09/ch09.css';
import { h } from '../../core/dom';
import { canvasHandFont } from '../../core/font';
import { fmt, tc } from '../../core/i18n';
import { progress } from '../../core/progress';
import { logspace, sweep } from '../../math/bode';
import { SHOWER, ShowerSim } from '../../sim/shower-model';
import type { WidgetCtx, WidgetFactory } from '../../story/types';
import { readout, slider, toggle, transport } from '../../ui/controls';
import { color } from '../../ui/colors';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { ShowerView } from '../../ui/shower-view';
import { SHOWER_RUN_KEY, type SavedShowerRun } from '../ch00/widgets';
import {
  comfortTime,
  handLoop,
  handPolicy,
  loopMargins,
  measureSine,
  piLoop,
  piPolicy,
  runShower,
  swingPeriod,
  unwrapNear,
  withDelay,
  type ShowerTrace,
} from './shower-tools';

const W_MIN = 0.05;
const W_MAX = 3;
const wFromSlider = (v: number): number => W_MIN * (W_MAX / W_MIN) ** v;

function tempPlot(host: HTMLElement, label: string, tMax: number, series: { id: string; color: string; label: string; ghost?: boolean; dash?: number[]; width?: number }[]): Plot {
  const p = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: tMax },
    y: { label: tc('plots.temp'), min: 10, max: 62 },
    series,
    height: 200,
    label,
  });
  p.setBands([{ kind: 'h', from: SHOWER.target - SHOWER.band, to: SHOWER.target + SHOWER.band, color: 'sp@0.16' }]);
  p.setLines([{ kind: 'h', at: SHOWER.target, color: 'sp', label: '38 °C' }]);
  return p;
}

/** 10a: the same delay is a small nudge for a slow wave and a half-turn for a fast one. */
const phase: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const L = SHOWER.delay;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const plot = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: 30 },
    y: { label: t('y'), min: -1.3, max: 1.3 },
    series: [
      { id: 'in', color: 'eff', label: t('in') },
      { id: 'out', color: 'out', label: t('out') },
    ],
    height: 200,
    label: t('aria'),
  });
  const rLag = readout(t('lag'), 'err');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const draw = (period: number) => {
    const w = (2 * Math.PI) / period;
    plot.fn('in', (x) => Math.sin(w * x));
    plot.fn('out', (x) => (x < L ? 0 : Math.sin(w * (x - L))));
    const deg = (360 * L) / period;
    // bracket the 2.5 s between matching peaks, so the lag is something you can see
    // first input peak, and the same peak arriving L seconds later
    const peak = period / 4;
    plot.overlay = (c, px, py) => {
      const x0 = px(peak);
      const x1 = px(peak + L);
      if (x1 > px(30)) return;
      const y = py(1.13);
      c.strokeStyle = c.fillStyle = color('dis');
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(x1, y);
      c.moveTo(x0 + 6, y - 4);
      c.lineTo(x0, y);
      c.lineTo(x0 + 6, y + 4);
      c.moveTo(x1 - 6, y - 4);
      c.lineTo(x1, y);
      c.lineTo(x1 - 6, y + 4);
      c.stroke();
      c.font = canvasHandFont(15);
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(`${fmt(L, 1)} s`, x1 + 6, y);
    };
    rLag.set(`${fmt(deg, 0)}°`);
    const wrapped = deg % 360;
    status.textContent = Math.abs(wrapped - 180) < 20 ? t('status.flipped') : wrapped < 45 || wrapped > 315 ? (deg > 300 ? t('status.full') : t('status.small')) : t('status.middle', { d: fmt(deg, 0) });
    plot.describe(t('describe', { p: fmt(period, 1), d: fmt(deg, 0) }));
  };
  const sl = slider({ label: t('slider'), min: 2, max: 30, step: 0.5, value: 20, unit: 's', color: 'eff', onInput: draw });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rLag.el)), status);
  draw(20);
};

/** 10b: measure the frequency response one sine at a time. */
const bode: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  host.append(h('p', { class: 'w-title' }, t('title')));
  let w = 0.2;
  const dots: { w: number; gain: number; phase: number }[] = [];
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const timePlot = new Plot(left, {
    x: { label: tc('plots.time'), min: 0, max: 30 },
    y: { label: tc('plots.temp'), min: 20, max: 55 },
    series: [
      { id: 'mix', color: 'eff', label: t('mix'), width: 1.8 },
      { id: 'T', color: 'out', label: t('head') },
    ],
    height: 220,
    label: t('timeAria'),
  });
  const gainPlot = new Plot(right, {
    x: { label: t('w'), min: W_MIN, max: W_MAX, log: true },
    y: { label: t('gain'), min: 0.02, max: 1.5, log: true },
    series: [
      { id: 'formula', color: 'ink3', label: t('formula'), dash: [5, 4] },
      { id: 'dots', color: 'out', label: t('measured'), dots: true },
    ],
    height: 170,
    label: t('gainAria'),
  });
  const phasePlot = new Plot(right, {
    x: { label: t('w'), min: W_MIN, max: W_MAX, log: true },
    y: { label: t('phase'), min: -540, max: 0, ticks: [0, -180, -360, -540] },
    series: [
      { id: 'formula', color: 'ink3', dash: [5, 4] },
      { id: 'dots', color: 'out', dots: true },
    ],
    height: 170,
    label: t('phaseAria'),
  });
  phasePlot.setLines([{ kind: 'h', at: -180, color: 'err', label: t('flip') }]);
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' }, t('status.start'));
  const ws = logspace(Math.log10(W_MIN), Math.log10(W_MAX), 200);
  const exact = sweep([1], [SHOWER.tau, 1], SHOWER.delay, ws);
  let showFormula = false;
  const redraw = () => {
    const sorted = [...dots].sort((a, b) => a.w - b.w);
    gainPlot.set('dots', sorted.map((d) => d.w), sorted.map((d) => d.gain));
    phasePlot.set('dots', sorted.map((d) => d.w), sorted.map((d) => d.phase));
    gainPlot.set('formula', showFormula ? ws : [], showFormula ? exact.map((p) => p.mag) : []);
    phasePlot.set('formula', showFormula ? ws : [], showFormula ? exact.map((p) => p.phase) : []);
    formulaToggle.input.disabled = dots.length < 5;
    gainPlot.describe(t('describe', { n: dots.length }));
  };
  const measure = (wm: number, show = true) => {
    const m = measureSine(wm);
    const ref = sweep([1], [SHOWER.tau, 1], SHOWER.delay, [wm])[0].phase;
    const ph = unwrapNear(m.phase, ref);
    dots.push({ w: wm, gain: m.gain, phase: ph });
    if (show) {
      const tEnd = m.trace.t[m.trace.t.length - 1];
      const t0 = Math.max(0, tEnd - Math.max(30, (3 * 2 * Math.PI) / wm));
      timePlot.setX(t0, tEnd);
      timePlot.set('mix', m.trace.t, m.mix);
      timePlot.set('T', m.trace.t, m.trace.T);
      status.textContent = t('status.measured', { w: fmt(wm, 2), p: fmt((2 * Math.PI) / wm, 1), g: fmt(m.gain, 2), ph: fmt(ph, 0) });
    }
  };
  const btn = h('button', { class: 'btn primary small', type: 'button' }, t('measure'));
  btn.addEventListener('click', () => {
    measure(w);
    redraw();
  });
  const sweepBtn = h('button', { class: 'btn small', type: 'button' }, t('sweep'));
  sweepBtn.addEventListener('click', () => {
    for (const wm of logspace(Math.log10(0.07), Math.log10(2.5), 8)) measure(wm, false);
    measure(w);
    redraw();
  });
  const clearBtn = h('button', { class: 'btn small', type: 'button' }, t('clear'));
  clearBtn.addEventListener('click', () => {
    dots.length = 0;
    showFormula = false;
    formulaToggle.input.checked = false;
    redraw();
  });
  const formulaToggle = toggle(t('showFormula'), false, (v) => {
    showFormula = v;
    redraw();
    if (v) status.textContent = t('status.formula');
  });
  const sl = slider({
    label: t('slider'),
    min: 0,
    max: 1,
    step: 0.01,
    value: Math.log(w / W_MIN) / Math.log(W_MAX / W_MIN),
    format: (v) => `${fmt(wFromSlider(v), 2)} rad/s (${t('period')} ${fmt((2 * Math.PI) / wFromSlider(v), 1)} s)`,
    color: 'eff',
    onInput: (v) => (w = wFromSlider(v)),
  });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'w-row' }, btn, sweepBtn, clearBtn), formulaToggle.el), status);
  // start with one measurement so the plots are never blank
  measure(w);
  redraw();
};

/** Bode plot pair for an open loop, with margins marked. */
function marginPlots(host: HTMLElement, t: WidgetCtx['t']) {
  const gain = new Plot(host, {
    x: { label: t('w'), min: 0.02, max: 5, log: true },
    y: { label: t('gain'), min: 0.01, max: 100, log: true },
    series: [{ id: 'L', color: 'out', label: t('loop'), ghost: true }],
    height: 170,
    label: t('gainAria'),
  });
  const phase = new Plot(host, {
    x: { label: t('w'), min: 0.02, max: 5, log: true },
    y: { label: t('phase'), min: -540, max: -90, ticks: [-90, -180, -360, -540] },
    series: [{ id: 'L', color: 'out', ghost: true }],
    height: 170,
    label: t('phaseAria'),
  });
  return { gain, phase };
}

/** 10c: gain and phase margin — how close to the cliff edge the hand is. */
const margins: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let k = 0.008;
  let delay = SHOWER.delay;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const { gain, phase } = marginPlots(left, t);
  const temp = tempPlot(right, t('timeAria'), 60, [{ id: 'T', color: 'out', label: t('temp'), ghost: true }]);
  const rGm = readout(t('gm'));
  const rPm = readout(t('pm'));
  const rCrit = readout(t('crit'), 'eff');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const ws = logspace(Math.log10(0.02), Math.log10(5), 300);
  // ghost = the last settled setting, not the previous drag frame
  let fresh = true;
  const update = () => {
    const l = handLoop(k);
    const pts = sweep(l.num, l.den, delay, ws);
    gain.clear(fresh);
    phase.clear(fresh);
    gain.set('L', ws, pts.map((p) => p.mag));
    phase.set('L', ws, pts.map((p) => p.phase));
    const m = loopMargins(l, delay);
    const crit = loopMargins(handLoop(1), delay).gm;
    gain.setLines([
      { kind: 'h', at: 1, color: 'ink3', label: t('one') },
      ...(Number.isFinite(m.w180) ? [{ kind: 'v' as const, at: m.w180, color: 'err', dash: [3, 4] }] : []),
    ]);
    phase.setLines([
      { kind: 'h', at: -180, color: 'err', label: t('cliff') },
      ...(Number.isFinite(m.wc) ? [{ kind: 'v' as const, at: m.wc, color: 'ink3', dash: [3, 4] }] : []),
    ]);
    const markers = [];
    if (Number.isFinite(m.w180)) markers.push({ x: m.w180, y: 1 / m.gm, color: 'err', label: t('at180') });
    gain.setMarkers(markers);
    phase.setMarkers(Number.isFinite(m.wc) ? [{ x: m.wc, y: -180 + m.pm, color: 'out', label: t('atCross') }] : []);
    const stable = m.gm > 1;
    rGm.set(`× ${fmt(m.gm, 2)}`, stable ? (m.gm > 2 ? 'good' : '') : 'bad');
    rPm.set(stable ? `${fmt(m.pm, 0)}°` : '—', stable ? (m.pm > 45 ? 'good' : '') : 'bad');
    rCrit.set(`${fmt(crit * 100, 2)} %/(°C·s)`);
    status.textContent = !stable ? t('status.over') : m.gm < 1.5 || m.pm < 30 ? t('status.edge', { p: fmt(m.pm, 0) }) : t('status.safe');
    status.className = `w-status${!stable ? ' bad' : m.pm > 45 ? ' good' : ''}`;
    temp.clear(fresh);
    fresh = false;
    const tr = runShower(handPolicy(k), 60, delay);
    temp.set('T', tr.t, tr.T);
    gain.describe(t('describe', { gm: fmt(m.gm, 2), pm: fmt(m.pm, 0) }));
  };
  const sK = slider({ label: t('k'), min: 0.1, max: 2, step: 0.05, value: k * 100, unit: '%/(°C·s)', color: 'eff', onInput: (v) => { k = v / 100; update(); } });
  const sL = slider({ label: t('delay'), min: 1, max: 5, step: 0.25, value: delay, unit: 's', color: 'dis', onInput: (v) => { delay = v; update(); } });
  for (const el of [sK.input, sL.input]) el.addEventListener('change', () => (fresh = true));
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls' }, sK.el, sL.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rGm.el, rPm.el, rCrit.el)), status);
  update();
};

/** 10c (callback): the learner's own Chapter 0 swings, compared with the prediction. */
const replay: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const saved = progress.load<SavedShowerRun>(SHOWER_RUN_KEY);
  let tr: ShowerTrace;
  let yours = false;
  if (saved && saved.t.length > 50) {
    tr = { t: saved.t, T: saved.T, u: saved.u };
    yours = true;
  } else {
    tr = runShower(handPolicy(0.008), 60);
  }
  host.append(h('p', { class: 'w-title' }, t('title')), h('p', { class: 'w-help' }, yours ? t('yours') : t('robot')));
  const plot = tempPlot(host, t('aria'), 60, [
    { id: 'T', color: 'out', label: t('temp') },
    { id: 'mix', color: 'eff', label: t('mix'), dash: [2, 3], width: 1.5 },
  ]);
  plot.set('T', tr.t, tr.T);
  plot.set('mix', tr.t, tr.u.map((u) => SHOWER.cold + (SHOWER.hot - SHOWER.cold) * u));
  const period = swingPeriod(tr);
  const pSpeed = (2 * Math.PI) / loopMargins(handLoop(1), SHOWER.delay).w180;
  const pPos = (2 * Math.PI) / loopMargins({ num: [45], den: [SHOWER.tau, 1] }, SHOWER.delay).w180;
  const rYours = readout(yours ? t('periodYours') : t('periodRobot'), 'out');
  const rSpeed = readout(t('predSpeed'), 'err');
  const rPos = readout(t('predPos'), 'err');
  rYours.set(Number.isFinite(period) ? `${fmt(period, 1)} s` : '—');
  rSpeed.set(`${fmt(pSpeed, 1)} s`);
  rPos.set(`${fmt(pPos, 1)} s`);
  let verdict: string;
  if (!Number.isFinite(period)) verdict = t('verdict.calm');
  else if (!yours) verdict = t('verdict.robot', { p: fmt(period, 1) });
  else if (Math.abs(period - pPos) < Math.abs(period - pSpeed)) verdict = t('verdict.position', { p: fmt(period, 1) });
  else verdict = t('verdict.speed', { p: fmt(period, 1) });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rYours.el, rSpeed.el, rPos.el)), h('p', { class: 'w-status' }, verdict));
  plot.describe(verdict);
};

/** 10d: design a robot shower (PI) that beats your hands. */
const designer: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kp = 0;
  let ki = 0.008;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const view = new ShowerView(left, {
    labels: { aria: t('view.aria'), knob: t('view.knob'), cold: 'C', hot: 'H', pipe: t('view.pipe'), head: t('view.head'), thermo: t('view.thermo') },
  });
  const plot = tempPlot(right, t('aria'), 40, [
    { id: 'T', color: 'out', label: t('temp'), ghost: true },
    { id: 'mix', color: 'eff', label: t('mix'), dash: [2, 3], width: 1.5 },
  ]);
  const rPm = readout(t('pm'));
  const rGm = readout(t('gm'));
  const rComfort = readout(t('comfort'));
  const rYours = readout(t('yours'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const saved = progress.load<SavedShowerRun>(SHOWER_RUN_KEY);
  const yourComfort = saved && saved.t.length > 50 ? comfortTime({ t: saved.t, T: saved.T, u: saved.u }) : Number.NaN;
  rYours.set(saved ? (Number.isFinite(yourComfort) ? `${fmt(yourComfort, 1)} s` : t('never')) : t('notPlayed'));
  // replay the computed run in real time
  let sim = new ShowerSim(withDelay(SHOWER.delay), piPolicy(kp, ki), 0);
  let acc = 0;
  const loop = new Loop((dt) => {
    sim.advance(dt);
    acc += dt;
    if (acc >= 0.1) {
      acc = 0;
      plot.push('T', sim.t, sim.temp);
      plot.push('mix', sim.t, sim.mix(sim.u));
    }
    view.update({ u: sim.u, pipe: sim.pipeProfile(30), temp: sim.temp }, dt);
    if (sim.t >= 40) loop.pause();
  }, host);
  loop.speed = 2;
  const restart = () => {
    loop.pause();
    plot.clear();
    sim = new ShowerSim(withDelay(SHOWER.delay), piPolicy(kp, ki), 0);
    view.update({ u: 0, pipe: sim.pipeProfile(30), temp: sim.temp });
    if (Loop.autoplay) loop.play();
    else {
      const tr = runShower(piPolicy(kp, ki), 40);
      plot.set('T', tr.t, tr.T);
    }
  };
  const evaluate = () => {
    const m = loopMargins(piLoop(kp, ki), SHOWER.delay);
    const stable = m.gm > 1;
    const comfort = comfortTime(runShower(piPolicy(kp, ki), 40));
    rPm.set(stable ? `${fmt(m.pm, 0)}°` : '—', stable && m.pm > 45 ? 'good' : 'bad');
    rGm.set(`× ${fmt(m.gm, 2)}`, m.gm > 2 ? 'good' : m.gm > 1 ? '' : 'bad');
    rComfort.set(Number.isFinite(comfort) ? `${fmt(comfort, 1)} s` : t('never'), comfort < 12 ? 'good' : 'bad');
    const beatsYou = !Number.isFinite(yourComfort) || comfort < yourComfort;
    const win = stable && m.pm > 45 && comfort < 12;
    status.textContent = !stable ? t('status.unstable') : win ? (beatsYou ? t('status.win') : t('status.winButYou')) : m.pm <= 45 ? t('status.edge') : t('status.slow');
    status.className = `w-status${win ? ' good' : !stable ? ' bad' : ''}`;
    if (win) progress.save('ch10.robot', { kp, ki, comfort });
    plot.describe(status.textContent ?? '');
  };
  // dragging shows the whole run instantly (ghosting the last settled one);
  // releasing a pointer drag replays it live. Keyboard steps never animate.
  let fresh = true;
  let pointer = false;
  const preview = () => {
    evaluate();
    loop.pause();
    plot.clear(fresh);
    fresh = false;
    const tr = runShower(piPolicy(kp, ki), 40);
    plot.set('T', tr.t, tr.T);
    plot.set('mix', tr.t, tr.u.map((u) => SHOWER.cold + (SHOWER.hot - SHOWER.cold) * u));
    const last = tr.t.length - 1;
    view.update({ u: tr.u[last], pipe: Array.from({ length: 30 }, () => SHOWER.cold + (SHOWER.hot - SHOWER.cold) * tr.u[last]), temp: tr.T[last] });
  };
  const change = () => {
    evaluate();
    restart();
    fresh = true;
  };
  const sKp = slider({ label: t('kp'), min: 0, max: 6, step: 0.1, value: kp * 100, unit: '%/°C', color: 'eff', onInput: (v) => { kp = v / 100; preview(); } });
  const sKi = slider({ label: t('ki'), min: 0, max: 6, step: 0.05, value: ki * 100, unit: '%/(°C·s)', color: 'eff', onInput: (v) => { ki = v / 100; preview(); } });
  for (const sl of [sKp, sKi]) {
    sl.input.addEventListener('pointerdown', () => (pointer = true));
    sl.input.addEventListener('change', () => {
      fresh = true;
      if (pointer && Loop.autoplay) restart();
      pointer = false;
    });
  }
  const preset = (label: string, p: number, i: number) => {
    const b = h('button', { class: 'btn small', type: 'button' }, label);
    b.addEventListener('click', () => {
      kp = p;
      ki = i;
      sKp.value = p * 100;
      sKi.value = i * 100;
      change();
    });
    return b;
  };
  host.classList.add('pid-widget');
  host.append(
    h('div', { class: 'w-controls' }, sKp.el, sKi.el),
    h('div', { class: 'w-row' }, preset(t('presetHand'), 0, 0.008), preset(t('presetJune'), 0.05, 0.05)),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rPm.el, rGm.el, rComfort.el, rYours.el), transport({ loop, onReset: restart, onStep: () => sim.advance(0.5) })),
    status,
    h('p', { class: 'w-help' }, t('goal')),
  );
  evaluate();
  restart();
  return () => loop.destroy();
};

export const widgets: Record<string, WidgetFactory> = { phase, bode, margins, replay, designer };
