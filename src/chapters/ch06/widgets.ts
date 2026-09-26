import { h } from '../../core/dom';
import { fmt, tc } from '../../core/i18n';
import { tex } from '../../core/rich-text';
import { overshootFormula, secondOrderSolution } from '../../math/second-order';
import { DRONE, DroneSim, HOVER_THRUST, P_ONLY, defaultDroneConfig } from '../../sim/drone-model';
import { MassSpringDamper } from '../../sim/msd-model';
import type { WidgetFactory } from '../../story/types';
import { color, withAlpha } from '../../ui/colors';
import { readout, segmented, slider, transport } from '../../ui/controls';
import { DroneView } from '../../ui/drone-view';
import { Loop } from '../../ui/loop';
import { MsdView } from '../../ui/msd-view';
import { Plot } from '../../ui/plot';
import { SPlane } from '../../ui/s-plane';
import './ch06.css';
import {
  caption,
  clampToPlane,
  eqRow,
  fmtC,
  iconButton,
  mark,
  onInteractStart,
  planeLabel,
  regime,
  sample,
  secondOrderRoots,
  setIconLabel,
  settling,
  within,
} from './helpers';

const { m, c } = DRONE;
const RUN = 6;

/** The drone under P control (with hover thrust given for free) next to a mass on a spring. */
const twins: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let kp = 20;
  type Trace = { t: number[]; drone: number[]; thrust: number[]; spring: number[]; vel: number[] };
  /** Whole 6 s run for both systems, so a slider drag redraws instantly. */
  const compute = (): Trace => {
    const msd = new MassSpringDamper(m, c, kp, () => 0, -1, 0);
    const drone = new DroneSim(defaultDroneConfig({ pid: { ...P_ONLY(kp), ff: HOVER_THRUST }, h0: 1 }));
    const tr: Trace = { t: [0], drone: [drone.h - 2], thrust: [drone.thrust], spring: [msd.pos], vel: [msd.x[1]] };
    for (let i = 1; i <= RUN * 1000; i++) {
      msd.step();
      drone.step();
      if (i % 10 === 0) {
        tr.t.push(drone.t);
        tr.drone.push(drone.h - 2);
        tr.thrust.push(drone.thrust);
        tr.spring.push(msd.pos);
        tr.vel.push(msd.x[1]);
      }
    }
    return tr;
  };
  let tr = compute();
  const grid = h('div', { class: 'twins-grid' });
  const a = h('div');
  const b = h('div');
  const pl = h('div', { class: 'twins-plot' });
  grid.append(a, b, pl);
  host.append(h('p', { class: 'w-title' }, t('title')), grid);
  a.append(caption(t('spring')));
  const msdView = new MsdView(a, t('msdAria'), 60);
  msdView.el.style.maxWidth = '200px';
  // the two forces on the mass, so each term of the equation has a picture
  a.append(
    h(
      'p',
      { class: 'force-key' },
      h('span', null, h('span', { class: 'force-swatch spring', 'aria-hidden': 'true' }), t('forceSpring')),
      h('span', null, h('span', { class: 'force-swatch damper', 'aria-hidden': 'true' }), t('forceDamper')),
    ),
  );
  b.append(caption(t('drone')));
  const droneView = new DroneView(b, { hMax: 3, width: 230 });
  pl.append(caption(t('together')));
  const plot = new Plot(pl, {
    x: { label: tc('plots.time'), min: 0, max: RUN },
    y: { label: t('plotY'), min: -1.3, max: 1.3 },
    series: [
      { id: 'drone', color: 'out', label: t('drone'), ghost: true, width: 3.4 },
      { id: 'spring', color: 'ink', label: t('spring'), dash: [5, 5], width: 1.8 },
    ],
    height: 250,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 0, color: 'sp', label: t('target') }]);
  const eqSpring = h('div', { class: 'math-block' });
  const eqDrone = h('div', { class: 'math-block' });
  const zetaEq = h('div', { class: 'math-block', style: { marginTop: '0' } });
  const rZ = readout('ζ');
  const rW = readout('ωn');
  const rR = readout(t('personality'));
  const syncEq = () => {
    const z = c / (2 * Math.sqrt(m * kp));
    eqSpring.innerHTML = tex(`\\underbrace{m\\ddot{x} + c\\dot{x} + \\eff{k}\\,x = 0}_{\\text{${t('spring')}}}`, true);
    eqDrone.innerHTML = tex(`\\underbrace{m\\ddot{\\out{h}} + c\\dot{\\out{h}} + \\eff{K_p}(\\out{h} - \\sp{2}) = 0}_{\\text{${t('drone')}}}`, true);
    zetaEq.innerHTML = tex(`\\zeta = \\frac{c}{2\\sqrt{m\\,\\eff{K_p}}} = \\frac{${fmt(c, 1)}}{2\\sqrt{${fmt(m, 1)}\\cdot \\eff{${fmt(kp, 0)}}}} = ${fmt(z, 3)}`, true);
    rZ.set(fmt(z, 3));
    rW.set(`${fmt(Math.sqrt(kp / m), 2)} rad/s`);
    rR.set(tc(`regime.${regime(z)}`));
  };
  let playT = 0;
  /** Shows both systems at time `tt`; the curves are drawn up to the same moment. */
  const show = (tt: number) => {
    const n = Math.min(tr.t.length - 1, Math.round(tt / 0.01));
    msdView.update(tr.spring[n], 0);
    msdView.forces(-kp * tr.spring[n], -c * tr.vel[n]);
    droneView.update({ h: tr.drone[n] + 2, r: 2, thrust: tr.thrust[n] });
    plot.set('drone', tr.t.slice(0, n + 1), tr.drone.slice(0, n + 1));
    plot.set('spring', tr.t.slice(0, n + 1), tr.spring.slice(0, n + 1));
    plot.describe(t('describe', { d: fmt(tr.drone[n], 2), s: fmt(tr.spring[n], 2) }));
  };
  const loop = new Loop((dt) => {
    playT = Math.min(RUN, playT + dt);
    show(playT);
    if (playT >= RUN) loop.pause();
  }, host);
  // pressing Play at the end starts the run again from the beginning
  loop.onChange((on) => {
    if (on && playT >= RUN) playT = 0;
  });
  const reset = () => {
    loop.pause();
    playT = 0;
    if (Loop.autoplay) {
      show(0);
      loop.play();
    } else show(RUN);
  };
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
      tr = compute();
      syncEq();
      // while dragging, show the whole new run at once; release replays it
      loop.pause();
      playT = RUN;
      show(RUN);
    },
  });
  onInteractStart(sl.input, () => plot.clear(true));
  // replay after a pointer drag; keyboard steps stay still (no motion on key presses)
  let byPointer = false;
  sl.input.addEventListener('pointerdown', () => (byPointer = true));
  sl.input.addEventListener('keydown', () => (byPointer = false));
  sl.input.addEventListener('change', () => {
    if (byPointer) reset();
  });
  host.append(
    eqRow(eqSpring, eqDrone),
    zetaEq,
    h('div', { class: 'w-controls' }, sl.el),
    h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rZ.el, rW.el, rR.el), transport({ loop, onReset: reset, onStep: () => ((playT = Math.min(RUN, playT + 0.1)), show(playT)) })),
    h('p', { class: 'w-help' }, t('help')),
  );
  syncEq();
  reset();
  return () => loop.destroy();
};

/** ωn and ζ sliders driving a step response, the two s values, three regime panels and a spring. */
const personality: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
  let wn = 3;
  let zeta = 0.3;
  const T1 = 10;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const top = h('div', { class: 'w-grid side-r' });
  const plotCell = h('div');
  const planeCell = h('div');
  top.append(plotCell, planeCell);
  const bottom = h('div', { class: 'w-grid side-r' });
  const ctrlCell = h('div');
  const springCell = h('div', { class: 'spring-cell' });
  bottom.append(ctrlCell, springCell);
  host.append(top, bottom);
  const plot = new Plot(plotCell, {
    x: { label: tc('plots.time'), min: 0, max: T1 },
    y: { label: tc('plots.height'), min: 0, max: 2 },
    series: [{ id: 'y', color: 'out', label: t('response'), ghost: true }],
    height: 320,
    label: t('plotAria'),
  });
  plot.setLines([{ kind: 'h', at: 1, color: 'sp', label: t('target') }]);
  planeCell.append(caption(t('planeCap')));
  const plane = new SPlane(planeCell, { reMin: -10, reMax: 2, imMax: 6, label: t('planeAria'), reLabel: t('re'), imLabel: t('im'), maxWidth: 360 });
  plane.svg.style.overflow = 'hidden';
  const offLabel = planeLabel(plane, 'pt-note');
  springCell.append(caption(t('springCap')));
  const msd = new MsdView(springCell, t('msdAria'), 50);
  msd.el.style.maxWidth = '140px';
  const play = iconButton('play', t('playSpring'));
  springCell.append(play);
  const panels = h('div', { class: 'w-grid three', style: { marginTop: '18px' } });
  const panelZ = [0.2, 1, 2.5];
  const panelPlots = panelZ.map((z, i) => {
    const box = h('div', { class: 'panel', dataset: { regime: ['under', 'critical', 'over'][i] } });
    box.append(caption(t(`panel.${i}`, { z: fmt(z, 1) })));
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
  rRoots.el.style.flex = '2 1 9.5rem';
  const rWd = readout(t('wd'));
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
  loop.onChange((on) => {
    setIconLabel(play, on ? 'pause' : 'play', on ? t('stopSpring') : t('playSpring'));
    if (!on) plot.setCursor(null);
  });
  play.addEventListener('click', () => loop.toggle());
  const update = () => {
    const k = m * wn * wn;
    const cc = 2 * zeta * wn * m;
    resp = sample(secondOrderSolution(m, cc, k, k, 0, 0), T1, 500);
    plot.set('y', resp.xs, resp.ys);
    const roots = secondOrderRoots(wn, zeta);
    let off = '';
    plane.set(
      roots.map((r, i) => {
        const p = clampToPlane(plane, r.re, r.im);
        if (p.off) off = t('offMap', { v: fmtC(r, 1) });
        return { id: `r${i}`, re: p.re, im: p.im, kind: 'point' as const, color: 'output' };
      }),
    );
    offLabel(off, plane.o.reMin, 0, 6, -12, 'start');
    // every point on this circle has the same ωn
    plane.setCircle(wn, t('radius', { w: fmt(wn, 1) }));
    panelZ.forEach((z, i) => {
      const d = sample(secondOrderSolution(m, 2 * z * wn * m, k, k, 0, 0), T1, 300);
      panelPlots[i].p.set('y', d.xs, d.ys);
      panelPlots[i].box.classList.toggle('active', regime(zeta) === ['under', 'critical', 'over'][i]);
    });
    const ts = settling(resp.xs, resp.ys, 1, 1);
    rOS.set(`${fmt(zeta < 1 ? overshootFormula(zeta) : 0, 1)} %`);
    rTs.set(Number.isNaN(ts) ? t('never') : `${fmt(ts, 2)} s`);
    const rootsText = roots[0].im !== 0 ? `${fmt(roots[0].re, 2)} ± ${fmt(Math.abs(roots[0].im), 2)}i` : `${fmtC(roots[0])}, ${fmtC(roots[1])}`;
    rRoots.set(rootsText);
    // the wiggle is a little slower than ωn: ωd = ωn√(1 − ζ²)
    rWd.set(zeta < 1 ? `${fmt(wn * Math.sqrt(1 - zeta * zeta), 2)} rad/s` : t('noWiggle'));
    rReg.set(tc(`regime.${regime(zeta)}`));
    plot.describe(t('describe', { z: fmt(zeta, 2), w: fmt(wn, 1), r: rootsText }));
  };
  const sw = slider({ label: t('wn'), min: 0.5, max: 6, step: 0.1, value: wn, unit: 'rad/s', onInput: (v) => ((wn = v), update()) });
  const sz = slider({ label: t('zeta'), min: 0, max: 3, step: 0.01, value: zeta, onInput: (v) => ((zeta = v), update()) });
  onInteractStart(sw.input, () => plot.clear(true));
  onInteractStart(sz.input, () => plot.clear(true));
  ctrlCell.append(h('div', { class: 'w-controls', style: { marginTop: '4px' } }, sw.el, sz.el), h('div', { class: 'readouts', style: { marginTop: '14px' } }, rOS.el, rTs.el, rRoots.el, rWd.el, rReg.el));
  host.append(panels);
  update();
  if (Loop.autoplay) loop.play();
  return () => loop.destroy();
};

/** June's "more damping is safer": race ζ = 1 against a heavier damper (and a lighter one). */
const race: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  mark(host);
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
  const views = h('div', { class: 'pair-grid', style: { marginTop: '12px' } });
  const va = h('div');
  const vb = h('div');
  views.append(va, vb);
  va.append(caption(t('ref')));
  const labelB = caption('');
  vb.append(labelB);
  const msdA = new MsdView(va, t('msdAria'), 60);
  const msdB = new MsdView(vb, t('msdAria'), 60);
  msdA.el.style.maxWidth = msdB.el.style.maxWidth = '150px';
  right.append(caption(t('planeCap')));
  const plane = new SPlane(right, { reMin: -18, reMax: 2, imMax: 5, label: t('planeAria'), reLabel: t('re'), imLabel: t('im'), maxWidth: 420 });
  const slowLabel = planeLabel(plane);
  const fastLabel = planeLabel(plane);
  const rA = readout(t('settleRef'));
  const rB = readout(t('settleYours'));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite', style: { minHeight: '2.6em' } });
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
  const showEnd = () => {
    msdA.update(ref.ys[600] - 1, 0);
    msdB.update(yours.ys[600] - 1, 0);
  };
  const update = () => {
    plot.clear(true);
    const k = m * wn * wn;
    ref = sample(secondOrderSolution(m, 2 * wn * m, k, k, 0, 0), T1, 600);
    yours = sample(secondOrderSolution(m, 2 * zeta * wn * m, k, k, 0, 0), T1, 600);
    plot.set('ref', ref.xs, ref.ys);
    plot.set('y', yours.xs, yours.ys);
    labelB.textContent = t('yoursZ', { z: fmt(zeta, zeta < 1 ? 1 : 0) });
    // the sweet spot is judged on getting close (within 5%), so show that band for it
    plot.setBands(zeta < 1 ? [{ kind: 'h', from: 0.95, to: 1.05, color: withAlpha(color('good'), 0.14), label: t('band5') }] : []);
    const roots = secondOrderRoots(wn, zeta);
    plane.set(
      roots.map((r, i) => {
        const p = clampToPlane(plane, r.re, r.im);
        return { id: `r${i}`, re: p.re, im: p.im, kind: 'point' as const, color: 'output' };
      }),
    );
    if (zeta > 1) {
      // roots[0] is the slow one (closer to 0)
      slowLabel(t('slow'), roots[0].re, 0, -8, -12, 'end');
      const fast = clampToPlane(plane, roots[1].re, 0);
      fastLabel(fast.off ? t('fastOff', { v: fmt(roots[1].re, 1) }) : t('fast'), fast.re, 0, fast.off ? -4 : 0, -14, fast.off ? 'start' : 'middle');
    } else {
      // a double root at ζ = 1; a complex pair needs no label
      slowLabel(zeta === 1 ? t('double') : '', roots[0].re, 0, 0, -14);
      fastLabel('', 0, 0);
    }
    const sa = settling(ref.xs, ref.ys, 1, 1);
    const sb = settling(yours.xs, yours.ys, 1, 1);
    rA.set(`${fmt(sa, 2)} s`);
    rB.set(Number.isNaN(sb) ? t('never') : `${fmt(sb, 2)} s`, zeta <= 1 ? '' : sb > sa || Number.isNaN(sb) ? 'bad' : 'good');
    if (zeta < 1) {
      status.textContent = t('sweet', { os: fmt(overshootFormula(zeta), 1), y5: fmt(within(yours, 0.05), 2), r5: fmt(within(ref, 0.05), 2) });
    } else status.textContent = zeta === 1 ? t('same') : t('slower', { k: fmt((Number.isNaN(sb) ? T1 : sb) / sa, 1) });
    playT = 0;
    if (Loop.autoplay) loop.play();
    else showEnd();
  };
  const seg = segmented(
    t('choose'),
    ['0.7', '1', '3', '5'].map((v) => ({ value: v, label: `ζ = ${fmt(Number(v), v === '0.7' ? 1 : 0)}` })),
    '3',
    (v) => {
      zeta = Number(v);
      update();
    },
  );
  const replay = iconButton('play', t('replay'));
  replay.addEventListener('click', () => {
    playT = 0;
    loop.play();
  });
  left.append(views);
  right.append(h('div', { class: 'readouts', style: { marginTop: '12px' } }, rA.el, rB.el), status, replay);
  host.append(seg.el, h('div', { style: { height: '12px' } }), grid);
  update();
  return () => loop.destroy();
};

export const widgets: Record<string, WidgetFactory> = { twins, personality, race };
