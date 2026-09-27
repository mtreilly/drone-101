import './ch11.css';
import { h } from '../../core/dom';
import { fmt, getLang, percent, tc, unitLabel } from '../../core/i18n';
import { progress } from '../../core/progress';
import { DroneSim, type PID } from '../../sim/drone-model';
import type { WidgetFactory } from '../../story/types';
import { valueDir } from '../../core/bidi';
import { readout, slider, transport } from '../../ui/controls';
import { marginPlots } from '../../ui/margin-plots';
import { logspace } from '../../math/bode';
import { DroneView } from '../../ui/drone-view';
import { Loop } from '../../ui/loop';
import { Plot, type Band } from '../../ui/plot';
import { SPlane } from '../../ui/s-plane';
import '../ch09/ch09.css';
import { emptyTrace, pid, sampleTrace } from '../ch09/pid-tools';
import { starRow } from '../ch09/stars';
import { sameCeiling } from '../ch09/page-ceiling';
import { SIX_STAR } from './plays';
import { eigenvalues, stateMatrix, statePath } from './state';
import { tex } from '../../core/rich-text';
import { formatS } from '../../ui/s-plane';
import {
  CRITERIA,
  LIMITS,
  MISSION,
  evaluate,
  hintFor,
  keepTogether,
  sentences,
  missionConfig,
  missionLoop,
  missionMargins,
  missionPoles,
  neverBack,
  neverSettled,
  noiseLifted,
  JUNE_TUNE,
  WINDOWS,
  type CriterionId,
  type MissionResult,
  type MissionTrace,
} from './mission';
import { flyMission, missionStep, pageCeiling, withCeiling } from './page-hit';

export const BEST_KEY = 'ch11.best';

type Tune = typeof JUNE_TUNE;

interface Best extends Tune {
  stars: number;
  /**
   * Saves from before the "D from measurement" switch was removed carry it. It is ignored: the
   * target never jumps in this mission, so D on the error and D on the measurement fly the same.
   */
  dOnMeasurement?: boolean;
}

/** The final mission sandbox. */
const mission: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const g: Tune = { kp: 10, ki: 0, kd: 1, dTau: 0.02 };
  const gains = (): PID => pid(g.kp, g.ki, g.kd, { dTau: g.dTau });
  host.classList.add('pid-widget', 'mission-widget');
  host.append(h('p', { class: 'w-title' }, t('title')));

  // at-a-glance strip: what's happening, how far along, and how the checklist is going
  const phaseEl = h('span', { class: 'mission-phase' });
  const phaseLive = h('span', { class: 'visually-hidden', 'aria-live': 'polite' });
  const fill = h('span', { class: 'mission-fill' });
  const pct = (x: number) => `${(100 * x) / MISSION.duration}%`;
  const criterionVars = {
    rise: fmt(LIMITS.rise, 0),
    overshoot: fmt(LIMITS.overshoot, 0),
    recover: fmt(LIMITS.recover, 0),
    calm: fmt(LIMITS.calm, 1),
    gustCm: fmt(LIMITS.gust * 100, 0),
    bandCm: fmt(LIMITS.band * 100, 0),
  };
  const track = h(
    'span',
    { class: 'mission-track', 'aria-hidden': 'true' },
    h('span', { class: 'mission-gust', style: { left: pct(MISSION.gust.start), width: pct(MISSION.gust.end - MISSION.gust.start) } }),
    h('span', { class: 'mission-drop', style: { left: pct(MISSION.dropAt) } }),
    fill,
  );
  const minis = new Map<string, HTMLElement>();
  const miniRow = h(
    'span',
    { class: 'mission-minis', 'aria-hidden': 'true' },
    CRITERIA.map((id) => {
      const m = h('span', { class: 'mini', 'data-state': 'pending', title: keepTogether(t(`crit.${id}`, criterionVars)) }, '○');
      minis.set(id, m);
      return m;
    }),
  );
  host.append(h('div', { class: 'mission-strip' }, phaseEl, track, miniRow, phaseLive));

  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  // a tune that climbs far past the target flies out of the picture into the page: the sim hits it (page-hit.ts)
  const view = new DroneView(left, { hMax: 3, width: 240, showSensor: true, onCeiling: () => {} }, ctx.onCleanup);
  const ceil = pageCeiling(view, () => pageMoved());
  const hPlot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: MISSION.duration },
    y: { label: tc('plots.height'), min: 0, max: 3 },
    series: [
      { id: 'meas', color: 'pencil', label: t('measured'), width: 1 },
      { id: 'r', color: 'sp', dash: [6, 5], width: 1.8 },
      { id: 'h', color: 'out', label: tc('drone.height'), ghost: true, offArrows: true, offLabel: (v) => `↑ ${fmt(v, 1)} m` },
    ],
    fillBetween: ['r', 'h', 'err'],
    height: 190,
    label: t('hAria'),
  }, ctx.onCleanup);
  const events = [
    { kind: 'v' as const, at: MISSION.gust.start, color: 'dis', label: t('gust') },
    { kind: 'v' as const, at: MISSION.dropAt, color: 'dis', label: t('drop') },
  ];
  hPlot.setLines(events);
  const targetBand: Band = { kind: 'h', from: MISSION.setpoint - LIMITS.band, to: MISSION.setpoint + LIMITS.band, color: 'sp@0.16' };
  hPlot.setBands([targetBand]);
  // what the controller asked for (clipped to what the motors can be told) behind what the lagging motors deliver
  const tPlot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: MISSION.duration },
    y: { label: tc('plots.thrust'), min: -2, max: 23 },
    series: [
      { id: 'cmd', color: 'eff@0.4', label: t('asked'), width: 1 },
      { id: 'T', color: 'eff', label: t('delivered'), ghost: true, width: 1.8 },
    ],
    height: 150,
    label: t('tAria'),
  }, ctx.onCleanup);
  tPlot.setLines([
    { kind: 'h', at: 20, color: 'ink3', dash: [2, 4], label: t('max'), labelAt: 'start', labelSide: 'above' },
    { kind: 'h', at: 0, color: 'ink3', dash: [2, 4], label: t('min'), labelAt: 'start', labelSide: 'below' },
    ...events.map((e) => ({ ...e, label: undefined })),
  ]);
  /** shade the time window a checklist item judges, on both plots (null: none) */
  const showWindow = (id: CriterionId | null) => {
    const shade = (from: number, to: number): Band => ({ kind: 'v', from, to, color: 'ink3@0.14' });
    const w = id ? [shade(...WINDOWS[id])] : [];
    hPlot.setBands([targetBand, ...w]);
    tPlot.setBands(w);
  };

  // live simulation
  let sim = new DroneSim(missionConfig(gains()));
  let tr: MissionTrace = emptyTrace();
  let acc = 0;
  let finished = false;
  let lastPhase = '';
  /** the run on screen is a finished tune: the next new run keeps it as the ghost (plots and poles) */
  let fresh = false;
  const record = () => sampleTrace(sim, tr);
  const phaseKey = (now: number, done: boolean) =>
    done ? 'done' : now < MISSION.gust.start ? 'takeoff' : now < MISSION.gust.end ? 'gust' : now < MISSION.dropAt ? 'hover' : 'drop';
  const draw = () => {
    hPlot.set('h', tr.t, tr.h);
    hPlot.set('r', tr.t, tr.r);
    hPlot.set('meas', tr.t, tr.measured);
    tPlot.set('cmd', tr.t, tr.command);
    tPlot.set('T', tr.t, tr.thrust);
    const i = tr.t.length - 1;
    if (i >= 0) view.update({ h: tr.h[i], r: MISSION.setpoint, thrust: tr.thrust[i], wind: tr.wind[i], pkg: tr.pkg[i], crashed: tr.crashed, measured: tr.measured[i] });
    const now = tr.t[i] ?? 0;
    const key = phaseKey(now, now >= MISSION.duration - 0.01);
    phaseEl.textContent = t(`phase.${key}`, { s: fmt(now, 1) });
    phaseEl.dataset.phase = key;
    if (key !== lastPhase) {
      lastPhase = key;
      phaseLive.textContent = t(`phase.${key}`, { s: fmt(now, 0) });
    }
    fill.style.transform = `scaleX(${Math.min(1, now / MISSION.duration)})`;
  };
  /** keep the live sim's ceiling on the page's current layout while it could still reach it */
  const aim = () => {
    if (sim.ceilingAt === null && sim.h > 2.5) sim.cfg.ceiling = withCeiling(sim.cfg, ceil.measure()).ceiling;
  };
  const loop = new Loop((dt) => {
    if (finished) return;
    aim();
    const steps = Math.round(Math.min(dt, MISSION.duration - sim.t) / sim.dt);
    for (let k = 0; k < steps; k++) {
      missionStep(sim);
      acc++;
      if (acc % 10 === 0) record();
    }
    tr.crashed = sim.crashed;
    tr.stalledAt = sim.stalled && sim.ceilingAt !== null ? sim.ceilingAt : null;
    draw();
    if (sim.t >= MISSION.duration - 1e-9) finish();
    else showResult(evaluate(tr), false, true);
  }, host);

  // checklist: each item says pass/fail to screen readers too, and shows its time window on the plots
  const items = new Map<string, HTMLElement>();
  const list = h('ul', { class: 'checklist' });
  for (const id of CRITERIA) {
    const li = h(
      'li',
      { 'data-state': 'pending', tabindex: '0' },
      h('span', { class: 'mark', 'aria-hidden': 'true' }, '○'),
      h('span', { class: 'crit-text' }, keepTogether(t(`crit.${id}`, criterionVars))),
      h('span', { class: 'crit-val' }),
      h('span', { class: 'visually-hidden crit-state' }, t('state.pending')),
    );
    li.addEventListener('pointerenter', () => showWindow(id));
    li.addEventListener('pointerleave', () => showWindow(li.contains(document.activeElement) ? id : null));
    li.addEventListener('focus', () => showWindow(id));
    li.addEventListener('blur', () => showWindow(null));
    items.set(id, li);
    list.append(li);
  }
  const starsEl = h('p', { class: 'w-status score-line', 'aria-live': 'polite' });
  const row = starRow(6, (n) => t('stars', { n }));
  const starsText = h('span');
  starsEl.append(row.el, starsText);
  const bestEl = h('p', { class: 'w-help' });
  const values = (r: MissionResult): Record<string, string> => ({
    rise: !Number.isFinite(r.rise) ? '—' : neverSettled(r) ? t('crit.neverRise', { s: fmt(MISSION.gust.start, 0) }) : `${fmt(r.rise, 2)} s`,
    overshoot: percent(r.overshoot, 1),
    gust: `${fmt(r.gust * 100, 1)} cm`,
    recover: !Number.isFinite(r.recover) ? '—' : neverBack(r) ? t('crit.neverBack', { s: fmt(MISSION.duration, 0) }) : `${fmt(r.recover, 2)} s`,
    ground: r.ground ? t('touched') : t('clear'),
    calm: Number.isFinite(r.calm) ? `${fmt(r.calm, 2)} N` : '—',
  });
  const MARK: Record<string, string> = { pass: '★', fail: '✗', pending: '○' };
  const setState = (el: HTMLElement, mark: HTMLElement, state: string, animate: boolean) => {
    if (el.dataset.state === state) return;
    el.dataset.state = state;
    mark.textContent = MARK[state];
    const sr = el.querySelector('.crit-state');
    if (sr) sr.textContent = t(`state.${state}`);
    mark.classList.remove('pop');
    if (animate && state !== 'pending') {
      void mark.offsetWidth;
      mark.classList.add('pop');
    }
  };
  /** the line under the score: why the drone hit the page, or what to fix first */
  const advice = (r: MissionResult): string => {
    if (sim.ceilingAt !== null) return sentences(t('hitPage'), noiseLifted(g) ? t('hitNoise') : '');
    const hint = hintFor(r, g);
    return hint ? t(`hint.${hint}`) : '';
  };
  /** @param animate pop marks as they are decided (live flights only) */
  function showResult(r: MissionResult, final: boolean, animate: boolean, save = final): void {
    const v = values(r);
    const now = tr.t[tr.t.length - 1] ?? 0;
    const decided: Record<string, boolean> = {
      rise: now >= MISSION.gust.start,
      overshoot: now >= MISSION.gust.start,
      gust: now >= MISSION.dropAt,
      recover: final,
      ground: final || r.ground,
      calm: now >= 6,
    };
    for (const id of CRITERIA) {
      const li = items.get(id)!;
      const state = decided[id] || final ? (r.pass[id] ? 'pass' : 'fail') : 'pending';
      setState(li, li.querySelector<HTMLElement>('.mark')!, state, animate);
      const mini = minis.get(id)!;
      setState(mini, mini, state, animate);
      // "89.4 cm" is one isolated left-to-right run, "لم تعد بحلول 20 ث" a right-to-left one
      const text = state === 'pending' ? '' : v[id];
      const val = li.querySelector<HTMLElement>('.crit-val')!;
      if (val.textContent !== text) val.replaceChildren(text ? h('bdi', { dir: valueDir(text) }, text) : '');
    }
    if (final) {
      row.set(CRITERIA.map((id) => r.pass[id]));
      const more = advice(r);
      starsText.textContent = keepTogether(sentences(r.stars === 6 ? t('gold') : t('stars', { n: r.stars }), more));
      starsEl.className = `w-status score-line${r.stars === 6 ? ' good' : ''}`;
      if (save) {
        const best = progress.load<Best>(BEST_KEY);
        if (!best || r.stars > best.stars) progress.save(BEST_KEY, { stars: r.stars, ...g });
        if (r.stars === 6) ctx.bus.emit('mission:gold');
        showBest();
      }
    } else {
      row.set([]);
      const txt = sim.ceilingAt === null ? t('flying') : t('hitPage');
      if (starsText.textContent !== txt) starsText.textContent = txt;
      starsEl.className = 'w-status score-line';
    }
  }
  const showBest = () => {
    const best = progress.load<Best>(BEST_KEY);
    const text = best ? t('best', { n: best.stars, kp: fmt(best.kp, 0), ki: fmt(best.ki, 0), kd: fmt(best.kd, 1), tf: fmt(best.dTau, 3) }) : '';
    // the tune in brackets wraps only as a whole (a break inside it scatters its pieces in right-to-left text)
    bestEl.textContent = text.replace(/[(（][^()（）]*[)）]/u, (m) => m.replace(/ /g, '\u00a0'));
  };

  function finish(): void {
    finished = true;
    loop.pause();
    tr.crashed = sim.crashed;
    tr.stalledAt = sim.stalled && sim.ceilingAt !== null ? sim.ceilingAt : null;
    draw();
    showResult(evaluate(tr), true, true);
  }

  const resetMarks = () => {
    for (const id of CRITERIA) {
      const li = items.get(id)!;
      setState(li, li.querySelector<HTMLElement>('.mark')!, 'pending', false);
      li.querySelector('.crit-val')!.textContent = '';
      setState(minis.get(id)!, minis.get(id)!, 'pending', false);
    }
  };
  /** a new run replaces the one on screen; a finished tune stays behind as the ghost */
  const newRun = (committed: boolean) => {
    loop.pause();
    hPlot.clear(fresh);
    tPlot.clear(fresh);
    if (fresh) sp.ghost();
    fresh = committed;
  };
  const restart = (autoplay = Loop.autoplay) => {
    newRun(true);
    sim = new DroneSim(withCeiling(missionConfig(gains()), ceil.measure()));
    tr = emptyTrace();
    acc = 0;
    finished = false;
    record();
    draw();
    resetMarks();
    row.set([]);
    starsText.textContent = t('ready');
    updatePoles();
    if (autoplay) loop.play();
  };
  /**
   * The whole mission at once: "Fly instantly", keyboard steps, reduced motion (`save`), and the
   * preview while a slider is dragged (not saved, and not a finished tune yet).
   */
  const instant = (save = true, committed = save) => {
    newRun(committed);
    ({ tr, sim } = flyMission(gains(), ceil.measure()));
    finished = true;
    draw();
    resetMarks();
    updatePoles();
    showResult(evaluate(tr), true, false, save);
  };

  // nominal poles, at their true values (a fast one off the left edge becomes an arrow with its value)
  const pRange = { reMin: -40, reMax: 5, imMax: 25 };
  const poleBox = h('div', { class: 'mission-poles' });
  const sp = new SPlane(poleBox, { ...pRange, label: t('splane'), regions: true, maxWidth: 340, reLabel: 'σ', imLabel: 'ω' }, ctx.onCleanup);
  const poleNote = h('p', { class: 'w-help' });
  poleBox.append(poleNote);
  function updatePoles(): void {
    const ps = missionPoles(gains());
    sp.set(ps.map((p, i) => ({ id: `p${i}`, re: p.re, im: p.im, kind: 'pole' as const })));
    sp.describe();
    const off = ps.filter((p) => p.re < pRange.reMin).length;
    const unstable = ps.some((p) => p.re > 1e-9);
    const marginal = ps.some((p) => p.re >= -1e-9);
    const offText = off ? t(new Intl.PluralRules(getLang()).select(off) === 'one' ? 'poles.off_one' : 'poles.off_other', { n: fmt(off, 0) }) : '';
    poleNote.textContent = sentences(unstable ? t('poles.unstable') : marginal ? t('poles.marginal') : t('poles.stable'), offText);
  }

  // dragging previews the whole mission instantly; letting go of a pointer drag flies it live
  let pointer = false;
  const onDrag = () => instant(false);
  const sKp = slider({ label: '$K_p$', min: 0, max: 50, step: 1, value: g.kp, unit: 'N/m', color: 'eff', onInput: (v) => { g.kp = v; onDrag(); } });
  const sKi = slider({ label: '$K_i$', min: 0, max: 50, step: 1, value: g.ki, unit: 'N/(m·s)', color: 'eff', onInput: (v) => { g.ki = v; onDrag(); } });
  const sKd = slider({ label: '$K_d$', min: 0, max: 12, step: 0.5, value: g.kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { g.kd = v; onDrag(); } });
  const sTf = slider({ label: t('filter'), min: 0.005, max: 0.2, step: 0.005, value: g.dTau, unit: 's', digits: 3, color: 'eff', onInput: (v) => { g.dTau = v; onDrag(); } });
  for (const sl of [sKp, sKi, sKd, sTf]) {
    sl.input.addEventListener('pointerdown', () => (pointer = true));
    sl.input.addEventListener('change', () => {
      if (pointer && Loop.autoplay) restart(true);
      else if (finished && !fresh && sameCeiling(ceil.measure(), sim.cfg.ceiling?.h ?? null)) {
        // Input already computed this flight. Commit its score/ghost without flying it twice.
        fresh = true;
        showResult(evaluate(tr), true, false);
      } else instant(true);
      pointer = false;
    });
  }
  const setAll = (p: Tune) => {
    Object.assign(g, p);
    sKp.value = p.kp;
    sKi.value = p.ki;
    sKd.value = p.kd;
    sTf.value = p.dTau;
    restart();
  };
  const juneBtn = h('button', { class: 'btn small', type: 'button' }, t('presetJune'));
  juneBtn.addEventListener('click', () => setAll({ ...JUNE_TUNE }));
  const instantBtn = h('button', { class: 'btn small', type: 'button' }, t('instant'));
  instantBtn.addEventListener('click', () => instant(true));
  const controls = transport({
    loop,
    onReset: () => restart(true),
    onStep: () => {
      if (finished) return;
      aim();
      for (let k = 0; k < 100; k++) {
        missionStep(sim);
        acc++;
        if (acc % 10 === 0) record();
      }
      draw();
    },
  });
  // pressing play on a finished mission flies it again
  loop.onChange((playing) => {
    if (playing && finished) restart(true);
  });
  host.append(
    h('div', { class: 'w-controls compact' }, sKp.el, sKi.el, sKd.el, sTf.el),
    h('div', { class: 'w-row' }, instantBtn, juneBtn),
    h('div', { class: 'w-hud' }, starsEl, controls),
    h('div', { class: 'mission-bottom' }, h('div', { class: 'mission-card' }, h('p', { class: 'w-title' }, t('checklist')), list, bestEl), poleBox),
  );
  showBest();
  if (Loop.autoplay) {
    restart(false);
    loop.play();
  } else instant(false, true);
  /** the page moved: a finished flight whose hit depends on it is flown again under the new layout */
  function pageMoved(): void {
    if (!finished || (sim.ceilingAt === null && (ceil.h === null || Math.max(...tr.h) < ceil.h))) return;
    // the same tune under the new layout: the ghost stays what it was
    const keep = fresh;
    fresh = false;
    instant(false, keep);
  }
  return () => {
    loop.destroy();
    ceil.destroy();
  };
};

const DRONE_WS = logspace(0, 2, 300);

/**
 * 11a′: the drone's own Bode plot (Chapter 10's picture for Chapter 11's loop), the six-star tune
 * with a motor lag you can change. The faint ghost is the loop without the lag: it never reaches
 * −180°, so it has no gain margin at all; the lag bends the phase down to a cliff.
 */
const droneBode: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let tm = MISSION.motorTau;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const plots = marginPlots(ctx.onCleanup, host, t, { ws: DRONE_WS, gainMin: 0.005, gainMax: 50, phaseMin: -270, phaseMax: -90 });
  const rWc = readout(t('wc'));
  const rPm = readout(t('pm'), 'out');
  const rLag = readout(t('lag'), 'eff');
  const rGm = readout(t('gm'), 'err');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const none = missionMargins(SIX_STAR, 0);
  let fresh = true;
  const say = () => {
    const m = missionMargins(SIX_STAR, tm);
    const text =
      tm === 0
        ? t('noLag', { wc: fmt(none.wc, 1), pm: fmt(none.pm, 0) })
        : t('withLag', { wc: fmt(m.wc, 1), lag: fmt(m.lag, 0), pm: fmt(m.pm, 0), pm0: fmt(none.pm, 0), gm: fmt(m.gm, 1) });
    if (status.textContent !== text) status.textContent = text;
  };
  const update = () => {
    // the ghost is the loop without a motor lag: drawn first, then kept as the ghost when the real
    // loop replaces it, and never overwritten by later slider moves
    if (fresh) plots.show(missionLoop(SIX_STAR, 0), 0, false);
    const m = plots.show(missionLoop(SIX_STAR, tm), 0, fresh);
    fresh = false;
    rWc.set(`${fmt(m.wc, 1)} ${unitLabel('rad/s')}`);
    rPm.set(`${fmt(m.pm, 0)}°`, m.pm > 45 ? 'good' : m.pm < 25 ? 'bad' : '');
    rLag.set(`${fmt(missionMargins(SIX_STAR, tm).lag, 0)}°`);
    rGm.set(Number.isFinite(m.gm) && m.gm !== null ? `× ${fmt(m.gm, 1)}` : t('noCliff'));
    plots.gain?.describe(t('describe', { pm: fmt(m.pm, 0), wc: fmt(m.wc, 1) }));
  };
  const sT = slider({ label: t('tm'), min: 0, max: 0.1, step: 0.01, value: tm, unit: 's', digits: 2, color: 'eff', onInput: (v) => ((tm = v), update()), onSettle: say });
  host.classList.add('pid-widget');
  host.append(h('div', { class: 'w-controls' }, sT.el), h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rWc.el, rPm.el, rLag.el, rGm.el)), status, h('p', { class: 'w-help' }, t('help')));
  update();
  say();
};

/**
 * 11d: the state plane. The drone's height error and speed as one moving point; its path under PD
 * control, the matrix A that moves it, and, when the poles are real, the two straight mode lines.
 */
const statePlane: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kp = 20;
  let kd = 0;
  let at = 0.4;
  const T = 6;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const eq = h('div', { class: 'math-block state-eq' });
  host.append(eq);
  const grid = h('div', { class: 'w-grid two' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const plane = new Plot(left, {
    x: { label: t('dh'), min: -1.2, max: 1.2 },
    y: { label: t('v'), min: -6, max: 6 },
    series: [
      { id: 'modeA', color: 'ink3', label: t('mode'), dash: [5, 4], width: 1.5 },
      { id: 'modeB', color: 'ink3', dash: [5, 4], width: 1.5 },
      { id: 'path', color: 'out', label: t('path'), ghost: true },
    ],
    height: 260,
    label: t('planeAria'),
  }, ctx.onCleanup);
  plane.setLines([
    { kind: 'h', at: 0, color: 'ink3', width: 1 },
    { kind: 'v', at: 0, color: 'ink3', width: 1 },
  ]);
  const time = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: T },
    y: { label: t('dh'), min: -1.2, max: 1.2 },
    series: [{ id: 'dh', color: 'out', label: t('height'), ghost: true }],
    height: 200,
    label: t('timeAria'),
  }, ctx.onCleanup);
  time.setLines([{ kind: 'h', at: 0, color: 'sp', dash: [6, 4], label: t('target') }]);
  const rPoles = readout(t('poles'));
  const rState = readout(t('state'), 'out');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  right.append(h('div', { class: 'readouts' }, rPoles.el, rState.el), status);
  let fresh = true;
  const say = () => {
    const [p1, p2] = eigenvalues(kp, kd);
    const real = Math.abs(p1.im) < 1e-9;
    const text = t(real ? 'real' : 'spiral', { p: real ? `${formatS(p1.re, 0)}, ${formatS(p2.re, 0)}` : formatS(p1.re, Math.abs(p1.im), true) });
    if (status.textContent !== text) status.textContent = text;
  };
  const update = () => {
    const [[, a12], [a21, a22]] = stateMatrix(kp, kd);
    const n = (v: number) => fmt(v, Number.isInteger(v) ? 0 : 1);
    eq.innerHTML = tex(`A = \\begin{pmatrix} 0 & ${n(a12)} \\\\ ${n(a21)} & ${n(a22)} \\end{pmatrix}`, true);
    const path = statePath(kp, kd, T);
    plane.clear(fresh);
    time.clear(fresh);
    fresh = false;
    plane.set('path', path.dh, path.v);
    time.set('dh', path.t, path.dh);
    const [p1, p2] = eigenvalues(kp, kd);
    // real poles: along the direction (1, λ) the state slides straight in at rate λ (a mode)
    const line = (l: number): [number[], number[]] => [[-1.2, 1.2], [-1.2 * l, 1.2 * l]];
    if (Math.abs(p1.im) < 1e-9) {
      plane.set('modeA', ...line(p1.re));
      plane.set('modeB', ...line(p2.re));
    } else {
      plane.set('modeA', [], []);
      plane.set('modeB', [], []);
    }
    const i = Math.min(path.t.length - 1, Math.round(at / 0.002));
    plane.setMarkers([{ x: path.dh[i], y: path.v[i], color: 'out', clamp: true }]);
    time.setCursor(path.t[i]);
    rPoles.set(Math.abs(p1.im) < 1e-9 ? `${formatS(p1.re, 0)}, ${formatS(p2.re, 0)}` : formatS(p1.re, Math.abs(p1.im), true));
    rState.set(`(${fmt(path.dh[i], 2)} ${unitLabel('m')}, ${fmt(path.v[i], 2)} ${unitLabel('m/s')})`);
    plane.describe(t('describe', { kp: n(kp), kd: n(kd), t: fmt(path.t[i], 1), h: fmt(path.dh[i], 2), v: fmt(path.v[i], 2) }));
  };
  const sKp = slider({ label: t('kp'), min: 1, max: 50, step: 1, value: kp, unit: 'N/m', color: 'eff', onInput: (v) => ((kp = v), update()), onSettle: say });
  const sKd = slider({ label: t('kd'), min: 0, max: 12, step: 0.1, value: kd, unit: 'N·s/m', color: 'eff', onInput: (v) => ((kd = v), update()), onSettle: say });
  const sT = slider({ label: t('at'), min: 0, max: T, step: 0.02, value: at, unit: 's', onInput: (v) => ((at = v), update()) });
  for (const el of [sKp.input, sKd.input]) el.addEventListener('change', () => (fresh = true));
  host.append(h('div', { class: 'w-controls' }, sKp.el, sKd.el, sT.el), h('p', { class: 'w-help' }, t('help')));
  update();
  say();
};

export const widgets: Record<string, WidgetFactory> = { mission, droneBode, statePlane };
