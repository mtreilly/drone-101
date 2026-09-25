import './ch11.css';
import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { progress } from '../../core/progress';
import { DroneSim, type PID } from '../../sim/drone-model';
import type { WidgetFactory } from '../../story/types';
import { slider, toggle, transport } from '../../ui/controls';
import { DroneView } from '../../ui/drone-view';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { SPlane } from '../../ui/s-plane';
import { pid, type Trace } from '../ch09/pid-tools';
import { CRITERIA, LIMITS, MISSION, evaluate, missionConfig, missionPoles, runMission, type MissionResult } from './mission';

export const BEST_KEY = 'ch11.best';

/** June's "perfect in calm air" tune: flawless with a perfect sensor, chattering with a real one. */
export const JUNE_TUNE = { kp: 25, ki: 15, kd: 10, dTau: 0.005, dOnMeasurement: true };

interface Best {
  stars: number;
  kp: number;
  ki: number;
  kd: number;
  dTau: number;
  dOnMeasurement: boolean;
}

const emptyTrace = (): Trace => ({ t: [], h: [], thrust: [], integral: [], r: [], wind: [], pkg: [], measured: [], crashed: false });

/** The final mission sandbox. */
const mission: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const g = { kp: 10, ki: 0, kd: 1, dTau: 0.02, dOnMeasurement: true };
  const gains = (): PID => pid(g.kp, g.ki, g.kd, { dTau: g.dTau, dOnMeasurement: g.dOnMeasurement });
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid side' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const view = new DroneView(left, { hMax: 3, width: 240, showSensor: true });
  const clock = h('p', { class: 'w-status', 'aria-live': 'off' });
  left.append(clock);
  const hPlot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: MISSION.duration },
    y: { label: tc('plots.height'), min: 0, max: 3 },
    series: [
      { id: 'meas', color: 'pencil', label: t('measured'), width: 1 },
      { id: 'r', color: 'sp', dash: [6, 5], width: 1.8 },
      { id: 'h', color: 'out', label: tc('drone.height'), ghost: true },
    ],
    fillBetween: ['r', 'h', 'err'],
    height: 190,
    label: t('hAria'),
  });
  const events = [
    { kind: 'v' as const, at: MISSION.gust.start, color: 'dis', label: t('gust') },
    { kind: 'v' as const, at: MISSION.dropAt, color: 'dis', label: t('drop') },
  ];
  hPlot.setLines(events);
  hPlot.setBands([{ kind: 'h', from: MISSION.setpoint - LIMITS.band, to: MISSION.setpoint + LIMITS.band, color: 'rgba(45,122,50,0.14)' }]);
  const tPlot = new Plot(right, {
    x: { label: tc('plots.time'), min: 0, max: MISSION.duration },
    y: { label: tc('plots.thrust'), min: 0, max: 22 },
    series: [{ id: 'T', color: 'eff', label: tc('drone.thrust'), ghost: true, width: 1.6 }],
    height: 140,
    label: t('tAria'),
  });
  tPlot.setLines([{ kind: 'h', at: 20, color: 'ink3', dash: [2, 4], label: t('max') }, ...events.map((e) => ({ ...e, label: undefined }))]);

  // live simulation
  let sim = new DroneSim(missionConfig(gains()));
  let tr = emptyTrace();
  let acc = 0;
  let finished = false;
  const record = () => {
    tr.t.push(sim.t);
    tr.h.push(sim.h);
    tr.thrust.push(sim.thrust);
    tr.integral.push(sim.integral);
    tr.r.push(MISSION.setpoint);
    tr.wind.push(sim.cfg.wind(sim.t));
    tr.pkg.push(sim.cfg.extraMass(sim.t));
    tr.measured.push(sim.measured);
  };
  const draw = () => {
    hPlot.set('h', tr.t, tr.h);
    hPlot.set('r', tr.t, tr.r);
    hPlot.set('meas', tr.t, tr.measured);
    tPlot.set('T', tr.t, tr.thrust);
    const i = tr.t.length - 1;
    if (i >= 0) view.update({ h: tr.h[i], r: MISSION.setpoint, thrust: tr.thrust[i], wind: tr.wind[i], pkg: tr.pkg[i], crashed: tr.crashed, measured: tr.measured[i] });
    const now = tr.t[i] ?? 0;
    clock.textContent = now < MISSION.gust.start ? t('phase.takeoff', { s: fmt(now, 1) }) : now < MISSION.gust.end ? t('phase.gust', { s: fmt(now, 1) }) : now < MISSION.dropAt ? t('phase.hover', { s: fmt(now, 1) }) : now < MISSION.duration - 0.01 ? t('phase.drop', { s: fmt(now, 1) }) : t('phase.done');
  };
  const loop = new Loop((dt) => {
    if (finished) return;
    const steps = Math.round(Math.min(dt, MISSION.duration - sim.t) / sim.dt);
    for (let k = 0; k < steps; k++) {
      sim.step();
      acc++;
      if (acc % 10 === 0) record();
    }
    tr.crashed = sim.crashed;
    draw();
    if (sim.t >= MISSION.duration - 1e-9) finish();
    else showResult(evaluate(tr), false);
  }, host);

  // checklist
  const items = new Map<string, HTMLElement>();
  const list = h('ul', { class: 'checklist' });
  for (const id of CRITERIA) {
    const li = h('li', { 'data-state': 'pending' }, h('span', { class: 'mark', 'aria-hidden': 'true' }, '○'), h('span', { class: 'crit-text' }, t(`crit.${id}`, { ...LIMITS, gustCm: LIMITS.gust * 100, bandCm: LIMITS.band * 100 })), h('span', { class: 'crit-val' }));
    items.set(id, li);
    list.append(li);
  }
  const starsEl = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const bestEl = h('p', { class: 'w-help' });
  const values = (r: MissionResult): Record<string, string> => ({
    rise: Number.isFinite(r.rise) ? `${fmt(r.rise, 2)} s` : '—',
    overshoot: `${fmt(r.overshoot, 1)} %`,
    gust: `${fmt(r.gust * 100, 1)} cm`,
    recover: Number.isFinite(r.recover) ? `${fmt(r.recover, 2)} s` : '—',
    ground: r.ground ? t('touched') : t('clear'),
    calm: Number.isFinite(r.calm) ? `± ${fmt(r.calm, 2)} N` : '—',
  });
  function showResult(r: MissionResult, final: boolean): void {
    const v = values(r);
    const now = tr.t[tr.t.length - 1] ?? 0;
    const decided: Record<string, boolean> = {
      rise: r.pass.rise || now > LIMITS.rise,
      overshoot: now >= MISSION.gust.start,
      gust: now >= MISSION.dropAt,
      recover: final,
      ground: final || r.ground,
      calm: now >= 6,
    };
    for (const id of CRITERIA) {
      const li = items.get(id)!;
      const state = decided[id] || final ? (r.pass[id] ? 'pass' : 'fail') : 'pending';
      li.dataset.state = state;
      li.querySelector('.mark')!.textContent = state === 'pass' ? '★' : state === 'fail' ? '✗' : '○';
      li.querySelector('.crit-val')!.textContent = state === 'pending' ? '' : v[id];
    }
    if (final) {
      starsEl.textContent = `${'★'.repeat(r.stars)}${'☆'.repeat(6 - r.stars)}  ${r.stars === 6 ? t('gold') : t('stars', { n: r.stars })}`;
      starsEl.className = `w-status${r.stars === 6 ? ' good' : ''}`;
      const best = progress.load<Best>(BEST_KEY);
      if (!best || r.stars > best.stars) progress.save(BEST_KEY, { stars: r.stars, ...g });
      if (r.stars === 6) ctx.bus.emit('mission:gold');
      showBest();
    } else {
      starsEl.textContent = t('flying');
      starsEl.className = 'w-status';
    }
  }
  const showBest = () => {
    const best = progress.load<Best>(BEST_KEY);
    bestEl.textContent = best ? t('best', { n: best.stars, kp: fmt(best.kp, 0), ki: fmt(best.ki, 0), kd: fmt(best.kd, 1), tf: fmt(best.dTau, 3) }) : '';
  };

  function finish(): void {
    finished = true;
    loop.pause();
    tr.crashed = sim.crashed;
    draw();
    showResult(evaluate(tr), true);
  }

  const restart = (autoplay = Loop.autoplay) => {
    loop.pause();
    hPlot.clear();
    tPlot.clear();
    sim = new DroneSim(missionConfig(gains()));
    tr = emptyTrace();
    acc = 0;
    finished = false;
    record();
    draw();
    for (const li of items.values()) {
      li.dataset.state = 'pending';
      li.querySelector('.mark')!.textContent = '○';
      li.querySelector('.crit-val')!.textContent = '';
    }
    starsEl.textContent = t('ready');
    updatePoles();
    if (autoplay) loop.play();
  };
  const instant = () => {
    loop.pause();
    hPlot.clear();
    tPlot.clear();
    tr = runMission(gains());
    sim = new DroneSim(missionConfig(gains()));
    finished = true;
    draw();
    showResult(evaluate(tr), true);
  };

  // nominal poles
  const pRange = { reMin: -40, reMax: 5, imMax: 25 };
  const poleBox = h('div', { class: 'mission-poles' });
  const sp = new SPlane(poleBox, { ...pRange, label: t('splane'), regions: true, maxWidth: 240 });
  const poleNote = h('p', { class: 'w-help' });
  poleBox.append(poleNote);
  function updatePoles(): void {
    const ps = missionPoles(gains());
    let off = 0;
    sp.set(
      ps.map((p, i) => {
        const re = Math.max(pRange.reMin, Math.min(pRange.reMax, p.re));
        const im = Math.max(-pRange.imMax, Math.min(pRange.imMax, p.im));
        if (re !== p.re || im !== p.im) off++;
        return { id: `p${i}`, re, im, kind: 'pole' as const };
      }),
    );
    sp.describe();
    const unstable = ps.some((p) => p.re > 1e-9);
    poleNote.textContent = `${unstable ? t('poles.unstable') : t('poles.stable')}${off ? ` ${t('poles.off', { n: off })}` : ''}`;
  }

  const onChange = () => restart();
  const sKp = slider({ label: '$K_p$', min: 0, max: 50, step: 1, value: g.kp, unit: 'N/m', color: 'out', onInput: (v) => { g.kp = v; onChange(); } });
  const sKi = slider({ label: '$K_i$', min: 0, max: 50, step: 1, value: g.ki, unit: 'N/(m·s)', color: 'err', onInput: (v) => { g.ki = v; onChange(); } });
  const sKd = slider({ label: '$K_d$', min: 0, max: 12, step: 0.5, value: g.kd, unit: 'N·s/m', color: 'eff', onInput: (v) => { g.kd = v; onChange(); } });
  const sTf = slider({ label: t('filter'), min: 0.005, max: 0.2, step: 0.005, value: g.dTau, unit: 's', digits: 3, color: 'eff', onInput: (v) => { g.dTau = v; onChange(); } });
  const tg = toggle(t('dMeas'), g.dOnMeasurement, (v) => { g.dOnMeasurement = v; onChange(); });
  const setAll = (p: Omit<Best, 'stars'>) => {
    Object.assign(g, p);
    sKp.value = p.kp;
    sKi.value = p.ki;
    sKd.value = p.kd;
    sTf.value = p.dTau;
    tg.input.checked = p.dOnMeasurement;
    restart();
  };
  const juneBtn = h('button', { class: 'btn small', type: 'button' }, t('presetJune'));
  juneBtn.addEventListener('click', () => setAll({ ...JUNE_TUNE }));
  const instantBtn = h('button', { class: 'btn small', type: 'button' }, t('instant'));
  instantBtn.addEventListener('click', instant);
  right.append(transport({ loop, onReset: () => restart(true), onStep: () => {
    if (finished) return;
    for (let k = 0; k < 100; k++) {
      sim.step();
      acc++;
      if (acc % 10 === 0) record();
    }
    draw();
  } }));
  host.append(
    h('div', { class: 'w-controls' }, sKp.el, sKi.el, sKd.el, sTf.el),
    h('div', { class: 'w-row' }, tg.el, instantBtn, juneBtn),
    h('div', { class: 'mission-bottom' }, h('div', { class: 'mission-card' }, h('p', { class: 'w-title' }, t('checklist')), list, starsEl, bestEl), poleBox),
  );
  showBest();
  restart(false);
  if (Loop.autoplay) {
    // start when the learner reaches it, not while offscreen
    loop.play();
  } else instant();
  return () => loop.destroy();
};

export const widgets: Record<string, WidgetFactory> = { mission };
