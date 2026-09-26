import { h, prefersReducedMotion } from '../../core/dom';
import { fmt } from '../../core/i18n';
import { HOVER_THRUST } from '../../sim/drone-model';
import type { WidgetFactory } from '../../story/types';
import { readout, slider, transport } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { Plot } from '../../ui/plot';
import { droneRig } from '../ch01/rig';
import './ch02.css';
import { LIFTOFF_KP, RUN, TARGET, challengeBounds, droopOf, overshootOf, runP, type PRun } from './model';

/** Kp slider + drone taking off under pure proportional control (recorded run, played back in real time). */
const pcontrol: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let run: PRun = runP(20);
  let playT = 0;
  let idx = 0;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const rig = droneRig(host, {
    tMax: RUN,
    hMax: 3.5,
    thrustMin: -10,
    thrustMax: 45,
    heightLabel: t('plot.height'),
    thrustLabel: t('plot.thrust'),
    aria: t('plot.aria'),
    errorBand: true,
  });
  const rFinal = readout(t('readout.final'), 'out');
  const rDroop = readout(t('readout.droop'), 'err');
  const rOver = readout(t('readout.overshoot'));
  const rPeakT = readout(t('readout.peakThrust'), 'eff');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  rig.right.append(h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rFinal.el, rDroop.el, rOver.el, rPeakT.el)));

  const showMetrics = () => {
    const peakT = Math.max(...run.T);
    rPeakT.set(`${fmt(peakT, 0)} N`);
    if (!run.tookOff) {
      rFinal.set('0.00 m');
      rDroop.set(`${fmt(TARGET, 2)} m`, 'bad');
      rOver.set('—');
      status.textContent = t('status.ground', { T: fmt(2 * run.kp, 1), w: fmt(HOVER_THRUST, 1) });
    } else {
      rFinal.set(`${fmt(run.final, 2)} m`);
      rDroop.set(`${fmt(run.droop * 100, 0)} cm`, run.droop < 0.2 ? 'good' : 'bad');
      rOver.set(`${fmt(run.overshoot, 0)} %`, run.overshoot < 30 ? 'good' : 'bad');
      status.textContent = t('status.flies', { h: fmt(run.final, 2), d: fmt(run.droop * 100, 0), o: fmt(run.overshoot, 0), p: fmt(run.peak, 2) });
    }
    rig.hPlot.describe(status.textContent ?? '');
    rig.hPlot.setLines([{ kind: 'h', at: TARGET, color: 'sp', label: t('plot.target') }]);
    rig.hPlot.setDroop(run.tookOff ? { target: TARGET, settle: run.final, band: false, label: TARGET - run.final > 0.3 ? t('plot.hovers', { h: fmt(run.final, 2) }) : undefined } : null);
    const lo = Math.min(-5, ...run.T);
    const hi = Math.max(12, ...run.T);
    rig.tPlot.setY(Math.floor(lo * 1.1), Math.ceil(hi * 1.1));
  };

  const drawUpTo = (time: number) => {
    while (idx < run.t.length && run.t[idx] <= time + 1e-9) {
      rig.hPlot.push('h', run.t[idx], run.h[idx]);
      rig.hPlot.push('r', run.t[idx], TARGET);
      rig.tPlot.push('T', run.t[idx], run.T[idx]);
      idx++;
    }
    const i = Math.max(0, idx - 1);
    rig.view.update({ h: run.h[i], r: TARGET, thrust: run.T[i] });
  };

  const loop = new Loop((dt) => {
    playT = Math.min(RUN, playT + dt);
    drawUpTo(playT);
    if (playT >= RUN) loop.pause();
  }, host);

  const restart = (keepGhost = true) => {
    loop.pause();
    rig.hPlot.clear(keepGhost);
    rig.tPlot.clear(keepGhost);
    playT = 0;
    idx = 0;
    showMetrics();
    if (Loop.autoplay) {
      drawUpTo(0);
      loop.play();
    } else {
      // reduced motion: show the whole run at once
      playT = RUN;
      drawUpTo(RUN);
    }
  };

  let pending = 0;
  const setKp = (kp: number) => {
    run = runP(kp);
    window.clearTimeout(pending);
    pending = window.setTimeout(() => restart(), 60);
  };
  const sl = slider({
    label: t('slider'),
    min: 0,
    max: 60,
    step: 0.5,
    value: 20,
    unit: 'N/m',
    color: 'eff',
    hint: t('sliderHint'),
    onInput: setKp,
  });
  host.append(
    h('div', { class: 'w-controls' }, sl.el),
    h('div', { class: 'w-controls' }, transport({ loop, onReset: () => restart(false), onStep: () => ((playT = Math.min(RUN, playT + 0.1)), drawUpTo(playT)) })),
    status,
  );
  const off = ctx.bus.on('predict:ch2-kp5', () => {
    sl.value = 5;
    run = runP(5);
    restart();
  });
  const offMika = ctx.bus.on('ch2:kp', (v) => {
    sl.value = Number(v);
    run = runP(Number(v));
    restart();
  });
  restart(false);
  return () => {
    off();
    offMika();
    window.clearTimeout(pending);
    loop.destroy();
  };
};

/** A button in the story that sets the Kp slider above (Mika's Kp = 60). */
const mikaButton: WidgetFactory = (host, ctx) => {
  const b = h('button', { class: 'btn small', type: 'button' }, ctx.t('label'));
  b.addEventListener('click', () => {
    ctx.bus.emit('ch2:kp', 60);
    document.querySelector('[data-widget="pcontrol"]')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    // hand keyboard users over to the slider they just changed
    document.querySelector<HTMLInputElement>('[data-widget="pcontrol"] input[type="range"]')?.focus({ preventScroll: true });
  });
  host.append(h('div', { class: 'w-row', style: { justifyContent: 'center' } }, b));
};

/** The mini-challenge: find Kp with droop < 20 cm AND overshoot < 30 %. */
const challenge: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const b = challengeBounds();
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid two' });
  const a = h('div');
  const c = h('div');
  grid.append(a, c);
  host.append(grid);
  const xAxis = () => ({ label: t('kpAxis'), min: 0, max: 60 });
  const droopPlot = new Plot(a, {
    x: xAxis(),
    y: { label: t('droopAxis'), min: 0, max: 2.1 },
    series: [{ id: 'd', color: 'err', label: t('droopSeries') }],
    height: 190,
    label: t('droopAria'),
  });
  const overPlot = new Plot(c, {
    x: xAxis(),
    y: { label: t('overAxis'), min: 0, max: 100 },
    series: [{ id: 'o', color: 'out', label: t('overSeries') }],
    height: 190,
    label: t('overAria'),
  });
  droopPlot.fn('d', droopOf, 600);
  overPlot.fn('o', (k) => overshootOf(k), 600);
  const zone = 'sp@0.16';
  droopPlot.setBands([{ kind: 'v', from: b.droopNeedsAbove, to: 60, color: zone }]);
  overPlot.setBands([{ kind: 'v', from: LIFTOFF_KP, to: b.overshootNeedsBelow, color: zone }]);
  droopPlot.setLines([{ kind: 'h', at: 0.2, color: 'sp', label: t('droopLimit') }]);
  overPlot.setLines([{ kind: 'h', at: 30, color: 'sp', label: t('overLimit') }]);
  const rD = readout(t('readout.droop'), 'err');
  const rO = readout(t('readout.overshoot'), 'out');
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  let sawDroop = false;
  let sawOver = false;
  const update = (kp: number) => {
    const d = droopOf(kp);
    const o = overshootOf(kp);
    const dOk = d < 0.2;
    const oOk = Number.isFinite(o) && o < 30;
    sawDroop ||= dOk;
    sawOver ||= oOk;
    droopPlot.setMarkers([{ x: kp, y: d, color: 'err', label: `${fmt(d * 100, 0)} cm` }]);
    overPlot.setMarkers(Number.isFinite(o) ? [{ x: kp, y: o, color: 'out', label: `${fmt(o, 0)} %` }] : []);
    droopPlot.setCursor(kp);
    overPlot.setCursor(kp);
    rD.set(`${fmt(d * 100, 0)} cm`, dOk ? 'good' : 'bad');
    rO.set(Number.isFinite(o) ? `${fmt(o, 0)} %` : t('noflight'), oOk ? 'good' : 'bad');
    if (sawDroop && sawOver) {
      status.textContent = t('status.impossible', { a: fmt(b.droopNeedsAbove, 1), b: fmt(b.overshootNeedsBelow, 1) });
      status.className = 'w-status bad';
    } else if (dOk) status.textContent = t('status.droopOnly');
    else if (oOk) status.textContent = t('status.overOnly');
    else status.textContent = t('status.neither');
  };
  const sl = slider({ label: t('slider'), min: 1, max: 60, step: 0.5, value: 20, unit: 'N/m', color: 'eff', onInput: update });
  host.append(h('div', { class: 'w-controls' }, sl.el, h('div', { class: 'readouts' }, rD.el, rO.el)), status);
  host.append(h('p', { class: 'w-help' }, t('help')));
  update(20);
};

export const widgets: Record<string, WidgetFactory> = { pcontrol, challenge, 'mika-button': mikaButton };
