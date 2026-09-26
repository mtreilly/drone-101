import '../ch09/ch09.css';
import { h } from '../../core/dom';
import { canvasHandFont } from '../../core/font';
import { fmt, tc } from '../../core/i18n';
import { progress } from '../../core/progress';
import { logspace, loopMargins, sweep, type LoopMargins, type TF } from '../../math/bode';
import { SHOWER, ShowerSim } from '../../sim/shower-model';
import type { WidgetCtx, WidgetFactory } from '../../story/types';
import { readout, slider, toggle, transport } from '../../ui/controls';
import { color } from '../../ui/colors';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { ShowerView } from '../../ui/shower-view';
import { HAND_GAIN } from '../ch00/hands';
import { SHOWER_RUN_KEY, type SavedShowerRun } from '../ch00/widgets';
import {
  BODE_STEP,
  BODE_W_MAX,
  BODE_W_MIN,
  comfortTime,
  criticalHandGain,
  firstUpCrossing,
  handLoop,
  handPolicy,
  JUNE_PI,
  lagStatus,
  KNOB_GAIN,
  measureSine,
  piLoop,
  piPolicy,
  runShower,
  showerFlip,
  sliderFromW,
  swingPeriod,
  THEO_PI,
  unwrapNear,
  wFromSlider,
  withDelay,
  type ShowerTrace,
} from './shower-tools';


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
  // a lag is not an error: the delay's purple, like the arrow
  const rLag = readout(t('lag'), 'dis');
  const rW = readout(t('w'));
  const rShare = readout(t('share'));
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
    rW.set(`${fmt(w, 2)} rad/s`);
    rShare.set(fmt(L / period, 2));
    status.textContent = t(`status.${lagStatus(deg)}`, { d: fmt(deg, 0), f: fmt(L / period, 2) });
    plot.describe(t('describe', { p: fmt(period, 1), d: fmt(deg, 0) }));
  };
  const sl = slider({ label: t('slider'), min: 2, max: 30, step: 0.5, value: 20, unit: 's', color: 'eff', onInput: draw });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rLag.el, rShare.el, rW.el)), status);
  draw(20);
};

/** 10b: measure the frequency response one sine at a time. */
const bode: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  host.append(h('p', { class: 'w-title' }, t('title')));
  // the slider snaps to its own step, so start from a slider position: slider, status and dot agree
  const v0 = sliderFromW(0.2);
  let w = wFromSlider(v0);
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
  const wAxis = { label: t('w'), min: BODE_W_MIN, max: BODE_W_MAX, log: true, logSteps: [1, 2, 5] };
  const gainPlot = new Plot(right, {
    x: wAxis,
    y: { label: t('gain'), min: 0.2, max: 1.2, log: true, logSteps: [1, 2, 5] },
    series: [
      { id: 'formula', color: 'ink3', label: t('formula'), dash: [5, 4] },
      { id: 'dots', color: 'out', label: t('measured'), dots: true },
    ],
    height: 170,
    label: t('gainAria'),
  });
  const phasePlot = new Plot(right, {
    x: wAxis,
    y: { label: t('phase'), min: -540, max: 0, ticks: [0, -180, -360, -540] },
    series: [
      { id: 'formula', color: 'ink3', dash: [5, 4] },
      { id: 'dots', color: 'out', dots: true },
    ],
    height: 170,
    label: t('phaseAria'),
  });
  const flipLine = { kind: 'h' as const, at: -180, color: 'err', label: t('flip'), labelAt: 'start' as const, labelSide: 'below' as const };
  phasePlot.setLines([flipLine]);
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' }, t('status.start'));
  const ws = logspace(Math.log10(BODE_W_MIN), Math.log10(BODE_W_MAX), 200);
  const exact = sweep([1], [SHOWER.tau, 1], SHOWER.delay, ws);
  // where the shower alone turns a wiggle upside down (0.95 rad/s): the position hand's edge
  const flip = showerFlip();
  let showFormula = false;
  const redraw = () => {
    const sorted = [...dots].sort((a, b) => a.w - b.w);
    gainPlot.set('dots', sorted.map((d) => d.w), sorted.map((d) => d.gain));
    phasePlot.set('dots', sorted.map((d) => d.w), sorted.map((d) => d.phase));
    gainPlot.set('formula', showFormula ? ws : [], showFormula ? exact.map((p) => p.mag) : []);
    phasePlot.set('formula', showFormula ? ws : [], showFormula ? exact.map((p) => p.phase) : []);
    const flipV = { kind: 'v' as const, at: flip.w, color: 'err', dash: [3, 4] };
    phasePlot.setLines(showFormula ? [flipLine, flipV] : [flipLine]);
    gainPlot.setLines(showFormula ? [flipV] : []);
    phasePlot.setMarkers(showFormula ? [{ x: flip.w, y: -180, color: 'err', shape: 'diamond', label: t('cross', { w: fmt(flip.w, 2) }) }] : []);
    formulaToggle.input.disabled = dots.length < 5;
    gainPlot.describe(t('describe', { n: dots.length }));
  };
  const measure = (wm: number, show = true) => {
    const m = measureSine(wm);
    const ref = sweep([1], [SHOWER.tau, 1], SHOWER.delay, [wm])[0].phase;
    const ph = unwrapNear(m.phase, ref);
    // one dot per speed: measuring the same speed again replaces it
    const same = dots.findIndex((d) => Math.abs(d.w - wm) < 1e-9);
    if (same >= 0) dots.splice(same, 1);
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
    // a sweep speed next to one already measured (or the slider's) would draw two dots on top of each other
    const near = (a: number, b: number) => Math.abs(Math.log(a / b)) < Math.log(1.15);
    const taken = [w, ...dots.map((d) => d.w)];
    for (const wm of logspace(Math.log10(0.07), Math.log10(2.5), 8)) if (!taken.some((d) => near(d, wm))) measure(wm, false);
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
    if (v) status.textContent = t('status.formula', { w: fmt(flip.w, 2), p: fmt(flip.period, 1) });
  });
  const sl = slider({
    label: t('slider'),
    min: 0,
    max: 1,
    step: BODE_STEP,
    value: v0,
    // each number + unit is its own left-to-right run, so the words around them can read right to left
    format: (v) => `\u2066${fmt(wFromSlider(v), 2)} rad/s\u2069 (${t('period')} \u2066${fmt((2 * Math.PI) / wFromSlider(v), 1)} s\u2069)`,
    color: 'eff',
    onInput: (v) => (w = wFromSlider(v)),
    // one measurement per deliberate choice (pointer release, or a pause in arrow presses)
    onSettle: (v) => {
      w = wFromSlider(v);
      measure(w);
      redraw();
    },
  });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls' }, sl.el), h('div', { class: 'w-hud' }, h('div', { class: 'w-row' }, btn, sweepBtn, clearBtn), formulaToggle.el), status, h('p', { class: 'w-help' }, t('help')));
  // start with one measurement so the plots are never blank
  measure(w);
  redraw();
};

const LOOP_W_MIN = 0.05;
const LOOP_W_MAX = 3;
const LOOP_WS = logspace(Math.log10(LOOP_W_MIN), Math.log10(LOOP_W_MAX), 300);

/**
 * Bode plots of an open loop with both margins drawn as distances to the cliff: an arrow from the
 * loop gain at the −180° speed up to gain 1 (× gain margin), and one from the phase at the
 * gain-of-1 speed down to −180° (phase margin). `withGain: false` draws the phase plot only;
 * `phaseMin` is the bottom of the phase axis (−360°, or −540° for loops far over the cliff).
 * Strings from the widget's own subtree: w, gain, phase, loop, gainAria, phaseAria, one, cliff,
 * atCross.
 */
function marginPlots(host: HTMLElement, t: WidgetCtx['t'], { withGain = true, height = 190, phaseMin = -360 } = {}) {
  const xAxis = { label: t('w'), min: LOOP_W_MIN, max: LOOP_W_MAX, log: true, logSteps: [1, 2, 5] };
  const gain = withGain
    ? new Plot(host, {
        x: xAxis,
        // two decades and a taller frame: a gain margin of × 1.4 is only 0.15 decade, so the
        // arrow and the labels at gain 1 need every pixel they can get on a phone
        y: { label: t('gain'), min: 0.1, max: 10, log: true },
        series: [{ id: 'L', color: 'out', label: t('loop'), ghost: true }],
        height: height + 30,
        label: t('gainAria'),
      })
    : null;
  const phase = new Plot(host, {
    x: xAxis,
    y: { label: t('phase'), min: phaseMin, max: -90, ticks: phaseMin < -360 ? [-90, -180, -360, -540] : [-90, -180, -360] },
    series: [{ id: 'L', color: 'out', label: withGain ? undefined : t('loop'), ghost: true }],
    height,
    label: t('phaseAria'),
  });
  const show = (loop: TF, delay: number, fresh: boolean): LoopMargins => {
    const pts = sweep(loop.num, loop.den, delay, LOOP_WS);
    const m = loopMargins(loop, delay);
    const has180 = Number.isFinite(m.w180) && Number.isFinite(m.gm);
    const hasCross = Number.isFinite(m.wc) && Number.isFinite(m.pm);
    if (gain) {
      gain.clear(fresh);
      gain.set('L', LOOP_WS, pts.map((q) => q.mag));
      gain.setLines([
        { kind: 'h', at: 1, color: 'ink3', label: t('one'), labelAt: 'end', labelSide: 'above', avoid: ['L'] },
        ...(has180 ? [{ kind: 'v' as const, at: m.w180, color: 'err', dash: [3, 4] }] : []),
      ]);
      // like the phase plot: the arrow is the margin and carries the only label ("gain margin × 1.40")
      gain.setMarkers(has180 ? [{ x: m.w180, y: 1 / m.gm, color: 'err', clamp: true }] : []);
      gain.setArrows(has180 ? [{ at: m.w180, from: 1 / m.gm, to: 1, color: 'err', label: `${t('gm')} \u2066× ${fmt(m.gm, 2)}\u2069` }] : []);
    }
    phase.clear(fresh);
    phase.set('L', LOOP_WS, pts.map((q) => q.phase));
    phase.setLines([
      { kind: 'h', at: -180, color: 'err', label: t('cliff'), labelAt: 'end', labelSide: 'above', avoid: ['L'] },
      ...(hasCross ? [{ kind: 'v' as const, at: m.wc, color: 'ink3', dash: [3, 4] }] : []),
    ]);
    // one label for the point and its arrow ("phase margin 22°"): two labels a few pixels apart collide on a phone.
    // Past the cliff there is no margin (the readout shows —), only how far over it the loop is.
    phase.setMarkers(hasCross ? [{ x: m.wc, y: -180 + m.pm, color: 'out', clamp: true }] : []);
    phase.setArrows(hasCross ? [{ at: m.wc, from: -180 + m.pm, to: -180, color: m.pm > 0 ? 'out' : 'err', label: m.pm > 0 ? `${t('atCross')} \u2066${fmt(m.pm, 0)}°\u2069` : `${fmt(m.pm, 0)}°` }] : []);
    return m;
  };
  return { gain, phase, show };
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
  const plots = marginPlots(left, t);
  const temp = tempPlot(right, t('timeAria'), 60, [{ id: 'T', color: 'out', label: t('temp'), ghost: true }]);
  const rGm = readout(t('gm'));
  const rPm = readout(t('pm'));
  const rCrit = readout(t('crit'), 'eff');
  const rW180 = readout(t('w180'));
  const rPeriod = readout(t('period'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  // ghost = the last settled setting, not the previous drag frame
  let fresh = true;
  const update = () => {
    const m = plots.show(handLoop(k), delay, fresh);
    const edge = criticalHandGain(delay);
    const stable = m.gm > 1;
    rGm.set(`× ${fmt(m.gm, 2)}`, stable ? (m.gm > 2 ? 'good' : '') : 'bad');
    rPm.set(stable ? `${fmt(m.pm, 0)}°` : '—', stable ? (m.pm > 45 ? 'good' : '') : 'bad');
    rCrit.set(`${fmt(edge.k * 100, 2)} %/(°C·s)`);
    rW180.set(`${fmt(m.w180, 2)} rad/s`);
    rPeriod.set(`${fmt((2 * Math.PI) / m.w180, 1)} s`);
    temp.clear(fresh);
    fresh = false;
    const tr = runShower(handPolicy(k), 60, delay);
    temp.set('T', tr.t, tr.T);
    // the swings the run really shows (15.5 s for the normal hand); the edge period if it has too few
    const swing = swingPeriod(tr);
    const T = Number.isFinite(swing) ? swing : (2 * Math.PI) / m.w180;
    const vars = { p: fmt(m.pm, 0), g: fmt(m.gm, 2), T: fmt(T, 1) };
    status.textContent = !stable ? t('status.over', vars) : m.gm < 1.5 || m.pm < 30 ? t('status.edge', vars) : t('status.safe', vars);
    status.className = `w-status${!stable ? ' bad' : m.pm > 45 ? ' good' : ''}`;
    plots.gain?.describe(t('describe', { gm: fmt(m.gm, 2), pm: fmt(m.pm, 0) }));
  };
  const sK = slider({ label: t('k'), min: 0.1, max: 2, step: 0.05, value: k * 100, unit: '%/(°C·s)', color: 'eff', onInput: (v) => { k = v / 100; update(); } });
  const sL = slider({ label: t('delay'), min: 1, max: 5, step: 0.25, value: delay, unit: 's', color: 'dis', onInput: (v) => { delay = v; update(); } });
  for (const el of [sK.input, sL.input]) el.addEventListener('change', () => (fresh = true));
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls' }, sK.el, sL.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rGm.el, rPm.el, rCrit.el, rW180.el, rPeriod.el)), status);
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
    tr = runShower(handPolicy(HAND_GAIN), 60);
  }
  host.append(h('p', { class: 'w-title' }, t('title')), h('p', { class: 'w-help' }, yours ? t('yours') : t('robot')));
  const plot = tempPlot(host, t('aria'), 60, [
    { id: 'T', color: 'out', label: t('temp') },
    { id: 'mix', color: 'eff', label: t('mix'), dash: [2, 3], width: 1.5 },
  ]);
  plot.set('T', tr.t, tr.T);
  plot.set('mix', tr.t, tr.u.map((u) => SHOWER.cold + KNOB_GAIN * u));
  const period = swingPeriod(tr);
  const pSpeed = criticalHandGain().period;
  const pPos = criticalHandGain(SHOWER.delay, SHOWER.tau, 'position').period;
  // one measured swing, bracketed on the plot: from an upward crossing of 38 °C, one period long
  if (Number.isFinite(period)) {
    const up = firstUpCrossing(tr, 5, 60 - period);
    if (Number.isFinite(up)) plot.setArrows([{ kind: 'h', at: 58, from: up, to: up + period, color: 'out', label: `${fmt(period, 1)} s`, labelSide: 'above' }]);
  }
  const rYours = readout(yours ? t('periodYours') : t('periodRobot'), 'out');
  // predictions are not errors: neutral ink
  const rSpeed = readout(t('predSpeed'));
  const rPos = readout(t('predPos'));
  rYours.set(Number.isFinite(period) ? `${fmt(period, 1)} s` : '—');
  rSpeed.set(`${fmt(pSpeed, 1)} s`);
  rPos.set(`${fmt(pPos, 1)} s`);
  let verdict: string;
  if (!Number.isFinite(period)) verdict = t('verdict.calm');
  else if (!yours) verdict = t('verdict.robot', { p: fmt(period, 1), e: fmt(pSpeed, 1) });
  else if (Math.abs(period - pPos) < Math.abs(period - pSpeed)) verdict = t('verdict.position', { p: fmt(period, 1) });
  else verdict = t('verdict.speed', { p: fmt(period, 1) });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rYours.el, rSpeed.el, rPos.el)), h('p', { class: 'w-status' }, verdict));
  plot.describe(verdict);
};

/** 10d: design a robot shower (PI) that beats your hands. Opens on June's mistake. */
const designer: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kp = JUNE_PI.kp;
  let ki = JUNE_PI.ki;
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
  // the loop's phase, so the phase-margin readout has a picture (arrow to −180°)
  const loopPlot = marginPlots(right, t, { withGain: false, height: 150, phaseMin: -540 });
  let loopFresh = true;
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
      // reduced motion: the whole run as a static trace
      const tr = runShower(piPolicy(kp, ki), 40);
      plot.set('T', tr.t, tr.T);
      plot.set('mix', tr.t, tr.u.map((u) => SHOWER.cold + KNOB_GAIN * u));
    }
  };
  const evaluate = () => {
    const m = loopPlot.show(piLoop(kp, ki), SHOWER.delay, loopFresh);
    loopFresh = false;
    const stable = m.gm > 1;
    const run = runShower(piPolicy(kp, ki), 40);
    const comfort = comfortTime(run);
    rPm.set(stable ? `${fmt(m.pm, 0)}°` : '—', stable && m.pm > 45 ? 'good' : 'bad');
    rGm.set(`× ${fmt(m.gm, 2)}`, m.gm > 2 ? 'good' : m.gm > 1 ? '' : 'bad');
    rComfort.set(Number.isFinite(comfort) ? `${fmt(comfort, 1)} s` : t('never'), comfort < 12 ? 'good' : 'bad');
    const beatsYou = !Number.isFinite(yourComfort) || comfort < yourComfort;
    const win = stable && m.pm > 45 && comfort < 12;
    const swing = swingPeriod(run);
    const over = Number.isFinite(swing) ? t('status.unstable', { g: fmt(m.gm, 2), p: fmt(swing, 1) }) : t('status.unstableSlow', { g: fmt(m.gm, 2) });
    status.textContent = !stable ? over : win ? (beatsYou ? t('status.win') : t('status.winButYou')) : m.pm <= 45 ? t('status.edge', { pm: fmt(m.pm, 0) }) : t('status.slow');
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
    plot.set('mix', tr.t, tr.u.map((u) => SHOWER.cold + KNOB_GAIN * u));
    const last = tr.t.length - 1;
    view.update({ u: tr.u[last], pipe: Array.from({ length: 30 }, () => SHOWER.cold + (SHOWER.hot - SHOWER.cold) * tr.u[last]), temp: tr.T[last] });
  };
  const change = () => {
    loopFresh = true;
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
      loopFresh = true;
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
    h('div', { class: 'w-row' }, preset(t('presetJune'), JUNE_PI.kp, JUNE_PI.ki), preset(t('presetHand'), 0, HAND_GAIN), preset(t('presetTheo'), THEO_PI.kp, THEO_PI.ki)),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rPm.el, rGm.el, rComfort.el, rYours.el), transport({ loop, onReset: restart, onStep: () => sim.advance(0.5) })),
    status,
    h('p', { class: 'w-help' }, t('goal')),
  );
  evaluate();
  restart();
  return () => loop.destroy();
};

export const widgets: Record<string, WidgetFactory> = { phase, bode, margins, replay, designer };
