import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { progress } from '../../core/progress';
import { SHOWER, ShowerSim, knobFor, type ShowerPolicy } from '../../sim/shower-model';
import type { WidgetCtx, WidgetFactory } from '../../story/types';
import { readout, segmented, slider, transport } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { ShowerView } from '../../ui/shower-view';

export interface SavedShowerRun {
  t: number[];
  T: number[];
  u: number[];
}

export const SHOWER_RUN_KEY = 'ch0.run';
const DURATION = 60;
const GOAL = 10;

/** Robot hands: turn the knob at a speed proportional to how wrong it feels. */
export const HAND_GAIN = 0.008;
export const policies: Record<'normal' | 'harder' | 'patient', ShowerPolicy> = {
  normal: { kind: 'rate', rate: (_t, felt) => HAND_GAIN * (SHOWER.target - felt) },
  harder: { kind: 'rate', rate: (_t, felt) => 2 * HAND_GAIN * (SHOWER.target - felt) },
  patient: { kind: 'position', position: () => knobFor(SHOWER.target) },
};

function viewLabels(t: WidgetCtx['t']) {
  return {
    aria: t('view.aria'),
    knob: t('view.knob'),
    cold: t('view.cold'),
    hot: t('view.hot'),
    pipe: t('view.pipe'),
    head: t('view.head'),
    thermo: t('view.thermo'),
  };
}

function tempPlot(host: HTMLElement, t: WidgetCtx['t'], label: string): Plot {
  const p = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: DURATION },
    y: { label: tc('plots.temp'), min: 10, max: 62 },
    series: [
      { id: 'T', color: 'out', label: t('plot.temp'), ghost: true },
      { id: 'mix', color: 'eff', label: t('plot.mix'), width: 1.6, dash: [2, 3] },
    ],
    height: 230,
    label,
  });
  p.setBands([{ kind: 'h', from: SHOWER.target - SHOWER.band, to: SHOWER.target + SHOWER.band, color: 'rgba(45,122,50,0.14)' }]);
  p.setLines([{ kind: 'h', at: SHOWER.target, color: 'sp', label: '38 °C' }]);
  return p;
}

/** The opening game: control the shower by hand. */
const manual: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const sim = new ShowerSim(SHOWER, { kind: 'manual' }, 0);
  let state: 'ready' | 'running' | 'done' = 'ready';
  let streak = 0;
  let crossings = 0;
  let lastSide = Math.sign(sim.temp - SHOWER.target);
  let won = NaN;
  let rec: SavedShowerRun = { t: [], T: [], u: [] };
  let acc = 0;

  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  const view = new ShowerView(left, {
    labels: viewLabels(t),
    onKnob: (u) => {
      sim.u = u;
      if (state === 'ready') start();
    },
  });
  const plot = tempPlot(right, t, t('plot.aria'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' }, t('status.ready'));
  const rTime = readout(t('readout.time'));
  const rStreak = readout(t('readout.streak'), 'sp');
  const rCross = readout(t('readout.crossings'), 'err');
  const startBtn = h('button', { class: 'btn primary small', type: 'button' }, t('start'));
  const resetBtn = h('button', { class: 'btn small', type: 'button' }, tc('transport.reset'));
  right.append(h('div', { class: 'readouts' }, rTime.el, rStreak.el, rCross.el), status, h('div', { class: 'w-row' }, startBtn, resetBtn));
  host.append(h('p', { class: 'w-help' }, t('help')));

  const loop = new Loop((dt) => {
    if (state !== 'running') return;
    sim.advance(dt, undefined);
    const side = Math.sign(sim.temp - SHOWER.target);
    if (side !== 0 && side !== lastSide && lastSide !== 0) crossings++;
    if (side !== 0) lastSide = side;
    if (Math.abs(sim.temp - SHOWER.target) <= SHOWER.band) streak += dt;
    else streak = 0;
    if (streak >= GOAL && Number.isNaN(won)) {
      won = sim.t;
      status.textContent = t('status.won', { t: fmt(won, 1), n: crossings });
      status.className = 'w-status good';
    }
    acc += dt;
    if (acc >= 0.1) {
      acc = 0;
      plot.push('T', sim.t, sim.temp);
      plot.push('mix', sim.t, sim.mix(sim.u));
      rec.t.push(round(sim.t));
      rec.T.push(round(sim.temp));
      rec.u.push(round(sim.u, 3));
    }
    view.update({ u: sim.u, pipe: sim.pipeProfile(30), temp: sim.temp }, dt);
    rTime.set(`${fmt(sim.t, 1)} s`);
    rStreak.set(`${fmt(streak, 1)} / ${GOAL} s`, streak >= GOAL ? 'good' : '');
    rCross.set(String(crossings));
    if (state === 'running' && Number.isNaN(won) && streak > 0.5 && streak < GOAL) {
      status.textContent = t('status.inband');
      status.className = 'w-status';
    } else if (state === 'running' && Number.isNaN(won) && streak === 0) {
      status.textContent = sim.temp > SHOWER.target ? t('status.hot') : t('status.cold');
      status.className = 'w-status';
    }
    if (sim.t >= DURATION) finish();
  }, host);

  function start(): void {
    if (state === 'running') return;
    state = 'running';
    startBtn.disabled = true;
    status.textContent = t('status.go');
    loop.play();
  }

  function finish(): void {
    state = 'done';
    loop.pause();
    progress.save(SHOWER_RUN_KEY, rec);
    ctx.bus.emit('shower:done', { won, crossings });
    if (Number.isNaN(won)) {
      status.textContent = t('status.timeup', { n: crossings });
      status.className = 'w-status bad';
    }
  }

  function reset(): void {
    loop.pause();
    if (state !== 'ready' && rec.t.length > 20) progress.save(SHOWER_RUN_KEY, rec);
    sim.reset(0);
    state = 'ready';
    streak = 0;
    crossings = 0;
    lastSide = Math.sign(sim.temp - SHOWER.target);
    won = NaN;
    rec = { t: [], T: [], u: [] };
    plot.clear();
    view.setKnob(0);
    view.update({ u: 0, pipe: sim.pipeProfile(30), temp: sim.temp });
    startBtn.disabled = false;
    status.textContent = t('status.ready');
    status.className = 'w-status';
    rTime.set('0 s');
    rStreak.set(`0 / ${GOAL} s`);
    rCross.set('0');
  }

  startBtn.addEventListener('click', () => {
    start();
    (view.knob as unknown as HTMLElement).focus();
  });
  resetBtn.addEventListener('click', reset);
  reset();
  return () => loop.destroy();
};

/** Three robot hands with different habits. */
const robots: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  type Hand = keyof typeof policies;
  let hand: Hand = 'normal';
  let sim = new ShowerSim(SHOWER, policies[hand], 0);
  let acc = 0;
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  const view = new ShowerView(left, { labels: viewLabels(t) });
  const plot = tempPlot(right, t, t('plot.aria'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const loop = new Loop((dt) => {
    sim.advance(dt);
    acc += dt;
    if (acc >= 0.1) {
      acc = 0;
      plot.push('T', sim.t, sim.temp);
      plot.push('mix', sim.t, sim.mix(sim.u));
    }
    view.update({ u: sim.u, pipe: sim.pipeProfile(30), temp: sim.temp }, dt);
    if (sim.t >= DURATION) {
      loop.pause();
      status.textContent = t(`result.${hand}`);
    }
  }, host);
  loop.speed = 2;
  const reset = () => {
    loop.pause();
    sim = new ShowerSim(SHOWER, policies[hand], 0);
    plot.clear();
    view.update({ u: 0, pipe: sim.pipeProfile(30), temp: sim.temp });
    status.textContent = t(`intro.${hand}`);
  };
  const seg = segmented(
    t('choose'),
    (['normal', 'harder', 'patient'] as Hand[]).map((v) => ({ value: v, label: t(`hand.${v}`) })),
    hand,
    (v) => {
      hand = v;
      reset();
      loop.play();
    },
  );
  host.append(h('p', { class: 'w-title' }, t('title')), seg.el, grid);
  right.append(status, transport({ loop, onReset: reset, onStep: () => sim.advance(0.5) }));
  const off = ctx.bus.on('predict:ch0-harder', () => {
    hand = 'harder';
    seg.set('harder');
    reset();
    loop.play();
  });
  reset();
  return () => {
    off();
    loop.destroy();
  };
};

/** Slide the knob curve later until it lines up with the temperature curve. */
const lag: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const saved = progress.load<SavedShowerRun>(SHOWER_RUN_KEY);
  let data: SavedShowerRun;
  let source: string;
  if (saved && saved.t.length > 50 && saved.u.some((u) => u > 0.05)) {
    data = saved;
    source = t('sourceYours');
  } else {
    const sim = new ShowerSim(SHOWER, policies.normal, 0);
    data = { t: [], T: [], u: [] };
    sim.advance(40, () => {
      data.t.push(sim.t);
      data.T.push(sim.temp);
      data.u.push(sim.u);
    }, 20);
    source = t('sourceRobot');
  }
  const tMax = Math.min(DURATION, data.t[data.t.length - 1] ?? 40);
  const plot = new Plot(host, {
    x: { label: tc('plots.time'), min: 0, max: tMax },
    y: { label: tc('plots.temp'), min: 10, max: 62 },
    series: [
      { id: 'mix', color: 'eff', label: t('plot.mix'), width: 2.2 },
      { id: 'T', color: 'out', label: t('plot.temp') },
    ],
    height: 230,
    label: t('plot.aria'),
  });
  const mixOf = (u: number) => SHOWER.cold + (SHOWER.hot - SHOWER.cold) * u;
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const dtData = data.t[1] - data.t[0];
  /** RMS gap between the shifted knob-mix curve and the temperature curve */
  const gap = (shift: number): number => {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < data.t.length; i++) {
      const j = Math.round((data.t[i] - shift) / dtData);
      if (j < 0) continue;
      if (j >= data.u.length) break;
      const d = mixOf(data.u[j]) - data.T[i];
      sum += d * d;
      n++;
    }
    return Math.sqrt(sum / Math.max(1, n));
  };
  let best = 0;
  for (let sh = 0; sh <= 6; sh += 0.1) if (gap(sh) < gap(best)) best = sh;
  const draw = (shift: number) => {
    plot.set(
      'mix',
      data.t.map((x) => x + shift),
      data.u.map(mixOf),
    );
    plot.set('T', data.t, data.T);
    const matched = Math.abs(shift - best) <= 0.35;
    status.textContent = matched ? t('status.match', { s: fmt(shift, 1) }) : t('status.mismatch', { e: fmt(gap(shift), 1) });
    status.className = `w-status${matched ? ' good' : ''}`;
  };
  const sl = slider({ label: t('slider'), min: 0, max: 6, step: 0.1, value: 0, unit: 's', color: 'eff', onInput: draw });
  host.prepend(h('p', { class: 'w-title' }, t('title')));
  host.append(h('p', { class: 'w-help' }, source), h('div', { class: 'w-controls' }, sl.el), status);
  draw(0);
};

const round = (v: number, d = 2): number => Math.round(v * 10 ** d) / 10 ** d;

export const widgets: Record<string, WidgetFactory> = { manual, robots, lag };
