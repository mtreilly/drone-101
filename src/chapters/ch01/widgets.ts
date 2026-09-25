import { h, prefersReducedMotion } from '../../core/dom';
import { fmt } from '../../core/i18n';
import { DRONE, DroneSim, HOVER_THRUST, defaultDroneConfig } from '../../sim/drone-model';
import { CH1_PID, GUST_N, GUST_S, PACKAGE_KG, theoTime } from './model';
import type { WidgetCtx, WidgetFactory } from '../../story/types';
import { readout, segmented, slider, transport } from '../../ui/controls';
import { Loop } from '../../ui/loop';
import { ALL_PARTS, CLOSED_PARTS, OPEN_PARTS, droneRig, loopDiagram, stepper, type LoopLabels } from './rig';

function pressed(btn: HTMLElement, on: boolean): void {
  btn.setAttribute('aria-pressed', String(on));
  btn.style.background = on ? 'var(--c-highlight)' : '';
}

function labels(t: WidgetCtx['t']): LoopLabels {
  return {
    setpoint: t('d.setpoint'),
    error: t('d.error'),
    controller: t('d.controller'),
    schedule: t('d.schedule'),
    thrust: t('d.thrust'),
    plant: t('d.plant'),
    disturbance: t('d.disturbance'),
    output: t('d.output'),
    sensor: t('d.sensor'),
    aria: t('d.aria'),
    description: t('d.description'),
  };
}

/** Disturbance state shared by the ch1 sims: gust window and package flag, read live by the model. */
function disturbances() {
  const d = { gustAt: -1, pkg: false, pkgAt: -1 };
  return {
    d,
    wind: (tt: number) => (d.gustAt >= 0 && tt >= d.gustAt && tt < d.gustAt + GUST_S ? GUST_N : 0),
    mass: (tt: number) => (d.pkg || (d.pkgAt >= 0 && tt >= d.pkgAt) ? PACKAGE_KG : 0),
  };
}

/** Open loop: program a thrust schedule, then see what the world does to it. */
const schedule: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const RUN = 20;
  let T1 = 7;
  let t1 = 0.5;
  const dist = disturbances();
  const makeSim = () =>
    new DroneSim(
      defaultDroneConfig({
        mode: 'open',
        openThrust: (tt) => (tt < t1 ? T1 : HOVER_THRUST),
        wind: dist.wind,
        extraMass: dist.mass,
      }),
    );
  let sim = makeSim();
  // flying out of the picture into the page: the page is a ceiling, and open loop can't notice it either
  let hitCeiling = false;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const rig = droneRig(host, {
    tMax: RUN,
    hMax: 3,
    thrustMin: 0,
    thrustMax: 9,
    heightLabel: t('plot.height'),
    thrustLabel: t('plot.thrust'),
    aria: t('plot.aria'),
    onCeiling: () => {
      hitCeiling = true;
      sim.hitCeiling();
    },
  });
  rig.hPlot.setLines([{ kind: 'h', at: 2, color: 'sp', label: t('plot.target') }]);
  // the programmed schedule, drawn faintly so you can see the plan before (and while) it runs
  rig.tPlot.overlay = (c, px, py) => {
    c.save();
    c.strokeStyle = getComputedStyle(host).getPropertyValue('--c-effort');
    c.globalAlpha = 0.45;
    c.lineWidth = 2;
    c.setLineDash([5, 4]);
    c.beginPath();
    c.moveTo(px(0), py(T1));
    c.lineTo(px(t1), py(T1));
    c.lineTo(px(t1), py(HOVER_THRUST));
    c.lineTo(px(RUN), py(HOVER_THRUST));
    c.stroke();
    c.restore();
  };
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' });
  const rH = readout(t('readout.height'), 'out');
  const rV = readout(t('readout.speed'));
  const rT = readout(t('readout.thrust'), 'eff');
  const sample = () => {
    rig.hPlot.push('h', sim.t, sim.h);
    rig.tPlot.push('T', sim.t, sim.thrust);
  };
  const adv = stepper(() => sim);
  const render = () => {
    rig.view.update({ h: sim.h, r: 2, thrust: sim.thrust, wind: sim.cfg.wind(sim.t), pkg: sim.cfg.extraMass(sim.t), crashed: sim.crashed });
    rH.set(`${fmt(sim.h, 2)} m`);
    rV.set(`${fmt(sim.v, 2)} m/s`);
    rT.set(`${fmt(sim.thrust, 2)} N`);
  };
  const loop = new Loop((dt) => {
    adv(dt, sample);
    render();
    if (sim.crashed) {
      loop.pause();
      status.textContent = t(hitCeiling ? 'status.ceiling' : 'status.crash');
      status.className = 'w-status bad';
    } else if (sim.t >= RUN) {
      loop.pause();
      const off = sim.h - 2;
      const good = Math.abs(off) < 0.05;
      status.textContent = good ? t('status.perfect', { h: fmt(sim.h, 2) }) : t('status.off', { h: fmt(sim.h, 2), d: fmt(Math.abs(off), 2), dir: off > 0 ? t('status.high') : t('status.low') });
      status.className = `w-status ${good ? 'good' : 'bad'}`;
      rig.hPlot.describe(status.textContent);
    }
  }, host);
  const reset = () => {
    loop.pause();
    dist.d.gustAt = -1;
    dist.d.pkg = false;
    pressed(pkgBtn, false);
    sim = makeSim();
    hitCeiling = false;
    rig.hPlot.clear();
    rig.tPlot.clear();
    rig.hPlot.set('r', [0, RUN], [2, 2]);
    status.textContent = t('status.ready', { h: fmt((T1 - HOVER_THRUST) * t1 / DRONE.c, 2) });
    status.className = 'w-status';
    sample();
    render();
    rig.tPlot.invalidate();
  };
  const launch = () => {
    reset();
    loop.play();
  };
  const slT = slider({ label: t('slider.thrust'), min: 5, max: 8, step: 0.05, value: T1, unit: 'N', color: 'eff', onInput: (v) => ((T1 = v), reset()) });
  const slt = slider({ label: t('slider.time'), min: 0, max: 4, step: 0.01, value: t1, unit: 's', onInput: (v) => ((t1 = v), reset()) });
  const launchBtn = h('button', { class: 'btn primary small', type: 'button' }, t('launch'));
  launchBtn.addEventListener('click', launch);
  const theoBtn = h('button', { class: 'btn small', type: 'button' }, t('theo'));
  theoBtn.addEventListener('click', () => {
    T1 = 6;
    t1 = Math.round(theoTime(6) * 100) / 100;
    slT.value = T1;
    slt.value = t1;
    launch();
  });
  const gustBtn = h('button', { class: 'btn small', type: 'button' }, t('gust'));
  gustBtn.addEventListener('click', () => {
    dist.d.gustAt = sim.t;
    if (!loop.playing && sim.t < RUN && !sim.crashed) loop.play();
  });
  const pkgBtn = h('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false' }, t('package'));
  pkgBtn.addEventListener('click', () => {
    dist.d.pkg = !dist.d.pkg;
    pressed(pkgBtn, dist.d.pkg);
    if (!loop.playing && sim.t < RUN && !sim.crashed) loop.play();
  });
  rig.right.append(h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rH.el, rV.el, rT.el)));
  host.append(
    h('div', { class: 'w-controls' }, slT.el, slt.el),
    h(
      'div',
      { class: 'w-hud' },
      h('div', { class: 'w-row' }, launchBtn, theoBtn),
      h('div', { class: 'w-row', role: 'group', 'aria-label': t('disturb') }, h('span', { class: 'w-help' }, t('disturb')), gustBtn, pkgBtn),
    ),
    h('div', { class: 'w-controls' }, transport({ loop, onReset: reset, onStep: () => (adv(0.1, sample), render()) })),
    status,
    h('p', { class: 'w-help' }, t('planHelp')),
  );
  reset();
  return () => loop.destroy();
};

/** Hovering drone: flip between a fixed thrust and "look at the height", with a live block diagram. */
const feedback: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const WINDOW = 15;
  let mode: 'open' | 'closed' = 'open';
  const dist = disturbances();
  const makeSim = () =>
    new DroneSim(
      defaultDroneConfig({
        mode,
        h0: 2,
        openThrust: () => HOVER_THRUST,
        pid: CH1_PID,
        wind: dist.wind,
        extraMass: dist.mass,
      }),
    );
  let sim = makeSim();
  host.append(h('p', { class: 'w-title' }, t('title')));
  const seg = segmented(
    t('mode'),
    [
      { value: 'open', label: t('open') },
      { value: 'closed', label: t('closed') },
    ],
    mode,
    (v) => {
      mode = v;
      sim.cfg.mode = v;
      syncDiagram();
      status.textContent = t(`status.${v}`);
      if (!loop.playing && !sim.crashed && Loop.autoplay) loop.play();
    },
  );
  host.append(seg.el);
  const rig = droneRig(host, {
    tMax: WINDOW,
    hMax: 3,
    thrustMin: 0,
    thrustMax: 22,
    heightLabel: t('plot.height'),
    thrustLabel: t('plot.thrust'),
    aria: t('plot.aria'),
    errorBand: true,
  });
  const diagramHost = h('div', { style: { marginTop: '16px', maxWidth: '720px', marginInline: 'auto' } });
  const diagram = loopDiagram(diagramHost, labels(t));
  const status = h('p', { class: 'w-status', 'aria-live': 'polite' }, t('status.open'));
  const rH = readout(t('readout.height'), 'out');
  const rE = readout(t('readout.error'), 'err');
  const rT = readout(t('readout.thrust'), 'eff');
  const trim = () => {
    for (const [p, id] of [
      [rig.hPlot, 'h'],
      [rig.hPlot, 'r'],
      [rig.tPlot, 'T'],
    ] as const) {
      const d = p.data(id);
      if (d.xs.length > 1200) p.set(id, d.xs.slice(-900), d.ys.slice(-900));
    }
  };
  const sample = () => {
    rig.hPlot.push('h', sim.t, sim.h);
    rig.hPlot.push('r', sim.t, 2);
    rig.tPlot.push('T', sim.t, sim.thrust);
  };
  const syncDiagram = () => {
    diagram.show(ALL_PARTS, false);
    diagram.show(mode === 'open' ? OPEN_PARTS : CLOSED_PARTS, true);
  };
  const lit: string[] = [];
  const render = () => {
    const w = sim.cfg.wind(sim.t);
    const pkg = sim.cfg.extraMass(sim.t);
    pressed(pkgBtn, pkg > 0);
    rig.view.update({ h: sim.h, r: 2, thrust: sim.thrust, wind: w, pkg, crashed: sim.crashed });
    rH.set(`${fmt(sim.h, 2)} m`);
    rE.set(`${fmt(2 - sim.h, 2)} m`);
    rT.set(`${fmt(sim.thrust, 2)} N`);
    const now: string[] = [];
    if (w !== 0 || pkg > 0) now.push('dist');
    if (mode === 'closed' && Math.abs(2 - sim.h) > 0.05) now.push('err', 'thrust');
    if (now.join() !== lit.join()) {
      lit.splice(0, lit.length, ...now);
      diagram.highlight(now);
    }
    if (sim.t > WINDOW) {
      rig.hPlot.setX(sim.t - WINDOW, sim.t);
      rig.tPlot.setX(sim.t - WINDOW, sim.t);
    }
  };
  const adv = stepper(() => sim);
  const loop = new Loop((dt) => {
    adv(dt, sample);
    trim();
    render();
    if (sim.crashed) {
      loop.pause();
      status.textContent = t('status.crash');
      status.className = 'w-status bad';
      rig.hPlot.describe(status.textContent);
    }
  }, host);
  const reset = () => {
    loop.pause();
    dist.d.gustAt = -1;
    dist.d.pkg = false;
    dist.d.pkgAt = -1;
    pressed(pkgBtn, false);
    sim = makeSim();
    rig.hPlot.clear();
    rig.tPlot.clear();
    rig.hPlot.setX(0, WINDOW);
    rig.tPlot.setX(0, WINDOW);
    status.textContent = t(`status.${mode}`);
    status.className = 'w-status';
    sample();
    render();
  };
  const gustBtn = h('button', { class: 'btn small', type: 'button' }, t('gust'));
  gustBtn.addEventListener('click', () => {
    dist.d.gustAt = sim.t;
    if (!loop.playing && !sim.crashed) loop.play();
  });
  const pkgBtn = h('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false' }, t('package'));
  pkgBtn.addEventListener('click', () => {
    dist.d.pkg = sim.cfg.extraMass(sim.t) === 0;
    dist.d.pkgAt = -1;
    pressed(pkgBtn, dist.d.pkg);
    if (!loop.playing && !sim.crashed) loop.play();
  });
  rig.right.append(h('div', { class: 'w-hud' }, h('div', { class: 'readouts' }, rH.el, rE.el, rT.el)));
  host.append(
    h(
      'div',
      { class: 'w-hud' },
      transport({ loop, onReset: reset, onStep: () => (adv(0.1, sample), render()) }),
      h('div', { class: 'w-row', role: 'group', 'aria-label': t('disturb') }, h('span', { class: 'w-help' }, t('disturb')), gustBtn, pkgBtn),
    ),
    status,
    diagramHost,
  );
  // predict-then-reveal: attach the package to the open-loop drone one second in
  const off = ctx.bus.on('predict:ch1-package', () => {
    mode = 'open';
    seg.set('open');
    reset();
    syncDiagram();
    status.textContent = t('status.predictRun');
    dist.d.pkgAt = 1;
    if (Loop.autoplay) loop.play();
    else {
      // reduced motion: jump straight to the outcome
      adv(5, sample);
      render();
      if (sim.crashed) status.textContent = t('status.crash');
    }
  });
  syncDiagram();
  reset();
  // a calm hover to start with: the loop only really runs while the widget is on screen
  if (Loop.autoplay) loop.play();
  return () => {
    off();
    loop.destroy();
  };
};

/** The whiteboard: the group draws the loop one piece at a time. */
const whiteboard: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  const steps: string[][] = [
    ['thrust', 'plant', 'out'],
    ['sp-open', 'ctrl-open', 'thrust', 'plant', 'out'],
    ['sp-open', 'ctrl-open', 'thrust', 'plant', 'out', 'dist'],
    ['sp-open', 'ctrl-open', 'thrust', 'plant', 'out', 'dist', 'fb1', 'sensor'],
    CLOSED_PARTS,
  ];
  const newParts: string[][] = [['thrust', 'plant', 'out'], ['sp-open', 'ctrl-open'], ['dist'], ['fb1', 'sensor'], ['sp', 'sum', 'err', 'ctrl', 'fb2']];
  let i = 0;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const box = h('div', { style: { maxWidth: '760px', margin: '0 auto' } });
  host.append(box);
  const diagram = loopDiagram(box, labels(t));
  const caption = h('p', { class: 'w-status wb-caption', 'aria-live': 'polite' });
  const counter = h('span', { class: 'w-help' });
  const back = h('button', { class: 'btn small', type: 'button' }, `← ${t('back')}`);
  const next = h('button', { class: 'btn primary small', type: 'button' }, `${t('next')} →`);
  // on narrow screens the diagram scrolls sideways: bring the newly drawn piece into view
  const revealNew = () => {
    const scroller = box.querySelector<HTMLElement>('.diagram-scroll');
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 1) return;
    const lit = [...scroller.querySelectorAll<SVGGElement>('.blk.lit')];
    if (!lit.length) return;
    const sr = scroller.getBoundingClientRect();
    const left = Math.min(...lit.map((g) => g.getBoundingClientRect().left)) - sr.left + scroller.scrollLeft;
    const right = Math.max(...lit.map((g) => g.getBoundingClientRect().right)) - sr.left + scroller.scrollLeft;
    scroller.scrollTo({ left: (left + right) / 2 - scroller.clientWidth / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const show = () => {
    diagram.show(ALL_PARTS, false);
    diagram.show(steps[i], true);
    diagram.highlight(newParts[i]);
    revealNew();
    caption.textContent = t(`step${i + 1}`);
    counter.textContent = t('counter', { n: i + 1, total: steps.length });
    back.disabled = i === 0;
    next.disabled = i === steps.length - 1;
  };
  back.addEventListener('click', () => {
    i = Math.max(0, i - 1);
    show();
  });
  next.addEventListener('click', () => {
    i = Math.min(steps.length - 1, i + 1);
    show();
  });
  host.append(caption, h('div', { class: 'w-row', style: { justifyContent: 'center', marginTop: '6px' } }, back, counter, next));
  requestAnimationFrame(show);
  show();
};

/** Same picture, different machine: cruise control. */
const cruise: WidgetFactory = (host, ctx) => {
  const { t } = ctx;
  host.append(h('p', { class: 'w-title' }, t('title')));
  const box = h('div', { style: { maxWidth: '760px', margin: '0 auto' } });
  host.append(box);
  const diagram = loopDiagram(box, labels(t));
  diagram.show(['sp-open', 'ctrl-open'], false);
};

export const widgets: Record<string, WidgetFactory> = { schedule, feedback, whiteboard, cruise };
