import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { tex } from '../../core/rich-text';
import { overshootFormula, secondOrderSolution } from '../../math/second-order';
import { DRONE, DroneSim, HOVER_THRUST, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import { MassSpringDamper } from '../../sim/msd-model';
import type { WidgetFactory } from '../../story/types';
import { readout, segmented, slider, transport } from '../../ui/controls';
import { DroneView } from '../../ui/drone-view';
import { Loop } from '../../ui/loop';
import { MsdView } from '../../ui/msd-view';
import { Plot } from '../../ui/plot';
import { SPlane } from '../../ui/s-plane';
import './ch06.css';
import { fmtC, keepCase, onInteractStart, regime, sample, secondOrderRoots, settling } from './helpers';

const { m, c } = DRONE;
const RUN = 6;

/** The drone under P control (with hover thrust given for free) next to a mass on a spring. */
const twins: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let kp = 20;
  const mkSims = () => ({
    msd: new MassSpringDamper(m, c, kp, () => 0, -1, 0),
    drone: new DroneSim(defaultDroneConfig({ pid: { ...P_ONLY(kp), ff: HOVER_THRUST }, h0: 1 })),
  });
  let sims = mkSims();
  const grid = h('div', { class: 'w-grid three' });
  const a = h('div');
  const b = h('div');
  const pl = h('div');
  grid.append(a, b, pl);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  a.append(h('p', { class: 'w-help', style: { textAlign: 'center' } }, t('spring')));
  const msdView = new MsdView(a, t('msdAria'), 60);
  b.append(h('p', { class: 'w-help', style: { textAlign: 'center' } }, t('drone')));
  const droneView = new DroneView(b, { hMax: 3, width: 220 });
  const plot = new Plot(pl, {
    x: { label: tc('plots.time'), min: 0, max: RUN },
    y: { label: t('plotY'), min: -1.3, max: 1.3 },
    series: [
      { id: 'drone', color: 'out', label: t('drone'), ghost: true, width: 3.4 },
      { id: 'spring', color: 'ink', label: t('spring'), dash: [5, 5], width: 1.8 },
    ],
    height: 260,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 0, color: 'sp', label: t('target') }]);
  const eq = h('div', { class: 'math-block' });
  const zetaEq = h('div', { class: 'math-block' });
  const rZ = readout('ζ');
  const rW = readout('ωn');
  const rR = readout(t('personality'));
  const syncEq = () => {
    const z = c / (2 * Math.sqrt(m * kp));
    eq.innerHTML = tex(
      `\\underbrace{m\\ddot{x} + c\\dot{x} + \\eff{k}\\,x = 0}_{\\text{${t('spring')}}} \\qquad \\underbrace{m\\ddot{\\out{h}} + c\\dot{\\out{h}} + \\eff{K_p}(\\out{h} - \\sp{2}) = 0}_{\\text{${t('drone')}}}`,
      true,
    );
    zetaEq.innerHTML = tex(`\\zeta = \\frac{c}{2\\sqrt{m\\,\\eff{K_p}}} = \\frac{${fmt(c, 1)}}{2\\sqrt{${fmt(m, 1)}\\cdot \\eff{${fmt(kp, 0)}}}} = ${fmt(z, 3)}`, true);
    rZ.set(fmt(z, 3));
    rW.set(`${fmt(Math.sqrt(kp / m), 2)} rad/s`);
    rR.set(t(`regime.${regime(z)}`));
  };
  const reset = () => {
    loop.pause();
    sims = mkSims();
    plot.clear();
    draw();
    if (Loop.autoplay) loop.play();
  };
  const draw = () => {
    msdView.update(sims.msd.pos, 0);
    droneView.update({ h: sims.drone.h, r: 2, thrust: sims.drone.thrust });
  };
  let acc = 0;
  const tick = (dt: number) => {
    const n = Math.round(dt / 0.001);
    for (let i = 0; i < n; i++) {
      sims.msd.step();
      sims.drone.step();
    }
    acc += dt;
    if (acc > 0.02) {
      acc = 0;
      plot.push('drone', sims.drone.t, sims.drone.h - 2);
      plot.push('spring', sims.msd.t, sims.msd.pos);
      plot.describe(t('describe', { d: fmt(sims.drone.h - 2, 2), s: fmt(sims.msd.pos, 2) }));
    }
    draw();
    if (sims.drone.t >= RUN) loop.pause();
  };
  const loop = new Loop(tick, host);
  const sl = slider({
    label: t('kp'),
    min: 2,
    max: 60,
    step: 1,
    value: kp,
    unit: 'N/m',
    color: 'eff',
    onInput: (v) => {
      kp = v;
      syncEq();
      reset();
    },
  });
  pl.append(h('div', { class: 'readouts' }, keepCase(rZ.el), keepCase(rW.el), rR.el));
  host.append(eq, zetaEq, h('div', { class: 'w-controls' }, sl.el), transport({ loop, onReset: reset, onStep: () => tick(0.1) }));
  host.append(h('p', { class: 'w-help' }, t('help')));
  syncEq();
  reset();
  return () => loop.destroy();
};

/** ωn and ζ sliders driving a step response, the two s values, three regime panels and a spring. */
const personality: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  let wn = 3;
  let zeta = 0.3;
  const T1 = 10;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid side-r' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  host.append(grid);
  const plot = new Plot(left, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: 0, max: 2 },
    series: [{ id: 'y', color: 'out', label: t('response'), ghost: true }],
    height: 250,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 1, color: 'sp', label: t('target') }]);
  const plane = new SPlane(right, { reMin: -10, reMax: 2, imMax: 6, label: t('planeAria'), reLabel: tc('splane.re'), imLabel: tc('splane.im') });
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('class', 'guide');
  const circleLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  circleLabel.setAttribute('class', 'guide-label');
  plane.deco.append(circle, circleLabel);
  const msd = new MsdView(right, t('msdAria'), 50);
  msd.el.style.maxWidth = '150px';
  const panels = h('div', { class: 'w-grid three' });
  const panelZ = [0.2, 1, 2.5];
  const panelPlots = panelZ.map((z, i) => {
    const box = h('div', { class: 'panel', dataset: { regime: ['under', 'critical', 'over'][i] } });
    box.append(h('p', { class: 'w-help', style: { textAlign: 'center', margin: 0 } }, t(`panel.${i}`, { z: fmt(z, 1) })));
    panels.append(box);
    const p = new Plot(box, {
      x: { label: tc('plots.time'), min: 0, max: T1 },
      y: { label: '', min: 0, max: 2 },
      series: [{ id: 'y', color: 'out' }],
      height: 120,
      label: t('panelAria', { z: fmt(z, 1) }),
      legend: false,
    });
    p.setLines([{ kind: 'h', at: 1, color: 'sp' }]);
    return { box, p };
  });
  const rOS = readout(t('overshoot'));
  const rTs = readout(t('settle'));
  const rRoots = readout(t('roots'));
  const rReg = readout(t('personality'));
  let resp = sample(() => 0, T1);
  let playT = 0;
  const loop = new Loop((dt) => {
    playT += dt;
    if (playT > T1) playT = 0;
    const i = Math.min(resp.ys.length - 1, Math.round((playT / T1) * (resp.ys.length - 1)));
    msd.update(resp.ys[i] - 1, 0);
    plot.setCursor(playT);
  }, host);
  const update = () => {
    const k = m * wn * wn;
    const cc = 2 * zeta * wn * m;
    const f = secondOrderSolution(m, cc, k, k, 0, 0);
    resp = sample(f, T1, 500);
    plot.set('y', resp.xs, resp.ys);
    const roots = secondOrderRoots(wn, zeta);
    plane.set(roots.map((r, i) => ({ id: `r${i}`, re: r.re, im: r.im, kind: 'point' as const, color: 'output' })));
    circle.setAttribute('cx', String(plane.sx(0)));
    circle.setAttribute('cy', String(plane.sy(0)));
    circle.setAttribute('r', String(plane.sx(wn) - plane.sx(0)));
    circleLabel.setAttribute('x', String(plane.sx(0) + 6));
    circleLabel.setAttribute('y', String(plane.sy(-wn) + 16));
    circleLabel.textContent = t('radius', { w: fmt(wn, 1) });
    panelZ.forEach((z, i) => {
      const d = sample(secondOrderSolution(m, 2 * z * wn * m, k, k, 0, 0), T1, 300);
      panelPlots[i].p.set('y', d.xs, d.ys);
      panelPlots[i].box.classList.toggle('active', regime(zeta) === ['under', 'critical', 'over'][i]);
    });
    const ts = settling(resp.xs, resp.ys, 1, 1);
    rOS.set(`${fmt(zeta < 1 ? overshootFormula(zeta) : 0, 1)} %`);
    rTs.set(Number.isNaN(ts) ? t('never') : `${fmt(ts, 2)} s`);
    rRoots.set(roots[0].im !== 0 ? `${fmt(roots[0].re, 2)} ± ${fmt(roots[0].im, 2)}i` : `${fmtC(roots[0])}, ${fmtC(roots[1])}`);
    rReg.set(t(`regime.${regime(zeta)}`));
    plot.describe(t('describe', { z: fmt(zeta, 2), w: fmt(wn, 1), r: rRoots.el.querySelector('.readout-val')!.textContent ?? '' }));
  };
  const sw = slider({ label: t('wn'), min: 0.5, max: 8, step: 0.1, value: wn, unit: 'rad/s', onInput: (v) => ((wn = v), update()) });
  const sz = slider({ label: t('zeta'), min: 0, max: 3, step: 0.01, value: zeta, onInput: (v) => ((zeta = v), update()) });
  onInteractStart(sw.input, () => plot.clear(true));
  onInteractStart(sz.input, () => plot.clear(true));
  left.append(h('div', { class: 'readouts' }, rOS.el, rTs.el, rRoots.el, rReg.el), h('div', { class: 'w-controls' }, sw.el, sz.el));
  host.append(panels);
  const play = h('button', { class: 'btn small', type: 'button' });
  const syncPlay = () => (play.textContent = loop.playing ? t('stopSpring') : t('playSpring'));
  play.addEventListener('click', () => loop.toggle());
  loop.onChange(syncPlay);
  syncPlay();
  right.append(play);
  update();
  if (Loop.autoplay) loop.play();
  return () => loop.destroy();
};

/** June's "more damping is safer": race ζ = 1 against a heavier damper. */
const race: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const wn = 3;
  const T1 = 12;
  let zeta = 3;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const grid = h('div', { class: 'w-grid side-r' });
  const left = h('div');
  const right = h('div');
  grid.append(left, right);
  const plot = new Plot(left, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: 0, max: 1.2 },
    series: [
      { id: 'ref', color: 'pencil', label: t('ref'), dash: [6, 4], width: 2 },
      { id: 'y', color: 'out', label: t('yours'), ghost: true },
    ],
    height: 240,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 1, color: 'sp' }]);
  const views = h('div', { class: 'w-grid two' });
  const va = h('div');
  const vb = h('div');
  views.append(va, vb);
  va.append(h('p', { class: 'w-help', style: { textAlign: 'center', margin: 0 } }, t('ref')));
  const labelB = h('p', { class: 'w-help', style: { textAlign: 'center', margin: 0 } });
  vb.append(labelB);
  const msdA = new MsdView(va, t('msdAria'), 60);
  const msdB = new MsdView(vb, t('msdAria'), 60);
  const plane = new SPlane(right, { reMin: -18, reMax: 2, imMax: 5, label: t('planeAria') });
  const rA = readout(t('settleRef'));
  const rB = readout(t('settleYours'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  let ref = sample(secondOrderSolution(m, 2 * wn * m, m * wn * wn, m * wn * wn, 0, 0), T1, 600);
  let yours = ref;
  let playT = 0;
  const loop = new Loop((dt) => {
    playT = Math.min(T1, playT + dt);
    const i = Math.round((playT / T1) * 600);
    msdA.update(ref.ys[i] - 1, 0);
    msdB.update(yours.ys[i] - 1, 0);
    plot.setCursor(playT);
    if (playT >= T1) loop.pause();
  }, host);
  const update = () => {
    plot.clear(true);
    const k = m * wn * wn;
    ref = sample(secondOrderSolution(m, 2 * wn * m, k, k, 0, 0), T1, 600);
    yours = sample(secondOrderSolution(m, 2 * zeta * wn * m, k, k, 0, 0), T1, 600);
    plot.set('ref', ref.xs, ref.ys);
    plot.set('y', yours.xs, yours.ys);
    labelB.textContent = t('yoursZ', { z: fmt(zeta, 0) });
    const roots = secondOrderRoots(wn, zeta);
    plane.set(
      roots.map((r, i) => ({
        id: `r${i}`,
        re: r.re,
        im: r.im,
        kind: 'point' as const,
        color: 'output',
        label: zeta > 1 ? (i === 0 ? t('slow') : t('fast')) : undefined,
      })),
    );
    const sa = settling(ref.xs, ref.ys, 1, 1);
    const sb = settling(yours.xs, yours.ys, 1, 1);
    rA.set(`${fmt(sa, 2)} s`);
    rB.set(Number.isNaN(sb) ? t('never') : `${fmt(sb, 2)} s`, sb > sa || Number.isNaN(sb) ? 'bad' : 'good');
    status.textContent = zeta === 1 ? t('same') : t('slower', { k: fmt((Number.isNaN(sb) ? T1 : sb) / sa, 1) });
    playT = 0;
    if (Loop.autoplay) loop.play();
  };
  const seg = segmented(
    t('choose'),
    ['1', '3', '5'].map((v) => ({ value: v, label: `ζ = ${v}` })),
    '3',
    (v) => {
      zeta = Number(v);
      update();
    },
  );
  left.append(views);
  right.append(h('div', { class: 'readouts' }, rA.el, rB.el), status);
  host.append(seg.el, grid);
  const replay = h('button', { class: 'btn small', type: 'button' }, t('replay'));
  replay.addEventListener('click', () => {
    playT = 0;
    loop.play();
  });
  host.append(replay);
  update();
  return () => loop.destroy();
};

export const widgets: Record<string, WidgetFactory> = { twins, personality, race };
